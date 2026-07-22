"use client";

import { useState, useEffect, useRef } from "react";
import type { Product } from "@/lib/products";
import { imageForProduct } from "@/lib/products";
import type { StoreConfig } from "@/lib/store-config";
import { PICKUP_ADDRESS, PICKUP_MAPS_URL } from "@/lib/store-config";
import type { ActivePromotion } from "@/lib/promotions";
import type { WeekendOffer } from "@/lib/offers";
import { computeOfferDiscount, productMatchesOffer } from "@/lib/offers";
import { quoteDelivery } from "@/lib/delivery";
import ProductCard, { type SizeOption } from "./ProductCard";
import AccessGate from "./AccessGate";
import DrinkUpsellModal from "./DrinkUpsellModal";
import clsx from "clsx";

interface DeliveryInfo {
  deliverable: boolean;
  zone: number | null;
  fee: number;
}

interface TimeSlot {
  time: string;
  status: "available" | "sold_out";
  remaining: number;
}

interface DayAvailability {
  date: string;
  status: "available" | "sold_out" | "closed" | "past_or_today";
  note: string;
  slots: TimeSlot[];
}

interface ReservationFormProps {
  products: Product[];
  config: StoreConfig;
  promotion?: ActivePromotion | null;
  weekendOffer?: WeekendOffer | null;
  requireAccessCode?: boolean;
  accessCodeValue?: string;
}

interface FormFields {
  reservationDate: string;
  reservationTime: string;
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  deliveryMethod: "delivery" | "pickup";
  deliveryAddress: string;
  deliveryDetails: string;
  postalCode: string;
  deliveryZone: string;
}

const INITIAL_FIELDS: FormFields = {
  reservationDate: "",
  reservationTime: "",
  customerName: "",
  email: "",
  phone: "",
  notes: "",
  deliveryMethod: "delivery",
  deliveryAddress: "",
  deliveryDetails: "",
  postalCode: "",
  deliveryZone: "",
};

const STORAGE_KEY = "verde_customer_data";

const inputClass =
  "w-full border-0 border-b border-negro/15 bg-transparent px-0 py-2.5 text-sm text-negro placeholder:text-negro/28 focus:outline-none focus:border-verde-bosque transition-colors duration-200";

const labelClass =
  "block text-[10px] font-medium uppercase tracking-[0.2em] text-negro/40 mb-2";

// Returns 0=Mon ... 6=Sun
function dayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

