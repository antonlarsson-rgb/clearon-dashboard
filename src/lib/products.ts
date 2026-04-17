export const products = [
  {
    slug: "sales-promotion",
    name: "Sales Promotion",
    tagline: "Fysiska kuponger som driver kop i butik",
    description:
      "Fysiska kuponger i butik. 20 000 anslutna kassor, 5 000 butiker. +15% forsaljningsokning pa etablerade produkter, +46% vid nylansering.",
    icon: "ticket",
    color: "#2D6A4F",
    landingPageUrl: "https://clearon.live/sales-promotion",
    targetAudience: "Trade Marketing Managers, Brand Managers inom FMCG och dagligvaruhandel",
  },
  {
    slug: "customer-care",
    name: "Customer Care",
    tagline: "Digital kompensation som vandar missnoje till lojalitet",
    description:
      "Digital kompensation och kundvard. Ersatt missnojda kunder med digitala checkar via SMS/mail. Mobila presentkort och vardeavier.",
    icon: "heart-handshake",
    color: "#4A90A4",
    landingPageUrl: "https://clearon.live/customer-care",
    targetAudience: "Kundtjanstchefer, CRM Managers inom telekom, retail och hotell",
  },
  {
    slug: "interactive-engage",
    name: "Interactive Engage",
    tagline: "Gamification som okar forsaljning med +16%",
    description:
      "Gamification: spel, tavlingar, spin-the-wheel som ger kuponger. +16% extra forsaljningsokning utover standard-kampanj.",
    icon: "gamepad-2",
    color: "#E07A5F",
    landingPageUrl: "https://clearon.live/interactive-engage",
    targetAudience: "Marketing Managers, Shopper Marketing inom FMCG och retail",
  },
  {
    slug: "kampanja",
    name: "Kampanja",
    tagline: "Bygg kampanjsidor och distribuera kuponger via SMS",
    description:
      "Kampanja.se: skapa egna kampanjsidor med egen URL, distribuera kuponger via SMS direkt till kunder. Perfekt for nylansering och tidsbestamda kampanjer.",
    icon: "megaphone",
    color: "#7B68EE",
    landingPageUrl: "https://clearon.live/kampanja",
    targetAudience: "Marknadschefer, Brand Managers som driver nylansering och kampanjer",
  },
  {
    slug: "send-a-gift",
    name: "Send a Gift",
    tagline: "Digitala presentkort och personalbeloning",
    description:
      "Digitala presentkort och personalbeloning. HR-fokus: belona personal, jubileum, incitament. Distribueras via SMS eller mail.",
    icon: "gift",
    color: "#D4A574",
    landingPageUrl: "https://clearon.live/send-a-gift",
    targetAudience: "HR-chefer, HR-direktorer, Inkopschefer inom stora foretag",
  },
  {
    slug: "clearing-solutions",
    name: "Clearing Solutions",
    tagline: "Clearing-tjanster for kedjor och handlare",
    description:
      "Clearing-tjanster for kedjor. Koppla kedjan till ClearOns clearing for enkel, saker och effektiv hantering av betalningar.",
    icon: "arrow-left-right",
    color: "#6B7280",
    landingPageUrl: "https://clearon.live/clearing",
    targetAudience: "Inkopschefer, Category Managers inom dagligvarukedjor",
  },
] as const;

export type ProductSlug = (typeof products)[number]["slug"];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
