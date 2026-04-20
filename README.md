# Siriraj Feasibility Study

A clinical data feasibility study using data from Siriraj Hospital (`SiIMC_MGHT` SQL Server / SAP BW).

## Repository Structure

```
.
├── Safe_DataSet.xlsx        # Raw clinical dataset (treat as sensitive)
├── data_dictionary.md       # Data dictionary with ER diagram (Mermaid)
├── data_dictionary.xlsx     # Generated Excel version of the data dictionary
├── mermaid_flow.png         # ER diagram rendered from data_dictionary.md
├── build_artifacts.py       # Script to regenerate .xlsx and .png from .md
└── cohort-app/              # Web app for cohort building and exploration
    ├── backend/             # Python/FastAPI backend
    ├── frontend/            # Next.js frontend
    └── docker-compose.yml
```

## Dataset

`Safe_DataSet.xlsx` contains 6 clinical tables sourced from Siriraj Hospital:

| Table | Domain | Description |
|---|---|---|
| `patient_master` | Clinical | Master patient registry |
| `opd_visit` | Clinical | Outpatient visit records |
| `diagnosis_record` | Clinical | OPD/IPD diagnosis records |
| `ipd_admission` | Clinical | Inpatient admission details |
| `prescription_order` | Pharmacy | OPD/IPD prescription orders |
| `lab_result` | Laboratory | Laboratory test results |

## Regenerating Artifacts

After editing `data_dictionary.md`, regenerate the Excel file and ER diagram:

```bash
pip install openpyxl requests Pillow
python3 build_artifacts.py
```

This produces `data_dictionary.xlsx` and `mermaid_flow.png`.

## Architecture

```
cohort-app/
├── frontend/   Next.js 14 + TypeScript + Tailwind CSS + Zustand (port 3000)
└── backend/    FastAPI + Python 3.11 + pyodbc → SQL Server (port 8000)
```
```
  cohort-app/
  ├── backend/          Python FastAPI — metadata parser, SQL engine, REST API                                                                        
  │   ├── app/                                                                                                                                        
  │   │   ├── metadata/  parser.py (reads data_dictionary.md) + catalog.py                                                                            
  │   │   ├── query/     models.py (Pydantic DSL) + sql_generator.py (T-SQL)                                                                          
  │   │   ├── api/routes/ cohorts.py · concepts.py · metadata.py                                                                                      
  │   │   └── db/        connection.py (pyodbc → SQL Server)                                                                                          
  │   └── examples/use_cases.py    ← 3 researcher examples, no DB needed                                                                              
  └── frontend/         Next.js 14 + Tailwind + Zustand                                                                                               
      └── src/                                                                                                                                        
          ├── store/cohortStore.ts  (global state)                                                                                                    
          ├── lib/types.ts + api.ts (typed API client)                                                                                                
          └── components/                                                                                                                             
              ├── ConceptBrowser/   search ICD / lab / drug                                                                                           
              ├── QueryBuilder/     INCLUDE + EXCLUDE criteria                                                                                        
              ├── FeasibilityPanel/ count button + save                                                                                               
              └── SQLPreview/       generated T-SQL display     
```

**Data flow:** Frontend (Zustand store) → JSON POST → FastAPI → T-SQL → `SiIMC_MGHT` SQL Server.

The frontend and backend share an identical criteria DSL — TypeScript types on the frontend mirror Pydantic models on the backend. The backend dynamically generates T-SQL using `EXISTS` subqueries (one per criterion) anchored to `patient_master`, so every count is always `COUNT(DISTINCT hn)` with no Cartesian product risk.

Cohorts are persisted as JSON files in `backend/saved_cohorts/`. The data dictionary is read from `data_dictionary.md` at startup and served as metadata via API.

## Key Design Decisions

- **EXISTS-based SQL generation** — each criterion becomes an `EXISTS (SELECT 1 FROM … WHERE hn = pm.hn …)` clause rather than a JOIN, preventing row duplication across multi-event tables.
- **Query DSL shared between front and back** — criteria types are defined once on the backend (Pydantic) and mirrored in TypeScript, keeping serialisation round-trips safe.
- **Graceful DB-less mode** — if the database is unreachable, the app still loads, generates SQL, and shows `count = N/A`; no crash.
- **Filesystem cohort storage** — cohorts saved as UUID-named JSON files; no secondary database required for the MVP.
- **Metadata from Markdown** — `data_dictionary.md` is the single source of truth for table/field docs; parsed at startup and served via `/api/metadata/*`.

