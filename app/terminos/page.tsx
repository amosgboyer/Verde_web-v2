export default function TerminosPage() {
  return (
    <section className="min-h-screen bg-crema px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <a
          href="/"
          className="inline-block text-[10px] font-semibold uppercase tracking-[0.25em] text-negro/35 hover:text-verde-bosque transition-colors mb-12"
        >
          ← Volver al inicio
        </a>

        <p className="text-negro/30 text-[10px] font-medium tracking-[0.4em] uppercase mb-3">
          Legal
        </p>
        <h1 className="text-verde-bosque text-3xl sm:text-4xl font-bold tracking-tight mb-12">
          Condiciones de compra y entrega
        </h1>

        <div className="space-y-10 text-negro/70 text-sm leading-relaxed">

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Pedidos
            </h2>
            <p>
              Los pedidos en VERDE se realizan bajo reserva y están sujetos a disponibilidad
              de productos, fechas y horarios. La disponibilidad se actualiza en tiempo real
              y puede cambiar entre el momento de seleccionar y el momento de confirmar.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Pago
            </h2>
            <p>
              El pedido se confirma al completar el pago online mediante Stripe. El importe
              se carga en el momento de la confirmación. No realizamos cargos adicionales
              sin previo aviso.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Preparación
            </h2>
            <p>
              Los productos se preparan bajo pedido para cuidar la calidad y la frescura.
              Cada pedido se elabora de forma artesanal para la fecha y hora seleccionadas.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Entrega
            </h2>
            <p>
              La entrega se realiza en la fecha y dirección seleccionadas por el cliente, en un margen de 30 minutos desde la hora elegida.
              Si necesitamos confirmar algún detalle, contactaremos por WhatsApp o email antes
              de la hora de entrega.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Cambios e incidencias
            </h2>
            <p>
              Si hubiera algún problema con disponibilidad, horario, dirección o preparación
              del pedido, el equipo de VERDE contactará al cliente para resolverlo. En caso
              de no poder completar el pedido por causas imputables a VERDE, se gestionará
              el reembolso correspondiente.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Contacto
            </h2>
            <p>
              Para cualquier consulta sobre tu pedido, escríbenos a{" "}
              <a
                href="mailto:equipo@verdemadrid.com"
                className="underline text-verde-bosque hover:text-negro transition-colors"
              >
                equipo@verdemadrid.com
              </a>
            </p>
          </div>

        </div>

        <div className="mt-16 border-t border-negro/8 pt-8">
          <a
            href="/#reservar"
            className="inline-block bg-verde-bosque text-crema text-[11px] font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-negro transition-all duration-300"
          >
            Volver a hacer mi pedido
          </a>
        </div>

      </div>
    </section>
  );
}
