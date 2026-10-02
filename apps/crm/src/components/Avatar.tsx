import { iniciales } from "@/lib/equipo";

/** Foto del empleado o, si no tiene, sus iniciales sobre negro. */
export function Avatar({
  nombre,
  foto,
  className = "h-12 w-12 text-sm",
}: {
  nombre: string;
  foto: string | null;
  className?: string;
}) {
  if (foto) {
    return (
      // Fotos de Storage con tamaño variable: next/image pediría declarar el
      // dominio de Supabase y no aporta nada en miniaturas de 48 px.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto} alt="" className={`${className} shrink-0 rounded-full bg-superficie-alta object-cover`} />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-texto font-semibold text-fondo`}
    >
      {iniciales(nombre)}
    </span>
  );
}
