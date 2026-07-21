import type { Metadata } from "next";
import { Lilita_One, Caveat, Space_Mono, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Image from "next/image";
import ScrollAnimations from "@/components/ScrollAnimations";
import NavCart from "@/components/NavCart";
import { SOLD_OUT } from "@/lib/store-config";
import "./globals.css";

const lilitaOne = Lilita_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lilita",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verde — Cocina ecuatoriana en Madrid",
  description:
    "Bolones, tigrillos y corviches bajo pedido. Pide con antelación y recíbelo el día que elijas.",
  icons: {
    icon: "/iconVerde.png",
    apple: "/iconVerde.png",
  },
};

// Datos estructurados (schema.org) — dirección/teléfono autoritativos para
// Google y buscadores con IA. NAP (nombre, dirección, teléfono) consistente con
// PICKUP_ADDRESS en lib/store-config.ts.
const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://www.verdemadrid.com/#restaurant",
  name: "Verde Madrid",
  description:
    "Cocina ecuatoriana bajo pedido en Madrid: bolones, tigrillos y corviches. Entrega a domicilio y recogida.",
  url: "https://www.verdemadrid.com",
  telephone: "+34605442809",
  servesCuisine: "Ecuatoriana",
  priceRange: "€€",
  image: "https://www.verdemadrid.com/iconVerde.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle de la Araucaria 19",
    addressLocality: "Madrid",
    addressRegion: "Madrid",
    postalCode: "28039",
    addressCountry: "ES",
  },
  areaServed: "Madrid",
  sameAs: ["https://instagram.com/verde_madrid"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${lilitaOne.variable} ${caveat.variable} ${spaceMono.variable} ${dmSans.variable} font-sans bg-cream text-ink antialiased`}>

        {/* Datos estructurados del negocio (dirección/teléfono para Google e IA) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />

        {/* Empezar siempre arriba: evita que un #hash de sección o la
            restauración de scroll del navegador salte al formulario al cargar. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if('scrollRestoration' in history){history.scrollRestoration='manual';}if(location.hash){history.replaceState(null,'',location.pathname+location.search);}}catch(e){}",
          }}
        />

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-[100] flex items-center justify-between px-8 h-[58px]"
          style={{
            background: "rgba(242,234,216,0.96)",
            backdropFilter: "blur(14px)",
            borderBottom: "1.5px solid rgba(44,90,27,0.13)",
          }}
        >
          <a href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
            <Image src="/iconVerde.png" alt="Verde" width={34} height={34} className="object-contain" />
            <span className="text-[0.68rem] tracking-[0.16em] uppercase text-gray">
              Madrid · Dark Kitchen
            </span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href={SOLD_OUT ? "/#carta" : "/#reservar"}
              className="text-[0.78rem] text-gray px-3 py-1.5 rounded-md border-none bg-transparent cursor-pointer hover:text-g1 transition-colors hidden sm:block"
            >
              Menú
            </a>
            <NavCart />
          </div>
        </nav>

        <main>
          {children}
          <ScrollAnimations />
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ background: "var(--g0, #1c3a10)" }} className="px-8 pt-12 pb-7">
          <div className="max-w-[900px] mx-auto flex justify-between items-start flex-wrap gap-8">

            <div>
              <Image src="/iconVerde.png" alt="Verde" width={40} height={40}
                className="opacity-85 mb-3"
              />
              <p className="text-[0.76rem] leading-relaxed max-w-[200px]"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Cocina ecuatoriana hecha con tiempo y técnica. Bajo pedido en Madrid.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <h4 className="text-[0.65rem] tracking-[0.16em] uppercase mb-3"
                  style={{ color: "rgba(255,255,255,0.55)" }}>
                  Contacto
                </h4>
                <p className="text-[0.78rem] leading-loose" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <a href="https://instagram.com/verde_madrid" target="_blank" rel="noopener"
                    className="text-g3 hover:text-g4 transition-colors">
                    @verde_madrid
                  </a><br />
                  <a href="https://wa.me/34605442809" target="_blank" rel="noopener"
                    className="text-g3 hover:text-g4 transition-colors">
                    WhatsApp · +34 605 442 809
                  </a><br />
                  Calle de la Araucaria 19<br />
                  Tetuán, 28039 Madrid
                </p>
              </div>
              <div>
                <h4 className="text-[0.65rem] tracking-[0.16em] uppercase mb-3"
                  style={{ color: "rgba(255,255,255,0.55)" }}>
                  Legal
                </h4>
                <p className="text-[0.78rem] leading-loose">
                  <a href="/politica-privacidad" className="text-g3 hover:text-g4 transition-colors">
                    Privacidad
                  </a><br />
                  <a href="/terminos" className="text-g3 hover:text-g4 transition-colors">
                    Términos
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-[900px] mx-auto mt-8 pt-5 text-center text-[0.68rem]"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.2)",
            }}>
            © {new Date().getFullYear()} Verde Madrid · Todos los derechos reservados
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
