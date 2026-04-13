from pydantic import BaseModel
from datetime import date


class HealthResponse(BaseModel):
    status: str
    db: str


class SqlLogEntry(BaseModel):
    timestamp: str
    operation: str
    sql: str
    ms: float
    rows: int
    preview: str
    status: str


class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    street_address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    emails: list[str] = []
    phones: list[dict] = []  # [{"number": "...", "type": "Mobile"}]
    cycling_types: list[str] = []


class SaleLineItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class SaleCreate(BaseModel):
    customer_id: int
    employee_id: int
    location_id: int
    sale_date: date
    line_items: list[SaleLineItemCreate]


class ParticipantRegister(BaseModel):
    # Guardian (existing or new)
    guardian_id: int | None = None
    guardian_first_name: str | None = None
    guardian_last_name: str | None = None
    guardian_street: str | None = None
    guardian_city: str | None = None
    guardian_state: str | None = None
    guardian_zip: str | None = None
    guardian_waiver: bool = True
    # Participant
    first_name: str
    last_name: str
    age: int
    # Events
    event_ids: list[int]
