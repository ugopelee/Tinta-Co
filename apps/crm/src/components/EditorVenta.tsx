"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { estudio, tiposIva } from "@tinta/compartido/estudio";
import { cambiarEstadoVenta, guardarVenta } from "@/app/acciones-ventas";
import { claseCampo } from "@/components/FormularioAlta";
import { Icono } from "@/components/Icono";
import { euros, importeLinea, totales } from "@/lib/importes";
import { lineaEditable, type LineaEditable } from "@/lib/ventas";

export type OpcionCliente = { id: string; nombre: string };
export type OpcionDiseno = { id: string; nombre: string; precio: number | null };

/** Acepta «12,5» y «12.5»; lo que no es un número queda en NaN y no se guarda. */
const numero = (texto: string) => (texto.trim() === "" ? NaN : Number(texto.replace(",", ".")));

export function EditorVenta({
  id,
  clienteId,
  citaId,
  validaHasta,
  notas,
  lineasIniciales,
  clientes,
  disenos,
}: {
  id?: string;
  clienteId: string;
  citaId: string | null;
  validaHasta: string | null;
  notas: string | null;
  lineasIniciales: LineaEditable[];
  clientes: OpcionCliente[];
  disenos: OpcionDiseno[];
}) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");
  const [cliente, setCliente] = useState(clienteId);
  const [valida, setValida] = useState(validaHasta ?? "");
  const [nota, setNota] = useState(notas ?? "");
  const [lineas, setLineas] = useState(lineasIniciales);

  // Lo último guardado, para saber si hay cambios sin guardar.
  const instantanea = JSON.stringify([cliente, valida, nota, lineas.map((l) => [l.descripcion, l.diseno_id, l.cantidad, l.precio, l.descuento, l.iva])]);
  const [guardado, setGuardado] = useState(instantanea);
  const sucio = instantanea !== guardado;

  const convertidas = lineas.map((linea, orden) => ({
    orden,
    descripcion: linea.descripcion,
    diseno_id: linea.diseno_id,
    cantidad: numero(linea.cantidad),
    precio_unitario: numero(linea.precio),
    descuento: numero(linea.descuento),
    iva: linea.iva,
  }));
  const incompleta = (linea: (typeof convertidas)[number]) =>
    Number.isNaN(linea.cantidad + linea.precio_unitario + linea.descuento);
  // Una línea con una cifra a medio escribir no suma hasta que se completa.
  const resumen = totales(convertidas.filter((linea) => !incompleta(linea)));

  function cambiar(clave: string, parche: Partial<LineaEditable>) {
    setLineas((actuales) => actuales.map((linea) => (linea.clave === clave ? { ...linea, ...parche } : linea)));
  }

  function anadir(valor: string) {
    let nueva: LineaEditable | null = null;
    if (valor === "libre") {
      nueva = lineaEditable({ descripcion: "", diseno_id: null });
    } else if (valor.startsWith("servicio:")) {
      const servicio = estudio.servicios.find((s) => s.id === valor.slice("servicio:".length));
      if (servicio) nueva = lineaEditable({ descripcion: servicio.nombre, diseno_id: null });
    } else if (valor.startsWith("diseno:")) {
      const diseno = disenos.find((d) => d.id === valor.slice("diseno:".length));
      if (diseno) {
        nueva = lineaEditable({
          descripcion: diseno.nombre,
          diseno_id: diseno.id,
          precio_unitario: Number(diseno.precio ?? 0),
        });
      }
    }
    if (nueva) setLineas((actuales) => [...actuales, nueva]);
  }

  /** Guarda lo que hay en pantalla; devuelve el id si ha ido bien. */
  async function guardarTodo(): Promise<string | null> {
    if (convertidas.some(incompleta)) {
      setError("Revisa las cifras: alguna línea tiene un valor que no es un número.");
      return null;
    }
    const resultado = await guardarVenta({
      id,
      cliente_id: cliente,
      // La cita es del cliente de origen: si se cambia de cliente, se suelta.
      cita_id: cliente === clienteId ? citaId : null,
      valida_hasta: valida || null,
      notas: nota,
      lineas: convertidas,
    });
    if (!resultado.ok) {
      setError(resultado.mensaje);
      return null;
    }
    setGuardado(instantanea);
    return resultado.id;
  }

  function guardar() {
    setError("");
    iniciar(async () => {
      const guardada = await guardarTodo();
      if (!guardada) return;
      if (id) router.refresh();
      else router.push(`/ventas/${guardada}`);
    });
  }

  // Confirmar guarda primero lo que hay en pantalla: un solo clic, un solo flujo.
  function confirmar() {
    setError("");
    iniciar(async () => {
      const guardada = await guardarTodo();
      if (!guardada) return;
      const resultado = await cambiarEstadoVenta(guardada, "confirmada");
      if (!resultado.ok) {
        setError(resultado.mensaje);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  function cancelar() {
    const aviso = sucio ? "¿Cancelar esta venta? Los cambios sin guardar se perderán." : "¿Cancelar esta venta?";
    if (!window.confirm(aviso)) return;
    setError("");
    iniciar(async () => {
      const resultado = await cambiarEstadoVenta(id!, "cancelada");
      if (!resultado.ok) setError(resultado.mensaje);
      router.refresh();
    });
  }

  return (
    <div className="tarjeta grid gap-5 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-tenue">
          Cliente
          <select value={cliente} onChange={(e) => setCliente(e.target.value)} required className={claseCampo}>
            <option value="" disabled>
              Elige un cliente
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-tenue">
          Válido hasta
          <input type="date" value={valida} onChange={(e) => setValida(e.target.value)} className={claseCampo} />
        </label>
      </div>

      <div className="grid gap-2">
        {lineas.length === 0 && (
          <p className="fila px-4 py-6 text-center text-sm text-tenue">Añade la primera línea del presupuesto.</p>
        )}

        {lineas.map((linea, indice) => (
          <div key={linea.clave} className="fila grid gap-2 p-3 sm:grid-cols-[1fr_5rem_6rem_5rem_5rem_auto] sm:items-end">
            <label className="grid gap-1 text-xs text-tenue">
              <span className={indice === 0 ? "" : "sm:sr-only"}>Descripción</span>
              <input
                value={linea.descripcion}
                onChange={(e) => cambiar(linea.clave, { descripcion: e.target.value })}
                className={claseCampo}
              />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              <span className={indice === 0 ? "" : "sm:sr-only"}>Cantidad</span>
              <input
                inputMode="decimal"
                value={linea.cantidad}
                onChange={(e) => cambiar(linea.clave, { cantidad: e.target.value })}
                className={`${claseCampo} cifra`}
              />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              <span className={indice === 0 ? "" : "sm:sr-only"}>Precio (€)</span>
              <input
                inputMode="decimal"
                value={linea.precio}
                onChange={(e) => cambiar(linea.clave, { precio: e.target.value })}
                className={`${claseCampo} cifra`}
              />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              <span className={indice === 0 ? "" : "sm:sr-only"}>Dto. (%)</span>
              <input
                inputMode="decimal"
                value={linea.descuento}
                onChange={(e) => cambiar(linea.clave, { descuento: e.target.value })}
                className={`${claseCampo} cifra`}
              />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              <span className={indice === 0 ? "" : "sm:sr-only"}>IVA</span>
              <select
                value={linea.iva}
                onChange={(e) => cambiar(linea.clave, { iva: Number(e.target.value) })}
                className={claseCampo}
              >
                {tiposIva.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo} %
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <span className="cifra text-sm font-medium">
                {euros(incompleta(convertidas[indice]) ? 0 : importeLinea(convertidas[indice]))}
              </span>
              <button
                type="button"
                onClick={() => setLineas((actuales) => actuales.filter((l) => l.clave !== linea.clave))}
                title="Quitar la línea"
                aria-label={`Quitar la línea ${indice + 1}${linea.descripcion ? `: ${linea.descripcion}` : ""}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-acento"
              >
                <Icono nombre="cerrar" className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <label className="grid gap-1 text-xs text-tenue sm:max-w-xs">
          Añadir línea
          <select value="" onChange={(e) => anadir(e.target.value)} className={claseCampo}>
            <option value="" disabled>
              Elige qué añadir
            </option>
            <option value="libre">Línea libre</option>
            <optgroup label="Servicios">
              {estudio.servicios.map((servicio) => (
                <option key={servicio.id} value={`servicio:${servicio.id}`}>
                  {servicio.nombre}
                </option>
              ))}
            </optgroup>
            {disenos.length > 0 && (
              <optgroup label="Catálogo flash">
                {disenos.map((diseno) => (
                  <option key={diseno.id} value={`diseno:${diseno.id}`}>
                    {diseno.nombre}
                    {diseno.precio !== null && ` · ${euros(Number(diseno.precio))}`}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-xs text-tenue">
        Notas
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} className={claseCampo} />
      </label>

      <dl className="ml-auto grid w-full max-w-xs gap-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-tenue">Base imponible</dt>
          <dd className="cifra">{euros(resumen.base)}</dd>
        </div>
        {resumen.porIva.map((grupo) => (
          <div key={grupo.iva} className="flex justify-between">
            <dt className="text-tenue">IVA {grupo.iva} %</dt>
            <dd className="cifra">{euros(grupo.cuota)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-borde pt-1 font-semibold">
          <dt>Total</dt>
          <dd className="cifra">{euros(resumen.total)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={ocupado} className="boton !px-4 !py-2">
          {ocupado ? "Guardando…" : id ? "Guardar cambios" : "Crear presupuesto"}
        </button>
        {id && (
          <>
            <button type="button" onClick={confirmar} disabled={ocupado} className="boton !px-4 !py-2">
              Confirmar venta
            </button>
            <button type="button" onClick={cancelar} disabled={ocupado} className="boton-fantasma">
              Cancelar
            </button>
          </>
        )}
        {error && (
          <span role="alert" className="text-sm text-acento">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
