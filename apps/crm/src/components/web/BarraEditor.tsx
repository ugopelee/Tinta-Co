"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  Ban,
  CircleAlert,
  CircleCheck,
  EllipsisVertical,
  ExternalLink,
  LoaderCircle,
  Monitor,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { URL_WEB } from "./url-web";
import { Segmentado, claseBotonIcono } from "./Piezas";
import type { Dispositivo } from "./VistaPrevia";

/* ------------------------------------------------------------------
   «hace 2 min» sin desajustes de hidratación: en el servidor no hay hora.
   ------------------------------------------------------------------ */

const PASO = 30_000;
const suscribir = (cb: () => void) => {
  const t = setInterval(cb, PASO);
  return () => clearInterval(t);
};
const ahora = () => Math.floor(Date.now() / PASO) * PASO;
const ahoraServidor = () => 0;

function haceTanto(iso: string | null, t: number) {
  if (!iso || !t) return "";
  const ms = t - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export type FaseGuardado = "guardado" | "pendiente" | "guardando" | "error";
export type FasePublicacion = "publicado" | "cambios" | "nunca";

function Pista({ texto, atajo, children }: { texto: string; atajo?: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {texto}
        {atajo && <kbd className="ml-1.5 font-sans text-[0.68rem] opacity-60">{atajo}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

export function BarraEditor({
  nombrePlantilla,
  guardado,
  guardadoEn,
  publicacion,
  publicadoEn,
  alReintentar,
  puedeDeshacer,
  puedeRehacer,
  alDeshacer,
  alRehacer,
  dispositivo,
  alDispositivo,
  puedeDescartar,
  alDescartar,
  publicando,
  alPublicar,
}: {
  nombrePlantilla: string;
  guardado: FaseGuardado;
  guardadoEn: string | null;
  publicacion: FasePublicacion;
  publicadoEn: string | null;
  alReintentar: () => void;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  alDeshacer: () => void;
  alRehacer: () => void;
  dispositivo: Dispositivo;
  alDispositivo: (d: Dispositivo) => void;
  puedeDescartar: boolean;
  alDescartar: () => void;
  publicando: boolean;
  alPublicar: () => void;
}) {
  const t = useSyncExternalStore(suscribir, ahora, ahoraServidor);
  const hace = haceTanto(guardadoEn, t);
  const haceP = haceTanto(publicadoEn, t);

  const estadoGuardado =
    guardado === "guardando" ? (
      <span className="flex items-center gap-1">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        Guardando…
      </span>
    ) : guardado === "error" ? (
      <span className="flex items-center gap-1 font-medium text-acento">
        <CircleAlert className="size-3.5" aria-hidden />
        No se ha guardado
        <button type="button" onClick={alReintentar} className="ml-0.5 font-semibold underline underline-offset-2">
          Reintentar
        </button>
      </span>
    ) : guardado === "pendiente" ? (
      <span>Sin guardar</span>
    ) : (
      <span>Guardado{hace && ` · ${hace}`}</span>
    );

  const estadoPublicacion =
    publicacion === "publicado" ? (
      <span className="flex items-center gap-1 text-texto">
        <CircleCheck className="size-3.5 text-verde" aria-hidden />
        Publicado{haceP && ` ${haceP}`}
      </span>
    ) : (
      <span className="flex items-center gap-1 font-medium text-texto">
        <span className="size-2 rounded-full bg-amarillo" aria-hidden />
        {publicacion === "nunca" ? "Sin publicar todavía" : "Cambios sin publicar"}
      </span>
    );

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-borde px-3 md:px-4">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="flex items-baseline gap-1.5 truncate text-[0.9375rem] font-semibold leading-tight text-texto">
          Web
          <span className="truncate text-[0.8125rem] font-normal text-tenue">· Plantilla {nombrePlantilla}</span>
        </h1>
        <div className="flex min-w-0 items-center gap-x-2 truncate text-xs leading-tight text-tenue">
          {estadoPublicacion}
          <span aria-hidden>·</span>
          {estadoGuardado}
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Pista texto="Deshacer" atajo="Ctrl Z">
          <button type="button" className={claseBotonIcono} onClick={alDeshacer} disabled={!puedeDeshacer} aria-label="Deshacer" aria-keyshortcuts="Control+Z">
            <Undo2 aria-hidden />
          </button>
        </Pista>
        <Pista texto="Rehacer" atajo="Ctrl Mayús Z">
          <button
            type="button"
            className={claseBotonIcono}
            onClick={alRehacer}
            disabled={!puedeRehacer}
            aria-label="Rehacer"
            aria-keyshortcuts="Control+Shift+Z Control+Y"
          >
            <Redo2 aria-hidden />
          </button>
        </Pista>
      </div>

      <div className="hidden w-[7.5rem] md:block">
        <Segmentado<Dispositivo>
          etiqueta="Tamaño de la vista previa"
          ocultarEtiqueta
          valor={dispositivo}
          onChange={alDispositivo}
          opciones={[
            { valor: "escritorio", texto: <Monitor />, aria: "Escritorio" },
            { valor: "tableta", texto: <Tablet />, aria: "Tableta, 768 píxeles" },
            { valor: "movil", texto: <Smartphone />, aria: "Móvil, 390 píxeles" },
          ]}
        />
      </div>

      <div className="hidden items-center gap-1 xl:flex">
        <Button variant="ghost" onClick={alDescartar} disabled={!puedeDescartar}>
          <Ban aria-hidden />
          Descartar cambios
        </Button>
        <Button variant="ghost" asChild>
          <a href={URL_WEB} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Ver web
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${claseBotonIcono} xl:hidden`} aria-label="Más acciones">
            <EllipsisVertical aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <a href={URL_WEB} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              Ver web
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={alDescartar} disabled={!puedeDescartar}>
            <Ban aria-hidden />
            Descartar cambios
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={alPublicar} disabled={publicando || publicacion === "publicado"} className="ml-1 min-w-28 rounded-full">
        {publicando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
        {publicando ? "Publicando…" : "Publicar"}
      </Button>
    </header>
  );
}
