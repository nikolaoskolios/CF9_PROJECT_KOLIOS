from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .models import Base
from .database import engine
from .routers import auth, test_results, admin, users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
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
