'use client';
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: string;
}
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
            {this.props.context ?? 'Error'}
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground">Something went wrong</h2>
          <p className="max-w-sm text-sm text-steel-600">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          <button
            className="rounded border border-border bg-surface-interactive px-4 py-2 text-sm text-foreground hover:bg-surface"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
