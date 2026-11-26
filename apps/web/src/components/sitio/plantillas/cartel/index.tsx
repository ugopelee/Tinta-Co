import type { DefinicionPlantilla } from "../../contrato";
import { Marco } from "./marco";
import { Cifras, Galeria, Llamada, Portada, Preguntas, Texto, Ventajas } from "./secciones";
import { Estudio, Flash, ReservaSeccion, Servicios } from "./secciones-datos";

/**
 * Plantilla «Cartel»: póster de convención de tatuaje. Titulares góticos
 * enormes, bloques de color planos que alternan fondo / acento / tinta,
 * sellos redondos torcidos, boletos con talón y reglas gruesas.
 */
export const cartel: DefinicionPlantilla = {
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
