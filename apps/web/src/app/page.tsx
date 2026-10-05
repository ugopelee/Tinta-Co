import { estudio } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Diseno } from "@tinta/compartido/tipos";
import { Revelar } from "@/components/animaciones";
import { Catalogo } from "@/components/Catalogo";
import { EnlaceMagnetico, HoraMadrid } from "@/components/detalles";
import { Encabezado } from "@/components/Encabezado";
import { Estudio } from "@/components/Estudio";
import { FondoVivo } from "@/components/FondoVivo";
import { FormularioReserva } from "@/components/FormularioReserva";
import type { Sesion } from "@/components/MenuCuenta";
import { Navegacion } from "@/components/Navegacion";
import { PapelRasgado } from "@/components/PapelRasgado";
import { LienzoPuntos } from "@/components/puntos/LienzoPuntos";
import { Servicios } from "@/components/Servicios";
import { VolverArriba } from "@/components/VolverArriba";
import { fotosEstudio } from "@/lib/flash";

/** Oficios del estudio, al pie de la portada. */
const OFICIOS = ["flash de autor", "piezas a medida", "piercing", "retoques", "eventos"];

export default async function Landing() {
  const supabase = await crearClienteServidor();

  // RLS ya limita al público a los diseños disponibles, pero un propietario
  // con sesión vería también los retirados. La web pública enseña lo mismo a
  // todo el mundo, así que el filtro va explícito.
  const { data } = await supabase
    .from("disenos")
    .select("*")
    .eq("disponible", true)
    .order("orden", { ascending: true });

  const disenos = (data ?? []) as Diseno[];
  const sesion = await leerSesion();

  return (
    <>
      {/* Un único lienzo para toda la página: cada sección le pide su forma
          con data-forma y su sitio con data-lado. */}
      <LienzoPuntos />
      <Navegacion sesion={sesion} />
      <VolverArriba />
      <FondoVivo />

      <main className="relative z-10">
        <Portada />
        <Estudio />
        <Servicios />
        <Catalogo disenos={disenos} />
        <Reserva disenos={disenos} />
      </main>

      <Pie />
    </>
  );
}

/** Datos mínimos de quien mira la página, para el menú de cuenta. */
async function leerSesion(): Promise<Sesion | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("perfiles")
    .select("nombre, email, rol")
    .eq("id", user.id)
    .maybeSingle();

  return {
    nombre: data?.nombre ?? data?.email ?? user.email ?? "Mi cuenta",
    email: data?.email ?? user.email ?? "",
    esPropietario: data?.rol === "propietario",
  };
}

/**
 * La portada es una hoja de papel de calco con el titular. Al bajar se
 * rasga y detrás aparece la piel tatuada, con el resto de la portada encima.
 */
function Portada() {
  const [lineaA, lineaB, lineaC] = estudio.hero.lineas;
  // "Tinta que aguanta el paso del tiempo": la cola marcada en `enfasis`
  // va en cursiva y en el tono de la sección.
  const tituloEnfasis = estudio.hero.enfasis.join(" ");
  const tituloSinEnfasis = estudio.hero.titulo.replace(tituloEnfasis, "").trim();

  return (
    <PapelRasgado
      id="inicio"
      data-forma="esfera"
      data-lado="oculto"
      data-fondo="#08080a"
      data-tono="#e0745e"
      rotulo={`${lineaA} ${lineaB}`.toUpperCase()}
      palabra={`${lineaC}.`}
      pieIzquierda="ESTUDIO DE TATUAJE · MADRID"
      pieDerecha="BAJA PARA ABRIR ↓"
      recorrido="130svh"
      foto={fotosEstudio.espalda}
      altFoto="una espalda entera tatuada"
      sobrePapel={
        <div className="absolute inset-x-0 bottom-[14svh] flex flex-wrap justify-center gap-3 px-5 md:bottom-[16svh]">
          <a
            href="#reserva"
            className="rounded-full bg-[#17161a] px-6 py-3 text-sm text-[#ebe6dc] transition-[transform,background-color] duration-150 ease-out hover:bg-[#c2452f] active:scale-[0.97]"
          >
            {estudio.hero.cta}
          </a>
          <a
            href="#catalogo"
            className="rounded-full border border-[#17161a]/25 px-6 py-3 text-sm text-[#17161a] transition-[transform,border-color] duration-150 ease-out hover:border-[#17161a]/60 active:scale-[0.97]"
          >
            {estudio.hero.ctaSecundario}
          </a>
        </div>
      }
    >
      {/* La foto es oscura en los lados y clara en el centro: un velo desde
          la izquierda asienta el titular sin apagar la espalda. */}
      <div
        aria-hidden
        // Termina en el mismo negro que la orla de la portada y el arranque
        // de Estudio: los tres empalman sin costura.
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(8_8_10/0.82)_0%,rgb(8_8_10/0.45)_38%,transparent_62%),linear-gradient(0deg,rgb(8_8_10)_0%,rgb(8_8_10/0.55)_30%,transparent_58%)]"
      />
      <div className="contenedor relative flex h-full flex-col justify-end pb-8 md:pb-10">
        <div className="grid grid-cols-1 items-end gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-texto/60">
              <span className="text-acento-suave">Nº 01</span>
              <span className="h-px w-10 bg-white/25" />
              Estudio de tatuaje en Madrid
            </p>
            <h1 className="titular-portada mt-6 text-[clamp(3rem,7.4vw,7.25rem)]">
              {tituloSinEnfasis} <em className="text-acento-suave">{tituloEnfasis}</em>.
            </h1>
          </div>

          <div className="max-w-sm lg:col-span-4 lg:pb-3">
            <p className="text-[0.95rem] leading-[1.6] text-texto/70 [text-wrap:pretty]">
              {estudio.hero.entradilla}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <EnlaceMagnetico
                href="#reserva"
                className="inline-flex h-11 items-center gap-2.5 rounded-[3px] bg-texto px-5 text-[0.85rem] font-medium text-fondo transition-colors hover:bg-acento-suave"
              >
                {estudio.hero.cta}
                <span aria-hidden>→</span>
              </EnlaceMagnetico>
              <a
                href="#catalogo"
                className="enlace-sutil text-[0.85rem] text-texto/75 transition-colors hover:text-texto"
              >
                {estudio.hero.ctaSecundario}
              </a>
            </div>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-3 border-t border-white/[0.12] pt-5 md:mt-16 md:grid-cols-4">
          {[
            { valor: "4,9", etiqueta: "Valoración media" },
            {
              // es-ES no separa los miles con cuatro cifras ("4200"); de-DE pone el punto.
              valor: `${estudio.cifras[1].valor.toLocaleString("de-DE")}${estudio.cifras[1].sufijo}`,
              etiqueta: estudio.cifras[1].etiqueta,
            },
            { valor: String(estudio.cifras[0].valor), etiqueta: estudio.cifras[0].etiqueta },
          ].map((cifra) => (
            <div key={cifra.etiqueta} className="flex flex-col-reverse gap-1.5">
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-texto/45">
                {cifra.etiqueta}
              </dt>
              <dd className="font-serif text-[clamp(1.6rem,2.4vw,2.1rem)] leading-none tabular-nums">
                {cifra.valor}
              </dd>
            </div>
          ))}
          <div className="hidden self-end text-right font-mono text-[0.62rem] uppercase leading-[1.9] tracking-[0.14em] text-texto/45 md:block">
            {OFICIOS.join(" · ")}
          </div>
        </dl>
      </div>
    </PapelRasgado>
  );
}

