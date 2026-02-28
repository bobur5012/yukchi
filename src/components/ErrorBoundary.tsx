"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-7 text-destructive" />
          </div>
          <h2 className="text-[18px] font-semibold mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Произошла непредвиденная ошибка. Попробуйте вернуться назад или обновить страницу.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="rounded-xl"
            >
              Попробовать снова
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="rounded-xl"
            >
              Обновить страницу
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
