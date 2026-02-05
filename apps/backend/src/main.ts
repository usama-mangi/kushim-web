import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getSecurityConfig } from './config/security.config';
import { XssProtectionMiddleware } from './common/middleware/xss-protection.middleware';
import { initializeSentry } from './common/monitoring/sentry.config';
import { CustomLoggerService } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

async function bootstrap() {
  // Initialize Sentry first
  initializeSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Get custom logger and metrics from the app context
  const customLogger = app.get(CustomLoggerService);
  const metricsService = await app.resolve('MetricsService');

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

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(customLogger));

  // Global performance interceptor
  app.useGlobalInterceptors(new PerformanceInterceptor(customLogger, metricsService));

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

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Kushim API')
    .setDescription(
      'Compliance Automation Platform API - Automate SOC 2 compliance with integrated monitoring, evidence collection, and reporting.',
    )
    .setVersion('1.0')
    .setContact('Kushim Support', 'https://kushim.io', 'support@kushim.io')
    .setLicense('Proprietary', 'https://kushim.io/license')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://staging-api.kushim.io', 'Staging')
    .addServer('https://api.kushim.io', 'Production')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('users', 'User management and profile operations')
    .addTag('compliance', 'Compliance controls, checks, and monitoring')
    .addTag('evidence', 'Evidence collection and verification')
    .addTag('integrations', 'Third-party integrations management')
    .addTag('integrations/aws', 'AWS integration and evidence collection')
    .addTag('integrations/github', 'GitHub integration and security checks')
    .addTag('integrations/okta', 'Okta identity management integration')
    .addTag('integrations/jira', 'Jira ticket management integration')
    .addTag('integrations/slack', 'Slack notifications integration')
    .addTag('integrations/oauth', 'OAuth callback handlers')
    .addTag('health', 'Health check and system status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kushim API Documentation',
    customfavIcon: 'https://kushim.io/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend API running on http://localhost:${port}/api`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
  console.log(
    `📄 OpenAPI JSON schema at http://localhost:${port}/api/docs-json`,
  );
  console.log(`📊 Metrics endpoint at http://localhost:${port}/api/metrics`);
  console.log(`❤️  Health check at http://localhost:${port}/api/health`);
  console.log(`🔒 Security features enabled:`);
  console.log(`   - Helmet (CSP, HSTS, XSS, etc.)`);
  console.log(`   - CORS with whitelist`);
  console.log(`   - XSS Protection`);
  console.log(`   - Input Validation & Sanitization`);
  console.log(`   - Rate Limiting`);
  console.log(`   - Secure Sessions`);
  console.log(`   - Audit Logging`);
  console.log(`📈 Monitoring enabled:`);
  console.log(`   - Sentry Error Tracking`);
  console.log(`   - Prometheus Metrics`);
  console.log(`   - Structured Logging (Winston)`);
  console.log(`   - Performance Monitoring`);
  console.log(`   - Alert System`);
}

bootstrap();