function Reserva({ disenos }: { disenos: Diseno[] }) {
  return (
    <section
      id="reserva"
      data-fondo="#08150f"
      data-tono="#5fd3a0"
      data-forma="onda"
      data-lado="fondo"
      className="relative scroll-mt-10 pb-[22svh] pt-28 md:pt-40"
    >
      <div className="contenedor grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-20">
        <div>
          <Encabezado
            etiqueta="Escríbenos"
            titulo="Cuéntanos"
            cursiva="tu idea."
            descripcion="Una cita, un evento o una propuesta para el estudio: todo entra por aquí y lo lee una persona. Respondemos en menos de 48 horas."
          />

          <Revelar retardo={240}>
            <ul className="mt-12 space-y-4 text-sm text-tenue">
              <li className="flex items-center gap-3">
                <span className="punto-vivo" />
                Agenda abierta · respuesta en menos de 48 h
              </li>
              <li>
                <a
                  href={`mailto:${estudio.contacto.email}`}
                  className="enlace-sutil transition-colors hover:text-texto"
                >
                  {estudio.contacto.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${estudio.contacto.telefono.replace(/\s/g, "")}`}
                  className="enlace-sutil transition-colors hover:text-texto"
                >
                  {estudio.contacto.telefono}
                </a>
              </li>
            </ul>
          </Revelar>
        </div>

        <Revelar retardo={160}>
          <div id="formulario-reserva" className="cristal scroll-mt-24 rounded-[2rem] p-6 md:p-8">
            <FormularioReserva disenos={disenos} />
          </div>
        </Revelar>
      </div>
    </section>
  );
}


function Pie() {
  return (
    <footer
      id="contacto"
      data-fondo="#08080a"
      data-tono="#e0745e"
      data-forma="onda"
      data-lado="fondo"
      className="relative z-10 overflow-hidden pb-28 md:pb-10"
    >
      <div className="contenedor">
        <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-8 text-sm text-tenue md:grid-cols-4">
          <p>{estudio.contacto.direccion}</p>
          <p>{estudio.contacto.horario}</p>
          <p>
            Madrid · <HoraMadrid />
          </p>
          <div className="flex gap-5 md:justify-end">
            <span>{estudio.contacto.instagram}</span>
            <a href="#inicio" className="enlace-sutil transition-colors hover:text-texto">
              Arriba ↑
            </a>
          </div>
        </div>

        <p
          aria-hidden
          className="serif-cursiva pointer-events-none mt-10 select-none bg-gradient-to-b from-white/[0.14] to-transparent bg-clip-text text-center text-[clamp(4rem,19vw,17rem)] leading-[0.8] text-transparent"
        >
          {estudio.nombre}
        </p>

        <p className="mt-6 text-center text-xs text-tenue/60">
          © {new Date().getFullYear()} {estudio.nombre}. Hecho a mano en Madrid.
        </p>
      </div>
    </footer>
  );
}
