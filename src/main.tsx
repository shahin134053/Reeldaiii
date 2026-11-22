import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface RootErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RootErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Reeldaiii Studio render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] p-6 text-[#F5F7FA]">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121620] p-6 text-center shadow-xl">
            <h1 className="text-lg font-semibold">Reeldaiii Studio</h1>
            <p className="mt-2 text-sm text-white/70">
              {this.state.error.message || 'An unexpected display error occurred.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#0A0C10]"
              >
                Reload Studio
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('chitrakatha_saved_drafts_v1');
                  } catch {
                    // ignore
                  }
                  window.location.href = window.location.pathname;
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-white/85"
              >
                Reset View
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
