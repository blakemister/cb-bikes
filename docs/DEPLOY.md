# Deployment Guide — Home Server

This guide covers deploying CB Bikes on a Linux home server with public access via Cloudflare Quick Tunnel.

## Prerequisites

- Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- Docker and Docker Compose installed
- Git installed
- Internet access (for Cloudflare tunnel)

### Install Docker (if needed)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/blakemister/cb-bikes.git
cd cb-bikes

# 2. Configure environment
cp .env.example .env
# Optionally edit .env to change the SA password:
#   nano .env

# 3. Start everything
docker compose up -d

# 4. Wait for SQL Server to initialize (~30 seconds on first boot)
docker compose logs -f sqlserver
# Look for "Recovery is complete" then Ctrl+C

# 5. Initialize the database (first time only)
docker exec -i cbb-sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$(grep DB_PASSWORD .env | cut -d= -f2)" \
    -C -i /docker-entrypoint-initdb.d/init.sql

# 6. Verify it works
curl http://localhost:8000/api/health
# Should return: {"status":"ok","db":"connected"}
```

Open `http://localhost:8000` in a browser — you should see the full CB Bikes dashboard.

## Public Access via Cloudflare Tunnel

### Option A: Quick one-off tunnel

```bash
# Install cloudflared
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb

# Start tunnel (prints a *.trycloudflare.com URL)
bash scripts/tunnel.sh
```

The URL changes each time you restart. Good for demos.

### Option B: Persistent systemd service

```bash
sudo bash scripts/setup-tunnel-service.sh
```

This installs cloudflared, creates a systemd service, and enables auto-start on boot. The URL still changes on restart — check the journal for the current URL:

```bash
journalctl -u cb-bikes-tunnel -f
```

## Updating

```bash
cd cb-bikes
git pull
docker compose build app
docker compose up -d app
```

No need to restart SQL Server unless `db/init.sql` changed.

## Troubleshooting

### SQL Server won't start

```bash
docker compose logs sqlserver
```

Common issues:
- **Insufficient memory**: SQL Server needs at least 2 GB RAM. Check with `free -h`.
- **Port conflict**: Another process is using 1433. Check with `ss -tlnp | grep 1433`.

### App can't connect to SQL Server

```bash
docker compose logs app
```

The app waits for SQL Server's health check. If SQL Server is still initializing, the app will retry automatically.

### Database is empty

Run the init script manually:

```bash
docker exec -i cbb-sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$(grep DB_PASSWORD .env | cut -d= -f2)" \
    -C -i /docker-entrypoint-initdb.d/init.sql
```

### Tunnel URL not working

- Check cloudflared is running: `systemctl status cb-bikes-tunnel`
- Check the app is healthy: `curl http://localhost:8000/api/health`
- Cloudflare Quick Tunnels are rate-limited — if you get 429 errors, wait a few minutes.

## Architecture

```
Docker Compose
├── sqlserver (port 1433) ← SQL Server 2022 + init.sql
└── app (port 8000) ← FastAPI + static frontend
         │
    cloudflared tunnel ← *.trycloudflare.com
```

All data persists in the `sqldata` Docker volume. To reset:

```bash
docker compose down -v   # removes volumes
docker compose up -d     # fresh start
# Re-run init.sql
```
