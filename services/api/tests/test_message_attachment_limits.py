from collections.abc import Iterator
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from services.api.app.db.session import Base, get_db
from services.api.app.models import Customer
from services.api.app.modules.messages import routes as message_routes


def create_client(tmp_path, monkeypatch) -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)
    with session_factory() as db:
        db.add(Customer(public_id="CUST-100", business_name="Limit Test", mobile="1000000000"))
        db.commit()

    upload_dir = tmp_path / "message-uploads"
    upload_dir.mkdir()
    monkeypatch.setattr(message_routes, "UPLOAD_DIR", upload_dir)

    app = FastAPI()
    app.include_router(message_routes.router, prefix="/api/messages")

    def override_get_db() -> Iterator[Session]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def pdf_files(count: int) -> list[tuple[str, tuple[str, bytes, str]]]:
    return [
        ("attachments", (f"design-{index}.pdf", b"%PDF-1.4 test", "application/pdf"))
        for index in range(count)
    ]


def test_accepts_one_hundred_attachments(tmp_path, monkeypatch) -> None:
    client = create_client(tmp_path, monkeypatch)

    response = client.post(
        "/api/messages/with-attachment",
        data={"body": "One hundred designs", "client_message_id": "limit-100"},
        files=pdf_files(100),
    )

    assert response.status_code == 200
    assert len(response.json()["message"]["attachments"]) == 100


def test_rejects_more_than_one_hundred_attachments(tmp_path, monkeypatch) -> None:
    client = create_client(tmp_path, monkeypatch)

    response = client.post(
        "/api/messages/with-attachment",
        data={"body": "Too many designs", "client_message_id": "limit-101"},
        files=pdf_files(101),
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "A message can contain up to 100 files"
    assert not any((tmp_path / "message-uploads").iterdir())


def test_persists_voice_message_duration(tmp_path, monkeypatch) -> None:
    client = create_client(tmp_path, monkeypatch)

    response = client.post(
        "/api/messages/with-attachment",
        data={
            "client_message_id": "voice-duration",
            "attachment_durations": "[17]",
        },
        files=[("attachments", ("voice-message.webm", b"voice-data", "audio/webm"))],
    )

    assert response.status_code == 200
    message = response.json()["message"]
    assert message["message_type"] == "audio"
    assert message["attachments"][0]["duration_seconds"] == 17


def test_searches_message_text_attachment_names_and_ist_date(tmp_path, monkeypatch) -> None:
    client = create_client(tmp_path, monkeypatch)
    text_response = client.post(
        "/api/messages",
        json={
            "body": "Need the black oversized sample",
            "sender_type": "customer",
            "client_message_id": "search-text",
        },
    )
    file_response = client.post(
        "/api/messages/with-attachment",
        data={"body": "Artwork", "client_message_id": "search-file"},
        files=[("attachments", ("dragon-front.pdf", b"%PDF test", "application/pdf"))],
    )
    assert text_response.status_code == 200
    assert file_response.status_code == 200

    text_results = client.get("/api/messages/search", params={"q": "oversized", "viewer_type": "staff"})
    file_results = client.get("/api/messages/search", params={"q": "dragon-front", "viewer_type": "staff"})
    ist_date = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
    date_results = client.get("/api/messages/search", params={"date": ist_date, "viewer_type": "staff"})

    assert text_results.status_code == 200
    assert text_results.json()[0]["message"]["body"] == "Need the black oversized sample"
    assert file_results.status_code == 200
    assert file_results.json()[0]["message"]["attachments"][0]["original_filename"] == "dragon-front.pdf"
    assert date_results.status_code == 200
    assert {result["message"]["id"] for result in date_results.json()} == {
        text_response.json()["id"],
        file_response.json()["id"],
    }
