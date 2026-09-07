import json
import hashlib
from io import BytesIO
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import AuditLog, ConversationPreference, Customer, Message, MessageAttachment, Order

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
UPLOAD_DIR = Path("local_uploads/messages")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".aac", ".ai", ".cdr", ".eps", ".jpeg", ".jpg", ".m4a", ".mp3", ".ogg",
    ".opus", ".pdf", ".png", ".psd", ".rar", ".svg", ".tif", ".tiff", ".wav",
    ".webp", ".zip", ".mp4", ".mov", ".webm",
}
MAX_FILES_PER_MESSAGE = 100

try:
    from PIL import Image
except ImportError:  # Thumbnail generation is optional in minimal API environments.
    Image = None


class MessageConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[WebSocket, str] = {}
        self.last_seen: dict[str, str] = {}

    async def connect(self, websocket: WebSocket, role: str) -> None:
        await websocket.accept()
        self.connections[websocket] = role
        await self.broadcast_presence(role)

    async def disconnect(self, websocket: WebSocket) -> None:
        role = self.connections.pop(websocket, None)
        if role:
            self.last_seen[role] = datetime.utcnow().isoformat()
            await self.broadcast_presence(role)

    async def broadcast(self, event: dict, exclude: WebSocket | None = None) -> None:
        stale: list[WebSocket] = []
        for socket in list(self.connections):
            if socket is exclude:
                continue
            try:
                await socket.send_json(event)
            except Exception:
                stale.append(socket)
        for socket in stale:
            self.connections.pop(socket, None)

    async def broadcast_presence(self, role: str) -> None:
        online = any(connection_role == role for connection_role in self.connections.values())
        await self.broadcast({
            "type": "presence.updated",
            "role": role,
            "online": online,
            "last_seen": None if online else self.last_seen.get(role),
        })


manager = MessageConnectionManager()


