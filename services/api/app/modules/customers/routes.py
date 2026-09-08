import re
from datetime import datetime
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.integrations.erp_adapter import ErpConnectionError, erp_adapter
from services.api.app.models import AuditLog, Customer

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
PROFILE_UPLOAD_DIR = Path("local_uploads/customer-profiles")
PROFILE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DISTRICT_SHORT_CODES = {
    "CHENNAI": "CHN",
    "CHENGALPATTU": "CGL",
    "COIMBATORE": "CBE",
    "CUDDALORE": "CUD",
    "DHARMAPURI": "DPI",
    "DINDIGUL": "DGL",
    "ERODE": "ERD",
    "KANCHIPURAM": "KPM",
    "KARUR": "KRR",
    "KRISHNAGIRI": "KGI",
    "MADURAI": "MDU",
    "MAYILADUTHURAI": "MYL",
    "NAGAPATTINAM": "NGT",
    "NAMAKKAL": "NMK",
    "NILGIRIS": "NLG",
    "PERAMBALUR": "PBL",
    "PUDUKKOTTAI": "PDK",
    "RAMANATHAPURAM": "RMD",
    "RANIPET": "RPT",
    "SALEM": "SLM",
    "SIVAGANGA": "SVG",
    "TENKASI": "TKS",
    "THANJAVUR": "TNJ",
    "THENI": "THN",
    "THOOTHUKKUDI": "TUT",
    "TIRUCHIRAPPALLI": "TRY",
    "TIRUNELVELI": "TVL",
    "TIRUPATHUR": "TPT",
    "TIRUPPUR": "TUP",
    "TIRUVALLUR": "TVD",
    "TIRUVANNAMALAI": "TVM",
    "TIRUVARUR": "TVR",
    "VELLORE": "VLR",
    "VILLUPURAM": "VPM",
    "VIRUDHUNAGAR": "VNR",
}


def short_code(value: str | None) -> str:
    letters = re.sub(r"[^A-Za-z0-9]", "", value or "").upper()
    return (letters[:3] or "XXX").ljust(3, "X")


def district_code(value: str | None) -> str:
    normalized = re.sub(r"[^A-Za-z]", "", value or "").upper()
    return DISTRICT_SHORT_CODES.get(normalized, short_code(value))


def delivery_code(customer: Customer) -> str:
    serial_match = re.search(r"(\d{4})$", customer.public_id)
    serial = serial_match.group(1) if serial_match else str(customer.id).zfill(4)
    address = customer.billing_address or {}
    prefix = "LC" if customer.delivery_type == "local" else "CO"
    return f"{prefix}-{serial}-{short_code(customer.business_name)}-{district_code(address.get('district'))}"


def serialize_customer(customer: Customer) -> dict:
    return {
        "id": customer.public_id,
        "contact_name": customer.contact_name,
        "business_name": customer.business_name,
        "mobile": customer.mobile,
        "email": customer.email,
        "profile_image_url": customer.profile_image_url,
        "gst_number": customer.gst_number,
        "delivery_type": customer.delivery_type,
        "preferred_courier": customer.preferred_courier,
        "billing_address": customer.billing_address,
        "profile_locked": customer.profile_locked,
        "erp_customer_id": customer.erp_customer_id,
        "erp_sync_status": customer.erp_sync_status,
        "erp_sync_error": customer.erp_sync_error,
        "erp_synced_at": customer.erp_synced_at.isoformat() if customer.erp_synced_at else None,
        "delivery_code": delivery_code(customer),
        "level": customer.level,
        "account_manager": customer.account_manager,
        "security_note": customer.security_note,
    }


