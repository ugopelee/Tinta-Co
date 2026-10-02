import type { Metadata } from "next";
import Link from "next/link";
import { estudio } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { Bloque } from "@/components/Bloque";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Icono";
import { creditosFotos } from "@/lib/creditos";
import { googleDisponible } from "@/lib/google";

export const metadata: Metadata = { title: "Ayuda y soporte" };

const GUIA = [
  {
    titulo: "Entra una solicitud",
    texto:
      "Las citas, eventos y propuestas llegan solas desde el formulario de la web. Aquí no se crean: se contestan y se gestionan.",
    enlace: { href: "/oportunidades", texto: "Ver el tablero" },
  },
  {
    titulo: "Muévela de estado",
    texto:
      "Arrastra la tarjeta a otra columna o usa su desplegable: Solicitada → Confirmada → Realizada, o Cancelada.",
    enlace: { href: "/oportunidades", texto: "Abrir oportunidades" },
  },
  {
    titulo: "Apunta el cobro",
    texto:
      "En Facturación toca el importe para cambiarlo y el estado para marcarlo como cobrado, con su método de pago.",
    enlace: { href: "/facturacion", texto: "Ir a facturación" },
  },
  {
    titulo: "Deja historial",
    texto:
      "En la ficha de cada cliente añade tatuajes, retoques o notas internas. Es lo que verás la próxima vez que venga.",
    enlace: { href: "/clientes", texto: "Ver clientes" },
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Por qué alguien con cuenta no ve el panel?",
    respuesta:
      "Registrarse no da acceso. Solo las cuentas con rol de propietario entran; el resto ve la página «Sin acceso». Desde Cuentas puedes dar o quitar ese permiso.",
  },
  {
    pregunta: "¿Dónde están las propuestas de proveedores y colaboraciones?",
    respuesta:
      "En Oportunidades, pestaña Propuestas. No crean ficha de cliente ni se cobran: se responden por email y se marca en qué punto está la conversación.",
  },
  {
    pregunta: "¿Qué cuenta como «pendiente de cobro»?",
    respuesta:
      "Solo lo comprometido: oportunidades confirmadas o realizadas que todavía no tienen el cobro marcado. Las solicitudes sin confirmar no suman.",
  },
  {
    pregunta: "¿De dónde salen los avisos del resumen?",
    respuesta:
      "De reglas fijas sobre los datos: solicitudes con más de 3 días sin respuesta, citas confirmadas cuya fecha ya pasó, citas realizadas sin cobrar y confirmadas sin fecha.",
  },
  {
    pregunta: "¿Por qué no aparece el botón de entrar con Google?",
    respuesta:
      "Porque el proveedor está apagado en Supabase. Se enciende desde su panel con credenciales de Google Cloud; en cuanto esté activo el botón aparece solo.",
  },
];

const ATAJOS = [
  { teclas: ["Ctrl", "K"], texto: "Buscar un cliente desde cualquier vista" },
  { teclas: ["Intro"], texto: "Guardar un importe mientras lo editas" },
  { teclas: ["Esc"], texto: "Cancelar la edición de un importe" },
];

/** Comprobaciones reales, no un semáforo decorativo: si falla, se ve aquí. */
async function estadoServicios() {
  const supabase = await crearClienteServidor();
  const [{ error }, google] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    googleDisponible(),
  ]);

  return [
    {
      nombre: "Base de datos",
      bien: !error,
      detalle: error ? "No responde" : "Conectada",
    },
    {
      nombre: "Acceso con email",
      bien: true,
      detalle: "Activo",
    },
    {
      nombre: "Acceso con Google",
      bien: google,
      detalle: google ? "Activo" : "Apagado en Supabase",
    },
  ];
}

