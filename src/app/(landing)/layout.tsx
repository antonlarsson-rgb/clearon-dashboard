import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClearOn - Digitala kuponger for battre kundrelationer",
  description:
    "Skicka digitala kuponger via SMS direkt till kundens telefon. Fungerar i 5 000+ butiker i hela Sverige.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
