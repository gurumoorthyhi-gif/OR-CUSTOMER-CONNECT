from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.modules.image_processing.readiness import (
    error_code,
    error_message,
    service_readiness,
)
from services.api.app.modules.image_processing.workers import worker_manager


def test_unverified_workers_are_not_ready():
    for state in ("STARTING", "UNHEALTHY", "BLOCKED", "STOPPED"):
        status = service_readiness({"BG": {"type": "background", "state": state}}, "background", True)
        assert not status["ready"]


def test_service_readiness_is_separate_for_each_tool():
    registry = {
        "BG": {"type": "background", "state": "BUSY"},
        "UP": {"type": "upscale", "state": "UNHEALTHY", "lastError": "NETWORK_ACCESS_DENIED"},
    }
    assert service_readiness(registry, "background", True)["ready"]
    assert not service_readiness(registry, "upscale", True)["ready"]
    assert "network permissions" in service_readiness(registry, "upscale", True)["message"]
    assert not service_readiness(registry, "background", False)["ready"]


def test_network_failure_has_actionable_message():
    code = error_code(RuntimeError("Page.goto: net::ERR_NETWORK_ACCESS_DENIED at https://www.pixelcut.ai"))
    assert code == "NETWORK_ACCESS_DENIED"
    assert "connection is blocked" in error_message(code)


def test_unavailable_worker_rejects_upload_before_queuing(monkeypatch):
    monkeypatch.setattr(worker_manager, "registry", {})
    response = TestClient(app).post("/api/image-processing/upload", data={"operation": "REMOVE_BG"}, files={"upload": ("test.png", b"not read", "image/png")})
    assert response.status_code == 503
    assert "detail" in response.json()