def payload_to_int(value: object) -> int | None:
    try:
        return int(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


def serialize_message(message: Message) -> dict:
    attachments = [
        {
            "id": attachment.id,
            "url": f"/api/messages/uploads/{attachment.stored_filename}",
            "thumbnail_url": attachment.thumbnail_path,
            "original_filename": attachment.original_filename,
            "mime_type": attachment.mime_type,
            "extension": attachment.extension,
            "size_bytes": attachment.size_bytes,
            "width": attachment.width,
            "height": attachment.height,
            "duration_seconds": attachment.duration_seconds,
            "checksum": attachment.checksum,
            "uploaded_by": attachment.uploaded_by,
            "uploaded_at": attachment.uploaded_at.isoformat(),
        }
        for attachment in message.attachments
        if attachment.deleted_at is None
    ]
    if not attachments and message.attachment_url and not message.deleted_at:
        attachments.append({
            "id": f"legacy-{message.id}",
            "url": message.attachment_url,
            "thumbnail_url": None,
            "original_filename": message.attachment_name or "Attachment",
            "mime_type": message.attachment_type or "application/octet-stream",
            "extension": Path(message.attachment_name or "").suffix.lower(),
            "size_bytes": None,
            "width": None,
            "height": None,
            "duration_seconds": None,
            "checksum": None,
            "uploaded_by": message.sender_type,
            "uploaded_at": message.created_at.isoformat(),
        })
    return {
        "id": message.id,
        "customer_id": message.customer_id,
        "order_id": message.order_id,
        "sender_type": message.sender_type,
        "sender_user_id": message.sender_user_id,
        "message_type": message.message_type,
        "client_message_id": message.client_message_id,
        "body": message.body,
        "created_at": message.created_at.isoformat(),
        "updated_at": message.updated_at.isoformat() if message.updated_at else None,
        "edited_at": message.edited_at.isoformat() if message.edited_at else None,
        "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "status": message.status,
        "reply_to_message_id": message.reply_to_message_id,
        "reply_to_body": message.reply_to_body,
        "reply_to_sender_type": message.reply_to_sender_type,
        "attachment_url": message.attachment_url,
        "attachment_name": message.attachment_name,
        "attachment_type": message.attachment_type,
        "attachments": attachments,
        "deleted_at": message.deleted_at.isoformat() if message.deleted_at else None,
        "hidden_for_customer": bool(message.hidden_for_customer),
        "hidden_for_staff": bool(message.hidden_for_staff),
        "is_pinned": bool(message.is_pinned),
        "is_starred": bool(message.is_starred),
        "reaction": message.reaction,
        "note_text": message.note_text,
    }


def create_thumbnail(content: bytes, stored_filename: str, mime_type: str) -> tuple[str | None, int | None, int | None]:
    if Image is None or not mime_type.startswith("image/") or mime_type == "image/svg+xml":
        return None, None, None
    try:
        with Image.open(BytesIO(content)) as source:
            width, height = source.size
            preview = source.copy()
            preview.thumbnail((480, 480))
            if preview.mode not in {"RGB", "L"}:
                background = Image.new("RGB", preview.size, "white")
                if "A" in preview.getbands():
                    background.paste(preview, mask=preview.getchannel("A"))
                else:
                    background.paste(preview)
                preview = background
            thumbnail_name = f"{Path(stored_filename).stem}-thumb.jpg"
            preview.convert("RGB").save(UPLOAD_DIR / thumbnail_name, "JPEG", quality=82, optimize=True)
            return f"/api/messages/uploads/{thumbnail_name}", width, height
    except Exception:
        return None, None, None


def add_audit(db: Session, actor: str, action: str, message_id: int) -> None:
    db.add(AuditLog(actor=actor, action=action, entity_type="message", entity_id=str(message_id)))


def get_preference(db: Session, viewer_type: str) -> ConversationPreference:
    viewer = viewer_type.lower()
    if viewer not in {"customer", "staff"}:
        raise HTTPException(status_code=400, detail="Invalid viewer type")
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    if customer is None:
        raise HTTPException(status_code=409, detail="No customer account is available")
    preference = db.scalar(select(ConversationPreference).where(
        ConversationPreference.customer_id == customer.id,
        ConversationPreference.viewer_type == viewer,
    ))
    if preference is None:
        preference = ConversationPreference(customer_id=customer.id, viewer_type=viewer)
        db.add(preference)
        db.commit()
        db.refresh(preference)
    return preference


def serialize_preference(preference: ConversationPreference) -> dict:
    return {
        "is_archived": bool(preference.is_archived),
        "is_pinned": bool(preference.is_pinned),
        "muted_until": preference.muted_until.isoformat() if preference.muted_until else None,
        "marked_unread": bool(preference.marked_unread),
    }


@router.websocket("/ws")
async def message_socket(websocket: WebSocket) -> None:
    role = websocket.query_params.get("role", "customer").lower()
    if role not in {"customer", "staff"}:
        await websocket.close(code=1008)
        return
    await manager.connect(websocket, role)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if event.get("type") in {
                "typing.started", "typing.stopped", "recording.started", "recording.stopped"
            }:
                await manager.broadcast({"type": event["type"], "role": role}, exclude=websocket)
            elif event.get("type") == "presence.requested":
                other_role = "staff" if role == "customer" else "customer"
                await manager.broadcast_presence(other_role)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@router.get("")
def list_messages(db: DbSession, viewer_type: str = "customer", limit: int = 100) -> list[dict]:
    viewer = viewer_type.lower()
    if viewer not in {"customer", "staff"}:
        raise HTTPException(status_code=400, detail="Invalid viewer type")
    safe_limit = min(max(limit, 1), 200)
    messages = db.scalars(select(Message).order_by(Message.created_at.desc()).limit(safe_limit)).all()
    messages.reverse()
    hidden_field = "hidden_for_customer" if viewer == "customer" else "hidden_for_staff"
    return [serialize_message(message) for message in messages if not getattr(message, hidden_field)]


@router.get("/search")
def search_messages(
    db: DbSession,
    q: str = "",
    viewer_type: str = "staff",
    date: str | None = None,
    limit: int = 50,
) -> list[dict]:
    viewer = viewer_type.lower()
    if viewer not in {"customer", "staff"}:
        raise HTTPException(status_code=400, detail="Invalid viewer type")
    query = q.strip()[:200]
    if not query and not date:
        raise HTTPException(status_code=422, detail="Enter a search term or select a date")

    hidden_column = Message.hidden_for_customer if viewer == "customer" else Message.hidden_for_staff
    conditions = [hidden_column.is_(False)]
    if query:
        pattern = f"%{query.lower()}%"
        conditions.append(or_(
            func.lower(Message.body).like(pattern),
            func.lower(Message.reply_to_body).like(pattern),
            func.lower(Message.attachment_name).like(pattern),
            func.lower(MessageAttachment.original_filename).like(pattern),
            func.lower(Customer.business_name).like(pattern),
            func.lower(Customer.public_id).like(pattern),
        ))
    if date:
        try:
            local_start = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
        except ValueError:
            raise HTTPException(status_code=422, detail="Date must use YYYY-MM-DD format") from None
        utc_start = local_start.astimezone(timezone.utc).replace(tzinfo=None)
        utc_end = (local_start + timedelta(days=1)).astimezone(timezone.utc).replace(tzinfo=None)
        conditions.extend((Message.created_at >= utc_start, Message.created_at < utc_end))

    safe_limit = min(max(limit, 1), 200)
    statement = (
        select(Message, Customer)
        .join(Customer, Customer.id == Message.customer_id)
        .outerjoin(
            MessageAttachment,
            and_(MessageAttachment.message_id == Message.id, MessageAttachment.deleted_at.is_(None)),
        )
        .where(*conditions)
        .distinct()
        .order_by(Message.created_at.desc())
        .limit(safe_limit)
    )
    rows = db.execute(statement).all()
    return [
        {
            "message": serialize_message(message),
            "customer_name": customer.business_name,
            "customer_public_id": customer.public_id,
            "matched_attachment": next(
                (
                    attachment.original_filename
                    for attachment in message.attachments
                    if query and query.lower() in attachment.original_filename.lower()
                ),
                None,
            ),
        }
        for message, customer in rows
    ]


@router.get("/preference")
def read_conversation_preference(db: DbSession, viewer_type: str = "staff") -> dict:
    return serialize_preference(get_preference(db, viewer_type))


@router.patch("/preference")
async def update_conversation_preference(payload: dict, db: DbSession) -> dict:
    viewer = str(payload.get("viewer_type", "staff")).lower()
    preference = get_preference(db, viewer)
    action = str(payload.get("action", "")).lower()
    if action == "archive":
        preference.is_archived = not preference.is_archived
    elif action == "pin":
        preference.is_pinned = not preference.is_pinned
    elif action == "mark_unread":
        preference.marked_unread = True
    elif action == "mark_read":
        preference.marked_unread = False
    elif action == "mute":
        duration = str(payload.get("duration", "always"))
        if duration == "8_hours":
            preference.muted_until = datetime.utcnow() + timedelta(hours=8)
        elif duration == "1_week":
            preference.muted_until = datetime.utcnow() + timedelta(days=7)
        elif duration == "always":
            preference.muted_until = datetime(9999, 12, 31)
        elif duration == "off":
            preference.muted_until = None
        else:
            raise HTTPException(status_code=400, detail="Invalid mute duration")
    else:
        raise HTTPException(status_code=400, detail="Unsupported conversation action")
    preference.updated_at = datetime.utcnow()
    db.add(AuditLog(actor=viewer, action=f"conversation.{action}", entity_type="conversation", entity_id=str(preference.customer_id)))
    db.commit()
    db.refresh(preference)
    serialized = serialize_preference(preference)
    await manager.broadcast({"type": "conversation.updated", "viewer_type": viewer, "preference": serialized})
    return serialized


@router.post("")
async def send_message(payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    client_message_id = str(payload.get("client_message_id") or uuid4().hex)[:80]
    existing = db.scalar(select(Message).where(Message.client_message_id == client_message_id))
    if existing:
        return {"status": existing.status, "id": existing.id, "duplicate": True, "message": serialize_message(existing)}
    if customer is None:
        raise HTTPException(status_code=409, detail="No customer account is available")
    body = str(payload.get("body", "")).strip()
    if not body:
        raise HTTPException(status_code=422, detail="Message text is required")
    sender_type = str(payload.get("sender_type", "customer")).lower()
    message = Message(
        customer_id=customer.id,
        order_id=order.id if order else None,
        sender_type=sender_type,
        sender_user_id=str(payload.get("sender_user_id") or sender_type)[:80],
        message_type="text",
        client_message_id=client_message_id,
        body=body[:10000],
        delivered_at=datetime.utcnow(),
        status="delivered",
        reply_to_message_id=payload_to_int(payload.get("reply_to_message_id")),
        reply_to_body=str(payload.get("reply_to_body") or "")[:1000] or None,
        reply_to_sender_type=str(payload.get("reply_to_sender_type") or "")[:20] or None,
    )
    db.add(message)
    db.flush()
    add_audit(db, sender_type, "message.created", message.id)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message)
    await manager.broadcast({"type": "message.created", "message": serialized})
    return {"status": "delivered", "id": message.id, "audit": "recorded", "message": serialized}


@router.post("/with-attachment")
async def send_message_with_attachment(
    db: DbSession,
    sender_type: str = Form("customer"),
    body: str = Form(""),
    order_id: str | None = Form(None),
    client_message_id: str | None = Form(None),
    reply_to_message_id: str | None = Form(None),
    reply_to_body: str | None = Form(None),
    reply_to_sender_type: str | None = Form(None),
    attachment_durations: str | None = Form(None),
    attachments: list[UploadFile] | None = File(None),
    attachment: UploadFile | None = File(None),
) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    order = db.scalar(select(Order).where(Order.public_id == order_id)) if order_id else None
    safe_client_id = str(client_message_id or uuid4().hex)[:80]
    existing = db.scalar(select(Message).where(Message.client_message_id == safe_client_id))
    if existing:
        return {"status": existing.status, "id": existing.id, "duplicate": True, "message": serialize_message(existing)}
    if customer is None:
        raise HTTPException(status_code=409, detail="No customer account is available")
    incoming_files = [item for item in (attachments or []) if item.filename]
    if attachment and attachment.filename:
        incoming_files.append(attachment)
    if not incoming_files:
        raise HTTPException(status_code=422, detail="Attachment is required")
    if len(incoming_files) > MAX_FILES_PER_MESSAGE:
        raise HTTPException(status_code=422, detail=f"A message can contain up to {MAX_FILES_PER_MESSAGE} files")
    try:
        raw_durations = json.loads(attachment_durations) if attachment_durations else []
        if not isinstance(raw_durations, list):
            raise ValueError
        durations = [max(0, min(int(value), 86400)) if value is not None else None for value in raw_durations]
    except (TypeError, ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=422, detail="Attachment durations must be a JSON array") from None

    prepared_files: list[dict] = []
    stored_paths: list[Path] = []
    try:
        for index, incoming in enumerate(incoming_files):
            extension = Path(incoming.filename or "").suffix.lower()
            if extension not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=415, detail=f"{extension or 'This file type'} is not allowed")
            content = await incoming.read(MAX_UPLOAD_BYTES + 1)
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail=f"{incoming.filename} exceeds the 100 MB limit")
            stored_filename = f"{uuid4().hex}{extension}"
            stored_path = UPLOAD_DIR / stored_filename
            stored_path.write_bytes(content)
            stored_paths.append(stored_path)
            mime_type = incoming.content_type or "application/octet-stream"
            thumbnail_url, width, height = create_thumbnail(content, stored_filename, mime_type)
            if thumbnail_url:
                stored_paths.append(UPLOAD_DIR / Path(thumbnail_url).name)
            prepared_files.append({
                "original_filename": Path(incoming.filename or "Attachment").name[:255],
                "stored_filename": stored_filename,
                "mime_type": mime_type[:120],
                "extension": extension[:20],
                "size_bytes": len(content),
                "width": width,
                "height": height,
                "duration_seconds": durations[index] if index < len(durations) else None,
                "checksum": hashlib.sha256(content).hexdigest(),
                "storage_path": str(stored_path),
                "thumbnail_path": thumbnail_url,
            })
    except Exception:
        for stored_path in stored_paths:
            stored_path.unlink(missing_ok=True)
        raise

    kinds = {
        "image" if item["mime_type"].startswith("image/")
        else "video" if item["mime_type"].startswith("video/")
        else "audio" if item["mime_type"].startswith("audio/")
        else "document"
        for item in prepared_files
    }
    message_type = kinds.pop() if len(kinds) == 1 else "mixed"
    sender_role = sender_type.lower()
    message = Message(
        customer_id=customer.id,
        order_id=order.id if order else None,
        sender_type=sender_role,
        sender_user_id=sender_role,
        message_type=message_type,
        client_message_id=safe_client_id,
        body=body.strip()[:10000],
        delivered_at=datetime.utcnow(),
        status="delivered",
        reply_to_message_id=payload_to_int(reply_to_message_id),
        reply_to_body=(reply_to_body or "")[:1000] or None,
        reply_to_sender_type=(reply_to_sender_type or "")[:20] or None,
        attachment_url=f"/api/messages/uploads/{prepared_files[0]['stored_filename']}",
        attachment_name=prepared_files[0]["original_filename"],
        attachment_type=prepared_files[0]["mime_type"],
    )
    db.add(message)
    db.flush()
    for item in prepared_files:
        db.add(MessageAttachment(
            message_id=message.id,
            uploaded_by=sender_role,
            **item,
        ))
    add_audit(db, sender_role, "message.created", message.id)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message)
    await manager.broadcast({"type": "message.created", "message": serialized})
    return {"status": "delivered", "id": message.id, "audit": "recorded", "message": serialized}


