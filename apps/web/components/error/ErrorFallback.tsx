'use client';

import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

/**
 * Custom Error Fallback UI Component
 * Can be used with ErrorBoundary for custom error displays
 */
export function ErrorFallback({
  error,
  resetError,
  title = 'Oops! Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
}: ErrorFallbackProps) {
  return (
    <div 
      className="flex items-center justify-center min-h-[400px] p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Technical Details
            </summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto text-red-600 dark:text-red-400">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          {resetError && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature-specific error fallback
 * Use for non-critical features that shouldn't crash the whole app
 */
export function FeatureErrorFallback({ featureName }: { featureName: string }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start">
        <svg
          className="h-5 w-5 text-yellow-400 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {featureName} temporarily unavailable
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            This feature is experiencing issues. Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
