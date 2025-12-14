# 🧪 Tests PowerShell - XCAfrique Backend

## Test de l'endpoint Newsletter

### Méthode 1 : Invoke-WebRequest (PowerShell natif)

```powershell
$body = @{
    email = "test@example.com"
    name = "Test User"
    source = "website"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/newsletter/subscribe" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Méthode 2 : Invoke-RestMethod (plus simple, retourne directement JSON)

```powershell
$body = @{
    email = "test@example.com"
    name = "Test User"
    source = "website"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/newsletter/subscribe" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

### Méthode 3 : Avec un email unique (pour éviter les doublons)

```powershell
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "test-$timestamp@example.com"

$body = @{
    email = $email
    name = "Test User"
    source = "website"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/newsletter/subscribe" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✅ Succès:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
```

### Test des cas d'erreur

#### Test 1 : Email invalide

```powershell
$body = @{
    email = "email-invalide"
    name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/newsletter/subscribe" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    Write-Host "Réponse:" -ForegroundColor Yellow
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Erreur attendue:" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json
}
```

#### Test 2 : Email manquant

```powershell
$body = @{
    name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/newsletter/subscribe" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
} catch {
    Write-Host "❌ Erreur attendue:" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json
}
```

### Test de l'endpoint Contact

```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    subject = "Test de contact"
    message = "Ceci est un message de test"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/contact" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10
```

### Vérifier que le serveur fonctionne

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000"
$response | ConvertTo-Json -Depth 10
```

