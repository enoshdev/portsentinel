from fastapi import APIRouter
from backend.app.routes.health import router as health_router
from backend.app.routes.dashboard import router as dashboard_router
from backend.app.routes.ips import router as ips_router
from backend.app.routes.logs import router as logs_router
from backend.app.routes.risk import router as risk_router
from backend.app.routes.firewall import router as firewall_router
from backend.app.routes.demo import router as demo_router
from backend.app.routes.monitoring import router as monitoring_router
from backend.app.routes.testing import router as testing_router
from backend.app.routes.websocket import router as websocket_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(ips_router)
api_router.include_router(logs_router)
api_router.include_router(risk_router)
api_router.include_router(firewall_router)
api_router.include_router(demo_router)
api_router.include_router(monitoring_router)
api_router.include_router(testing_router)
api_router.include_router(websocket_router)

__all__ = ["api_router", "websocket_router"]
