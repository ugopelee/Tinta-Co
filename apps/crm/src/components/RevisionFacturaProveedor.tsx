"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { FacturaProveedor } from "@tinta/compartido/tipos";
import { revisarFacturaProveedor } from "@/app/acciones-facturas";
import { claseCampo } from "@/components/FormularioAlta";
import { euros } from "@/lib/importes";

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-tenue">{etiqueta}</span>
      {children}
    </label>
  );
}

/** Lo que leyó el agente, editable, para contrastarlo con el original y validarlo o descartarlo. */
export function RevisionFacturaProveedor({ factura }: { factura: FacturaProveedor }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");
  const [numero, setNumero] = useState(factura.numero);
  const [fecha, setFecha] = useState(factura.fecha);
  const [proveedor, setProveedor] = useState(factura.proveedor);
  const [nif, setNif] = useState(factura.nif ?? "");
  // Los importes se editan como texto para no perder lo que se escribe a medias.
  const [base, setBase] = useState(String(factura.base));
  const [iva, setIva] = useState(String(factura.iva));
  const [total, setTotal] = useState(String(factura.total));

  const [numBase, numIva, numTotal] = [base, iva, total].map((valor) =>
    valor.trim() === "" ? NaN : Number(valor.replace(",", ".")),
  );
  const descuadra =
    [numBase, numIva, numTotal].every(Number.isFinite) && Math.abs(Math.round(numBase * 100) + Math.round(numIva * 100) - Math.round(numTotal * 100)) > 2;

  function resolver(estado: "validada" | "descartada") {
    const texto =
      estado === "validada"
        ? "La factura contará como gasto y ya no se podrá modificar. ¿Validar?"
        : "La factura se descartará y no contará como gasto. ¿Descartar?";
    if (!window.confirm(texto)) return;
    iniciar(async () => {
      const resultado = await revisarFacturaProveedor(
        factura.id,
        { numero, fecha, proveedor, nif: nif || null, base: numBase, iva: numIva, total: numTotal },
        estado,
      );
      if (!resultado.ok) return setError(resultado.mensaje);
      setError("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Campo etiqueta="Proveedor">
          <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} className={claseCampo} disabled={ocupado} />
        </Campo>
        <Campo etiqueta="NIF">
          <input value={nif} onChange={(e) => setNif(e.target.value)} className={claseCampo} disabled={ocupado} />
        </Campo>
        <Campo etiqueta="Número">
          <input value={numero} onChange={(e) => setNumero(e.target.value)} className={claseCampo} disabled={ocupado} />
        </Campo>
        <Campo etiqueta="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseCampo} disabled={ocupado} />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Base (€)">
          <input inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} className={`${claseCampo} cifra`} disabled={ocupado} />
        </Campo>
        <Campo etiqueta="IVA (€)">
          <input inputMode="decimal" value={iva} onChange={(e) => setIva(e.target.value)} className={`${claseCampo} cifra`} disabled={ocupado} />
        </Campo>
        <Campo etiqueta="Total (€)">
          <input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={`${claseCampo} cifra`} disabled={ocupado} />
        </Campo>
      </div>

      {descuadra && (
        <p className="text-sm text-acento">
          La base más el IVA suma {euros(numBase + numIva)} y el total indica {euros(numTotal)}. Revisa los importes
          con el original.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={ocupado} onClick={() => resolver("validada")} className="boton !px-4 !py-2">
          Validar
        </button>
        <button type="button" disabled={ocupado} onClick={() => resolver("descartada")} className="boton-fantasma">
          Descartar
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-acento">
          {error}
        </p>
      )}
    </div>
  );
}
