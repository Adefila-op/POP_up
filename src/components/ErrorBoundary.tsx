/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    // Log to error tracking service (Sentry, etc.)
    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Something Went Wrong</h1>

            <p className="text-sm text-muted-foreground text-center mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-xs font-mono text-destructive/80 break-words">
                {this.state.error.message}
              </p>
            </div>

            {this.state.errorCount > 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800">
                  Multiple errors detected. Try clearing your browser cache or contacting support.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Error ID: {this.state.error.name}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

