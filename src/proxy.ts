import { NextRequest, NextResponse } from "next/server";

// Product URL slugs that should be accessible on clearon.live
const productSlugs = new Set([
  "sales-promotion",
  "customer-care",
  "interactive-engage",
  "kampanja",
  "send-a-gift",
  "clearing",
]);

// Static assets and API routes that should always pass through
function isPassthrough(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Always pass through static assets and API routes
  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const isClearonLive =
    hostname === "clearon.live" ||
    hostname === "www.clearon.live";

  const isDashboard =
    hostname.startsWith("dashboard.clearon.live") ||
    hostname.startsWith("dashboard.");

  // On clearon.live: rewrite to /site routes
  if (isClearonLive) {
    // Root -> main landing page
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/site", request.url));
    }

    // Product pages -> /site/[product]
    const slug = pathname.slice(1); // remove leading /
    if (productSlugs.has(slug)) {
      return NextResponse.rewrite(new URL(`/site/${slug}`, request.url));
    }

    // /landing -> redirect to root (old URL)
    if (pathname === "/landing") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Block dashboard routes on public domain
    if (
      pathname.startsWith("/leads") ||
      pathname.startsWith("/produkter") ||
      pathname.startsWith("/ai-agent") ||
      pathname.startsWith("/kampanjer") ||
      pathname.startsWith("/kanaler") ||
      pathname.startsWith("/stellar") ||
      pathname.startsWith("/installningar")
    ) {
      return NextResponse.redirect(
        new URL(pathname, `https://dashboard.clearon.live`)
      );
    }

    return NextResponse.next();
  }

  // On dashboard.clearon.live: serve dashboard as normal
  if (isDashboard) {
    // Redirect root product URLs to clearon.live
    const slug = pathname.slice(1);
    if (productSlugs.has(slug)) {
      return NextResponse.redirect(
        new URL(pathname, "https://clearon.live")
      );
    }
    return NextResponse.next();
  }

  // Localhost / Vercel preview: allow everything, no rewrites
  // This means /site, /site/sales-promotion etc are also accessible for testing
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
