import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { Request, Response } from 'express';
import { envs } from 'src/config';
import { CreatePaymentSessionDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

  async createPaymentSession(createPaymentSessionDto: CreatePaymentSessionDto) {
    // all items with the same currency
    const { currency, items, orderId } = createPaymentSessionDto;
    const lineItems = items.map((item) => ({
      price_data: {
        currency,

        product_data: {
          name: item.name,
          images: ['https://i.imgur.com/EHyR2nP.png'],
        },
        unit_amount: Math.round(item.price * 100), // 2000 / 100 = $20.00  <- stripe works with cents
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      // // ID of own order
      payment_intent_data: {
        // send our order id to stripe, to match with success payment
        metadata: {
          orderId,
        },
      },

      // // payment method types
      payment_method_types: ['card'],

      // // items that the user is purchasing
      line_items: lineItems,
      mode: 'payment', // payment, setup, subscription
      success_url: envs.STRIPE_SUCCESS_URL, // redirect after success payment (my urls)
      cancel_url: envs.STRIPE_CANCEL_URL, // redirect after cancel payment (my urls)
    });

    return session;
  }

  paymentSuccess() {
    return 'This action returns payment success';
  }

  paymentCancel() {
    return 'This action returns payment cancel';
  }

  async stripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'];

    let event: Stripe.Event;
    const endpointSecret = envs.STRIPE_ENDPOINT_SECRET;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'], // rawBody is enabled in main.ts
        signature,
        endpointSecret,
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    // // Handle the event
    switch (event.type) {
      // match success payment with our order
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        console.log(`Event type ${event.type}`);
        console.log({
          metadata: chargeSucceeded.metadata,
          orderId: chargeSucceeded.metadata.orderId,
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`, { event });
        return res.status(400).end();
    }

    return res.status(200).json({ received: true, signature });
  }
}
