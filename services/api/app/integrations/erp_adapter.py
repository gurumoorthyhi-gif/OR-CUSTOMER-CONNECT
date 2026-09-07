from typing import Protocol


class ErpAdapter(Protocol):
    def list_customers(self) -> list[dict]:
        """Return customers from the existing ERP."""

    def calculate_rate(self, payload: dict) -> dict:
        """Return the ERP-authoritative rate calculation."""

    def create_estimate(self, payload: dict) -> dict:
        """Create or preview an estimate using existing ERP rules."""

    def get_gangsheet_preview(self, gangsheet_id: str) -> dict:
        """Return preview metadata for a gangsheet generated or stored in ERP."""


class PendingErpAdapter:
    def list_customers(self) -> list[dict]:
        return []

    def calculate_rate(self, payload: dict) -> dict:
        return {"status": "pending_erp_package", "input": payload}

    def create_estimate(self, payload: dict) -> dict:
        return {"status": "pending_erp_package", "input": payload}

    def get_gangsheet_preview(self, gangsheet_id: str) -> dict:
        return {"status": "pending_erp_package", "gangsheet_id": gangsheet_id}


erp_adapter: ErpAdapter = PendingErpAdapter()