@router.post("/read")
async def mark_messages_read(payload: dict, db: DbSession) -> dict:
    reader_type = str(payload.get("reader_type", "")).lower()
    if reader_type not in {"customer", "staff"}:
        raise HTTPException(status_code=400, detail="Invalid reader type")
    unread_messages = db.scalars(select(Message).where(Message.sender_type != reader_type, Message.read_at.is_(None))).all()
    read_at = datetime.utcnow()
    ids: list[int] = []
    for message in unread_messages:
        message.read_at = read_at
        message.status = "read"
        ids.append(message.id)
    db.commit()
    if ids:
        await manager.broadcast({"type": "messages.read", "message_ids": ids, "read_at": read_at.isoformat(), "reader_type": reader_type})
    return {"status": "read", "count": len(ids), "read_at": read_at.isoformat()}


@router.patch("/{message_id}")
async def update_message_action(message_id: int, payload: dict, db: DbSession) -> dict:
    message = db.get(Message, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    action = str(payload.get("action", "")).lower()
    actor = str(payload.get("actor", "staff")).lower()
    now = datetime.utcnow()
    if action == "delete_for_everyone":
        message.deleted_at = now
        message.body = "This message was deleted"
        message.attachment_url = None
        message.attachment_name = None
        message.attachment_type = None
        message.reaction = None
        for attachment_row in message.attachments:
            attachment_row.deleted_at = now
    elif action == "delete_for_me":
        if actor == "customer":
            message.hidden_for_customer = True
        elif actor == "staff":
            message.hidden_for_staff = True
        else:
            raise HTTPException(status_code=400, detail="Invalid actor")
    elif action == "edit":
        body = str(payload.get("body", "")).strip()
        if actor != message.sender_type:
            raise HTTPException(status_code=403, detail="Only the sender can edit this message")
        if message.deleted_at:
            raise HTTPException(status_code=409, detail="Deleted messages cannot be edited")
        if now - message.created_at > timedelta(minutes=15):
            raise HTTPException(status_code=409, detail="The 15 minute edit window has expired")
        if not body:
            raise HTTPException(status_code=422, detail="Message text is required")
        message.body = body[:10000]
        message.edited_at = now
    elif action == "pin":
        message.is_pinned = not message.is_pinned
    elif action == "star":
        message.is_starred = not message.is_starred
    elif action == "react":
        message.reaction = str(payload.get("reaction") or "")[:20] or None
    elif action == "note":
        message.note_text = str(payload.get("note_text", message.body))[:1000]
    else:
        raise HTTPException(status_code=400, detail="Unsupported message action")
    message.updated_at = now
    add_audit(db, actor, f"message.{action}", message.id)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message)
    await manager.broadcast({"type": "message.updated", "message": serialized})
    return {"status": "updated", "id": message_id, "action": action, "message": serialized}
