"""Organization-scoped core commercial workflow endpoints."""

from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.exc import IntegrityError

from api.artwork import save_upload_to_temporary, storage_provider
from api.authentication import WebAuthContext, require_csrf, require_permission
from api.schemas.authentication import MessageResponse
from api.schemas.commercial import (
    CategoryPayload,
    CategoryResponse,
    CustomerDateFolderPayload,
    CustomerDateFoldersResponse,
    CustomerDesignNamesPayload,
    CustomerDetailsResponse,
    CustomerFileCopyPayload,
    CustomerFileResponse,
    CustomerPayload,
    CustomerSummaryResponse,
    OrderDetailsResponse,
    OrderPayload,
    OrderSummaryResponse,
    PriceRequest,
    PriceResponse,
    ProductPayload,
    ProductResponse,
    StatusChangePayload,
)
from app.modules.cloud_storage.service import CloudStorageService
from app.modules.customers.pincode_lookup import lookup_pincode
from app.modules.customers.repository import CustomerRepository
from app.modules.customers.schemas import AddressInput, CustomerInput
from app.modules.customers.service import CustomerService
from app.modules.orders.repository import OrderRepository
from app.modules.orders.schemas import OrderInput, OrderItemInput
from app.modules.orders.service import OrderService
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductInput
from app.modules.products.service import ProductService

router = APIRouter(tags=["commercial"])


@router.get("/pincodes/{pincode}")
def pincode_details(
    pincode: str,
    _context: WebAuthContext = Depends(require_permission("customers.view")),
):
    details = lookup_pincode(pincode)
    if details is None:
        raise HTTPException(status_code=404, detail="Pincode not found")
    return {"district": details.district, "state": details.state}


def customer_service(request: Request, organization_id: int) -> CustomerService:
    return CustomerService(CustomerRepository(request.app.state.session_factory, organization_id))


def customer_file_service(
    request: Request, organization_id: int
) -> tuple[CustomerService, CloudStorageService]:
    settings = request.app.state.settings
    cloud = CloudStorageService(
        request.app.state.session_factory,
        storage_provider(settings),
        Path(settings.storage_cache_directory),
        organization_id,
    )
    customers = CustomerService(
        CustomerRepository(request.app.state.session_factory, organization_id),
        storage_service=cloud,
    )
    return customers, cloud


def product_service(request: Request, organization_id: int) -> ProductService:
    return ProductService(ProductRepository(request.app.state.session_factory, organization_id))


def order_service(
    request: Request,
    organization_id: int,
    actor_user_id: int | None = None,
) -> OrderService:
    pricing = product_service(request, organization_id)
    repository = OrderRepository(request.app.state.session_factory, organization_id)
    return OrderService(repository, pricing, actor_user_id=actor_user_id)


def address(payload) -> AddressInput:
    return AddressInput(**payload.model_dump())


def customer_input(payload: CustomerPayload) -> CustomerInput:
    values = payload.model_dump(exclude={"billing_address", "shipping_address"})
    return CustomerInput(
        **values,
        billing_address=address(payload.billing_address),
        shipping_address=address(payload.shipping_address),
    )


