import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorDisplay({ message, onRetry, children }) {
  return (
    <div className="pv-card p-8 border-danger/30 bg-danger/5">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-xl font-display font-bold text-text-primary mb-2">Something went wrong</h3>
        <p className="text-text-secondary mb-6 max-w-md">
          {message || 'An unexpected error occurred. Please try again.'}
        </p>
        {children}
        {onRetry && (
          <button onClick={onRetry} className="pv-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
