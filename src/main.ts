import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DateTimeInterceptor } from './commons/interceptor/dateTimeUTC+7';
import * as dotenv from "dotenv";
import { SanitizeIdInterceptor } from './commons/interceptor/sanitize-id.interceptor';
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new DateTimeInterceptor());
   app.useGlobalInterceptors(new SanitizeIdInterceptor());
  app.setGlobalPrefix('/api');
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  await app.listen(5000, '0.0.0.0');
}
bootstrap();
