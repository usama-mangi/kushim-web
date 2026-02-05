import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { getSecurityConfig } from './config/security.config';
import { XssProtectionMiddleware } from './common/middleware/xss-protection.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const securityConfig = getSecurityConfig();

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: securityConfig.helmet.contentSecurityPolicy.directives,
      },
      hsts: {
        maxAge: securityConfig.helmet.hsts.maxAge,
        includeSubDomains: securityConfig.helmet.hsts.includeSubDomains,
        preload: securityConfig.helmet.hsts.preload,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      hidePoweredBy: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Enable compression (gzip)
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Session management
  app.use(
    session({
      secret: securityConfig.session.secret,
      name: securityConfig.session.name,
      resave: securityConfig.session.resave,
      saveUninitialized: securityConfig.session.saveUninitialized,
      cookie: securityConfig.session.cookie,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: securityConfig.cors.origin,
    credentials: securityConfig.cors.credentials,
    methods: securityConfig.cors.methods,
    allowedHeaders: securityConfig.cors.allowedHeaders,
    exposedHeaders: securityConfig.cors.exposedHeaders,
    maxAge: securityConfig.cors.maxAge,
  });

  // XSS Protection Middleware
  const xssProtection = new XssProtectionMiddleware();
  app.use((req, res, next) => xssProtection.use(req, res, next));

  // Global validation pipe with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend API running on http://localhost:${port}/api`);
  console.log(`🔒 Security features enabled:`);
  console.log(`   - Helmet (CSP, HSTS, XSS, etc.)`);
  console.log(`   - CORS with whitelist`);
  console.log(`   - XSS Protection`);
  console.log(`   - Input Validation & Sanitization`);
  console.log(`   - Rate Limiting`);
  console.log(`   - Secure Sessions`);
  console.log(`   - Audit Logging`);
}

bootstrap();
