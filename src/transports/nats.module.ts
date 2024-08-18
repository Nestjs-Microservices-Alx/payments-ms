import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { envs, NATS_SERVICE } from 'src/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS, // xq el us usa NATS
        options: {
          servers: envs.NATS_SERVERS, // NATS
        },
      },
    ]),
  ],

  // to be used in other modules
  exports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS, // xq el us usa NATS
        options: {
          servers: envs.NATS_SERVERS, // NATS
        },
      },
    ]),
  ],
})
export class NatsModule {}