function formatMonthTitle(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(
    "es-ES",
    { month: "long", year: "numeric" }
  );
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

// ─── Category helpers ───────────────────────────────────────────────────────

// Precio en formato español: entero "10", decimal "2,20".
function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

type NormalizedCategory = "Verde" | "Maduro" | "Otros" | "Bebidas";

function normalizeCategory(raw: string): NormalizedCategory {
  const lower = (raw ?? "").trim().toLowerCase();
  if (lower === "verde") return "Verde";
  if (lower === "maduro") return "Maduro";
  if (
    lower === "bebida" ||
    lower === "bebidas" ||
    lower === "drink" ||
    lower === "drinks"
  )
    return "Bebidas";
  return "Otros";
}

const CATEGORY_ORDER: NormalizedCategory[] = ["Verde", "Maduro", "Otros", "Bebidas"];

const CATEGORY_CONFIG: Record<NormalizedCategory, { title: string; subtitle: string }> = {
  Verde: {
    title: "VERDE Y SOLO VERDE",
    subtitle: "Herencia cultural y vínculo con la tierra.",
  },
  Maduro: {
    title: "PARA LOS AMANTES DEL MADURO",
    subtitle: "Una versión más dulce, intensa y contundente.",
  },
  Otros: {
    title: "OTROS PRODUCTOS",
    subtitle: "Más opciones disponibles por reserva.",
  },
  Bebidas: {
    title: "BEBIDAS",
    subtitle: "Para acompañar y refrescar. 🥤",
  },
};

// ─── Variantes de tamaño ─────────────────────────────────────────────────────
// Un producto "base" con opciones de tamaño que en realidad son otros productos
// de la carta (mismo id/precio del Sheet). La variante NO se muestra como card
// propia: aparece como selector dentro de la card del base (p.ej. media ración).
const SIZE_VARIANT_GROUPS: { baseId: string; options: { label: string; id: string }[] }[] = [
  {
    baseId: "tigrillo-mixto",
    options: [
      { label: "Entera", id: "tigrillo-mixto" },
      { label: "Media", id: "tigrillo-media-racion" },
    ],
  },
];

// ─── Extras de plato ─────────────────────────────────────────────────────────
// Productos que se ofrecen como "extra" dentro de la card de otro plato (no como
// card propia en la carta). Cada extra es un producto real del Sheet (mismo
// id/precio). P.ej. el reahogado solo pega con el corviche.
const PRODUCT_ADDONS: { baseId: string; addons: { label: string; id: string }[] }[] = [
  {
    baseId: "corviche-de-pescado",
    addons: [{ label: "Reahogado de pescado", id: "Reahogado-de-pescado" }],
  },
];

// ─── StepSection ───────────────────────────────────────────────────────────
// Renders a step row: collapsed summary when not active, full content when active.

interface StepSectionProps {
  stepRef: React.RefObject<HTMLDivElement>;
  number: number;
  title: string;
  isActive: boolean;
  isDone: boolean;
  summary: string;
  onEdit: () => void;
  showEditButton?: boolean;
  editLabel?: string;
  editProminent?: boolean;
  children: React.ReactNode;
}

function StepSection({
  stepRef,
  number,
  title,
  isActive,
  isDone,
  summary,
  onEdit,
  showEditButton = true,
  editLabel = "Cambiar",
  editProminent = false,
  children,
}: StepSectionProps) {
  return (
    <div ref={stepRef} className="border-t border-negro/8 pt-8 mt-8 scroll-mt-24">
      {/* Header row */}
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="bg-verde-bosque text-crema rounded-full w-7 h-7 shrink-0 flex items-center justify-center text-xs font-bold">
            {isDone ? "✓" : number}
          </span>

          <span className="text-verde-bosque font-semibold text-base shrink-0">
            {title}
          </span>

          {/* Inline summary — hidden on very small screens */}
          {!isActive && summary && (
            <span className="text-xs text-negro/40 truncate hidden sm:inline ml-1">
              — {summary}
            </span>
          )}
        </div>

        {!isActive && showEditButton && (
          <button
            type="button"
            onClick={onEdit}
            className={
              editProminent
                ? "ml-4 shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-crema bg-verde-bosque hover:bg-verde-platano transition-colors duration-150 rounded-full px-3 py-1.5"
                : "ml-4 shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-verde-bosque/60 hover:text-verde-bosque transition-colors duration-150 border-b border-verde-bosque/20 hover:border-verde-bosque pb-px"
            }
          >
            {editLabel}
          </button>
        )}
      </div>

      {/* Mobile summary line */}
      {!isActive && summary && (
        <p className="sm:hidden text-xs text-negro/40 pb-4 -mt-2 pl-9 leading-snug">
          {summary}
        </p>
      )}

      {/* Expandable content */}
      {isActive && (
        <div className="pb-8 animate-step-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ReservationForm ────────────────────────────────────────────────────────

export default function ReservationForm({
  products,
  config,
  promotion,
  weekendOffer = null,
  requireAccessCode = false,
  accessCodeValue = "",
}: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  // Popup de bebidas al terminar de elegir la comida (una vez por sesión).
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [drinkModalSeen, setDrinkModalSeen] = useState(false);
  useEffect(() => {
    function onAddPack(e: Event) {
      const { items } = (e as CustomEvent<{items:{id:string,qty:number}[]}>).detail;
      setCart(prev => {
        const next = {...prev};
        items.forEach(({id, qty}) => { next[id] = (next[id] ?? 0) + qty; });
        return next;
      });
      // Llevar al formulario pero SIN colapsar la carta, por si quiere añadir más
      goToStep(1);
    }
    window.addEventListener('verde:add-pack', onAddPack);
    return () => window.removeEventListener('verde:add-pack', onAddPack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coste de envío calculado en el comprobador de zonas → se sincroniza aquí
  useEffect(() => {
    function onDelivery(e: Event) {
      const d = (e as CustomEvent<DeliveryInfo & { address?: string }>).detail;
      setDelivery({ deliverable: d.deliverable, zone: d.zone, fee: d.fee });
      setDeliveryError(null);
      setFields((prev) =>
        d.address && !prev.deliveryAddress
          ? { ...prev, deliveryAddress: d.address }
          : prev
      );
    }
    window.addEventListener('verde:delivery:update', onDelivery);
    return () => window.removeEventListener('verde:delivery:update', onDelivery);
  }, []);
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [saveData, setSaveData] = useState(false);
  const [savedDataDetected, setSavedDataDetected] = useState(false);
  const [livePromotion, setLivePromotion] = useState<ActivePromotion | null>(promotion ?? null);
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [unlocked, setUnlocked] = useState(!requireAccessCode);

  // Recordar desbloqueo entre recargas + escuchar el gate de arriba (banner)
  useEffect(() => {
    if (!requireAccessCode) return;
    if (typeof window === "undefined") return;
    function applyUnlock() {
      const saved = localStorage.getItem("verde_access_code") ?? "";
      setAccessCode(saved);
      setUnlocked(true);
    }
    if (localStorage.getItem("verde_access_unlocked") === "1") applyUnlock();
    window.addEventListener("verde:access:unlocked", applyUnlock);
    return () =>
      window.removeEventListener("verde:access:unlocked", applyUnlock);
  }, [requireAccessCode]);

  function handleUnlock() {
    const clean = accessCodeValue.replace(/\s+/g, "");
    setAccessCode(clean);
    setUnlocked(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("verde_access_unlocked", "1");
      localStorage.setItem("verde_access_code", clean);
    }
  }

  // Individual refs — hooks cannot be in arrays
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);
  const ref5 = useRef<HTMLDivElement>(null);
  const ref6 = useRef<HTMLDivElement>(null);
  const stepRefs = [ref1, ref2, ref3, ref4, ref5, ref6];

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => setAvailability(Array.isArray(data) ? data : []))
      .catch(() => setAvailability([]))
      .finally(() => setLoadingAvailability(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setSavedDataDetected(true);
      setFields((prev) => ({
        ...prev,
        customerName: saved.customerName || prev.customerName,
        email: saved.email || prev.email,
        phone: saved.phone || prev.phone,
        deliveryAddress: saved.deliveryAddress || prev.deliveryAddress,
        deliveryDetails: saved.deliveryDetails || prev.deliveryDetails,
        postalCode: saved.postalCode || prev.postalCode,
        deliveryZone: saved.deliveryZone || prev.deliveryZone,
        deliveryMethod: saved.deliveryMethod || prev.deliveryMethod,
      }));
    } catch {
      // ignore malformed stored data
    }
  }, []);

  useEffect(() => {
    fetch("/api/promotion")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setLivePromotion(
            data.isActive
              ? { isActive: true, promoName: data.promoName, promoType: "percentage" as const, promoValue: Number(data.promoValue) }
              : null
          );
        }
      })
      .catch(() => {});
  }, []);

  function goToStep(step: number) {
    setCurrentStep(step);
    setMaxStep((prev) => Math.max(prev, step));
    setTimeout(() => {
      stepRefs[step - 1]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  }

  // ── Cart ──

  // Future: support multi-product cart
  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: 1 }));
    setError(null);
  }

  function increment(productId: string) {
    setCart((prev) => {
      const cur = prev[productId] ?? 0;
      if (cur >= config.maxQuantityPerOrder) return prev;
      return { ...prev, [productId]: cur + 1 };
    });
  }

  function decrement(productId: string) {
    setCart((prev) => {
      const cur = prev[productId] ?? 0;
      if (cur <= 1) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: cur - 1 };
    });
  }

  function removeItem(productId: string) {
    setCart((prev) => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  }

  // Calcula el envío a partir de la dirección introducida en el paso de entrega
  async function calcDelivery(): Promise<{
    deliverable: boolean;
    zone: number | null;
    fee: number;
  } | null> {
    const query = [fields.deliveryAddress, fields.postalCode].filter(Boolean).join(", ");
    if (query.trim().length < 4) {
      setDeliveryError("Introduce tu dirección para calcular el envío.");
      return null;
    }
    setDeliveryLoading(true);
    setDeliveryError(null);
    try {
      const quote = await quoteDelivery(query);
      if (!quote) {
        setDeliveryError("No encontramos esa dirección. Prueba con calle + número.");
        setDelivery(null);
        return null;
      } else if (!quote.deliverable) {
        const d = { deliverable: false, zone: null, fee: 0 };
        setDelivery(d);
        setDeliveryError("Aún no llegamos a tu zona. Te contactaremos por WhatsApp.");
        return d;
      } else {
        const d = { deliverable: true, zone: quote.zone, fee: quote.fee };
        setDelivery(d);
        return d;
      }
    } catch {
      setDeliveryError("Error al calcular el envío. Inténtalo de nuevo.");
      return null;
    } finally {
      setDeliveryLoading(false);
    }
  }

  // Avanzar al pago: si es entrega y no se ha calculado el envío, se calcula
  // automáticamente aquí (el cliente no tiene que pulsar "Calcular envío").
  async function continueFromDelivery() {
    if (fields.deliveryMethod === "pickup") {
      goToStep(6);
      return;
    }
    if (delivery?.deliverable) {
      goToStep(6);
      return;
    }
    const r = await calcDelivery();
    if (r?.deliverable) goToStep(6);
    // Si no es entregable o no se pudo geolocalizar, calcDelivery ya muestra el
    // aviso y NO avanzamos (debe ajustar la dirección o elegir recogida).
  }

  // ── Fields ──

  function handleFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    // Si cambian la dirección o el CP, invalidar el cálculo de envío anterior
    // para obligar a recalcular (no se puede pagar con un envío sin recalcular).
    if (e.target.name === "deliveryAddress" || e.target.name === "postalCode") {
      setDelivery(null);
    }
  }

  function selectDate(date: string) {
    // Clearing time — slots are specific to each date
    setFields((prev) => ({ ...prev, reservationDate: date, reservationTime: "" }));
    setError(null);
  }

  function selectTime(time: string) {
    setFields((prev) => ({ ...prev, reservationTime: time }));
    setError(null);
  }

  function clearSavedData() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedDataDetected(false);
    setSaveData(false);
    setFields((prev) => ({
      ...prev,
      customerName: "",
      email: "",
      phone: "",
      deliveryAddress: "",
      deliveryDetails: "",
      postalCode: "",
      deliveryZone: "",
      deliveryMethod: "delivery",
    }));
  }

  // ── Derived values (unchanged from original) ──

  const selectedDay = availability.find((d) => d.date === fields.reservationDate);

  const cartProducts = products.filter((p) => (cart[p.id] ?? 0) > 0);
  // Bebidas (para el empujón "¿Algo para beber?" antes de pagar)
  const drinkProducts = products.filter(
    (p) => !p.isPack && normalizeCategory(p.category ?? "") === "Bebidas"
  );
  const hasDrinkInCart = drinkProducts.some((d) => (cart[d.id] ?? 0) > 0);

  // Ofrecemos bebida en un popup (una sola vez) cuando el cliente va hacia el
  // pago con productos en el carrito pero aún sin bebida. Se dispara en dos
  // momentos: al pulsar "Continuar con la fecha" o al abrir el banner del carrito.
  const canOfferDrinks =
    cartProducts.length > 0 &&
    drinkProducts.length > 0 &&
    !hasDrinkInCart &&
    !drinkModalSeen;

  function continueFromMenu() {
    if (canOfferDrinks) {
      setShowDrinkModal(true);
      return;
    }
    goToStep(2);
  }

  function dismissDrinkModal() {
    setDrinkModalSeen(true);
    setShowDrinkModal(false);
    // Tras cerrar, avanzar al primer paso pendiente (nunca hacia atrás).
    if (!step2Done) goToStep(2);
    else if (!step3Done) goToStep(3);
    else if (!step4Done) goToStep(4);
    else if (!step5Done) goToStep(5);
    else goToStep(6);
  }

  const totalItems = cartProducts.reduce((s, p) => s + (cart[p.id] ?? 0), 0);
  const totalDeposit = cartProducts.reduce(
    (s, p) => s + p.depositAmount * (cart[p.id] ?? 0),
    0
  );
  const totalFinal = cartProducts.reduce(
    (s, p) => s + p.finalPrice * (cart[p.id] ?? 0),
    0
  );
  const totalPending = totalFinal - totalDeposit;

  // Discount — visual estimate only; backend is always source of truth
  const subtotalCents = Math.round(totalDeposit * 100);
  const discountCents =
    livePromotion?.isActive && totalDeposit > 0
      ? Math.round(subtotalCents * livePromotion.promoValue / 100)
      : 0;
  const discountAmount = discountCents / 100;

  // Oferta de fin de semana (Sweet Weekend) — estimación visual; el servidor
  // recalcula el importe real en el checkout.
  const offerResult =
    weekendOffer
      ? computeOfferDiscount(
          weekendOffer,
          cartProducts.map((p) => ({
            productId: p.id,
            productName: p.name,
            quantity: cart[p.id] ?? 0,
            unitPrice: p.depositAmount,
          }))
        )
      : { discountAmount: 0, discountedUnits: 0 };
  const offerDiscount = offerResult.discountAmount;

  // Descuento combinado (promo global + oferta finde), nunca mayor que el subtotal.
  const combinedDiscount = Math.min(totalDeposit, discountAmount + offerDiscount);
  const totalAfterDiscount = totalDeposit - combinedDiscount;

  // Envío — solo aplica con método "delivery" y zona cubierta
  const effectiveDeliveryFee =
    fields.deliveryMethod === "delivery" && delivery?.deliverable ? delivery.fee : 0;
  const grandTotal = totalAfterDiscount + effectiveDeliveryFee;

  // Carrito flotante — productos + envío
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('verde:cart:update', {
      detail: { items: totalItems, total: totalDeposit + effectiveDeliveryFee },
    }));
  }, [totalItems, totalDeposit, effectiveDeliveryFee]);

  const monthMap: Record<string, DayAvailability[]> = {};
  for (const day of availability) {
    if (day.status === "past_or_today") continue;
    const mk = day.date.slice(0, 7);
    if (!monthMap[mk]) monthMap[mk] = [];
    monthMap[mk].push(day);
  }
  const monthKeys = Object.keys(monthMap).sort();

  // Step completion flags
  const step1Done = cartProducts.length > 0;
  const step2Done = !!fields.reservationDate;
  const step3Done = !!fields.reservationTime;
  const step4Done = !!(
    fields.customerName.trim() &&
    fields.email.trim() &&
    fields.phone.trim()
  );
  const step5Done =
    fields.deliveryMethod === "pickup" ||
    !!(fields.deliveryAddress.trim().length >= 5 && fields.postalCode.trim());

  // Carrito flotante → primero ofrecer bebida (una vez); si no procede, avanzar
  // al primer paso pendiente hacia el pago.
  useEffect(() => {
    function onCartOpen() {
      if (canOfferDrinks) {
        setShowDrinkModal(true);
        return;
      }
      if (!step1Done) goToStep(1);
      else if (!step2Done) goToStep(2);
      else if (!step3Done) goToStep(3);
      else if (!step4Done) goToStep(4);
      else if (!step5Done) goToStep(5);
      else goToStep(6);
    }
    window.addEventListener("verde:cart:open", onCartOpen);
    return () => window.removeEventListener("verde:cart:open", onCartOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1Done, step2Done, step3Done, step4Done, step5Done, canOfferDrinks]);

  // Recalcular animaciones GSAP cuando cambia el alto (al colapsar/expandir pasos)
  useEffect(() => {
    const t = setTimeout(
      () => window.dispatchEvent(new Event("verde:layout:changed")),
      120
    );
    return () => clearTimeout(t);
  }, [currentStep, maxStep]);

  // ── Submit (logic unchanged — same payload to /api/create-checkout-session) ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (cartProducts.length === 0) {
      setError("Elige un producto para continuar.");
      goToStep(1);
      return;
    }
    if (!fields.reservationDate) {
      setError("Elige el día de tu reserva.");
      goToStep(2);
      return;
    }
    if (!fields.reservationTime) {
      setError("Elige una hora disponible.");
      goToStep(3);
      return;
    }
    if (!fields.customerName.trim() || !fields.email.trim() || !fields.phone.trim()) {
      setError("Completa tus datos para continuar.");
      goToStep(4);
      return;
    }
    if (fields.deliveryMethod === "delivery") {
      if (!fields.deliveryAddress || fields.deliveryAddress.trim().length < 5) {
        setError("Agrega la dirección de entrega.");
        goToStep(5);
        return;
      }
      if (!fields.postalCode.trim()) {
        setError("El código postal es obligatorio.");
        goToStep(5);
        return;
      }
      // El envío se calcula al pulsar "Ver resumen y pagar" (continueFromDelivery).
      // Este guard solo salta si se llega sin cálculo: vuelve al paso de envío.
      if (!delivery) {
        setError("Revisa tu dirección de envío en el paso anterior.");
        goToStep(5);
        return;
      }
      if (!delivery.deliverable) {
        setError("Aún no llegamos a tu zona. Elige recogida en local o prueba otra dirección.");
        goToStep(5);
        return;
      }
    }

    if (requireAccessCode && !accessCode.trim()) {
      setError("Introduce tu código de acceso anticipado (lista de espera) para reservar.");
      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      setError("Debes aceptar la política de privacidad y las condiciones para continuar.");
      return;
    }

    if (saveData && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          customerName: fields.customerName,
          email: fields.email,
          phone: fields.phone,
          deliveryAddress: fields.deliveryAddress,
          deliveryDetails: fields.deliveryDetails,
          postalCode: fields.postalCode,
          deliveryZone: fields.deliveryZone,
          deliveryMethod: fields.deliveryMethod,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // ignore storage errors
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartProducts.map((p) => ({ productId: p.id, quantity: cart[p.id] })),
          reservationDate: fields.reservationDate,
          reservationTime: fields.reservationTime,
          customerName: fields.customerName,
          email: fields.email,
          phone: fields.phone,
          notes: fields.notes,
          deliveryMethod: fields.deliveryMethod,
          deliveryAddress: fields.deliveryAddress,
          deliveryDetails: fields.deliveryDetails,
          postalCode: fields.postalCode,
          deliveryZone: fields.deliveryZone,
          deliveryZoneLevel:
            fields.deliveryMethod === "delivery" && delivery?.deliverable
              ? delivery.zone
              : null,
          privacyAccepted,
          termsAccepted,
          accessCode: requireAccessCode ? accessCode.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("Ese horario acaba de agotarse. Elige otro horario disponible.");
          setFields((prev) => ({ ...prev, reservationTime: "" }));
          fetch("/api/availability")
            .then((r) => r.json())
            .then((d) => setAvailability(Array.isArray(d) ? d : []));
          goToStep(3);
        } else {
          setError(data.error ?? "Error al crear la reserva. Inténtalo de nuevo.");
        }
        return;
      }

      if (data.url) window.location.href = data.url;
    } catch {
      setError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Calendar (extracted to avoid repetition) ──

  function renderCalendar() {
    if (loadingAvailability) {
      return (
        <div className="flex items-center gap-2 text-negro/30 text-sm py-4">
          <span className="w-4 h-4 border border-negro/20 border-t-negro/50 rounded-full animate-spin" />
          Cargando disponibilidad...
        </div>
      );
    }
    if (monthKeys.length === 0) {
      return (
        <p className="text-negro/40 text-sm py-4">
          No hay fechas disponibles en este momento.
        </p>
      );
    }
    return (
      <div className="max-w-sm">
        {monthKeys.map((mk) => {
          const daysInGroup = monthMap[mk];
          const dateMap: Record<string, DayAvailability> = {};
          for (const d of daysInGroup) dateMap[d.date] = d;

          const [y, m] = mk.split("-").map(Number);
          const daysInMonth = new Date(y, m, 0).getDate();
          const firstDow = dayOfWeek(`${mk}-01`);

          return (
            <div key={mk} className="mb-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-negro/40 mb-2 capitalize">
                {formatMonthTitle(mk)}
              </p>
              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[9px] font-medium text-negro/25 uppercase tracking-wider py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-9" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${mk}-${String(dayNum).padStart(2, "0")}`;
                  const dayData = dateMap[dateStr];
                  const isSelected = fields.reservationDate === dateStr;

                  if (!dayData) {
                    return (
                      <div
                        key={dateStr}
                        className="h-9 flex items-center justify-center opacity-15"
                      >
                        <span className="text-xs text-negro">{dayNum}</span>
                      </div>
                    );
                  }

                  const isAvail = dayData.status === "available";
                  const isSoldOut = dayData.status === "sold_out";

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => selectDate(dateStr)}
                      className={clsx(
                        "h-9 w-full flex flex-col items-center justify-center text-xs transition-all duration-150",
                        isSelected && "bg-verde-bosque text-crema font-semibold",
                        isAvail &&
                          !isSelected &&
                          "border border-verde-bosque/25 text-verde-bosque hover:bg-verde-bosque/10",
                        isSoldOut && "opacity-35 cursor-not-allowed text-negro/50",
                        dayData.status === "closed" &&
                          "opacity-20 cursor-not-allowed text-negro/30"
                      )}
                    >
                      <span>{dayNum}</span>
                      {isSoldOut && (
                        <span className="hidden sm:block text-[7px] leading-tight uppercase tracking-wide">
                          sold
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render ──

  return (
    <section className="py-20 px-6" id="reservar">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <p className="text-[#c85a2a]/70 text-[10px] font-medium tracking-[0.4em] uppercase mb-3">
            Tu pedido
          </p>
          <h2 className="text-verde-bosque text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Haz tu pedido
          </h2>
          <p className="text-negro/50 text-sm leading-relaxed">
            Añade uno o varios productos y paga online de forma segura.
          </p>
          {livePromotion?.isActive && (
            <div className="mt-4 inline-flex items-center gap-2 border border-[#c85a2a]/20 bg-[#c85a2a]/5 px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-verde-platano shrink-0" />
              <p className="text-[11px] font-medium text-[#c85a2a]/80">
                {livePromotion.promoName}: {livePromotion.promoValue}% de descuento esta semana
              </p>
            </div>
          )}

          {weekendOffer && (
            <div
              className="mt-4 rounded-xl px-4 py-3 max-w-md"
              style={{
                background:
                  "linear-gradient(100deg, rgba(200,90,42,0.14), rgba(217,164,65,0.16))",
                border: "1px solid rgba(200,90,42,0.28)",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[13px] text-[#a8451f] tracking-tight">
                  {weekendOffer.name}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white bg-[#c85a2a] rounded-full px-2 py-0.5 shrink-0">
                  Solo este finde
                </span>
              </div>
              <p className="text-[12px] text-negro/60 leading-snug mt-0.5">
                {weekendOffer.tagline}. Añade 2 y la 2ª te sale a mitad de precio.
              </p>
            </div>
          )}
        </div>

        {requireAccessCode && !unlocked && (
          <AccessGate code={accessCodeValue} onUnlock={handleUnlock} />
        )}

        {(!requireAccessCode || unlocked) && (
        <form onSubmit={handleSubmit} noValidate>

          {/* ── PASO 1: PRODUCTO ── */}
          <StepSection
            stepRef={ref1}
            number={1}
            title="Elige tu producto"
            isActive={currentStep === 1}
            isDone={currentStep > 1}
            summary={cartProducts.map((p) => `${p.name} ×${cart[p.id]}`).join(" · ")}
            onEdit={() => goToStep(1)}
            editLabel="+ Añadir más"
            editProminent
          >
            {(() => {
              // Variantes de tamaño: resolver opciones reales y ocultar las que
              // se muestran como selector (p.ej. la media ración) para que no
              // ocupen una card propia en la carta.
              const byId = new Map(products.map((p) => [p.id, p]));
              const sizeOptionsByBase: Record<string, SizeOption[]> = {};
              const hiddenVariantIds = new Set<string>();
              for (const g of SIZE_VARIANT_GROUPS) {
                if (!byId.has(g.baseId)) continue; // sin base → no agrupar
                const opts = g.options
                  .map((o) => ({ label: o.label, product: byId.get(o.id) }))
                  .filter((o): o is SizeOption => !!o.product);
                if (opts.length < 2) continue; // menos de 2 tamaños → sin selector
                sizeOptionsByBase[g.baseId] = opts;
                for (const o of opts)
                  if (o.product.id !== g.baseId) hiddenVariantIds.add(o.product.id);
              }

              // Extras de plato: se muestran dentro de la card del base y se
              // ocultan como card propia (p.ej. reahogado dentro del corviche).
              const addonsByBase: Record<string, { label: string; product: Product }[]> = {};
              for (const g of PRODUCT_ADDONS) {
                if (!byId.has(g.baseId)) continue;
                const addons = g.addons
                  .map((a) => ({ label: a.label, product: byId.get(a.id) }))
                  .filter((a): a is { label: string; product: Product } => !!a.product);
                if (!addons.length) continue;
                addonsByBase[g.baseId] = addons;
                for (const a of addons) hiddenVariantIds.add(a.product.id);
              }

              const grouped: Partial<Record<NormalizedCategory, typeof products>> = {};
              for (const p of products) {
                if (p.isPack) continue; // los packs no se muestran en la carta
                if (hiddenVariantIds.has(p.id)) continue; // variante → va como selector
                const cat = normalizeCategory(p.category ?? "");
                (grouped[cat] ??= []).push(p);
              }
              const activeGroups = CATEGORY_ORDER.filter((c) => (grouped[c]?.length ?? 0) > 0);
              const showHeadings = activeGroups.length > 1 || activeGroups[0] !== "Otros";

              return (
                <div className="space-y-4 sm:space-y-8">
                  {activeGroups.map((cat) => (
                    <div key={cat} id={`cat-${cat.toLowerCase()}`}>
                      {showHeadings && (
                        <div className="mb-2 sm:mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-verde-bosque/70 mb-1">
                            {CATEGORY_CONFIG[cat].title}
                          </p>
                          <p className="text-xs text-negro/45 leading-relaxed">
                            {CATEGORY_CONFIG[cat].subtitle}
                          </p>
                        </div>
                      )}
                      {/* Móvil: fila deslizable · Escritorio: rejilla */}
                      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0">
                        {grouped[cat]!.map((product) => (
                          <div
                            key={product.id}
                            className="shrink-0 w-[42%] snap-start sm:w-full"
                          >
                            <ProductCard
                              product={product}
                              quantity={cart[product.id] ?? 0}
                              maxQuantity={config.maxQuantityPerOrder}
                              onAdd={addToCart}
                              onIncrement={increment}
                              onDecrement={decrement}
                              sizeOptions={sizeOptionsByBase[product.id]}
                              addons={addonsByBase[product.id]}
                              quantityOf={(id) => cart[id] ?? 0}
                              image={imageForProduct(product)}
                              offerBadge={
                                weekendOffer &&
                                productMatchesOffer(weekendOffer, {
                                  id: product.id,
                                  name: product.name,
                                })
                                  ? `2ª −${weekendOffer.percentOff}%`
                                  : undefined
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {cartProducts.some((p) => p.isPack) && (
              <div className="mt-5 space-y-2">
                {cartProducts
                  .filter((p) => p.isPack)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-verde-bosque/5 border border-verde-bosque/15 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-verde-bosque">
                        {p.name}{" "}
                        <span className="text-negro/40">×{cart[p.id]}</span> ·{" "}
                        {(p.depositAmount * (cart[p.id] ?? 0)).toFixed(2).replace(".", ",")} €
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(p.id)}
                        className="ml-3 shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-tierra/70 hover:text-tierra"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {cartProducts.length > 0 && (
              <>
                <div className="mt-5 flex items-center justify-between border-t border-verde-bosque/15 pt-4">
                  <p className="text-sm text-verde-bosque/70">
                    <span className="font-semibold text-verde-bosque">{totalItems}</span>{" "}
                    {totalItems === 1 ? "unidad" : "unidades"} ·{" "}
                    {cartProducts.length}{" "}
                    {cartProducts.length === 1 ? "producto" : "productos"}
                  </p>
                  <p className="text-sm font-semibold text-verde-bosque">
                    Total: {totalDeposit} €
                  </p>
                </div>

                <button
                  type="button"
                  onClick={continueFromMenu}
                  className="mt-5 w-full bg-[#c85a2a] text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 hover:bg-[#d96535] transition-all duration-300"
                >
                  Continuar con la fecha
                </button>
              </>
            )}
          </StepSection>

          {/* ── PASO 2: FECHA ── */}
          {maxStep >= 2 && (
            <StepSection
              stepRef={ref2}
              number={2}
              title="Elige el día"
              isActive={currentStep === 2}
              isDone={currentStep > 2}
              summary={step2Done ? formatDateLabel(fields.reservationDate) : "Pendiente"}
              onEdit={() => goToStep(2)}
            >
              {renderCalendar()}

              <button
                type="button"
                disabled={!step2Done}
                onClick={() => step2Done && goToStep(3)}
                className={clsx(
                  "mt-5 w-full text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 transition-all duration-300",
                  step2Done
                    ? "bg-[#c85a2a] text-crema hover:bg-[#d96535]"
                    : "bg-negro/8 text-negro/30 cursor-not-allowed"
                )}
              >
                Continuar con la hora
              </button>
            </StepSection>
          )}

          {/* ── PASO 3: HORA ── */}
          {maxStep >= 3 && (
            <StepSection
              stepRef={ref3}
              number={3}
              title="Elige la hora"
              isActive={currentStep === 3}
              isDone={currentStep > 3}
              summary={step3Done ? fields.reservationTime : "Pendiente"}
              onEdit={() => goToStep(3)}
            >
              {selectedDay && selectedDay.slots.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedDay.slots.map((slot) => {
                    const isSelected = fields.reservationTime === slot.time;
                    const isSoldOut = slot.status === "sold_out";
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => selectTime(slot.time)}
                        className={clsx(
                          "px-4 py-2 text-sm font-medium border rounded-lg transition-all duration-150",
                          isSelected &&
                            "bg-verde-bosque text-crema border-verde-bosque",
                          !isSelected &&
                            !isSoldOut &&
                            "border-verde-bosque/30 text-verde-bosque hover:bg-verde-bosque/10",
                          isSoldOut &&
                            "border-negro/10 text-negro/25 cursor-not-allowed opacity-40"
                        )}
                      >
                        {slot.time}
                        {isSoldOut && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-wide">
                            · Sold out
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-negro/40 text-sm py-2 mb-5">
                  {fields.reservationDate
                    ? "No hay horarios disponibles para esta fecha."
                    : "Selecciona primero una fecha."}
                </p>
              )}

              <button
                type="button"
                disabled={!step3Done}
                onClick={() => step3Done && goToStep(4)}
                className={clsx(
                  "w-full text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 transition-all duration-300",
                  step3Done
                    ? "bg-[#c85a2a] text-crema hover:bg-[#d96535]"
                    : "bg-negro/8 text-negro/30 cursor-not-allowed"
                )}
              >
                Continuar con tus datos
              </button>
            </StepSection>
          )}

          {/* ── PASO 4: DATOS PERSONALES ── */}
          {maxStep >= 4 && (
            <StepSection
              stepRef={ref4}
              number={4}
              title="Tus datos"
              isActive={currentStep === 4}
              isDone={currentStep > 4}
              summary={
                step4Done
                  ? `${fields.customerName} · ${fields.phone}`
                  : "Pendiente"
              }
              onEdit={() => goToStep(4)}
            >
              {savedDataDetected && (
                <div className="mb-6 flex items-start justify-between gap-4 border-l-2 border-verde-bosque/30 pl-3 py-1">
                  <p className="text-xs text-negro/45 leading-relaxed">
                    Usamos tus datos guardados en este dispositivo para completar el formulario más rápido.
                  </p>
                  <button
                    type="button"
                    onClick={clearSavedData}
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-negro/30 hover:text-tierra transition-colors underline underline-offset-2"
                  >
                    Borrar
                  </button>
                </div>
              )}

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <label htmlFor="customerName" className={labelClass}>
                    Nombre completo
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    required
                    placeholder="Tu nombre"
                    value={fields.customerName}
                    onChange={handleFieldChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={fields.email}
                    onChange={handleFieldChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    WhatsApp
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+34 600 000 000"
                    value={fields.phone}
                    onChange={handleFieldChange}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={labelClass}>
                    Notas (opcional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder="Alergias, instrucciones especiales..."
                    value={fields.notes}
                    onChange={handleFieldChange}
                    className={clsx(inputClass, "resize-none")}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!step4Done}
                onClick={() => step4Done && goToStep(5)}
                className={clsx(
                  "mt-6 w-full text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 transition-all duration-300",
                  step4Done
                    ? "bg-[#c85a2a] text-crema hover:bg-[#d96535]"
                    : "bg-negro/8 text-negro/30 cursor-not-allowed"
                )}
              >
                Continuar con la entrega
              </button>
            </StepSection>
          )}

          {/* ── PASO 5: ENTREGA ── */}
          {maxStep >= 5 && (
            <StepSection
              stepRef={ref5}
              number={5}
              title="Entrega"
              isActive={currentStep === 5}
              isDone={currentStep > 5}
              summary={
                step5Done
                  ? fields.deliveryMethod === "pickup"
                    ? "Recogida en local"
                    : `${fields.deliveryAddress} · ${fields.postalCode}`
                  : "Pendiente"
              }
              onEdit={() => goToStep(5)}
            >
              {/* Método */}
              <div className="mb-6">
                <p className={clsx(labelClass, "mb-3")}>Método de entrega</p>
                <div className="flex border border-negro/15 w-fit">
                  <button
                    type="button"
                    onClick={() =>
                      setFields((p) => ({ ...p, deliveryMethod: "delivery" }))
                    }
                    className={clsx(
                      "px-5 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-150",
                      fields.deliveryMethod === "delivery"
                        ? "bg-verde-bosque text-crema"
                        : "text-negro/45 hover:text-negro/70"
                    )}
                  >
                    Entrega a domicilio
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFields((p) => ({ ...p, deliveryMethod: "pickup" }))
                    }
                    className={clsx(
                      "px-5 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase border-l border-negro/15 transition-colors duration-150",
                      fields.deliveryMethod === "pickup"
                        ? "bg-verde-bosque text-crema"
                        : "text-negro/45 hover:text-negro/70"
                    )}
                  >
                    Recogida
                  </button>
                </div>
              </div>

              {fields.deliveryMethod === "pickup" && (
                <div className="mb-2 border border-verde-bosque/25 bg-verde-bosque/[0.05] p-5">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-verde-bosque mb-1">
                    Recoges tu pedido en
                  </p>
                  <p className="text-sm font-medium text-negro/80">
                    {PICKUP_ADDRESS}
                  </p>
                  <a
                    href={PICKUP_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-verde-bosque underline underline-offset-2 hover:text-verde-platano"
                  >
                    Ver cómo llegar ↗
                  </a>
                  <p className="text-[11px] text-negro/40 mt-2 leading-relaxed">
                    Te avisaremos cuando tu pedido esté listo para recoger en el
                    día y hora elegidos.
                  </p>
                </div>
              )}

              {fields.deliveryMethod === "delivery" && (
                <>
                  <p className="text-negro/35 text-xs leading-relaxed mb-6 max-w-sm">
                    Por ahora entregamos solo en zonas habilitadas. Si tu
                    dirección está fuera de cobertura, te contactaremos por
                    WhatsApp.
                  </p>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="deliveryAddress" className={labelClass}>
                        Dirección de entrega
                      </label>
                      <input
                        id="deliveryAddress"
                        name="deliveryAddress"
                        type="text"
                        required
                        placeholder="Calle, número, piso, puerta"
                        value={fields.deliveryAddress}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className={labelClass}>
                        Código postal
                      </label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        required
                        placeholder="28000"
                        value={fields.postalCode}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="deliveryZone" className={labelClass}>
                        Zona (opcional)
                      </label>
                      <input
                        id="deliveryZone"
                        name="deliveryZone"
                        type="text"
                        placeholder="Barrio o distrito"
                        value={fields.deliveryZone}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="deliveryDetails" className={labelClass}>
                        Piso, puerta y detalles de entrega
                      </label>
                      <input
                        id="deliveryDetails"
                        name="deliveryDetails"
                        type="text"
                        placeholder="Piso, puerta, escalera, timbre, referencia para el repartidor..."
                        value={fields.deliveryDetails}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Cálculo de envío */}
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={calcDelivery}
                      disabled={deliveryLoading}
                      className="text-[11px] font-semibold tracking-[0.15em] uppercase px-5 py-3 bg-verde-bosque text-crema transition-colors hover:bg-verde-platano disabled:opacity-50"
                    >
                      {deliveryLoading ? "Calculando..." : "Calcular envío"}
                    </button>
                    {delivery?.deliverable && effectiveDeliveryFee > 0 && (
                      <span className="text-sm font-medium text-verde-bosque">
                        Envío{delivery.zone ? ` · Zona ${delivery.zone}` : ""}:{" "}
                        {effectiveDeliveryFee.toFixed(2).replace(".", ",")} €
                      </span>
                    )}
                  </div>
                  {deliveryError && (
                    <p className="mt-2 text-xs text-tierra">{deliveryError}</p>
                  )}
                </>
              )}

              <div className="mt-6 mb-4 border border-negro/8 bg-negro/[0.02] p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveData}
                    onChange={(e) => setSaveData(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4 accent-verde-bosque cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-negro/70">
                      Guardar mis datos para mi próxima compra
                    </span>
                    <p className="text-[10px] text-negro/40 leading-relaxed mt-1">
                      Guardaremos tus datos solo en este dispositivo para que no tengas que rellenarlos de nuevo. No guardamos datos de pago.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="button"
                disabled={!step5Done || deliveryLoading}
                onClick={() => step5Done && continueFromDelivery()}
                className={clsx(
                  "w-full text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 transition-all duration-300",
                  step5Done && !deliveryLoading
                    ? "bg-[#c85a2a] text-crema hover:bg-[#d96535]"
                    : "bg-negro/8 text-negro/30 cursor-not-allowed"
                )}
              >
                {deliveryLoading ? "Calculando envío…" : "Ver resumen y pagar"}
              </button>
            </StepSection>
          )}

          {/* ── PASO 6: RESUMEN Y PAGO ── */}
          {maxStep >= 6 && (
            <StepSection
              stepRef={ref6}
              number={6}
              title="Resumen y pago"
              isActive={currentStep >= 6}
              isDone={false}
              summary=""
              onEdit={() => {}}
              showEditButton={false}
            >
              {/* Empujón: ¿Algo para beber? (order bump antes de pagar) */}
              {drinkProducts.length > 0 && (
                <div
                  className="mb-6 rounded-xl p-5 border"
                  style={{
                    background: "rgba(80,146,52,0.06)",
                    borderColor: "rgba(80,146,52,0.25)",
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-verde-bosque mb-1">
                    🥤 ¿Algo para beber?
                  </p>
                  <p className="text-xs text-negro/45 mb-4">
                    Añádelo a tu pedido antes de pagar.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {drinkProducts.map((d) => {
                      const qty = cart[d.id] ?? 0;
                      const price = d.depositAmount || d.finalPrice;
                      return (
                        <div
                          key={d.id}
                          className="flex items-center gap-2.5 rounded-full border bg-white pl-3.5 pr-1.5 py-1.5"
                          style={{
                            borderColor:
                              qty > 0 ? "#509234" : "rgba(0,0,0,0.12)",
                          }}
                        >
                          <span className="text-xs font-medium text-negro/75">
                            {d.name}
                          </span>
                          <span className="text-xs font-semibold text-verde-bosque">
                            {fmtPrice(price)} €
                          </span>
                          {qty > 0 ? (
                            <span className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => decrement(d.id)}
                                className="w-6 h-6 rounded-full bg-negro/10 text-negro/60 leading-none"
                                aria-label={`Quitar ${d.name}`}
                              >
                                −
                              </button>
                              <span className="text-xs font-semibold w-4 text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => increment(d.id)}
                                className="w-6 h-6 rounded-full bg-verde-bosque text-crema leading-none"
                                aria-label={`Añadir ${d.name}`}
                              >
                                +
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(d.id)}
                              className="w-7 h-7 rounded-full bg-verde-bosque text-crema leading-none text-sm font-bold hover:bg-verde-platano transition-colors"
                              aria-label={`Añadir ${d.name}`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-verde-bosque/5 rounded-xl p-6 mb-6">
              {/* Products */}
              <div className="space-y-2 mb-6">
                {cartProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm text-negro/60"
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-negro/38">×{cart[p.id]}</span>
                    </span>
                    <span>{fmtPrice(p.finalPrice * (cart[p.id] ?? 0))} €</span>
                  </div>
                ))}
              </div>

              {/* Date, time, personal, delivery */}
              <div className="border-t border-negro/8 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm text-negro/45">
                  <span>Fecha</span>
                  <span className="capitalize text-right">
                    {formatDateLabel(fields.reservationDate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-negro/45">
                  <span>Hora</span>
                  <span>{fields.reservationTime}</span>
                </div>
                <div className="flex justify-between text-sm text-negro/45">
                  <span>Nombre</span>
                  <span>{fields.customerName}</span>
                </div>
                <div className="flex justify-between text-sm text-negro/45">
                  <span>WhatsApp</span>
                  <span>{fields.phone}</span>
                </div>
                {fields.deliveryMethod === "delivery" ? (
                  <>
                    <div className="flex justify-between text-sm text-negro/45">
                      <span>Dirección</span>
                      <span className="text-right max-w-[55%]">
                        {fields.deliveryAddress}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-negro/45">
                      <span>Código postal</span>
                      <span>{fields.postalCode}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm text-negro/45">
                    <span>Recoges en</span>
                    <span className="text-right max-w-[60%] text-negro/70">
                      {PICKUP_ADDRESS}
                    </span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-negro/10 pt-4 mb-8 text-sm">
                <div className="flex justify-between text-negro/50">
                  <span>Subtotal</span>
                  <span>{totalDeposit.toFixed(2).replace(".", ",")} €</span>
                </div>
                {livePromotion?.isActive && discountAmount > 0 && (
                  <div className="flex justify-between text-verde-bosque/75">
                    <span>{livePromotion.promoName} −{livePromotion.promoValue}%</span>
                    <span>−{discountAmount.toFixed(2).replace(".", ",")} €</span>
                  </div>
                )}
                {weekendOffer && offerDiscount > 0 && (
                  <div className="flex justify-between text-[#c85a2a]">
                    <span>
                      {weekendOffer.name} · {offerResult.discountedUnits}× 2ª −{weekendOffer.percentOff}%
                    </span>
                    <span>−{offerDiscount.toFixed(2).replace(".", ",")} €</span>
                  </div>
                )}
                {effectiveDeliveryFee > 0 && (
                  <div className="flex justify-between text-negro/50">
                    <span>Envío{delivery?.zone ? ` · Zona ${delivery.zone}` : ""}</span>
                    <span>{effectiveDeliveryFee.toFixed(2).replace(".", ",")} €</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-1 font-semibold text-verde-bosque border-t border-negro/8">
                  <span>Total a pagar hoy</span>
                  <span>{grandTotal.toFixed(2).replace(".", ",")} €</span>
                </div>
              </div>
              </div>

              {/* ── Aceptación legal ── */}
              <div className="space-y-3 mb-6 border border-negro/8 p-4 bg-crema rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => { setPrivacyAccepted(e.target.checked); setError(null); }}
                    className="mt-0.5 shrink-0 w-4 h-4 accent-verde-bosque cursor-pointer"
                    aria-required="true"
                  />
                  <span className="text-xs text-negro/55 leading-relaxed">
                    Acepto la{" "}
                    <a
                      href="/politica-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-verde-bosque hover:text-verde-platano transition-colors"
                    >
                      Política de privacidad
                    </a>{" "}
                    y autorizo a VERDE a usar mis datos para gestionar mi pedido, la entrega y las comunicaciones necesarias.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
                    className="mt-0.5 shrink-0 w-4 h-4 accent-verde-bosque cursor-pointer"
                    aria-required="true"
                  />
                  <span className="text-xs text-negro/55 leading-relaxed">
                    Acepto las{" "}
                    <a
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-verde-bosque hover:text-verde-platano transition-colors"
                    >
                      condiciones de compra
                    </a>
                    , preparación y entrega del pedido.
                  </span>
                </label>
              </div>

              {error && (
                <div className="border-l-2 border-tierra/35 pl-4 py-1 mb-6">
                  <p className="text-tierra text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  "w-full bg-verde-bosque text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-5 px-6 transition-all duration-300 flex items-center justify-center gap-3",
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-verde-platano"
                )}
              >
                {loading && (
                  <span className="w-4 h-4 border border-crema/30 border-t-crema rounded-full animate-spin shrink-0" />
                )}
                {loading ? "Procesando..." : "Pagar y confirmar pedido"}
              </button>

              <p className="text-[10px] font-medium text-negro/25 uppercase tracking-wider mt-4 text-center">
                Pago seguro con Stripe · No guardamos datos de tu tarjeta
              </p>
            </StepSection>
          )}

        </form>
        )}
      </div>

      {showDrinkModal && (
        <DrinkUpsellModal
          drinks={drinkProducts}
          cart={cart}
          onAdd={addToCart}
          onIncrement={increment}
          onDecrement={decrement}
          onContinue={dismissDrinkModal}
        />
      )}
    </section>
  );
}
