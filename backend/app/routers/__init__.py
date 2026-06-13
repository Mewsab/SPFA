from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.budgets import router as budgets_router
from app.routers.insights import router as insights_router
from app.routers.imports import router as imports_router
from app.routers.investments import router as investments_router
from app.routers.transactions import router as transactions_router

__all__ = [
    "admin_router",
    "auth_router",
    "budgets_router",
    "imports_router",
    "investments_router",
    "insights_router",
    "transactions_router",
]
