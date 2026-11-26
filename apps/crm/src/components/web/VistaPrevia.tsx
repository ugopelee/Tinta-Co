"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { URL_WEB } from "./url-web";

export type Dispositivo = "escritorio" | "tableta" | "movil";

export const DISPOSITIVOS: Record<Dispositivo, { nombre: string; ancho: number }> = {
  escritorio: { nombre: "Escritorio", ancho: 1280 },
  tableta: { nombre: "Tableta", ancho: 768 },
  movil: { nombre: "Móvil", ancho: 390 },
};

/**
 * La web dentro de un iframe al ancho real del dispositivo elegido. Si no cabe,
 * se escala con transform (manteniendo la proporción) y el iframe crece en alto
 * lo necesario para llenar el hueco a esa escala.
 */
export function VistaPrevia({
  dispositivo,
  iframeRef,
  lista,
  recarga,
  alRecargar,
}: {
  dispositivo: Dispositivo;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** La vista previa ha respondido con «lista». */
  lista: boolean;
  /** Cambia para volver a montar el iframe. */
  recarga: number;
  alRecargar: () => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState<{ w: number; h: number } | null>(null);
  const [lenta, setLenta] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      // Oculta (pestaña «Editar» en móvil): se conserva la última medida.
      if (width > 0 && height > 0) setTam({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (lista) return;
    const t = setTimeout(() => setLenta(true), 10000);
    return () => clearTimeout(t);
  }, [lista, recarga]);

  const base = DISPOSITIVOS[dispositivo].ancho;
  // En escritorio, si sobra sitio, la vista ocupa todo el ancho disponible.
  const ancho = tam && dispositivo === "escritorio" ? Math.max(base, Math.floor(tam.w)) : base;
  const escala = tam ? Math.min(1, tam.w / ancho) : 1;
  const alto = tam ? Math.floor(tam.h / escala) : 800;
  const marco = dispositivo !== "escritorio";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="flex h-9 shrink-0 items-center justify-center gap-1.5 text-xs tabular-nums text-tenue">
        <span className="font-medium text-texto">{DISPOSITIVOS[dispositivo].nombre}</span>
        <span aria-hidden>·</span>
        <span>{ancho} px</span>
        {escala < 1 && (
          <>
            <span aria-hidden>·</span>
            <span>al {Math.round(escala * 100)} %</span>
          </>
        )}
      </p>
      <div ref={caja} className={`relative min-h-0 flex-1 ${marco ? "mx-4 mb-4" : "mx-3 mb-3"}`}>
        {tam && (
          <div
            className="relative mx-auto overflow-hidden rounded-xl bg-superficie shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_28px_rgb(0_0_0/0.1)] ring-1 ring-borde"
            style={{ width: Math.round(ancho * escala), height: Math.round(alto * escala) }}
          >
            <iframe
              key={recarga}
              ref={iframeRef}
              src={`${URL_WEB.replace(/\/$/, "")}/vista-previa`}
              title="Vista previa de la web"
              className="block origin-top-left border-0 bg-white"
              style={{ width: ancho, height: alto, transform: escala < 1 ? `scale(${escala})` : undefined }}
            />
            {!lista && (
              <div className="absolute inset-0 grid place-items-center bg-superficie-alta" role="status">
                {lenta ? (
                  <div className="flex max-w-64 flex-col items-center gap-3 text-center">
                    <p className="text-sm font-medium text-texto">La vista previa no responde</p>
                    <p className="text-[0.8125rem] text-tenue">Tus cambios se siguen guardando. Prueba a recargarla.</p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setLenta(false);
                        alRecargar();
                      }}
                    >
                      <RotateCw aria-hidden />
                      Recargar vista previa
                    </Button>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-[0.8125rem] text-tenue">
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Cargando la vista previa…
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
