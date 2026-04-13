from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "sqlserver"
    db_port: int = 1433
    db_name: str = "CBBikes"
    db_user: str = "sa"
    db_password: str = "CBBikes2026!"
    db_driver: str = "ODBC Driver 18 for SQL Server"
    app_port: int = 8000
    app_host: str = "0.0.0.0"

    @property
    def connection_string(self) -> str:
        return (
            f"DRIVER={{{self.db_driver}}};"
            f"SERVER={self.db_host},{self.db_port};"
            f"DATABASE={self.db_name};"
            f"UID={self.db_user};"
            f"PWD={self.db_password};"
            f"TrustServerCertificate=yes;"
        )


settings = Settings()
