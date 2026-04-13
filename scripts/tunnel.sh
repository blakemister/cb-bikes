#!/usr/bin/env bash
# Start a Cloudflare Quick Tunnel pointing at the local app.
# The tunnel URL is printed to stdout and saved to tunnel-url.txt.

set -euo pipefail

PORT="${APP_PORT:-8000}"

echo "Starting Cloudflare Quick Tunnel → http://localhost:${PORT} ..."

cloudflared tunnel --url "http://localhost:${PORT}" 2>&1 | while IFS= read -r line; do
    echo "$line"
    # Capture the tunnel URL when it appears
    if [[ "$line" == *"trycloudflare.com"* ]]; then
        url=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com')
        if [[ -n "$url" ]]; then
            echo "$url" > tunnel-url.txt
            echo ""
            echo "============================================"
            echo "  Public URL: $url"
            echo "  (saved to tunnel-url.txt)"
            echo "============================================"
            echo ""
        fi
    fi
done
