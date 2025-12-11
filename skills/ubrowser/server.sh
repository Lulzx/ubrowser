#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Go to the plugin root (two levels up from skills/ubrowser)
PLUGIN_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
cd "$PLUGIN_ROOT"

# Parse arguments
HEADLESS=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --headless)
            HEADLESS=true
            shift
            ;;
        *)
            echo "Unknown parameter: $1"
            exit 1
            ;;
    esac
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
if ! npx playwright install --dry-run chromium 2>/dev/null | grep -q "already installed"; then
    echo "Installing Playwright Chromium..."
    npx playwright install chromium
fi

# Build if needed
if [ ! -f "build/index.js" ]; then
    echo "Building..."
    npm run build
fi

# Export headless mode
export UBROWSER_HEADLESS=$HEADLESS

# Start the MCP server
node build/index.js
