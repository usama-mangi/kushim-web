import 'dotenv/config';
import { initializeTracing } from './common/tracing';

// Initialize tracing BEFORE any other imports to ensure all modules are instrumented
initializeTracing();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Validate critical environment variables before starting the application
function validateEnvironment() {
  const logger = new Logger('Bootstrap');
  const requiredVars = [
    'ENCRYPTION_KEY',
    'DATABASE_URL',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
  ];

  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables:');
    missing.forEach(varName => {
      logger.error(`  - ${varName}`);
    });
    
    if (missing.includes('ENCRYPTION_KEY')) {
      logger.error(
        '\nGenerate ENCRYPTION_KEY with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    
    throw new Error(
      `Application startup failed: Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate ENCRYPTION_KEY format
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    const keyBuffer = Buffer.from(encryptionKey, 'hex');
    if (keyBuffer.length !== 32) {
      logger.error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
      logger.error(
        'Generate a new one with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
      throw new Error('Invalid ENCRYPTION_KEY format');
    }
  }

  logger.log('Environment validation passed ✓');
}

async function bootstrap() {
  // Validate environment before creating app
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  
  app.enableCors({
    origin: '*', // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Kushim API')
    .setDescription('Ambient context ledger - automatically captures and links work artifacts across platforms')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints (login, signup, OAuth)')
    .addTag('users', 'User management')
    .addTag('records', 'Unified records (work artifacts from all platforms)')
    .addTag('graph', 'Context groups and relationship graph')
    .addTag('links', 'Record links (relationships between artifacts)')
    .addTag('ingestion', 'Data ingestion from platforms')
    .addTag('oauth', 'OAuth platform connections')
    .addTag('webhooks', 'Real-time platform webhooks')
    .addTag('actions', 'Action execution (comment, assign, close, etc.)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const logger = new Logger('Bootstrap');
  const port = process.env.PORT ?? 3001;
  
  await app.listen(port);
  logger.log(`🚀 Kushim API started on http://localhost:${port}`);
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
