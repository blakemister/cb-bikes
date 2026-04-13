#!/usr/bin/env bash
# Install cloudflared and set up a systemd service for the Quick Tunnel.
# Run with: sudo bash scripts/setup-tunnel-service.sh

set -euo pipefail

PORT="${APP_PORT:-8000}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== CB Bikes Tunnel Service Setup ==="

# 1. Install cloudflared if not present
if ! command -v cloudflared &>/dev/null; then
    echo "Installing cloudflared..."
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
    dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
    echo "cloudflared installed."
else
    echo "cloudflared already installed: $(cloudflared --version)"
fi

# 2. Create systemd service
SERVICE_FILE="/etc/systemd/system/cb-bikes-tunnel.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=CB Bikes Cloudflare Quick Tunnel
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:${PORT}
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "Created $SERVICE_FILE"

# 3. Enable and start
systemctl daemon-reload
systemctl enable cb-bikes-tunnel.service
systemctl start cb-bikes-tunnel.service

echo ""
echo "Tunnel service started. Check status with:"
echo "  systemctl status cb-bikes-tunnel"
echo ""
echo "View logs (and find the URL) with:"
echo "  journalctl -u cb-bikes-tunnel -f"
