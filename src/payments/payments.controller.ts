import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

// webhook stripe: express.raw
import { Request, Response } from 'express';

import { CreatePaymentSessionDto } from './dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(
    @Body() createPaymentSessionDto: CreatePaymentSessionDto,
  ) {
    return this.paymentsService.createPaymentSession(createPaymentSessionDto);
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

  // // stripe webhook: stripe requires raw body, so we need to use express.raw
  @Post('webhook')
  webhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentsService.stripeWebhook(req, res);
  }
}