export default async function Ayuda() {
  const servicios = await estadoServicios();
  const asunto = encodeURIComponent(`Incidencia en el panel de ${estudio.nombre}`);

  return (
    <>
      <Encabezado
        miga="Ayuda · soporte"
        titulo="Ayuda y soporte"
        nota="Cómo funciona el panel, respuestas a las dudas de siempre y a quién escribir si algo falla."
      />

      <div className="grid items-start gap-3 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <Bloque titulo="Guía rápida" nota="El recorrido de una oportunidad, de la web a la caja">
            <ol className="grid gap-2 sm:grid-cols-2">
              {GUIA.map((paso, indice) => (
                <li key={paso.titulo} className="fila flex flex-col p-4">
                  <span className="cifra flex h-7 w-7 items-center justify-center rounded-full bg-texto text-xs font-semibold text-fondo">
                    {indice + 1}
                  </span>
                  <p className="mt-3 font-semibold tracking-tight">{paso.titulo}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-tenue">{paso.texto}</p>
                  <Link
                    href={paso.enlace.href}
                    className="group mt-3 inline-flex items-center gap-1.5 self-start text-sm font-medium"
                  >
                    {paso.enlace.texto}
                    <Icono
                      nombre="flecha"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </Bloque>

          <Bloque titulo="Preguntas frecuentes">
            <ul className="space-y-2">
              {PREGUNTAS.map((item) => (
                <li key={item.pregunta}>
                  <details className="fila group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                      {item.pregunta}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-superficie transition-transform duration-300 group-open:rotate-45">
                        <Icono nombre="mas" className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="mt-2 pr-10 text-sm leading-relaxed text-tenue">
                      {item.respuesta}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </Bloque>
        </div>

        <div className="space-y-3">
          {/* El contacto va en la tarjeta invertida: es lo único de la
              página que pide hacer algo. */}
          <section className="rounded-[1.25rem] bg-texto p-5 text-fondo">
            <div className="flex items-center gap-2 text-[0.8125rem] text-fondo/60">
              <Icono nombre="mensaje" className="h-4 w-4" />
              Soporte técnico
            </div>
            <h2 className="titular mt-3 text-lg leading-snug">¿Algo no funciona?</h2>
            <p className="mt-2 text-sm leading-relaxed text-fondo/70">
              Cuéntanos qué pasaba, en qué pantalla y, si puedes, adjunta una captura.{" "}
              {estudio.soporte.respuesta}
            </p>

            <a
              href={`mailto:${estudio.soporte.email}?subject=${asunto}`}
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-lima px-4 py-2 text-sm font-medium text-sobre-lima transition-opacity duration-200 hover:opacity-90"
            >
              Escribir a soporte
              <Icono
                nombre="flecha"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </a>

            <dl className="mt-5 space-y-1.5 border-t border-fondo/15 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fondo/60">Email</dt>
                <dd className="truncate">{estudio.soporte.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fondo/60">Horario</dt>
                <dd className="truncate">{estudio.soporte.horario}</dd>
              </div>
            </dl>
          </section>

          <Bloque titulo="Estado de los servicios" nota="Comprobado al abrir esta página">
            <ul className="space-y-2">
              {servicios.map((servicio) => (
                <li key={servicio.nombre} className="fila flex items-center gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      servicio.bien ? "bg-verde" : "bg-tenue/40"
                    }`}
                  />
                  <span className="flex-1 text-sm font-medium">{servicio.nombre}</span>
                  <span className="insignia text-tenue">{servicio.detalle}</span>
                </li>
              ))}
            </ul>
          </Bloque>

          <Bloque titulo="Atajos de teclado">
            <ul className="space-y-2">
              {ATAJOS.map((atajo) => (
                <li key={atajo.texto} className="fila flex items-center gap-3 px-4 py-3">
                  <span className="flex shrink-0 gap-1">
                    {atajo.teclas.map((tecla) => (
                      <kbd
                        key={tecla}
                        className="rounded-md bg-superficie px-2 py-0.5 font-sans text-xs font-medium shadow-[0_1px_0_var(--borde)]"
                      >
                        {tecla}
                      </kbd>
                    ))}
                  </span>
                  <span className="text-sm text-tenue">{atajo.texto}</span>
                </li>
              ))}
            </ul>
          </Bloque>

          <Bloque titulo="Créditos de las fotos" nota="Catálogo flash · fotos de Unsplash">
            <ul className="space-y-1.5 text-[0.8125rem]">
              {creditosFotos.map((credito) => (
                <li key={credito.diseno} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{credito.diseno}</span>
                    <span className="text-tenue"> · </span>
                    <a href={credito.url} target="_blank" rel="noreferrer" className="enlace-sutil text-tenue">
                      {credito.autor}
                    </a>
                  </span>
                  <span className="shrink-0 text-xs text-tenue">{credito.licencia}</span>
                </li>
              ))}
            </ul>
          </Bloque>
        </div>
      </div>
    </>
  );
}
