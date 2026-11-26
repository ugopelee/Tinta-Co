import type { DefinicionPlantilla } from "../../contrato";
import { Marco } from "./Marco";
import { Estudio, Flash, ReservaSeccion, Servicios } from "./datos";
import { Cifras, Galeria, Llamada, Portada, Preguntas, Texto, Ventajas } from "./secciones";

/**
 * Lámina: oscura y entintada, como una hoja de flash de tatuador. Marcos de
 * línea fina con marcas de registro, números de pieza «Nº 01», rótulos en
 * mono, esquinas rectas y titulares condensados y apretados.
 * Solo pinta con las variables --w-* del tema (ver @tinta/compartido/web/tema).
 */
export const lamina: DefinicionPlantilla = {
  Marco,
  secciones: {
    portada: Portada,
    texto: Texto,
    ventajas: Ventajas,
    cifras: Cifras,
    galeria: Galeria,
    servicios: Servicios,
    flash: Flash,
    estudio: Estudio,
    preguntas: Preguntas,
    llamada: Llamada,
    reserva: ReservaSeccion,
  },
};
