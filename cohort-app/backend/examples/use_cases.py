"""
Three researcher use-case examples. Run this file directly to print generated SQL.
No database connection required.

  python3 examples/use_cases.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from app.query.models import (
    CohortDefinition, CriteriaGroup,
    DiagnosisCriterion, LabCriterion, PrescriptionCriterion,
    IPDAdmissionCriterion, OPDVisitCriterion,
    DateRange, NumericFilter,
)
from app.query.sql_generator import sql_generator

# ── Use Case 1: Diabetes patients with HbA1c > 7 ────────────────────────────

uc1 = CohortDefinition(
    name="Diabetes cohort with HbA1c > 7",
    description=(
        "Patients diagnosed with Type 2 Diabetes (E11.*) who have at least one "
        "HbA1c lab result > 7%, between 2020-2024."
    ),
    include=CriteriaGroup(
        operator="AND",
        criteria=[
            DiagnosisCriterion(
                label="Type 2 Diabetes (E11.*)",
                icd_prefix="E11",
                patient_category="OPD",
                date_range=DateRange(start="2020-01-01", end="2024-12-31"),
            ),
            LabCriterion(
                label="HbA1c > 7%",
                test_name_contains="HbA1c",
                result_value=NumericFilter(op="gt", value=7.0),
                date_range=DateRange(start="2020-01-01", end="2024-12-31"),
            ),
        ],
    ),
)

# ── Use Case 2: Hypertension + specific antihypertensive exposure ─────────

uc2 = CohortDefinition(
    name="Hypertension with ACE inhibitor exposure",
    description=(
        "Patients with hypertension (ICD I10) who received at least one prescription "
        "of an ACE inhibitor or ARB within the same period."
    ),
    include=CriteriaGroup(
        operator="AND",
        criteria=[
            DiagnosisCriterion(
                label="Hypertension (I10)",
                icd_codes=["I10"],
                date_range=DateRange(start="2021-01-01", end="2024-12-31"),
            ),
            PrescriptionCriterion(
                label="ACE inhibitor / ARB (group name)",
                drug_group_name_contains="ACE",
                date_range=DateRange(start="2021-01-01", end="2024-12-31"),
            ),
        ],
    ),
    exclude=CriteriaGroup(
        operator="OR",
        criteria=[
            DiagnosisCriterion(
                label="Exclude: Chronic Kidney Disease (N18.*)",
                icd_prefix="N18",
            ),
        ],
    ),
)

# ── Use Case 3: Fracture patients with follow-up OPD visit within 6 months ──

uc3 = CohortDefinition(
    name="Fracture patients with 6-month follow-up",
    description=(
        "IPD patients admitted for a fracture (ICD S-codes) between 2019-2023 "
        "who returned for an OPD follow-up visit within the next 6 months."
    ),
    include=CriteriaGroup(
        operator="AND",
        criteria=[
            IPDAdmissionCriterion(
                label="IPD admission: any fracture (ICD S-codes)",
                date_range=DateRange(start="2019-01-01", end="2023-12-31"),
            ),
            DiagnosisCriterion(
                label="Fracture diagnosis (S-codes, IPD)",
                icd_prefix="S",
                patient_category="IPD",
            ),
            OPDVisitCriterion(
                label="Follow-up OPD visit (proxy: any visit post-admission)",
                date_range=DateRange(start="2019-01-01", end="2024-06-30"),
            ),
        ],
    ),
)

# ── Print all ─────────────────────────────────────────────────────────────────

for uc in [uc1, uc2, uc3]:
    print(f"\n{'='*70}")
    print(f"  {uc.name}")
    print(f"  {uc.description}")
    print(f"{'='*70}")
    print(sql_generator.generate_count(uc))
    print()
