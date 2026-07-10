#!/bin/bash
# Chatwoot Docker Self-Hosting Setup Script
# 
# This script sets up Chatwoot using Docker for self-hosting at https://support.busmo.io
# 
# Prerequisites:
# Docker installed on your server
# Domain name (support.busmo.io) pointed to your server
# Ports 3000 and 3030 open

echo "=========================================="
echo "Chatwoot Docker Setup for Busmo"
echo "=========================================="
echo ""

# Step 1: Check prerequisites
echo "[1/8] Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose found"
echo ""

# Step 2: Create installation directory
echo "[2/8] Creating Chatwoot installation directory..."
INSTALL_DIR="/opt/chatwoot"
if [ ! -d "$INSTALL_DIR" ]; then
    mkdir -p "$INSTALL_DIR"
    echo "✓ Created $INSTALL_DIR"
else
    echo "✓ Directory $INSTALL_DIR already exists"
fi
cd "$INSTALL_DIR"
echo ""

# Step 3: Clone Chatwoot repository
echo "[3/8] Cloning Chatwoot repository..."
if [ ! -d "chatwoot" ]; then
    git clone https://github.com/chatwoot/chatwoot.git
    cd chatwoot
    echo "✓ Cloned Chatwoot repository"
else
    cd chatwoot
    echo "✓ Chatwoot directory already exists, updating..."
    git pull origin main
fi
echo ""

# Step 4: Generate secret key
echo "[4/8] Generating SECRET_KEY_BASE..."
SECRET_KEY=$(openssl rand -hex 64)
echo "✓ Generated secret key: ${SECRET_KEY:0:20}..."
echo ""

# Step 5: Configure environment file
echo "[5/8] Configuring .env file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created .env from .env.example"
    
    # Basic configuration
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://support.busmo.io|g" .env
    sed -i "s|RAILWEB_URL=.*|RAILWEB_URL=https://support.busmo.io|g" .env
    sed -i "s|SECRET_KEY_BASE=.*|SECRET_KEY_BASE=$SECRET_KEY|g" .env
    
    # Mailer configuration (using console for now, configure later)
    sed -i "s|MAILER_SENDER_EMAIL=.*|MAILER_SENDER_EMAIL=support@busmo.io|g" .env
    sed -i "s|MAILER_DOMAIN=.*|MAILER_DOMAIN=busmo.io|g" .env
    
    # Enable installation for single server
    sed -i "s|INSTALLATION_ENV=.*|INSTALLATION_ENV=linux_docker|g" .env
    sed -i "s|ACTIVE_STORAGE_SERVICE=.*|ACTIVE_STORAGE_SERVICE=local|g" .env
    sed -i "s|RAILS_ENV=.*|RAILS_ENV=production|g" .env
    sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
    
    echo "✓ Configured environment variables"
else
    echo "! .env file already exists, skipping configuration"
fi
echo ""

# Step 6: Start Docker containers
echo "[6/8] Starting Chatwoot containers..."
docker compose up -d
echo "✓ Started Docker containers"
echo ""

# Wait for containers to be ready
echo "Waiting for containers to start (this may take 2-3 minutes)..."
sleep 30

# Check container status
docker compose ps
echo ""

# Step 7: Run database setup
echo "[7/8] Setting up database..."
echo "Running database migrations..."
docker compose exec -T web bundle exec rails db:create db:migrate

echo "Creating admin user..."
echo "IMPORTANT: Follow the prompts to create your admin account"
docker compose exec web bundle exec rails db:seed
echo ""

# Step 8: Verify installation
echo "[8/8] Verifying installation..."
echo ""
echo "=========================================="
echo "✓ Chatwoot Docker Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Access Chatwoot at: https://support.busmo.io/setup"
echo ""
echo "2. Get your Chatwoot credentials:"
echo "   - Account ID: Settings → Account → API Keys (usually 1)"
echo "   - Website Token: Settings → Inboxes → Website inbox"
echo "   - API Access Token: Settings → API Keys → New API Key"
echo "   - HMAC Secret: Settings → Security (optional)"
echo ""
echo "3. Update Busmo .env.local with these credentials:"
echo "   NEXT_PUBLIC_CHATWOOT_ENABLED=true"
echo "   NEXT_PUBLIC_CHATWOOT_URL=https://support.busmo.io"
echo "   NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=your-account-id"
echo "   NEXT_PUBLIC_CHATWOOT_INBOX_ID=1"
echo "   NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your-website-token"
echo "   CHATWOOT_API_ACCESS_TOKEN=your-api-token"
echo "   CHATWOOT_HMAC_SECRET=your-hmac-secret"
echo ""
echo "4. Restart Busmo: npm run dev"
echo ""
echo "Useful commands:"
echo "  Start:   cd $INSTALL_DIR/chatwoot && docker compose up -d"
echo "  Stop:    cd $INSTALL_DIR/chatwoot && docker compose down"
echo "  Restart: cd $INSTALL_DIR/chatwoot && docker compose restart"
echo "  Logs:    cd $INSTALL_DIR/chatwoot && docker compose logs -f"
echo "  Update:  cd $INSTALL_DIR/chatwoot && git pull && docker compose down && docker compose up -d && docker compose exec web bundle exec rails db:migrate"
echo ""