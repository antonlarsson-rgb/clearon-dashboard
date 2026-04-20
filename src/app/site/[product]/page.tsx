import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import ProductLandingClient from "./product-landing-client";

// Map URL slugs to product slugs
function resolveProductSlug(urlSlug: string): string {
  if (urlSlug === "clearing") return "clearing-solutions";
  return urlSlug;
}

// Generate static params for all products
export function generateStaticParams() {
  return [
    ...products.map((p) => ({
      product: p.slug === "clearing-solutions" ? "clearing" : p.slug,
    })),
  ];
}

export default async function ProductLandingPage(
  props: { params: Promise<{ product: string }> }
) {
  const { product: urlSlug } = await props.params;
  const productSlug = resolveProductSlug(urlSlug);
  const product = products.find((p) => p.slug === productSlug);

  if (!product) notFound();

  return <ProductLandingClient productSlug={productSlug} />;
}
