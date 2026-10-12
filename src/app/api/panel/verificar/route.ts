import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteSupabaseAuth } from "@/lib/supabase/server-auth";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

const esquemaVerificacion = z.object({
  envioId: z.string().uuid(),
  veredicto: z.enum(["aprobado", "rechazado", "matizado"]),
  comentario: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  // Auth: solo un revisor con sesión puede firmar — Security Floor,
  // PACKET.md sección 11. Esta ruta nunca se expone sin sesión.
  const supabaseAuth = await crearClienteSupabaseAuth();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const cuerpo = await request.json();
  const resultado = esquemaVerificacion.safeParse(cuerpo);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Datos de verificación inválidos.", detalles: resultado.error.flatten() },
      { status: 400 }
    );
  }
  const datos = resultado.data;

  const supabase = crearClienteSupabaseServidor();

  // No se puede emitir una prueba sin un envío real que verificar — y el
  // envío debe tener una defensa agendada antes de que se pueda firmar
  // (el loop del Blueprint: observado → defensa → verificación). Esto
  // bloquea el salto de estado directamente en la ruta, no solo en la UI.
  const { data: envio } = await supabase
    .from("envios")
    .select("id, defensas(id)")
    .eq("id", datos.envioId)
    .maybeSingle();

  if (!envio) {
    return NextResponse.json({ error: "El envío no existe." }, { status: 404 });
  }
  if (!envio.defensas || (Array.isArray(envio.defensas) && envio.defensas.length === 0)) {
    return NextResponse.json(
      { error: "Este envío todavía no tiene una defensa agendada." },
      { status: 409 }
    );
  }

  const { error: errorVerificacion } = await supabase.from("verificaciones").insert({
    envio_id: datos.envioId,
    revisor_email: user.email,
    veredicto: datos.veredicto,
    comentario: datos.comentario,
  });

  if (errorVerificacion) {
    // Conflicto de llave única = ya existe una verificación para este envío.
    console.error("Error insertando verificación:", errorVerificacion);
    return NextResponse.json(
      { error: "No se pudo guardar la verificación (¿ya estaba firmada?)." },
      { status: 500 }
    );
  }

  // La prueba portable se genera en el mismo instante en que el revisor
  // firma — nunca antes, nunca por separado. Ver PACKET.md sección 10.
  const { data: prueba, error: errorPrueba } = await supabase
    .from("pruebas")
    .insert({ envio_id: datos.envioId })
    .select("token")
    .single();

  if (errorPrueba || !prueba) {
    console.error("Error generando prueba:", errorPrueba);
    return NextResponse.json(
      { error: "La verificación se guardó pero la prueba no se pudo emitir." },
      { status: 500 }
    );
  }

  return NextResponse.json({ token: prueba.token });
}
