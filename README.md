# CB Bikes Operations Platform

A full-stack database management application for CB Bikes & Phil's Fabulous Bikes — a fictional merged bike shop business spanning three Colorado locations. Built as the capstone project for CIS 402 Database Management.

**Live SQL Console** — every interaction generates visible SQL queries in real time, making the database layer transparent. Click a button, see the SELECT. Create a sale, watch INSERT statements cascade.

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python 3.12) |
| **Frontend** | HTML + Tailwind CSS + Alpine.js + Chart.js |
| **Database** | SQL Server 2022 (Docker) |
| **Orchestration** | Docker Compose |
| **Tunnel** | Cloudflare Quick Tunnel |

No build step. No Node.js. Clone, `docker compose up`, done.

## Quick Start

```bash
git clone https://github.com/blakemister/cb-bikes.git
cd cb-bikes
cp .env.example .env
docker compose up -d
```

Wait ~30 seconds for SQL Server, then initialize the database:

```bash
docker exec -i cbb-sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "CBBikes2026!" -C \
    -i /docker-entrypoint-initdb.d/init.sql
```

Open [http://localhost:8000](http://localhost:8000).

## Features

### Business Operations
- **Dashboard** — KPI cards, revenue charts, recent sales
- **Customer Management** — CRUD with multi-valued attributes (emails, phones, cycling types)
- **Product Catalog** — 60 products across Bikes, Clothing, Parts, and Services with subtype details
- **Employee Directory** — Retail and fabrication staff across 3 locations with skills
- **Sales Processing** — Create sales with multiple line items, automatic revenue tracking
- **Junior Bike Week** — Event management, participant registration, race results with medal tracking

### Database Showcase
- **Live SQL Console** — real-time WebSocket feed of every query, with syntax highlighting, operation badges, execution timing, and result previews
- **11 Analytics Reports** — each with results table, raw SQL view, and interactive charts
- **Schema Viewer** — all 26 tables with columns, data types, foreign keys, and row counts

## Architecture

```
┌──────────────────────────────────────────┐
│  Docker Compose                          │
│  ┌──────────────┐  ┌─────────────────┐   │
│  │ SQL Server   │◄─│ FastAPI App     │   │
│  │ (port 1433)  │  │ (port 8000)    │   │
│  │ 26 tables    │  │ REST + WS +    │   │
│  │ 775 rows     │  │ static files   │   │
│  └──────────────┘  └────────┬────────┘   │
└─────────────────────────────┼────────────┘
                              │
                   Cloudflare Quick Tunnel
                   *.trycloudflare.com
```

## Database Schema

26 tables implementing a fully normalized relational design:

- **Customer Domain** — Customer, CustomerEmail, CustomerPhone, CustomerCyclingType
- **Product Catalog** — Product (supertype) → Bike, Clothing, Part, Service (subtypes), ServicePart, Supplier
- **Employees** — Employee, EmployeeSkill, Location, Shareholder
- **Sales** — Sale, SaleLineItem, ServiceRecord
- **Junior Bike Week** — Event → RaceEvent, RecreationalEvent, Guardian, Participant, EventRegistration, RaceResult, BikeWeekDiscount

Key patterns: supertype/subtype inheritance (Product → Bike/Clothing/Part/Service), multi-valued attributes (CustomerEmail, CustomerPhone), composite keys, junction tables.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check with DB status |
| `GET /api/dashboard` | KPIs, charts, recent sales |
| `GET /api/customers` | Customer list with nested attributes |
| `POST /api/customers` | Create customer |
| `GET /api/products` | Product list (filterable by type) |
| `GET /api/employees` | Employees grouped by location |
| `GET /api/sales` | Recent sales |
| `POST /api/sales` | Create sale with line items |
| `GET /api/bike-week/*` | Bike Week overview, participants, events, results |
| `POST /api/bike-week/register` | Register participant for events |
| `GET /api/reports` | List available reports |
| `GET /api/reports/:key` | Run report, get data + SQL |
| `GET /api/schema` | Full schema introspection |
| `WS /ws/sql-log` | Real-time SQL query stream |

## Deployment

For public access from a home server, see [docs/DEPLOY.md](docs/DEPLOY.md).

```bash
# Quick tunnel (changes URL each restart)
bash scripts/tunnel.sh

# Persistent systemd service
sudo bash scripts/setup-tunnel-service.sh
```

## License

MIT
