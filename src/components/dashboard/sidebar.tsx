"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  Building2,
  Flame,
  Bot,
  Megaphone,
  BarChart3,
  FolderKanban,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Oversikt", icon: LayoutDashboard },
  { href: "/hot", label: "Hot Now", icon: Flame, pulse: true },
  { href: "/accounts", label: "Foretag", icon: Building2 },
  { href: "/persons", label: "Personer", icon: UserCircle },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/produkter", label: "Produkter", icon: Package },
  { href: "/ai-agent", label: "AI Agent", icon: Bot },
  { href: "/kampanjer", label: "Kampanjer", icon: Megaphone },
  { href: "/kanaler", label: "Kanaler", icon: BarChart3 },
  { href: "/stellar", label: "Stellar", icon: FolderKanban },
  { href: "/installningar", label: "Installningar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">ClearOn</div>
          <div className="text-[10px] text-text-muted tracking-wide uppercase">Intelligence</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-surface-elevated text-text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  <span className="nav-prefix text-text-muted">/</span>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-accent pulse-live"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-text-muted">AI Agent aktiv</span>
        </div>
      </div>
    </aside>
  );
}
