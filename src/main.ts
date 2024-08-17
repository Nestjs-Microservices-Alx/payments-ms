import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  // // envs
  const PORT = envs.PORT;

  const app = await NestFactory.create(AppModule);

  // // set global prefix ------------
  app.setGlobalPrefix('api');

  // // logger ------------
  const logger = new Logger('PAYMENTS MAIN');

  await app.listen(PORT);
  logger.log(`Payments Microservice is running on port ${PORT}`);
}
bootstrap();
