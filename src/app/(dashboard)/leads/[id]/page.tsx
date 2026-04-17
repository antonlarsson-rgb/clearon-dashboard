import { contacts, leadScores, productScores, getOrgChart } from "@/lib/mock-data";
import { getProduct } from "@/lib/products";
import { notFound } from "next/navigation";
import { LeadProfileClient } from "./lead-profile-client";

const aiSummaries: Record<string, string> = {
  c1: "Maria Eriksson ar Brand Manager pa Fazer och visar tydliga kopsignaler for Sales Promotion. Hon har besökt produktsidan tre ganger, laddat ner Clear Insights-rapporten och klickat pa demo-lanken i nyhetsbrevet. Hennes chef Anders Johansson (CMO) finns redan i CRM. Rekommendation: boka ett mote inom 48 timmar for att presentera en skraddarsydd kampanjlosning for Fazers kommande produktlansering.",
  c5: "Johan Lindstrom ar HR-chef pa Volvo Cars och sokte aktivt efter digitala personalbeloningar via Google. Han besökte Send a Gift-sidan tva ganger och stannade over 4 minuter. Volvo Cars har 1000+ anstallda vilket gor dem till en ideal kund for personalbeloningsprogram. Rekommendation: kontakta med ett riktat erbjudande kring jubileumsbeloningar och personalincitament.",
  c6: "Anna Svensson, Trade Marketing Manager pa Orkla, klickade pa en LinkedIn-annons for gamification och besökte Interactive Engage-sidan direkt efter. Orkla ar redan kund via en annan kontakt, vilket gor detta till en expansionsmojlighet. Rekommendation: ring Anna och referera till det befintliga samarbetet med Orkla.",
  c8: "Per Nilsson ar Marknadschef pa Lantmannen och har oppnat tre mail i rad denna vecka, vilket tyder pa stigande intresse. Hans profil matchar Sales Promotion och Kampanja. Lantmannen ar ett stort FMCG-bolag med stark narvaro i dagligvaruhandeln. Rekommendation: skicka ett personligt mail med en relevant case study fran livsmedelsbranschen.",
  c9: "Sara Bergstrom, Kundtjanstchef pa Telia, besökte kontaktsidan och Customer Care-produktsidan idag. Telia ar ett stort telekombolag med behov av digital kompensation och kundvard. Hennes roll matchar perfekt med Customer Care-tjansten. Rekommendation: ring Sara och erbjud en kort demo av den digitala kompensationslosningen.",
};

function getDefaultSummary(name: string, company: string, title: string): string {
  return `${name} ar ${title} pa ${company}. Baserat pa tillganglig data visar denne lead ett visst intresse for ClearOns tjanster, men det kravs mer aktivitet for att avgora vilken produkt som passar bast. Rekommendation: lagg till i nasta nyhetsbrev och bevaka framtida aktivitet.`;
}

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = contacts.find((c) => c.id === id);
  if (!contact) {
    notFound();
  }

  const score = leadScores.find((s) => s.contact_id === id) ?? {
    contact_id: id,
    total_score: 0,
    engagement_score: 0,
    fit_score: 0,
    intent_score: 0,
    signals: [],
  };

  const contactProducts = productScores
    .filter((p) => p.contact_id === id)
    .sort((a, b) => b.score - a.score)
    .map((ps) => ({
      ...ps,
      product: getProduct(ps.product_slug),
    }));

  const orgChart = getOrgChart(contact.account_id);

  const aiSummary =
    aiSummaries[id] ??
    getDefaultSummary(contact.name, contact.account_name, contact.title);

  return (
    <LeadProfileClient
      contact={contact}
      score={score}
      contactProducts={contactProducts}
      orgChart={orgChart}
      aiSummary={aiSummary}
    />
  );
}
