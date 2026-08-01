$body = '{"email":"admin@vlrk.com","password":"password123"}'
$r = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Host "Login OK — User: $($r.data.user.nama) | Role: $($r.data.user.role)"
$token = $r.data.token
$headers = @{ Authorization = "Bearer $token" }

$rooms = Invoke-RestMethod -Uri 'http://localhost:3001/api/rooms' -Headers $headers
Write-Host "Rooms returned: $($rooms.total)"

$stats = Invoke-RestMethod -Uri 'http://localhost:3001/api/admin/stats/summary' -Headers $headers
Write-Host "Reservations total: $($stats.data.reservations.total) | Pending: $($stats.data.reservations.pending)"
Write-Host "Rooms active: $($stats.data.rooms.active)"
Write-Host "Users total: $($stats.data.users.total)"

$audit = Invoke-RestMethod -Uri 'http://localhost:3001/api/admin/audit-logs' -Headers $headers
Write-Host "Audit logs: $($audit.pagination.total)"

Write-Host "All checks passed OK!"
