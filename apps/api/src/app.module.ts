import { Module } from "@nestjs/common"
import { PrismaModule } from "./modules/prisma/prisma.module.js"
import { RedisModule } from "./modules/redis/redis.module.js"
import { AuthModule } from "./modules/auth/auth.module.js"
import { UsersModule } from "./modules/users/users.module.js"
import { HealthModule } from "./modules/health/health.module.js"
import { AppConfigModule } from "./modules/config/app-config.module.js"
import { SharedAuthModule } from "./modules/auth/shared-auth.module.js"
import { SellersModule } from "./modules/sellers/sellers.module.js"
import { CategoriesModule } from "./modules/categories/categories.module.js"
import { BrandsModule } from "./modules/brands/brands.module.js"
import { ProductsModule } from "./modules/products/products.module.js"
import { SearchModule } from "./modules/search/search.module.js"
import { CartModule } from "./modules/cart/cart.module.js"
import { OrdersModule } from "./modules/orders/orders.module.js"
import { OutboxModule } from "./modules/outbox/outbox.module.js"
import { NotificationsModule } from "./modules/notifications/notifications.module.js"
import { ReviewsModule } from "./modules/reviews/reviews.module.js"
import { FavoritesModule } from "./modules/favorites/favorites.module.js"
import { PromotionsModule } from "./modules/promotions/promotions.module.js"
import { AdminModule } from "./modules/admin/admin.module.js"
import { SupportModule } from "./modules/support/support.module.js"
import { WalletModule } from "./modules/wallet/wallet.module.js"
import { PaymentsModule } from "./modules/payments/payments.module.js"
import { CacheModule } from "./modules/cache/cache.module.js"
import { RateLimitGuard } from "./modules/cache/guards/rate-limit.guard.js"
import { APP_GUARD } from "@nestjs/core"

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, SharedAuthModule, CacheModule, HealthModule, AuthModule, UsersModule, SellersModule, CartModule, OrdersModule, OutboxModule, NotificationsModule, ReviewsModule, FavoritesModule, PromotionsModule, AdminModule, SupportModule, WalletModule, PaymentsModule, CategoriesModule, BrandsModule, ProductsModule, SearchModule],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
