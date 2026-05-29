import type { ReactNode } from "react";

interface TopBarProps {
  children?: ReactNode;
}

export default function TopBar({ children }: TopBarProps) {
  return (
    <header className="flex items-center justify-end border-b border-border bg-bg-primary px-6 py-3">
      {children}
    </header>
  );
}
