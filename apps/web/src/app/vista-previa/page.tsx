import type { Metadata } from "next";
import { VistaPrevia } from "@/components/sitio/VistaPrevia";
import { clasesFuentesSitio } from "@/lib/fuentes-sitio";
import { datosWeb } from "@/lib/sitio";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false, follow: false } };

/**
 * Página que el editor del CRM mete en un iframe (otro origen). No lee el
 * borrador: lo recibe por postMessage, así enseña cada cambio al instante.
 * Los diseños, servicios y contacto son los públicos.
 */
export default async function PaginaVistaPrevia() {
  const datos = await datosWeb();
  return (
    <div className={clasesFuentesSitio}>
      <VistaPrevia datos={datos} />
    </div>
  );
}
