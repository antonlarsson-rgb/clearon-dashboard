"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PACKAGES = [
  {
    id: "engage",
    name: "Incitament",
    tagline: "Locka, varva, konvertera",
    who: "Marknad & Tillvaxt",
    triggers: ["Ny prenumerant", "Cookie-consent", "Leadformular ifyllt", "Kampanjaktivering"],
    mechanics: "SMS-kupong, digital vardecheck, kampanjsida",
    productHref: "/engage",
    example: "Elbolag ger 500 kr ICA-check till nya prenumeranter. Konvertering +34% vs rabattrad.",
    color: "var(--clr-teal)",
    colorSoft: "var(--clr-teal-soft)",
    icon: "\u2197",
  },
  {
    id: "customer-care",
    name: "Kundvard",
    tagline: "Plaster pa saret",
    who: "CX & Support",
    triggers: ["Klagomal registrerat", "Fordrojd leverans", "Servicefel", "Enkatsvar"],
    mechanics: "SMS direkt ur arendesystemet, individuellt belopp",
    productHref: "/customer-care",
    example: "Telecom skickar glass-kupong nar kund vantat >10 min i chatt. NPS +38 punkter.",
    color: "var(--clr-orange)",
    colorSoft: "var(--clr-orange-soft)",
    icon: "\u2665",
  },
  {
    id: "personalbeloning",
    name: "Personalbeloning",
    tagline: "Tack for insatsen",
    who: "HR & Ledning",
    triggers: ["Manadens medarbetare", "Teamets mal natt", "Jubileum", "Jul/midsommar"],
    mechanics: "Batch via CSV/API, skatteklassad, export till lonesystem",
    productHref: "/personalbeloning",
    example: "Bygg-kedja gav Sverigecheck till 4 200 anstallda pa 8 minuter. 94% inlosen.",
    color: "#B8860B",
    colorSoft: "var(--clr-lime-soft)",
    icon: "\u2605",
  },
  {
    id: "kuponger",
    name: "Spel & kampanj",
    tagline: "Gor det lekfullt",
    who: "Brand & Digital",
    triggers: ["Produktlansering", "Sasongskampanj", "Event", "Adventskampanj"],
    mechanics: "Lyckohjul, skraplott, quiz, kalender, allt kopplat till kupong",
    productHref: "/kuponger",
    example: "FMCG-lansering med skraplott, 127 000 deltaganden pa 14 dagar, 41% inlosen.",
    color: "var(--clr-navy)",
    colorSoft: "#E8EEF6",
    icon: "\u25C9",
  },
  {
    id: "sverigechecken",
    name: "Fysisk kupong",
    tagline: "Klassikern i butik",
    who: "Retail & FMCG",
    triggers: ["Print-kampanj", "DR-utskick", "Butikskampanj", "Magasinsbilaga"],
    mechanics: "Tryckt check med streckkod, inloses i kassan, clearas automatiskt",
    productHref: "/sverigechecken",
    example: "ICA-bilaga med Sverigecheck, 5 000+ butiker tar emot, clearing inom 48 h.",
    color: "#6B5B95",
    colorSoft: "#EFEBF5",
    icon: "\u25A3",
  },
];

