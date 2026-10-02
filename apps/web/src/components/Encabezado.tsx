import { Revelar } from "@/components/animaciones";

/**
 * Cabecera de sección: rótulo con línea, titular mitad grotesca y mitad
 * serif en cursiva, y una frase en gris. Todas las secciones hablan igual.
 */
export function Encabezado({
  etiqueta,
  titulo,
  cursiva,
  descripcion,
  nivel = 2,
}: {
  etiqueta: string;
  titulo: string;
  cursiva: string;
  descripcion?: string;
  nivel?: 1 | 2;
}) {
  const Titulo = nivel === 1 ? "h1" : "h2";

  return (
    <div className="max-w-xl">
      <Revelar>
        <p className="etiqueta flex items-center gap-3">
          <span className="h-px w-8 bg-white/20" />
          {etiqueta}
        </p>
      </Revelar>
      <Revelar retardo={80}>
        <Titulo className="titular mt-5 text-[clamp(2.3rem,5vw,3.8rem)] leading-[1.02]">
          {titulo} <span className="serif-cursiva text-[1.08em]">{cursiva}</span>
        </Titulo>
      </Revelar>
      {descripcion && (
        <Revelar retardo={160}>
          <p className="parrafo mt-5 max-w-md text-[0.95rem] text-tenue">{descripcion}</p>
        </Revelar>
      )}
    </div>
  );
}
