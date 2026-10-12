import { notFound } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaPrueba({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = crearClienteSupabaseServidor();

  const { data: prueba } = await supabase
    .from("pruebas")
    .select(
      `id, generado_en,
       envios (
         id, candidato_alias, facturas_revisadas, facturas_totales, enviado_en, resumen_llm,
         tareas ( titulo, empleador_nombre, empleador_demo, supervisor_nombre, alcance ),
         decisiones_juicio ( id, titulo, explicacion ),
         defensas ( slot_propuesto ),
         verificaciones ( veredicto, comentario, revisor_email, firmado_en )
       )`
    )
    .eq("token", token)
    .maybeSingle();

  if (!prueba || !prueba.envios) {
    notFound();
  }

  const envio = Array.isArray(prueba.envios) ? prueba.envios[0] : prueba.envios;
  const tarea = Array.isArray(envio.tareas) ? envio.tareas[0] : envio.tareas;
  const verificacion = Array.isArray(envio.verificaciones)
    ? envio.verificaciones[0]
    : envio.verificaciones;
  const defensa = Array.isArray(envio.defensas) ? envio.defensas[0] : envio.defensas;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-[#14213d] text-white rounded-2xl px-5 py-4">
          <p className="text-[10px] uppercase tracking-wide text-[#9fb3d9] font-bold">
            Puente MX · Prueba portable
          </p>
          <h1 className="text-lg font-bold mt-1">{envio.candidato_alias}</h1>
          <p className="text-xs text-[#c7d2e8] mt-1">{tarea?.titulo}</p>
        </div>

        {tarea?.empleador_demo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-900 text-center font-semibold">
            Empleador, pagos y revisor de esta prueba son ficticios — demo del working slice. No
            implica oferta de empleo real.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
          <h2 className="text-xs font-bold text-[#14213d]">El trabajo</h2>
          <p className="text-xs text-slate-700">
            {envio.facturas_revisadas} de {envio.facturas_totales} facturas conciliadas para{" "}
            {tarea?.empleador_nombre}, bajo la supervisión de {tarea?.supervisor_nombre}.
          </p>
          <p className="text-[11px] text-slate-500">
            Fecha: {new Date(envio.enviado_en).toLocaleDateString("es-MX")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
          <h2 className="text-xs font-bold text-[#14213d]">Decisiones seleccionadas</h2>
          {envio.decisiones_juicio.map((d) => (
            <div key={d.id} className="text-[11px] text-slate-700">
              <span className="font-semibold">{d.titulo}:</span> {d.explicacion}
            </div>
          ))}
          {defensa && (
            <p className="text-[11px] text-slate-500">
              Defensa en vivo: {defensa.slot_propuesto}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
          <h2 className="text-xs font-bold text-[#14213d]">Verificación humana</h2>
          <p className="text-xs text-slate-700">
            Veredicto: <span className="font-semibold">{verificacion?.veredicto}</span>
          </p>
          <p className="text-[11px] text-slate-600">{verificacion?.comentario}</p>
          <p className="text-[11px] text-slate-500">
            Firmado por {verificacion?.revisor_email} el{" "}
            {verificacion?.firmado_en &&
              new Date(verificacion.firmado_en).toLocaleDateString("es-MX")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-1">
          <h2 className="text-xs font-bold text-[#14213d]">Uso de IA declarado</h2>
          <p className="text-[11px] text-slate-600">
            Un modelo de lenguaje resumió las decisiones de juicio del candidato para que el
            revisor humano las leyera más rápido. El modelo nunca emitió el veredicto — eso lo
            firmó una persona.
          </p>
        </div>

        <div className="bg-slate-100 rounded-2xl px-4 py-3 space-y-1">
          <h2 className="text-xs font-bold text-slate-700">Lo que esta prueba NO establece</h2>
          <p className="text-[11px] text-slate-600">
            No es una oferta de empleo, no garantiza una vacante futura, y no mide ingreso ni
            retención a largo plazo. Es evidencia verificada de un trabajo real y pagado,
            observado y firmado por un humano — nada más.
          </p>
        </div>

        <p className="text-[10px] text-slate-400 text-center px-2">
          Este link pertenece al candidato. Compartirlo con un empleador nuevo es su decisión, no
          de la plataforma.
        </p>
      </div>
    </main>
  );
}
