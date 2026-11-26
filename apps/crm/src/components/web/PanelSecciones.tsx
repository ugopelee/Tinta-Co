"use client";

import { useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Database,
  GripVertical,
  Ellipsis,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SECCIONES, infoSeccion, nuevoId } from "@tinta/compartido/web/catalogo";
import type { Seccion, Sitio } from "@tinta/compartido/web/esquema";
import { EditorCampos, type Ancla } from "./Campos";
import { IconoSeccion, claseBotonIcono } from "./Piezas";
import { conSeccion, mover, tituloDe, type Cambiar } from "./historial";

const etiquetaFila = (x: Seccion) => {
  const t = tituloDe(x);
  return t ? `${infoSeccion(x.tipo).nombre}: ${t}` : infoSeccion(x.tipo).nombre;
};

/** Mueve el foco a un elemento que aparecerá en el siguiente pintado. */
const enfocarLuego = (selector: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: false }));

/* ------------------------------------------------------------------
   Fila de la lista
   ------------------------------------------------------------------ */

function Fila({
  x,
  indice,
  total,
  idAyuda,
  alAbrir,
  alVisible,
  alMover,
  alDuplicar,
  alEliminar,
}: {
  x: Seccion;
  indice: number;
  total: number;
  idAyuda: string;
  alAbrir: () => void;
  alVisible: () => void;
  alMover: (hasta: number) => void;
  alDuplicar: () => void;
  alEliminar: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: x.id });
  const info = infoSeccion(x.tipo);
  const titulo = tituloDe(x);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative flex items-center gap-0.5 rounded-lg pr-1 transition-colors duration-150 hover:bg-superficie-alta ${
        isDragging ? "z-10 bg-superficie-alta shadow-sm" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-roledescription="sección ordenable"
        aria-label={`Mover ${etiquetaFila(x)}`}
        aria-describedby={idAyuda}
        className="grid h-12 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-tenue hover:text-texto active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <button
        type="button"
        data-fila={x.id}
        onClick={alAbrir}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-2 text-left"
      >
        <span className={`grid size-8 shrink-0 place-items-center rounded-md bg-superficie-alta group-hover:bg-superficie ${x.visible ? "text-texto" : "text-tenue"}`}>
          <IconoSeccion nombre={info.icono} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-xs text-tenue">
            <span className="truncate">{info.nombre}</span>
            {!x.visible && <span className="shrink-0 font-semibold">· Oculta</span>}
          </span>
          <span className={`truncate text-sm font-medium ${x.visible ? "text-texto" : "text-tenue line-through decoration-tenue/60"}`}>
            {titulo || <span className="font-normal italic text-tenue">Sin título</span>}
          </span>
        </span>
        <span className="sr-only">. Editar</span>
      </button>

      <button
        type="button"
        onClick={alVisible}
        aria-pressed={!x.visible}
        aria-label={x.visible ? `Ocultar ${etiquetaFila(x)}` : `Mostrar ${etiquetaFila(x)}`}
        title={x.visible ? "Ocultar en la web" : "Mostrar en la web"}
        className={claseBotonIcono}
      >
        {x.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Más acciones de ${etiquetaFila(x)}`} className={claseBotonIcono}>
            <Ellipsis aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={alAbrir}>
            <Pencil aria-hidden /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => alMover(indice - 1)} disabled={indice === 0}>
            <ArrowUp aria-hidden /> Subir
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => alMover(indice + 1)} disabled={indice === total - 1}>
            <ArrowDown aria-hidden /> Bajar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={alDuplicar}>
            <Copy aria-hidden /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={alEliminar} className="text-acento focus:bg-acento-suave focus:text-acento">
            <Trash2 aria-hidden /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/* ------------------------------------------------------------------
   Lista ordenable
   ------------------------------------------------------------------ */

function Lista({
  sitio,
  cambiar,
  alAbrir,
  alCatalogo,
}: {
  sitio: Sitio;
  cambiar: Cambiar;
  alAbrir: (id: string) => void;
  alCatalogo: () => void;
}) {
  const idDnd = useId();
  const idAyuda = `${idDnd}-ayuda`;
  const secciones = sitio.secciones;
  const ids = secciones.map((x) => x.id);
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nombre = (id: string | number) => {
    const x = secciones.find((s) => s.id === id);
    return x ? etiquetaFila(x) : "la sección";
  };
  const pos = (id: string | number) => ids.indexOf(String(id)) + 1;

  function moverA(desde: number, hasta: number) {
    if (hasta < 0 || hasta >= secciones.length) return;
    cambiar((s) => ({ ...s, secciones: mover(s.secciones, desde, hasta) }));
  }

  function alSoltar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    moverA(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  }

  function duplicar(x: Seccion, i: number) {
    const copia = { ...structuredClone(x), id: nuevoId(x.tipo) } as Seccion;
    cambiar((s) => {
      const lista = s.secciones.slice();
      lista.splice(i + 1, 0, copia);
      return { ...s, secciones: lista };
    });
    toast(`${infoSeccion(x.tipo).nombre} duplicada`);
  }

  function eliminar(x: Seccion, i: number) {
    cambiar((s) => ({ ...s, secciones: s.secciones.filter((y) => y.id !== x.id) }));
    toast(`${infoSeccion(x.tipo).nombre} eliminada`, {
      action: {
        label: "Deshacer",
        onClick: () =>
          cambiar((s) => {
            if (s.secciones.some((y) => y.id === x.id)) return s;
            const lista = s.secciones.slice();
            lista.splice(Math.min(i, lista.length), 0, x);
            return { ...s, secciones: lista };
          }),
      },
    });
  }

  const visibles = secciones.filter((x) => x.visible).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.8125rem] leading-snug text-tenue">
        {secciones.length} {secciones.length === 1 ? "sección" : "secciones"}
        {visibles < secciones.length && `, ${secciones.length - visibles} ${secciones.length - visibles === 1 ? "oculta" : "ocultas"}`}. Arrastra
        para ordenarlas; pulsa una para editarla.
      </p>

      <p id={idAyuda} className="sr-only">
        Pulsa espacio para coger la sección, las flechas para moverla y espacio otra vez para soltarla. También puedes usar Subir y Bajar en
        el menú de cada sección.
      </p>

      {secciones.length === 0 ? (
        <div className="flex flex-col items-start gap-1 py-6">
          <p className="text-sm font-medium text-texto">La web está vacía</p>
          <p className="text-[0.8125rem] text-tenue">Empieza por una portada: es lo primero que se ve.</p>
        </div>
      ) : (
        <DndContext
          id={idDnd}
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragEnd={alSoltar}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Pulsa espacio para coger la sección, las flechas para moverla y espacio otra vez para soltarla. Escape cancela.",
            },
            announcements: {
              onDragStart: ({ active }) => `${nombre(active.id)} cogida, en la posición ${pos(active.id)} de ${ids.length}.`,
              onDragOver: ({ active, over }) => (over ? `${nombre(active.id)} sobre la posición ${pos(over.id)}.` : "Fuera de la lista."),
              onDragEnd: ({ active, over }) =>
                over ? `${nombre(active.id)} soltada en la posición ${pos(over.id)} de ${ids.length}.` : `${nombre(active.id)} soltada sin moverla.`,
              onDragCancel: ({ active }) => `Movimiento cancelado. ${nombre(active.id)} vuelve a su sitio.`,
            },
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="-mx-1 flex flex-col gap-0.5">
              {secciones.map((x, i) => (
                <Fila
                  key={x.id}
                  x={x}
                  indice={i}
                  total={secciones.length}
                  idAyuda={idAyuda}
                  alAbrir={() => alAbrir(x.id)}
                  alVisible={() => cambiar((s) => conSeccion(s, x.id, (y) => ({ ...y, visible: !y.visible })))}
                  alMover={(hasta) => {
                    moverA(i, hasta);
                    enfocarLuego(`[data-fila="${x.id}"]`);
                  }}
                  alDuplicar={() => duplicar(x, i)}
                  alEliminar={() => eliminar(x, i)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Button type="button" variant="secondary" className="w-fit" onClick={alCatalogo}>
        <Plus aria-hidden />
        Añadir sección
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Catálogo para añadir
   ------------------------------------------------------------------ */

function Catalogo({ alElegir, alVolver }: { alElegir: (tipo: Seccion["tipo"]) => void; alVolver: () => void }) {
  return (
    <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200">
      <div className="flex items-center gap-2">
        <button type="button" onClick={alVolver} className={claseBotonIcono} aria-label="Volver a las secciones">
          <ArrowLeft aria-hidden />
        </button>
        <h2 tabIndex={-1} id="catalogo-titulo" className="text-sm font-semibold text-texto">
          Añadir sección
        </h2>
      </div>
      <ul className="-mx-1 flex flex-col gap-0.5" aria-labelledby="catalogo-titulo">
        {SECCIONES.map((info) => (
          <li key={info.tipo}>
            <button
              type="button"
              onClick={() => alElegir(info.tipo)}
              className="group flex w-full items-start gap-3 rounded-lg px-1 py-2.5 text-left transition-colors duration-150 hover:bg-superficie-alta"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-superficie-alta text-texto group-hover:bg-superficie">
                <IconoSeccion nombre={info.icono} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-texto">{info.nombre}</span>
                  {info.conDatos && (
                    <span className="flex items-center gap-1 text-xs text-tenue">
                      <Database className="size-3.5" aria-hidden />
                      Datos del estudio
                    </span>
                  )}
                </span>
                <span className="text-[0.8125rem] leading-snug text-tenue">{info.descripcion}</span>
              </span>
              <Plus className="mt-2 size-4 shrink-0 text-tenue group-hover:text-texto" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------
   Editor de una sección
   ------------------------------------------------------------------ */

const TEXTO_DATOS: Partial<Record<Seccion["tipo"], string>> = {
  servicios: "Los servicios, sus precios y lo que incluyen salen de la configuración del estudio. Aquí solo editas los textos de alrededor.",
  flash: "Los diseños son los publicados en el catálogo flash. Aquí eliges cuántos se ven y los textos de alrededor.",
  estudio: "La dirección, el horario y los datos de contacto salen de la ficha del estudio. Aquí solo editas los textos de alrededor.",
  reserva: "Es el formulario de reserva real de la web: cada envío llega al CRM como solicitud de cita.",
};

function EditorSeccion({
  x,
  cambiar,
  anclas,
  alVolver,
}: {
  x: Seccion;
  cambiar: Cambiar;
  anclas: Ancla[];
  alVolver: () => void;
}) {
  const info = infoSeccion(x.tipo);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true });
  }, [x.id]);

  return (
    <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={alVolver}
          className="-ml-1.5 flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-[0.8125rem] font-medium text-tenue transition-colors duration-150 hover:bg-superficie-alta hover:text-texto"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Secciones
        </button>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-superficie-alta text-texto">
            <IconoSeccion nombre={info.icono} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 ref={titulo} tabIndex={-1} className="truncate text-[0.9375rem] font-semibold text-texto">
              {info.nombre}
            </h2>
            <span className="truncate font-mono text-xs text-tenue">#{x.id}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-pressed={!x.visible}
            onClick={() => cambiar((s) => conSeccion(s, x.id, (y) => ({ ...y, visible: !y.visible })))}
          >
            {x.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            {x.visible ? "Visible" : "Oculta"}
          </Button>
        </div>
        {!x.visible && <p className="text-xs text-tenue">Oculta: no se ve en la web, pero conservas su contenido.</p>}
        {info.conDatos && (
          <p className="flex items-start gap-2 rounded-lg bg-superficie-alta px-3 py-2 text-[0.8125rem] leading-snug text-texto">
            <Database className="mt-0.5 size-4 shrink-0 text-tenue" aria-hidden />
            <span>
              <span className="font-medium">Datos del estudio.</span> {TEXTO_DATOS[x.tipo] ?? "Una parte de esta sección sale de los datos del estudio."}
            </span>
          </p>
        )}
      </div>

      <EditorCampos
        campos={info.campos}
        valores={x as unknown as Record<string, unknown>}
        anclas={anclas.filter((a) => a.destino !== `#${x.id}`)}
        onCambiar={(clave, valor, agrupar) =>
          cambiar((s) => conSeccion(s, x.id, (y) => ({ ...y, [clave]: valor }) as Seccion), agrupar ? `${x.id}.${clave}` : undefined)
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Panel
   ------------------------------------------------------------------ */

export function PanelSecciones({
  sitio,
  cambiar,
  anclas,
  abierta,
  catalogo,
  alAbrir,
  alCatalogo,
}: {
  sitio: Sitio;
  cambiar: Cambiar;
  anclas: Ancla[];
  /** Sección cuyo editor está abierto (null = lista). */
  abierta: Seccion | null;
  catalogo: boolean;
  alAbrir: (id: string | null) => void;
  alCatalogo: (abierto: boolean) => void;
}) {
  if (abierta) {
    return (
      <EditorSeccion
        key={abierta.id}
        x={abierta}
        cambiar={cambiar}
        anclas={anclas}
        alVolver={() => {
          const id = abierta.id;
          alAbrir(null);
          enfocarLuego(`[data-fila="${id}"]`);
        }}
      />
    );
  }

  if (catalogo) {
    return (
      <Catalogo
        alVolver={() => alCatalogo(false)}
        alElegir={(tipo) => {
          const nueva = infoSeccion(tipo).crear();
          // «reserva» trae un id fijo (para el ancla #reserva): si ya existe, se le da otro.
          const seccion = sitio.secciones.some((y) => y.id === nueva.id) ? { ...nueva, id: nuevoId(tipo) } : nueva;
          cambiar((s) => ({ ...s, secciones: [...s.secciones, seccion] }));
          alCatalogo(false);
          alAbrir(seccion.id);
        }}
      />
    );
  }

  return (
    <Lista
      sitio={sitio}
      cambiar={cambiar}
      alAbrir={(id) => alAbrir(id)}
      alCatalogo={() => {
        alCatalogo(true);
        enfocarLuego("#catalogo-titulo");
      }}
    />
  );
}

