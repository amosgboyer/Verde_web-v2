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
    ];
  },
};

export default nextConfig;
