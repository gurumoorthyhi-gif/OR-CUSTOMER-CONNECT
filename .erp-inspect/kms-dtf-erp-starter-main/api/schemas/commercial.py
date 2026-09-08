"""Customer, product, pricing, and order API contracts."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CommercialModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AddressPayload(CommercialModel):
    line1: str = ""
    line2: str = ""
    city: str = ""
    landmark: str = ""
    district: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = "India"


class CustomerPayload(CommercialModel):
    code: str = ""
    name: str = Field(min_length=1, max_length=160)
    phone: str = Field(min_length=1, max_length=20)
    business_name: str = ""
    whatsapp_number: str = ""
    delivery_type: str = "Courier"
    preferred_courier: str = "ST"
    other_transport_name: str = ""
    preferred_rate: Decimal = Decimal("0.00")
    email: str | None = None
    gst_number: str = ""
    billing_address: AddressPayload = AddressPayload()
    shipping_address: AddressPayload = AddressPayload()
    notes: str = ""


class CustomerSummaryResponse(CommercialModel):
    id: int
    code: str
    display_identifier: str
    name: str
    business_name: str
    phone: str
    whatsapp_number: str
    delivery_type: str
    preferred_courier: str
    other_transport_name: str
    preferred_rate: Decimal
    email: str | None
    is_active: bool


class CustomerDetailsResponse(CommercialModel):
    summary: CustomerSummaryResponse
    whatsapp_number: str
    gst_number: str
    billing_address: AddressPayload
    shipping_address: AddressPayload
    notes: str
    file_references: tuple[tuple[str, str], ...]
    storage_prefix: str
    google_drive_folder_id: str


class CustomerDateFolderPayload(BaseModel):
    folder_date: date | None = None


class CustomerDateFoldersResponse(BaseModel):
    customer_id: int
    storage_prefix: str
    dates: list[str]


class CustomerFileResponse(CommercialModel):
    id: int
    original_name: str
    content_type: str
    size_bytes: int
    transfer_state: str
    created_at: datetime


class CustomerFileCopyPayload(BaseModel):
    customer_id: int = Field(gt=0)
    date_name: str = Field(min_length=10, max_length=10)
    folder_name: str = Field(min_length=1, max_length=40)


class CustomerDesignNamesPayload(BaseModel):
    source_names: list[str] = Field(min_length=1, max_length=200)


class CategoryPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str


class ProductPayload(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    category_id: int = Field(gt=0)
    unit: str = "piece"
    base_price: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    size: str = ""
    colour: str = ""
    gsm: str = ""
    style: str = ""


class ProductResponse(CommercialModel):
    id: int
    code: str
    name: str
    category: str
    unit: str
    base_price: Decimal
    tax_rate: Decimal
    is_active: bool


class PriceRequest(BaseModel):
    quantity: Decimal = Field(gt=0)


class PriceResponse(CommercialModel):
    unit_price: Decimal
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal


class OrderItemPayload(BaseModel):
    product_id: int = Field(gt=0)
    quantity: Decimal = Field(gt=0)


class OrderPayload(BaseModel):
    customer_id: int = Field(gt=0)
    items: tuple[OrderItemPayload, ...] = ()
    order_type: str = "DTF"
    advance: Decimal = Field(default=Decimal("0"), ge=0)
    due_date: date | None = None
    priority: str = "Normal"
    notes: str = ""
    design_file_ids: tuple[int, ...] = ()


class OrderSummaryResponse(CommercialModel):
    id: int
    order_number: str
    customer_code: str
    customer_display_identifier: str
    customer_name: str
    order_type: str
    status: str
    priority: str
    due_date: date | None
    total: Decimal
    balance: Decimal


class OrderItemResponse(CommercialModel):
    description: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal


class StatusHistoryResponse(CommercialModel):
    from_status: str | None
    to_status: str
    note: str
    changed_at: datetime


class OrderDetailsResponse(CommercialModel):
    summary: OrderSummaryResponse
    notes: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    advance: Decimal
    items: tuple[OrderItemResponse, ...]
    status_history: tuple[StatusHistoryResponse, ...]
    design_file_ids: tuple[int, ...]


class StatusChangePayload(BaseModel):
    status: str = Field(min_length=1, max_length=40)
    note: str = Field(default="", max_length=2000)