@router.get("/customers", response_model=list[CustomerSummaryResponse])
def list_customers(
    request: Request,
    query: str = Query(default="", max_length=160),
    active: bool | None = Query(default=True),
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    return customer_service(request, context.organization_id).list_customers(query, active=active)


@router.post(
    "/customers",
    response_model=CustomerDetailsResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_customer(
    payload: CustomerPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    try:
        return customer_service(request, context.organization_id).create_customer(
            customer_input(payload)
        )
    except (ValueError, IntegrityError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/customers/{customer_id}", response_model=CustomerDetailsResponse)
def get_customer(
    customer_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    try:
        return customer_service(request, context.organization_id).get_customer(customer_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put(
    "/customers/{customer_id}",
    response_model=CustomerDetailsResponse,
    dependencies=[Depends(require_csrf)],
)
def update_customer(
    customer_id: int,
    payload: CustomerPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    try:
        return customer_service(request, context.organization_id).update_customer(
            customer_id, customer_input(payload)
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete(
    "/customers/{customer_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def deactivate_customer(
    customer_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    try:
        customer_service(request, context.organization_id).deactivate_customer(customer_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return MessageResponse(message="Customer deactivated")


@router.post(
    "/customers/{customer_id}/deactivate",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def deactivate_customer_action(
    customer_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    return deactivate_customer(customer_id, request, context)


@router.delete(
    "/customers/{customer_id}/permanent",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def permanently_delete_customer(
    customer_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    try:
        customer_service(request, context.organization_id).delete_customer(customer_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return MessageResponse(message="Customer deleted")


@router.get(
    "/customers/{customer_id}/folders",
    response_model=CustomerDateFoldersResponse,
)
def customer_folders(
    customer_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        details = manager.ensure_customer_storage(customer_id)
        return CustomerDateFoldersResponse(
            customer_id=customer_id,
            storage_prefix=details.storage_prefix,
            dates=manager.customer_storage_dates(customer_id),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.post(
    "/customers/{customer_id}/folders",
    response_model=CustomerDateFoldersResponse,
    dependencies=[Depends(require_csrf)],
)
def create_customer_folder(
    customer_id: int,
    payload: CustomerDateFolderPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        manager.create_customer_date_folder(customer_id, payload.folder_date)
        details = manager.get_customer(customer_id)
        return CustomerDateFoldersResponse(
            customer_id=customer_id,
            storage_prefix=details.storage_prefix,
            dates=manager.customer_storage_dates(customer_id),
        )
    except (LookupError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.get(
    "/customers/{customer_id}/files",
    response_model=list[CustomerFileResponse],
)
def list_customer_files(
    customer_id: int,
    request: Request,
    date_name: str = Query(min_length=10, max_length=10),
    folder_name: str = Query(min_length=1, max_length=40),
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        return manager.list_customer_files(customer_id, date_name, folder_name)
    except (LookupError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.post(
    "/customers/{customer_id}/design-filenames",
    response_model=list[str],
    dependencies=[Depends(require_csrf)],
)
def next_customer_design_filenames(
    customer_id: int,
    payload: CustomerDesignNamesPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        return manager.next_customer_design_filenames(customer_id, payload.source_names)
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.post(
    "/customers/{customer_id}/files",
    response_model=CustomerFileResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def upload_customer_file(
    customer_id: int,
    request: Request,
    file: UploadFile = File(...),
    date_name: str = Form(...),
    folder_name: str = Form(...),
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    temporary = None
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        temporary = save_upload_to_temporary(
            file, request.app.state.settings.maximum_upload_mb * 1024 * 1024
        )
        return manager.upload_customer_file(
            customer_id,
            date_name,
            folder_name,
            temporary,
            Path(file.filename or "upload").name,
        )
    except (LookupError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        cloud.close()


def checked_customer_file(manager: CustomerService, customer_id: int, file_id: int):
    details = manager.get_customer(customer_id)
    record = manager.customer_file(file_id)
    if not record.object_key.startswith(f"{details.storage_prefix}/"):
        raise LookupError("Customer file not found")
    return record


@router.get("/customers/{customer_id}/files/{file_id}")
def access_customer_file(
    customer_id: int,
    file_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        record = checked_customer_file(manager, customer_id, file_id)
        cached = Path(record.local_path)
        if cached.is_file():
            return FileResponse(
                cached, media_type=record.content_type, filename=record.original_name
            )
        return RedirectResponse(manager.customer_file_url(file_id), status_code=307)
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.delete(
    "/customers/{customer_id}/files/{file_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def delete_customer_file(
    customer_id: int,
    file_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        checked_customer_file(manager, customer_id, file_id)
        manager.delete_customer_file(file_id)
        return MessageResponse(message="File deleted")
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.post(
    "/customers/files/{file_id}/copy",
    response_model=CustomerFileResponse,
    dependencies=[Depends(require_csrf)],
)
def copy_customer_file(
    file_id: int,
    payload: CustomerFileCopyPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        source = manager.customer_file(file_id)
        if not source.object_key.startswith("customers/"):
            raise LookupError("Customer file not found")
        return manager.copy_customer_file(
            file_id,
            payload.customer_id,
            payload.date_name,
            payload.folder_name,
        )
    except (LookupError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.get("/customer-files/search", response_model=list[CustomerFileResponse])
def search_customer_files(
    request: Request,
    query: str = Query(min_length=1, max_length=160),
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        return manager.search_all_customer_files(query)
    finally:
        cloud.close()


@router.post(
    "/customer-files/search-image",
    response_model=list[CustomerFileResponse],
    dependencies=[Depends(require_csrf)],
)
def search_customer_files_by_image(
    request: Request,
    file: UploadFile = File(...),
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    temporary = None
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        temporary = save_upload_to_temporary(
            file, request.app.state.settings.maximum_upload_mb * 1024 * 1024
        )
        return manager.search_all_customer_images(temporary)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        cloud.close()


@router.get("/customer-files/{file_id}")
def access_any_customer_file(
    file_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.view")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        record = manager.customer_file(file_id)
        if not record.object_key.startswith("customers/"):
            raise LookupError("Customer file not found")
        cached = Path(record.local_path)
        if cached.is_file():
            return FileResponse(
                cached, media_type=record.content_type, filename=record.original_name
            )
        return RedirectResponse(manager.customer_file_url(file_id), status_code=307)
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.delete(
    "/customer-files/{file_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def delete_any_customer_file(
    file_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        record = manager.customer_file(file_id)
        if not record.object_key.startswith("customers/"):
            raise LookupError("Customer file not found")
        manager.delete_customer_file(file_id)
        return MessageResponse(message="File deleted")
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        cloud.close()


@router.post(
    "/customers/{customer_id}/files/{file_id}/replace",
    response_model=CustomerFileResponse,
    dependencies=[Depends(require_csrf)],
)
def replace_customer_file(
    customer_id: int,
    file_id: int,
    request: Request,
    file: UploadFile = File(...),
    context: WebAuthContext = Depends(require_permission("customers.manage")),
):
    temporary = None
    manager, cloud = customer_file_service(request, context.organization_id)
    try:
        checked_customer_file(manager, customer_id, file_id)
        temporary = save_upload_to_temporary(
            file, request.app.state.settings.maximum_upload_mb * 1024 * 1024
        )
        return manager.replace_customer_file(file_id, temporary)
    except (LookupError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        cloud.close()


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(
    request: Request,
    context: WebAuthContext = Depends(require_permission("products.view")),
):
    return [
        CategoryResponse(id=item_id, name=name)
        for item_id, name in product_service(request, context.organization_id).list_categories()
    ]


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_category(
    payload: CategoryPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("products.manage")),
):
    try:
        item_id, name = product_service(request, context.organization_id).create_category(
            payload.name
        )
    except (ValueError, IntegrityError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return CategoryResponse(id=item_id, name=name)


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    request: Request,
    query: str = Query(default="", max_length=160),
    context: WebAuthContext = Depends(require_permission("products.view")),
):
    return product_service(request, context.organization_id).list_products(query)


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_product(
    payload: ProductPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("products.manage")),
):
    try:
        return product_service(request, context.organization_id).create_product(
            ProductInput(**payload.model_dump())
        )
    except (ValueError, IntegrityError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/products/{product_id}/price", response_model=PriceResponse)
def calculate_price(
    product_id: int,
    payload: PriceRequest,
    request: Request,
    context: WebAuthContext = Depends(require_permission("products.view")),
):
    try:
        return product_service(request, context.organization_id).calculate_price(
            product_id, payload.quantity
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/orders", response_model=list[OrderSummaryResponse])
def list_orders(
    request: Request,
    query: str = Query(default="", max_length=160),
    context: WebAuthContext = Depends(require_permission("orders.view")),
):
    return order_service(request, context.organization_id).list_orders(query)


@router.post(
    "/orders",
    response_model=OrderDetailsResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_order(
    payload: OrderPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("orders.manage")),
):
    customers = CustomerRepository(request.app.state.session_factory, context.organization_id)
    if customers.get(payload.customer_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    data = OrderInput(
        customer_id=payload.customer_id,
        items=tuple(OrderItemInput(item.product_id, item.quantity) for item in payload.items),
        order_type=payload.order_type,
        advance=payload.advance,
        due_date=payload.due_date,
        priority=payload.priority,
        notes=payload.notes,
        design_file_ids=payload.design_file_ids,
    )
    try:
        return order_service(request, context.organization_id, context.user_id).create_order(data)
    except (ValueError, LookupError, IntegrityError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/orders/{order_id}", response_model=OrderDetailsResponse)
def get_order(
    order_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("orders.view")),
):
    try:
        return order_service(request, context.organization_id).get_order(order_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch(
    "/orders/{order_id}/status",
    response_model=OrderDetailsResponse,
    dependencies=[Depends(require_csrf)],
)
def change_order_status(
    order_id: int,
    payload: StatusChangePayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("orders.manage")),
):
    try:
        return order_service(request, context.organization_id, context.user_id).change_status(
            order_id, payload.status, payload.note
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
