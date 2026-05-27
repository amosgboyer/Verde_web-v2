"use client";

import { useEffect, useRef, useState } from "react";

const ZONE_LIMITS = [3, 6, 10];
const ZONE_PRICES = [2, 3.5, 5];
const MAX_MINS = 45;
const ORIGIN: [number, number] = [40.4295, -3.6658];

export default function ZoneMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const destMarker = useRef<unknown>(null);
  const line = useRef<unknown>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "ok" | "warn" | "blocked" | null; msg: string; sub?: string }>({ type: null, msg: "" });

  useEffect(() => {
    if (typeof window === "undefined" || mapInstance.current) return;
    const win = window as unknown as Record<string, unknown>;
    if (!win.L) return;
    const L = win.L as {
      map: (el: HTMLElement, o: unknown) => unknown;
      tileLayer: (url: string, o: unknown) => { addTo: (m: unknown) => void };
      divIcon: (o: unknown) => unknown;
      marker: (ll: number[], o: unknown) => { addTo: (m: unknown) => { bindPopup: (s: string) => unknown } };
      polyline: (ll: number[][], o: unknown) => { addTo: (m: unknown) => unknown };
    };
    const map = L.map(mapRef.current!, { center: ORIGIN, zoom: 12, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    const icon = L.divIcon({ html: `<div style="background:#2d5a1b;width:13px;height:13px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`, iconSize: [13, 13], iconAnchor: [6, 6], className: "" });
    L.marker(ORIGIN, { icon }).addTo(map).bindPopup("<b>Verde Madrid</b>");
    mapInstance.current = map;
  }, []);

  async function calcZone() {
    if (!address.trim()) return;
    setLoading(true);
    setResult({ type: null, msg: "" });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ", Madrid, Spain")}&format=json&limit=1`);
      const data = await res.json();
      if (!data.length) { setResult({ type: "warn", msg: "No encontramos esa dirección", sub: "Prueba: Calle + número + Madrid" }); setLoading(false); return; }

      const dLat = parseFloat(data[0].lat), dLng = parseFloat(data[0].lon);
      const win = window as unknown as Record<string, unknown>;
      const L = win.L as { divIcon: (o: unknown) => unknown; marker: (ll: number[], o: unknown) => { addTo: (m: unknown) => { bindPopup: (s: string) => unknown } }; polyline: (ll: number[][], o: unknown) => { addTo: (m: unknown) => unknown } };
      const map = mapInstance.current as { removeLayer: (l: unknown) => void; fitBounds: (b: number[][], o: unknown) => void };

      if (destMarker.current) map.removeLayer(destMarker.current);
      if (line.current) map.removeLayer(line.current);

      const di = L.divIcon({ html: `<div style="background:#c85a2a;width:13px;height:13px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`, iconSize: [13, 13], iconAnchor: [6, 6], className: "" });
      destMarker.current = L.marker([dLat, dLng], { icon: di }).addTo(map).bindPopup("<b>Tu dirección</b>");
      line.current = L.polyline([ORIGIN, [dLat, dLng]], { color: "#2d5a1b", weight: 2, dashArray: "6 5", opacity: 0.7 }).addTo(map);
      map.fitBounds([ORIGIN, [dLat, dLng]], { padding: [40, 40] });

      const R = 6371, dlat = ((dLat - ORIGIN[0]) * Math.PI) / 180, dlng = ((dLng - ORIGIN[1]) * Math.PI) / 180;
      const a = Math.sin(dlat / 2) ** 2 + Math.cos((ORIGIN[0] * Math.PI) / 180) * Math.cos((dLat * Math.PI) / 180) * Math.sin(dlng / 2) ** 2;
      const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const mins = Math.round(10 + km * 3.5);
      let zone: number | null = null;
      for (let i = 0; i < ZONE_LIMITS.length; i++) { if (km <= ZONE_LIMITS[i]) { zone = i + 1; break; } }

      if (mins > MAX_MINS || !zone) {
        setResult({ type: "blocked", msg: "Aún no llegamos a tu zona 🙏", sub: "Estamos creciendo y pronto ampliaremos el reparto. Síguenos en @verde_madrid para enterarte cuando lleguemos a tu barrio." });
      } else {
        const price = ZONE_PRICES[zone - 1];
        setResult({ type: zone <= 2 ? "ok" : "warn", msg: `✅ Podemos llevarte el verde · ${price.toFixed(2).replace(".", ",")} € de envío`, sub: `${km.toFixed(1)} km desde nuestro punto de salida` });
      }
    } catch { setResult({ type: "warn", msg: "Error de conexión", sub: "Inténtalo de nuevo." }); }
    setLoading(false);
  }

  const resultStyles = {
    ok: { bg: "#eaf4e8", color: "#1c3a10", border: "#c0ddb8" },
    warn: { bg: "#fef9e7", color: "#7d5a00", border: "#f0d060" },
    blocked: { bg: "#fef9e7", color: "#5a4200", border: "#f0d060" },
  };
  const rs = result.type ? resultStyles[result.type] : null;

  return (
    <section className="py-14 px-6 border-t" style={{ background: "white", borderColor: "rgba(44,90,27,0.08)" }} id="zonas">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" async />

      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: "#c85a2a" }}>Zona de reparto</p>
        <h2 className="font-bold text-2xl mb-2" style={{ color: "#2d5a1b" }}>¿Llegamos a tu barrio?</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(46,46,30,0.5)" }}>
          Introduce tu dirección y te decimos si podemos llevarte el verde.
        </p>

        <div className="flex gap-2 mb-4 max-w-lg">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calcZone()}
            placeholder="Tu dirección en Madrid..."
            className="flex-1 border-0 border-b bg-transparent px-0 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ borderColor: "rgba(46,46,30,0.15)", color: "#2e2e1e" }}
          />
          <button
            onClick={calcZone}
            disabled={loading}
            className="text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-colors disabled:opacity-50"
            style={{ background: "#2d5a1b", color: "#f2ead8" }}
          >
            {loading ? "..." : "Calcular"}
          </button>
        </div>

        {rs && (
          <div className="mb-4 p-4 text-sm max-w-lg border" style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
            <strong className="block mb-1">{result.msg}</strong>
            {result.sub && <span className="text-xs opacity-80">{result.sub}</span>}
          </div>
        )}

        <div ref={mapRef} className="w-full border mb-6" style={{ height: 300, borderColor: "rgba(46,46,30,0.1)" }} />

        <div className="grid grid-cols-3 gap-3 max-w-lg">
          {[
            { z: "Zona 1", km: "Hasta 3 km", price: "2 €", bg: "#eef7eb", border: "#c0ddb8", color: "#1c3a10" },
            { z: "Zona 2", km: "3 – 6 km", price: "3,50 €", bg: "#fefae7", border: "#ecd870", color: "#7d5a00" },
            { z: "Zona 3", km: "6 – 10 km", price: "5 €", bg: "#fef0ec", border: "#f0c0b0", color: "#a03010" },
          ].map((z) => (
            <div key={z.z} className="p-3 border rounded-lg" style={{ background: z.bg, borderColor: z.border, color: z.color }}>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase opacity-70 mb-1">{z.z}</p>
              <p className="text-lg font-bold">{z.price}</p>
              <p className="text-[10px] opacity-60">{z.km}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
