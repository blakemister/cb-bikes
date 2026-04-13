import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client, mock_db):
    mock_db.scalar.return_value = 1
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_customers_list(client, mock_db):
    mock_db.query.return_value = [
        {
            "CustomerID": 1,
            "FirstName": "Jake",
            "LastName": "Morrison",
            "City": "Crested Butte",
            "State": "CO",
            "Emails": "jake@test.com",
            "Phones": "970-555-1001",
            "CyclingTypes": "Enduro",
        }
    ]
    response = await client.get("/api/customers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["FirstName"] == "Jake"


@pytest.mark.asyncio
async def test_create_customer(client, mock_db):
    mock_db.execute_return_id.return_value = 21
    response = await client.post(
        "/api/customers",
        json={
            "first_name": "Test",
            "last_name": "User",
            "city": "Durango",
            "state": "CO",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == 21


@pytest.mark.asyncio
async def test_products_list(client, mock_db):
    mock_db.query.return_value = [
        {
            "ProductID": 1,
            "ProductName": "Ibis Ripmo V2S",
            "ProductType": "Bike",
            "MSRP": 5999.00,
            "CostPrice": 3600.00,
            "MarginPct": 40.0,
        }
    ]
    response = await client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_products_filter_by_type(client, mock_db):
    mock_db.query.return_value = []
    response = await client.get("/api/products?type=Bike")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_reports_list(client, mock_db):
    response = await client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 11
    keys = [r["key"] for r in data]
    assert "revenue_by_product" in keys
    assert "bike_week_revenue" in keys


@pytest.mark.asyncio
async def test_report_detail(client, mock_db):
    mock_db.query.return_value = [{"ProductName": "Ibis Ripmo", "TotalRevenue": 5999}]
    response = await client.get("/api/reports/revenue_by_product")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "sql" in data
    assert "title" in data


@pytest.mark.asyncio
async def test_report_sql_only(client, mock_db):
    response = await client.get("/api/reports/revenue_by_product/sql")
    assert response.status_code == 200
    data = response.json()
    assert "sql" in data
    assert "SELECT" in data["sql"]


@pytest.mark.asyncio
async def test_report_not_found(client, mock_db):
    response = await client.get("/api/reports/nonexistent_report")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_sale(client, mock_db):
    mock_db.execute_return_id.return_value = 26
    mock_db.query.return_value = [{"MSRP": 5999.00}]
    response = await client.post(
        "/api/sales",
        json={
            "customer_id": 1,
            "employee_id": 1,
            "location_id": 1,
            "sale_date": "2026-04-15",
            "line_items": [{"product_id": 1, "quantity": 1}],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sale_id"] == 26


@pytest.mark.asyncio
async def test_create_sale_empty_items(client, mock_db):
    response = await client.post(
        "/api/sales",
        json={
            "customer_id": 1,
            "employee_id": 1,
            "location_id": 1,
            "sale_date": "2026-04-15",
            "line_items": [],
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_bike_week_participants(client, mock_db):
    mock_db.query.return_value = []
    response = await client.get("/api/bike-week/participants")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_bike_week_register(client, mock_db):
    mock_db.execute_return_id.return_value = 1
    response = await client.post(
        "/api/bike-week/register",
        json={
            "guardian_id": 1,
            "first_name": "Test",
            "last_name": "Kid",
            "age": 10,
            "event_ids": [1, 2],
        },
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_schema_endpoint(client, mock_db):
    mock_db.query.return_value = [
        {"TableName": "Customer", "NumRows": 20}
    ]
    response = await client.get("/api/schema")
    assert response.status_code == 200
