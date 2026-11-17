import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ResumeIQ X ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#090D16]">
          <div className="max-w-lg w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Something went wrong in this view
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.errorMessage}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.href = '/workspace';
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Return to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
