#!/bin/bash
# MASA Platform — Fresh EC2 Ubuntu setup
# Run once as ubuntu user
set -e
echo "=== Installing .NET 8 ==="
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0
echo 'export PATH="$PATH:$HOME/.dotnet"' >> ~/.bashrc
source ~/.bashrc

echo "=== Installing PostgreSQL ==="
sudo apt update && sudo apt install -y postgresql postgresql-contrib nginx

echo "=== Installing Nginx ==="
sudo apt install -y nginx
sudo systemctl enable nginx

echo "=== Setting up web directories ==="
sudo mkdir -p /var/www/masa/{main,admin,edu,iis,health,ba,stem,minm}
sudo chown -R www-data:www-data /var/www/masa

echo "=== Copying Nginx config ==="
sudo cp nginx/masa.conf /etc/nginx/sites-available/masa
sudo ln -sf /etc/nginx/sites-available/masa /etc/nginx/sites-enabled/masa
sudo nginx -t && sudo systemctl reload nginx

echo "=== Installing systemd services ==="
sudo cp scripts/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "=== Setup complete. Configure appsettings.json and run deploy.sh ==="
