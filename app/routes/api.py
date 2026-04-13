from fastapi import APIRouter, HTTPException, Query
from app.database import db
from app.models import CustomerCreate, SaleCreate, HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
async def health():
    ok = await db.health_check()
    if not ok:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok", "db": "connected"}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@router.get("/api/dashboard")
async def dashboard():
    customers = await db.scalar("SELECT COUNT(*) FROM Customer")
    products = await db.scalar("SELECT COUNT(*) FROM Product")
    employees = await db.scalar("SELECT COUNT(*) FROM Employee")
    sales_count = await db.scalar("SELECT COUNT(*) FROM Sale")
    total_revenue = await db.scalar(
        "SELECT ISNULL(SUM(li.Quantity * li.UnitPrice), 0) FROM SaleLineItem li"
    )
    bw_participants = await db.scalar("SELECT COUNT(*) FROM Participant")
    avg_sale = await db.scalar(
        "SELECT CASE WHEN COUNT(DISTINCT s.SaleID) > 0 "
        "THEN SUM(li.Quantity * li.UnitPrice) / COUNT(DISTINCT s.SaleID) ELSE 0 END "
        "FROM Sale s JOIN SaleLineItem li ON s.SaleID = li.SaleID"
    )

    revenue_by_location = await db.query(
        "SELECT l.LocationName AS location_name, "
        "SUM(li.Quantity * li.UnitPrice) AS revenue "
        "FROM Location l "
        "LEFT JOIN Sale s ON l.LocationID = s.LocationID "
        "LEFT JOIN SaleLineItem li ON s.SaleID = li.SaleID "
        "GROUP BY l.LocationName "
        "ORDER BY revenue DESC"
    )

    revenue_by_type = await db.query(
        "SELECT p.ProductType AS product_type, "
        "SUM(li.Quantity * li.UnitPrice) AS revenue "
        "FROM SaleLineItem li "
        "JOIN Product p ON li.ProductID = p.ProductID "
        "GROUP BY p.ProductType "
        "ORDER BY revenue DESC"
    )

    recent_sales = await db.query(
        "SELECT TOP 10 s.SaleID, s.SaleDate, "
        "c.FirstName + ' ' + c.LastName AS CustomerName, "
        "e.FirstName + ' ' + e.LastName AS EmployeeName, "
        "l.LocationName, "
        "SUM(li.Quantity * li.UnitPrice) AS Total "
        "FROM Sale s "
        "JOIN Customer c ON s.CustomerID = c.CustomerID "
        "JOIN Employee e ON s.EmployeeID = e.EmployeeID "
        "JOIN Location l ON s.LocationID = l.LocationID "
        "JOIN SaleLineItem li ON s.SaleID = li.SaleID "
        "GROUP BY s.SaleID, s.SaleDate, c.FirstName, c.LastName, "
        "e.FirstName, e.LastName, l.LocationName "
        "ORDER BY s.SaleDate DESC"
    )

    rev = float(total_revenue) if total_revenue else 0
    return {
        "kpis": {
            "active_customers": customers,
            "total_products": products,
            "total_employees": employees,
            "total_sales": sales_count,
            "total_revenue": rev,
            "bike_week_participants": bw_participants,
            "avg_sale_value": round(float(avg_sale), 2) if avg_sale else 0,
        },
        "revenue_by_location": revenue_by_location,
        "revenue_by_product_type": revenue_by_type,
        "recent_sales": recent_sales,
    }


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
def _split_csv(val: str | None) -> list[str]:
    if not val:
        return []
    return [v.strip() for v in val.split(",") if v.strip()]


