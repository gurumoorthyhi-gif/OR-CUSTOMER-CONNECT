from decimal import Decimal

from fastapi import FastAPI

app = FastAPI(
    title="KMS ERP Local Simulator",
    version="0.1.0",
    description="Local development ERP contract for ODD RAVEN integration checks.",
)


CUSTOMERS = [
    {
        "id": "ERP-CUST-001",
        "public_id": "OR-TN-0001",
        "business_name": "Sowmiya Prints",
        "mobile": "+919876543210",
        "gst_number": "33ABCDE1234F1Z5",
        "level": "Dealer",
    }
]

PRODUCT_RATES = {
    "dtf-meter": Decimal("450.00"),
    "gangsheet": Decimal("450.00"),
    "standard": Decimal("450.00"),
}


@app.get("/api/v1/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "kms-erp-local-simulator",
    "features": ["customers", "rate", "estimate"],
    }


@app.get("/api/v1/customers")
def list_customers() -> list[dict]:
    return CUSTOMERS


@app.post("/api/v1/customers", status_code=201)
def create_customer(payload: dict) -> dict:
    customer = {
        "id": f"ERP-CUST-{len(CUSTOMERS) + 1:03d}",
        "public_id": payload.get("public_id") or payload.get("code"),
        "business_name": payload.get("business_name", ""),
        "mobile": payload.get("phone", ""),
        "gst_number": payload.get("gst_number", ""),
        "level": payload.get("level", "standard"),
        **payload,
    }
    CUSTOMERS.append(customer)
    return customer


@app.put("/api/v1/customers/{customer_id}")
def update_customer(customer_id: str, payload: dict) -> dict:
    customer = next((item for item in CUSTOMERS if str(item.get("id")) == customer_id), None)
    if customer is None:
        return {"detail": "Customer not found"}
    customer.update(payload)
    return customer


@app.post("/api/v1/products/{product_id}/price")
def calculate_price(product_id: str, payload: dict) -> dict:
    quantity = Decimal(str(payload.get("quantity") or payload.get("meters") or 1))
    rate = PRODUCT_RATES.get(product_id, PRODUCT_RATES["standard"])
    total = rate * quantity
    return {
        "status": "calculated",
        "product_id": product_id,
        "quantity": float(quantity),
        "rate_per_meter": float(rate),
        "currency": "INR",
        "total": float(total),
    }


@app.post("/api/v1/orders")
def create_estimate(payload: dict) -> dict:
    quantity = Decimal(str(payload.get("quantity") or payload.get("meters") or 1))
    rate = PRODUCT_RATES["standard"]
    return {
        "status": "estimate_created",
        "estimate_id": "ERP-EST-LOCAL-001",
        "order_id": payload.get("order_id") or "OR-LOCAL",
        "quantity": float(quantity),
        "rate_per_meter": float(rate),
        "total": float(rate * quantity),
        "currency": "INR",
    }
