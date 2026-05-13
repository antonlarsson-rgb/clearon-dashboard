import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ClickUpApiTask {
  id: string;
  name: string;
  status?: { status?: string };
  assignees?: Array<{ username?: string; email?: string }>;
  priority?: { priority?: string } | null;
  due_date?: string | null;
  list?: { name?: string };
}

function normalizeStatus(raw: string | undefined): "to do" | "in progress" | "review" | "done" {
  const s = (raw || "").toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("closed")) return "done";
  if (s.includes("review") || s.includes("qa")) return "review";
  if (s.includes("progress") || s.includes("doing") || s.includes("active")) return "in progress";
  return "to do";
}

function normalizePriority(raw: string | undefined): number {
  const s = (raw || "").toLowerCase();
  if (s === "urgent") return 1;
  if (s === "high") return 2;
  if (s === "normal") return 3;
  return 4;
}

export async function GET() {
  const apiKey = process.env.CLICKUP_API_KEY?.trim();
  const teamId = process.env.CLICKUP_TEAM_ID?.trim();

  if (!apiKey || !teamId) {
    return NextResponse.json(
      {
        error: "not-configured",
        message: "CLICKUP_API_KEY eller CLICKUP_TEAM_ID saknas",
      },
      { status: 503 },
    );
  }

  try {
    const url = `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=false&subtasks=false&order_by=updated&reverse=true`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "clickup-api-error", status: res.status, message: text.slice(0, 500) },
        { status: 502 },
      );
    }

    const json = (await res.json()) as { tasks?: ClickUpApiTask[] };
    const tasks = (json.tasks || []).slice(0, 60).map((t) => ({
      id: t.id,
      clickup_id: t.id,
      name: t.name,
      status: normalizeStatus(t.status?.status),
      assignee:
        t.assignees?.[0]?.username || t.assignees?.[0]?.email?.split("@")[0] || "Otilldelad",
      priority: normalizePriority(t.priority?.priority),
      due_date: t.due_date ? new Date(Number(t.due_date)).toISOString() : new Date().toISOString(),
      list_name: t.list?.name || "ClickUp",
    }));

    return NextResponse.json({ tasks, fetched_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      {
        error: "fetch-failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
