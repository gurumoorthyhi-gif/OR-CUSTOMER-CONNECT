from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from services.api.app.db.session import Base


class CustomerOrderStatus(StrEnum):
    RECEIVED = "received"
    ARTWORK_CHECKING = "artwork_checking"
    AWAITING_APPROVAL = "awaiting_approval"
    AWAITING_PAYMENT = "awaiting_payment"
    PAYMENT_CONFIRMED = "payment_confirmed"
    IN_QUEUE = "in_queue"
    PRINTING = "printing"
    QC = "qc"
    PACKED = "packed"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    COMPLETED = "completed"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    business_name: Mapped[str] = mapped_column(String(160))
    mobile: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(160), nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gst_number: Mapped[str | None] = mapped_column(String(24), nullable=True)
    delivery_type: Mapped[str] = mapped_column(String(20), default="courier", server_default="courier", nullable=False)
    preferred_courier: Mapped[str | None] = mapped_column(String(80), nullable=True)
    billing_address: Mapped[dict[str, str] | None] = mapped_column(JSON, nullable=True)
    profile_locked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    erp_customer_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    erp_sync_status: Mapped[str] = mapped_column(String(24), default="pending", server_default="pending", nullable=False)
    erp_sync_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    erp_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    level: Mapped[str] = mapped_column(String(40), default="standard")
    account_manager: Mapped[str | None] = mapped_column(String(120), nullable=True)
    security_note: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    designs: Mapped[list["Design"]] = relationship(back_populates="customer")
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")


class Design(Base):
    __tablename__ = "designs"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    external_erp_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(180))
    storage_key: Mapped[str] = mapped_column(String(500))
    preview_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped[Customer] = relationship(back_populates="designs")


class ImageProcessingJob(Base):
    __tablename__ = "image_processing_jobs"
    __table_args__ = (
        UniqueConstraint("source_file_path", "operation", "status", name="uq_image_processing_active_source_operation"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    design_id: Mapped[int | None] = mapped_column(ForeignKey("designs.id"), nullable=True, index=True)
    operation: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(20), default="QUEUED", index=True)
    priority: Mapped[int] = mapped_column(default=100, index=True)
    source_file_path: Mapped[str] = mapped_column(String(500))
    result_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    worker_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    attempt_count: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=2)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    external_tool: Mapped[str] = mapped_column(String(40), default="pixelcut_browser")
    queued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    external_erp_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(180))
    status: Mapped[CustomerOrderStatus] = mapped_column(
        Enum(CustomerOrderStatus), default=CustomerOrderStatus.RECEIVED
    )
    total_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    rate_per_meter: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    payment_status: Mapped[str] = mapped_column(String(40), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped[Customer] = relationship(back_populates="orders")
    approvals: Mapped[list["Approval"]] = relationship(back_populates="order")
    production_jobs: Mapped[list["ProductionJob"]] = relationship(back_populates="order")


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    gangsheet_version: Mapped[str] = mapped_column(String(40), default="v1")
    status: Mapped[str] = mapped_column(String(40), default="pending")
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    order: Mapped[Order] = relationship(back_populates="approvals")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    sender_type: Mapped[str] = mapped_column(String(20))
    body: Mapped[str] = mapped_column(Text)
    message_type: Mapped[str] = mapped_column(String(24), default="text")
    client_message_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    sender_user_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="sent")
    reply_to_message_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), nullable=True, index=True)
    reply_to_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    reply_to_sender_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    attachment_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attachment_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hidden_for_customer: Mapped[bool] = mapped_column(default=False)
    hidden_for_staff: Mapped[bool] = mapped_column(default=False)
    is_pinned: Mapped[bool] = mapped_column(default=False)
    is_starred: Mapped[bool] = mapped_column(default=False)
    reaction: Mapped[str | None] = mapped_column(String(20), nullable=True)
    note_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[list["MessageAttachment"]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messages.id"), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(120))
    extension: Mapped[str] = mapped_column(String(20))
    size_bytes: Mapped[int] = mapped_column(default=0)
    width: Mapped[int | None] = mapped_column(nullable=True)
    height: Mapped[int | None] = mapped_column(nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(nullable=True)
    checksum: Mapped[str] = mapped_column(String(64))
    storage_path: Mapped[str] = mapped_column(String(500))
    thumbnail_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    uploaded_by: Mapped[str] = mapped_column(String(80))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    message: Mapped[Message] = relationship(back_populates="attachments")


class ConversationPreference(Base):
    __tablename__ = "conversation_preferences"
    __table_args__ = (UniqueConstraint("customer_id", "viewer_type", name="uq_conversation_preference_viewer"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    viewer_type: Mapped[str] = mapped_column(String(20))
    is_archived: Mapped[bool] = mapped_column(default=False)
    is_pinned: Mapped[bool] = mapped_column(default=False)
    muted_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    marked_unread: Mapped[bool] = mapped_column(default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(40), default="pending")
    method: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    status: Mapped[str] = mapped_column(String(40), default="available")
    width_inches: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=22)
    speed_mph: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0)


class ProductionJob(Base):
    __tablename__ = "production_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    machine_id: Mapped[int | None] = mapped_column(ForeignKey("machines.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="queue")
    operator_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    expected_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    actual_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    waste_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    order: Mapped[Order] = relationship(back_populates="production_jobs")


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id: Mapped[int] = mapped_column(primary_key=True)
    production_job_id: Mapped[int] = mapped_column(ForeignKey("production_jobs.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="pending")
    defect_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class Reprint(Base):
    __tablename__ = "reprints"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="created")


class WasteEvent(Base):
    __tablename__ = "waste_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    production_job_id: Mapped[int] = mapped_column(ForeignKey("production_jobs.id"), index=True)
    category: Mapped[str] = mapped_column(String(80))
    meters: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    courier: Mapped[str] = mapped_column(String(80), default="manual")
    awb: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="packing_pending")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="proforma")
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    status: Mapped[str] = mapped_column(String(40), default="available")
    cost_per_meter: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    issue: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="open")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor: Mapped[str] = mapped_column(String(120))
    action: Mapped[str] = mapped_column(String(160))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
