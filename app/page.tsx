import { getAvailableProducts, getPacks } from "@/lib/products";
import { getProductsRows, getSettings } from "@/lib/google-sheets";
import { storeConfig, SOLD_OUT } from "@/lib/store-config";
import { getLaunchPhase, EARLY_ACCESS_CODE, PUBLIC_OPEN_AT } from "@/lib/launch";
import LaunchBanner from "@/components/LaunchBanner";
import Countdown from "@/components/Countdown";
import { getActivePromotion } from "@/lib/promotions";
import type { ActivePromotion } from "@/lib/promotions";
import HowItWorks from "@/components/HowItWorks";
import ReservationForm from "@/components/ReservationForm";
import ClosedState from "@/components/ClosedState";
import MenuShowcase from "@/components/MenuShowcase";
import Packs from "@/components/Packs";
import CategoryBar from "@/components/CategoryBar";
import ZoneMap from "@/components/ZoneMap";
import Reviews from "@/components/Reviews";
import ContactHelp from "@/components/ContactHelp";
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
        isPack: (p.category || "").trim().toLowerCase() === "pack",
      }));
    }
    reservationsOpen = settings.reservationsOpen;
    const promo = getActivePromotion(settings);
    if (promo.isActive) activePromotion = promo;
  } catch {
    // fallback to static config/products
  }

  // SOLD OUT general (cierre del mes) — anula cualquier valor del Sheet.
  if (SOLD_OUT) reservationsOpen = false;

  const launchPhase = getLaunchPhase();
  const config = { ...storeConfig, reservationsOpen };

  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden w-full"
        style={{ minHeight: "92vh" }}
      >
        {/* Fondo con imagen */}
        <Image src="/Fondo_Home.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0)" }} />
        {/* Textura grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />
        {/* Contenido */}
        <div className="relative z-10 text-center px-8 max-w-[680px] mx-auto w-full">
          {/* Eyebrow */}
          <span
            className="inline-block font-mono text-[0.68rem] tracking-[0.22em] uppercase mb-6 px-[14px] py-[5px] rounded-full"
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

          <p className="font-caveat text-[1.4rem] leading-tight mb-10" style={{color:"rgba(255,255,255,0.7)"}}>
            Hecha a mano · Exportación latina
          </p>

          {/* Countdown a la apertura al público (solo en fase de lista) */}
          {reservationsOpen && launchPhase === "early_access" && (
            <div className="mb-10">
              <Countdown
                target={PUBLIC_OPEN_AT}
                label="Abrimos al público en"
                finishedLabel="¡Ya estamos abiertos! 🌱"
                variant="hero"
              />
            </div>
          )}

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
          <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">scroll</span>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
        </div>
      </section>

      {/* ── BANNER DE GRACIAS + FASES DE APERTURA ── */}
      {reservationsOpen && <LaunchBanner phase={launchPhase} />}

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
        <section className="bg-cream2 py-2" id="reservar">
          <ReservationForm
            products={[
              ...products,
              ...getPacks().filter((pk) => !products.some((p) => p.id === pk.id)),
            ]}
            config={config}
            promotion={activePromotion}
            requireAccessCode={launchPhase === "early_access"}
            accessCodeValue={
              launchPhase === "early_access" ? EARLY_ACCESS_CODE : ""
            }
          />
        </section>
      ) : (
        <>
          <ClosedState message={storeConfig.closedMessage} />
          <MenuShowcase products={products} />
          <Packs readOnly />
        </>
      )}

      {/* ── RESEÑAS ── */}
      <Reviews />

      {/* ── ZONA DE REPARTO ── */}
      <ZoneMap />

      {/* ── ATENCIÓN AL CLIENTE ── */}
      <ContactHelp variant="section" />

      {/* ── CARRITO FLOTANTE ── */}
      <FloatingCart />
    </>
  );
}
