from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import Base, engine
from services.api.app.models import (
    Approval,
    AuditLog,
    Customer,
    CustomerOrderStatus,
    Design,
    Invoice,
    Machine,
    Message,
    Order,
    Payment,
    ProductionJob,
    QualityCheck,
    Reprint,
    Shipment,
    Supplier,
    SupportTicket,
    WasteEvent,
)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        customer = session.scalar(select(Customer).where(Customer.public_id == "OR-TN-0001"))
        if customer is None:
            customer = Customer(
                public_id="OR-TN-0001",
                business_name="Sowmiya Prints",
                mobile="+919876543210",
                gst_number="33ABCDE1234F1Z5",
                level="Dealer",
                account_manager="ODD RAVEN Support",
            )
            session.add(customer)
            session.flush()

        design = session.scalar(select(Design).where(Design.external_erp_id == "ERP-DES-001"))
        if design is None:
            session.add(
                Design(
                    customer_id=customer.id,
                    external_erp_id="ERP-DES-001",
                    name="Raven back print",
                    storage_key="samples/raven-back-print.png",
                    preview_key="samples/raven-back-print-preview.png",
                    notes="Seed design waiting for ERP mapping.",
                )
            )

        order = session.scalar(select(Order).where(Order.public_id == "OR-1028"))
        if order is None:
            order = Order(
                public_id="OR-1028",
                customer_id=customer.id,
                external_erp_id="ERP-ORD-1028",
                title="Streetwear chest logos",
                status=CustomerOrderStatus.AWAITING_APPROVAL,
                total_meters=Decimal("8.40"),
                rate_per_meter=Decimal("450.00"),
                price_snapshot=Decimal("3780.00"),
                payment_status="estimate_ready",
            )
            session.add(order)
            session.flush()

        machine = session.scalar(select(Machine).where(Machine.name == "Four Head 01"))
        if machine is None:
            machine = Machine(
                name="Four Head 01",
                status="running",
                width_inches=Decimal("22.00"),
                speed_mph=Decimal("18.00"),
            )
            session.add(machine)
            session.flush()

        job = session.scalar(select(ProductionJob).where(ProductionJob.public_id == "JOB-501"))
        if job is None:
            job = ProductionJob(
                public_id="JOB-501",
                order_id=order.id,
                machine_id=machine.id,
                status="queue",
                operator_name="Operator A",
                expected_meters=Decimal("8.40"),
                actual_meters=Decimal("0.00"),
                waste_meters=Decimal("0.00"),
            )
            session.add(job)
            session.flush()

        if session.scalar(select(Approval).where(Approval.order_id == order.id)) is None:
            session.add(Approval(order_id=order.id, gangsheet_version="v1", status="pending"))
        if session.scalar(select(Message).where(Message.customer_id == customer.id)) is None:
            session.add(
                Message(
                    customer_id=customer.id,
                    order_id=order.id,
                    sender_type="staff",
                    body="Preview uploaded.",
                )
            )
        if session.scalar(select(Payment).where(Payment.public_id == "PAY-8102")) is None:
            session.add(
                Payment(public_id="PAY-8102", order_id=order.id, amount=Decimal("3780.00"), status="pending")
            )
        if session.scalar(select(QualityCheck).where(QualityCheck.production_job_id == job.id)) is None:
            session.add(QualityCheck(production_job_id=job.id, status="pending"))
        if session.scalar(select(Reprint).where(Reprint.public_id == "RPT-0001")) is None:
            session.add(Reprint(public_id="RPT-0001", order_id=order.id, reason="Sample reprint record", status="closed"))
        if session.scalar(select(WasteEvent).where(WasteEvent.production_job_id == job.id)) is None:
            session.add(WasteEvent(production_job_id=job.id, category="setup", meters=Decimal("0.30")))
        if session.scalar(select(Shipment).where(Shipment.public_id == "SHP-3301")) is None:
            session.add(Shipment(public_id="SHP-3301", order_id=order.id, courier="manual", status="packing_pending"))
        if session.scalar(select(Invoice).where(Invoice.public_id == "PRO-2402")) is None:
            session.add(Invoice(public_id="PRO-2402", order_id=order.id, status="proforma", amount=Decimal("3780.00")))
        if session.scalar(select(Supplier).where(Supplier.name == "Partner Printer A")) is None:
            session.add(Supplier(name="Partner Printer A", status="available", cost_per_meter=Decimal("390.00")))
        if session.scalar(select(SupportTicket).where(SupportTicket.public_id == "SUP-210")) is None:
            session.add(
                SupportTicket(
                    public_id="SUP-210",
                    customer_id=customer.id,
                    order_id=order.id,
                    issue="Courier tracking update",
                    status="open",
                )
            )
        if session.scalar(select(AuditLog).where(AuditLog.action == "seeded_local_database")) is None:
            session.add(
                AuditLog(
                    actor="system",
                    action="seeded_local_database",
                    entity_type="customer",
                    entity_id=customer.public_id,
                )
            )
        session.commit()


if __name__ == "__main__":
    init_db()
