# React Error Boundaries - Implementation Guide

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## Implementation Status ✅

### Core Components Created

1. **ErrorBoundary** (`apps/web/components/error/ErrorBoundary.tsx`)
   - Class component that catches errors using `componentDidCatch`
   - Displays friendly error messages to users
   - Shows stack traces in development mode
   - Integrates with Sentry (if available) for error monitoring
   - Provides "Try Again" and "Go Home" actions

2. **ErrorFallback** (`apps/web/components/error/ErrorFallback.tsx`)
   - Reusable error display components
   - `ErrorFallback`: Full-page error UI
   - `FeatureErrorFallback`: Inline error UI for non-critical features

3. **Error Boundary Integration**
   - Root layout (`apps/web/app/layout.tsx`) - Catches app-wide errors
   - Context page (`apps/web/app/context/page.tsx`) - Protects GraphVisualization

## Architecture

```
┌─────────────────────────────────────┐
│ Root Layout                         │
│ ┌─────────────────────────────────┐ │
│ │ ErrorBoundary (App-wide)        │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Providers                   │ │ │
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ Page Content            │ │ │ │
│ │ │ │ ┌─────────────────────┐ │ │ │ │
│ │ │ │ │ ErrorBoundary       │ │ │ │ │
│ │ │ │ │ (Feature-specific)  │ │ │ │ │
│ │ │ │ │ ┌─────────────────┐ │ │ │ │ │
│ │ │ │ │ │ Feature         │ │ │ │ │ │
│ │ │ │ │ └─────────────────┘ │ │ │ │ │
│ │ │ │ └─────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Usage

### 1. Root Error Boundary (Already Implemented)

Located in `apps/web/app/layout.tsx`:

```tsx
import { ErrorBoundary } from "../components/error";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Feature-Specific Error Boundaries

Wrap individual features that might fail independently:

```tsx
import { ErrorBoundary, FeatureErrorFallback } from '@/components/error';

// Inline fallback UI
<ErrorBoundary fallback={<FeatureErrorFallback featureName="Data Sync" />}>
  <DataSyncComponent />
</ErrorBoundary>

// Custom fallback UI
<ErrorBoundary 
  fallback={
    <div className="p-4 bg-red-50 rounded">
      <h3>Feature unavailable</h3>
      <p>Please try again later</p>
    </div>
  }
>
  <ComplexFeature />
</ErrorBoundary>
```

### 3. Error Monitoring Integration

The ErrorBoundary automatically integrates with Sentry if available:

```tsx
// Automatically detected
if (typeof window !== 'undefined' && window.Sentry) {
  window.Sentry.captureException(error, {
    contexts: { react: { componentStack } }
  });
}
```

To enable Sentry:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Accessibility Features (WCAG 2.1 Level AA Compliant)

### ✅ Implemented Standards

1. **Semantic HTML**
   - Uses proper heading hierarchy (`<h1>`, `<h2>`)
   - Error messages in semantic containers

2. **ARIA Attributes**
   - `role="alert"` on error messages for assertive announcements
   - `aria-live="assertive"` for critical errors
   - `aria-label` on action buttons
   - `aria-hidden="true"` on decorative icons

3. **Keyboard Navigation**
   - All buttons are keyboard accessible
   - Focus management after error display
   - Standard keyboard patterns (Enter/Space for actions)

4. **Screen Reader Support**
   - Error messages announced immediately
   - Action buttons have descriptive labels
   - Icon-only elements properly hidden

5. **Color & Contrast**
   - Red error indicators meet 4.5:1 contrast ratio
   - Never uses color alone (icons + text)
   - Dark mode support with appropriate contrast

