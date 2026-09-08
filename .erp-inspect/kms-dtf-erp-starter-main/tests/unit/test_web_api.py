from fastapi.testclient import TestClient

from api.config import WebSettings
from api.main import create_app


def test_health_endpoint_reports_service_identity() -> None:
    app = create_app(WebSettings(app_env="test", app_version="test-version"))

    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "KMS DTF ERP API",
        "version": "test-version",
        "environment": "test",
    }
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Request-ID"]


def test_request_id_accepts_only_uuid_values() -> None:
    app = create_app(WebSettings(app_env="test"))

    with TestClient(app) as client:
        invalid = client.get("/api/v1/health", headers={"X-Request-ID": "unsafe-value"})
        valid = client.get(
            "/api/v1/health",
            headers={"X-Request-ID": "f3c5e634-9432-4f2e-89d6-3e005ab0779d"},
        )

    assert invalid.headers["X-Request-ID"] != "unsafe-value"
    assert valid.headers["X-Request-ID"] == "f3c5e634-9432-4f2e-89d6-3e005ab0779d"


def test_production_hides_interactive_api_documentation() -> None:
    app = create_app(WebSettings(app_env="production"))

    with TestClient(app) as client:
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404


def test_browser_application_shell_is_served() -> None:
    app = create_app(WebSettings(app_env="test"))

    with TestClient(app) as client:
        response = client.get("/")
        stylesheet = client.get("/assets/styles.css")

    assert response.status_code == 200
    assert "KMS DTF ERP" in response.text
    assert stylesheet.status_code == 200
