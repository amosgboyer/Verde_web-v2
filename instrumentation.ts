// SOLO RAMA DE PRUEBA: reloj del servidor adelantado (ver lib/reloj-prueba.ts).
export async function register() {
  const { instalarRelojServidor } = await import("./lib/reloj-prueba");
  instalarRelojServidor();
}