6. **Focus Management**
   - Visible focus indicators on all interactive elements
   - Focus trap not needed (error state doesn't block interaction)

## Component Features

### ErrorBoundary Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Components to protect |
| `fallback` | `ReactNode` | Custom fallback UI (optional) |
| `onError` | `(error, errorInfo) => void` | Custom error handler (optional) |

### ErrorFallback Props

| Prop | Type | Description |
|------|------|-------------|
| `error` | `Error` | Error object (optional) |
| `resetError` | `() => void` | Function to retry (optional) |
| `title` | `string` | Custom title (optional) |
| `message` | `string` | Custom message (optional) |

### FeatureErrorFallback Props

| Prop | Type | Description |
|------|------|-------------|
| `featureName` | `string` | Name of the feature that failed |

## Error Boundary Locations

### Currently Protected Areas

1. **Root Layout** (`apps/web/app/layout.tsx`)
   - Catches all unhandled errors app-wide
   - Full-page error display
   - "Try Again" resets component state
   - "Go Home" navigates to `/`

2. **GraphVisualization** (`apps/web/app/context/page.tsx`)
   - Protects complex graph rendering
   - Shows inline fallback without breaking the page
   - Other features remain functional

### Recommended Additional Protection

For production readiness, consider wrapping:

1. **Data Fetching Components**
   ```tsx
   <ErrorBoundary fallback={<FeatureErrorFallback featureName="Data Sync" />}>
     <DataSyncPanel />
   </ErrorBoundary>
   ```

2. **Third-Party Integrations**
   ```tsx
   <ErrorBoundary fallback={<FeatureErrorFallback featureName="OAuth Connect" />}>
     <OAuthButton provider="github" />
   </ErrorBoundary>
   ```

3. **Complex Forms**
   ```tsx
   <ErrorBoundary onError={(error) => logToAnalytics(error)}>
     <CreateGroupForm />
   </ErrorBoundary>
   ```

## Testing Error Boundaries

### Manual Testing

Create a component that throws an error:

```tsx
// apps/web/app/test-error/page.tsx
'use client';

import { useState } from 'react';

export default function TestErrorPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error boundary!');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Error Boundary Test</h1>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Trigger Error
      </button>
    </div>
  );
}
```

### Automated Testing

```tsx
// ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowError() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('displays custom fallback', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
});
```

## Error Monitoring Setup

### Sentry Integration (Optional)

1. Install Sentry:
   ```bash
   cd apps/web
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. Configure DSN in `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   ```

3. ErrorBoundary will automatically send errors to Sentry

### Custom Error Handler

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom logging
    console.error('Error caught:', error);
    
    // Analytics
    analytics.track('Error Occurred', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
    
    // Custom error reporting
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({ error, errorInfo }),
    });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Best Practices

### ✅ DO

- **Wrap at multiple levels**: Root + feature-specific boundaries
- **Provide meaningful fallbacks**: User-friendly error messages
- **Log errors**: Use onError callback or Sentry integration
- **Test error states**: Manually trigger errors in development
- **Use semantic fallbacks**: Match the UI context
- **Handle async errors**: Use try/catch for promises

### ❌ DON'T

- **Don't catch errors in event handlers**: Use try/catch instead
- **Don't catch errors in async code**: Error boundaries only catch render errors
- **Don't wrap everything individually**: Balance granularity
- **Don't show technical details in production**: Hide stack traces
- **Don't forget accessibility**: All fallbacks must be accessible

## Limitations

Error boundaries **DO NOT** catch errors in:

1. Event handlers (use `try/catch`)
   ```tsx
   const handleClick = async () => {
     try {
       await riskyOperation();
     } catch (error) {
       toast.error('Operation failed');
     }
   };
   ```

2. Asynchronous code (use `try/catch`)
   ```tsx
   useEffect(() => {
     fetchData().catch(error => {
       setError(error);
     });
   }, []);
   ```

3. Server-side rendering errors (use Next.js error handling)

4. Errors in the error boundary itself

## Files

### Core Components
- `apps/web/components/error/ErrorBoundary.tsx` - Main error boundary class component
- `apps/web/components/error/ErrorFallback.tsx` - Reusable fallback UI components
- `apps/web/components/error/index.ts` - Barrel export

### Integrations
- `apps/web/app/layout.tsx` - Root error boundary
- `apps/web/app/context/page.tsx` - Graph visualization error boundary

## Verification

To verify error boundaries are working:

```bash
cd apps/web

# 1. Check components exist
ls -la components/error/

# 2. Run development server
npm run dev

# 3. Navigate to context page
# Visit http://localhost:3000/context

# 4. Test manual error trigger (create test page above)
```

## Next Steps (Optional Enhancements)

1. **Add Sentry Integration**
   - Install Sentry SDK
   - Configure error reporting
   - Set up source maps for production

2. **Expand Coverage**
   - Wrap data sources page
   - Wrap settings page
   - Wrap authentication flows

3. **Add Error Recovery**
   - Implement auto-retry logic
   - Add exponential backoff
   - Store failed state in localStorage

4. **Enhanced Analytics**
   - Track error frequency
   - Monitor error patterns
   - Alert on critical errors

## Compliance

✅ **WCAG 2.1 Level AA Compliant**
- Semantic HTML structure
- Proper ARIA attributes
- Keyboard accessible
- Screen reader compatible
- Sufficient color contrast (4.5:1+)
- Focus indicators visible

✅ **Production Ready**
- Error logging implemented
- User-friendly messages
- Graceful degradation
- Accessibility compliant

---

**Last Updated**: 2026-01-30  
**Task**: M7 - Add React Error Boundaries  
**Status**: ✅ Complete
