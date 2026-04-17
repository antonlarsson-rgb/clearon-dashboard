"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { products } from "@/lib/products";
import {
  Users,
  Flame,
  Sparkles,
  Moon,
  ShoppingBag,
  Building2,
} from "lucide-react";

export type SegmentKey =
  | "all"
  | "hot"
  | "new"
  | "sleeping"
  | "existing"
  | `product:${string}`;

interface LeadsSidebarProps {
  activeSegment: SegmentKey;
  onSegmentChange: (segment: SegmentKey) => void;
  counts: {
    all: number;
    hot: number;
    new: number;
    sleeping: number;
    existing: number;
    byProduct: Record<string, number>;
  };
}

export function LeadsSidebar({
  activeSegment,
  onSegmentChange,
  counts,
}: LeadsSidebarProps) {
  const [expandProducts, setExpandProducts] = useState(true);

  const segments: {
    key: SegmentKey;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "all",
      label: "Alla leads",
      icon: <Users className="h-4 w-4" />,
      count: counts.all,
    },
    {
      key: "hot",
      label: "Heta leads",
      icon: <Flame className="h-4 w-4" />,
      count: counts.hot,
    },
    {
      key: "new",
      label: "Nya leads (7d)",
      icon: <Sparkles className="h-4 w-4" />,
      count: counts.new,
    },
    {
      key: "sleeping",
      label: "Sovande (30d+)",
      icon: <Moon className="h-4 w-4" />,
      count: counts.sleeping,
    },
    {
      key: "existing",
      label: "Befintliga kunder",
      icon: <Building2 className="h-4 w-4" />,
      count: counts.existing,
    },
  ];

  return (
    <Card className="w-full">
      <div className="p-4 border-b border-border">
        <span className="section-prefix">/ SEGMENT</span>
      </div>
      <div className="p-2">
        {segments.map((seg) => (
          <button
            key={seg.key}
            onClick={() => onSegmentChange(seg.key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeSegment === seg.key
                ? "bg-accent-subtle text-accent font-medium"
                : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            {seg.icon}
            <span className="flex-1 text-left">{seg.label}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {seg.count}
            </Badge>
          </button>
        ))}
      </div>

      <div className="border-t border-border p-4">
        <button
          onClick={() => setExpandProducts(!expandProducts)}
          className="flex items-center gap-2 w-full cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4 text-text-muted" />
          <span className="section-prefix">/ PER PRODUKT</span>
        </button>
        {expandProducts && (
          <div className="mt-2 space-y-0.5">
            {products.map((product) => (
              <button
                key={product.slug}
                onClick={() =>
                  onSegmentChange(`product:${product.slug}` as SegmentKey)
                }
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  activeSegment === `product:${product.slug}`
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: product.color }}
                />
                <span className="flex-1 text-left truncate">
                  {product.name}
                </span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {counts.byProduct[product.slug] ?? 0}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
