import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Image, BookOpen, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { path: "/generate", icon: Sparkles, label: "Generate" },
  { path: "/edit", icon: Image, label: "Edit" },
  { path: "/library", icon: BookOpen, label: "Library" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

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
    </aside>
  );
}
