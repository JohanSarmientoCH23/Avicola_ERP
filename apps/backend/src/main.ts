import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  app.use(cookieParser());

  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  }));

  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  if (corsOrigin === '*') {
    app.enableCors({ origin: true, credentials: true });
  } else {
    const origins = corsOrigin.split(',').map(o => o.trim());
    app.enableCors({
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
    });
  }

  app.setGlobalPrefix('api/v1');

  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: any, res: any, next: any) => requestIdMiddleware.use(req, res, next));

  app.useGlobalFilters(new AllExceptionsFilter());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.getHttpAdapter().get('/api/v1/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'avicola-erp',
        version: '1.0',
      },
    });
  });

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Avicola ERP - API')
      .setDescription('Sistema de control de producción e inventarios avícolas')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = configService.get('PORT', 3001);
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`Servidor corriendo en http://${host}:${port} [${nodeEnv}]`);
}
bootstrap();
