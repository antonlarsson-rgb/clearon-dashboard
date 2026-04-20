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

// Dashboard routes
const dashboardRoutes = [
  "/leads",
  "/produkter",
  "/ai-agent",
  "/kampanjer",
  "/kanaler",
  "/stellar",
  "/installningar",
];

// Basic auth credentials for dashboard
const DASHBOARD_USER = "admin";
const DASHBOARD_PASS = "password";

function isPassthrough(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function isDashboardRoute(pathname: string) {
  if (pathname === "/") return false; // root is ambiguous, handled separately
  return dashboardRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function checkBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  const decoded = atob(authHeader.slice(6));
  const [user, pass] = decoded.split(":");
  return user === DASHBOARD_USER && pass === DASHBOARD_PASS;
}

function requireAuth(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ClearOn Dashboard"',
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const isDashboardHost = hostname.includes("dashboard.");

  // --- dashboard.clearon.live ---
  if (isDashboardHost) {
    // Require basic auth for all dashboard pages
    if (!checkBasicAuth(request)) {
      return requireAuth();
    }

    // Redirect product slugs to clearon.live
    const slug = pathname.slice(1);
    if (productSlugs.has(slug)) {
      return NextResponse.redirect(new URL(pathname, "https://clearon.live"));
    }

    // Serve dashboard as normal
    return NextResponse.next();
  }

  // --- clearon.live (and www) ---
  // Anything that is NOT dashboard host gets the public site

  // Root -> landing page
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/site", request.url));
  }

  // Product pages -> /site/[product]
  const slug = pathname.slice(1);
  if (productSlugs.has(slug)) {
    return NextResponse.rewrite(new URL(`/site/${slug}`, request.url));
  }

  // /landing -> redirect to root
  if (pathname === "/landing") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /site routes pass through (for direct access / testing)
  if (pathname.startsWith("/site")) {
    return NextResponse.next();
  }

  // Dashboard routes on public domain -> redirect to dashboard subdomain
  if (isDashboardRoute(pathname)) {
    return NextResponse.redirect(
      new URL(pathname, "https://dashboard.clearon.live")
    );
  }

  // Everything else -> show landing page (catch-all for public domain)
  return NextResponse.rewrite(new URL("/site", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
