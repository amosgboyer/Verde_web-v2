import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  getRepartoEvento,
  getRepartoPublico,
  repartoSchema,
  saveReparto,
  type RepartoEvento,
} from "@/lib/reparto";

export const dynamic = "force-dynamic";

/**
 * Los errores de googleapis incluyen la petición completa (nombre, teléfono…).
 * En los logs de Vercel guardamos solo el código y el mensaje, nunca el cuerpo.
 */
function errorSinDatos(e: unknown): string {
  const err = e as { code?: unknown; status?: unknown; message?: unknown };
  const code = err?.code ?? err?.status ?? "";
  const msg = typeof err?.message === "string" ? err.message.slice(0, 160) : "error";
  return `${code} ${msg}`.trim();
}

const NO_CACHE = { "Cache-Control": "no-store" };

const FALLBACK_EVENTO: RepartoEvento = {
  fecha: "Lunes 5 de octubre",
  hora: "",
  lugar: "",
  abierto: true,
};

// GET → datos del día + quién va y qué trae (sin teléfonos).
export async function GET() {
  const [evento, gente] = await Promise.all([
    getRepartoEvento().catch((e) => {
      console.error("[reparto] settings:", errorSinDatos(e));
      return FALLBACK_EVENTO;
    }),
    getRepartoPublico().catch((e) => {
      console.error("[reparto] lista:", errorSinDatos(e));
      return null;
    }),
  ]);
  return NextResponse.json(
    { evento, gente: gente ?? [], listaDisponible: gente !== null },
    { headers: NO_CACHE }
  );
}

// POST → apuntarse. Siempre añade una fila; nunca lee ni devuelve datos de nadie.
export async function POST(req: NextRequest) {
  try {
    const evento = await getRepartoEvento().catch(() => FALLBACK_EVENTO);
    if (!evento.abierto) {
      return NextResponse.json(
        { error: "Las inscripciones para este reparto ya están cerradas. ¡Gracias!" },
        { status: 403 }
      );
    }

    const parsed = repartoSchema.parse(await req.json());
    if (parsed.web) {
      // Bot: respondemos como si nada, sin guardar.
      return NextResponse.json({ success: true }, { headers: NO_CACHE });
    }

    await saveReparto(parsed);
    return NextResponse.json({ success: true }, { headers: NO_CACHE });
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0]?.message ?? "Revisa los datos.";
      return NextResponse.json({ error: first }, { status: 422 });
    }
    console.error("[reparto] no se pudo guardar:", errorSinDatos(error));
    return NextResponse.json(
      { error: "No hemos podido guardarlo. Inténtalo en un momento o escríbenos por WhatsApp." },
      { status: 500 }
    );
  }
}
