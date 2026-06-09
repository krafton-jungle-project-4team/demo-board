import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryFallbackProps = {
    error: Error;
    reset: () => void;
};

type AppErrorBoundaryProps = {
    children: ReactNode;
    fallback: (props: AppErrorBoundaryFallbackProps) => ReactNode;
    onReset?: () => void;
};

type AppErrorBoundaryState = {
    error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    override state: AppErrorBoundaryState = {
        error: null
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return { error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(error, errorInfo);
    }

    override render() {
        if (this.state.error) {
            return this.props.fallback({
                error: this.state.error,
                reset: this.reset
            });
        }

        return this.props.children;
    }

    private reset = () => {
        this.props.onReset?.();
        this.setState({ error: null });
    };
}
