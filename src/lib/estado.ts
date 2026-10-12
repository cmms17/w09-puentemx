// Estado de un envío (enviado → defensa agendada → verificado → prueba
// emitida). Igual que calcularEstadoIncidente() en w08 (Primera Hora),
// esto NUNCA se guarda como columna — se calcula en cada lectura a partir
// de qué filas relacionadas existen. Un estado derivado de datos reales
// no se puede "no ejecutar"; una máquina de estados que depende de un
// cron en segundo plano sí puede fallar en silencio. Ver PACKET.md
// sección 10 (Dragon Stack, el diferenciador).
export type EstadoEnvio =
  | "enviado"
  | "defensa_agendada"
  | "verificado"
  | "prueba_emitida";

export function calcularEstadoEnvio(envio: {
  tieneDefensa: boolean;
  tieneVerificacion: boolean;
  tienePrueba: boolean;
}): EstadoEnvio {
  if (envio.tienePrueba) return "prueba_emitida";
  if (envio.tieneVerificacion) return "verificado";
  if (envio.tieneDefensa) return "defensa_agendada";
  return "enviado";
}

export const ETIQUETA_ESTADO: Record<EstadoEnvio, string> = {
  enviado: "Enviado",
  defensa_agendada: "Defensa agendada",
  verificado: "Verificado",
  prueba_emitida: "Prueba emitida",
};
