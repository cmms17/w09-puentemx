import "server-only";
import { GoogleGenAI, FunctionCallingConfigMode, Type, type FunctionDeclaration } from "@google/genai";
import { z } from "zod";

// Mismo modelo y mismo patrón de llamada de función forzada que Primera
// Hora (w08) — ver docs/PACKET.md, Arquitectura + stack. El LLM aquí
// NUNCA emite un veredicto de capacidad: solo redacta un resumen alineado
// a la rúbrica de las decisiones de juicio que el propio candidato ya
// explicó, para que el revisor humano lea más rápido antes de firmar.
// Si la IA falla por cualquier motivo, el envío de la tarea nunca debe
// fallar solo por eso — se usa un resumen de respaldo.
const MODELO = "gemini-3.8-flash";

const esquemaResumen = z.object({
  resumen: z.string().min(1),
  banderas: z.array(z.string()).max(4),
});

export type ResumenRevision = z.infer<typeof esquemaResumen>;

const RESUMEN_RESPALDO: ResumenRevision = {
  resumen:
    "No se pudo generar un resumen automático esta vez. Lee directamente las decisiones de juicio del candidato antes de firmar.",
  banderas: [],
};

const declaracionResumir: FunctionDeclaration = {
  name: "resumir_para_revisor",
  description:
    "Registra un resumen corto, alineado a una rúbrica, de las decisiones de juicio del candidato — nunca un veredicto de aprobación.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      resumen: {
        type: Type.STRING,
        description:
          "2-4 oraciones en español resumiendo lo que el candidato decidió y por qué, en lenguaje neutral — sin emitir juicio de si está bien o mal.",
      },
      banderas: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "0 a 4 puntos cortos que el revisor debería verificar con más cuidado antes de firmar (ej. 'confirmar que la factura #0104 sí carecía de IVA desglosado'). Nunca una recomendación de aprobar o rechazar.",
      },
    },
    required: ["resumen", "banderas"],
  },
};

export async function resumirParaRevisor(datos: {
  tareaTitulo: string;
  facturasRevisadas: number;
  facturasTotales: number;
  decisiones: { titulo: string; explicacion: string }[];
  razonamiento: string;
}): Promise<ResumenRevision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Falta GEMINI_API_KEY — usando resumen de respaldo.");
    return RESUMEN_RESPALDO;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const decisionesTexto = datos.decisiones
      .map((d, i) => `${i + 1}. ${d.titulo}: ${d.explicacion}`)
      .join("\n");

    const respuesta = await ai.models.generateContent({
      model: MODELO,
      contents:
        "Eres un asistente que ayuda a un revisor humano de Puente MX a leer más rápido el " +
        "trabajo de un candidato antes de una defensa en vivo de 15 minutos. SIEMPRE en español. " +
        "Nunca certificas ni calificas la capacidad del candidato — eso lo decide el revisor " +
        "humano, nunca tú. Tu única función es organizar la información para que el revisor " +
        "llegue más preparado.\n\n" +
        `Tarea: ${datos.tareaTitulo}\n` +
        `Facturas revisadas: ${datos.facturasRevisadas} de ${datos.facturasTotales}\n` +
        `Decisiones de juicio explicadas por el candidato:\n${decisionesTexto}\n\n` +
        `Razonamiento adicional del candidato: ${datos.razonamiento}\n\n` +
        "Redacta el resumen y, si aplica, hasta 4 banderas de verificación.",
      config: {
        tools: [{ functionDeclarations: [declaracionResumir] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ["resumir_para_revisor"],
          },
        },
      },
    });

    const llamada = respuesta.functionCalls?.[0];
    if (!llamada || !llamada.args) {
      console.error("La IA no devolvió una llamada de función — usando respaldo.");
      return RESUMEN_RESPALDO;
    }

    const resultado = esquemaResumen.safeParse(llamada.args);
    if (!resultado.success) {
      console.error("Resumen de la IA no pasó validación:", resultado.error.message);
      return RESUMEN_RESPALDO;
    }

    return resultado.data;
  } catch (err) {
    console.error("Error llamando a la IA de resumen:", err);
    return RESUMEN_RESPALDO;
  }
}
