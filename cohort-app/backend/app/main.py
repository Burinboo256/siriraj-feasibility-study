from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import cohorts, concepts, metadata

app = FastAPI(
    title="Siriraj Cohort Discovery API",
    description="Feasibility study & cohort builder for Siriraj Hospital clinical data",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cohorts.router,   prefix="/api/v1/cohorts",   tags=["Cohorts"])
app.include_router(concepts.router,  prefix="/api/v1/concepts",  tags=["Concepts"])
app.include_router(metadata.router,  prefix="/api/v1/metadata",  tags=["Metadata"])


@app.get("/api/v1/health", tags=["System"])
def health():
    return {"status": "ok"}
