import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El webhook de Stripe necesita el body raw, no parseado por Next.js
  // Esto se maneja en el propio route handler con request.text()

  // Redirección propia a WhatsApp. Los emails deben enlazar a nuestro dominio
  // (verdemadrid.com/wa), no a wa.me: un enlace a un dominio distinto del
  // remitente dispara los filtros de spam (aviso de Resend, sep-2026). El
  // cliente hace clic en verdemadrid.com/wa y el servidor lo lleva a WhatsApp.
  async redirects() {
    return [
      {
        source: "/wa",
        destination: "https://wa.me/34605442809",
        permanent: false,
      },
      // Reparto solidario retirado del sitio (oct-2026). La URL antigua deja de
      // mostrar la página y lleva a la home. El código del reparto queda latente
      // por si se reactiva; quitar este redirect y el enlace del nav lo restaura.
      {
        source: "/reparto",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
