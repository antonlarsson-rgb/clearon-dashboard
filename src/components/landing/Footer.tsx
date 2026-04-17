"use client";

export function Footer() {
  return (
    <footer
      className="w-full"
      style={{ backgroundColor: "#2a332a", fontFamily: "Carlito, sans-serif" }}
      data-testid="footer"
    >
      <div className="max-w-md mx-auto px-6 py-10 text-center">
        <a
          href="https://www.clearon.se/"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-footer-logo"
        >
          <svg
            viewBox="0 0 120 24"
            className="h-6 mx-auto mb-4 opacity-80 hover:opacity-100 transition-opacity"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="0"
              y="18"
              fill="#a3b88c"
              fontSize="20"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-0.5"
            >
              ClearOn
            </text>
          </svg>
        </a>

        <p className="text-xs text-white/50 leading-relaxed mb-5 max-w-xs mx-auto">
          ClearOn erbjuder digitala kupong- och belöningslösningar för kundvärvning, kundvård och personalbelöning.
        </p>

        <div className="flex items-center justify-center gap-4 mb-5">
          <a
            href="https://www.clearon.se/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
            data-testid="link-footer-about"
          >
            Om ClearOn
          </a>
          <span className="text-white/20">&middot;</span>
          <a
            href="https://www.clearon.se/behandling-av-personuppgifter/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
            data-testid="link-footer-privacy"
          >
            Integritetspolicy
          </a>
        </div>

        <p className="text-[10px] text-white/30">
          &copy; 2025 ClearOn AB
        </p>
      </div>
    </footer>
  );
}
