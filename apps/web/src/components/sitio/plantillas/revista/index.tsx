import type { DefinicionPlantilla } from "../../contrato";
import { Marco } from "./Marco";
import { Cifras, Galeria, Llamada, Portada, Preguntas, Texto, Ventajas } from "./secciones-contenido";
import { Estudio, Flash, ReservaSeccion, Servicios } from "./secciones-datos";

/**
 * Plantilla «Revista»: clara y editorial, el estudio contado como una revista.
 * Cabecera con cintillo y regla doble, titulares serif con una palabra en
 * cursiva (*palabra* en el editor), fotos a sangre, notas al margen, capitular
 * y folio al pie de cada sección.
 */
export const revista: DefinicionPlantilla = {
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
