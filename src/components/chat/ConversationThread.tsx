import { useEffect, useRef } from "react";
import type { Message } from "../../types/message";
import MessageBubble from "./MessageBubble";

interface ConversationThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function ConversationThread({
  messages,
  isLoading,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🦊</div>
          <h2 className="text-lg font-medium text-text-primary mb-1">
            Welcome to Vulpic
          </h2>
          <p className="text-sm text-text-secondary max-w-md">
            Drop an image and tell me what to do — edit, transform, or just ask
            about it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-text-tertiary text-sm px-4 py-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary [animation-delay:0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary [animation-delay:0.2s]" />
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
