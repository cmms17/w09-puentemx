import { redirect } from "next/navigation";
import { crearClienteSupabaseAuth } from "@/lib/supabase/server-auth";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { calcularEstadoEnvio } from "@/lib/estado";
import CerrarSesion from "./cerrar-sesion";
import ListaEnvios from "./lista-envios";

export const dynamic = "force-dynamic";

export default async function PanelRevision() {
  const supabaseAuth = await crearClienteSupabaseAuth();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/panel/login");
  }

  const supabase = crearClienteSupabaseServidor();
  const { data: envios, error: errorEnvios } = await supabase
    .from("envios")
    .select(
      `id, candidato_alias, facturas_revisadas, facturas_totales, resumen_llm, enviado_en,
       tareas ( titulo, empleador_nombre, compensacion_mxn ),
       decisiones_juicio ( id, titulo, explicacion ),
       defensas ( id, slot_propuesto ),
       verificaciones ( id, veredicto, comentario, revisor_email, firmado_en ),
       pruebas ( id, token )`
    )
    .order("enviado_en", { ascending: false });

  if (errorEnvios) {
    console.error("Error consultando envíos:", errorEnvios);
  }

  const conEstado = (envios ?? []).map((e) => ({
    ...e,
    estado: calcularEstadoEnvio({
      tieneDefensa: (e.defensas?.length ?? 0) > 0,
      tieneVerificacion: (e.verificaciones?.length ?? 0) > 0,
      tienePrueba: (e.pruebas?.length ?? 0) > 0,
    }),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Panel de revisión</h1>
            <p className="text-xs text-slate-500">
              El sistema nunca certifica solo — tú firmas cada veredicto.
            </p>
          </div>
          <CerrarSesion />
        </div>
        <ListaEnvios envios={conEstado} />
      </div>
    </main>
  );
}
