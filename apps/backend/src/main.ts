import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));

  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  const origins = corsOrigin.split(',').map(o => o.trim());
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.getHttpAdapter().get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'avicola-erp' });
  });

  const config = new DocumentBuilder()
    .setTitle('Avicola ERP - API')
    .setDescription('Sistema de control de producción e inventarios avícolas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  console.log(`Servidor corriendo en puerto: ${port}`);
}
bootstrap();
