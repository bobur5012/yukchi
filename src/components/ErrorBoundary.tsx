"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h2 className="text-lg font-semibold mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Произошла ошибка. Попробуйте обновить страницу.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-xl"
          >
            Обновить
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
