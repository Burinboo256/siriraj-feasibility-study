import json
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ...query.models import (
    CohortCountRequest,
    CohortCountResponse,
    CohortDefinition,
)
from ...query.sql_generator import sql_generator

router = APIRouter()

COHORTS_DIR = Path(__file__).parent.parent.parent.parent / "saved_cohorts"
COHORTS_DIR.mkdir(exist_ok=True)


@router.post("/sql")
def generate_sql(request: CohortCountRequest):
    """Return generated SQL without executing it."""
    sql = sql_generator.generate_count(request.definition)
    return {"sql": sql}


@router.post("/count", response_model=CohortCountResponse)
def count_cohort(request: CohortCountRequest):
    """Execute cohort query and return patient count. Falls back to SQL-only if DB unavailable."""
    sql = sql_generator.generate_count(request.definition)

    try:
        from ...db.connection import execute_query
        t0 = time.time()
        rows = execute_query(sql)
        elapsed = (time.time() - t0) * 1000
        count = rows[0]["patient_count"] if rows else 0
        return CohortCountResponse(count=count, sql=sql, execution_time_ms=round(elapsed, 1))
    except Exception:
        return CohortCountResponse(count=-1, sql=sql, execution_time_ms=None)


@router.post("/save")
def save_cohort(definition: CohortDefinition):
    cohort_id = str(uuid.uuid4())[:8]
    (COHORTS_DIR / f"{cohort_id}.json").write_text(
        definition.model_dump_json(indent=2), encoding="utf-8"
    )
    return {"id": cohort_id, "name": definition.name}


@router.get("")
def list_cohorts():
    cohorts = []
    for f in sorted(COHORTS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        data = json.loads(f.read_text(encoding="utf-8"))
        cohorts.append({
            "id": f.stem,
            "name": data.get("name", ""),
            "description": data.get("description", ""),
        })
    return cohorts


@router.get("/{cohort_id}")
def get_cohort(cohort_id: str):
    path = COHORTS_DIR / f"{cohort_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Cohort not found")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/{cohort_id}/export")
def export_cohort(cohort_id: str):
    path = COHORTS_DIR / f"{cohort_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Cohort not found")
    definition_dict = json.loads(path.read_text(encoding="utf-8"))
    definition = CohortDefinition(**definition_dict)
    sql = sql_generator.generate_count(definition)
    return {"definition": definition_dict, "sql": sql}
