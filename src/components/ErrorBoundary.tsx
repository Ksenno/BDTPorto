import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unknown runtime error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 border border-amber-500/30 bg-[#111111] text-[#f2f2f0] flex flex-col items-center justify-center text-center space-y-4 my-6">
          <div className="flex items-center gap-2 font-mono-code text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{this.props.fallbackTitle || 'SYSTEM DIAGNOSTIC · RECOVERY ACTIVE'}</span>
          </div>
          <p className="font-sans-body text-sm text-[#8a8a86] max-w-md">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#c8ff00] bg-[#c8ff00] text-[#0a0a0a] font-mono-code text-xs font-semibold hover:bg-[#f2f2f0] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>REINITIALIZE STAGE</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
