# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clinical data feasibility study for Siriraj Hospital. The repo contains:
- A raw clinical dataset (`Safe_DataSet.xlsx`) from `SiIMC_MGHT` (SQL Server / SAP BW)
- A data dictionary and ER diagram (`data_dictionary.md`, generated artifacts)
- A full-stack cohort-builder web app (`cohort-app/`)

## Data

- `Safe_DataSet.xlsx` — main dataset, 6 clinical tables. Treat as sensitive clinical/research data.
- `data_dictionary.md` — single source of truth for table/field documentation and the Mermaid ER diagram. Edit this file, then run `build_artifacts.py` to regenerate `data_dictionary.xlsx` and `mermaid_flow.png`.

### Tables

| Table | Domain |
|---|---|
| `patient_master` | Clinical — patient registry |
| `opd_visit` | Clinical — outpatient visits |
| `diagnosis_record` | Clinical — OPD/IPD diagnoses (ICD-10) |
| `ipd_admission` | Clinical — inpatient admissions |
| `prescription_order` | Pharmacy — OPD/IPD drug orders |
| `lab_result` | Laboratory — test results |

## Cohort App (`cohort-app/`)

Full-stack web app for building patient cohort queries and running feasibility counts.

**Stack:** Next.js 14 + TypeScript + Tailwind + Zustand (frontend, port 3000) → FastAPI + Python 3.11 + pyodbc (backend, port 8000) → SQL Server `SiIMC_MGHT`.

**Key architectural facts:**
- SQL is generated as T-SQL using `EXISTS` subqueries anchored to `patient_master`; always counts `DISTINCT hn`. Never uses JOINs across event tables.
- The criteria DSL (TypeScript types on frontend, Pydantic models on backend) is kept in sync manually — changes to one side must be mirrored to the other.
- Cohorts are persisted as JSON files in `backend/saved_cohorts/`. No secondary database.
- `data_dictionary.md` is parsed at backend startup and served as metadata via `/api/metadata/*`.
- App runs in DB-less mode — if SQL Server is unreachable, SQL generation and cohort save/load still work; counts show N/A.

**Known gaps (not yet built):**
- Frontend search panels for Demographics, OPD Visit, and IPD Admission (backend routes exist, UI not wired)
- Nested criteria group UI
- Patient list export (counts only today)
- Authentication / audit log
- Tests (none exist)
- Frontend `Dockerfile` is missing

## Artifact Generation

```bash
pip install openpyxl requests Pillow
python3 build_artifacts.py
```

Reads `data_dictionary.md` → writes `data_dictionary.xlsx` and `mermaid_flow.png`.
