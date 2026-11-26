"use client";

import { useId, useLayoutEffect, useRef, useState, type DragEvent } from "react";
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
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  ImageIcon,
  Link2,
  Plus,
  Trash2,
  Upload,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { Campo as DefCampo } from "@tinta/compartido/web/catalogo";
import type { Boton, Imagen } from "@tinta/compartido/web/esquema";
import { subirImagen } from "@/lib/subir-web";
import { Aviso, Campo, Contador, Input, Segmentado, Textarea, claseBotonIcono } from "./Piezas";
import { mover } from "./historial";

export type Ancla = { texto: string; destino: string };

/** `agrupar`: el cambio viene de escribir y se funde con los siguientes en el historial. */
type AlCambiar = (valor: unknown, agrupar?: boolean) => void;

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function validarArchivo(f: File): string | null {
  if (!TIPOS.includes(f.type)) return `«${f.name}» no es JPG, PNG, WebP ni AVIF.`;
  if (f.size > MAX_BYTES) return `«${f.name}» pesa ${(f.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB; el máximo son 5 MB.`;
  return null;
}

async function subir(f: File): Promise<{ url: string } | { error: string }> {
  const fallo = validarArchivo(f);
  if (fallo) return { error: fallo };
  try {
    return await subirImagen(f);
  } catch {
    return { error: "No se ha podido subir la imagen. Revisa la conexión y vuelve a intentarlo." };
  }
}

/* ------------------------------------------------------------------
   Editor genérico: pinta cada campo del catálogo con su control
   ------------------------------------------------------------------ */

export function EditorCampos({
  campos,
  valores,
  onCambiar,
  anclas,
}: {
  campos: DefCampo[];
  valores: Record<string, unknown>;
  onCambiar: (clave: string, valor: unknown, agrupar?: boolean) => void;
  anclas: Ancla[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {campos.map((c) => (
        <CampoGenerico key={c.clave} campo={c} valor={valores[c.clave]} onChange={(v, g) => onCambiar(c.clave, v, g)} anclas={anclas} />
      ))}
    </div>
  );
}

function CampoGenerico({ campo, valor, onChange, anclas }: { campo: DefCampo; valor: unknown; onChange: AlCambiar; anclas: Ancla[] }) {
  switch (campo.tipo) {
    case "texto":
    case "textoLargo":
      return (
        <CampoTexto
          etiqueta={campo.etiqueta}
          ayuda={campo.ayuda}
          max={campo.max}
          largo={campo.tipo === "textoLargo"}
          // Textos cortos que admiten salto de línea (el titular de portada).
          multilinea={campo.tipo === "texto" && !!campo.multilinea}
          valor={typeof valor === "string" ? valor : ""}
          onChange={(v) => onChange(v, true)}
        />
      );
    case "imagen":
      return <CampoImagen etiqueta={campo.etiqueta} ayuda={campo.ayuda} valor={(valor as Imagen | null) ?? null} onChange={onChange} />;
    case "imagenes":
      return (
        <CampoImagenes
          etiqueta={campo.etiqueta}
          ayuda={campo.ayuda}
          max={campo.max}
          valor={Array.isArray(valor) ? (valor as Imagen[]) : []}
          onChange={onChange}
        />
      );
    case "boton":
      return <CampoBoton etiqueta={campo.etiqueta} ayuda={campo.ayuda} valor={(valor as Boton | null) ?? null} onChange={onChange} anclas={anclas} />;
    case "opcion":
      return (
        <Segmentado
          etiqueta={campo.etiqueta}
          opciones={campo.opciones.map((o) => ({ valor: o.valor, texto: o.texto }))}
          valor={String(valor ?? campo.opciones[0]?.valor)}
          onChange={(v) => onChange(v)}
        />
      );
    case "numero":
      return <CampoNumero etiqueta={campo.etiqueta} min={campo.min} max={campo.max} valor={Number(valor) || campo.min} onChange={(v) => onChange(v, true)} />;
    case "lista":
      return (
        <CampoLista
          etiqueta={campo.etiqueta}
          elemento={campo.elemento}
          max={campo.max}
          subcampos={campo.subcampos}
          valor={Array.isArray(valor) ? (valor as Record<string, string>[]) : []}
          onChange={onChange}
        />
      );
  }
}

/* ------------------------------------------------------------------
   Texto
   ------------------------------------------------------------------ */

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  ayuda,
  max,
  recomendado = false,
  largo = false,
  multilinea = false,
  tipo = "text",
  placeholder,
  autoComplete = "off",
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  ayuda?: string;
  /** Límite de caracteres. Con `recomendado`, se avisa pero se deja seguir escribiendo. */
  max?: number;
  recomendado?: boolean;
  largo?: boolean;
  multilinea?: boolean;
  tipo?: "text" | "email" | "tel" | "url";
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idCuenta = `${id}-cuenta`;
  const describe = [ayuda && idAyuda, max && idCuenta].filter(Boolean).join(" ") || undefined;
  const limite = max && !recomendado ? max : undefined;

  return (
    <Campo
      etiqueta={etiqueta}
      htmlFor={id}
      ayuda={ayuda}
      idAyuda={idAyuda}
      contador={max ? <Contador id={idCuenta} actual={valor.length} max={max} recomendado={recomendado} /> : undefined}
    >
      {largo || multilinea ? (
        <Textarea
          id={id}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          maxLength={limite}
          aria-describedby={describe}
          placeholder={placeholder}
          rows={multilinea ? 1 : 3}
          className={`resize-none ${multilinea ? "min-h-8 py-1.5" : "min-h-20"}`}
        />
      ) : (
        <Input
          id={id}
          type={tipo}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          maxLength={limite}
          aria-describedby={describe}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={tipo === "text"}
        />
      )}
    </Campo>
  );
}

