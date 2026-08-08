# Архитектура Marketplace — PHASE 0

Цель: production-ready marketplace (аналог FunPay) с архитектурой, способной
масштабироваться горизонтально до 1 000 000 concurrent users.
Нагрузочная способность подтверждается только нагрузочными тестами (k6, PHASE 19).

---

## 1. Ключевые архитектурные решения

| Решение | Обоснование |
|---|---|
| **Modular Monolith + Stateless API** | Без микросервисов на старте, модули изолированы так, что их можно вынести в микросервисы без переписывания (общение через интерфейсы + outbox-события) |
| **NestJS + Fastify adapter** | Быстрая разработка, DI, модульность; Fastify — быстрее Express на ~2-3x под нагрузкой |
| **PostgreSQL (Primary + Read Replicas)** | Единый source of truth; реплики для read-heavy каталога |
| **Redis** | Кэш (cache-aside), rate limiting, distributed locks, очереди BullMQ. Redis — НЕ источник истины |
| **Prisma ORM** | Типобезопасные запросы, миграции, connection pooling (PgBouncer совместимый режим) |
| **Transactional Outbox** | События (заказ создан, оплата прошла) пишутся в БД той же транзакцией; worker публикует их в очереди — нет потери событий |
| **Идемпотентность** | Idempotency-Key на создание заказа и обработку webhook'ов — повторные запросы не создают дубли |
| **Next.js (App Router) + SSR/SSG** | SEO, отдаём публичные страницы кэшированными через CDN |
| **CDN + WAF + Load Balancer** | Статика/изображения/кэшируемые страницы не доходят до Node.js |
| **Виртуальная waiting room** | Точка интеграции (Cloudflare Waiting Room / custom) для защиты при spike |

### Почему не микросервисы сейчас

- Сложность (сеть, саги, деплой) на старте не окупается.
- Монолит горизонтально масштабируется теми же инстансами API.
- Модули разделены по границам доменов; будущий вынос = новый deploy того же кода.

### Statelessness

- JWT access (15 min) + refresh token (30 days, rotation) в httpOnly cookie.
- Сессии/rate-limit-состояние — в Redis, не в памяти процесса.
- Кэши — только через Redis.
- Любой API instance обслуживает любой запрос.

---

## 2. Структура monorepo

```
/
├── apps/
│   ├── api/            # NestJS + Fastify (REST API v1, /api/v1)
│   ├── web/            # Next.js (App Router), dark list-first UI
│   └── worker/         # BullMQ workers (outbox, нотификации, поиск, платежи)
├── packages/
│   ├── shared/         # утилиты, константы, event-схемы
│   ├── types/          # общие типы (API-контракты)
│   ├── validation/     # Zod-схемы (используются api + web)
│   └── config/         # env-схемы (zod), общие конфиги
├── prisma/             # schema.prisma, migrations, seed
├── load-tests/         # k6 сценарии
├── infrastructure/
│   ├── docker/         # Dockerfile-секции, entrypoints
│   ├── nginx/          # reverse proxy, gzip, headers, rate limit
│   ├── monitoring/     # prometheus config, dashboards
│   └── deployment/     # compose.prod.yml, terraform-готовые шаблоны
├── docs/
├── docker-compose.yml  # dev: postgres, redis, api, worker, web
├── docker-compose.prod.yml
├── .env.example
└── package.json        # npm workspaces
```

---

## 3. Database entities (PostgreSQL, Prisma)

Пользователи и роли:
- `User` (id, email, passwordHash, name, role: USER|SELLER|ADMIN, status, timestamps)
- `SellerProfile` (userId, description, verificationStatus, ratingCache, salesCount)
- `AuditLog` (actorId, action, entityType, entityId, metadata, createdAt)

Каталог:
- `Category` (id, slug, name, parentId?, sort, isActive)
- `Brand` (id, slug, name)  — по ТЗ
- `Product` (id, slug, sellerId, categoryId, brandId?, title, description, price,
  oldPrice?, currency, availability, attrs JSONB, ratingCache, reviewCount,
  publishedAt, softDelete, timestamps)
- `ProductVariant` (id, productId, title, attrs JSONB, price?, stock)
- `ProductImage` (id, productId, url, alt, sort) — объект в Object Storage/CDN

