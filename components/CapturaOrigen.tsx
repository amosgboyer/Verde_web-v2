"use client";

import { useEffect } from "react";
import { capturarOrigen } from "@/lib/origen";

/**
 * Apunta de dónde llega el cliente (UTMs del enlace o web de procedencia) para guardarlo
 * con su pedido. No pinta nada. Ver lib/origen.ts.
 */
export default function CapturaOrigen() {
  useEffect(() => {
    capturarOrigen();
  }, []);
  return null;
}
