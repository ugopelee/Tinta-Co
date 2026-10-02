import { colorEstado, nombresEstado, type EstadoConsentimiento } from "@/lib/consentimientos";

/** Mismo aro hueco que los estados de cita, para leerse igual. */
export function PastillaConsentimiento({ estado }: { estado: EstadoConsentimiento }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-superficie-alta px-2.5 py-1 text-xs font-medium">
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full border-2"
        style={{ borderColor: colorEstado[estado] }}
      />
      {nombresEstado[estado]}
    </span>
  );
}
