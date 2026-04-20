"""
SQL generation engine for cohort definitions.
Produces T-SQL (SQL Server) COUNT queries using EXISTS subqueries.
All patient counts are DISTINCT on patient_master.hn — no raw records are returned.
"""
from __future__ import annotations
from typing import List, Union
from .models import (
    CohortDefinition,
    CriteriaGroup,
    AnyCriterion,
    DiagnosisCriterion,
    LabCriterion,
    PrescriptionCriterion,
    DemographicsCriterion,
    OPDVisitCriterion,
    IPDAdmissionCriterion,
    NumericFilter,
    DateRange,
)


class SQLGenerator:

    def generate_count(self, definition: CohortDefinition) -> str:
        include_sql = self._group_to_sql(definition.include, pm="pm")
        exclude_sql = (
            self._group_to_sql(definition.exclude, pm="pm")
            if definition.exclude
            else None
        )

        where_parts: List[str] = []
        if include_sql:
            where_parts.append(include_sql)
        if exclude_sql:
            where_parts.append(f"NOT (\n    {exclude_sql}\n  )")

        where_clause = "\n  AND ".join(where_parts) if where_parts else "1=1"

        return (
            f"-- Cohort: {definition.name}\n"
            f"SELECT COUNT(DISTINCT pm.hn) AS patient_count\n"
            f"FROM patient_master pm\n"
            f"WHERE\n  {where_clause}"
        )

    # ── Group ────────────────────────────────────────────────────────────────

    def _group_to_sql(self, group: CriteriaGroup, pm: str) -> str:
        parts: List[str] = []
        for item in group.criteria:
            if isinstance(item, CriteriaGroup):
                sub = self._group_to_sql(item, pm)
                if sub:
                    inner = f"(\n    {sub}\n  )"
                    parts.append(f"NOT {inner}" if item.negate else inner)
            else:
                sub = self._criterion_to_sql(item, pm)
                if sub:
                    parts.append(sub)

        if not parts:
            return ""

        joiner = f"\n  {group.operator} "
        result = joiner.join(parts)
        return f"NOT (\n  {result}\n)" if group.negate else result

    # ── Dispatch ─────────────────────────────────────────────────────────────

    def _criterion_to_sql(self, c: AnyCriterion, pm: str) -> str:
        if isinstance(c, DiagnosisCriterion):
            return self._diagnosis(c, pm)
        if isinstance(c, LabCriterion):
            return self._lab(c, pm)
        if isinstance(c, PrescriptionCriterion):
            return self._prescription(c, pm)
        if isinstance(c, DemographicsCriterion):
            return self._demographics(c, pm)
        if isinstance(c, OPDVisitCriterion):
            return self._opd_visit(c, pm)
        if isinstance(c, IPDAdmissionCriterion):
            return self._ipd_admission(c, pm)
        return ""

    # ── Domain handlers ───────────────────────────────────────────────────────

    def _diagnosis(self, c: DiagnosisCriterion, pm: str) -> str:
        conds = [f"dr.hn = {pm}.hn"]

        if c.icd_codes:
            code_filters = [
                f"dr.icd_code LIKE '{code.rstrip('%')}%'"
                if (code.endswith("%") or len(code) <= 3)
                else f"dr.icd_code = '{code}'"
                for code in c.icd_codes
            ]
            conds.append(f"({' OR '.join(code_filters)})")

        if c.icd_prefix:
            conds.append(f"dr.icd_code LIKE '{c.icd_prefix}%'")

        if c.patient_category:
            conds.append(f"dr.patient_category = '{c.patient_category}'")

        if c.diagnosis_type:
            conds.append(f"dr.diagnosis_type = '{c.diagnosis_type}'")

        if c.date_range:
            conds += self._date_range("dr.service_date", c.date_range)

        return self._exists("diagnosis_record dr", conds, c.label or "Diagnosis")

    def _lab(self, c: LabCriterion, pm: str) -> str:
        conds = [f"lr.hn = {pm}.hn"]

        if c.test_codes:
            conds.append(f"lr.test_code IN ({self._in_list(c.test_codes)})")

        if c.test_name_contains:
            conds.append(f"lr.test_name LIKE '%{c.test_name_contains}%'")

        if c.result_value:
            conds.append(
                self._numeric("TRY_CAST(lr.result_value AS FLOAT)", c.result_value)
            )

        if c.date_range:
            conds += self._date_range("lr.test_date", c.date_range)

        return self._exists("lab_result lr", conds, c.label or "Lab result")

    def _prescription(self, c: PrescriptionCriterion, pm: str) -> str:
        conds = [f"po.hn = {pm}.hn"]

        if c.drug_codes:
            conds.append(f"po.drug_code IN ({self._in_list(c.drug_codes)})")

        if c.drug_name_contains:
            conds.append(f"po.drug_name LIKE '%{c.drug_name_contains}%'")

        if c.drug_group_codes:
            conds.append(f"po.drug_group_code IN ({self._in_list(c.drug_group_codes)})")

        if c.drug_group_name_contains:
            conds.append(f"po.drug_group_name LIKE '%{c.drug_group_name_contains}%'")

        if c.service_type:
            conds.append(f"po.service_type = '{c.service_type}'")

        if c.date_range:
            conds += self._date_range("po.order_date", c.date_range)

        return self._exists("prescription_order po", conds, c.label or "Prescription")

    def _demographics(self, c: DemographicsCriterion, pm: str) -> str:
        parts: List[str] = []

        if c.sex_codes:
            parts.append(f"{pm}.sex_code IN ({self._in_list(c.sex_codes)})")

        if c.patient_type_codes:
            parts.append(
                f"{pm}.patient_type_code IN ({self._in_list(c.patient_type_codes)})"
            )

        if c.race_names:
            parts.append(f"{pm}.race_name IN ({self._in_list(c.race_names)})")

        if not parts:
            return ""

        label = c.label or "Demographics"
        return f"-- {label}\n  " + "\n  AND ".join(parts)

    def _opd_visit(self, c: OPDVisitCriterion, pm: str) -> str:
        conds = [f"ov.hn = {pm}.hn"]

        if c.clinic_codes:
            conds.append(f"ov.clinic_code IN ({self._in_list(c.clinic_codes)})")

        if c.dept_codes:
            conds.append(f"ov.dept_code IN ({self._in_list(c.dept_codes)})")

        if c.date_range:
            conds += self._date_range("ov.visit_date", c.date_range)

        return self._exists("opd_visit ov", conds, c.label or "OPD visit")

    def _ipd_admission(self, c: IPDAdmissionCriterion, pm: str) -> str:
        conds = [f"ia.hn = {pm}.hn"]

        if c.ward_codes:
            conds.append(f"ia.ward_code IN ({self._in_list(c.ward_codes)})")

        if c.dept_codes:
            conds.append(f"ia.dept_code IN ({self._in_list(c.dept_codes)})")

        if c.discharge_status:
            conds.append(f"ia.discharge_status = '{c.discharge_status}'")

        if c.min_los is not None:
            conds.append(f"ia.length_of_stay >= {c.min_los}")

        if c.max_los is not None:
            conds.append(f"ia.length_of_stay <= {c.max_los}")

        if c.date_range:
            conds += self._date_range("ia.admission_date", c.date_range)

        return self._exists("ipd_admission ia", conds, c.label or "IPD admission")

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _exists(table: str, conditions: List[str], label: str) -> str:
        where = "\n      AND ".join(conditions)
        return (
            f"-- {label}\n"
            f"  EXISTS (\n"
            f"    SELECT 1 FROM {table}\n"
            f"    WHERE {where}\n"
            f"  )"
        )

    @staticmethod
    def _date_range(field: str, dr: DateRange) -> List[str]:
        parts = []
        if dr.start:
            parts.append(f"{field} >= '{dr.start}'")
        if dr.end:
            parts.append(f"{field} <= '{dr.end}'")
        return parts

    @staticmethod
    def _numeric(field: str, f: NumericFilter) -> str:
        ops = {"gt": ">", "gte": ">=", "lt": "<", "lte": "<=", "eq": "="}
        if f.op == "between":
            return f"{field} BETWEEN {f.value} AND {f.value2}"
        return f"{field} {ops[f.op]} {f.value}"

    @staticmethod
    def _in_list(values: List[str]) -> str:
        return ", ".join(f"'{v}'" for v in values)


sql_generator = SQLGenerator()
