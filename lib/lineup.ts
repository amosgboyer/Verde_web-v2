// Regla ÚNICA de cuándo una fila del lineup de Black Friday puede cambiar el
// día de entrega del pedido. Fallo real 27-11: un cliente con el pedido para el
// domingo añadió los Tigrillos desde la fila del viernes y TODO el pedido pasó
// al viernes. Regla: el día del pedido solo lo cambia el cliente a propósito.
//
//  · Hay día elegido y la fila AÑADE platos  → "respetar": se añaden y el día no se toca.
//  · No hay día elegido                      → "elegir": se usa el día de la fila.
//  · La fila es solo un día (sin platos)     → "elegir": es elegir día a propósito.
export type DecisionDia = "respetar" | "elegir" | "nada";

export function decidirDiaLineup(opts: {
  diaActual: string; // "" si el pedido aún no tiene día (o es automático, modo «hoy»)
  fechaFila?: string;
  hayPlatos: boolean;
}): DecisionDia {
  const { diaActual, fechaFila, hayPlatos } = opts;
  if (!fechaFila) return "nada";
  if (diaActual && diaActual !== fechaFila && hayPlatos) return "respetar";
  return "elegir";
}
