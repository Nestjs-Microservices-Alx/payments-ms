import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  // // envs
  const PORT = envs.PORT;

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // stripe webhook
  });

  // // set global prefix ------------
  app.setGlobalPrefix('api');

  // // logger ------------
  const logger = new Logger('PAYMENTS MAIN');

  // // set global pipes ------------
  app.useGlobalPipes(
    // validate DTOs
    new ValidationPipe({
      whitelist: true, // remueve extra data of DTO - like Mongoose ODM
      // forbidNonWhitelisted: true, // envia 1 error con las properties q NO estan definidas en DTO
    }),
  );

  // // Hybrid microservices ------------
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: envs.NATS_SERVERS,
      },
    },
    // to use the same config of the app in microservices (no HTTP based)
    { inheritAppConfig: true },
  );
  await app.startAllMicroservices();

  //
  await app.listen(PORT);
  logger.log(`Payments Microservice is running on port ${PORT}`);
}
bootstrap();