Инвентарь:
- `Inventory` (variantId или productId PK, stock, reserved)
- `InventoryReservation` (id, itemId, orderId, qty, status, expiresAt)

Корзина:
- `Cart` (id, userId?, guestId?, mergedAt?)
- `CartItem` (cartId, productId, variantId?, qty)

Заказы/платежи:
- `Order` (id, userId, status, total, currency, itemsSummary, idempotencyKey UNIQUE)
- `OrderItem` (orderId, productId, variantId?, title, price, qty)
- `Payment` (id, orderId, provider, providerPaymentId, amount, status, createdAt)
- `PaymentEvent` (id, paymentId, type, payload, raw, processedAt)
- `Address` (userId, …)

Социальное:
- `Review` (id, productId, authorId, rating, text, moderated, timestamps)
- `Favorite` (userId, productId, createdAt)

Маркетинг:
- `Coupon` (id, code UNIQUE, type, value, maxUses, usedCount, expiresAt)
- `Promotion` (id, title, type: PERCENT|FIXED, value, startsAt, endsAt, scope)

Инфраструктура:
- `Notification` (id, userId, type, payload, readAt)
- `OutboxEvent` (id, eventType, payload JSONB, status, attempts, lockUntil, processedAt)
- `IdempotencyKey` (key UNIQUE, response JSONB, expiresAt)

### Индексы

- `Product`: `(categoryId, status, publishedAt DESC)`, `(sellerId)`, `(slug)` UNIQUE,
  `(price)`, FTS-GIN на `(title, description)` (`to_tsvector('russian', ...)`)
- `Order`: `(userId, createdAt DESC)`, `(status, createdAt)`, `(idempotencyKey)` UNIQUE
- `Inventory`: `(variantId)` UNIQUE, `(productId)`
- `Review`: `(productId, moderated, createdAt)`, `(authorId)`
- `OutboxEvent`: `(status, lockUntil)` partial
- `Notification`: `(userId, readAt)`

### Concurrency / инвентарь

- Проверка stock + резервирование в одной транзакции с `SELECT ... FOR UPDATE`
  по строке Inventory (row lock) — защита от overselling.
- Резервирование имеет TTL; неоплаченные резервы освобождаются worker'ом.
- Создание заказа идемпотентно через UNIQUE `idempotencyKey`.

---

## 4. Backend modules (NestJS, /api/v1)

```
auth           POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/password-reset, /auth/verify-email
users          GET/PATCH /users/me, GET /users/:id (public)
sellers        GET /sellers/:id, PATCH /sellers/me, POST /sellers/me/products
products       CRUD /products (публичные — кэшируются; управление — только владелец)
categories     GET /categories (кэш Redis, долгий TTL)
brands         GET /brands (кэш)
inventory      PATCH /products/:id/stock (seller), резервирование internal
cart           GET/POST/PATCH/DELETE /cart, POST /cart/merge
orders         POST /orders (Idempotency-Key), GET /orders/me, GET /orders/:id
payments       POST /payments, POST /payments/webhook/:provider, POST /payments/:id/refund
reviews        GET /products/:id/reviews, POST /reviews
favorites      GET/POST/DELETE /favorites
promotions     GET /promotions, POST /coupons/validate
notifications  GET /notifications, POST /notifications/read
search         GET /search?q=&category=&price=…&sort=… (cursor pagination)
admin          /admin/users, /admin/products, /admin/orders, /admin/audit
health         /health, /health/live, /health/ready
```

Принцип: `Controller → Service → Repository → DB`; DTO-валидация (class-validator/zod);
единый формат ошибок `{ error: { code, message, details } }`; Swagger.

### Rate limiting

- login/register: Redis sliding window (например, 5/min/IP + per-user backoff)
- search: 30/min/user; checkout: 10/min/user; admin: strict
- Глобальный per-IP лимит через nginx + API-слой

### Аутентификация

- Access JWT 15 min (httpOnly cookie или Authorization header)
- Refresh JWT 30 d, rotation + reuse detection (invalid-сессия при повторе)
- bcrypt/argon2id для паролей, email verification, password reset через outbox-mail

---

## 5. Outbox + Queues (BullMQ)

Транзакция «создать заказ»: `INSERT Order + INSERT OutboxEvent` → commit →
worker читает outbox → ставит job в очередь → event-processor:
- `order-events` (нотификации, аналитика)
- `emails` (письма — SMTP-адаптер, в dev — логгер)
- `payments` (инициализация, подтверждение, refund)
- `inventory` (освобождение резервов, сток-события)
- `search-indexing` (индексация продукта в FTS)
- `notifications` (внутренние уведомления)

