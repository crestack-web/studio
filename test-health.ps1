try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3002/api/ask-mo/health' -UseBasicParsing -TimeoutSec 10
    Write-Output $response.Content
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
