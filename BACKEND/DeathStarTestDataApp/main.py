import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .models import Base
from .database import engine
from .rate_limit import limiter
from .routers import auth, test_results, admin, users

# Explicit path (rather than relying on cwd), same as auth.py - this call is
# idempotent, so it's harmless that auth.py's import above already did it.
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configurable per-environment (see .env) rather than hardcoded, so a real
# deployment just sets its actual frontend domain(s) without a code change.
cors_origins = [origin.strip() for origin in os.environ['CORS_ORIGINS'].split(',')]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

Base.metadata.create_all(bind=engine)

# Static, downloadable assets (e.g. the API client toolkit zip) - not
# per-request generated content, so a plain file mount is enough; no
# dedicated endpoint needed.
DOWNLOADS_DIR = Path(__file__).resolve().parent.parent / 'downloads'
app.mount('/downloads', StaticFiles(directory=DOWNLOADS_DIR), name='downloads')


@app.get("/healthy")
def health_check():
    return {'status': 'Healthy'}


app.include_router(auth.router)
app.include_router(test_results.router)
app.include_router(admin.router)
app.include_router(users.router)
