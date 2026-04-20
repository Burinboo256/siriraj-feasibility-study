from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List, Literal, Union
from datetime import date


class DateRange(BaseModel):
    start: Optional[date] = None
    end: Optional[date] = None


class NumericFilter(BaseModel):
    op: Literal["gt", "gte", "lt", "lte", "eq", "between"]
    value: float
    value2: Optional[float] = None  # used only when op == "between"


class DiagnosisCriterion(BaseModel):
    domain: Literal["diagnosis"] = "diagnosis"
    label: Optional[str] = None
    icd_codes: List[str] = []        # exact ICD codes
    icd_prefix: Optional[str] = None  # e.g. "E11" matches E11.*
    patient_category: Optional[Literal["OPD", "IPD"]] = None
    diagnosis_type: Optional[str] = None  # O=Original, T=Transfer, D=Discharge
    date_range: Optional[DateRange] = None


class LabCriterion(BaseModel):
    domain: Literal["lab"] = "lab"
    label: Optional[str] = None
    test_codes: List[str] = []
    test_name_contains: Optional[str] = None
    result_value: Optional[NumericFilter] = None
    date_range: Optional[DateRange] = None


class PrescriptionCriterion(BaseModel):
    domain: Literal["prescription"] = "prescription"
    label: Optional[str] = None
    drug_codes: List[str] = []
    drug_name_contains: Optional[str] = None
    drug_group_codes: List[str] = []
    drug_group_name_contains: Optional[str] = None
    service_type: Optional[str] = None  # OPD / IPD / eHIS
    date_range: Optional[DateRange] = None


class DemographicsCriterion(BaseModel):
    domain: Literal["demographics"] = "demographics"
    label: Optional[str] = None
    sex_codes: List[str] = []
    patient_type_codes: List[str] = []
    race_names: List[str] = []


class OPDVisitCriterion(BaseModel):
    domain: Literal["opd_visit"] = "opd_visit"
    label: Optional[str] = None
    clinic_codes: List[str] = []
    dept_codes: List[str] = []
    date_range: Optional[DateRange] = None


class IPDAdmissionCriterion(BaseModel):
    domain: Literal["ipd_admission"] = "ipd_admission"
    label: Optional[str] = None
    ward_codes: List[str] = []
    dept_codes: List[str] = []
    discharge_status: Optional[str] = None
    min_los: Optional[int] = None
    max_los: Optional[int] = None
    date_range: Optional[DateRange] = None


AnyCriterion = Union[
    DiagnosisCriterion,
    LabCriterion,
    PrescriptionCriterion,
    DemographicsCriterion,
    OPDVisitCriterion,
    IPDAdmissionCriterion,
]


class CriteriaGroup(BaseModel):
    operator: Literal["AND", "OR"] = "AND"
    negate: bool = False  # wraps the whole group in NOT(...)
    criteria: List[Union[CriteriaGroup, AnyCriterion]]


CriteriaGroup.model_rebuild()


class CohortDefinition(BaseModel):
    name: str
    description: Optional[str] = None
    include: CriteriaGroup
    exclude: Optional[CriteriaGroup] = None


class CohortCountRequest(BaseModel):
    definition: CohortDefinition


class CohortCountResponse(BaseModel):
    count: int
    sql: str
    execution_time_ms: Optional[float] = None
