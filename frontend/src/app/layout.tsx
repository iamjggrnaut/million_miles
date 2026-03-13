import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Million Miles — Каталог авто",
  description: "Просмотр каталога автомобилей из CarSensor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen bg-zinc-50 text-zinc-900">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
