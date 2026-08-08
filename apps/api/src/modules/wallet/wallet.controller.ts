import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { WalletService } from "../wallet/wallet.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { PaymentService } from "../payments/payments.service.js"

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly payments: PaymentService,
  ) {}

  @Get()
  getBalance(@CurrentUser("sub") userId: string) {
    return this.wallet.getBalance(userId)
  }

  @Post("top-up")
  topUp(@CurrentUser("sub") userId: string, @Body() body: { amount: number; idempotencyKey: string }) {
    return this.wallet.topUp(userId, body.amount, body.idempotencyKey)
  }
}
