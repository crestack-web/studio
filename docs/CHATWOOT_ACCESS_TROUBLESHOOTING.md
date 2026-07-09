# Chatwoot Access Troubleshooting

## Issue: Dashboard Not Loading at https://support.busmo.io/dashboard

This means your self-hosted Chatwoot instance is not running or not accessible. Here's how to fix it.

## Step 1: Check if Chatwoot Server is Running

### If you installed Chatwoot with Docker:

1. **Check if containers are running:**
   ```bash
   cd /path/to/chatwoot
   docker-compose ps
   ```

2. **If containers are stopped, start them:**
   ```bash
   docker-compose up -d
   ```

3. **Check logs for errors:**
   ```bash
   docker-compose logs -f
   ```

4. **Verify it's accessible:**
   ```bash
   curl https://support.busmo.io
   ```

### If you installed Chatwoot manually:

1. **Check if the service is running:**
   ```bash
   # Check Rails server
   ps aux | grep puma
   
   # Check if port 3000 is listening
   netstat -tlnp | grep 3000
   ```

2. **Start the Chatwoot server:**
   ```bash
   cd /path/to/chatwoot
   ./bin/rails server
   ```

3. **Or start with systemd (if configured):**
   ```bash
   sudo systemctl start chatwoot
   sudo systemctl status chatwoot
   ```

## Step 2: Quick Start Guide for Chatwoot

### Option A: Docker Compose (Recommended)

1. **Clone Chatwoot repository:**
   ```bash
   git clone https://github.com/chatwoot/chatwoot.git
   cd chatwoot
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file:**
   ```bash
   # Set these values:
   FRONTEND_URL=https://support.busmo.io
   RAILWEB_URL=https://support.busmo.io
   
   # Generate a secret key:
   SECRET_KEY_BASE=$(openssl rand -hex 64)
   ```

4. **Start Chatwoot:**
   ```bash
   docker-compose up -d
   ```

5. **Run setup:**
   ```bash
   docker-compose exec web bundle exec rake db:seed
   ```

6. **Access at:** `https://support.busmo.io`

### Option B: Manual Installation

See official guide: https://www.chatwoot.com/docs/self-hosted

## Step 3: Get Your Chatwoot Credentials

Once Chatwoot is running:

### 1. **Create Admin Account (First Time Only)**
1. Go to `https://support.busmo.io/setup`
2. Fill in your details:
   - Name
   - Email
   - Password
3. This creates your admin account

### 2. **Get Your Account ID**
1. Log in to `https://support.busmo.io/dashboard`
2. Go to **Settings** → **Account** → **API Keys**
3. Copy the **Account ID** (usually `1` for first account)

### 3. **Get Your Website Inbox Token**
1. In Chatwoot dashboard, go to **Settings** → **Inboxes**
2. You should see a "Website" inbox
3. Click on it
4. Copy the **Website Token**

### 4. **Get API Access Token**
1. Go to **Settings** → **API Keys**
2. Click **New API Key**
3. Copy the generated token

### 5. **Get HMAC Secret (Optional)**
1. Go to **Settings** → **Security**
2. Copy **HMAC Secret**

## Step 4: Update Your `.env.local`

```env
# Chatwoot Configuration
NEXT_PUBLIC_CHATWOOT_ENABLED=true
NEXT_PUBLIC_CHATWOOT_URL=https://support.busmo.io
NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=1  # Use your actual Account ID
NEXT_PUBLIC_CHATWOOT_INBOX_ID=1    # Use your actual Inbox ID
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your-website-token
CHATWOOT_API_ACCESS_TOKEN=your-api-token
CHATWOOT_HMAC_SECRET=your-hmac-secret
```

## Step 5: Restart Busmo

```bash
npm run dev
```

## Step 6: Test the Integration

1. Open your Busmo app
2. Open FloatingChatWidget
3. Click "👤 Human" button
4. Chatwoot widget should open
5. Send a message
6. Go to `https://support.busmo.io/dashboard`
7. You should see the conversation

## Common Issues and Solutions

### Issue: "Network Error" when accessing Chatwoot

**Solution:**
```bash
# Check if containers are running
docker-compose ps

# If not, start them
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Issue: "Page Not Found" (404)

**Solution:**
- Make sure you're accessing the correct URL
- Frontend URL should be `https://support.busmo.io`
- Try: `https://support.busmo.io/dashboard`

### Issue: Chatwoot loads but shows setup page

**Solution:**
```bash
# Run the seed script
docker-compose exec web bundle exec rake db:seed
```

### Issue: Can't log in

**Solution:**
- Make sure you created an admin account at `/setup`
- Try password reset
- Check browser cookies/localStorage aren't blocked

### Issue: Pages load slowly

**Solution:**
```bash
# Check if all services are running
docker-compose ps

# Restart if needed
docker-compose restart
```

## Verifying Installation

### Check Chatwoot Status:
```bash
# Docker installation
docker-compose ps
# All services should show "Up"

# Manual installation
sudo systemctl status chatwoot
# Should show "active (running)"
```

### Test Connectivity:
```bash
# From your local machine
curl https://support.busmo.io/health_check

# Should return: {"status":"ok"}
```

### Test API Access:
```bash
curl -X GET \
  https://support.busmo.io/api/v1/accounts/1 \
  -H 'api_access_token: YOUR_TOKEN_HERE'
```

## If Chatwoot Still Doesn't Work

### Option 1: Use Chatwoot Cloud (Easiest)
If self-hosting is problematic, use Chatwoot's official cloud:
1. Sign up at https://app.chatwoot.com
2. Follow their setup wizard
3. Update your Busmo `.env.local` with Chatwoot cloud credentials
4. Much easier - no server management needed

### Option 2: Check Network/Firewall
```bash
# Make sure port 3000 is open
sudo ufw allow 3000

# Check firewall rules
sudo ufw status
```

### Option 3: Reinstall Chatwoot
```bash
# Stop and remove old containers
docker-compose down -v

# Start fresh
docker-compose up -d --build

# Run setup
docker-compose exec web bundle exec rake db:setup
```

## Quick Checklist

- [ ] Chatwoot containers are running (`docker-compose ps`)
- [ ] Can access `https://support.busmo.io` in browser
- [ ] Can reach setup page: `https://support.busmo.io/setup`
- [ ] Created admin account
- [ ] Got Account ID (usually 1)
- [ ] Got Website Token
- [ ] Got API Access Token
- [ ] Updated `.env.local` with all values
- [ ] Restarted Busmo server
- [ ] Tested from Busmo app - Chatwoot widget opens

## Need More Help?

- **Chatwoot Docs**: https://www.chatwoot.com/docs/self-hosted
- **Chatwoot Community**: https://discord.gg/cFQrXgZ
- **Docker Setup Guide**: https://www.chatwoot.com/docs/deploy-with-docker

## Summary

The issue is that the Chatwoot server isn't running. You need to:

1. **Start Chatwoot server** (using Docker or manual install)
2. **Create admin account** at `/setup`
3. **Get credentials** from Chatwoot dashboard
4. **Update `.env.local`** with real credentials
5. **Restart Busmo**

Once Chatwoot is running, you'll be able to access the dashboard and respond to users.