@router.get("/api/customers")
async def list_customers():
    rows = await db.query(
        "SELECT c.CustomerID, c.FirstName, c.LastName, c.StreetAddress, "
        "c.City, c.State, c.ZipCode, "
        "STUFF((SELECT ', ' + ce.Email FROM CustomerEmail ce "
        "WHERE ce.CustomerID = c.CustomerID FOR XML PATH('')), 1, 2, '') AS Emails, "
        "STUFF((SELECT ', ' + cp.PhoneNumber + '|' + ISNULL(cp.PhoneType, 'Mobile') "
        "FROM CustomerPhone cp WHERE cp.CustomerID = c.CustomerID "
        "FOR XML PATH('')), 1, 2, '') AS Phones, "
        "STUFF((SELECT ', ' + cct.CyclingType FROM CustomerCyclingType cct "
        "WHERE cct.CustomerID = c.CustomerID FOR XML PATH('')), 1, 2, '') AS CyclingTypes "
        "FROM Customer c ORDER BY c.LastName, c.FirstName"
    )
    # Convert CSV strings to arrays for the frontend
    for row in rows:
        row["emails"] = _split_csv(row.get("emails"))
        raw_phones = row.get("phones", "") or ""
        phones = []
        for chunk in raw_phones.split(", "):
            if "|" in chunk:
                num, ptype = chunk.split("|", 1)
                phones.append({"number": num.strip(), "type": ptype.strip()})
            elif chunk.strip():
                phones.append({"number": chunk.strip(), "type": "Mobile"})
        row["phones"] = phones
        row["cycling_types"] = _split_csv(row.get("cycling_types"))
    return rows


@router.post("/api/customers")
async def create_customer(body: CustomerCreate):
    customer_id = await db.execute_return_id(
        "INSERT INTO Customer (FirstName, LastName, StreetAddress, City, State, ZipCode) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            body.first_name,
            body.last_name,
            body.street_address,
            body.city,
            body.state,
            body.zip_code,
        ),
    )
    if not customer_id:
        raise HTTPException(status_code=500, detail="Failed to create customer")

    for email in body.emails:
        await db.execute(
            "INSERT INTO CustomerEmail (CustomerID, Email) VALUES (?, ?)",
            (customer_id, email),
        )

    for phone in body.phones:
        await db.execute(
            "INSERT INTO CustomerPhone (CustomerID, PhoneNumber, PhoneType) VALUES (?, ?, ?)",
            (customer_id, phone.get("number", ""), phone.get("type", "Mobile")),
        )

    for cycling_type in body.cycling_types:
        await db.execute(
            "INSERT INTO CustomerCyclingType (CustomerID, CyclingType) VALUES (?, ?)",
            (customer_id, cycling_type),
        )

    return {"customer_id": customer_id}


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@router.get("/api/products")
async def list_products(type: str | None = Query(None)):
    sql = (
        "SELECT p.ProductID, p.ProductName, p.ProductType, p.MSRP, p.CostPrice, "
        "CAST(ROUND((p.MSRP - p.CostPrice) / p.MSRP * 100, 1) AS DECIMAL(5,1)) AS MarginPct, "
        "p.Description "
        "FROM Product p"
    )
    params: tuple | None = None
    if type:
        sql += " WHERE p.ProductType = ?"
        params = (type,)
    sql += " ORDER BY p.ProductType, p.ProductName"
    return await db.query(sql, params)


