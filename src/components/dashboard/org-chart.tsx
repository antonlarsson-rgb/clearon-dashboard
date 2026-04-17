"use client";

import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { Contact, LeadScore } from "@/lib/mock-data";
import Link from "next/link";

interface OrgNode {
  id: string;
  name: string;
  title: string;
  role_category: string;
  reports_to_contact_id: string | null;
  score?: LeadScore;
}

interface OrgChartProps {
  contacts: (Contact & { score?: LeadScore })[];
  currentContactId: string;
}

function buildTree(nodes: OrgNode[]): Map<string | null, OrgNode[]> {
  const tree = new Map<string | null, OrgNode[]>();
  for (const node of nodes) {
    const parentId = node.reports_to_contact_id;
    if (!tree.has(parentId)) tree.set(parentId, []);
    tree.get(parentId)!.push(node);
  }
  return tree;
}

function OrgNodeCard({
  node,
  isCurrent,
}: {
  node: OrgNode;
  isCurrent: boolean;
}) {
  return (
    <Link
      href={`/leads/${node.id}`}
      className={`block border rounded-md p-3 text-center transition-colors hover:bg-surface-elevated ${
        isCurrent
          ? "border-accent bg-accent-subtle"
          : "border-border bg-surface"
      }`}
    >
      <div className="text-sm font-medium text-text-primary">{node.name}</div>
      <div className="text-xs text-text-secondary mt-0.5">{node.title}</div>
      {node.score && (
        <div className="mt-2 flex justify-center">
          <ScoreBadge score={node.score.total_score} size="sm" />
        </div>
      )}
    </Link>
  );
}

function TreeLevel({
  nodes,
  tree,
  currentContactId,
}: {
  nodes: OrgNode[];
  tree: Map<string | null, OrgNode[]>;
  currentContactId: string;
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {nodes.map((node) => {
        const children = tree.get(node.id) ?? [];
        return (
          <div key={node.id} className="flex flex-col items-center">
            <OrgNodeCard
              node={node}
              isCurrent={node.id === currentContactId}
            />
            {children.length > 0 && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="relative">
                  {children.length > 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{
                      width: `${Math.max((children.length - 1) * 160, 0)}px`,
                    }} />
                  )}
                  <div className="flex gap-4">
                    {children.map((child) => {
                      const grandchildren = tree.get(child.id) ?? [];
                      return (
                        <div
                          key={child.id}
                          className="flex flex-col items-center"
                        >
                          <div className="w-px h-4 bg-border" />
                          <OrgNodeCard
                            node={child}
                            isCurrent={child.id === currentContactId}
                          />
                          {grandchildren.length > 0 && (
                            <>
                              <div className="w-px h-4 bg-border" />
                              <div className="flex gap-4">
                                {grandchildren.map((gc) => (
                                  <div
                                    key={gc.id}
                                    className="flex flex-col items-center"
                                  >
                                    <div className="w-px h-4 bg-border" />
                                    <OrgNodeCard
                                      node={gc}
                                      isCurrent={gc.id === currentContactId}
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrgChart({ contacts, currentContactId }: OrgChartProps) {
  const tree = buildTree(contacts);

  // Find root nodes (those whose reports_to_contact_id is null or points outside)
  const allIds = new Set(contacts.map((c) => c.id));
  const roots = contacts.filter(
    (c) =>
      c.reports_to_contact_id === null ||
      !allIds.has(c.reports_to_contact_id)
  );

  if (contacts.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="p-5 border-b border-border">
        <span className="section-prefix">/ ORGANISATIONSKARTA</span>
        <span className="ml-2 text-sm text-text-secondary">
          {contacts[0]?.account_name ?? ""}
        </span>
      </div>
      <div className="p-5 overflow-x-auto">
        <TreeLevel
          nodes={roots}
          tree={tree}
          currentContactId={currentContactId}
        />
      </div>
    </Card>
  );
}
