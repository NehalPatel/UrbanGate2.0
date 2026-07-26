# Starts a single-node MongoDB replica set on port 27018 (required by Prisma).
# Uses the installed mongod.exe; data lives in .data/mongo (gitignored).

$ErrorActionPreference = "Stop"
$mongoBin = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
if (-not (Test-Path $mongoBin)) {
  Write-Error "mongod.exe not found at $mongoBin. Install MongoDB or update this script path."
}

$root = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $root ".data\mongo"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$existing = Get-NetTCPConnection -LocalPort 27018 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "MongoDB already listening on 27018"
} else {
  Start-Process -FilePath $mongoBin -ArgumentList "--dbpath `"$dataDir`" --port 27018 --replSet rs0 --bind_ip 127.0.0.1" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

mongosh --port 27018 --quiet --eval "try { rs.status().ok } catch (e) { rs.initiate({_id:'rs0', members:[{_id:0, host:'127.0.0.1:27018'}]}) }" | Out-Null
Start-Sleep -Seconds 2
mongosh --port 27018 --quiet --eval "print('replica set ok=' + rs.status().ok)"

Write-Host "DATABASE_URL=mongodb://127.0.0.1:27018/urbangate?replicaSet=rs0&directConnection=true"
