from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import (
    admin_router,
    auth_router,
    budgets_router,
    imports_router,
    insights_router,
    investments_router,
    transactions_router,
)
import app.models  # Ensures ORM models are registered with SQLAlchemy metadata.

# Only for local fallback, Alembic migrations would be used in production to manage schema changes.
if settings.AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Personal Finance Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(transactions_router)
app.include_router(budgets_router)
app.include_router(imports_router)
app.include_router(insights_router)
app.include_router(investments_router)

@app.get("/")
def root():
    return {"message": "Welcome to the Smart Personal Finance Assistant API!"}
