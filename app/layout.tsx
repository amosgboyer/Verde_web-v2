import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${dmSans.variable} font-sans bg-cream text-ink antialiased`}>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-[100] flex items-center justify-between px-8 h-[58px]"
          style={{
            background: "rgba(242,234,216,0.96)",
            backdropFilter: "blur(14px)",
            borderBottom: "1.5px solid rgba(44,90,27,0.13)",
          }}
        >
          <a href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
            <Image src="/verdeart.png" alt="Verde" width={34} height={34} className="object-contain" />
            <span className="text-[0.68rem] tracking-[0.16em] uppercase text-gray hidden sm:block">
              Madrid · Dark Kitchen
            </span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="#reservar"
              className="text-[0.78rem] text-gray px-3 py-1.5 rounded-md border-none bg-transparent cursor-pointer hover:text-g1 transition-colors hidden sm:block"
            >
              Menú
            </a>
            <a
              href="/#reservar"
              className="text-[0.8rem] font-medium tracking-[0.03em] px-[18px] py-2 rounded-lg text-cream bg-g1 hover:bg-g0 transition-colors"
              style={{ transition: "background .18s, transform .1s" }}
            >
              Pedir
            </a>
          </div>
        </nav>

        <main>{children}</main>

        {/* ── FOOTER ── */}
        <footer style={{ background: "var(--g0, #1c3a10)" }} className="px-8 pt-12 pb-7">
          <div className="max-w-[900px] mx-auto flex justify-between items-start flex-wrap gap-8">

            <div>
              <Image src="/Verde.png" alt="Verde" width={40} height={40}
                className="opacity-85 mb-3"
                style={{ filter: "brightness(0) invert(1)" }}
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
                  Guindalera, Madrid<br />
                  28028
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

      </body>
    </html>
  );
}
