import type { ComponentType, ReactNode } from "react";
import type { estudio } from "@tinta/compartido/estudio";
import type { SeccionDe, Sitio, TipoSeccion } from "@tinta/compartido/web/esquema";
import type { Diseno } from "@tinta/compartido/tipos";

/**
 * Contrato que cumple cada plantilla (components/sitio/plantillas/<id>/index.tsx).
 *
 * Reglas:
 * - Componentes síncronos y sin nada de servidor: se pintan igual en la web
 *   pública (servidor) y en la vista previa del editor (cliente).
 * - Solo colores y fuentes de las variables --w-* (ver @tinta/compartido/web/tema).
 * - Si un campo de texto está vacío, ese elemento no se pinta (ni su hueco).
 * - `vista` = estamos dentro del editor: nada de enviar formularios de verdad.
 */

/** Pieza flash publicada (fila de `disenos` con `disponible = true`). */
export type DisenoPublico = Diseno;
export type ServicioWeb = (typeof estudio.servicios)[number];
export type ContactoWeb = typeof estudio.contacto;

export type DatosWeb = {
  /** Diseños disponibles, ya ordenados por `orden`. */
  disenos: DisenoPublico[];
  /** Servicios del estudio (config estática). */
  servicios: readonly ServicioWeb[];
  /** Dirección, horario, email, teléfono, instagram… */
  contacto: ContactoWeb;
};

export type PropsSeccion<T extends TipoSeccion> = {
  seccion: SeccionDe<T>;
  sitio: Sitio;
  datos: DatosWeb;
  vista: boolean;
  /** Posición entre las secciones visibles (0 = la primera). Útil para numerar o alternar fondos. */
  indice: number;
};

export type PropsMarco = {
  sitio: Sitio;
  datos: DatosWeb;
  vista: boolean;
  /** Las secciones ya pintadas. El marco las mete en <main id="contenido">. */
  children: ReactNode;
};

export type DefinicionPlantilla = {
  /** Cabecera con menú + <main> + pie. */
  Marco: ComponentType<PropsMarco>;
  secciones: { [K in TipoSeccion]: ComponentType<PropsSeccion<K>> };
};
