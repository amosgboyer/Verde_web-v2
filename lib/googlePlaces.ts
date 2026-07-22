// Carga la API de Google Maps (librería Places, versión NUEVA) una sola vez en
// el navegador y devuelve la librería Places (con PlaceAutocompleteElement).
//
// Usa el patrón oficial recomendado: loading=async + callback + importLibrary.
// El widget clásico google.maps.places.Autocomplete quedó retirado para clientes
// nuevos (1-mar-2025) → usamos PlaceAutocompleteElement (Places API New).
//
// Si no hay API key configurada, no hace nada (el formulario sigue funcionando
// a mano + botón "Calcular envío").

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loaderPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadGooglePlaces(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (window as any).google;
  // Ya cargado: pide directamente la librería Places.
  if (g?.maps?.importLibrary) return g.maps.importLibrary("places");
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    // Callback global que Google invoca cuando el bootstrap está listo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__verdeGmapsInit = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lib = await (window as any).google.maps.importLibrary("places");
        resolve(lib);
      } catch (e) {
        loaderPromise = null;
        reject(e);
      }
    };
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&loading=async&language=es&region=ES&callback=__verdeGmapsInit`;
    script.async = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
