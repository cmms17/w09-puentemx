import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { resumirParaRevisor } from "@/lib/llm";

// Validación de entrada — Security Floor, PACKET.md sección 11. Ninguna
// decisión de juicio ni el razonamiento pueden llegar vacíos.
const esquemaEnvio = z.object({
  tareaId: z.string().uuid(),
  candidatoAlias: z.string().min(1).max(80),
  facturasRevisadas: z.number().int().min(0).max(999),
  facturasTotales: z.number().int().min(1).max(999),
  decisiones: z
    .array(
      z.object({
        titulo: z.string().min(1).max(200),
        explicacion: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(10),
  razonamiento: z.string().min(1).max(4000),
  slotPropuesto: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const cuerpo = await request.json();
  const resultado = esquemaEnvio.safeParse(cuerpo);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Datos de envío inválidos.", detalles: resultado.error.flatten() },
      { status: 400 }
    );
  }
  const datos = resultado.data;

  const supabase = crearClienteSupabaseServidor();

  const { data: tarea } = await supabase
    .from("tareas")
    .select("titulo")
    .eq("id", datos.tareaId)
    .single();

  if (!tarea) {
    return NextResponse.json({ error: "La tarea no existe." }, { status: 404 });
  }

  // El resumen del LLM se calcula ANTES de insertar, para no dejar un
  // envío a medio escribir si la IA tarda — pero si falla, igual se
  // guarda el envío con el resumen de respaldo (nunca se bloquea el
  // trabajo real del candidato por una falla de la IA).
  const resumen = await resumirParaRevisor({
    tareaTitulo: tarea.titulo,
    facturasRevisadas: datos.facturasRevisadas,
    facturasTotales: datos.facturasTotales,
    decisiones: datos.decisiones,
    razonamiento: datos.razonamiento,
  });

  const { data: envio, error: errorEnvio } = await supabase
    .from("envios")
    .insert({
      tarea_id: datos.tareaId,
      candidato_alias: datos.candidatoAlias,
      facturas_revisadas: datos.facturasRevisadas,
      facturas_totales: datos.facturasTotales,
      resumen_llm: `${resumen.resumen}${
        resumen.banderas.length ? "\n\nBanderas: " + resumen.banderas.join(" · ") : ""
      }`,
    })
    .select("id")
    .single();

  if (errorEnvio || !envio) {
    console.error("Error insertando envío:", errorEnvio);
    return NextResponse.json({ error: "No se pudo guardar el envío." }, { status: 500 });
  }

  const decisionesParaInsertar = datos.decisiones.map((d) => ({
    envio_id: envio.id,
    titulo: d.titulo,
    explicacion: d.explicacion,
  }));
  const { error: errorDecisiones } = await supabase
    .from("decisiones_juicio")
    .insert(decisionesParaInsertar);

  if (errorDecisiones) {
    console.error("Error insertando decisiones de juicio:", errorDecisiones);
    return NextResponse.json(
      { error: "El envío se guardó pero las decisiones de juicio no." },
      { status: 500 }
    );
  }

  // Agenda la defensa en el mismo request — "simulated defense record"
  // per el Blueprint sección 5. No hay integración real de calendario.
  const { error: errorDefensa } = await supabase.from("defensas").insert({
    envio_id: envio.id,
    slot_propuesto: datos.slotPropuesto,
  });

  if (errorDefensa) {
    console.error("Error agendando defensa:", errorDefensa);
  }

  return NextResponse.json({ envioId: envio.id });
}