@router.get("/api/products/{product_id}")
async def get_product(product_id: int):
    rows = await db.query(
        "SELECT p.ProductID, p.ProductName, p.ProductType, p.MSRP, p.CostPrice, "
        "p.Description "
        "FROM Product p WHERE p.ProductID = ?",
        (product_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")

    product = rows[0]

    # Fetch subtype attributes
    if product.get("ProductType") == "Bike":
        bike_rows = await db.query(
            "SELECT b.FrameMaterial, b.FrameSize, b.BuildKit, "
            "b.SuspensionType, b.Drivetrain "
            "FROM Bike b WHERE b.ProductID = ?",
            (product_id,),
        )
        if bike_rows:
            product.update(bike_rows[0])
    elif product.get("ProductType") == "Clothing":
        cloth_rows = await db.query(
            "SELECT c.Size FROM Clothing c WHERE c.ProductID = ?",
            (product_id,),
        )
        if cloth_rows:
            product.update(cloth_rows[0])
    elif product.get("ProductType") == "Part":
        part_rows = await db.query(
            "SELECT pt.Weight FROM Part pt WHERE pt.ProductID = ?",
            (product_id,),
        )
        if part_rows:
            product.update(part_rows[0])

    return product


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------
@router.get("/api/employees")
async def list_employees():
    rows = await db.query(
        "SELECT e.EmployeeID, e.FirstName, e.LastName, "
        "e.EmployeeType, e.CommissionRate, e.Salary, "
        "l.LocationName, "
        "STUFF((SELECT ', ' + es.Skill FROM EmployeeSkill es "
        "WHERE es.EmployeeID = e.EmployeeID FOR XML PATH('')), 1, 2, '') AS Skills "
        "FROM Employee e "
        "JOIN Location l ON e.LocationID = l.LocationID "
        "ORDER BY l.LocationName, e.LastName"
    )
    for row in rows:
        row["skills"] = _split_csv(row.get("skills"))
    return rows


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------
@router.get("/api/sales/lookups")
async def sale_lookups():
    """Dropdown data for the New Sale form."""
    customers = await db.query(
        "SELECT CustomerID AS id, FirstName + ' ' + LastName AS name "
        "FROM Customer ORDER BY LastName"
    )
    employees = await db.query(
        "SELECT EmployeeID AS id, FirstName + ' ' + LastName AS name "
        "FROM Employee WHERE EmployeeType = 'Retail' ORDER BY LastName"
    )
    locations = await db.query(
        "SELECT LocationID AS id, LocationName AS name FROM Location ORDER BY LocationName"
    )
    products = await db.query(
        "SELECT ProductID AS id, ProductName AS name, MSRP AS price "
        "FROM Product ORDER BY ProductName"
    )
    return {
        "customers": customers,
        "employees": employees,
        "locations": locations,
        "products": products,
    }


@router.get("/api/sales")
async def list_sales():
    rows = await db.query(
        "SELECT s.SaleID, s.SaleDate, "
        "c.FirstName + ' ' + c.LastName AS CustomerName, "
        "e.FirstName + ' ' + e.LastName AS EmployeeName, "
        "l.LocationName, "
        "SUM(li.Quantity * li.UnitPrice) AS Total "
        "FROM Sale s "
        "JOIN Customer c ON s.CustomerID = c.CustomerID "
        "JOIN Employee e ON s.EmployeeID = e.EmployeeID "
        "JOIN Location l ON s.LocationID = l.LocationID "
        "JOIN SaleLineItem li ON s.SaleID = li.SaleID "
        "GROUP BY s.SaleID, s.SaleDate, c.FirstName, c.LastName, "
        "e.FirstName, e.LastName, l.LocationName "
        "ORDER BY s.SaleDate DESC"
    )
    return rows


@router.post("/api/sales")
async def create_sale(body: SaleCreate):
    if not body.line_items:
        raise HTTPException(status_code=400, detail="Add at least one line item")
    sale_id = await db.execute_return_id(
        "INSERT INTO Sale (CustomerID, EmployeeID, LocationID, SaleDate) "
        "VALUES (?, ?, ?, ?)",
        (body.customer_id, body.employee_id, body.location_id, body.sale_date.isoformat()),
    )
    if not sale_id:
        raise HTTPException(status_code=500, detail="Failed to create sale")

    for item in body.line_items:
        # Fetch the current MSRP as the unit price
        price = await db.scalar(
            "SELECT MSRP FROM Product WHERE ProductID = ?", (item.product_id,)
        )
        if price is None:
            raise HTTPException(
                status_code=400, detail=f"Product {item.product_id} not found"
            )
        await db.execute(
            "INSERT INTO SaleLineItem (SaleID, ProductID, Quantity, UnitPrice) "
            "VALUES (?, ?, ?, ?)",
            (sale_id, item.product_id, item.quantity, float(price)),
        )

    return {"sale_id": sale_id}
