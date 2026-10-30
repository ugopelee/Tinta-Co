import type { Fichaje } from "@tinta/compartido/tipos";
import { diaDe, duracion, fechaCorta, hora, minutos } from "@/lib/equipo";

/** Últimos fichajes: el día sobre el tramo horario y la duración a la derecha. */
export function ListaFichajes({
  fichajes,
  vacio,
}: {
  fichajes: Pick<Fichaje, "id" | "entrada" | "salida">[];
  vacio: string;
}) {
  if (fichajes.length === 0) {
    return <p className="fila px-4 py-6 text-center text-sm text-tenue">{vacio}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {fichajes.slice(0, 8).map((fichaje) => (
        <li key={fichaje.id} className="fila flex items-center justify-between gap-3 px-4 py-2 text-sm">
          <span className="min-w-0">
            <span className="block">{fechaCorta(diaDe(fichaje.entrada))}</span>
            <span className="cifra block text-xs text-tenue">
              {hora(fichaje.entrada)} → {fichaje.salida ? hora(fichaje.salida) : "dentro"}
            </span>
          </span>
          <span className="cifra whitespace-nowrap font-medium">{duracion(minutos(fichaje))}</span>
        </li>
      ))}
    </ul>
  );
}
