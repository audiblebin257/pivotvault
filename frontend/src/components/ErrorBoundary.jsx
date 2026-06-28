import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="glass-card p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-danger" />
            </div>
            <h1 className="text-2xl font-display font-bold text-text-primary mb-4">System Malfunction</h1>
            <p className="text-text-secondary mb-8">
              A critical error occurred in the PivotVault interface. Our diagnostic systems have been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full pv-btn-primary"
            >
              <RefreshCcw className="w-5 h-5" />
              Reboot Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
