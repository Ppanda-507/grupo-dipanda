param([string]$OutputDirectory = (Join-Path $env:TEMP 'dipanda-local-tls'))
$ErrorActionPreference = 'Stop'
$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
$opensslPath = if ($opensslCommand) { $opensslCommand.Source } else { 'C:/Program Files/Git/mingw64/bin/openssl.exe' }
if (-not (Test-Path -LiteralPath $opensslPath)) { throw 'Install OpenSSL, or make openssl available on PATH.' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$keyPath = Join-Path $OutputDirectory 'localhost-key.pem'
$certPath = Join-Path $OutputDirectory 'localhost-cert.pem'
if ((Test-Path -LiteralPath $keyPath) -or (Test-Path -LiteralPath $certPath)) { throw 'Certificate files already exist; choose a new output directory.' }
& $opensslPath req -x509 -newkey rsa:2048 -sha256 -nodes -days 7 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1' -keyout $keyPath -out $certPath
if ($LASTEXITCODE -ne 0) { throw 'OpenSSL certificate generation failed.' }
Write-Output "TLS_KEY=$keyPath"
Write-Output "TLS_CERT=$certPath"
Write-Output 'Development only. No root certificate or trust setting was installed.'
