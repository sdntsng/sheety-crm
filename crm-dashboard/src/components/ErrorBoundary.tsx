'use client';

import { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void) => ReactNode;
    router?: {
        push: (path: string) => void;
    };
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError);
            }

            return (
                <div className="p-8">
                    <div className="max-w-lg mx-auto mt-20">
                        <div className="paper-card p-8 text-center bg-white border border-[var(--border-ink)] shadow-[8px_8px_0px_var(--border-ink)]">
                            <span className="text-4xl mb-4 block">⚠️</span>
                            <h2 className="text-xl font-sans font-bold text-[var(--color-ink)] mb-2">
                                Something went wrong
                            </h2>
                            <p className="font-mono text-sm text-[var(--color-ink-muted)] mb-6">
                                {this.state.error.message || 'An unexpected error occurred'}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.resetError}
                                    className="btn-primary"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 font-mono text-xs uppercase font-bold border border-[var(--border-pencil)] rounded bg-white hover:bg-[var(--bg-hover)] transition-all"
                                >
                                    Reload
                                </button>
                                <button
                                    onClick={() => this.props.router?.push('/dashboard')}
                                    className="px-4 py-2 font-mono text-xs uppercase font-bold border border-[var(--border-pencil)] rounded bg-white hover:bg-[var(--bg-hover)] transition-all"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component that provides the router
export function ErrorBoundary({ children, fallback }: Omit<ErrorBoundaryProps, 'router'>) {
    const router = useRouter();
    
    return (
        <ErrorBoundaryClass router={router} fallback={fallback}>
            {children}
        </ErrorBoundaryClass>
    );
}

export default ErrorBoundary;
