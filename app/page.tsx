import { getAvailableProducts } from "@/lib/products";
import { getProductsRows, getSettings } from "@/lib/google-sheets";
import { storeConfig } from "@/lib/store-config";
import { getActivePromotion } from "@/lib/promotions";
import type { ActivePromotion } from "@/lib/promotions";
import HowItWorks from "@/components/HowItWorks";
import ReservationForm from "@/components/ReservationForm";
import ClosedState from "@/components/ClosedState";
import Packs from "@/components/Packs";
import CategoryBar from "@/components/CategoryBar";
import ZoneMap from "@/components/ZoneMap";
import FloatingCart from "@/components/FloatingCart";
import type { Product } from "@/lib/products";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: Product[] = getAvailableProducts();
  let reservationsOpen = storeConfig.reservationsOpen;
  let activePromotion: ActivePromotion | null = null;

  try {
    const [sheetsProducts, settings] = await Promise.all([
      getProductsRows(),
      getSettings(),
    ]);
    if (sheetsProducts.length > 0) {
      products = sheetsProducts.map((p) => ({
        id: p.productId,
        name: p.name,
        description: p.description,
        finalPrice: p.finalPrice,
        depositAmount: p.depositAmount,
        available: p.available,
        allergens: p.allergens,
        image: p.imageUrl || undefined,
        category: p.category || undefined,
      }));
    }
    reservationsOpen = settings.reservationsOpen;
    const promo = getActivePromotion(settings);
    if (promo.isActive) activePromotion = promo;
  } catch {
    // fallback to static config/products
  }

  const config = { ...storeConfig, reservationsOpen };

  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden w-full"
        style={{ minHeight: "92vh" }}
      >
        {/* Fondo con gradiente oscuro verde */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, #2d5a1b 0%, #1c3a10 55%, #0e1e08 100%)", position: "absolute", inset: 0 }}
        />
        {/* Textura grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />
        {/* Logo campesino watermark */}
        <div
          className="absolute right-[8%] bottom-0 h-[72%] pointer-events-none select-none"
          style={{ opacity: 0.12 }}
        >
          <Image
            src="/verdeart.png"
            alt=""
            width={400}
            height={600}
            className="h-full w-auto object-contain"
            style={{ filter: "brightness(10)" }}
            priority
          />
        </div>

        {/* Contenido */}
        <div className="relative z-10 text-center px-8 max-w-[680px] mx-auto w-full">
          {/* Eyebrow */}
          <span
            className="inline-block text-[0.68rem] tracking-[0.22em] uppercase mb-6 px-[14px] py-[5px] rounded-full"
            style={{
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Cocina ecuatoriana · Madrid
          </span>

          {/* Logo principal */}
          <div className="flex justify-center mb-6">
            <Image
              src="/iconVerde.png"
              alt="Verde"
              width={110}
              height={110}
              priority
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", opacity: 1 }}
            />
          </div>

          <p className="text-[0.7rem] tracking-[0.2em] uppercase mb-4" style={{color:"rgba(255,255,255,0.4)"}}>
            Hecha a mano · Exportación latina
          </p>

          {/* Headline */}
          <p
            className="font-serif mb-10 leading-relaxed"
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
              color: "rgba(255,255,255,0.7)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Del plátano verde a tu mesa.{" "}
            <strong
              style={{
                color: "rgba(255,255,255,0.95)",
                fontStyle: "normal",
                fontWeight: 600,
              }}
            >
              Pide hoy, recíbelo cuando quieras.
            </strong>
          </p>

          {/* CTAs */}
          <div className="flex gap-4 justify-center flex-wrap">
            {reservationsOpen ? (
              <>
                <a
                  href="#packs"
                  className="px-8 py-[14px] rounded-[10px] text-[0.9rem] font-medium tracking-[0.05em] text-white transition-all bg-[#c85a2a] shadow-terra hover:bg-[#d96535] hover:-translate-y-0.5"
                >
                  Ver ofertas del día
                </a>
                <a
                  href="#reservar"
                  className="px-7 py-[14px] rounded-[10px] text-[0.9rem] font-normal transition-all bg-white/[0.08] text-white/80 border border-white/[0.18] backdrop-blur-[4px] hover:bg-white/[0.14] hover:text-white"
                >
                  Ver la carta completa
                </a>
              </>
            ) : (
              <a
                href="#waitlist"
                className="px-10 py-[14px] rounded-[10px] text-[0.9rem] font-medium tracking-[0.05em] transition-all"
                style={{
                  background: "var(--gold)",
                  color: "var(--dark)",
                }}
              >
                Avisarme cuando abra
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.25)" }}
          aria-hidden="true"
        >
          <span className="text-[0.65rem] tracking-[0.15em] uppercase">scroll</span>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
        </div>
      </section>

      {/* ── PACKS ── */}
      {reservationsOpen && (
        <section id="packs">
          <Packs />
        </section>
      )}

      {/* ── CÓMO FUNCIONA ── */}
      <HowItWorks />

      {/* ── BARRA DE CATEGORÍAS ── */}
      {reservationsOpen && <CategoryBar />}

      {/* ── MENÚ / RESERVA ── */}
      {reservationsOpen ? (
        <section className="bg-cream py-2" id="reservar">
          <ReservationForm
            products={products}
            config={config}
            promotion={activePromotion}
          />
        </section>
      ) : (
        <ClosedState message={storeConfig.closedMessage} />
      )}

      {/* ── ZONA DE REPARTO ── */}
      <ZoneMap />

      {/* ── CARRITO FLOTANTE ── */}
      <FloatingCart />
    </>
  );
}
