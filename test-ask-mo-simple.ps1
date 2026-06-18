$body = @{
    message = "Hello, how is my business doing?"
    businessId = "test"
    language = "en"
    languageName = "English"
    userId = "test-user-123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/ask-mo' -Method POST -ContentType 'application/json' -Body $body -ErrorAction Stop
    Write-Output $response
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Output "Error Body: $errorBody"
    }
}