/* ------------------------------------------------------------------
   Número
   ------------------------------------------------------------------ */

function CampoNumero({ etiqueta, min, max, valor, onChange }: { etiqueta: string; min: number; max: number; valor: number; onChange: (v: number) => void }) {
  const id = useId();
  // Borrador local: deja vaciar el campo mientras se escribe sin perder el valor guardado.
  const [borrador, setBorrador] = useState<string | null>(null);
  return (
    <Campo etiqueta={etiqueta} htmlFor={id} ayuda={`Entre ${min} y ${max}.`} idAyuda={`${id}-ayuda`}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={borrador ?? String(valor)}
        aria-describedby={`${id}-ayuda`}
        onChange={(e) => {
          setBorrador(e.target.value);
          const n = Math.round(Number(e.target.value));
          if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        onBlur={() => setBorrador(null)}
        className="w-28 tabular-nums"
      />
    </Campo>
  );
}

/* ------------------------------------------------------------------
   Botón (texto + destino)
   ------------------------------------------------------------------ */

function avisoDestino(destino: string, anclas: Ancla[]): string | null {
  const d = destino.trim();
  if (!d) return "Falta el destino: el botón no llevará a ningún sitio.";
  if (d.startsWith("#")) {
    return d === "#" || anclas.some((a) => a.destino === d) ? null : "No hay ninguna sección visible con ese ancla.";
  }
  if (/^(\/|https?:\/\/|mailto:|tel:)/i.test(d)) return null;
  return "Empieza por # (una sección), / (una página) o https:// (otra web).";
}

function CampoBoton({
  etiqueta,
  ayuda,
  valor,
  onChange,
  anclas,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: Boton | null;
  onChange: AlCambiar;
  anclas: Ancla[];
}) {
  const id = useId();
  const idAviso = `${id}-amarillo`;

  if (!valor) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[0.8125rem] font-medium text-texto">{etiqueta}</p>
        <p className="text-xs text-tenue">Sin botón.</p>
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          onClick={() => onChange({ texto: "Reserva tu cita", destino: anclas.find((a) => a.destino === "#reserva")?.destino ?? "#" })}
        >
          <Plus aria-hidden />
          Añadir botón
        </Button>
      </div>
    );
  }

  const aviso = avisoDestino(valor.destino, anclas);

  return (
    <fieldset className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-[0.8125rem] font-medium text-texto">{etiqueta}</legend>
        <Button type="button" variant="ghost" size="sm" className="-mr-1 text-tenue" onClick={() => onChange(null)}>
          <X aria-hidden />
          Quitar botón
        </Button>
      </div>
      {ayuda && <p className="-mt-1.5 text-xs text-tenue">{ayuda}</p>}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-t`} className="text-xs font-medium text-tenue">
          Texto
        </label>
        <Input
          id={`${id}-t`}
          value={valor.texto}
          maxLength={40}
          onChange={(e) => onChange({ ...valor, texto: e.target.value }, true)}
          aria-invalid={!valor.texto.trim() || undefined}
        />
        {!valor.texto.trim() && <Aviso>Sin texto, el botón no se mostrará en la web.</Aviso>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-d`} className="text-xs font-medium text-tenue">
          Destino
        </label>
        <div className="flex gap-1.5">
          <Input
            id={`${id}-d`}
            value={valor.destino}
            onChange={(e) => onChange({ ...valor, destino: e.target.value }, true)}
            aria-describedby={aviso ? idAviso : undefined}
            aria-invalid={aviso ? true : undefined}
            placeholder="#reserva"
            spellCheck={false}
            autoComplete="off"
            className="font-mono text-[0.8125rem]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" className="shrink-0" disabled={!anclas.length}>
                <Link2 aria-hidden />
                Sección
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-tenue">Llevar a una sección</DropdownMenuLabel>
              {anclas.map((a) => (
                <DropdownMenuItem key={a.destino} onSelect={() => onChange({ ...valor, destino: a.destino })}>
                  <span className="min-w-0 flex-1 truncate">{a.texto}</span>
                  <span className="font-mono text-xs text-tenue">{a.destino}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {aviso && <Aviso id={idAviso}>{aviso}</Aviso>}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------
   Imagen
   ------------------------------------------------------------------ */

function useSoltar(alSoltar: (files: File[]) => void) {
  const [encima, setEncima] = useState(false);
  return {
    encima,
    props: {
      onDragOver: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setEncima(true);
      },
      onDragLeave: (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEncima(false);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setEncima(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) alSoltar(files);
      },
    },
  };
}

export function CampoImagen({
  etiqueta,
  ayuda,
  valor,
  onChange,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: Imagen | null;
  onChange: AlCambiar;
}) {
  const id = useId();
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar(files: File[]) {
    const f = files[0];
    if (!f || subiendo) return;
    setError(null);
    setSubiendo(true);
    const r = await subir(f);
    setSubiendo(false);
    if ("error" in r) return setError(r.error);
    onChange({ url: r.url, alt: valor?.alt ?? "" });
  }
  const { encima, props: soltar } = useSoltar(cargar);
  const sinAlt = valor && !valor.alt.trim();

  return (
    <fieldset className="flex flex-col gap-2" aria-busy={subiendo || undefined}>
      <legend className="mb-2 text-[0.8125rem] font-medium text-texto">{etiqueta}</legend>
      {ayuda && <p className="-mt-1 text-xs text-tenue">{ayuda}</p>}

      <input
        ref={archivo}
        id={`${id}-archivo`}
        type="file"
        accept={TIPOS.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          cargar(files);
        }}
      />

      <div
        {...soltar}
        className={`relative overflow-hidden rounded-lg bg-superficie-alta transition-[box-shadow] duration-150 ${
          encima ? "ring-2 ring-texto ring-offset-2 ring-offset-superficie" : ""
        }`}
      >
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del bucket o de /landing
          <img src={valor.url} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-borde-campo px-4 text-center text-[0.8125rem] text-tenue transition-colors duration-150 hover:border-tenue hover:text-texto"
          >
            <ImageIcon className="size-6" aria-hidden />
            <span>
              <span className="font-medium text-texto">Elige una imagen</span> o arrástrala aquí
            </span>
            <span className="text-xs">JPG, PNG, WebP o AVIF · máx. 5 MB</span>
          </button>
        )}
        {subiendo && (
          <div className="absolute inset-0 grid place-items-center bg-superficie-alta">
            <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-texto">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Subiendo…
            </span>
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {subiendo ? "Subiendo imagen" : ""}
      </p>
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-acento">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {valor && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="secondary" size="sm" onClick={() => archivo.current?.click()} disabled={subiendo}>
              <Upload aria-hidden />
              Cambiar imagen
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-tenue" onClick={() => onChange(null)} disabled={subiendo}>
              <Trash2 aria-hidden />
              Quitar
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-alt`} className="text-xs font-medium text-tenue">
              Texto alternativo
            </label>
            <Input
              id={`${id}-alt`}
              value={valor.alt}
              maxLength={160}
              placeholder="Qué se ve en la foto"
              aria-describedby={`${id}-alt-ayuda`}
              onChange={(e) => onChange({ ...valor, alt: e.target.value }, true)}
            />
            {sinAlt ? (
              <Aviso id={`${id}-alt-ayuda`}>Falta describir la foto. Lo leen los lectores de pantalla y Google.</Aviso>
            ) : (
              <p id={`${id}-alt-ayuda`} className="text-xs text-tenue">
                Lo leen los lectores de pantalla y Google.
              </p>
            )}
          </div>
        </>
      )}
    </fieldset>
  );
}

/* ------------------------------------------------------------------
   Varias imágenes: rejilla ordenable
   ------------------------------------------------------------------ */

/** Ids estables aunque se repita una URL: la URL y su número de aparición. */
function idsDe(imagenes: Imagen[]) {
  const vistos = new Map<string, number>();
  return imagenes.map((im) => {
    const n = vistos.get(im.url) ?? 0;
    vistos.set(im.url, n + 1);
    return `${im.url}#${n}`;
  });
}

function Miniatura({
  id,
  imagen,
  indice,
  total,
  elegida,
  alElegir,
  alQuitar,
}: {
  id: string;
  imagen: Imagen;
  indice: number;
  total: number;
  elegida: boolean;
  alElegir: () => void;
  alQuitar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const sinAlt = !imagen.alt.trim();
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative ${isDragging ? "z-10 opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={alElegir}
        aria-roledescription="foto ordenable"
        aria-label={`Foto ${indice + 1} de ${total}${imagen.alt ? `: ${imagen.alt}` : ", sin descripción"}. Pulsa para editar su descripción.`}
        aria-pressed={elegida}
        className={`block aspect-square w-full cursor-grab overflow-hidden rounded-md bg-superficie-alta active:cursor-grabbing ${
          elegida ? "ring-2 ring-texto ring-offset-2 ring-offset-superficie" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del bucket */}
        <img src={imagen.url} alt="" className="size-full object-cover" draggable={false} />
      </button>
      {sinAlt && (
        <span className="pointer-events-none absolute bottom-1 left-1 grid size-5 place-items-center rounded bg-superficie text-amarillo" aria-hidden>
          <TriangleAlert className="size-3" />
        </span>
      )}
      <button
        type="button"
        onClick={alQuitar}
        aria-label={`Quitar la foto ${indice + 1}`}
        className="absolute right-1 top-1 grid size-6 place-items-center rounded bg-superficie text-tenue transition-colors duration-150 hover:text-acento"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

function CampoImagenes({
  etiqueta,
  ayuda,
  max = 24,
  valor,
  onChange,
}: {
  etiqueta: string;
  ayuda?: string;
  max?: number;
  valor: Imagen[];
  onChange: AlCambiar;
}) {
  const id = useId();
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [elegida, setElegida] = useState<number | null>(null);
  // Las subidas terminan de una en una: hay que añadir sobre la lista más reciente.
  const actual = useRef(valor);
  useLayoutEffect(() => {
    actual.current = valor;
  }, [valor]);

  const ids = idsDe(valor);
  const lleno = valor.length >= max;
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function cargar(files: File[]) {
    const hueco = max - actual.current.length - subiendo;
    const fallos: string[] = [];
    if (files.length > hueco) fallos.push(`Caben ${Math.max(0, hueco)} fotos más (máximo ${max}).`);
    const lote = files.slice(0, Math.max(0, hueco));
    setErrores(fallos);
    setSubiendo((n) => n + lote.length);
    for (const f of lote) {
      const r = await subir(f);
      setSubiendo((n) => n - 1);
      if ("error" in r) {
        fallos.push(r.error);
        setErrores([...fallos]);
      } else {
        onChange([...actual.current, { url: r.url, alt: "" }]);
      }
    }
  }
  const { encima, props: soltar } = useSoltar(cargar);

  function alSoltar(e: DragEndEvent) {
    const desde = ids.indexOf(String(e.active.id));
    const hasta = e.over ? ids.indexOf(String(e.over.id)) : -1;
    if (desde < 0 || hasta < 0 || desde === hasta) return;
    onChange(mover(valor, desde, hasta));
    if (elegida === desde) setElegida(hasta);
  }

  const imagenElegida = elegida != null ? valor[elegida] : null;

  return (
    <fieldset className="flex flex-col gap-2" aria-busy={subiendo > 0 || undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[0.8125rem] font-medium text-texto">{etiqueta}</legend>
        <span className="text-xs tabular-nums text-tenue">
          {valor.length}/{max}
        </span>
      </div>
      <p className="text-xs text-tenue">{ayuda ?? "Arrastra para cambiar el orden. Pulsa una foto para describirla."}</p>

      <input
        ref={archivo}
        type="file"
        multiple
        accept={TIPOS.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          cargar(files);
        }}
      />

      <div {...soltar} className={`rounded-lg transition-[box-shadow] duration-150 ${encima ? "ring-2 ring-texto ring-offset-4 ring-offset-superficie" : ""}`}>
        <DndContext
          id={id}
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragEnd={alSoltar}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Pulsa espacio para coger la foto, las flechas para moverla y espacio otra vez para soltarla. Escape cancela.",
            },
            announcements: {
              onDragStart: ({ active }) => `Foto ${ids.indexOf(String(active.id)) + 1} cogida.`,
              onDragOver: ({ over }) => (over ? `Sobre la posición ${ids.indexOf(String(over.id)) + 1}.` : "Fuera de la rejilla."),
              onDragEnd: ({ over }) => (over ? `Foto soltada en la posición ${ids.indexOf(String(over.id)) + 1}.` : "Foto soltada sin moverla."),
              onDragCancel: () => "Movimiento cancelado.",
            },
          }}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-2">
              {valor.map((im, i) => (
                <Miniatura
                  key={ids[i]}
                  id={ids[i]}
                  imagen={im}
                  indice={i}
                  total={valor.length}
                  elegida={elegida === i}
                  alElegir={() => setElegida(elegida === i ? null : i)}
                  alQuitar={() => {
                    onChange(valor.filter((_, j) => j !== i));
                    setElegida(null);
                  }}
                />
              ))}
              {Array.from({ length: subiendo }, (_, i) => (
                <li key={`s-${i}`} className="grid aspect-square place-items-center rounded-md bg-superficie-alta" aria-hidden>
                  <Loader2 className="size-4 animate-spin text-tenue" />
                </li>
              ))}
              {!lleno && (
                <li>
                  <button
                    type="button"
                    onClick={() => archivo.current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-borde-campo text-xs font-medium text-tenue transition-colors duration-150 hover:border-tenue hover:text-texto"
                  >
                    <Plus className="size-4" aria-hidden />
                    Añadir fotos
                  </button>
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {subiendo ? `Subiendo ${subiendo} ${subiendo === 1 ? "foto" : "fotos"}` : ""}
      </p>
      {errores.map((e) => (
        <p key={e} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-acento">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {e}
        </p>
      ))}
      {valor.some((im) => !im.alt.trim()) && <Aviso>Hay fotos sin describir (las marcadas). Pulsa una para escribir qué se ve.</Aviso>}

      {imagenElegida && elegida != null && (
        <div className="flex flex-col gap-1 pt-1">
          <label htmlFor={`${id}-alt`} className="text-xs font-medium text-tenue">
            Texto alternativo de la foto {elegida + 1}
          </label>
          <Input
            id={`${id}-alt`}
            value={imagenElegida.alt}
            maxLength={160}
            placeholder="Qué se ve en la foto"
            onChange={(e) => onChange(valor.map((im, j) => (j === elegida ? { ...im, alt: e.target.value } : im)), true)}
          />
        </div>
      )}
    </fieldset>
  );
}

/* ------------------------------------------------------------------
   Lista de elementos con subcampos
   ------------------------------------------------------------------ */

function CampoLista({
  etiqueta,
  elemento,
  max = 20,
  subcampos,
  valor,
  onChange,
}: {
  etiqueta: string;
  elemento: string;
  max?: number;
  subcampos: { clave: string; etiqueta: string; tipo: "texto" | "textoLargo" }[];
  valor: Record<string, string>[];
  onChange: AlCambiar;
}) {
  const id = useId();
  const lleno = valor.length >= max;
  const Nombre = mayuscula(elemento);

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[0.8125rem] font-medium text-texto">{etiqueta}</legend>
        <span className="text-xs tabular-nums text-tenue">
          {valor.length}/{max}
        </span>
      </div>

      {valor.length === 0 && <p className="text-xs text-tenue">Sin elementos: esta parte no se verá en la web.</p>}

      <ol className="flex flex-col">
        {valor.map((el, i) => (
          <li key={i} className="flex flex-col gap-2.5 border-t border-borde py-3 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-1">
              <span className="flex-1 text-xs font-semibold text-tenue">
                {Nombre} {i + 1}
              </span>
              <button
                type="button"
                className={`${claseBotonIcono} size-7`}
                aria-label={`Subir ${elemento} ${i + 1}`}
                disabled={i === 0}
                onClick={() => onChange(mover(valor, i, i - 1))}
              >
                <ArrowUp aria-hidden />
              </button>
              <button
                type="button"
                className={`${claseBotonIcono} size-7`}
                aria-label={`Bajar ${elemento} ${i + 1}`}
                disabled={i === valor.length - 1}
                onClick={() => onChange(mover(valor, i, i + 1))}
              >
                <ArrowDown aria-hidden />
              </button>
              <button
                type="button"
                className={`${claseBotonIcono} size-7 hover:text-acento`}
                aria-label={`Eliminar ${elemento} ${i + 1}`}
                onClick={() => onChange(valor.filter((_, j) => j !== i))}
              >
                <Trash2 aria-hidden />
              </button>
            </div>
            {subcampos.map((s) => {
              const idCampo = `${id}-${i}-${s.clave}`;
              const props = {
                id: idCampo,
                value: el[s.clave] ?? "",
                onChange: (e: { target: { value: string } }) => onChange(valor.map((x, j) => (j === i ? { ...x, [s.clave]: e.target.value } : x)), true),
              };
              return (
                <div key={s.clave} className="flex flex-col gap-1">
                  <label htmlFor={idCampo} className="text-xs font-medium text-tenue">
                    {s.etiqueta}
                  </label>
                  {s.tipo === "textoLargo" ? <Textarea {...props} rows={2} className="min-h-14 resize-none" /> : <Input {...props} />}
                </div>
              );
            })}
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        disabled={lleno}
        onClick={() => onChange([...valor, Object.fromEntries(subcampos.map((s) => [s.clave, ""]))])}
      >
        <Plus aria-hidden />
        Añadir {elemento}
      </Button>
      {lleno && <p className="text-xs text-tenue">Has llegado al máximo de {max}.</p>}
    </fieldset>
  );
}
