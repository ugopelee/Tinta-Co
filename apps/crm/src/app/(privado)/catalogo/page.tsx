import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Diseno } from "@tinta/compartido/tipos";
import { Catalogo, type DisenoCatalogo } from "@/components/Catalogo";
import { Encabezado } from "@/components/Encabezado";

export const metadata: Metadata = { title: "Catálogo flash" };

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

/**
 * Los diseños flash que la web enseña en el formulario de reserva. Antes
 * solo se podían tocar desde Supabase; aquí se publican, se retiran y se
 * editan. Las reservas de cada uno se cuentan para no borrar historia.
 */
export default async function PaginaCatalogo() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("disenos")
    .select("*, citas(id)")
    .order("orden", { ascending: true });

  const disenos: DisenoCatalogo[] = ((data ?? []) as (Diseno & { citas: { id: string }[] })[]).map(
    ({ citas, ...diseno }) => ({ ...diseno, reservas: citas.length }),
  );

  const publicados = disenos.filter((diseno) => diseno.disponible).length;

  return (
    <>
      <Encabezado
        miga="Estudio · catálogo"
        titulo="Catálogo flash"
        nota="Lo que está «en la web» sale en el formulario de reserva. Retirar un diseño lo oculta sin perder sus reservas."
      >
        <span className="chip-lima cifra">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
          {publicados} de {disenos.length} en la web
        </span>
      </Encabezado>

      {error ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          No se ha podido cargar el catálogo.
        </p>
      ) : (
        <Catalogo disenos={disenos} urlWeb={URL_WEB} />
      )}
    </>
  );
}
