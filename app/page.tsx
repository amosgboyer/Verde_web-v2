import Image from "next/image";
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pb-16 text-center">
        <Image src="/Fondo_Home.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0" style={{ background: "rgba(26,26,14,0.35)" }} />

        <div className="relative z-10 max-w-xs mx-auto flex flex-col items-center pt-16">
          <p className="animate-fade-in text-[10px] font-medium tracking-[0.45em] uppercase mb-4" style={{ color: "rgba(245,240,232,0.6)" }}>
            Madrid · Dark Kitchen
          </p>
          <div className="animate-fade-in animation-delay-100 flex justify-center mb-5">
            <Image src="/iconVerde.png" alt="Verde" width={180} height={180} priority />
          </div>
          <p className="animate-fade-in animation-delay-200 text-base font-normal leading-snug mb-1" style={{ color: "#f2ead8" }}>
            Del plátano verde a tu mesa.
          </p>
          <p className="animate-fade-in animation-delay-200 text-sm mb-7" style={{ color: "rgba(245,240,232,0.65)" }}>
            Pide con antelación y recíbelo el día que elijas.
          </p>
          <div className="animate-fade-in animation-delay-300 w-full flex flex-col gap-3">
            {reservationsOpen ? (
              <>
                <a href="#packs"
                  className="inline-block w-full text-[11px] font-bold tracking-[0.25em] uppercase px-10 py-4 transition-all duration-300 shadow-lg bg-[#c85a2a] hover:bg-[#d96535]"
                  style={{ color: "#f2ead8" }}
                >
                  Ver ofertas del día
                </a>
                <a href="#reservar"
                  className="inline-block w-full text-[11px] font-bold tracking-[0.25em] uppercase px-10 py-4 transition-all duration-300 shadow-lg"
                  style={{ background: "#f2ead8", color: "#2d5a1b" }}
                >
                  Hacer mi pedido
                </a>
              </>
            ) : (
              <a href="#waitlist"
                className="inline-block w-full text-[11px] font-bold tracking-[0.25em] uppercase px-10 py-5 transition-all duration-300 shadow-lg"
                style={{ background: "#c8960a", color: "#1a1a0e" }}
              >
                Avisarme cuando abra
              </a>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10" style={{ color: "rgba(245,240,232,0.3)" }} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
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
        <section className="bg-crema py-2" id="reservar">
          <ReservationForm products={products} config={config} promotion={activePromotion} />
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
