"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-zinc-900 mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-zinc-600 text-sm mb-6">
              {this.state.error?.message ?? "Неизвестная ошибка"}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
              >
                Попробовать снова
              </button>
              <Link
                href="/cars"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 text-sm font-medium hover:bg-zinc-50"
              >
                В каталог
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