HTTP-запрос не ждёт долгих фоновых операций. Очереди = источник отказоустойчивости:
job retries, DLQ, видимость таймаутов.

---

## 6. Payments (абстракция)

```
PaymentProvider (interface)
 ├── createPayment(order, meta) → { providerPaymentId, redirectUrl }
 ├── confirmPayment(providerId, providerRef)
 ├── handleWebhook(rawPayload, headers) → validated event
 ├── refund(providerPaymentId, amount)
 └── capabilities
```

Провайдеры:
- `WalletProvider` — внутренний кошелёк (MVP, реальная архитектура: транзакции,
  баланс, эскроу) — полноценная реализация, не mock
- `StripeProvider` / `YooKassaProvider` — интерфейс готов, подключение = новый класс

Webhook: подпись/секрет → валидация → идемпотентность (providerPaymentId UNIQUE,
повторный event не меняет состояние) → outbox.

Эскроу: сумма заказа замораживается на балансе покупателя; продавец получает
деньги после подтверждения/автоподтверждения; возврат при споре.

---

## 7. Cache strategy (Redis)

- `categories` — TTL 1h + invalidate при изменении
- `product:public:{id}` — TTL 5 min, invalidate при update/sale
- `marketplace:popular` — топ-продукты, пересчёт worker'ом
- `search:{hash(query+params)}` — 2 min, результаты + count
- Cache-Aside, cache stampede protection (lock + single-flight), jitter TTL
- Персональные данные не кэшируются агрессивно (только сессии/rate-limit)

---

## 8. Масштабирование до 1M concurrent

```
            INTERNET
               │
              CDN (статика, изображения, кэшируемые страницы, WAF, bot protection)
               │
        Waiting Room (при spike)
               │
         Load Balancer (nginx / cloud LB)
               │
      ┌────────┼────────┬────────┐
      │        │        │        │
   API #1    API #2   API #N   (stateless NestJS)
      │        │        │
      └────────┼────────┘
               │
        ┌──────┴──────┐
        │  Redis      │  (кэш, лимиты, lock'и, BullMQ)
        │  (кластер)  │
        └──────┬──────┘
               │
    ┌──────────┴──────────┐
    │  PostgreSQL         │
    │  Primary (запись)   │
    │  + Read Replicas    │
    └─────────────────────┘
        Workers (outbox, очереди) — отдельные ноды, scale independently
```

Правила, гарантирующие горизонтальное масштабирование:
1. API stateless: всё состояние — в Redis/БД/cookie.
2. Горячий публичный каталог обслуживает CDN + Redis, не БД.
3. Записи — только в Primary; чтения каталога — replicas (по готовности).
4. Тяжёлые операции — в Worker'ы (индексация, письма, отчёты).
5. Идемпотентность + outbox = безопасные retries и дублирование под нагрузкой.
6. Waiting Room / rate limit защищают checkout и БД при пике.
7. PgBouncer (transaction pooling) на пути API → PostgreSQL.
8. Autoscaling API по CPU/RPS; Worker'ы по queue depth.

---

## 9. Frontend (Next.js)

- App Router, TypeScript, Tailwind 4, Server Components по умолчанию
- SSR/SSG: главная, категории, product pages (SEO: title, OG, canonical, JSON-LD)
- Данные: Server Components → API (или cached fetch); клиентские состояния — минимально
- Список лотов: list-first UI, плотные строки, пагинация/бесконечный скролл
- Изображения: `next/image`, CDN, lazy, WebP/AVIF
- Страницы: Home, Marketplace, Search, Category, Product, Cart, Checkout, Orders,
  Profile, Seller Dashboard, Admin Dashboard
- Формы: React Hook Form + Zod (schemas из packages/validation)

### UI Design System (dark, list-first)

- Только тёмная тема. Нет карточек товаров, нет grid из карточек, нет градиентов
  и glassmorphism.
- Фон `#0b0d10`, поверхности `#111418`, бордеры `#1e242b`, текст `#e8eaed`,
  secondary `#9aa4af`, акцент — один цвет `#4f8cff` (используется только
  для действий), danger `#e5484d`, success `#30a46c`.
