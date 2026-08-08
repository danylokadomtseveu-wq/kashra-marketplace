@echo off
cd /d F:\Kashra
set DATABASE_URL=postgresql://marketplace:marketplace_dev_password@localhost:5432/marketplace?schema=public
set REDIS_URL=redis://localhost:6379
set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
set WEB_PORT=3000
set NODE_ENV=development
npm run dev:web
