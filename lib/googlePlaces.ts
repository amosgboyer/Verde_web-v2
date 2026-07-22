// Carga la API de Google Maps (librería Places) una sola vez en el navegador.
// Sin `loading=async`: al ser onload, garantizamos que google.maps.places ya
// está disponible (más fiable para el widget Autocomplete clásico).
// Si no hay API key configurada, no hace nada (el formulario sigue funcionando
// a mano + botón "Calcular envío").

let loaderPromise: Promise<void> | null = null;

export function loadGooglePlaces(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places?.Autocomplete) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("google-maps-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps error")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=es&region=ES`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).google?.maps?.places?.Autocomplete) resolve();
      else reject(new Error("Places no disponible tras cargar Maps"));
    };
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
