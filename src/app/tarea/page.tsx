import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import FormularioEnvio from "./formulario-envio";

export const dynamic = "force-dynamic";

export default async function PaginaTarea() {
  const supabase = crearClienteSupabaseServidor();
  const { data: tarea } = await supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, empleador_nombre, empleador_demo, compensacion_mxn, supervisor_nombre, alcance"
    )
    .order("creado_en", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!tarea) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">
          No hay ninguna tarea de demo todavía. Corre la migración de Supabase primero.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-[#14213d] text-white rounded-2xl px-5 py-4">
          <p className="text-[10px] uppercase tracking-wide text-[#9fb3d9] font-bold">
            Puente MX · Proyecto pagado
          </p>
          <h1 className="text-lg font-bold mt-1">{tarea.titulo}</h1>
          <p className="text-xs text-[#c7d2e8] mt-1">
            {tarea.empleador_nombre} · tú
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-[#14213d]">Alcance del empleador</h2>
            {tarea.empleador_demo && (
              <span className="text-[9px] font-extrabold bg-amber-200 text-amber-900 rounded-full px-2 py-0.5">
                SOLO DEMO
              </span>
            )}
          </div>
          <dl className="text-xs text-slate-700 divide-y divide-dashed divide-slate-200">
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Tarea</dt>
              <dd className="font-semibold">{tarea.alcance}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Compensación</dt>
              <dd className="font-semibold">${tarea.compensacion_mxn} MXN (declarada)</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Supervisor</dt>
              <dd className="font-semibold">{tarea.supervisor_nombre}</dd>
            </div>
          </dl>
        </div>

        <FormularioEnvio tareaId={tarea.id} />

        <p className="text-[10px] text-slate-400 text-center px-2">
          Empleador, pagos y datos de esta pantalla son ficticios — demo del working slice.
          Prueba portable: no implica oferta de empleo real.
        </p>
      </div>
    </main>
  );
}
