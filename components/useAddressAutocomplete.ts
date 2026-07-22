import { useEffect, useRef } from "react";
import { loadGooglePlaces } from "@/lib/googlePlaces";

export interface SelectedAddress {
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
}

/**
 * Engancha el autocompletado de Google Places a un <input>. Al elegir una
 * dirección, llama a onSelect con la dirección formateada, el código postal y
 * las coordenadas (para calcular la zona de envío con las reglas de siempre).
 *
 * Si no hay NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, no hace nada (el input funciona
 * normal + botón "Calcular envío").
 */
export function useAddressAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  enabled: boolean,
  onSelect: (s: SelectedAddress) => void
) {
  const cbRef = useRef(onSelect);
  cbRef.current = onSelect;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!enabled || !key || !inputRef.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let listener: any = null;

    loadGooglePlaces(key)
      .then(() => {
        if (cancelled || !inputRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        if (!g?.maps?.places?.Autocomplete) return;

        const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "es" },
          fields: ["formatted_address", "address_components", "geometry"],
          types: ["address"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place?.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const comps: any[] = place.address_components || [];
          const postal =
            comps.find((c) => c.types?.includes("postal_code"))?.long_name || "";
          cbRef.current({
            address: place.formatted_address || inputRef.current?.value || "",
            postalCode: postal,
            lat,
            lng,
          });
        });
      })
      .catch(() => {
        // Silencioso: se puede rellenar a mano y usar "Calcular envío".
      });

    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (listener && (window as any).google?.maps?.event) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google.maps.event.removeListener(listener);
      }
    };
  }, [inputRef, enabled]);
}