def erp_customer_payload(customer: Customer) -> dict:
    address = customer.billing_address or {}
    preferred_courier = (customer.preferred_courier or "ST").strip()
    supported_couriers = {"ST", "PROFESSIONAL", "DTDC", "BUS", "TRAIN"}
    erp_courier = preferred_courier.upper() if preferred_courier.upper() in supported_couriers else "OTHER TRANSPORT"
    line1 = " ".join(part for part in (address.get("door_no"), address.get("street_name")) if part)
    return {
        "code": delivery_code(customer),
        "name": customer.contact_name or customer.business_name,
        "phone": customer.mobile,
        "business_name": customer.business_name,
        "whatsapp_number": customer.mobile,
        "delivery_type": "Local" if customer.delivery_type == "local" else "Courier",
        "preferred_courier": erp_courier,
        "other_transport_name": preferred_courier if erp_courier == "OTHER TRANSPORT" else "",
        "preferred_rate": 0,
        "email": customer.email,
        "gst_number": customer.gst_number or "",
        "billing_address": {
            "line1": line1,
            "line2": address.get("landmark", ""),
            "city": address.get("village_city", ""),
            "landmark": address.get("landmark", ""),
            "district": address.get("district", ""),
            "state": address.get("state", ""),
            "postal_code": address.get("pincode", ""),
            "country": "India",
        },
        "shipping_address": {
            "line1": line1,
            "line2": address.get("landmark", ""),
            "city": address.get("village_city", ""),
            "landmark": address.get("landmark", ""),
            "district": address.get("district", ""),
            "state": address.get("state", ""),
            "postal_code": address.get("pincode", ""),
            "country": "India",
        },
        "notes": customer.security_note or "",
    }


def sync_customer_to_erp(customer: Customer) -> dict:
    payload = erp_customer_payload(customer)
    try:
        external_id = customer.erp_customer_id
        remote_customers = erp_adapter.list_customers()
        if external_id and not any(str(item.get("id", "")) == str(external_id) for item in remote_customers):
            external_id = None
        if not external_id:
            matches = (customer.public_id, customer.mobile, customer.business_name, payload["code"])
            match = next(
                (
                    item for item in remote_customers
                    if any(str(item.get(field, "")).strip() in matches for field in (
                        "public_id", "code", "display_identifier", "mobile", "phone", "business_name"
                    ))
                ),
                None,
            )
            external_id = str(match.get("id")) if match and match.get("id") is not None else None

        result = (
            erp_adapter.update_customer(external_id, payload)
            if external_id
            else erp_adapter.create_customer(payload)
        )
        remote_id = result.get("id") or result.get("customer_id") or result.get("summary", {}).get("id")
        if remote_id is not None:
            customer.erp_customer_id = str(remote_id)
        customer.erp_sync_status = "synced"
        customer.erp_sync_error = None
        customer.erp_synced_at = datetime.utcnow()
        return {"status": "synced", "customer_id": customer.erp_customer_id}
    except ErpConnectionError as exc:
        customer.erp_sync_status = "pending"
        customer.erp_sync_error = str(exc)[:500]
        return {"status": "pending", "detail": str(exc)}


def apply_profile_payload(customer: Customer, payload: dict) -> None:
    for field, limit in {
        "contact_name": 120,
        "business_name": 160,
        "mobile": 20,
        "email": 160,
        "profile_image_url": 500,
        "gst_number": 24,
        "delivery_type": 20,
        "preferred_courier": 80,
        "level": 40,
        "account_manager": 120,
        "security_note": 160,
    }.items():
        if field in payload:
            value = str(payload.get(field) or "").strip()
            if field in {"business_name", "mobile"} and not value:
                raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} is required")
            if field == "delivery_type" and value not in {"local", "courier"}:
                raise HTTPException(status_code=422, detail="Delivery type must be local or courier")
            setattr(customer, field, value[:limit] or None)

    if "billing_address" in payload:
        raw_address = payload.get("billing_address")
        if raw_address is None:
            customer.billing_address = None
        elif not isinstance(raw_address, dict):
            raise HTTPException(status_code=422, detail="Billing address must be an object")
        else:
            address_limits = {
                "door_no": 80,
                "street_name": 160,
                "village_city": 120,
                "landmark": 160,
                "pincode": 6,
                "district": 120,
                "state": 100,
            }
            customer.billing_address = {
                field: str(raw_address.get(field) or "").strip()[:limit]
                for field, limit in address_limits.items()
            }


