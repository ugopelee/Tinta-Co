"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cambiarRolCuenta } from "@/app/crm/acciones";
import type { Perfil } from "@/lib/tipos";

export function ListaCuentas({
  perfiles,
  idPropio,
}: {
  perfiles: Perfil[];
  idPropio: string;
}) {
  const [visibles, aplicarCambio] = useOptimistic(
    perfiles,
    (actuales: Perfil[], cambio: { id: string; rol: Perfil["rol"] }) =>
      actuales.map((perfil) =>
        perfil.id === cambio.id ? { ...perfil, rol: cambio.rol } : perfil,
      ),
  );

  const [, iniciarTransicion] = useTransition();
  const [error, setError] = useState("");

  function alternar(perfil: Perfil) {
    const rol = perfil.rol === "propietario" ? "artista" : "propietario";

    iniciarTransicion(async () => {
      aplicarCambio({ id: perfil.id, rol });
      setError("");
      const resultado = await cambiarRolCuenta(perfil.id, rol);
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  // Las cuentas saltan de una sección a otra según sus permisos.
  const equipo = visibles.filter((perfil) => perfil.rol === "propietario");
  const resto = visibles.filter((perfil) => perfil.rol !== "propietario");

  return (
    <div className="space-y-14">
      {error && (
        <p role="alert" className="text-sm text-acento-suave">
          {error}
        </p>
      )}

      <Seccion
        titulo="Equipo"
        descripcion="Cuentas con permisos de propietario. Ven las reservas, las fichas de clientes y esta misma lista."
        perfiles={equipo}
        vacio="Todavía no hay nadie en el equipo."
        idPropio={idPropio}
        onAlternar={alternar}
      />

      <Seccion
        titulo="Otras cuentas"
        descripcion="Registradas en la web, sin acceso a ningún dato. Dales permisos para que pasen al equipo."
        perfiles={resto}
        vacio="No hay más cuentas registradas."
        idPropio={idPropio}
        onAlternar={alternar}
      />
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  perfiles,
  vacio,
  idPropio,
  onAlternar,
}: {
  titulo: string;
  descripcion: string;
  perfiles: Perfil[];
  vacio: string;
  idPropio: string;
  onAlternar: (perfil: Perfil) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <h2 className="titular text-2xl">{titulo}</h2>
        <span className="etiqueta text-tenue">{perfiles.length}</span>
      </div>
      <p className="parrafo mt-2 max-w-xl text-sm text-tenue">{descripcion}</p>

      {perfiles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-borde px-5 py-8 text-center text-sm text-tenue">
          {vacio}
        </p>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-xl border border-borde">
          {perfiles.map((perfil) => {
            const esPropietario = perfil.rol === "propietario";

            return (
              <li
                key={perfil.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-borde bg-superficie px-5 py-4 transition-colors duration-500 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium">
                      {perfil.nombre ?? "Sin nombre"}
                    </p>
                    {perfil.id === idPropio && (
                      <span className="etiqueta text-acento">tú</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-tenue">
                    {perfil.email}
                  </p>
                  <p className="mt-1 text-xs text-tenue/70">
                    Registrada el{" "}
                    {new Date(perfil.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAlternar(perfil)}
                  disabled={perfil.id === idPropio}
                  className="rounded-full border border-borde px-4 py-2 text-sm transition-colors duration-300 hover:border-acento hover:text-texto disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {esPropietario ? "Sacar del equipo" : "Añadir al equipo"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
