from fastapi import APIRouter, HTTPException
from app.database import db
from app.sql.queries import QUERIES

router = APIRouter()

# Map report keys to categories for the sidebar
_CATEGORIES = {
    "revenue_by_product": "Revenue",
    "monthly_revenue": "Revenue",
    "revenue_by_type_month": "Revenue",
    "revenue_by_location": "Revenue",
    "employee_performance": "Employees",
    "product_profit": "Products",
    "best_sellers": "Products",
    "lagging_products": "Products",
    "bike_week_participants": "Bike Week",
    "bike_week_by_state": "Bike Week",
    "bike_week_revenue": "Bike Week",
}


@router.get("/api/reports")
async def list_reports():
    return [
        {
            "id": key,
            "key": key,
            "name": q["title"],
            "title": q["title"],
            "description": q["description"],
            "chart_type": q.get("chart_type"),
            "category": _CATEGORIES.get(key, "Other"),
        }
        for key, q in QUERIES.items()
    ]


@router.get("/api/reports/{key}")
async def run_report(key: str):
    q = QUERIES.get(key)
    if not q:
        raise HTTPException(status_code=404, detail=f"Report '{key}' not found")

    data = await db.query(q["sql"])

    result = {
        "title": q["title"],
        "description": q["description"],
        "sql": q["sql"],
        "data": data,
    }
    if "chart_type" in q:
        result["chart_type"] = q["chart_type"]
        result["chart_label"] = q.get("chart_label")
        result["chart_value"] = q.get("chart_value")
    return result


@router.get("/api/reports/{key}/sql")
async def report_sql(key: str):
    q = QUERIES.get(key)
    if not q:
        raise HTTPException(status_code=404, detail=f"Report '{key}' not found")

    return {
        "title": q["title"],
        "description": q["description"],
        "sql": q["sql"],
    }