@router.get("")
def list_customers(db: DbSession) -> list[dict]:
    customers = db.scalars(select(Customer).order_by(Customer.created_at.desc())).all()
    return [serialize_customer(customer) for customer in customers]


@router.post("")
def create_customer(payload: dict, db: DbSession) -> dict:
    business_name = str(payload.get("business_name") or "").strip()
    mobile = str(payload.get("mobile") or "").strip()
    if not business_name:
        raise HTTPException(status_code=422, detail="Business name is required")
    if not mobile:
        raise HTTPException(status_code=422, detail="Mobile is required")
    if db.scalar(select(Customer).where(Customer.mobile == mobile)):
        raise HTTPException(status_code=409, detail="A customer with this mobile number already exists")

    next_number = (db.scalar(select(Customer.id).order_by(Customer.id.desc())) or 0) + 1
    customer = Customer(
        public_id=f"OR-TN-{next_number:04d}",
        business_name=business_name,
        mobile=mobile,
        delivery_type="courier",
    )
    apply_profile_payload(customer, payload)
    customer.profile_locked = True
    db.add(customer)
    db.flush()
    db.add(AuditLog(actor="staff", action="profile.staff_created", entity_type="customer", entity_id=customer.public_id))
    db.commit()
    db.refresh(customer)
    erp_sync = sync_customer_to_erp(customer)
    db.commit()
    db.refresh(customer)
    return {"status": "created", "customer": serialize_customer(customer), "erp_sync": erp_sync}


@router.get("/me")
def get_my_profile(db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "customer": serialize_customer(customer),
        "staff": {
            "employee_name": customer.account_manager or "ODD RAVEN Support",
            "role": "Customer Success",
            "avatar_url": None,
            "active_status": "active",
        },
        "settings_sections": [
            "Account",
            "Profile",
            "Chats",
            "Notifications",
            "Appearance",
            "Privacy",
            "Security",
            "Linked Devices / Sessions",
            "Storage",
            "Logout",
        ],
    }


@router.patch("/me")
def update_my_profile(payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.profile_locked:
        raise HTTPException(status_code=403, detail="Profile is locked. Contact staff to make changes.")
    apply_profile_payload(customer, payload)
    customer.profile_locked = True
    db.add(AuditLog(actor="customer", action="profile.updated", entity_type="customer", entity_id=customer.public_id))
    db.commit()
    db.refresh(customer)
    erp_sync = sync_customer_to_erp(customer)
    db.commit()
    db.refresh(customer)
    return {"status": "updated", "customer": serialize_customer(customer), "erp_sync": erp_sync}


@router.patch("/{customer_id}")
def update_customer_by_staff(customer_id: str, payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).where(Customer.public_id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    apply_profile_payload(customer, payload)
    customer.profile_locked = True
    db.add(AuditLog(actor="staff", action="profile.staff_updated", entity_type="customer", entity_id=customer.public_id))
    db.commit()
    db.refresh(customer)
    erp_sync = sync_customer_to_erp(customer)
    db.commit()
    db.refresh(customer)
    return {"status": "updated", "customer": serialize_customer(customer), "erp_sync": erp_sync}


@router.post("/me/photo")
async def update_profile_photo(db: DbSession, photo: UploadFile = File(...)) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.profile_locked:
        raise HTTPException(status_code=403, detail="Profile is locked. Contact staff to change the profile photo.")
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Profile photo must be an image")
    content = await photo.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Profile photo must be 10 MB or smaller")
    extension = Path(photo.filename or "photo.jpg").suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = ".jpg"
    filename = f"{uuid4().hex}{extension}"
    (PROFILE_UPLOAD_DIR / filename).write_bytes(content)
    customer.profile_image_url = f"/api/customers/profile-uploads/{filename}"
    db.add(AuditLog(actor="customer", action="profile.photo.updated", entity_type="customer", entity_id=customer.public_id))
    db.commit()
    db.refresh(customer)
    return {"status": "updated", "customer": serialize_customer(customer)}


@router.get("/{customer_id}")
def get_customer(customer_id: str, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).where(Customer.public_id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return serialize_customer(customer)
