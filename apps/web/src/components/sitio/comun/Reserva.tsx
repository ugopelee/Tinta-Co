"use client";

import { FormularioReserva } from "@/components/FormularioReserva";
import type { DatosWeb } from "../contrato";

/**
 * El formulario de reserva real de la web. Sus campos usan los tokens
 * oscuros de la web (text-texto, bg-fondo…), así que va sobre una placa
 * oscura propia: se lee igual en las tres plantillas, también en la clara.
 *
 * En modo `vista` (iframe del editor) se puede rellenar y probar, pero el
 * envío se frena: no debe crear solicitudes reales desde la vista previa.
 */
export function Reserva({ datos, vista }: { datos: DatosWeb; vista: boolean }) {
  return (
    <div
      id="formulario-reserva"
      className="scroll-mt-24 rounded-[var(--w-radio,0.5rem)] bg-[#08080a] p-6 text-texto md:p-8"
      // React ejecuta la acción del formulario después de los onSubmit: con
      // preventDefault aquí no llega a ejecutarse.
      onSubmit={vista ? (e) => e.preventDefault() : undefined}
    >
      {vista && (
        <p className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-tenue">
          Vista previa · el formulario no envía nada
        </p>
      )}
      <FormularioReserva disenos={datos.disenos} />
    </div>
  );
}
