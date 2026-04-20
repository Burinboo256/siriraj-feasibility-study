from fastapi import APIRouter, Query

router = APIRouter()

DOMAINS = [
    {"id": "diagnosis",     "label": "Diagnosis (ICD-10/9)", "table": "diagnosis_record"},
    {"id": "lab",           "label": "Laboratory",            "table": "lab_result"},
    {"id": "prescription",  "label": "Medication / Pharmacy", "table": "prescription_order"},
    {"id": "demographics",  "label": "Demographics",          "table": "patient_master"},
    {"id": "opd_visit",     "label": "OPD Visit",             "table": "opd_visit"},
    {"id": "ipd_admission", "label": "IPD Admission",         "table": "ipd_admission"},
]


@router.get("/domains")
def list_domains():
    return DOMAINS


@router.get("/icd")
def search_icd(
    q: str = Query("", description="ICD code prefix or disease name substring"),
    limit: int = 50,
):
    try:
        from ...db.connection import execute_query
        sql = f"""
        SELECT DISTINCT TOP {limit}
            icd_code, disease_name,
            COUNT(DISTINCT hn) AS patient_count
        FROM diagnosis_record
        WHERE icd_code LIKE '{q}%'
           OR disease_name LIKE '%{q}%'
        GROUP BY icd_code, disease_name
        ORDER BY patient_count DESC
        """
        return execute_query(sql)
    except Exception:
        return []


@router.get("/labs")
def search_labs(
    q: str = Query("", description="Test code prefix or test name substring"),
    limit: int = 50,
):
    try:
        from ...db.connection import execute_query
        sql = f"""
        SELECT DISTINCT TOP {limit}
            test_code, test_name, test_group_code, test_group_name,
            result_unit, COUNT(DISTINCT hn) AS patient_count
        FROM lab_result
        WHERE test_code LIKE '{q}%'
           OR test_name LIKE '%{q}%'
        GROUP BY test_code, test_name, test_group_code, test_group_name, result_unit
        ORDER BY patient_count DESC
        """
        return execute_query(sql)
    except Exception:
        return []


@router.get("/drugs")
def search_drugs(
    q: str = Query("", description="Drug code, name, or group name substring"),
    limit: int = 50,
):
    try:
        from ...db.connection import execute_query
        sql = f"""
        SELECT DISTINCT TOP {limit}
            drug_code, drug_name, drug_group_code, drug_group_name,
            COUNT(DISTINCT hn) AS patient_count
        FROM prescription_order
        WHERE drug_code LIKE '{q}%'
           OR drug_name LIKE '%{q}%'
           OR drug_group_name LIKE '%{q}%'
        GROUP BY drug_code, drug_name, drug_group_code, drug_group_name
        ORDER BY patient_count DESC
        """
        return execute_query(sql)
    except Exception:
        return []


@router.get("/clinics")
def list_clinics():
    try:
        from ...db.connection import execute_query
        sql = """
        SELECT DISTINCT clinic_code, clinic_name, COUNT(DISTINCT hn) AS patient_count
        FROM opd_visit
        GROUP BY clinic_code, clinic_name
        ORDER BY patient_count DESC
        """
        return execute_query(sql)
    except Exception:
        return []


@router.get("/wards")
def list_wards():
    try:
        from ...db.connection import execute_query
        sql = """
        SELECT DISTINCT ward_code, ward_name, COUNT(DISTINCT hn) AS patient_count
        FROM ipd_admission
        GROUP BY ward_code, ward_name
        ORDER BY patient_count DESC
        """
        return execute_query(sql)
    except Exception:
        return []
