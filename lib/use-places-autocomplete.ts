"use client";

// Autocompletado de dirección con Google Places (Maps JavaScript API +
// Places, librería JS — NO los endpoints REST: la key está restringida por
// HTTP referrer y los REST rechazan ese tipo de key).
//
// Contrato con el checkout: al elegir una sugerencia se extraen calle+número,
// código postal y barrio, y el CP alimenta el cálculo de zona/tarifa que ya
// existe (KM_POR_CP / TRAMOS_ENVIO en lib/delivery.ts). Google solo autocompleta
// texto en el navegador; ningún dato del cliente pasa por nuestro servidor.
//
// Si no hay key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), el script no carga o la key
// no vale para este dominio, el campo se queda como input manual de siempre.

import { useEffect, useRef } from "react";

export interface PlaceSelection {
  /** Calle y número ("Calle de Alberto Aguilera 12"). */
  address: string;
  /** Código postal ("28015"); "" si Google no lo devuelve. */
  postalCode: string;
  /** Barrio/distrito ("Chamberí"); "" si no viene en la respuesta. */
  barrio: string;
}

declare global {
  interface Window {
    google?: typeof google;
    /** Callback global que Maps JS invoca si la key no vale para este dominio. */
    gm_authFailure?: () => void;
  }
}

const PLACEHOLDER_MANUAL = "Calle, número, piso…";

let loaderPromise: Promise<boolean> | null = null;

// Si la key falla (referrer no permitido, billing, etc.), Maps JS deshabilita
// los inputs a los que se enganchó. Los devolvemos a la vida como campo manual.
function handleAuthFailure() {
  console.warn(
    "[places] La key de Google Maps no es válida para este dominio; la dirección se escribe a mano."
  );
  document
    .querySelectorAll<HTMLInputElement>("input[data-places-input]")
    .forEach((el) => {
      el.disabled = false;
      el.placeholder = PLACEHOLDER_MANUAL;
    });
}

function loadPlacesScript(apiKey: string): Promise<boolean> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.google?.maps?.places) {
      resolve(true);
      return;
    }
    window.gm_authFailure = handleAuthFailure;
    const params = new URLSearchParams({
      key: apiKey,
      libraries: "places",
      language: "es",
      region: "ES",
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve(Boolean(window.google?.maps?.places));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loaderPromise;
}

/**
 * Engancha google.maps.places.Autocomplete (country:'es') al input referenciado
 * mientras `active` sea true. `onPlace` recibe la selección ya troceada.
 * El script se carga solo la primera vez que hace falta (paso de entrega).
 */
export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement>,
  active: boolean,
  onPlace: (place: PlaceSelection) => void
) {
  // El callback vive en un ref: así el efecto no se re-ejecuta en cada render
  // del formulario (que re-crea la función) y el widget no se re-instancia.
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const input = inputRef.current;
    if (!active || !apiKey || !input) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    loadPlacesScript(apiKey).then((ok) => {
      if (!ok || cancelled || !inputRef.current) return;
      try {
        autocomplete = new window.google!.maps.places.Autocomplete(input, {
          componentRestrictions: { country: "es" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });
      } catch (err) {
        // P. ej. proyecto de Google sin acceso al widget clásico: seguimos en manual.
        console.warn("[places] Autocomplete no disponible:", err);
        return;
      }
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        const comps = place?.address_components ?? [];
        const get = (type: string) =>
          comps.find((c) => c.types.includes(type))?.long_name ?? "";
        const route = get("route");
        const num = get("street_number");
        const address = route
          ? `${route}${num ? ` ${num}` : ""}`
          : place?.formatted_address ?? input.value;
        const barrio =
          get("sublocality_level_1") || get("sublocality") || get("neighborhood");
        onPlaceRef.current({ address, postalCode: get("postal_code"), barrio });
      });
    });

    // Enter con el desplegable abierto elige la sugerencia; sin esto además
    // dispararía el submit del formulario.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    input.addEventListener("keydown", onKeyDown);

    return () => {
      cancelled = true;
      input.removeEventListener("keydown", onKeyDown);
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
      // El desplegable (.pac-container) cuelga del <body>, no del input: al
      // desmontar el paso hay que retirarlo a mano o se acumulan huérfanos.
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [active, inputRef]);
}
