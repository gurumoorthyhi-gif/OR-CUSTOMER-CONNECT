from fastapi.testclient import TestClient

from services.api.app.main import app


def test_operations_endpoints_return_seeded_data() -> None:
    client = TestClient(app)

    paths = [
        "/api/production/queue",
        "/api/machines",
        "/api/qc",
        "/api/packing",
        "/api/courier",
        "/api/invoices",
        "/api/suppliers",
        "/api/reprints",
        "/api/waste",
        "/api/support",
        "/api/messages",
        "/api/approvals",
    ]

    for path in paths:
        response = client.get(path)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

