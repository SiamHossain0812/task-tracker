#!/bin/bash
set -e  # exit on error

#############################
# CONFIG - adjust paths
#############################
FRONTEND_DIR="/home/daffodil-dev/task-tracker/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
BACKEND_DIR="/home/daffodil-dev/task-tracker"
NGINX_CONF="/etc/nginx/sites-available/task-tracker"
GUNICORN_SERVICE="gunicorn"  # or your systemd gunicorn service name

#############################
# 1️⃣ Build React
#############################
echo "Building React frontend..."
cd $FRONTEND_DIR
npm install
npm run build

#############################
# 2️⃣ Version the index.html
#############################
VERSION=$(date +%Y%m%d%H%M)
mv $DIST_DIR/index.html $DIST_DIR/index_$VERSION.html
echo "Versioned index file: index_$VERSION.html"

# Optional: symlink for Nginx to always point to current
ln -sf index_$VERSION.html $DIST_DIR/index_current.html
echo "Symlink created: index_current.html → index_$VERSION.html"

#############################
# 3️⃣ Update Nginx (if using symlink, no need to change config)
#############################
# Make sure your Nginx uses:
# try_files $uri /index_current.html;

echo "Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

#############################
# 4️⃣ Restart Gunicorn
#############################
echo "Restarting Gunicorn..."
sudo systemctl restart $GUNICORN_SERVICE

echo "✅ Deployment complete!"
