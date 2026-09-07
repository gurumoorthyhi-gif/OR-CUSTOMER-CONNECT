from typing import Any, Protocol

import httpx

from services.api.app.core.config import settings


class ErpAdapter(Protocol):
    def status(self) -> dict:
        """Return connectivity details for the existing ERP."""

    def list_customers(self) -> list[dict]:
        """Return customers from the existing ERP."""

    def calculate_rate(self, payload: dict) -> dict:
        """Return the ERP-authoritative rate calculation."""

    def create_estimate(self, payload: dict) -> dict:
        """Create or preview an estimate using existing ERP rules."""

    def get_gangsheet_preview(self, gangsheet_id: str) -> dict:
        """Return preview metadata for a gangsheet generated or stored in ERP."""


class ErpConnectionError(RuntimeError):
    """Raised when the configured ERP API cannot be reached or used."""


class KmsErpHttpAdapter:
    def __init__(
        self,
        base_url: str,
        username: str = "",
        password: str = "",
        organization_slug: str = "",
        timeout_seconds: float = 5.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.organization_slug = organization_slug
        self.timeout_seconds = timeout_seconds

    def status(self) -> dict:
        try:
            data = self._request("GET", "/health", authenticate=False)
        except ErpConnectionError as exc:
            return {
                "status": "offline",
                "base_url": self.base_url,
                "detail": str(exc),
            }
        return {
            "status": "connected",
            "base_url": self.base_url,
            "erp": data,
        }

    def list_customers(self) -> list[dict]:
        data = self._request("GET", "/customers")
        if not isinstance(data, list):
            raise ErpConnectionError("ERP customers response was not a list")
        return data

    def calculate_rate(self, payload: dict) -> dict:
        product_id = payload.get("product_id")
        if product_id is None:
            return {
                "status": "missing_product_id",
                "detail": "KMS ERP pricing requires product_id and quantity.",
                "input": payload,
            }
        return self._request("POST", f"/products/{product_id}/price", json=payload)

    def create_estimate(self, payload: dict) -> dict:
        return self._request("POST", "/orders", json=payload)

    def get_gangsheet_preview(self, gangsheet_id: str) -> dict:
        return {
            "status": "not_exposed_by_kms_erp_api",
            "gangsheet_id": gangsheet_id,
            "detail": "The inspected KMS ERP API does not expose a gangsheet preview endpoint yet.",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        authenticate: bool = True,
        json: dict[str, Any] | None = None,
    ) -> Any:
        try:
            with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as client:
                if authenticate:
                    self._login(client)
                response = client.request(method, path, json=json)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code in {401, 403}:
                raise ErpConnectionError(
                    "ERP rejected the request. Set KMS_ERP_USERNAME, "
                    "KMS_ERP_PASSWORD, and KMS_ERP_ORGANIZATION_SLUG in .env."
                ) from exc
            raise ErpConnectionError(
                f"ERP returned HTTP {status_code}: {exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise ErpConnectionError(f"Could not reach ERP at {self.base_url}: {exc}") from exc

    def _login(self, client: httpx.Client) -> None:
        if not self.username or not self.password:
            return
        payload = {
            "username": self.username,
            "password": self.password,
            "organization_slug": self.organization_slug,
        }
        response = client.post("/auth/login", json=payload)
        response.raise_for_status()


class PendingErpAdapter:
    def status(self) -> dict:
        return {
            "status": "pending_configuration",
            "detail": "Set KMS_ERP_BASE_URL to connect the existing ERP.",
        }

    def list_customers(self) -> list[dict]:
        return []

    def calculate_rate(self, payload: dict) -> dict:
        return {"status": "pending_erp_package", "input": payload}

    def create_estimate(self, payload: dict) -> dict:
        return {"status": "pending_erp_package", "input": payload}

    def get_gangsheet_preview(self, gangsheet_id: str) -> dict:
        return {"status": "pending_erp_package", "gangsheet_id": gangsheet_id}


erp_adapter: ErpAdapter
if settings.kms_erp_base_url:
    erp_adapter = KmsErpHttpAdapter(
        settings.kms_erp_base_url,
        settings.kms_erp_username,
        settings.kms_erp_password,
        settings.kms_erp_organization_slug,
        settings.kms_erp_timeout_seconds,
    )
else:
    erp_adapter = PendingErpAdapter()
