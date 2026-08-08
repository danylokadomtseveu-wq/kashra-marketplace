# Деплой на Linux VPS (Docker-first)

Проект разрабатывается на Windows (Docker Desktop) и деплоится на Linux VPS без
изменения исходного кода: все сервисы собираются и запускаются одинаково через
Docker. Всё состояние — в Docker volumes, конфигурация — в `.env.production`.

## 1. Требования к серверу

- Linux (Ubuntu 22.04+/Debian 12+), ядро x86_64
- Docker Engine 24+ + Compose v2 (`docker compose version`)
- Минимум: 2 vCPU / 4 GB RAM (для старта), целевое — по нагрузке
- Открытые порты: 80, 443 (только). Внутренние сервисы наружу не публикуются
  (в compose-файле они только `expose`).

## 2. Подготовка на dev-машине (Windows)

```powershell
# 1. Собрать образы
$env:REGISTRY=""          # если используете свой registry — укажите
$env:IMAGE_NAMESPACE="yourorg"
docker build -t marketplace-api:latest   -f apps/api/Dockerfile .
docker build -t marketplace-worker:latest -f apps/worker/Dockerfile .
docker build -t marketplace-web:latest   -f apps/web/Dockerfile .

# 2. Загрузить в registry (GHCR/Docker Hub/Harbor...)
docker tag marketplace-api:latest   ghcr.io/yourorg/marketplace-api:latest
docker push ghcr.io/yourorg/marketplace-api:latest
docker push ghcr.io/yourorg/marketplace-worker:latest
docker push ghcr.io/yourorg/marketplace-web:latest
```

Либо собирать образы прямо на сервере из git-репозитория (см. §5).

## 3. Подготовка сервера

```bash
# 1. Установить Docker (одной командой) — или вручную из docker.com
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Клонировать проект (или загрузить только: docker-compose.prod.yml,
#    .env.production, infrastructure/nginx/)
git clone <your-repo> /opt/marketplace && cd /opt/marketplace

# 3. Секреты: создать .env.production из шаблона и ЗАПОЛНИТЬ
cp .env.production.example .env.production
chmod 600 .env.production
#   Сгенерировать секреты:
#     openssl rand -base64 48   -> JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
#     openssl rand -base64 24   -> POSTGRES_PASSWORD, S3_*_KEY
```

## 4. Первый запуск

```bash
cd /opt/marketplace

# Миграции (выполняется один раз / при каждом релизе)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate

# Seed (только при первом запуске, опционально)
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm api sh -c "cd apps/api && npx tsx prisma/seed.ts"

# Запуск инфраструктуры (postgres, redis, minio)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis minio

# Запуск приложений: nginx + web + api(1 экземпляр) + worker
docker compose -f docker-compose.prod.yml --env-file .env.production up -d nginx web api worker
```

## 5. TLS (HTTPS)

В `infrastructure/nginx/nginx.prod.conf` настроены заголовки и rate limit.
TLS-сертификаты положите в volume `certs` (смонтирован в `/etc/nginx/certs`):

```bash
# Let's Encrypt + certbot (на сервере, вне контейнера):
sudo apt install certbot
sudo certbot certonly --standalone -d example.com -d api.example.com
# Скопировать в каталог, который смонтирован в контейнер nginx (сerts)
```

Либо подключите Caddy/Cloudflare Tunnel — nginx конфиг не потребует изменений.

## 6. Масштабирование (горизонтальное)

API stateless (JWT, Redis, PostgreSQL) — масштабируется копиями:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --scale api=3
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --scale worker=2
```

- `nginx` выступает load balancer'ом для API (upstream `api`).
- Реплики API не хранят состояние; сессии/лимиты — в Redis.
- Для большей нагрузки: реплика PostgreSQL (заполнить `DATABASE_URL_REPLICA`)
  и PgBouncer перед БД.

## 7. Обновление (zero-downtime-процесс)

```bash
cd /opt/marketplace
git pull                       # новая версия кода (или docker pull новых образов)

# 1. Миграции БД вперёд
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate

# 2. Пересоздать контейнеры
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --scale api=3

# 3. Проверить здоровье
curl -fsS http://localhost:4000/api/v1/health/live    # -> {"status":"ok",...}
curl -fsS http://localhost:4000/api/v1/health/ready   # -> status ok (БД+Redis доступны)
```

## 8. Бэкапы

```bash
# PostgreSQL (daily cron)
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backups/db_$(date +%F).sql.gz

# Redis AOF лежит в volume redisdata; MinIO — в volume miniodata.
# Секреты (.env.production) — отдельно, вне volumes.
```

## 9. Мониторинг (настраивается в PHASE 17)

- `/api/v1/health/live` — liveness (процесс жив)
- `/api/v1/health/ready` — readiness (БД/Redis доступны)
- Prometheus-метрики `/api/v1/metrics` — появятся в PHASE 17
- `docker compose ps` / `docker compose logs -f api`

## 10. Откат

```bash
# Версия образа фиксируется в .env.production: IMAGE_TAG=latest (или тег релиза)
# Для отката достаточно указать предыдущий тег и пересоздать:
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --force-recreate
# Откат миграций — restore из бэкапа (§8) + повторный migrate.
```

## Правила проекта

1. Код не содержит Windows-специфики (пути, API). Контейнеры собираются на
   Linux; локально на Windows всё тоже запускается через Docker Desktop.
2. Секреты — только в `.env.production` (не в git). `docker-compose.prod.yml`
   читает их через `env_file`.
3. Наружу публикуется только nginx (80/443). API/web — внутри сети compose.
4. Каждая фаза завершается проверками: typecheck + lint + тесты + сборка.
