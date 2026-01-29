import 'dotenv/config';
import { initializeTracing } from './common/tracing';

// Initialize tracing BEFORE any other imports to ensure all modules are instrumented
initializeTracing();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';

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
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
