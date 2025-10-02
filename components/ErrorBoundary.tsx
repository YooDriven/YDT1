import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialize state in the constructor to ensure `this.props` is available and `this.state` is correctly set up. This resolves errors where properties on `this.state` and `this.props` were not found.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-red-500">Oops! Something went wrong.</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">We've logged the error and our team will look into it.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700"
            >
              Try again
            </button>
            {this.state.error && (
              <details className="mt-4 text-left text-xs text-gray-500">
                <summary>Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;