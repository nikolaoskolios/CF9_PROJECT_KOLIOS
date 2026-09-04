# DeathStarTestDataApp

FastAPI + SQLite backend that receives, hosts, and disseminates test data from
the Death Star development project. Modeled on the TodoApp course template
(`BACKEND_TEMPLATE`), with `Todos` swapped for `TestResults`.

## Structure

```
DeathStarTestDataApp/
├── __init__.py
├── main.py               # FastAPI app, table creation, router registration
├── database.py            # SQLAlchemy engine/session (sqlite:///./deathstartestdata.db)
├── models.py               # Users, TestResults ORM models
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/          # empty; initial schema comes from Base.metadata.create_all
├── routers/
│   ├── auth.py             # /auth — register, JWT login
│   ├── test_results.py     # /test-results — CRUD, scoped to the calling user
│   ├── admin.py             # /admin — admin-only view/delete across all test results
│   └── users.py             # /user — profile, password, phone number
└── test/
    ├── utils.py            # test DB, dependency overrides, fixtures
    ├── test_main.py
    ├── test_auth.py
    ├── test_test_results.py
    ├── test_admin.py
    └── test_users.py
```

## Data model

- **Users** — same shape as the TodoApp template: id, email, username,
  first_name, last_name, hashed_password, is_active, role, phone_number.
- **TestResults** — one row per subsystem test run against a given Death Star
  build, matching the columns in `../TestData.csv`:
  - `build` (e.g. `death_star_iter_139.001`)
  - `test_name` (e.g. `Superlaser_Concentration_Static_Check`)
  - `test_date`
  - `result_percentage` — nullable float (0–100); `null` represents the
    source data's `n/a`
  - `notes`
  - `owner_id` — FK to the user who submitted the result

## Running it

```bash
cd DeathStarTestDataApp
pip install -r ../requirements.txt
uvicorn main:app --reload
```

Docs at `http://127.0.0.1:8000/docs`.

## Running the tests

```bash
cd DeathStarTestDataApp
pytest -v
```

## Alembic

Initial tables are created by `Base.metadata.create_all()` in `main.py`, same
as the template. Use Alembic for schema changes after that:

```bash
cd DeathStarTestDataApp
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```
