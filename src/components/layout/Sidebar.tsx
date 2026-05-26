import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Settings, Plus } from "lucide-react";
import clsx from "clsx";
import { useChatStore } from "../../stores/chatStore";

const navItems = [
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const createConversation = useChatStore((s) => s.createConversation);

  const handleNewChat = () => {
    const id = createConversation();
    navigate(`/chat/${id}`);
  };

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-border bg-bg-secondary py-4">
      {/* Logo / Brand */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold">
        V
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              )}
              title={item.label}
            >
              <item.icon size={20} />
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Chat */}
      {location.pathname.startsWith("/chat") && (
        <button
          onClick={handleNewChat}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          title="New Conversation"
        >
          <Plus size={20} />
        </button>
      )}
    </aside>
  );
}
