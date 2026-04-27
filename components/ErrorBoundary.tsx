import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ React Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-card dark:bg-card-dark rounded-lg shadow-md p-8 border border-red-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Erreur de l'Application</h1>
              <p className="text-slate-600 dark:text-slate-400">Une erreur s'est produite lors du chargement de l'application.</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-red-600 break-all">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Recharger la Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="px-6 py-3 bg-slate-200 text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-300 transition-colors"
              >
                Réessayer
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-dark">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Si le problème persiste, veuillez contacter le support technique.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
