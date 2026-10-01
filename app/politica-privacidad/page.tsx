export default function PoliticaPrivacidadPage() {
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
          Política de privacidad
        </h1>

        <div className="space-y-10 text-negro/70 text-sm leading-relaxed">

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Datos que recogemos
            </h2>
            <p className="mb-3">
              VERDE recoge los datos necesarios para gestionar los pedidos realizados en esta web.
            </p>
            <ul className="space-y-1 pl-4 list-disc marker:text-verde-bosque/40">
              <li>Nombre</li>
              <li>Email</li>
              <li>Teléfono / WhatsApp</li>
              <li>Dirección de entrega</li>
              <li>Detalles del pedido</li>
            </ul>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Finalidad
            </h2>
            <p>
              Usamos estos datos únicamente para gestionar el pedido, confirmar el pago,
              coordinar la entrega y comunicarnos contigo si es necesario. No los cedemos
              a terceros con fines comerciales.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Pagos
            </h2>
            <p>
              Los pagos se gestionan de forma segura a través de Stripe. VERDE no almacena
              datos completos de tarjetas bancarias. Puedes consultar la política de
              privacidad de Stripe en stripe.com.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Comunicación
            </h2>
            <p>
              Podemos contactarte por email o WhatsApp únicamente para temas relacionados
              con tu pedido: confirmaciones, coordinación de entrega e incidencias.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Datos guardados en tu dispositivo
            </h2>
            <p>
              Si marcas la opción &ldquo;Guardar mis datos para mi próxima compra&rdquo;, guardaremos
              localmente en tu dispositivo algunos datos de contacto y entrega para facilitar futuras
              compras. Estos datos no incluyen información de pago y puedes eliminarlos desde el
              formulario en cualquier momento haciendo clic en &ldquo;Borrar&rdquo; junto al aviso de datos guardados.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Reparto solidario
            </h2>
            <p className="mb-3">
              Si te apuntas a salir a repartir desde verdemadrid.com/reparto, guardamos tu nombre,
              tu teléfono, lo que vas a traer, los idiomas que hablas y la nota que nos dejes. Los
              usamos solo para organizar el reparto y escribirte por WhatsApp sobre él, con tu
              consentimiento, que marcas al apuntarte.
            </p>
            <p className="mb-3">
              Tu teléfono solo lo ve el equipo de VERDE. En la lista pública de la página aparece
              únicamente tu nombre de pila (o &ldquo;Alguien&rdquo;, si así lo eliges) y lo que traes. Si en
              la nota escribes un teléfono, un email o un enlace, lo ocultamos antes de mostrarla.
            </p>
            <p>
              Borramos estos datos en el mes siguiente al reparto. Puedes pedirnos que los borremos
              antes escribiendo al email de contacto de abajo.
            </p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Responsable
            </h2>
            <p>VERDE · verdemadrid.com</p>
          </div>

          <div>
            <h2 className="text-negro text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Contacto
            </h2>
            <p>
              Para cualquier consulta sobre tus datos, escríbenos a{" "}
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
