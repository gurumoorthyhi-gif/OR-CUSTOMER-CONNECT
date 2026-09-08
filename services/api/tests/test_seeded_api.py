from fastapi.testclient import TestClient

from services.api.app.main import app


def test_seeded_customer_order_design_and_payment_endpoints() -> None:
    with TestClient(app) as client:
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


def test_customer_profile_read_and_update() -> None:
    with TestClient(app) as client:
        profile = client.get("/api/customers/me")
        assert profile.status_code == 200
        assert profile.json()["customer"]["id"] == "OR-TN-0001"
        assert "profile_locked" in profile.json()["customer"]
        assert "Notifications" in profile.json()["settings_sections"]
        assert "Contacts" not in profile.json()["settings_sections"]

        payload = {
            "contact_name": "Sowmiya K",
            "email": "profile@sowmiyaprints.example",
            "delivery_type": "local",
            "preferred_courier": "DTDC",
            "billing_address": {
                "door_no": "12/4",
                "street_name": "Raven Street",
                "village_city": "Chennai",
                "landmark": "Near print market",
                "pincode": "600001",
                "district": "Chennai",
                "state": "Tamil Nadu",
            },
        }
        update = client.patch("/api/customers/me", json=payload)
        if profile.json()["customer"]["profile_locked"]:
            assert update.status_code == 403
            update = client.patch("/api/customers/OR-TN-0001", json=payload)

        assert update.status_code == 200
        assert update.json()["customer"]["contact_name"] == "Sowmiya K"
        assert update.json()["customer"]["email"] == "profile@sowmiyaprints.example"
        assert update.json()["customer"]["preferred_courier"] == "DTDC"
        assert update.json()["customer"]["delivery_type"] == "local"
        assert update.json()["customer"]["profile_locked"] is True
        business_short = "".join(character for character in update.json()["customer"]["business_name"] if character.isalnum())[:3].upper().ljust(3, "X")
        assert update.json()["customer"]["delivery_code"] == f"LC-0001-{business_short}-CHN"
        assert update.json()["customer"]["billing_address"]["pincode"] == "600001"
