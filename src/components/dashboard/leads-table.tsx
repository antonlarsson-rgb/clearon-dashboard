"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import { LeadsSidebar, type SegmentKey } from "./leads-sidebar";
import {
  contacts,
  leadScores,
  productScores,
  shouldContactNow,
  type Contact,
  type LeadScore,
  type ProductScore,
} from "@/lib/mock-data";
import { products, getProduct } from "@/lib/products";
import { timeAgo } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Download,
  UserPlus,
  Mail,
  ChevronDown,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface EnrichedLead {
  contact: Contact;
  score: LeadScore;
  topProduct: ProductScore | undefined;
  allProducts: ProductScore[];
}

function enrichLeads(): EnrichedLead[] {
  return contacts
    .map((contact) => {
      const score = leadScores.find((s) => s.contact_id === contact.id);
      const contactProducts = productScores
        .filter((p) => p.contact_id === contact.id)
        .sort((a, b) => b.score - a.score);
      return {
        contact,
        score: score ?? {
          contact_id: contact.id,
          total_score: 0,
          engagement_score: 0,
          fit_score: 0,
          intent_score: 0,
          signals: [],
        },
        topProduct: contactProducts[0],
        allProducts: contactProducts,
      };
    })
    .sort((a, b) => b.score.total_score - a.score.total_score);
}

const sourceOptions = [
  { value: "", label: "Alla kallor" },
  { value: "page_view", label: "Webbbesok" },
  { value: "download", label: "Nedladdning" },
  { value: "email_click", label: "E-post" },
  { value: "ad_click", label: "Annons" },
  { value: "search", label: "Sok" },
];

const statusOptions = [
  { value: "", label: "Alla statusar" },
  { value: "hot", label: "Het" },
  { value: "warm", label: "Varm" },
  { value: "cold", label: "Kall" },
];

function getStatus(score: number): { label: string; value: string } {
  if (score >= 70) return { label: "Het", value: "hot" };
  if (score >= 40) return { label: "Varm", value: "warm" };
  return { label: "Kall", value: "cold" };
}

function getLatestSignalSource(lead: EnrichedLead): string {
  if (lead.score.signals.length === 0) return "Okand";
  const type = lead.score.signals[0].type;
  switch (type) {
    case "page_view":
      return "Webbbesok";
    case "download":
      return "Nedladdning";
    case "email_click":
    case "email_open":
      return "E-post";
    case "ad_click":
      return "Annons";
    case "search":
      return "Sok";
    default:
      return type;
  }
}

function getLatestActivity(lead: EnrichedLead): string {
  if (lead.score.signals.length === 0) return "-";
  const latest = lead.score.signals.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  return timeAgo(latest.timestamp);
}

