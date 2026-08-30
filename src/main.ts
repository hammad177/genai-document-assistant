import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP } from './common/constants';
import { CorsConfig } from './common/cors/cors.config';
import { ValidationPipe } from '@nestjs/common';

config(); // Load environment variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes
  app.setGlobalPrefix('api');

  // Set up CORS to allow requests from frontend
  app.enableCors(CorsConfig.getCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true, // Stop validation after the first error
      whitelist: true, // Strips out properties not defined in DTO
      // forbidNonWhitelisted: true, // Throws an error for unknown properties
      forbidNonWhitelisted: false, // Don't throw error for unknown properties
      transform: true, // Auto-transform input data to DTO classes
    }),
  );

  await app.listen(APP.PORT);
}
bootstrap();
