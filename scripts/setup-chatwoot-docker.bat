@echo off
REM Chatwoot Docker Self-Hosting Setup Script for Windows
REM 
REM This script sets up Chatwoot using Docker for self-hosting at https://support.busmo.io
REM 
REM Prerequisites:
REM - Docker Desktop installed on your Windows machine
REM - Domain name (support.busmo.io) pointed to your server
REM - Ports 3000 and 3030 open

echo ==========================================
echo Chatwoot Docker Setup for Busmo
echo ==========================================
echo.

REM Add Docker to PATH if not already present
set "DOCKER_PATH=C:\Program Files\Docker\Docker\resources"
set "PATH=%PATH%;%DOCKER_PATH%"

REM Step 1: Check prerequisites
echo [1/8] Checking prerequisites...

REM Check if Docker Desktop is installed
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo Docker Desktop found
) else (
    echo ERROR: Docker Desktop is not installed.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if docker command is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker command not found in PATH.
    echo Please restart your terminal or computer to refresh PATH.
    echo Alternatively, use Docker Desktop to open a terminal with docker in PATH.
    pause
    exit /b 1
)

docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available.
    echo Please ensure Docker Desktop is installed with Compose plugin.
    pause
    exit /b 1
)

echo Docker and Docker Compose found
echo.

REM Step 2: Create installation directory
echo [2/8] Creating Chatwoot installation directory...
set INSTALL_DIR=C:\chatwoot
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo Created %INSTALL_DIR%
) else (
    echo Directory %INSTALL_DIR% already exists
)
cd /d "%INSTALL_DIR%"
echo.

REM Step 3: Clone Chatwoot repository
echo [3/8] Cloning Chatwoot repository...
if not exist "%INSTALL_DIR%\chatwoot" (
    git clone https://github.com/chatwoot/chatwoot.git
    cd chatwoot
    echo Cloned Chatwoot repository
) else (
    cd chatwoot
    echo Chatwoot directory already exists, updating...
    git pull origin main
)
echo.

REM Step 4: Generate secret key
echo [4/8] Generating SECRET_KEY_BASE...
REM Using PowerShell to generate random hex
for /f "delims=" %%i in ('powershell -Command "[System.BitConverter]::ToString((New-Object System.Random).NextBytes(32)).Replace('-','').ToLower()"') do set SECRET_KEY=%%i
echo Generated secret key: %SECRET_KEY:~0,20%...
echo.

REM Step 5: Configure environment file
echo [5/8] Configuring .env file...
if not exist ".env" (
    copy .env.example .env
    echo Created .env from .env.example
    
    REM Basic configuration
    powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=https://support.busmo.io' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'RAILWEB_URL=.*', 'RAILWEB_URL=https://support.busmo.io' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'SECRET_KEY_BASE=.*', 'SECRET_KEY_BASE=%SECRET_KEY%' | Set-Content .env"
    
    REM Mailer configuration
    powershell -Command "(Get-Content .env) -replace 'MAILER_SENDER_EMAIL=.*', 'MAILER_SENDER_EMAIL=support@busmo.io' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'MAILER_DOMAIN=.*', 'MAILER_DOMAIN=busmo.io' | Set-Content .env"
    
    REM Enable installation for single server
    powershell -Command "(Get-Content .env) -replace 'INSTALLATION_ENV=.*', 'INSTALLATION_ENV=linux_docker' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'ACTIVE_STORAGE_SERVICE=.*', 'ACTIVE_STORAGE_SERVICE=local' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'RAILS_ENV=.*', 'RAILS_ENV=production' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'NODE_ENV=.*', 'NODE_ENV=production' | Set-Content .env"
    
    echo Configured environment variables
) else (
    echo .env file already exists, skipping configuration
)
echo.

REM Step 6: Start Docker containers
echo [6/8] Starting Chatwoot containers...
cd /d "%INSTALL_DIR%\chatwoot"
docker compose up -d
echo Started Docker containers
echo.

REM Wait for containers to be ready
echo Waiting for containers to start (this may take 2-3 minutes)...
powershell -Command "Start-Sleep -Seconds 30"

REM Check container status
docker compose ps
echo.

REM Step 7: Run database setup
echo [7/8] Setting up database...
echo Running database migrations...
docker compose exec -T web bundle exec rails db:create db:migrate

echo Creating admin user...
echo IMPORTANT: Follow the prompts to create your admin account
docker compose exec web bundle exec rails db:seed
echo.

REM Step 8: Verify installation
echo [8/8] Verifying installation...
echo.
echo ==========================================
echo Chatwoot Docker Setup Complete^!
echo ==========================================
echo.
echo Next steps:
echo.
echo 1. Access Chatwoot at: https://support.busmo.io/setup
echo.
echo 2. Get your Chatwoot credentials:
echo    - Account ID: Settings ^&rarr; Account ^&rarr; API Keys (usually 1)
echo    - Website Token: Settings ^&rarr; Inboxes ^&rarr; Website inbox
echo    - API Access Token: Settings ^&rarr; API Keys ^&rarr; New API Key
echo    - HMAC Secret: Settings ^&rarr; Security (optional^)
echo.
echo 3. Update Busmo .env.local with these credentials:
echo    NEXT_PUBLIC_CHATWOOT_ENABLED=true
echo    NEXT_PUBLIC_CHATWOOT_URL=https://support.busmo.io
echo    NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=your-account-id
echo    NEXT_PUBLIC_CHATWOOT_INBOX_ID=1
echo    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your-website-token
echo    CHATWOOT_API_ACCESS_TOKEN=your-api-token
echo    CHATWOOT_HMAC_SECRET=your-hmac-secret
echo.
echo 4. Restart Busmo: npm run dev
echo.
echo Useful commands:
echo   Start:  cd %INSTALL_DIR%\chatwoot ^& docker compose up -d
echo   Stop:   cd %INSTALL_DIR%\chatwoot ^& docker compose down
echo   Restart: cd %INSTALL_DIR%\chatwoot ^& docker compose restart
echo   Logs:   cd %INSTALL_DIR%\chatwoot ^& docker compose logs -f
echo.
pause