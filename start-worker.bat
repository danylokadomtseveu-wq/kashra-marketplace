@echo off
cd /d C:\Users\lumin\Documents\Default Project
set DATABASE_URL=postgresql://marketplace:marketplace_dev_password@localhost:5432/marketplace?schema=public
set REDIS_URL=redis://localhost:6379
set REDIS_PREFIX=mkpl:
set JWT_ACCESS_SECRET=dev_access_secret_change_me
set JWT_REFRESH_SECRET=dev_refresh_secret_change_me
set NODE_ENV=development
set LOG_LEVEL=info
set S3_ENDPOINT=http://localhost:9000
set S3_REGION=us-east-1
set S3_BUCKET=media
set S3_ACCESS_KEY=minioadmin
set S3_SECRET_KEY=minioadmin
set S3_PUBLIC_URL=http://localhost:9000/media
set WORKER_CONCURRENCY=10
npm run dev:worker
