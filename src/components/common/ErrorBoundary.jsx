import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Fallback Component
 * Displays user-friendly error message when an error occurs
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop p-8 max-w-2xl w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="text-red-600" size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-ink-900 text-center mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-ink-600 text-center mb-6">
          We're sorry for the inconvenience. The application encountered an unexpected error.
        </p>

        {/* Error Details - Only in development */}
        {import.meta.env.DEV && (
          <div className="bg-ink-50 rounded-lg p-4 mb-6 border border-ink-200">
            <h3 className="text-sm font-semibold text-ink-700 mb-2">
              Error Details (Development Mode):
            </h3>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
            </div>
            {error.stack && (
              <details className="text-xs text-ink-600">
                <summary className="cursor-pointer font-medium hover:text-ink-900">
                  Stack Trace
                </summary>
                <pre className="mt-2 bg-ink-100 p-3 rounded overflow-x-auto text-xs">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 text-white font-semibold rounded-lg transition-all shadow-card hover:shadow-lift"
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-ink-300 text-ink-700 font-semibold rounded-lg hover:bg-ink-50 transition-all"
          >
            <Home size={18} />
            Go to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-ink-500">
          <p>
            If this problem persists, please contact the system administrator or{' '}
            <a
              href="mailto:support@gersl.org"
              className="text-orange-600 hover:text-orange-700 underline"
            >
              report this issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Wrapper
 * Catches errors in child components and displays fallback UI
 */
export default function ErrorBoundary({ children }) {
  const handleError = (error, errorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  };

  const handleReset = () => {
    // Clear any error states or perform cleanup
    // Reload the page to reset the application state
    window.location.reload();
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * Async Error Boundary for handling errors in async operations
 * Usage: Wrap async components with this boundary
 */
export function AsyncErrorBoundary({ children, fallback }) {
  return (
    <ReactErrorBoundary
      fallback={fallback || <div>Loading...</div>}
      onError={(error, errorInfo) => {
        console.error('Async Error:', error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
