import { Module } from '@nestjs/common';

import { NatsModule } from 'src/transports/nats.module';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [NatsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
