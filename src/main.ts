import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Enable Validation
  app.useGlobalPipes(new ValidationPipe());

  // 2. Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('HNG Wallet Service')
    .setDescription('The HNG Stage 8 Wallet API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = 'api';
  SwaggerModule.setup(swaggerPath, app, document);

  // 3. Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 4. Construct URL manually for better readability
  const serverUrl = `http://localhost:${port}`;

  logger.log(`
==========================================================
🚀 APPLICATION IS RUNNING!
----------------------------------------------------------
-> Server URL:         ${serverUrl}
-> Swagger Docs URL:   ${serverUrl}/${swaggerPath}
==========================================================
  `);
}
bootstrap();
