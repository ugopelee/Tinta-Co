import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCandidato } from "@tinta/compartido/estudio";
import type { Candidato } from "@tinta/compartido/tipos";
import { AccionesCandidato } from "@/components/AccionesCandidato";
import { Encabezado } from "@/components/Encabezado";
import { FormularioCandidato } from "@/components/FormularioCandidato";
import { Icono } from "@/components/Icono";
import { PastillaColor } from "@/components/PastillaColor";
import { fechaCorta } from "@/lib/equipo";

export const metadata: Metadata = { title: "Selección" };

/** Columnas del proceso abierto; contratados y descartados van debajo. */
const ABIERTAS = ["nuevo", "entrevista", "oferta"] as const;

/**
 * Procesos de admisión. Cada candidato entra con su CV y pasa por CV
 * recibido → Entrevista → Oferta. «Contratar» crea su ficha de empleado con
 * su email, la checklist de incorporación y la cuenta del CRM.
 */
export default async function Seleccion() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("candidatos").select("*").order("created_at", { ascending: false });
  const candidatos = (data ?? []) as Candidato[];

  const de = (estado: Candidato["estado"]) => candidatos.filter((c) => c.estado === estado);
  const abiertos = candidatos.filter((c) => (ABIERTAS as readonly string[]).includes(c.estado)).length;
  const cerrados = [...de("contratado"), ...de("descartado")];

  return (
    <>
      <Encabezado
        miga="Equipo · selección"
        titulo="Procesos de admisión"
        nota="Cada candidato entra con su CV. Al contratarlo se crea solo su ficha, su checklist de incorporación y su cuenta del CRM."
      >
        <span className="chip-lima cifra">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
          {abiertos} {abiertos === 1 ? "proceso abierto" : "procesos abiertos"}
        </span>
      </Encabezado>

      <FormularioCandidato />

      <div className="grid gap-3 lg:grid-cols-3">
        {ABIERTAS.map((estado) => {
          const fase = estadosCandidato.find((e) => e.id === estado)!;
          const lista = de(estado);
          return (
            <section key={estado} className="tarjeta p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <PastillaColor nombre={fase.nombre} color={fase.color} />
                <span className="cifra text-tenue">{lista.length}</span>
              </h2>
              {lista.length === 0 ? (
                <p className="fila px-4 py-3 text-xs text-tenue">Nadie en esta fase.</p>
              ) : (
                <ul className="space-y-2">
                  {lista.map((candidato) => (
                    <li key={candidato.id} className="fila p-4">
                      <TarjetaCandidato candidato={candidato} />
                      <AccionesCandidato id={candidato.id} nombre={candidato.nombre} estado={estado} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {cerrados.length > 0 && (
        <section className="tarjeta mt-3 p-4">
          <h2 className="mb-3 text-sm font-semibold">Procesos cerrados</h2>
          <ul className="space-y-2">
            {cerrados.map((candidato) => {
              const fase = estadosCandidato.find((e) => e.id === candidato.estado)!;
              return (
                <li key={candidato.id} className="fila flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <TarjetaCandidato candidato={candidato} />
                  </div>
                  <PastillaColor nombre={fase.nombre} color={fase.color} />
                  {candidato.estado === "contratado" && candidato.empleado_id ? (
                    <Link
                      href={`/equipo/${candidato.empleado_id}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Ver su ficha
                    </Link>
                  ) : candidato.estado === "descartado" ? (
                    <AccionesCandidato id={candidato.id} nombre={candidato.nombre} estado="descartado" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function TarjetaCandidato({ candidato }: { candidato: Candidato }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[0.9375rem] font-semibold">{candidato.nombre}</p>
      <p className="truncate text-xs text-tenue">
        {candidato.puesto}
        {candidato.departamento && ` · ${candidato.departamento}`}
      </p>
      <p className="truncate text-xs text-tenue">
        {candidato.email}
        {candidato.telefono && ` · ${candidato.telefono}`}
      </p>
      {candidato.notas && <p className="mt-1.5 text-xs leading-relaxed">{candidato.notas}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          href={`/cvs/${candidato.id}`}
          target="_blank"
          rel="noreferrer"
          className="insignia inline-flex items-center gap-1.5 text-[0.75rem]"
        >
          <Icono nombre="documento" className="h-3.5 w-3.5" />
          Ver CV
        </a>
        <span className="text-[0.7rem] text-tenue">Recibido el {fechaCorta(candidato.created_at)}</span>
      </div>
    </div>
  );
}
