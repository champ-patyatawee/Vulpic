import clsx from "clsx";
import type { Message, MessageContent } from "../../types/message";
import ResultActions from "../editor/ResultActions";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3",
          isUser
            ? "bg-accent text-white"
            : "bg-bg-secondary text-text-primary"
        )}
      >
        {message.content.map((item, i) => (
          <MessageContentItem key={i} content={item} isUser={isUser} />
        ))}
      </div>
    </div>
  );
}

function MessageContentItem({
  content,
  isUser,
}: {
  content: MessageContent;
  isUser: boolean;
}) {
  if (content.type === "text") {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content.text}</p>;
  }

  if (content.type === "image") {
    return (
      <div className="flex flex-col gap-2">
        <img
          src={content.dataUrl}
          alt={content.name ?? "Image"}
          className="max-h-80 w-full rounded-lg object-contain"
        />
        {!isUser && content.name && (
          <span className="text-xs text-text-tertiary">{content.name}</span>
        )}
        {/* Show download/copy for assistant image results */}
        {!isUser && <ResultActions imageDataUrl={content.dataUrl} imageName={content.name} />}
      </div>
    );
  }

  return null;
}
