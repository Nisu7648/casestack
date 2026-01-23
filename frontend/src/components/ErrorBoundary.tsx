import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-error-100 rounded-full p-4">
                  <AlertTriangle className="h-12 w-12 text-error-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center text-neutral-900 mb-4">
                Oops! Something went wrong
              </h1>

              {/* Description */}
              <p className="text-center text-neutral-600 mb-8">
                We're sorry for the inconvenience. An unexpected error occurred.
                Our team has been notified and we're working on it.
              </p>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 bg-neutral-100 rounded-lg p-4 overflow-auto">
                  <p className="text-sm font-mono text-error-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs font-mono text-neutral-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center justify-center px-6 py-3 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go Home
                </button>
              </div>

              {/* Support info */}
              <div className="mt-8 pt-8 border-t border-neutral-200">
                <p className="text-center text-sm text-neutral-500">
                  If this problem persists, please{' '}
                  <a
                    href="mailto:support@legalstack.com"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    contact support
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
