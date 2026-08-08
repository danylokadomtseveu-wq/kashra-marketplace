import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { WalletService } from "../wallet/wallet.service.js"

export interface PaymentResult {
  success: boolean
  providerPaymentId?: string
  error?: string
}

export interface PaymentProvider {
  readonly name: "WALLET"
  createPayment(orderId: string, amount: number, userId: string): Promise<PaymentResult>
  refund(providerPaymentId: string, amount: number): Promise<PaymentResult>
}

@Injectable()
export class WalletPaymentProvider implements PaymentProvider {
  readonly name = "WALLET" as const

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async createPayment(orderId: string, amount: number, userId: string): Promise<PaymentResult> {
    try {
      await this.wallet.freeze(userId, amount, orderId)
      return { success: true, providerPaymentId: `wallet_${orderId}` }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Payment failed" }
    }
  }

  async refund(providerPaymentId: string, _amount: number): Promise<PaymentResult> {
    return { success: true, providerPaymentId }
  }
}

@Injectable()
export class PaymentService {
  private readonly providers: Map<string, PaymentProvider> = new Map()

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly walletProvider: WalletPaymentProvider,
  ) {
    this.providers.set("WALLET", walletProvider)
  }

  async processPayment(orderId: string, userId: string, amount: number) {
    const provider = this.providers.get("WALLET")!

    const existing = await this.prisma.payment.findFirst({
      where: { orderId, status: "SUCCEEDED" },
    })
    if (existing) return existing

    const result = await provider.createPayment(orderId, amount, userId)

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        provider: "WALLET",
        providerPaymentId: result.providerPaymentId,
        amount,
        status: result.success ? "SUCCEEDED" : "FAILED",
      },
    })

    if (result.success) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      })
    }

    return payment
  }

  async refund(orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: "SUCCEEDED" },
    })
    if (!payment) return null

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    })

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED" },
    })

    return payment
  }
}
