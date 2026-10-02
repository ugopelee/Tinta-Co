"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cambiarRolCuenta } from "@/app/acciones";
import type { Perfil } from "@tinta/compartido/tipos";

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
      <div className="flex items-center gap-2.5">
        <h2 className="text-[0.9375rem] font-medium">{titulo}</h2>
        <span className="cifra rounded-full border border-borde px-2 py-0.5 text-xs text-tenue">
          {perfiles.length}
        </span>
      </div>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-tenue">
        {descripcion}
      </p>

      {perfiles.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-borde px-5 py-8 text-center text-sm text-tenue">
          {vacio}
        </p>
      ) : (
        <ul className="tarjeta mt-4 overflow-hidden">
          {perfiles.map((perfil) => {
            const esPropietario = perfil.rol === "propietario";

            return (
              <li
                key={perfil.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-borde px-4 py-3.5 transition-colors duration-300 last:border-b-0 hover:bg-superficie-alta"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium">
                      {perfil.nombre ?? "Sin nombre"}
                    </p>
                    {perfil.id === idPropio && (
                      <span className="rounded-full bg-lima px-2 py-0.5 text-[0.7rem] font-semibold text-sobre-lima">tú</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-tenue">
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
                  className="rounded-lg border border-borde px-3.5 py-2 text-sm text-tenue transition-colors duration-200 hover:border-texto hover:text-texto disabled:cursor-not-allowed disabled:opacity-40"
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
