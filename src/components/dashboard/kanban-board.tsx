"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, Flag, FolderKanban } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TaskStatus = "to do" | "in progress" | "review" | "done";

interface ClickUpTask {
  id: string;
  clickup_id: string;
  name: string;
  status: TaskStatus;
  assignee: string;
  priority: number;
  due_date: string;
  list_name: string;
}

const columns: { key: TaskStatus; label: string }[] = [
  { key: "to do", label: "To Do" },
  { key: "in progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

function priorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return "text-danger";
    case 2:
      return "text-warning";
    default:
      return "text-text-muted";
  }
}

function priorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return "Brådskande";
    case 2:
      return "Hög";
    case 3:
      return "Normal";
    default:
      return "Låg";
  }
}

function statusDotColor(status: TaskStatus): string {
  switch (status) {
    case "to do":
      return "bg-text-muted";
    case "in progress":
      return "bg-accent";
    case "review":
      return "bg-warning";
    case "done":
      return "bg-success";
    default:
      return "bg-text-muted";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function TaskCard({ task }: { task: ClickUpTask }) {
  const isOverdue = task.status !== "done" && new Date(task.due_date) < new Date();
  return (
    <Card className="p-3.5 space-y-2.5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-text-primary leading-snug">{task.name}</h4>
        <a
          href={`https://app.clickup.com/t/${task.clickup_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[11px]">
          {task.assignee}
        </Badge>
        <div className="flex items-center gap-1">
          <Flag className={cn("h-3 w-3", priorityColor(task.priority))} />
          <span className={cn("text-[11px]", priorityColor(task.priority))}>
            {priorityLabel(task.priority)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3 w-3 text-text-muted" />
        <span className={cn("text-[11px]", isOverdue ? "text-danger font-medium" : "text-text-muted")}>
          {formatDate(task.due_date)}
          {isOverdue && " (försenad)"}
        </span>
      </div>
      <div className="text-[11px] text-text-muted">{task.list_name}</div>
    </Card>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<ClickUpTask[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/clickup/tasks", { cache: "no-store" });
        if (res.status === 503) {
          if (!cancelled) {
            setError("not-configured");
            setTasks([]);
          }
          return;
        }
        if (!res.ok) throw new Error("fetch-failed");
        const json = await res.json();
        if (!cancelled) setTasks(json.tasks || []);
      } catch {
        if (!cancelled) {
          setError("error");
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
        Laddar uppgifter från ClickUp...
      </div>
    );
  }

  if (error === "not-configured") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8">
        <div className="flex items-start gap-3">
          <FolderKanban className="h-5 w-5 shrink-0 text-accent mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">ClickUp är inte anslutet</div>
            <div className="text-xs text-text-secondary leading-relaxed">
              Lägg till <code className="font-mono">CLICKUP_API_KEY</code> och{" "}
              <code className="font-mono">CLICKUP_TEAM_ID</code> i .env.local och Vercel-env, eller se{" "}
              <Link href="/installningar" className="text-accent hover:underline">
                inställningar
              </Link>{" "}
              för status.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tasks || tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
        Inga uppgifter från ClickUp.
      </div>
    );
  }

  const tasksByStatus = columns.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  return (
    <div className="grid grid-cols-4 gap-4">
      {tasksByStatus.map((col) => (
        <div key={col.key} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className={cn("h-2 w-2 rounded-full", statusDotColor(col.key))} />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {col.label}
            </span>
            <span className="text-xs text-text-muted">{col.tasks.length}</span>
          </div>
          <div className="space-y-2.5">
            {col.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {col.tasks.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-text-muted">
                Inga uppgifter
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
