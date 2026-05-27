import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arimo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verde — Bolones bajo pedido",
  description:
    "Reserva tus bolones hechos a mano. Preventa semanal con entrega el fin de semana.",
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
      <body
        className={`${arimo.variable} font-sans bg-crema text-negro antialiased`}
      >
        <header className="border-b border-negro/8 px-6 py-2.5 bg-crema/90 backdrop-blur-md fixed inset-x-0 top-0 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="opacity-90 hover:opacity-100 transition-opacity duration-200">
              <Image
                src="/verdeart.png"
                alt="Verde"
                width={52}
                height={52}
              />
            </a>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-medium text-negro/35 uppercase tracking-[0.3em] hidden sm:block">
                Madrid · Dark Kitchen
              </span>
              <a
                href="/#reservar"
                className="bg-verde-bosque text-crema text-[10px] font-semibold tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-verde-platano transition-colors duration-200"
              >
                Pedir
              </a>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-negro text-crema px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 mb-10 pb-10 border-b border-crema/10">
              <div className="flex items-center gap-3">
                <Image
                  src="/Verde.png"
                  alt="Verde"
                  width={40}
                  height={40}
                  className="opacity-80"
                />
                <div>
                  <p className="text-2xl font-bold text-crema tracking-tight mb-0.5">Verde</p>
                  <p className="text-crema/35 text-[10px] font-medium tracking-[0.3em] uppercase">
                    Madrid · Dark Kitchen
                  </p>
                </div>
              </div>
              <p className="text-crema/35 text-xs leading-relaxed text-right max-w-[200px]">
                Recibe tu verde en el día que tu elijas.
              </p>
            </div>
            <p className="text-crema/20 text-[10px] uppercase tracking-widest">
              © {new Date().getFullYear()} Verde · Todos los derechos reservados
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
