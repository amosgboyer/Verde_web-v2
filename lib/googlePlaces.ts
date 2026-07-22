// Carga la API de Google Maps (librería Places) una sola vez en el navegador.
// Si no hay API key configurada, no hace nada (el formulario sigue funcionando
// a mano + botón "Calcular envío").

let loaderPromise: Promise<void> | null = null;

export function loadGooglePlaces(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // Ya cargado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=es&region=ES&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
