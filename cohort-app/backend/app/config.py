import pathlib
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_DRIVER: str = "ODBC Driver 17 for SQL Server"
    DB_SERVER: str = "localhost"
    DB_NAME: str = "SiIMC_MGHT"
    DB_USER: str = ""
    DB_PASS: str = ""
    DATA_DICT_PATH: str = str(
        pathlib.Path(__file__).parent.parent.parent.parent / "data_dictionary.md"
    )

    class Config:
        env_file = ".env"


settings = Settings()
