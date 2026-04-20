import pathlib
from fastapi import APIRouter, HTTPException
from ...metadata.parser import parse_data_dictionary

router = APIRouter()

_DATA_DICT = pathlib.Path(__file__).parent.parent.parent.parent.parent.parent / "data_dictionary.md"


def _load():
    return parse_data_dictionary(_DATA_DICT)


@router.get("/tables")
def list_tables():
    return _load()["index"]


@router.get("/tables/{table_name}")
def get_table(table_name: str):
    tables = _load()["tables"]
    if table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")
    return tables[table_name]
