"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { DashboardContact } from "@/lib/dashboard-data";
import { products } from "@/lib/products";
import {
  Search,
  SlidersHorizontal,
  Download,
  Mail,
  ArrowUpDown,
  Zap,
} from "lucide-react";

interface LeadsTableProps {
  contacts: DashboardContact[];
}

type SortField = "score" | "name" | "company";

const statusColors: Record<string, string> = {
  hot: "",
  warm: "bg-amber-50 text-amber-700",
  cold: "",
};

export function LeadsTable({ contacts }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showOnlyContactNow, setShowOnlyContactNow] = useState(false);

  const channels = useMemo(() => {
    const set = new Set(contacts.map((c) => c.sourceChannel));
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    let leads = contacts;

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q))
      );
    }

    if (statusFilter) {
      leads = leads.filter((l) => l.status === statusFilter);
    }

    if (channelFilter) {
      leads = leads.filter((l) => l.sourceChannel === channelFilter);
    }

    if (showOnlyContactNow) {
      leads = leads.filter((l) => l.contactNow);
    }

    leads = [...leads].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "score":
          cmp = a.score - b.score;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name, "sv");
          break;
        case "company":
          cmp = a.company.localeCompare(b.company, "sv");
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return leads;
  }, [contacts, search, statusFilter, channelFilter, showOnlyContactNow, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const contactNowCount = contacts.filter((c) => c.contactNow).length;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Sok namn, foretag eller email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 font-body"
          />
        </div>
        <Button
          variant={showOnlyContactNow ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyContactNow(!showOnlyContactNow)}
        >
          <Zap className="h-3.5 w-3.5" />
          Kontakta nu ({contactNowCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </Button>
        {selectedIds.size > 0 && (
          <>
            <Button variant="outline" size="sm">
              <Mail className="h-3.5 w-3.5" />
              Skicka mail ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" />
              Exportera
            </Button>
          </>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted font-mono uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
              >
                <option value="">Alla</option>
                <option value="hot">Het</option>
                <option value="warm">Varm</option>
                <option value="cold">Kall</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted font-mono uppercase">Kalla</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
              >
                <option value="">Alla</option>
                {channels.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{filtered.length} leads</span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={() => {
                      if (selectedIds.size === filtered.length) setSelectedIds(new Set());
                      else setSelectedIds(new Set(filtered.map((l) => l.id)));
                    }}
                    className="rounded border-border"
                  />
                </th>
                <th className="py-3 px-4 text-left w-16">
                  <button onClick={() => handleSort("score")} className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer">
                    Score <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-left">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer">
                    Namn <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-left">
                  <button onClick={() => handleSort("company")} className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer">
                    Foretag <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">Titel</th>
                <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">Produkt</th>
                <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">Kalla</th>
                <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">Status</th>
                <th className="py-3 px-4 text-center text-text-muted font-mono text-xs uppercase">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((lead) => {
                const product = lead.topProduct
                  ? products.find((p) => p.slug === lead.topProduct)
                  : null;

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-surface-elevated transition-colors ${lead.contactNow ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <ScoreBadge score={Math.min(lead.score, 100)} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-text-primary">
                        {lead.name}
                      </span>
                      {lead.email && (
                        <p className="text-[10px] text-text-muted truncate max-w-[180px]">{lead.email}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{lead.company}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{lead.title || "-"}</td>
                    <td className="py-3 px-4">
                      {product ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: product.color }} />
                          <span className="text-text-secondary text-xs truncate">{product.name}</span>
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{lead.sourceChannel}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={lead.status === "hot" ? "default" : "secondary"}
                        className={statusColors[lead.status] || ""}
                      >
                        {lead.status === "hot" ? "Het" : lead.status === "warm" ? "Varm" : "Kall"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {lead.contactNow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <Zap className="h-2.5 w-2.5" />
                          Kontakta nu
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
