import type { Metadata } from "next";
import RepartoForm from "@/components/RepartoForm";

export const metadata: Metadata = {
  title: "Reparto del lunes — Verde",
  description:
    "Apúntate a salir a repartir comida y abrigo a personas en situación de calle en Madrid, y dinos qué puedes traer.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Reparto del lunes — Verde",
    description: "Apúntate a salir a repartir el lunes y dinos qué puedes traer.",
    images: ["/iconVerde.png"],
  },
};

export default function RepartoPage() {
  return <RepartoForm />;
}