export function PackagesHub() {
  const { track } = useSignal();
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="paketeringar" style={{ padding: "140px 0 120px", background: "var(--clr-surface-alt)", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        {/* Intro */}
        <div style={{ maxWidth: 780, marginBottom: 72 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>Samma plattform, olika affarer</div>
          <h2 className="c-h2" style={{ marginBottom: 24 }}>
            Ett verktyg.<br/>Fem paketeringar.
          </h2>
          <p className="c-body-lg" style={{ color: "var(--clr-ink-2)", maxWidth: 640 }}>
            ClearOn ar en infrastruktur for beloningar, kuponger, presentkort, vardecheckar, som redan ror sig genom 5 000+ svenska butiker.
            Samma motor levererar losningar for marknad, kundvard, HR, kampanj och retail. Ni valjer paketering utifran vilken affar ni vill flytta.
          </p>
        </div>

        {/* Hub-and-spoke visualization */}
        <div style={{
          position: "relative",
          padding: "64px 32px",
          background: "#fff",
          border: "1px solid var(--clr-line)",
          borderRadius: "var(--r-lg)",
          marginBottom: 80,
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 40,
            alignItems: "center",
          }} className="hub-grid">
            {/* Left: packages 1-2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {PACKAGES.slice(0, 2).map(p => (
                <PackagePill key={p.id} p={p} active={active === p.id} onEnter={() => setActive(p.id)} onLeave={() => setActive(null)} align="right" />
              ))}
            </div>

            {/* Center: core */}
            <div style={{
              width: 220, height: 220, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--clr-navy) 0%, #1A2840 100%)",
              color: "#fff",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 24, textAlign: "center",
              boxShadow: "0 20px 60px rgba(15, 28, 51, 0.25)",
              position: "relative",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", opacity: 0.7, marginBottom: 8 }}>PLATTFORMEN</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 10 }}>ClearOn<br/>Core</div>
              <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>Vardebarare,<br/>distribution, clearing</div>
            </div>

            {/* Right: packages 3-5 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {PACKAGES.slice(2).map(p => (
                <PackagePill key={p.id} p={p} active={active === p.id} onEnter={() => setActive(p.id)} onLeave={() => setActive(null)} align="left" />
              ))}
            </div>
          </div>

          <style>{`
            @media (max-width: 880px) {
              .hub-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
              .hub-grid > div:nth-child(2) { margin: 0 auto; }
            }
          `}</style>

          {/* Footer under hub */}
          <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid var(--clr-line)", display: "flex", gap: 32, flexWrap: "wrap", fontSize: 12, color: "var(--clr-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
            <span>INFRASTRUKTUR: SMS &middot; API &middot; KAMPANJSIDOR &middot; TRYCKT KUPONG</span>
            <span>INLOSEN: 5 000+ BUTIKER</span>
            <span>CLEARING: AUTOMATISK, AUDITERBAR</span>
          </div>
        </div>

        {/* Five tracks, detailed */}
        <div style={{ marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>Valj utgangspunkt</div>
          <h3 className="c-h3" style={{ marginBottom: 8 }}>Vilken paketering passar er affar?</h3>
          <p className="c-body" style={{ color: "var(--clr-ink-2)", maxWidth: 560, marginBottom: 40 }}>
            De flesta kunder borjar i en paketering och vaxer in i fler. Ni behover inte valja allt fran borjan.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }} className="paket-grid">
          {PACKAGES.map(p => (
            <PackageCard key={p.id} p={p} onOpen={() => track("paket:open", { id: p.id })} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PackagePill({ p, active, onEnter, onLeave, align }: {
  p: typeof PACKAGES[0]; active: boolean; onEnter: () => void; onLeave: () => void; align: string;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        background: active ? p.colorSoft : "#fff",
        border: `1px solid ${active ? p.color : "var(--clr-line)"}`,
        borderRadius: "var(--r-md)",
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: align === "right" ? "right" : "left",
        flexDirection: align === "right" ? "row-reverse" : "row",
        transition: "all 0.2s var(--ease-out)",
        cursor: "default",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "var(--r-xs)",
        background: p.colorSoft, color: p.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 700, flexShrink: 0,
      }}>{p.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.name}</div>
        <div style={{ fontSize: 12, color: "var(--clr-muted)", marginTop: 2 }}>{p.tagline}</div>
      </div>
    </div>
  );
}

function PackageCard({ p, onOpen }: { p: typeof PACKAGES[0]; onOpen: () => void }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--clr-line)",
      borderRadius: "var(--r-md)",
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--r-xs)",
          background: p.colorSoft, color: p.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, flexShrink: 0,
        }}>{p.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>{p.name}</div>
          <div style={{ fontSize: 13, color: "var(--clr-muted)", marginTop: 2 }}>{p.tagline}</div>
        </div>
      </div>

      {/* Who buys */}
      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--clr-muted)", letterSpacing: "0.08em" }}>
        AGS AV &middot; {p.who.toUpperCase()}
      </div>

      {/* Triggers */}
      <div>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--clr-muted)", letterSpacing: "0.08em", marginBottom: 8 }}>TRIGGAS AV</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {p.triggers.map(t => (
            <span key={t} style={{
              fontSize: 12, padding: "4px 10px",
              background: "var(--clr-surface-alt)",
              border: "1px solid var(--clr-line)",
              borderRadius: "var(--r-pill)",
              color: "var(--clr-ink-2)",
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Mechanics */}
      <div style={{
        padding: 14,
        background: p.colorSoft,
        borderRadius: "var(--r-xs)",
        fontSize: 13,
        color: "var(--clr-ink-2)",
        lineHeight: 1.5,
      }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color, letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>MEKANIK</div>
        {p.mechanics}
      </div>

      {/* Case */}
      <div style={{
        paddingTop: 16,
        borderTop: "1px solid var(--clr-line)",
        fontSize: 13,
        color: "var(--clr-ink-2)",
        lineHeight: 1.5,
        fontStyle: "italic",
      }}>
        &quot;{p.example}&quot;
      </div>

      {/* CTA */}
      <a href={p.productHref} onClick={onOpen} style={{
        marginTop: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        fontWeight: 600,
        color: p.color,
        textDecoration: "none",
      }}>Las mer om {p.name.toLowerCase()} &rarr;</a>
    </div>
  );
}
