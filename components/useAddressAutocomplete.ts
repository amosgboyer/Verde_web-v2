import { useEffect, useRef } from "react";
import { loadGooglePlaces } from "@/lib/googlePlaces";

export interface SelectedAddress {
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
}

/**
 * Monta el nuevo PlaceAutocompleteElement de Google Places dentro de un
 * contenedor. Al elegir una dirección llama a onSelect con la dirección
 * formateada, el código postal y las coordenadas (para calcular la zona de
 * envío con las reglas de siempre). onReady(true) avisa cuando el elemento está
 * montado (para poder ocultar el campo manual).
 *
 * Migrado del widget clásico google.maps.places.Autocomplete (retirado para
 * clientes nuevos el 1-mar-2025) a PlaceAutocompleteElement (Places API New).
 *
 * Si no hay NEXT_PUBLIC_GOOGLE_MAPS_API_KEY o falla la carga, no hace nada y
 * onReady(false): el campo manual + botón "Calcular envío" siguen operativos.
 */
export function useAddressAutocomplete(
  containerRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onSelect: (s: SelectedAddress) => void,
  onReady?: (ready: boolean) => void
) {
  const cbRef = useRef(onSelect);
  cbRef.current = onSelect;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!enabled || !key || !containerRef.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let el: any = null;
    const container = containerRef.current;

    loadGooglePlaces(key)
      .then((placesLib) => {
        if (cancelled || !container) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lib = placesLib || (window as any).google?.maps?.places;
        const PlaceAutocompleteElement = lib?.PlaceAutocompleteElement;
        if (!PlaceAutocompleteElement) return;

        el = new PlaceAutocompleteElement({
          includedRegionCodes: ["es"],
        });
        el.style.width = "100%";

        container.replaceChildren(el);

        // El evento de selección: gmp-select (GA) trae event.placePrediction.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        el.addEventListener("gmp-select", async (event: any) => {
          try {
            const prediction = event?.placePrediction;
            const place =
              prediction && typeof prediction.toPlace === "function"
                ? prediction.toPlace()
                : event?.place;
            if (!place) return;
            await place.fetchFields({
              fields: ["formattedAddress", "location", "addressComponents"],
            });
            const loc = place.location;
            const lat = typeof loc?.lat === "function" ? loc.lat() : loc?.lat;
            const lng = typeof loc?.lng === "function" ? loc.lng() : loc?.lng;
            if (typeof lat !== "number" || typeof lng !== "number") return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const comps: any[] = place.addressComponents || [];
            const postal =
              comps.find((c) => c.types?.includes("postal_code"))?.longText || "";
            cbRef.current({
              address: place.formattedAddress || "",
              postalCode: postal,
              lat,
              lng,
            });
          } catch {
            // Silencioso: se puede rellenar a mano y usar "Calcular envío".
          }
        });

        readyRef.current?.(true);
      })
      .catch(() => {
        readyRef.current?.(false);
      });

    return () => {
      cancelled = true;
      readyRef.current?.(false);
      if (el && container?.contains(el)) container.removeChild(el);
    };
  }, [containerRef, enabled]);
}
