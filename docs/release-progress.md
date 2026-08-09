# KASHRA Marketplace — Release Progress

> Обновляется после каждой фазы. Формат: Phase | Status | Changed files | Tests | Known limitations.

| Phase | Status | Changed files | Tests | Known limitations |
|---|---|---|---|---|
| 0 Baseline | DONE | — | typecheck/lint/build OK; API+web+DB+Redis+MinIO up | &catalog,&product fallback fake placeholders |
| 1 Authentication | DONE | auth.controller.ts, auth.service.ts, packages/config, api.ts, auth.ts, session.tsx, layout.tsx, Navigation.tsx, login/register/profile | curl flow verified: register→login(Set-Cookie)→users/me→refresh rotation→reuse→logout | access в памяти; COOKIE_SECURE preprocess fix; logout cookie clear; jti в refresh |
| 2 Frontend API | DONE | api.ts (FormData,apiGet/Post/Patch/Put/Delete), types.ts, cart.ts, orders.ts, products.ts, wallet.ts, sellers.ts, favorites.ts, reviews.ts, notifications.ts, catalog.ts, support.ts, register page | typecheck+lint(1 pre-existing no-empty in products/[id])+build OK | остались fetch в catalog/search/products — убраны в Фазы 4-6 |
| 3 Real session | DONE | layout.tsx, session.tsx, Navigation.tsx, notifications page | typecheck+lint+build OK; /balance /notifications 200 | — |
| 4 Catalog | DONE | page.tsx, CategoryGrid, GameCatalog, CategoryGroup, GameItem, catalog.ts, types.ts, search.service.ts, catalog page, search page | categories API returns _count.products; search includes seller; typecheck/lint/build OK; / /catalog /search 200; главная рендерит реальные категории | подкатегорий в БД нет (только 7 игр); game/[slug] статика — Фаза 5 |
| 5 Game pages | DONE | page.tsx (cat-[slug]), [category] page, ProductRow, categories.service tree, search.service children, add-subcategories.ts | добавлены 27 подкатегорий (дерево), 48 товаров привязаны; /game/[slug], /game/[slug]/[category], /catalog, /search на реальных данных; typecheck+build OK; главная рендерит подкатегории | lint no-empty products/[id] pre-existing |
| 6 Product page | DONE | products/[id]/page.tsx (реальные данные, notFound), products.service.ts (резолюция id|slug), globals.css | typecheck+lint(0 errors!)+build OK; /products/:id 200 по id и slug, 404 для несуществующих | аттрибуты/изображения БД пока не выводим (attrs пустые, images placeholders) |
| 7 Cart | DONE | cart/page.tsx → API, ProductActions → API addToCart, session.tsx mergeCart при логине, cart.service.ts fix merge (P2002) | typecheck+lint+build OK; API flow verified: add→get→patch qty→delete; guest merge в аккаунт (qty=3 перенесена) | guest cookie __guest__; обращения из каталога — ссылки на id работают |
| 8 Checkout | DONE | checkout/page.tsx (новый), cart/page.tsx (ссылка /checkout), orders.service.ts (fix double-freeze, refund в cancel) | API flow verified: cart→POST /orders (PENDING_PAYMENT, резервация, корзина очищена)→top-up→pay (PAID, эскроу)→cancel (REFUNDED, unfreeze) | оплата идёт из кошелька WALLET (без реального платёжного провайдера) |
| 9 Orders | DONE | orders/page.tsx → listOrders/payOrder/cancelOrder/confirmOrder, RequireAuth, statusLabel, marketplace-pages.css (order-*) | API verified: list заказов, pay, cancel с возвратом средств; /orders 200 | подтверждение только из status=DELIVERED |
| 10 Wallet | DONE | balance/page.tsx → getWallet/topUpWallet, RequireAuth | API verified: top-up идемпотентен, баланс отражает эскро/refund | пополнение без реального платёжного API |
| 11 Payments | DONE | payments.service.ts (WALLET provider уже был), orders.service payOrder без двойного freeze | payment statuses: SUCCEEDED→PAID, REFUNDED при cancel | провайдер только WALLET (mock), интерфейсно подключаемые |
| 12-13 Seller/Product mgmt | DONE | /sell (панель продавца: активация, публикация товара, список, soft-delete, stats), /seller/[id] (публичный профиль + товары), marketplace-pages.css (form-row, section-title, sell-form.wide), updateSellerMe fix | API verified: upsertMe→role SELLER, create product 201, my products, stats, delete→softDeleted/HIDDEN; /sell /seller/[id] 200 | слаги кириллицей-уникализация через суффикс; фронт создаёт slug автоматически |
| 14 Storage | DONE | storage.service.ts (validate/upload/delete, MIME+size+ext guards, path-safe key naming), images.service.ts (assertOwner access control, sort, delete), images.controller.ts (POST/DELETE /products/:id/images, auth+ownership), images.module.ts, storage.module.ts, product-image model, frontend ProductImagesUploader + product gallery (fallback placeholder) | upload verified: multipart 200 + 200 GET; validate rejects empty>10МБ, bad MIME/ext, path traversal via UUID key, ACL public-read; access control verified: 401 unauth, 403 non-owner non-admin, 200 owner/admin; product page renders gallery for imaged product + placeholder fallback (no image); typecheck+lint+unit tests green (27/27) | frontend uses raw `<img src=http://localhost:9000/...>`; prod S3_PUBLIC_URL via env |
| 15 Favorites | PENDING | — | — | UI нет |
| 16 Reviews | PENDING | — | — | UI нет |
| 17 Notifications | PENDING | — | — | UI нет |
| 18 Messages | PENDING | — | — | заглушка |
| 19 Support | PENDING | — | — | Tickets как Notification |
| 20 Admin | PENDING | — | — | UI нет |
| 21 Search | PENDING | — | — | seller not included |
| 22 Promotions | PENDING | — | — | checkout не применяет |
| 23 Security audit | PENDING | — | — | — |
| 24 Inventory | PENDING | — | — | overselling risk |
| 25 Worker | PENDING | — | — | handlers stubs |
| 26 Email | PENDING | — | — | SMTP нет |
| 27 Reset/Verify | PENDING | — | — | не реализовано |
| 28 UX/Error | PENDING | — | — | — |
| 29 Design | PENDING | — | — | — |
| 30 Responsive | PENDING | — | — | — |
| 31 Db audit | PENDING | — | — | индексы частичные |
| 32 Seed | PENDING | — | — | пароли заглушки |
| 33 Tests | PENDING | — | — | мало |
| 34 CI | PENDING | — | — | нет |
| 35-36 Observability | PENDING | — | — | — |
| 37-38 Deploy/backup | PENDING | — | — | — |
| 39-41 Final | PENDING | — | — | — |

