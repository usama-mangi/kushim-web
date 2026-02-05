import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'kushim@1.0.0',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

    integrations: [
      // Profiling
      nodeProfilingIntegration(),
    ],

    // Ignore certain errors
    ignoreErrors: [
      'Non-Error exception captured',
      'UnauthorizedException',
      'NotFoundException',
      'BadRequestException',
    ],

    // Before send hook to add custom context
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event (dev mode):', event);
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        service: 'kushim-backend',
      };

      return event;
    },

    // Before breadcrumb hook
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'http' && breadcrumb.data) {
        delete breadcrumb.data.authorization;
        delete breadcrumb.data.cookie;
      }
      return breadcrumb;
    },
  });

  console.log('✅ Sentry initialized');
}

export function captureSentryException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureSentryMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id: string; email?: string; customerId?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    customerId: user.customerId,
  });
}

export function setSentryContext(context: string, data: Record<string, any>) {
  Sentry.setContext(context, data);
}
