import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // FIX: Removed `public` keyword which can sometimes cause issues with certain TS/linter configurations.
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 text-gray-300">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 border border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-500 dark:text-red-400 mb-4 tracking-tight leading-tight">Something went wrong.</h1>
              <p className="text-base text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
                We've encountered an unexpected error. Please try refreshing the page.
              </p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-transform duration-200 hover:scale-105">
                Refresh Page
              </button>
              {this.state.error && (
                <details className="mt-6 text-left text-xs text-gray-500 dark:text-slate-500">
                    <summary>Error Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded overflow-auto">
                        {this.state.error.toString()}
                    </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
