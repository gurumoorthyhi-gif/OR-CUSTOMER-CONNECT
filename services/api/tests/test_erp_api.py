from fastapi.testclient import TestClient

from services.api.app.main import app


def test_erp_status_reports_configuration_or_connection() -> None:
    client = TestClient(app)

    response = client.get("/api/erp/status")

    assert response.status_code == 200
    assert response.json()["status"] in {
        "connected",
        "offline",
        "pending_configuration",
    }


def test_erp_rate_without_product_id_returns_mapping_guidance() -> None:
    client = TestClient(app)

    response = client.post("/api/erp/rate", json={"quantity": 1})

    assert response.status_code == 200
    assert response.json()["status"] == "missing_product_id"
