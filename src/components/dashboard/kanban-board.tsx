"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clickupTasks, type ClickUpTask } from "@/lib/mock-data";
import { Calendar, ExternalLink, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const columns: { key: ClickUpTask["status"]; label: string }[] = [
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
    case 3:
      return "text-text-muted";
    default:
      return "text-text-muted";
  }
}

function priorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return "Braddskande";
    case 2:
      return "Hog";
    case 3:
      return "Normal";
    default:
      return "Lag";
  }
}

function statusDotColor(status: ClickUpTask["status"]): string {
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
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function TaskCard({ task }: { task: ClickUpTask }) {
  const isOverdue =
    task.status !== "done" && new Date(task.due_date) < new Date();

  return (
    <Card className="p-3.5 space-y-2.5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-text-primary leading-snug">
          {task.name}
        </h4>
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
          <span
            className={cn(
              "text-[11px]",
              priorityColor(task.priority)
            )}
          >
            {priorityLabel(task.priority)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Calendar className="h-3 w-3 text-text-muted" />
        <span
          className={cn(
            "text-[11px]",
            isOverdue ? "text-danger font-medium" : "text-text-muted"
          )}
        >
          {formatDate(task.due_date)}
          {isOverdue && " (forsenad)"}
        </span>
      </div>

      <div className="text-[11px] text-text-muted">{task.list_name}</div>
    </Card>
  );
}

export function KanbanBoard() {
  const tasksByStatus = columns.map((col) => ({
    ...col,
    tasks: clickupTasks.filter((t) => t.status === col.key),
  }));

  return (
    <div className="grid grid-cols-4 gap-4">
      {tasksByStatus.map((col) => (
        <div key={col.key} className="space-y-3">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1">
            <span className={cn("h-2 w-2 rounded-full", statusDotColor(col.key))} />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {col.label}
            </span>
            <span className="text-xs text-text-muted">
              {col.tasks.length}
            </span>
          </div>

          {/* Cards */}
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
