export interface Message {
  id: string;
  role: "user" | "assistant";
  content: MessageContent[];
  createdAt: number;
}

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "image"; dataUrl: string; name?: string };

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
