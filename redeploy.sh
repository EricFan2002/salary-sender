#!/bin/bash

# Redeploy script for Payslip Application

echo "Starting redeployment process..."

# Define paths
APP_DIR="/root/salary-slip-app"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$FRONTEND_DIR/src/backend"

# 1. Rebuild Frontend
echo "Rebuilding Frontend..."
cd "$FRONTEND_DIR"
# Currently creating a build isn't explicitly defined in the start scripts but 'vite build' is standard
if [ -f "package.json" ]; then
    # Install dependencies if needed (optional, takes time)
    # npm install 
    
    # Run build if script exists
    if grep -q "\"build\":" "package.json"; then
        npm run build
    else
        echo "No build script found, skipping build."
    fi
fi

# 2. Restart Services
echo "Restarting Services..."

# Restart Backend
if systemctl list-units --full -all | grep -q "payslip-backend.service"; then
    echo "Restarting payslip-backend.service..."
    systemctl restart payslip-backend.service
else
    echo "Warning: payslip-backend.service not found."
fi

# Restart Frontend
if systemctl list-units --full -all | grep -q "payslip.service"; then
    echo "Restarting payslip.service..."
    systemctl restart payslip.service
else
    echo "Warning: payslip.service not found."
fi

# 3. Check Status
echo "Checking Status..."
systemctl status payslip.service --no-pager
systemctl status payslip-backend.service --no-pager

echo "Redeployment Complete!"
