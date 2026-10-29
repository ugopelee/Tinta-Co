"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { subirFacturaProveedor } from "@/app/acciones-facturas";
import { Icono } from "@/components/Icono";

type Subida = { nombre: string; estado: "subiendo" | "ok" | "error"; mensaje?: string };

const TIPOS = "application/pdf,image/jpeg,image/png,image/webp";

/**
 * Botón y zona para soltar las facturas de proveedor. Cada archivo va en su
 * propia llamada (una server action admite 11 MB como mucho) y en orden, para
 * que la lista de abajo diga cuál ha fallado y por qué.
 */
export function SubirFacturasProveedor() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [encima, setEncima] = useState(false);
  const ocupado = subidas.some((s) => s.estado === "subiendo");

  async function subir(archivos: File[]) {
    if (!archivos.length || ocupado) return;
    const nuevas: Subida[] = archivos.map((a) => ({ nombre: a.name, estado: "subiendo" }));
    setSubidas(nuevas);

    for (const [indice, archivo] of archivos.entries()) {
      const datos = new FormData();
      datos.set("archivo", archivo);
      let resultado: Awaited<ReturnType<typeof subirFacturaProveedor>>;
      try {
        resultado = await subirFacturaProveedor(datos);
      } catch {
        // Sobre todo, archivos por encima del límite de la server action.
        resultado = { ok: false, mensaje: "No se ha podido subir. Comprueba que no pase de 10 MB." };
      }
      nuevas[indice] = resultado.ok
        ? { nombre: archivo.name, estado: "ok" }
        : { nombre: archivo.name, estado: "error", mensaje: resultado.mensaje };
      setSubidas([...nuevas]);
    }
    router.refresh();
  }

  function soltar(evento: DragEvent) {
    evento.preventDefault();
    setEncima(false);
    subir(Array.from(evento.dataTransfer.files));
  }

  return (
    <section
      aria-label="Subir facturas de proveedor"
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={soltar}
      className={`tarjeta mb-3 grid gap-3 border-2 border-dashed p-5 transition-colors duration-200 ${
        encima ? "border-texto bg-superficie-alta" : "border-transparent"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Subir facturas</p>
          <p className="text-sm text-tenue">
            Arrastra aquí los PDF o las fotos, o elígelos. El agente las lee en unos segundos y aparecen abajo para
            revisarlas.
          </p>
        </div>
        <button type="button" disabled={ocupado} onClick={() => entrada.current?.click()} className="boton !px-4 !py-2">
          <Icono nombre="subir" className="h-4 w-4" />
          {ocupado ? "Subiendo…" : "Elegir archivos"}
        </button>
        <input
          ref={entrada}
          type="file"
          accept={TIPOS}
          multiple
          hidden
          onChange={(e) => {
            subir(Array.from(e.target.files ?? []));
            // Para poder volver a elegir el mismo archivo tras un error.
            e.target.value = "";
          }}
        />
      </div>

      {subidas.length > 0 && (
        <ul aria-live="polite" className="grid gap-1.5 text-sm">
          {subidas.map((s, indice) => (
            <li key={`${s.nombre}-${indice}`} className="flex flex-wrap items-center gap-2">
              <Icono
                nombre={s.estado === "ok" ? "bien" : s.estado === "error" ? "aviso" : "reloj"}
                className={`h-4 w-4 ${s.estado === "ok" ? "text-verde" : s.estado === "error" ? "text-acento" : "text-tenue"}`}
              />
              <span className="min-w-0 truncate">{s.nombre}</span>
              <span className="text-tenue">
                {s.estado === "ok" ? "en cola para el agente" : s.estado === "error" ? s.mensaje : "subiendo…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
