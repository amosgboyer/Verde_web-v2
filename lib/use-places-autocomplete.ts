"use client";

// Autocompletado de dirección con Google Places (Maps JavaScript API, key
// restringida por HTTP referrer — NO endpoints REST: rechazan ese tipo de key).
//
// Se usa la superficie NUEVA de Places (AutocompleteSuggestion + Place
// .fetchFields) y no el widget clásico google.maps.places.Autocomplete: el
// proyecto de Google de Verde tiene habilitada "Places API (New)" y Google ya
// no deja activar la API legacy en proyectos posteriores a marzo de 2025 (el
// widget clásico devolvía LegacyApiNotActivatedMapError, comprobado 02-09-2026).
// Bonus: el desplegable lo pintamos nosotros, con el diseño del formulario.
//
// Contrato con el checkout: al elegir una sugerencia se extraen calle+número,
// código postal y barrio; el CP alimenta el cálculo de zona/tarifa que ya
// existe (KM_POR_CP / TRAMOS_ENVIO en lib/delivery.ts). Todo ocurre en el
// navegador: ningún dato del cliente pasa por nuestro servidor.
//
// Sin key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) o si Google falla, el campo se
// queda como input manual de siempre.

import { useEffect, useRef, useState, useCallback } from "react";

export interface PlaceSelection {
  /** Calle y número ("Calle de Alberto Aguilera 12"). */
  address: string;
  /** Código postal ("28015"); "" si Google no lo devuelve. */
  postalCode: string;
  /** Barrio/distrito ("Chamberí"); "" si no viene en la respuesta. */
  barrio: string;
}

export interface AddressSuggestion {
  id: string;
  /** Línea principal ("Calle de Alberto Aguilera, 12"). */
  main: string;
  /** Contexto ("Madrid, España"). */
  secondary: string;
}

declare global {
  interface Window {
    google?: typeof google;
    /** Callback global que Maps JS invoca si la key no vale para este dominio. */
    gm_authFailure?: () => void;
    /** Callback de carga del script (requerido con loading=async). */
    __verdeMapsReady?: () => void;
  }
}

const MIN_QUERY_LENGTH = 4;
const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 5;

let loaderPromise: Promise<boolean> | null = null;

function loadMapsScript(apiKey: string): Promise<boolean> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.google?.maps) {
      resolve(true);
      return;
    }
    window.gm_authFailure = () => {
      console.warn(
        "[places] La key de Google Maps no es válida para este dominio; la dirección se escribe a mano."
      );
    };
    window.__verdeMapsReady = () => resolve(Boolean(window.google?.maps));
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language: "es",
      region: "ES",
      loading: "async",
      callback: "__verdeMapsReady",
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loaderPromise;
}

type PlacesLibrary = google.maps.PlacesLibrary;

async function getPlacesLibrary(): Promise<PlacesLibrary | null> {
  try {
    return (await window.google!.maps.importLibrary("places")) as PlacesLibrary;
  } catch (err) {
    console.warn("[places] Librería Places no disponible:", err);
    return null;
  }
}

/**
 * Sugerencias de dirección (España) para el valor tecleado en el campo.
 * Mientras `active` sea true, cada cambio de `query` (con debounce) pide
 * sugerencias; `selectSuggestion(id)` resuelve la elegida y entrega la
 * selección troceada a `onPlace`. El script se carga solo la primera vez.
 */
export function useAddressAutocomplete(
  active: boolean,
  query: string,
  onPlace: (place: PlaceSelection) => void
) {
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  // El callback vive en un ref para que los efectos no dependan de la función
  // (que el formulario re-crea en cada render).
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  // Predicciones vivas por id, para resolver la selección.
  const predictionsRef = useRef(
    new Map<string, google.maps.places.PlacePrediction>()
  );
  // Token de sesión de Places: agrupa tecleo + selección en una sesión de
  // facturación. Se renueva tras cada selección.
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  // Tras elegir sugerencia, el propio rellenado cambia `query`: ese cambio no
  // debe reabrir el desplegable.
  const skipNextQueryRef = useRef(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!active || !apiKey || ready) return;
    let cancelled = false;
    loadMapsScript(apiKey).then((ok) => {
      if (!cancelled && ok) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [active, ready]);

  useEffect(() => {
    if (!active || !ready) {
      setSuggestions([]);
      return;
    }
    if (skipNextQueryRef.current) {
      skipNextQueryRef.current = false;
      return;
    }
    const text = query.trim();
    if (text.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const places = await getPlacesLibrary();
      if (!places || cancelled) return;
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new places.AutocompleteSessionToken();
        }
        const { suggestions: results } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ["es"],
            language: "es-ES",
            region: "es",
          });
        if (cancelled) return;
        const next: AddressSuggestion[] = [];
        const byId = new Map<string, google.maps.places.PlacePrediction>();
        for (const s of results ?? []) {
          const p = s.placePrediction;
          if (!p?.placeId) continue;
          byId.set(p.placeId, p);
          next.push({
            id: p.placeId,
            main: p.mainText?.text ?? p.text?.text ?? "",
            secondary: p.secondaryText?.text ?? "",
          });
          if (next.length >= MAX_SUGGESTIONS) break;
        }
        predictionsRef.current = byId;
        setSuggestions(next);
      } catch (err) {
        // Key sin permisos, cuota, red… — el campo sigue siendo manual.
        console.warn("[places] Sugerencias no disponibles:", err);
        if (!cancelled) setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, active, ready]);

  const dismissSuggestions = useCallback(() => setSuggestions([]), []);

  const selectSuggestion = useCallback(async (id: string) => {
    const prediction = predictionsRef.current.get(id);
    setSuggestions([]);
    if (!prediction) return;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress"],
      });
      // La selección cierra la sesión de facturación de Places.
      sessionTokenRef.current = null;
      const comps = place.addressComponents ?? [];
      const get = (type: string) =>
        comps.find((c) => c.types.includes(type))?.longText ?? "";
      const route = get("route");
      const num = get("street_number");
      const address = route
        ? `${route}${num ? ` ${num}` : ""}`
        : place.formattedAddress ?? "";
      const barrio =
        get("sublocality_level_1") || get("sublocality") || get("neighborhood");
      skipNextQueryRef.current = true;
      onPlaceRef.current({
        address,
        postalCode: get("postal_code"),
        barrio,
      });
    } catch (err) {
      console.warn("[places] No se pudo resolver la dirección elegida:", err);
    }
  }, []);

  return { ready, suggestions, selectSuggestion, dismissSuggestions };
}
