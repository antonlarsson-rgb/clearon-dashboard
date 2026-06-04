import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "ClearOn - Digitala kuponger for battre kundrelationer",
  description:
    "Skicka digitala kuponger via SMS direkt till kundens telefon. Fungerar i 5 000+ butiker i hela Sverige.",
};

// Pixel-ID levt fran Meta Events Manager. Hardkodat for klient-snutten
// (det ar offentligt anda, finns i HTML:en). CAPI-token lases server-side
// fran process.env.META_CAPI_ACCESS_TOKEN.
const META_PIXEL_ID = "885264364588464";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Meta Pixel + li_fat_id-capture. Laddas bara pa /site-routes (clearon.live), inte dashboard. */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
// Initial PageView fyras via vart eget track('page_load') sa eventID matchar CAPI.
        `}
      </Script>
      <noscript>
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Script id="li-fat-id-capture" strategy="afterInteractive">
        {`
try {
  var p = new URLSearchParams(location.search);
  var li = p.get('li_fat_id');
  if (li) {
    var oneYear = 60*60*24*365;
    document.cookie = 'li_fat_id=' + encodeURIComponent(li) + '; path=/; max-age=' + oneYear + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
} catch (e) {}
        `}
      </Script>
      {children}
    </>
  );
}