- Каталог: таблица/список — `Товар | Продавец | Цена | Остаток | Рейтинг | Действие`.
- Товар: компактная строка, маленький thumbnail, информация главнее изображения.
- Поиск — центральный элемент интерфейса (глобальная строка + фильтры).
- A11y: WCAG AA, keyboard nav, focus states, aria-labels, semantic HTML.

---

## 10. Observability / Security / Quality

- Observability: structured JSON-логи (requestId/correlationId), /health/live + /health/ready,
  Prometheus-метрики (RPS, p50/p95/p99, error rate, event loop lag, queue depth,
  DB/Redis latency, slow queries), request logging middleware.
- Security: Helmet, CORS whitelist, rate limits, Zod-валидация всех входов,
  argon2id, JWT rotation, secure httpOnly cookies, presigned upload в Object Storage
  (лимиты размера/MIME), audit log для admin, secrets только в env (не в Git).
- Testing: unit (services/rules), integration (БД+Redis+очереди, testcontainers-подобный
  dev compose), E2E (Playwright: auth/catalog/cart/checkout/orders/seller/admin),
  конкурентные сценарии (double checkout, overselling, duplicate webhook),
  load-тесты k6 (см. PHASE 19).
- Error format: единый `{ error: { code, message, details? } }`, без stack в prod.

---

## 11. План фаз и критерии готовности

| Фаза | Содержание | Критерий |
|---|---|---|
| 0 | Архитектура (этот документ) | документ утверждён |
| 1 | Foundation: monorepo, NestJS+Fastify, Next.js, TS, ESLint, Prettier, Docker Compose, env | build/lint/typecheck зелёные, `/health` отвечает |
| 2 | DB: Prisma, миграции, seed | миграции применяются, seed консистентен |
| 3 | Auth: регистрация/логин/refresh/logout/email verify/reset, роли | unit+integration+E2E зелёные |
| 4 | Users/Sellers: профили, изоляция | тесты изоляции продавцов |
| 5 | Catalog: продукты, категории, бренды, варианты, изображения, инвентарь | API + тесты + кэш категорий |
| 6 | Search: FTS PostgreSQL, индексация через jobs | поиск работает, индексация через очередь |
| 7 | Redis: кэш, rate limit, lock'и | метрики hit-ratio, лимиты работают |
| 8 | Cart: guest/user/merge, валидация stock | E2E корзины |
| 9 | Orders: транзакции, idempotency, резервирование, outbox | конкурентные тесты зелёные |
| 10 | Queues: BullMQ workers, нотификации, поиск | события доставляются, retries работают |
| 11 | Payments: провайдер (кошелёк + интерфейс), webhook, refund | тесты webhook-дублей |
| 12 | Reviews/Favorites/Promotions | API + тесты |
| 13 | Seller dashboard | изоляция + управление товарами |
| 14 | Admin dashboard + audit log | критичные действия логируются |
| 15 | Frontend: все страницы, dark list-first | E2E Playwright, A11y checks |
| 16 | Performance: кэширование, image optimization, пагинация | Lighthouse > 90, мало запросов |
| 17 | Observability | метрики и health в prod-режиме |
| 18 | Security audit | проверен чеклист |
| 19 | Load testing k6: 10k → 50k → 100k → 250k → 500k → 1M | каждый уровень подтверждён метриками; bottlenecks зафиксированы и устранены |
| 20 | Production: образы, деплой, scaling, backup, rollback | деплой-ранбук |

Каждая фаза завершается: typecheck + lint + тесты + сборка + миграции → только потом следующая.

---

## 12. Риски и ограничения

1. **Docker не установлен на dev-машине** — инфраструктурные сервисы (Postgres/Redis)
   поднимутся локально; для этого нужно установить Docker Desktop (требует WSL2)
   или использовать локальные бинарники — решить на PHASE 1.
2. **1M concurrent не может быть «обещан» на текущем железе** — подтверждается
   только нагрузочными тестами (PHASE 19) и горизонтальным scaling'ом.
3. **Real payments** требуют юрлицо/ключи провайдера — MVP реализуется внутренний
   кошелёк как полноценный провайдер за тем же интерфейсом.
4. **Имиджи** требуют Object Storage — в dev используется локальный storage
   (S3-совместимый MinIO в compose), в prod — облачный.
