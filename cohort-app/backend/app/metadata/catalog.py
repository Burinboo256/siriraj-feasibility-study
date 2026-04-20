import pathlib
from .parser import parse_data_dictionary

_catalog = None
_DATA_DICT = pathlib.Path(__file__).parent.parent.parent.parent.parent / "data_dictionary.md"


def get_catalog() -> dict:
    global _catalog
    if _catalog is None:
        _catalog = parse_data_dictionary(_DATA_DICT)
    return _catalog
