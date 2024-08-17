import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { envs } from 'src/config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

  createPaymentSession() {
    return 'This action adds a new payment session';
  }

  paymentSuccess() {
    return 'This action returns payment success';
  }

  paymentCancel() {
    return 'This action returns payment cancel';
  }

  paymentWebhook() {
    return 'This action returns payment webhook';
  }
}
