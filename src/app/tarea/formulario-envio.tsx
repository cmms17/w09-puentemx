"use client";
import { useState } from "react";

type Decision = { titulo: string; explicacion: string };

export default function FormularioEnvio({ tareaId }: { tareaId: string }) {
  const [candidatoAlias, setCandidatoAlias] = useState("Fernanda Ruiz");
  const [facturasRevisadas, setFacturasRevisadas] = useState(24);
  const [facturasTotales, setFacturasTotales] = useState(24);
  const [decisiones, setDecisiones] = useState<Decision[]>([
    { titulo: "Factura #0091 duplicada en el folio", explicacion: "" },
    { titulo: "Factura #0104 sin IVA desglosado", explicacion: "" },
  ]);
  const [razonamiento, setRazonamiento] = useState("");
  const [slotPropuesto, setSlotPropuesto] = useState("Viernes, 11:00 am");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envioId, setEnvioId] = useState<string | null>(null);

  function actualizarDecision(i: number, campo: keyof Decision, valor: string) {
    setDecisiones((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [campo]: valor } : d))
    );
  }

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (decisiones.some((d) => !d.explicacion.trim()) || !razonamiento.trim()) {
      setError("Explica cada decisión de juicio y tu razonamiento antes de agendar la defensa.");
      return;
    }

    setEnviando(true);
    const resp = await fetch("/api/tarea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tareaId,
        candidatoAlias,
        facturasRevisadas,
        facturasTotales,
        decisiones,
        razonamiento,
        slotPropuesto,
      }),
    });
    setEnviando(false);

    if (!resp.ok) {
      setError("No se pudo enviar tu trabajo. Intenta de nuevo.");
      return;
    }
    const data = await resp.json();
    setEnvioId(data.envioId);
  }

  if (envioId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-4 py-4 text-center space-y-2">
        <p className="text-sm font-semibold text-[#14213d]">
          Trabajo enviado y defensa agendada para el {slotPropuesto}.
        </p>
        <p className="text-xs text-slate-500">
          Un revisor humano va a firmar tu verificación antes de emitir tu prueba portable. Tu
          folio de envío: <span className="font-mono">{envioId.slice(0, 8)}</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={alEnviar} className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#14213d]">Tu trabajo</h2>
        <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-900 rounded-full px-2 py-0.5">
          En revisión
        </span>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tu nombre</label>
        <input
          value={candidatoAlias}
          onChange={(e) => setCandidatoAlias(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
          required
        />
      </div>

      <div className="flex gap-3 text-xs">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Facturas revisadas
          </label>
          <input
            type="number"
            min={0}
            value={facturasRevisadas}
            onChange={(e) => setFacturasRevisadas(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Facturas totales
          </label>
          <input
            type="number"
            min={1}
            value={facturasTotales}
            onChange={(e) => setFacturasTotales(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
          />
        </div>
      </div>

      {decisiones.map((d, i) => (
        <div key={i} className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
          <p className="text-[11px] font-bold text-orange-900">
            Decisión de juicio #{i + 1}: {d.titulo}
          </p>
          <textarea
            value={d.explicacion}
            onChange={(e) => actualizarDecision(i, "explicacion", e.target.value)}
            placeholder="Explica por qué tomaste esta decisión..."
            className="w-full mt-1 border border-orange-200 rounded-lg px-2 py-1.5 text-[11px] bg-white"
            rows={2}
            required
          />
        </div>
      ))}

      <div>
        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
          Razonamiento para la defensa en vivo de 15 min
        </label>
        <textarea
          value={razonamiento}
          onChange={(e) => setRazonamiento(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
          Horario propuesto para tu defensa
        </label>
        <input
          value={slotPropuesto}
          onChange={(e) => setSlotPropuesto(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
          required
        />
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-[#14213d] text-white rounded-lg py-2.5 text-xs font-semibold disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Enviar y agendar defensa"}
      </button>
    </form>
  );
}
