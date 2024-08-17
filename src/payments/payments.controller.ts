import { Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession() {
    return this.paymentsService.createPaymentSession();
  }

  // webhook al q Stripe llama cuando el pago es exitoso
  @Get('success')
  success() {
    return this.paymentsService.paymentSuccess();
  }

  @Get('cancel')
  cancel() {
    return this.paymentsService.paymentCancel();
  }

  // // stripe webhook
  @Post('webhook')
  webhook() {
    return this.paymentsService.paymentWebhook();
  }
}
