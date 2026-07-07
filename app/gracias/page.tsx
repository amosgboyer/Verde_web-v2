import Image from "next/image";
import { stripe } from "@/lib/stripe";
import { orderCodeFromSession } from "@/lib/order-code";

interface GraciasPageProps {
  searchParams: { session_id?: string; added?: string };
}

interface ItemMeta {
  id: string;
  name: string;
  qty: number;
  price: number;
  deposit: number;
}

export default async function GraciasPage({ searchParams }: GraciasPageProps) {
  const sessionId = searchParams.session_id;
  const isAdded = searchParams.added === "1";
  const orderCode = sessionId ? orderCodeFromSession(sessionId) : "";

  let customerName = "";
  let deliveryDay = "";
  let totalDeposit = "";
  let totalPending = "";
  let items: ItemMeta[] = [];

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata) {
        customerName = session.metadata.customerName ?? "";
        deliveryDay = session.metadata.deliveryDay ?? "";
        totalDeposit = session.metadata.totalDeposit ?? "";
        totalPending = session.metadata.totalPending ?? "";
        try {
          items = JSON.parse(session.metadata.items ?? "[]");
        } catch {
          items = [];
        }
      }
    } catch {
      // Si falla la recuperación, mostramos la página igualmente sin detalles
    }
  }

  return (
    <section className="min-h-screen bg-verde-bosque flex items-center justify-center px-6 py-16">
      <div className="max-w-lg mx-auto w-full">

        {/* Logo */}
        <div className="flex justify-start mb-10">
          <Image
            src="/iconVerde.png"
            alt="Verde"
            width={72}
            height={72}
          />
        </div>

        <div className="mb-14">
          <p className="text-crema/30 text-[10px] font-medium tracking-[0.4em] uppercase mb-4">
            {isAdded ? "Añadido a tu pedido" : "Pedido confirmado"}
          </p>
          <h1 className="text-crema text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            {isAdded ? "¡Añadido a tu pedido!" : "Pedido confirmado"}
          </h1>
          <p className="text-crema/60 text-base leading-relaxed mb-3">
            Gracias{customerName ? `, ${customerName}` : ""}.{" "}
            {isAdded
              ? "Hemos sumado lo nuevo a tu pedido. Te enviamos un correo con los detalles."
              : "Te enviamos un correo con los detalles de tu pedido."}
          </p>
          <p className="text-crema/60 text-base leading-relaxed">
            Si necesitamos confirmar algo sobre la entrega, te escribiremos por WhatsApp.
          </p>
        </div>

        {(items.length > 0 || deliveryDay) && (
          <div className="border-t border-crema/12 py-10 mb-10">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-crema/28 mb-6">
              Tu pedido
            </p>

            {items.length > 0 && (
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-baseline">
                    <span className="text-crema/65 text-sm">
                      {item.name}{" "}
                      <span className="text-crema/35">×{item.qty}</span>
                    </span>
                    <span className="text-crema/65 text-sm">
                      {item.price * item.qty} €
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t border-crema/12 pt-4">
              {deliveryDay && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-crema/32">
                    Entrega
                  </span>
                  <span className="text-crema/75 text-sm capitalize">{deliveryDay}</span>
                </div>
              )}
              {totalDeposit && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-crema/32">
                    Total pagado
                  </span>
                  <span className="font-semibold text-oro text-sm">{totalDeposit} €</span>
                </div>
              )}
              {totalPending && parseFloat(totalPending) > 0 && (
                <div className="flex justify-between items-baseline border-t border-crema/10 pt-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-crema/32">
                    Pendiente
                  </span>
                  <span className="font-semibold text-crema text-sm">{totalPending} €</span>
                </div>
              )}
            </div>
          </div>
        )}

        {orderCode && !isAdded && (
          <div className="border-t border-crema/12 pt-8 mb-10">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-crema/28 mb-2">
              Tu nº de pedido
            </p>
            <p className="text-crema text-2xl font-bold tracking-[0.18em] mb-4">
              {orderCode}
            </p>
            <p className="text-crema/55 text-sm leading-relaxed mb-5 max-w-sm">
              ¿Se te olvidó algo? Puedes añadir más a este pedido (una bebida, otro
              plato…) hasta el día antes. Solo pagas lo nuevo.
            </p>
            <a
              href={`/anadir?codigo=${orderCode}`}
              className="inline-block bg-oro text-verde-bosque text-[11px] font-bold tracking-[0.2em] uppercase px-7 py-4 hover:opacity-90 transition-opacity"
            >
              ➕ Añadir a mi pedido
            </a>
          </div>
        )}

        <a
          href="/"
          className="inline-block border border-crema/28 text-crema text-[11px] font-semibold tracking-[0.22em] uppercase px-8 py-4 hover:bg-crema hover:text-verde-bosque transition-all duration-300"
        >
          Volver al inicio
        </a>
      </div>
    </section>
  );
}