## 3 Verified Use Cases (SQL confirmed correct)

### 1. Type 2 Diabetes with elevated HbA1c

```sql
SELECT COUNT(DISTINCT pm.hn) AS patient_count
FROM patient_master pm
WHERE
  EXISTS (
    SELECT 1 FROM diagnosis_record dr
    WHERE dr.hn = pm.hn
      AND dr.icd_code LIKE 'E11%'
      AND dr.patient_category = 'OPD'
      AND dr.service_date BETWEEN '2020-01-01' AND '2024-12-31'
  )
  AND EXISTS (
    SELECT 1 FROM lab_result lr
    WHERE lr.hn = pm.hn
      AND lr.test_name LIKE '%HbA1c%'
      AND TRY_CAST(lr.result_value AS FLOAT) > 7.0
      AND lr.test_date BETWEEN '2020-01-01' AND '2024-12-31'
  )
```

### 2. Hypertension on ACE inhibitor/ARB, excluding CKD

```sql
SELECT COUNT(DISTINCT pm.hn) AS patient_count
FROM patient_master pm
WHERE
  EXISTS (
    SELECT 1 FROM diagnosis_record dr
    WHERE dr.hn = pm.hn
      AND dr.icd_code = 'I10'
      AND dr.service_date BETWEEN '2021-01-01' AND '2024-12-31'
  )
  AND EXISTS (
    SELECT 1 FROM prescription_order po
    WHERE po.hn = pm.hn
      AND po.drug_group_name LIKE '%ACE%'
      AND po.order_date BETWEEN '2021-01-01' AND '2024-12-31'
  )
  AND NOT EXISTS (
    SELECT 1 FROM diagnosis_record dr
    WHERE dr.hn = pm.hn
      AND dr.icd_code LIKE 'N18%'
  )
```

### 3. ICD/Diagnosis concept search with patient prevalence

```sql
SELECT DISTINCT TOP 50
    icd_code, disease_name,
    COUNT(DISTINCT hn) AS patient_count
FROM diagnosis_record
WHERE icd_code LIKE 'E11%'
   OR disease_name LIKE '%diabetes%'
GROUP BY icd_code, disease_name
ORDER BY patient_count DESC
```

## How to Run

### With Docker (recommended)

```bash
cd cohort-app
cp backend/.env.example backend/.env
# Edit backend/.env — set DB_SERVER, DB_USER, DB_PASS
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API + docs: http://localhost:8000/api/docs

### Without Docker

```bash
# Backend
cd cohort-app/backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # port 8000

# Frontend (separate terminal)
cd cohort-app/frontend
npm install
npm run dev                          # port 3000
```

### Preview SQL without a database

```bash
cd cohort-app/backend
python examples/use_cases.py         # prints generated SQL for 3 example cohorts
```

The app runs fully in DB-less mode — counts will show N/A but SQL generation and cohort save/load work normally.

## MVP Roadmap (not yet built)

| Area | Gap |
|---|---|
| **Concept Browser** | Demographics, OPD Visit, and IPD Admission search panels exist in the backend but are not wired to the frontend UI (only Diagnosis, Lab, Drug search are live) |
| **Nested criteria groups** | Backend model supports recursive `CriteriaGroup` but the UI only renders flat criteria lists |
| **Lab value range UI** | Backend supports `BETWEEN` / `gt` / `lt` operators for numeric lab results; no UI controls exposed yet |
| **Patient list export** | Feasibility counts only — no way to export actual `hn` lists or patient-level records |
| **Authentication** | No login, no user accounts; anyone with network access can run queries and see all saved cohorts |
| **Query caching** | Every concept search and cohort count re-queries the database |
| **Audit log** | No record of who ran which cohort or when |
| **Cohort versioning** | Saved cohorts are overwrite-only; no edit history |
| **Frontend Dockerfile** | `docker-compose.yml` references a frontend build but no `Dockerfile` exists in `cohort-app/frontend/` |
| **Tests** | No unit or integration tests in backend or frontend |
