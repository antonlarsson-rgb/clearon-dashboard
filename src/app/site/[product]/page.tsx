import ProductLandingClient from "./product-landing-client";

const ALL_PRODUCT_SLUGS = [
  "sales-promotion",
  "customer-care",
  "interactive-engage",
  "kampanja",
  "send-a-gift",
  "clearing",
  "engage",
  "personalbeloning",
  "kuponger",
  "mobila-presentkort",
  "sverigechecken",
];

export function generateStaticParams() {
  return ALL_PRODUCT_SLUGS.map((slug) => ({ product: slug }));
}

export default async function ProductLandingPage(
  props: { params: Promise<{ product: string }> }
) {
  const { product: urlSlug } = await props.params;

  // Map URL slug to product slug for lookup
  const productSlug = urlSlug === "clearing" ? "clearing-solutions" : urlSlug;

  return <ProductLandingClient productSlug={productSlug} />;
}
