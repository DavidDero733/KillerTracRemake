import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        // Try to parse the Firestore error JSON if it exists
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) {
          errorMessage = `Firebase Error: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6 text-center">
          <div className="bg-bg-dark border border-orange-halloween/30 rounded-2xl p-8 max-w-md shadow-2xl">
            <div className="text-5xl mb-4">💀</div>
            <h1 className="font-serif text-xl font-bold text-amber-halloween mb-2">The Watch has Failed</h1>
            <p className="text-sm text-warm-halloween/70 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-halloween text-bg-deep font-bold rounded-full hover:bg-amber-halloween transition-colors"
            >
              Try Again
            </button>
            {errorMessage.includes('permission') && (
              <p className="mt-4 text-[10px] text-muted-halloween">
                Tip: Make sure you are logged in and have permission to perform this action.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
