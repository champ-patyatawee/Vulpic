import type { ReactNode } from "react";

interface ContentAreaProps {
  children: ReactNode;
}

export default function ContentArea({ children }: ContentAreaProps) {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {children}
    </main>
  );
}
