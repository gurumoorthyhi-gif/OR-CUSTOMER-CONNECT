"""Database lifecycle and request dependencies for the web API."""

from fastapi import Request

from app.database import SessionFactory, create_database_engine, create_session_factory


def configure_database(app: object, database_url: str) -> None:
    engine = create_database_engine(database_url)
    app.state.database_engine = engine  # type: ignore[attr-defined]
    app.state.session_factory = create_session_factory(engine)  # type: ignore[attr-defined]


def get_session_factory(request: Request) -> SessionFactory:
    return request.app.state.session_factory
