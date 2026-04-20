// ── Query DSL (mirrors backend Pydantic models) ──────────────────────────────

export type DateRange = { start?: string; end?: string };

export type NumericOp = "gt" | "gte" | "lt" | "lte" | "eq" | "between";
export type NumericFilter = { op: NumericOp; value: number; value2?: number };

export type DiagnosisCriterion = {
  domain: "diagnosis";
  label?: string;
  icd_codes?: string[];
  icd_prefix?: string;
  patient_category?: "OPD" | "IPD";
  diagnosis_type?: string;
  date_range?: DateRange;
};

export type LabCriterion = {
  domain: "lab";
  label?: string;
  test_codes?: string[];
  test_name_contains?: string;
  result_value?: NumericFilter;
  date_range?: DateRange;
};

export type PrescriptionCriterion = {
  domain: "prescription";
  label?: string;
  drug_codes?: string[];
  drug_name_contains?: string;
  drug_group_codes?: string[];
  drug_group_name_contains?: string;
  service_type?: string;
  date_range?: DateRange;
};

export type DemographicsCriterion = {
  domain: "demographics";
  label?: string;
  sex_codes?: string[];
  patient_type_codes?: string[];
  race_names?: string[];
};

export type OPDVisitCriterion = {
  domain: "opd_visit";
  label?: string;
  clinic_codes?: string[];
  dept_codes?: string[];
  date_range?: DateRange;
};

export type IPDAdmissionCriterion = {
  domain: "ipd_admission";
  label?: string;
  ward_codes?: string[];
  dept_codes?: string[];
  discharge_status?: string;
  min_los?: number;
  max_los?: number;
  date_range?: DateRange;
};

export type AnyCriterion =
  | DiagnosisCriterion
  | LabCriterion
  | PrescriptionCriterion
  | DemographicsCriterion
  | OPDVisitCriterion
  | IPDAdmissionCriterion;

export type CriteriaGroup = {
  operator: "AND" | "OR";
  negate?: boolean;
  criteria: (CriteriaGroup | AnyCriterion)[];
};

export type CohortDefinition = {
  name: string;
  description?: string;
  include: CriteriaGroup;
  exclude?: CriteriaGroup;
};

// ── API responses ────────────────────────────────────────────────────────────

export type CohortCountResponse = {
  count: number;
  sql: string;
  execution_time_ms?: number;
};

export type SavedCohort = {
  id: string;
  name: string;
  description?: string;
};

export type Domain = {
  id: string;
  label: string;
  table: string;
};

export type ICDConcept = {
  icd_code: string;
  disease_name: string;
  patient_count: number;
};

export type LabConcept = {
  test_code: string;
  test_name: string;
  test_group_name: string;
  result_unit: string;
  patient_count: number;
};

export type DrugConcept = {
  drug_code: string;
  drug_name: string;
  drug_group_name: string;
  patient_count: number;
};
