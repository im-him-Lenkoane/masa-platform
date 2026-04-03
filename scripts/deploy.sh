#!/bin/bash
# MASA Platform — EC2 Deploy Script
# Run from project root: bash scripts/deploy.sh
set -e
APPS=("Main" "Admin" "Edu" "IIS" "Health" "BA" "STEM" "MINM")
echo "Building MASA Platform..."
for APP in "${APPS[@]}"; do
  echo "  Publishing MASA.$APP..."
  dotnet publish src/MASA.$APP/MASA.$APP.csproj -c Release -o /var/www/masa/${APP,,} --nologo -q
done
echo "Reloading systemd services..."
for APP in "${APPS[@]}"; do
  sudo systemctl restart masa-${APP,,}
done
echo "Done. All MASA services restarted."
