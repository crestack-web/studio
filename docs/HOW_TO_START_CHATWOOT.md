# How to Start Chatwoot Server

## Quick Answer

You need to **install and start Chatwoot** at `https://support.busmo.io`. Here are your options:

## Option 1: Chatwoot Cloud (EASIEST - 5 Minutes)

**Best for:** Quick setup, no server management

### Steps:
1. **Sign up** at https://app.chatwoot.com
2. **Create your workspace**
3. **Get your credentials:**
   - URL: `https://your-instance.chatwoot.io`
   - Account ID: `1`
   - Website Token: (from Settings → Inboxes)
   - API Access Token: (from Settings → API Keys)
4. **Update Busmo `.env.local`:**
   ```env
   NEXT_PUBLIC_CHATWOOT_URL=https://your-instance.chatwoot.io
   NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=1
   NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your-token
   CHATWOOT_API_ACCESS_TOKEN=your-api-token
   ```
5. **Restart Busmo:** `npm run dev`

**Cost:** Free tier available, paid plans from $10/month

---

## Option 2: Docker Self-Hosted (RECOMMENDED)

**Best for:** Full control, no monthly fees

### Prerequisites:
- Docker installed on your server
- Domain name pointed to your server
- Ports 3000 and 3030 open

### Quick Start with Automated Scripts

We've created automated setup scripts for you:

**Linux/Mac:**
```bash
# Make the script executable
chmod +x scripts/setup-chatwoot-docker.sh

# Run the setup script
sudo ./scripts/setup-chatwoot-docker.sh
```

**Windows:**
```cmd
# Run the setup script as Administrator
scripts\setup-chatwoot-docker.bat
```

The script will:
1. Check prerequisites
2. Create `/opt/chatwoot` directory (or `C:\chatwoot` on Windows)
3. Clone Chatwoot repository
4. Generate SECRET_KEY_BASE automatically
5. Configure `.env` with Busmo-specific settings
6. Start all Docker containers
7. Run database migrations and seed
8. Provide next steps

### Manual Setup (Step-by-Step)

#### 1. **Prepare Server**
```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
```

#### 2. **Install Chatwoot**
```bash
# Clone Chatwoot
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

#### 3. **Configure `.env`**
```bash
# Required variables:
FRONTEND_URL=https://support.busmo.io
RAILWEB_URL=https://support.busmo.io

# Generate secret key (run this in terminal):
openssl rand -hex 64

# Copy the output and set:
SECRET_KEY_BASE=<paste-generated-key-here>
```

#### 4. **Start Chatwoot**
```bash
# Start all services
docker-compose up -d

# Wait for containers to start (2-3 minutes)
docker-compose ps

# All should show "Up" status
```

#### 5. **Run Database Setup**
```bash
# Create admin account
docker-compose exec web bundle exec rails db:seed

# You should see output about creating admin user
```

#### 6. **Access Chatwoot**
```bash
# Go to your browser:
https://support.busmo.io/setup

# Create your admin account:
# - Name: Your Name
# - Email: your-email@example.com
# - Password: (choose a strong password)
```

#### 7. **Get Chatwoot Credentials**
After logging in to `https://support.busmo.io/dashboard`:

**a) Account ID:**
- Go to Settings → Account → API Keys
- Copy Account ID (usually `1`)

**b) Website Token:**
- Go to Settings → Inboxes
- Click on "Website" inbox
- Copy the Website Token

**c) API Access Token:**
- Go to Settings → API Keys
- Click "New API Key"
- Copy the generated token

**d) HMAC Secret (optional):**
- Go to Settings → Security
- Copy HMAC Secret

#### 8. **Update Busmo `.env.local`**
```env
NEXT_PUBLIC_CHATWOOT_ENABLED=true
NEXT_PUBLIC_CHATWOOT_URL=https://support.busmo.io
NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=1
NEXT_PUBLIC_CHATWOOT_INBOX_ID=1
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your-website-token-here
CHATWOOT_API_ACCESS_TOKEN=your-api-token
CHATWOOT_HMAC_SECRET=your-hmac-secret
```

#### 9. **Restart Busmo**
```bash
cd c:\busmo\v1.1\studio
npm run dev
```

---

## Option 3: Manual Installation (ADVANCED)

**Best for:** Custom setups, learning purposes

See official guide: https://www.chatwoot.com/docs/self-hosted

---

## Verify Chatwoot is Running

### Test 1: Check if Chatwoot loads
```bash
# In your browser, go to:
https://support.busmo.io

# You should see Chatwoot login page or dashboard
```

### Test 2: Check containers (Docker only)
```bash
cd /path/to/chatwoot
docker-compose ps

# Should show:
# - web (Up)
# - worker (Up)
# - redis (Up)
# - postgres (Up)
```

### Test 3: Check API access
```bash
curl https://support.busmo.io/api/v1/accounts/1 \
  -H 'api_access_token: YOUR_TOKEN_HERE'

# Should return JSON with account info
```

### Verify Busmo Integration

After updating `.env.local` and restarting Busmo:

1. Open your Busmo application
2. Look for the Chatwoot widget (bottom-right corner)
3. Click the widget to open chat
4. Send a test message
5. Verify it appears in Chatwoot dashboard at `https://support.busmo.io/dashboard`

---

## Files Created

The following files have been created to help you set up Chatwoot:

1. **`scripts/setup-chatwoot-docker.sh`** - Automated setup script for Linux/Mac
2. **`scripts/setup-chatwoot-docker.bat`** - Automated setup script for Windows
3. **`docs/HOW_TO_START_CHATWOOT.md`** - This comprehensive guide


## Common Issues

### Issue: "Connection refused"
**Solution:** Chatwoot not running
```bash
cd /path/to/chatwoot
docker-compose up -d
```

### Issue: "404 Not Found"
**Solution:** Check FRONTEND_URL in .env matches your domain

### Issue: "502 Bad Gateway"
**Solution:** Wait 2-3 minutes for containers to fully start

### Issue: "Database not ready"
**Solution:**
```bash
docker-compose exec web bundle exec rake db:setup
```

---

## Daily Operations

### Start Chatwoot
```bash
cd /path/to/chatwoot
docker-compose up -d
```

### Stop Chatwoot
```bash
cd /path/to/chatwoot
docker-compose down
```

### Restart Chatwoot
```bash
cd /path/to/chatwoot
docker-compose restart
```

### View Logs
```bash
cd /path/to/chatwoot
docker-compose logs -f
```

### Update Chatwoot
```bash
cd /path/to/chatwoot
git pull origin main
docker-compose down
docker-compose up -d
docker-compose exec web bundle exec rails db:migrate
```

---

## Chatwoot Dashboard

Once running, access at:
- **Setup (first time):** https://support.busmo.io/setup
- **Dashboard:** https://support.busmo.io/dashboard
- **API:** https://support.busmo.io/api/v1

---

## Cost Comparison

| Option | Cost | Maintenance |
|--------|------|-------------|
| Chatwoot Cloud | Free-$50/month | None |
| Docker Self-Hosted | Server cost only | Minimal |
| Manual Install | Server cost only | High |

---

## Recommendation

**For your setup:**
1. Use **Chatwoot Cloud** if you want simplicity
2. Use **Docker** if you want full control and already have a server

Both work perfectly with Busmo!

---

## Need Help?

- **Chatwoot Docs:** https://www.chatwoot.com/docs/self-hosted
- **Chatwoot Discord:** https://discord.gg/cFQrXgZ
- **Email:** support@chatwoot.com