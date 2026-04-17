"use client";

import { Search, Bell, Calendar } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-muted hover:border-text-muted transition-colors cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Sok leads, foretag, kampanjer...</span>
        <kbd className="ml-8 hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Date range */}
        <button className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors cursor-pointer">
          <Calendar className="h-3.5 w-3.5" />
          <span>Senaste 7 dagarna</span>
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-text-secondary hover:bg-surface-elevated transition-colors cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-text-primary">Kaveh Sabeghi</div>
            <div className="text-[11px] text-text-muted">Sales Director</div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
            KS
          </div>
        </div>
      </div>
    </header>
  );
}
