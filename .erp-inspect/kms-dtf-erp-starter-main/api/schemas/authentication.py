"""Browser authentication request and response contracts."""

from pydantic import BaseModel, Field, SecretStr


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: SecretStr
    organization_slug: str | None = Field(default=None, max_length=80)


class AuthenticatedUserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    organization_id: int
    organization_name: str
    roles: list[str]
    permissions: list[str]


class MessageResponse(BaseModel):
    message: str


class PasswordResetRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=254)


class PasswordResetConfirmRequest(BaseModel):
    token: SecretStr
    new_password: SecretStr


class AccountStatusRequest(BaseModel):
    is_active: bool
