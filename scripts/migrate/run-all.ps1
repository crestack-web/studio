<#
  run-all.ps1
  ============================================================
  One-command runner for the Firebase -> Supabase migration.

  Steps (must be done in this order):
    1. Apply supabase/migrations/0001 + 0002 in the Supabase
       SQL Editor FIRST (DDL cannot run from here).
    2. Run this script.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts\migrate\run-all.ps1

  Env vars are loaded automatically from .env.production and
  .env.local via Node's --env-file flag, so you don't need to
  set anything by hand. Run in a FRESH PowerShell window so no
  stale vars leak in.
#>
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

# ---- Build the --env-file arguments (later files override earlier) ----
$envFiles = @()
$envMap = @{}
foreach ($f in @(".env.production", ".env.local")) {
  if (Test-Path $f) { $envFiles += "--env-file=$f" }
}
if ($envFiles.Count -eq 0) {
  throw "No .env.production / .env.local found. Create them first (see .env.example)."
}

foreach ($f in @(".env.production", ".env.local")) {
  if (-not (Test-Path $f)) { continue }
  foreach ($line in Get-Content $f) {
    $line = $line.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { continue }
    $eq = $line.IndexOf("=")
    if ($eq -lt 0) { continue }
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
    $envMap[$k] = $v
  }
}

function Assert-Vars([string[]]$names) {
  foreach ($n in $names) {
    if (-not $envMap.ContainsKey($n) -or [string]::IsNullOrEmpty($envMap[$n])) {
      throw "Missing environment variable: $n"
    }
  }
}

function Run-Step([string]$label, [string]$script) {
  Write-Host "`n==============================================" -ForegroundColor Cyan
  Write-Host "  $label" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  node @envFiles $script
  if ($LASTEXITCODE -ne 0) { throw "$script exited with code $LASTEXITCODE" }
}

Write-Host "Migrating with env files: $($envFiles -join ' ')" -ForegroundColor Gray

# The export needs Firebase admin credentials.
Assert-Vars @("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_ADMIN_CLIENT_EMAIL")
Run-Step "Export Firestore -> supabase/migration-data" "scripts/migrate/export-firestore.mjs"

# The import needs the Supabase service-role key.
Assert-Vars @("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
Run-Step "Recreate auth users in Supabase" "scripts/migrate/import-auth-users.mjs"
Run-Step "Import businesses + users first" "scripts/migrate/import-supabase.mjs businesses users"
Run-Step "Import the remaining tables" "scripts/migrate/import-supabase.mjs"

Write-Host "`nMigration complete. Check the table counts above." -ForegroundColor Green
