from datetime import datetime, timedelta
import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.core.config import settings
from services.api.app.db.session import get_db
from services.api.app.models import Customer

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
CUSTOMER_SESSION_COOKIE = "odd_raven_customer_session"
PLACEHOLDER_OTP = "123456"
OTP_TTL = timedelta(minutes=5)
_verified_phones: dict[str, datetime] = {}


def normalize_mobile(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    return f"+{digits}" if digits else ""


def customer_payload(customer: Customer) -> dict[str, object]:
    return {"id": customer.public_id, "public_id": customer.public_id, "contact_name": customer.contact_name, "business_name": customer.business_name, "mobile": customer.mobile, "email": customer.email}


def set_customer_session(response: Response, customer: Customer) -> None:
    token = jwt.encode({"sub": customer.public_id, "type": "customer"}, settings.jwt_secret, algorithm="HS256")
    response.set_cookie(CUSTOMER_SESSION_COOKIE, token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30)


def verified_mobile(mobile: str) -> bool:
    timestamp = _verified_phones.get(mobile)
    if not timestamp:
        return False
    if datetime.utcnow() - timestamp > OTP_TTL:
        _verified_phones.pop(mobile, None)
        return False
    return True


@router.post("/otp/request")
def request_otp(payload: dict, db: DbSession) -> dict[str, object]:
    mobile = normalize_mobile(str(payload.get("mobile") or ""))
    if len(re.sub(r"\D", "", mobile)) < 10:
        raise HTTPException(status_code=422, detail="Enter a valid mobile number")
    customer = db.scalar(select(Customer).where(Customer.mobile == mobile))
    return {"status": "otp_requested", "mobile": mobile, "existing_customer": customer is not None, "development_otp": PLACEHOLDER_OTP if settings.environment == "local" else None}


@router.post("/otp/verify")
def verify_otp(payload: dict, response: Response, db: DbSession) -> dict[str, object]:
    mobile = normalize_mobile(str(payload.get("mobile") or ""))
    if str(payload.get("otp") or "").strip() != PLACEHOLDER_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    _verified_phones[mobile] = datetime.utcnow()
    customer = db.scalar(select(Customer).where(Customer.mobile == mobile))
    if customer and customer.password_hash:
        set_customer_session(response, customer)
    return {"status": "verified", "mobile": mobile, "needs_registration": customer is None or not customer.password_hash, "customer": customer_payload(customer) if customer else None}


@router.post("/register")
def register_customer(payload: dict, response: Response, db: DbSession) -> dict[str, object]:
    mobile = normalize_mobile(str(payload.get("mobile") or ""))
    if not verified_mobile(mobile):
        raise HTTPException(status_code=403, detail="Verify the mobile number first")
    password = str(payload.get("password") or "")
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    customer = db.scalar(select(Customer).where(Customer.mobile == mobile))
    if customer is None:
        next_number = (db.scalar(select(Customer.id).order_by(Customer.id.desc())) or 0) + 1
        name = str(payload.get("full_name") or "Customer").strip() or "Customer"
        customer = Customer(public_id=f"OR-CU-{next_number:04d}", contact_name=name, business_name=name, mobile=mobile, email=str(payload.get("email") or "").strip().lower() or None)
        db.add(customer)
    customer.password_hash = password_context.hash(password)
    db.commit()
    db.refresh(customer)
    set_customer_session(response, customer)
    _verified_phones.pop(mobile, None)
    return {"status": "registered", "customer": customer_payload(customer)}


@router.post("/login/mobile")
def login_mobile(payload: dict, response: Response, db: DbSession) -> dict[str, object]:
    mobile = normalize_mobile(str(payload.get("mobile") or ""))
    password = str(payload.get("password") or "")
    customer = db.scalar(select(Customer).where(Customer.mobile == mobile))
    if not customer or not customer.password_hash or not password_context.verify(password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    set_customer_session(response, customer)
    return {"status": "authenticated", "customer": customer_payload(customer)}
