import { Global, Module } from "@nestjs/common"
import { PaymentService, WalletPaymentProvider } from "./payments.service.js"

@Global()
@Module({
  providers: [PaymentService, WalletPaymentProvider],
  exports: [PaymentService],
})
export class PaymentsModule {}
