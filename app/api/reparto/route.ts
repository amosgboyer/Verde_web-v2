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
      console.error("[reparto] settings", e);
      return FALLBACK_EVENTO;
    }),
    getRepartoPublico().catch((e) => {
      console.error("[reparto] lista", e);
      return null;
    }),
  ]);
  return NextResponse.json(
    { evento, gente: gente ?? [], listaDisponible: gente !== null },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// POST → apuntarse (o actualizar si el teléfono ya estaba).
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
      return NextResponse.json({ success: true, updated: false });
    }

    const { updated } = await saveReparto(parsed);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0]?.message ?? "Revisa los datos.";
      return NextResponse.json({ error: first }, { status: 422 });
    }
    console.error("[reparto]", error);
    return NextResponse.json(
      { error: "No hemos podido guardarlo. Inténtalo en un momento o escríbenos por WhatsApp." },
      { status: 500 }
    );
  }
}
