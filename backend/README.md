# Backend

## Database migrations

Alembic now manages schema changes for the FastAPI backend. Migration metadata is loaded from `app.core.database.Base.metadata`, and `app.models` imports only the active mapped models used by the current auth and transaction features.

### Install dependencies

```bash
pip install -r requirements.txt
```

### Create a new migration

```bash
alembic revision --autogenerate -m "message"
```

### Apply migrations

```bash
alembic upgrade head
```

### Inspect migration state

```bash
alembic current
alembic history
```

### Development reset

Only use this for local development on disposable data. If your dev database already contains `users` and `transactions` and you want Alembic to recreate them from scratch, drop the tables first and then re-run the migrations.

```sql
DROP TABLE transactions;
DROP TABLE users;
```

```bash
alembic upgrade head
```

If the existing database schema already matches the initial migration, use `alembic stamp head` instead of dropping tables so Alembic records the current state without destroying data.
