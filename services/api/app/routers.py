from fastapi import APIRouter

from services.api.app.modules.approvals.routes import router as approvals_router
from services.api.app.modules.auth.routes import router as auth_router
from services.api.app.modules.courier.routes import router as courier_router
from services.api.app.modules.customers.routes import router as customers_router
from services.api.app.modules.designs.routes import router as designs_router
from services.api.app.modules.erp.routes import router as erp_router
from services.api.app.modules.invoices.routes import router as invoices_router
from services.api.app.modules.machines.routes import router as machines_router
from services.api.app.modules.messages.routes import router as messages_router
from services.api.app.modules.notifications.routes import router as notifications_router
from services.api.app.modules.orders.routes import router as orders_router
from services.api.app.modules.packing.routes import router as packing_router
from services.api.app.modules.payments.routes import router as payments_router
from services.api.app.modules.production.routes import router as production_router
from services.api.app.modules.qc.routes import router as qc_router
from services.api.app.modules.reprints.routes import router as reprints_router
from services.api.app.modules.suppliers.routes import router as suppliers_router
from services.api.app.modules.support.routes import router as support_router
from services.api.app.modules.waste.routes import router as waste_router

api_router = APIRouter()
api_router.include_router(approvals_router, prefix="/approvals", tags=["approvals"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(courier_router, prefix="/courier", tags=["courier"])
api_router.include_router(customers_router, prefix="/customers", tags=["customers"])
api_router.include_router(designs_router, prefix="/designs", tags=["designs"])
api_router.include_router(erp_router, prefix="/erp", tags=["erp"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
api_router.include_router(machines_router, prefix="/machines", tags=["machines"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(packing_router, prefix="/packing", tags=["packing"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(production_router, prefix="/production", tags=["production"])
api_router.include_router(qc_router, prefix="/qc", tags=["qc"])
api_router.include_router(reprints_router, prefix="/reprints", tags=["reprints"])
api_router.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(support_router, prefix="/support", tags=["support"])
api_router.include_router(waste_router, prefix="/waste", tags=["waste"])
