"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTEGRATIONER ---

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
  apiKeyPrefix: string;
}

const integrations: Integration[] = [
  {
    id: "upsales",
    name: "Upsales",
    description: "CRM, kontakter och forsaljningsdata",
    connected: true,
    lastSync: "2026-04-17 09:30",
    apiKeyPrefix: "ups_",
  },
  {
    id: "clickup",
    name: "ClickUp",
    description: "Projekthantering och uppgifter",
    connected: true,
    lastSync: "2026-04-17 09:15",
    apiKeyPrefix: "ck_",
  },
  {
    id: "ga4",
    name: "GA4",
    description: "Webbanalys och trafikdata",
    connected: true,
    lastSync: "2026-04-17 08:00",
    apiKeyPrefix: "ga4_",
  },
  {
    id: "meta",
    name: "Meta Ads",
    description: "Facebook och Instagram-annonsering",
    connected: true,
    lastSync: "2026-04-17 07:45",
    apiKeyPrefix: "meta_",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Sokannonsering och display",
    connected: true,
    lastSync: "2026-04-17 07:45",
    apiKeyPrefix: "gads_",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    description: "B2B-annonsering och leads",
    connected: false,
    lastSync: null,
    apiKeyPrefix: "li_",
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const [showKey, setShowKey] = useState(false);
  const maskedKey = `${integration.apiKeyPrefix}${"*".repeat(24)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{integration.name}</CardTitle>
            <CardDescription>{integration.description}</CardDescription>
          </div>
          <Badge
            variant={integration.connected ? "default" : "secondary"}
            className={cn(
              integration.connected
                ? "bg-accent-subtle text-accent"
                : "bg-surface-elevated text-text-muted"
            )}
          >
            {integration.connected ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> Ansluten
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <X className="h-3 w-3" /> Ej ansluten
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs text-text-secondary">API-nyckel</label>
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={maskedKey}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Last sync + Sync button */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {integration.lastSync
              ? `Senaste synk: ${integration.lastSync}`
              : "Aldrig synkad"}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!integration.connected}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Synka nu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- SCORING-VIKTER ---

interface ScoringWeight {
  id: string;
  label: string;
  description: string;
  value: number;
}

const defaultWeights: ScoringWeight[] = [
  {
    id: "page_view",
    label: "Sidbesok",
    description: "Poang per sidbesok pa clearon.se",
    value: 8,
  },
  {
    id: "download",
    label: "Nedladdning",
    description: "Rapport eller material nedladdat",
    value: 10,
  },
  {
    id: "email_open",
    label: "Mail oppnat",
    description: "Oppnade ett utskickat mail",
    value: 3,
  },
  {
    id: "email_click",
    label: "Mail-klick",
    description: "Klickade pa lank i mail",
    value: 6,
  },
  {
    id: "ad_click",
    label: "Annonsklick",
    description: "Klickade pa annons (Meta/Google/LinkedIn)",
    value: 4,
  },
  {
    id: "form_submit",
    label: "Formular",
    description: "Fyllde i kontaktformular eller demo-bokning",
    value: 15,
  },
  {
    id: "search",
    label: "Organisk sok",
    description: "Forsta besok via sökmotor",
    value: 5,
  },
  {
    id: "return_visit",
    label: "Aterbesok",
    description: "Kom tillbaka inom 7 dagar",
    value: 7,
  },
];

function ScoringWeights() {
  const [weights, setWeights] = useState(defaultWeights);

  function updateWeight(id: string, value: number) {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, value } : w))
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Justera hur mycket varje signal vager i lead scoring. Hogre varde ger
        mer paverkan pa totalpoangen.
      </p>
      <div className="space-y-5">
        {weights.map((weight) => (
          <div key={weight.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-text-primary">
                  {weight.label}
                </span>
                <span className="ml-2 text-xs text-text-muted">
                  {weight.description}
                </span>
              </div>
              <span className="text-sm font-mono font-medium text-accent min-w-[2rem] text-right">
                {weight.value}
              </span>
            </div>
            <Slider.Root
              className="relative flex h-5 w-full touch-none select-none items-center"
              value={[weight.value]}
              onValueChange={([val]) => updateWeight(weight.id, val)}
              max={20}
              min={0}
              step={1}
            >
              <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-elevated">
                <Slider.Range className="absolute h-full bg-accent" />
              </Slider.Track>
              <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-surface shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 cursor-pointer" />
            </Slider.Root>
          </div>
        ))}
      </div>
      <div className="pt-2">
        <Button size="sm">Spara vikter</Button>
      </div>
    </div>
  );
}

// --- TEAM ---

interface TeamMember {
  name: string;
  email: string;
  role: "admin" | "user";
}

const team: TeamMember[] = [
  { name: "Kaveh Sabeghi", email: "kaveh@clearon.se", role: "admin" },
];

function TeamList() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Hantera anvandare som har tillgang till dashboarden.
      </p>
      <div className="space-y-3">
        {team.map((member) => (
          <Card key={member.email} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle">
                  <UserCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {member.name}
                  </div>
                  <div className="text-xs text-text-muted">{member.email}</div>
                </div>
              </div>
              <Badge variant="default" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {member.role === "admin" ? "Admin" : "Anvandare"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" size="sm">
        Bjud in anvandare
      </Button>
    </div>
  );
}

// --- NOTIFIERINGAR ---

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultNotifications: NotificationSetting[] = [
  {
    id: "hot_lead",
    label: "Heta leads",
    description: "Notifiera nar en lead nar over 70 poang",
    enabled: true,
  },
  {
    id: "new_lead",
    label: "Nya leads",
    description: "Notifiera nar en ny kontakt registreras",
    enabled: true,
  },
  {
    id: "task_done",
    label: "Slutforda uppgifter",
    description: "Notifiera nar Stellar slutfor en uppgift",
    enabled: false,
  },
  {
    id: "weekly_report",
    label: "Veckorapport",
    description: "Skicka veckosammanfattning varje mandag",
    enabled: true,
  },
  {
    id: "campaign_alert",
    label: "Kampanjvarningar",
    description: "Notifiera vid budgetoverskridning eller prestandafall",
    enabled: true,
  },
  {
    id: "ai_suggestion",
    label: "AI-forslag",
    description: "Notifiera nar AI Agent har nya rekommendationer",
    enabled: false,
  },
];

function NotificationSettings() {
  const [notifications, setNotifications] = useState(defaultNotifications);

  function toggle(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Valj vilka notifieringar du vill ta emot via mail och i dashboarden.
      </p>
      <div className="space-y-3">
        {notifications.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between rounded-md border border-border p-4"
          >
            <div>
              <div className="text-sm font-medium text-text-primary">
                {setting.label}
              </div>
              <div className="text-xs text-text-muted">
                {setting.description}
              </div>
            </div>
            <Switch.Root
              checked={setting.enabled}
              onCheckedChange={() => toggle(setting.id)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                setting.enabled ? "bg-accent" : "bg-border"
              )}
            >
              <Switch.Thumb
                className={cn(
                  "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                  setting.enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                )}
              />
            </Switch.Root>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN SETTINGS PANEL ---

const tabItems = [
  { value: "integrationer", label: "Integrationer" },
  { value: "scoring", label: "Scoring-vikter" },
  { value: "team", label: "Team" },
  { value: "notifieringar", label: "Notifieringar" },
];

export function SettingsPanel() {
  return (
    <Tabs.Root defaultValue="integrationer">
      <Tabs.List className="flex gap-1 border-b border-border pb-px">
        {tabItems.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors rounded-t-md cursor-pointer",
              "text-text-secondary hover:text-text-primary",
              "data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:-mb-px"
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="pt-6">
        <Tabs.Content value="integrationer">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
              />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="scoring">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="section-prefix">/ SCORING-VIKTER</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoringWeights />
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="team">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="section-prefix">/ TEAM</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamList />
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="notifieringar">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="section-prefix">/ NOTIFIERINGAR</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
