import { useToast } from '@app/ui-kit';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundaryInner extends Component<Props & { showToast: (opt: any) => void }, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_error: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Show user-friendly toast with simple error message (no stack trace)
        this.props.showToast({
            variant: 'error',
            title: 'Something went wrong',
            message: error.message || 'We encountered an issue loading this section. Please try navigating to a different page.',
            duration: 6000,
        });

        // Reset error state after a short delay to allow navigation
        setTimeout(() => {
            this.setState({ hasError: false });
        }, 100);
    }

    public render() {
        // Don't render fallback UI - just let the app continue and show toast
        return this.props.children;
    }
}

export const GlobalErrorBoundary: React.FC<Props> = ({ children }) => {
    const { showToast } = useToast();
    return (
        <ErrorBoundaryInner showToast={showToast}>
            {children}
        </ErrorBoundaryInner>
    );
};
