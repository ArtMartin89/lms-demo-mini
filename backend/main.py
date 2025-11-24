from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import engine, Base
from app.routers import auth, courses, modules, lessons, tests, progress, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LMS MVP API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(courses.router, prefix="/api/v1", tags=["courses"])
app.include_router(modules.router, prefix="/api/v1", tags=["modules"])
app.include_router(lessons.router, prefix="/api/v1", tags=["lessons"])
app.include_router(tests.router, prefix="/api/v1", tags=["tests"])
app.include_router(progress.router, prefix="/api/v1", tags=["progress"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

