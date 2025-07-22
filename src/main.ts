import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DateTimeInterceptor } from './commons/interceptor/dateTimeUTC+7';
import * as dotenv from "dotenv";
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new DateTimeInterceptor());
  app.setGlobalPrefix('/api');
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  await app.listen(3000);
}
bootstrap();
