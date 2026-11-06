import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only — never log sensitive health data
    console.error('[SAKHI ErrorBoundary]', error.message, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-sakhi-bg flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-sakhi-border shadow-card p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-sakhi-text mb-2">Something went wrong</h2>
            <p className="text-sm text-sakhi-muted mb-6">
              An unexpected error occurred. Your health data has not been affected.
              Please try again or refresh the page.
            </p>
            {this.state.error && (
              <p className="text-xs text-sakhi-muted bg-gray-50 rounded-xl px-3 py-2 mb-5 font-mono">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw size={15} /> Try again
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="btn-secondary"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/** Lightweight page-level boundary — shows a smaller inline error instead of full-screen. */
export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SAKHI PageErrorBoundary]', error.message, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle size={20} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700 mb-1">This section encountered an error</p>
          <p className="text-xs text-red-600 mb-3">
            {this.state.error?.message || 'Unexpected error'}
          </p>
          <button onClick={this.handleReset} className="btn-ghost text-red-600 text-xs">
            <RefreshCw size={13} className="inline mr-1" /> Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
