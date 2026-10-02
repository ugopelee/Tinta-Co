"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { firmarNomina } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";

/**
 * Firma manuscrita de una nómina: se dibuja con el dedo o el ratón sobre un
 * lienzo y se guarda como PNG. Antes hay que abrir el PDF: no se firma a
 * ciegas.
 */
export function FirmaNomina({ nominaId, periodo }: { nominaId: string; periodo: string }) {
  const [abierta, setAbierta] = useState(false);
  const [leida, setLeida] = useState(false);
  const [vacia, setVacia] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, iniciar] = useTransition();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);

  // El lienzo se dimensiona a su tamaño real en pantalla y a la densidad de
  // píxeles: si no, el trazo sale borroso o desplazado del dedo.
  useEffect(() => {
    if (!abierta || !lienzo.current) return;
    const canvas = lienzo.current;
    const escala = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * escala;
    canvas.height = height * escala;
    const contexto = canvas.getContext("2d")!;
    contexto.scale(escala, escala);
    contexto.lineWidth = 2.2;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    contexto.strokeStyle = "#111";
  }, [abierta]);

  function punto(evento: React.PointerEvent<HTMLCanvasElement>) {
    const rect = evento.currentTarget.getBoundingClientRect();
    return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
  }

  function empezar(evento: React.PointerEvent<HTMLCanvasElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    dibujando.current = true;
    const { x, y } = punto(evento);
    const contexto = evento.currentTarget.getContext("2d")!;
    contexto.beginPath();
    contexto.moveTo(x, y);
  }

  function mover(evento: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const { x, y } = punto(evento);
    const contexto = evento.currentTarget.getContext("2d")!;
    contexto.lineTo(x, y);
    contexto.stroke();
    setVacia(false);
  }

  function borrar() {
    const canvas = lienzo.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setVacia(true);
  }

  function firmar() {
    const firma = lienzo.current?.toDataURL("image/png");
    if (!firma) return;
    iniciar(async () => {
      const resultado = await firmarNomina(nominaId, firma);
      if (resultado.ok) setAbierta(false);
      else setError(resultado.mensaje);
    });
  }

  if (!abierta) {
    return (
      <button type="button" onClick={() => setAbierta(true)} className="boton !px-4 !py-2">
        <Icono nombre="firma" className="h-4 w-4" />
        Firmar
      </button>
    );
  }

  return (
    <div className="w-full basis-full space-y-3 rounded-[1.25rem] bg-superficie p-4 ring-1 ring-borde">
      <p className="text-sm font-medium">Firma de la nómina de {periodo}</p>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={leida}
          onChange={(evento) => setLeida(evento.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--texto)]"
        />
        <span>
          He leído la nómina (
          <a href={`/nominas/${nominaId}`} target="_blank" rel="noopener" className="underline underline-offset-4">
            abrir PDF
          </a>
          ) y firmo su recepción.
        </span>
      </label>

      <canvas
        ref={lienzo}
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={() => (dibujando.current = false)}
        onPointerLeave={() => (dibujando.current = false)}
        aria-label="Zona para dibujar la firma"
        className="h-40 w-full touch-none rounded-xl bg-white ring-1 ring-borde"
      />

      {error && (
        <p role="alert" className="text-sm text-acento">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={firmar} disabled={vacia || !leida || ocupado} className="boton !px-4 !py-2">
          {ocupado ? "Firmando…" : "Firmar nómina"}
        </button>
        <button type="button" onClick={borrar} className="boton-fantasma">
          Borrar
        </button>
        <button type="button" onClick={() => setAbierta(false)} className="boton-fantasma">
          Cancelar
        </button>
      </div>
    </div>
  );
}
