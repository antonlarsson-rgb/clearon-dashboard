export const products = [
  {
    slug: "sales-promotion",
    name: "Sales Promotion",
    description:
      "Fysiska kuponger i butik. 20 000 anslutna kassor, 5 000 butiker. +15% forsaljningsokning pa etablerade produkter, +46% vid nylansering.",
    icon: "ticket",
    color: "#2D6A4F",
  },
  {
    slug: "customer-care",
    name: "Customer Care",
    description:
      "Digital kompensation och kundvard. Ersatt missnojda kunder med digitala checkar via SMS/mail. Mobila presentkort och vardeavier.",
    icon: "heart-handshake",
    color: "#4A90A4",
  },
  {
    slug: "interactive-engage",
    name: "Interactive Engage",
    description:
      "Gamification: spel, tavlingar, spin-the-wheel som ger kuponger. +16% extra forsaljningsokning utover standard-kampanj.",
    icon: "gamepad-2",
    color: "#E07A5F",
  },
  {
    slug: "kampanja",
    name: "Kampanja",
    description:
      "Kampanja.se: skapa egna kampanjsidor med egen URL, distribuera kuponger via SMS direkt till kunder. Perfekt for nylansering och tidsbestamda kampanjer.",
    icon: "megaphone",
    color: "#7B68EE",
  },
  {
    slug: "send-a-gift",
    name: "Send a Gift",
    description:
      "Digitala presentkort och personalbeloning. HR-fokus: belona personal, jubileum, incitament. Distribueras via SMS eller mail.",
    icon: "gift",
    color: "#D4A574",
  },
  {
    slug: "clearing-solutions",
    name: "Clearing Solutions",
    description:
      "Clearing-tjanster for kedjor. Koppla kedjan till ClearOns clearing for enkel, saker och effektiv hantering av betalningar.",
    icon: "arrow-left-right",
    color: "#6B7280",
  },
] as const;

export type ProductSlug = (typeof products)[number]["slug"];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
