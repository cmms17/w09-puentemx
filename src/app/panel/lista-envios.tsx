"use client";
import { useState } from "react";
import { ETIQUETA_ESTADO, type EstadoEnvio } from "@/lib/estado";

type Envio = {
  id: string;
  candidato_alias: string;
  facturas_revisadas: number;
  facturas_totales: number;
  resumen_llm: string | null;
  enviado_en: string;
  estado: EstadoEnvio;
  tareas: { titulo: string; empleador_nombre: string; compensacion_mxn: number } | { titulo: string; empleador_nombre: string; compensacion_mxn: number }[] | null;
  decisiones_juicio: { id: string; titulo: string; explicacion: string }[];
  defensas: { id: string; slot_propuesto: string }[];
  verificaciones: { id: string; veredicto: string; comentario: string; revisor_email: string; firmado_en: string }[];
  pruebas: { id: string; token: string }[];
};

function tareaDe(envio: Envio) {
  return Array.isArray(envio.tareas) ? envio.tareas[0] : envio.tareas;
}

const COLOR_ESTADO: Record<EstadoEnvio, string> = {
  enviado: "bg-slate-200 text-slate-700",
  defensa_agendada: "bg-indigo-100 text-indigo-900",
  verificado: "bg-amber-100 text-amber-900",
  prueba_emitida: "bg-emerald-100 text-emerald-900",
};

export default function ListaEnvios({ envios }: { envios: Envio[] }) {
  if (envios.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay envíos.</p>;
  }

  return (
    <div className="space-y-3">
      {envios.map((envio) => (
        <FilaEnvio key={envio.id} envio={envio} />
      ))}
    </div>
  );
}

function FilaEnvio({ envio }: { envio: Envio }) {
  const tarea = tareaDe(envio);
  const [veredicto, setVeredicto] = useState<"aprobado" | "rechazado" | "matizado">("aprobado");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(envio.pruebas[0]?.token ?? null);

  const yaVerificado = envio.verificaciones.length > 0;

  async function firmar(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) {
      setError("Escribe un comentario antes de firmar.");
      return;
    }
    setError(null);
    setEnviando(true);
    const resp = await fetch("/api/panel/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envioId: envio.id, veredicto, comentario }),
    });
    setEnviando(false);
    if (!resp.ok) {
      const data = await resp.json().catch(() => null);
      setError(data?.error ?? "No se pudo firmar la verificación.");
      return;
    }
    const data = await resp.json();
    setToken(data.token);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{tarea?.titulo ?? "Tarea"}</p>
          <p className="text-xs text-slate-500">
            {envio.candidato_alias} · {tarea?.empleador_nombre}
          </p>
        </div>
        <span className={`text-[9px] font-extrabold rounded-full px-2 py-0.5 ${COLOR_ESTADO[envio.estado]}`}>
          {ETIQUETA_ESTADO[envio.estado]}
        </span>
      </div>

      <p className="text-xs text-slate-600">
        {envio.facturas_revisadas} / {envio.facturas_totales} facturas revisadas
      </p>

      {envio.resumen_llm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-700 whitespace-pre-line">
          <span className="font-semibold">Resumen (IA, no es un veredicto): </span>
          {envio.resumen_llm}
        </div>
      )}

      <div className="space-y-1">
        {envio.decisiones_juicio.map((d) => (
          <div key={d.id} className="text-[11px] text-slate-700">
            <span className="font-semibold">{d.titulo}:</span> {d.explicacion}
          </div>
        ))}
      </div>

      {envio.defensas[0] && (
        <p className="text-[11px] text-slate-500">
          Defensa agendada: {envio.defensas[0].slot_propuesto}
        </p>
      )}

      {token ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[11px] text-emerald-900">
          Prueba emitida. Link portable:{" "}
          <a href={`/prueba/${token}`} className="underline font-mono">
            /prueba/{token.slice(0, 8)}…
          </a>
        </div>
      ) : yaVerificado ? (
        <p className="text-[11px] text-slate-500">Verificado, generando prueba...</p>
      ) : (
        <form onSubmit={firmar} className="space-y-2 border-t border-dashed border-slate-200 pt-2">
          <div className="flex gap-2 text-[11px]">
            {(["aprobado", "matizado", "rechazado"] as const).map((v) => (
              <label key={v} className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`veredicto-${envio.id}`}
                  checked={veredicto === v}
                  onChange={() => setVeredicto(v)}
                />
                {v}
              </label>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario de verificación (obligatorio)..."
            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[11px]"
            rows={2}
          />
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-[#14213d] text-white rounded-lg py-1.5 text-[11px] font-semibold disabled:opacity-60"
          >
            {enviando ? "Firmando..." : "Firmar verificación"}
          </button>
        </form>
      )}
    </div>
  );
}
