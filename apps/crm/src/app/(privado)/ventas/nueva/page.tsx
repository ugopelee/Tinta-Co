import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { Encabezado } from "@/components/Encabezado";
import { EditorVenta, lineaEditable, type LineaEditable } from "@/components/EditorVenta";

export const metadata: Metadata = { title: "Nuevo presupuesto" };

const texto = (valor: string | string[] | undefined) => (typeof valor === "string" ? valor : "");

export default async function NuevaVenta({ searchParams }: PageProps<"/ventas/nueva">) {
  const parametros = await searchParams;
  const supabase = await crearClienteServidor();

  const [{ data: clientes }, { data: disenos }] = await Promise.all([
    supabase.from("clientes").select("id, nombre").order("nombre"),
    supabase.from("disenos").select("id, nombre, precio").eq("disponible", true).order("nombre"),
  ]);

  let clienteId = texto(parametros.cliente);
  let citaId: string | null = null;
  const lineas: LineaEditable[] = [];

  // Con una cita, el cliente es el suyo y su diseño (si lo tiene) abre el presupuesto.
  const idCita = texto(parametros.cita);
  if (idCita) {
    const { data: cita } = await supabase
      .from("citas")
      .select("id, cliente_id, diseno_id")
      .eq("id", idCita)
      .maybeSingle();

    if (cita) {
      citaId = cita.id as string;
      clienteId = (cita.cliente_id as string | null) ?? clienteId;

      if (cita.diseno_id) {
        const { data: diseno } = await supabase
          .from("disenos")
          .select("id, nombre, precio")
          .eq("id", cita.diseno_id)
          .maybeSingle();
        if (diseno) {
          lineas.push(
            lineaEditable({
              descripcion: diseno.nombre as string,
              diseno_id: diseno.id as string,
              precio_unitario: Number(diseno.precio ?? 0),
            }),
          );
        }
      }
    }
  }

  return (
    <div className="max-w-4xl">
      <Encabezado miga="Ventas · nuevo" titulo="Nuevo presupuesto" />
      <EditorVenta
        clienteId={clienteId}
        citaId={citaId}
        validaHasta={null}
        notas={null}
        lineasIniciales={lineas}
        clientes={(clientes ?? []) as { id: string; nombre: string }[]}
        disenos={(disenos ?? []).map((d) => ({ id: d.id as string, nombre: d.nombre as string, precio: d.precio as number | null }))}
      />
    </div>
  );
}
