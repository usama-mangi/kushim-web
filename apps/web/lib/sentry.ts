import * as Sentry from '@sentry/react';

export function initializeSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'kushim@1.0.0',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    
    // Replay sessions for debugging
    replaysSessionSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE || '0.1'),
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Ignore certain errors
    ignoreErrors: [
      'Non-Error exception captured',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],

    // Before send hook to add custom context
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event (dev mode):', event);
        return null;
      }

      return event;
    },

    // Before breadcrumb hook
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'xhr' && breadcrumb.data) {
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

export function clearSentryUser() {
  Sentry.setUser(null);
}
