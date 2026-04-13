QUERIES = {
    "revenue_by_product": {
        "title": "Revenue by Product",
        "sql": (
            "SELECT p.ProductName, p.ProductType, "
            "SUM(li.Quantity) AS TotalUnitsSold, "
            "SUM(li.Quantity * li.UnitPrice) AS TotalRevenue "
            "FROM SaleLineItem li "
            "JOIN Product p ON li.ProductID = p.ProductID "
            "GROUP BY p.ProductName, p.ProductType "
            "ORDER BY TotalRevenue DESC;"
        ),
        "description": "Shows total units sold and revenue for each product, helping identify top sellers.",
        "chart_type": "bar",
        "chart_label": "product_name",
        "chart_value": "total_revenue",
    },
    "monthly_revenue": {
        "title": "Monthly Revenue Trend",
        "sql": (
            "SELECT YEAR(s.SaleDate) AS SaleYear, MONTH(s.SaleDate) AS SaleMonth, "
            "SUM(li.Quantity * li.UnitPrice) AS MonthlyRevenue "
            "FROM Sale s "
            "JOIN SaleLineItem li ON s.SaleID = li.SaleID "
            "GROUP BY YEAR(s.SaleDate), MONTH(s.SaleDate) "
            "ORDER BY SaleYear, SaleMonth;"
        ),
        "description": "Tracks revenue over time to identify seasonal trends and growth patterns.",
        "chart_type": "line",
        "chart_label": "sale_month",
        "chart_value": "monthly_revenue",
    },
    "revenue_by_type_month": {
        "title": "Revenue by Product Type per Month",
        "sql": (
            "SELECT YEAR(s.SaleDate) AS SaleYear, MONTH(s.SaleDate) AS SaleMonth, "
            "p.ProductType, SUM(li.Quantity * li.UnitPrice) AS Revenue "
            "FROM Sale s "
            "JOIN SaleLineItem li ON s.SaleID = li.SaleID "
            "JOIN Product p ON li.ProductID = p.ProductID "
            "GROUP BY YEAR(s.SaleDate), MONTH(s.SaleDate), p.ProductType "
            "ORDER BY SaleYear, SaleMonth, p.ProductType;"
        ),
        "description": "Breaks down monthly revenue by product category for category-level trend analysis.",
        "chart_type": "bar",
        "chart_label": "product_type",
        "chart_value": "revenue",
    },
    "employee_performance": {
        "title": "Employee Performance",
        "sql": (
            "SELECT e.EmployeeID, e.FirstName + ' ' + e.LastName AS EmployeeName, "
            "e.EmployeeType, l.LocationName, "
            "COUNT(DISTINCT s.SaleID) AS TransactionCount, "
            "SUM(li.Quantity * li.UnitPrice) AS TotalRevenue, "
            "CASE WHEN COUNT(DISTINCT s.SaleID) > 0 "
            "THEN SUM(li.Quantity * li.UnitPrice) / COUNT(DISTINCT s.SaleID) "
            "ELSE 0 END AS AvgTransactionValue, "
            "e.CommissionRate, "
            "SUM(li.Quantity * li.UnitPrice) * ISNULL(e.CommissionRate, 0) AS CommissionEarned "
            "FROM Employee e "
            "LEFT JOIN Sale s ON e.EmployeeID = s.EmployeeID "
            "LEFT JOIN SaleLineItem li ON s.SaleID = li.SaleID "
            "LEFT JOIN Location l ON e.LocationID = l.LocationID "
            "GROUP BY e.EmployeeID, e.FirstName, e.LastName, e.EmployeeType, "
            "l.LocationName, e.CommissionRate "
            "ORDER BY TotalRevenue DESC;"
        ),
        "description": "Shows each employee's transaction count, total revenue generated, average transaction value, and commission earned.",
    },
    "product_profit": {
        "title": "Product Performance and Profit",
        "sql": (
            "SELECT p.ProductID, p.ProductName, p.ProductType, p.MSRP, p.CostPrice, "
            "ISNULL(SUM(li.Quantity), 0) AS UnitsSold, "
            "ISNULL(SUM(li.Quantity * li.UnitPrice), 0) AS TotalRevenue, "
            "ISNULL(SUM(li.Quantity * p.CostPrice), 0) AS TotalCost, "
            "ISNULL(SUM(li.Quantity * li.UnitPrice), 0) - ISNULL(SUM(li.Quantity * p.CostPrice), 0) AS GrossProfit, "
            "CASE WHEN SUM(li.Quantity * li.UnitPrice) > 0 "
            "THEN (SUM(li.Quantity * li.UnitPrice) - SUM(li.Quantity * p.CostPrice)) "
            "/ SUM(li.Quantity * li.UnitPrice) * 100 "
            "ELSE 0 END AS ProfitMarginPct "
            "FROM Product p "
            "LEFT JOIN SaleLineItem li ON p.ProductID = li.ProductID "
            "GROUP BY p.ProductID, p.ProductName, p.ProductType, p.MSRP, p.CostPrice "
            "ORDER BY GrossProfit DESC;"
        ),
        "description": "Calculates profit margins for each product.",
        "chart_type": "bar",
        "chart_label": "product_name",
        "chart_value": "gross_profit",
    },
    "best_sellers": {
        "title": "Top 5 Best Sellers",
        "sql": (
            "SELECT TOP 5 p.ProductName, "
            "SUM(li.Quantity * li.UnitPrice) AS TotalRevenue "
            "FROM SaleLineItem li "
            "JOIN Product p ON li.ProductID = p.ProductID "
            "GROUP BY p.ProductName "
            "ORDER BY TotalRevenue DESC;"
        ),
        "description": "Identifies the five highest-revenue products.",
        "chart_type": "bar",
        "chart_label": "product_name",
        "chart_value": "total_revenue",
    },
    "lagging_products": {
        "title": "Lagging Products (Never Sold)",
        "sql": (
            "SELECT p.ProductName, p.ProductType, p.MSRP, "
            "ISNULL(SUM(li.Quantity), 0) AS UnitsSold "
            "FROM Product p "
            "LEFT JOIN SaleLineItem li ON p.ProductID = li.ProductID "
            "GROUP BY p.ProductName, p.ProductType, p.MSRP "
            "HAVING ISNULL(SUM(li.Quantity), 0) = 0 "
            "ORDER BY p.MSRP DESC;"
        ),
        "description": "Shows products that have never been sold.",
    },
    "revenue_by_location": {
        "title": "Revenue by Location",
        "sql": (
            "SELECT l.LocationName, "
            "COUNT(DISTINCT s.SaleID) AS TotalTransactions, "
            "SUM(li.Quantity * li.UnitPrice) AS TotalRevenue "
            "FROM Location l "
            "LEFT JOIN Sale s ON l.LocationID = s.LocationID "
            "LEFT JOIN SaleLineItem li ON s.SaleID = li.SaleID "
            "GROUP BY l.LocationName "
            "ORDER BY TotalRevenue DESC;"
        ),
        "description": "Compares transaction volume and revenue across all three store locations.",
        "chart_type": "bar",
        "chart_label": "location_name",
        "chart_value": "total_revenue",
    },
    "bike_week_participants": {
        "title": "Bike Week Participants",
        "sql": (
            "SELECT p.ParticipantID, "
            "p.FirstName + ' ' + p.LastName AS ParticipantName, "
            "p.Age, "
            "g.FirstName + ' ' + g.LastName AS GuardianName, "
            "p.State, "
            "COUNT(er.EventID) AS EventsRegistered "
            "FROM Participant p "
            "JOIN Guardian g ON p.GuardianID = g.GuardianID "
            "LEFT JOIN EventRegistration er ON p.ParticipantID = er.ParticipantID "
            "GROUP BY p.ParticipantID, p.FirstName, p.LastName, p.Age, "
            "g.FirstName, g.LastName, p.State "
            "ORDER BY p.LastName;"
        ),
        "description": "Lists all Bike Week participants with their guardian and events.",
    },
    "bike_week_by_state": {
        "title": "Participants by State",
        "sql": (
            "SELECT p.State, "
            "COUNT(DISTINCT p.ParticipantID) AS ParticipantCount, "
            "COUNT(DISTINCT p.GuardianID) AS GuardianCount "
            "FROM Participant p "
            "GROUP BY p.State "
            "ORDER BY ParticipantCount DESC;"
        ),
        "description": "Shows where Bike Week participants are coming from.",
        "chart_type": "bar",
        "chart_label": "state",
        "chart_value": "participant_count",
    },
    "bike_week_revenue": {
        "title": "Bike Week Revenue",
        "sql": (
            "SELECT 'Bike Week Attributable Revenue' AS Metric, "
            "COUNT(DISTINCT s.SaleID) AS Transactions, "
            "SUM(li.Quantity * li.UnitPrice) AS TotalRevenue, "
            "SUM(li.Quantity * li.UnitPrice * "
            "CASE WHEN p2.ProductType = 'Bike' THEN 0.15 "
            "WHEN p2.ProductType IN ('Clothing','Part') THEN 0.10 "
            "ELSE 0 END) AS DiscountsGiven "
            "FROM Sale s "
            "JOIN SaleLineItem li ON s.SaleID = li.SaleID "
            "JOIN Product p2 ON li.ProductID = p2.ProductID "
            "JOIN Customer c ON s.CustomerID = c.CustomerID "
            "WHERE c.CustomerID IN ("
            "SELECT c2.CustomerID FROM Customer c2 "
            "JOIN Guardian g ON c2.FirstName = g.FirstName AND c2.LastName = g.LastName"
            ");"
        ),
        "description": "Calculates total revenue attributable to Bike Week participants and guardians.",
    },
}
