$env:DATABASE_URL = "postgresql://marketplace:marketplace_dev_password@localhost:5432/marketplace?schema=public"
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1"
$env:WEB_PORT = "3000"
$env:NODE_ENV = "development"

Set-Location "C:\Users\lumin\Documents\Default Project"
npm run dev:web
