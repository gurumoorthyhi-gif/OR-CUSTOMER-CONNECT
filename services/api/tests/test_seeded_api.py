from fastapi.testclient import TestClient

from services.api.app.main import app


def test_seeded_customer_order_design_and_payment_endpoints() -> None:
    client = TestClient(app)

    customers = client.get("/api/customers")
    orders = client.get("/api/orders")
    designs = client.get("/api/designs")
    payments = client.get("/api/payments")

    assert customers.status_code == 200
    assert orders.status_code == 200
    assert designs.status_code == 200
    assert payments.status_code == 200
    assert customers.json()[0]["id"] == "OR-TN-0001"
    assert orders.json()[0]["id"] == "OR-1028"
    assert designs.json()[0]["external_erp_id"] == "ERP-DES-001"
    assert payments.json()[0]["id"] == "PAY-8102"