### Фаза 0 — фактическое состояние (проверено 2026-08-08)
- `git status`: незакоммиченные — `Navigation.tsx`, `globals.css`, `marketplace-pages.css`, `tsconfig.tsbuildinfo`, `src/app/balance/`, `src/lib/`
- Docker: postgres/redis/minio healthy; API :4000, web :3000
- DB: 7 users · 4 sellers · 7 categories · 48 products · 26 variants · 3 reviews · 0 orders
- Routes web: `/`, `/catalog`, `/search`, `/game/[slug]`, `/products/[id]`, `/cart`, `/orders`, `/balance`, `/sell`, `/profile`, `/messages`, `/auth/login`, `/auth/register`, `/seller/[id]` — 200
- `next.config.ts` пока содержит `typescript.ignoreBuildErrors` и `eslint.ignoreDuringBuilds` — удалять только когда quality gates целиком зелёные
- Фаза 4 (2026-08-09): главная и каталог полностью на реальных данных БД; категории отдают `_count.products` (активные, не удалённые); search отдаёт `seller` (user.name, ratingCache, salesCount); убраны фейковые рейтинги-«5.0» и статусы ОНЛАЙН
- Фаза 5 (2026-08-09): построено дерево каталога — для 7 игр созданы 27 подкатегорий («Аккаунты», «Оружие и скины», «Наборы», «Транспорт», …); все 48 товаров привязаны к подкатегориям (скрипт `apps/api/prisma/add-subcategories.ts`, JSON-логи без изменений схемы); `GET /categories` возвращает корневые с `children` и суммарным `_count.products`; `GET /search` фильтрует по подкатегориям, если дан корневой ID; страницы `/game/[slug]` и `/game/[slug]/[category]` — реальные данные (без fake-лотов и KashraSeller)
- Фаза 6 (2026-08-09): страница `/products/[id]` переведена на реальные данные (описание, цена + oldPrice, наличие, продавец-рейтинг); API `GET /products/:slug` теперь резолвляет и `slug`, и `id` (front сливает ID); 404 через `notFound()` для несуществующих; fake fallback удалён. **lint полностью чистый (удалён pre-existing no-empty) — впервые без единой ошибки**
- Фаза 7 (2026-08-09): корзина полностью на сервере (без localStorage): `lib/cart.ts` (подключение через `__guest__` cookie + API), страница `/cart` (список/изменение кол-ва/удаление), `ProductActions` («Купить»/«В корзину») через `addToCart`, слияние гостьевой корзины в аккаунт при логине (`session.tsx`). Проверен curl-флоу: add→get→patch qty→remove→guest-merge (qty=3 перенесена). Исправлен баг слияния: `cart.service.mergeGuestCart` вызывал `createCart(userId)` → unique violation когда cart уже существовал; заменено на `getCart`
- Фаза 8-11 (2026-08-09): оформление и оплата полностью на реальном API. Новая страница `/checkout` (форма заказа, RequireAuth): список корзины, «Подтвердить заказ» → `POST /orders` (idempotencyKey + itemIds), редирект на `/orders`. Страница `/orders` переведена с localStorage на API: реальные заказы, статусы, кнопки «Оплатить»/«Отменить»/«Подтвердить получение», ссылка «Пополнить баланс» на `/balance`. Страница `/balance` — на `GET /wallet` + `POST /wallet/top-up` (идемпотентно), показывает available + frozen. Убраны все localStorage (`kashra-orders`, `kashra-balance`).
- Fix bug double-freeze в `orders.service.payOrder`: средства замораживались дважды (явный `wallet.freeze` + снова внутри `payments.processPayment`) → второй вызов ругался `INSUFFICIENT_FUNDS`, payment получал FAILED при реально замороженном эскроу. Теперь — single freeze в `processPayment`, проверка `payment.status === "FAILED"` бросает понятную ошибку. В `cancel` добавлен `wallet.unfreeze` + payment→`REFUNDED`.
- E2E-флоу проверен curl: корзина (qty=3, 6120.33 ₽) → `POST /orders` → `PENDING_PAYMENT` + inventory reserved + корзина пуста → top-up 10000 → `pay` → `PAID`, frozen=6120.33 → `cancel` → `CANCELLED`, payment `REFUNDED`, frozen=0, reservation `RELEASED`.