export function LeadsTable() {
  const allLeads = useMemo(() => enrichLeads(), []);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("all");
  const [search, setSearch] = useState("");
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [productFilter, setProductFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<"score" | "name" | "company">(
    "score"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const segmentFiltered = useMemo(() => {
    let leads = allLeads;
    switch (activeSegment) {
      case "hot":
        leads = leads.filter((l) => l.score.total_score > 70);
        break;
      case "new":
        leads = leads.filter((l) => {
          if (l.score.signals.length === 0) return false;
          const latest = l.score.signals.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          )[0];
          const daysDiff =
            (Date.now() - new Date(latest.timestamp).getTime()) / 86400000;
          return daysDiff <= 7;
        });
        break;
      case "sleeping":
        leads = leads.filter((l) => {
          if (l.score.signals.length === 0) return true;
          const latest = l.score.signals.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          )[0];
          const daysDiff =
            (Date.now() - new Date(latest.timestamp).getTime()) / 86400000;
          return daysDiff > 30;
        });
        break;
      case "existing":
        leads = leads.filter((l) => l.score.total_score >= 40);
        break;
      default:
        if (activeSegment.startsWith("product:")) {
          const slug = activeSegment.replace("product:", "");
          const contactIds = new Set(
            productScores
              .filter((p) => p.product_slug === slug)
              .map((p) => p.contact_id)
          );
          leads = leads.filter((l) => contactIds.has(l.contact.id));
        }
    }
    return leads;
  }, [allLeads, activeSegment]);

  const filteredLeads = useMemo(() => {
    let leads = segmentFiltered;

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.contact.name.toLowerCase().includes(q) ||
          l.contact.account_name.toLowerCase().includes(q)
      );
    }

    leads = leads.filter(
      (l) =>
        l.score.total_score >= scoreMin && l.score.total_score <= scoreMax
    );

    if (productFilter) {
      const contactIds = new Set(
        productScores
          .filter((p) => p.product_slug === productFilter)
          .map((p) => p.contact_id)
      );
      leads = leads.filter((l) => contactIds.has(l.contact.id));
    }

    if (sourceFilter) {
      leads = leads.filter((l) =>
        l.score.signals.some((s) => s.type === sourceFilter)
      );
    }

    if (statusFilter) {
      leads = leads.filter(
        (l) => getStatus(l.score.total_score).value === statusFilter
      );
    }

    leads = [...leads].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "score":
          cmp = a.score.total_score - b.score.total_score;
          break;
        case "name":
          cmp = a.contact.name.localeCompare(b.contact.name, "sv");
          break;
        case "company":
          cmp = a.contact.account_name.localeCompare(
            b.contact.account_name,
            "sv"
          );
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return leads;
  }, [
    segmentFiltered,
    search,
    scoreMin,
    scoreMax,
    productFilter,
    sourceFilter,
    statusFilter,
    sortField,
    sortDir,
  ]);

  const counts = useMemo(() => {
    const hot = allLeads.filter((l) => l.score.total_score > 70).length;
    const newLeads = allLeads.filter((l) => {
      if (l.score.signals.length === 0) return false;
      const latest = l.score.signals.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      return (Date.now() - new Date(latest.timestamp).getTime()) / 86400000 <= 7;
    }).length;
    const sleeping = allLeads.filter((l) => {
      if (l.score.signals.length === 0) return true;
      const latest = l.score.signals.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      return (Date.now() - new Date(latest.timestamp).getTime()) / 86400000 > 30;
    }).length;
    const existing = allLeads.filter((l) => l.score.total_score >= 40).length;

    const byProduct: Record<string, number> = {};
    for (const product of products) {
      const ids = new Set(
        productScores
          .filter((p) => p.product_slug === product.slug)
          .map((p) => p.contact_id)
      );
      byProduct[product.slug] = allLeads.filter((l) =>
        ids.has(l.contact.id)
      ).length;
    }

    return {
      all: allLeads.length,
      hot,
      new: newLeads,
      sleeping,
      existing,
      byProduct,
    };
  }, [allLeads]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.contact.id)));
    }
  }

  function handleSort(field: "score" | "name" | "company") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 shrink-0 hidden lg:block">
        <LeadsSidebar
          activeSegment={activeSegment}
          onSegmentChange={setActiveSegment}
          counts={counts}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Sok namn eller foretag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 font-body"
            />
          </div>
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
                <UserPlus className="h-3.5 w-3.5" />
                Lagg till i audience
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" />
                Exportera
              </Button>
            </>
          )}
        </div>

        {/* Filter bar */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-mono uppercase">
                  Score
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMin}
                  onChange={(e) => setScoreMin(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
                />
                <span className="text-text-muted text-xs">till</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMax}
                  onChange={(e) => setScoreMax(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-mono uppercase">
                  Produkt
                </label>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
                >
                  <option value="">Alla</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-mono uppercase">
                  Kalla
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
                >
                  {sourceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-mono uppercase">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-border rounded-md bg-surface font-body"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {filteredLeads.length} leads
          </span>
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
                      checked={
                        selectedIds.size === filteredLeads.length &&
                        filteredLeads.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="py-3 px-4 text-left w-16">
                    <button
                      onClick={() => handleSort("score")}
                      className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer"
                    >
                      Score
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer"
                    >
                      Namn
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button
                      onClick={() => handleSort("company")}
                      className="flex items-center gap-1 text-text-muted font-mono text-xs uppercase cursor-pointer"
                    >
                      Foretag
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">
                    Titel
                  </th>
                  <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">
                    Produkt
                  </th>
                  <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">
                    Aktivitet
                  </th>
                  <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">
                    Kalla
                  </th>
                  <th className="py-3 px-4 text-left text-text-muted font-mono text-xs uppercase">
                    Status
                  </th>
                  <th className="py-3 px-4 text-center text-text-muted font-mono text-xs uppercase">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => {
                  const product = lead.topProduct
                    ? getProduct(lead.topProduct.product_slug)
                    : null;
                  const status = getStatus(lead.score.total_score);
                  const contactNow = shouldContactNow(lead.contact.id);

                  return (
                    <tr
                      key={lead.contact.id}
                      className={`hover:bg-surface-elevated transition-colors group ${contactNow.should ? "bg-amber-50/30" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.contact.id)}
                          onChange={() => toggleSelect(lead.contact.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <ScoreBadge
                          score={lead.score.total_score}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/leads/${lead.contact.id}`}
                          className="font-medium text-text-primary hover:text-accent transition-colors"
                        >
                          {lead.contact.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {lead.contact.account_name}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {lead.contact.title}
                      </td>
                      <td className="py-3 px-4">
                        {product ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: product.color }}
                            />
                            <span className="text-text-secondary truncate">
                              {product.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {getLatestActivity(lead)}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {getLatestSignalSource(lead)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            status.value === "hot" ? "default" : "secondary"
                          }
                          className={
                            status.value === "hot"
                              ? ""
                              : status.value === "warm"
                                ? "bg-amber-50 text-amber-700"
                                : ""
                          }
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {contactNow.should ? (
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
    </div>
  );
}
