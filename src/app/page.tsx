import { estudio } from "@/config/estudio";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Diseno } from "@/lib/tipos";
import {
  BarraProgreso,
  Contador,
  Filete,
  Marquesina,
  Parallax,
  Revelar,
  TextoRevelado,
} from "@/components/animaciones";
import { Cabecera } from "@/components/Cabecera";
import type { Sesion } from "@/components/MenuCuenta";
import { CatalogoPlegable } from "@/components/CatalogoPlegable";
import { FormularioReserva } from "@/components/FormularioReserva";

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
    <div className="relative z-10">
      <BarraProgreso />
      <Cabecera sesion={sesion} />

      <main>
        <Hero />
        <Cifras />
        <Servicios />
        <Marquesina palabras={estudio.marquesina} />
        <Catalogo disenos={disenos} />
        <Reserva disenos={disenos} />
      </main>

      <Pie />
    </div>
  );
}

/** Datos mínimos de quien está viendo la página, para el menú de cuenta. */
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

function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden px-6 pb-24 pt-36">
      <Parallax
        intensidad={0.22}
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div
          aria-hidden
          className="h-[42rem] w-[42rem] -translate-y-1/3 rounded-full opacity-25 blur-[130px]"
          style={{ background: "var(--acento)" }}
        />
      </Parallax>

      <div className="relative mx-auto w-full max-w-5xl">
        <Revelar>
          <div className="mb-8 flex items-center gap-4">
            <Filete className="h-px w-12 bg-acento" retardo={200} />
            <p className="etiqueta text-tenue">{estudio.eslogan}</p>
          </div>
        </Revelar>

        <h1 className="titular text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.94]">
          <TextoRevelado
            texto={estudio.hero.titulo}
            enfasis={estudio.hero.enfasis}
          />
        </h1>

        <div className="mt-14 grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <Revelar retardo={560}>
            <p className="parrafo max-w-md text-base text-tenue sm:text-lg">
              {estudio.hero.entradilla}
            </p>
          </Revelar>

          <Revelar retardo={680}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#reserva"
                className="boton-barrido rounded-full bg-acento px-8 py-4 text-center font-medium text-white transition-colors duration-300"
              >
                {estudio.hero.cta}
              </a>
              <a
                href="#catalogo"
                className="rounded-full border border-borde px-8 py-4 text-center transition-all duration-300 hover:border-texto hover:bg-superficie/60"
              >
                {estudio.hero.ctaSecundario}
              </a>
            </div>
          </Revelar>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-8 hidden justify-center sm:flex"
      >
        <span className="h-12 w-px animate-pulse bg-gradient-to-b from-transparent via-tenue to-transparent" />
      </div>
    </section>
  );
}

function Cifras() {
  return (
    <section className="border-y border-borde px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 lg:grid-cols-4">
        {estudio.cifras.map((cifra, indice) => (
          <Revelar key={cifra.etiqueta} retardo={indice * 90}>
            <p className="titular cifra text-4xl sm:text-5xl">
              <Contador valor={cifra.valor} sufijo={cifra.sufijo} />
            </p>
            <Filete
              className="mt-4 h-px w-full bg-borde"
              retardo={indice * 90 + 200}
            />
            <p className="etiqueta mt-4 text-tenue">{cifra.etiqueta}</p>
          </Revelar>
        ))}
      </div>
    </section>
  );
}

function Servicios() {
  return (
    <section id="servicios" className="scroll-mt-24 px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <TituloSeccion etiqueta="Qué hacemos" titulo="Servicios del estudio" />

        <div className="mt-20">
          <Filete className="h-px w-full bg-borde" />
          {estudio.servicios.map((servicio, indice) => (
            <Revelar key={servicio.id} retardo={indice * 70}>
              <article className="group grid gap-4 border-b border-borde py-10 transition-colors duration-500 hover:bg-superficie/40 sm:grid-cols-[6rem_1fr_auto] sm:items-baseline sm:gap-10 sm:px-6">
                <span className="etiqueta text-acento">0{indice + 1}</span>

                <div>
                  <h3 className="titular text-2xl transition-transform duration-500 sm:text-3xl sm:group-hover:translate-x-2">
                    {servicio.nombre}
                  </h3>
                  <p className="parrafo mt-3 max-w-xl text-sm text-tenue">
                    {servicio.descripcion}
                  </p>
                </div>

                <p className="whitespace-nowrap text-sm text-tenue transition-colors duration-500 group-hover:text-texto">
                  {servicio.detalle}
                </p>
              </article>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}

function Catalogo({ disenos }: { disenos: Diseno[] }) {
  return (
    <section id="catalogo" className="scroll-mt-24 px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <TituloSeccion
          etiqueta="Catálogo flash"
          titulo="Diseños listos para tatuar"
          descripcion="Piezas ya dibujadas, con precio cerrado. Cada una se tatúa una sola vez. Abre el estilo que te interese y toca una para llevarla al formulario."
        />

        {disenos.length === 0 ? (
          <p className="mt-16 rounded-xl border border-borde bg-superficie p-10 text-center text-tenue">
            Estamos preparando el próximo set de flash. Vuelve pronto.
          </p>
        ) : (
          <div className="mt-20">
            <CatalogoPlegable disenos={disenos} />
          </div>
        )}
      </div>
    </section>
  );
}

function Reserva({ disenos }: { disenos: Diseno[] }) {
  return (
    <section
      id="reserva"
      className="relative scroll-mt-24 overflow-hidden px-6 py-24 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-[0.12] blur-[140px]"
        style={{ background: "var(--acento)" }}
      />

      <div className="relative mx-auto max-w-3xl">
        <TituloSeccion
          etiqueta="Cita previa"
          titulo={estudio.reserva.titulo}
          descripcion={estudio.reserva.entradilla}
        />

        <Revelar retardo={180}>
          <div className="mt-14 rounded-2xl border border-borde bg-superficie/70 p-6 backdrop-blur-sm sm:p-10">
            <FormularioReserva disenos={disenos} />
          </div>
        </Revelar>
      </div>
    </section>
  );
}

function Pie() {
  return (
    <footer className="border-t border-borde px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <Revelar>
          <p className="titular text-[clamp(2.5rem,10vw,6rem)] leading-none text-superficie-alta">
            {estudio.nombre}
          </p>
        </Revelar>

        <Filete className="mt-16 h-px w-full bg-borde" />

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          <div className="text-sm text-tenue">
            <p className="etiqueta mb-3 text-texto">Estudio</p>
            <p>{estudio.contacto.direccion}</p>
            <p className="mt-2">{estudio.contacto.horario}</p>
          </div>

          <div className="text-sm text-tenue">
            <p className="etiqueta mb-3 text-texto">Contacto</p>
            <a
              href={`mailto:${estudio.contacto.email}`}
              className="enlace-sutil block w-fit transition-colors hover:text-texto"
            >
              {estudio.contacto.email}
            </a>
            <a
              href={`tel:${estudio.contacto.telefono.replace(/\s/g, "")}`}
              className="enlace-sutil mt-2 block w-fit transition-colors hover:text-texto"
            >
              {estudio.contacto.telefono}
            </a>
          </div>

          <div className="text-sm text-tenue">
            <p className="etiqueta mb-3 text-texto">Redes</p>
            <p>{estudio.contacto.instagram}</p>
          </div>
        </div>

        <p className="etiqueta mt-12 text-tenue/60">
          © {new Date().getFullYear()} {estudio.nombre}
        </p>
      </div>
    </footer>
  );
}

function TituloSeccion({
  etiqueta,
  titulo,
  descripcion,
}: {
  etiqueta: string;
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Revelar>
        <div className="mb-6 flex items-center gap-4">
          <Filete className="h-px w-10 bg-acento" retardo={150} />
          <p className="etiqueta text-acento">{etiqueta}</p>
        </div>
      </Revelar>

      <h2 className="titular text-[clamp(2rem,5vw,3.75rem)] leading-[1.02]">
        <TextoRevelado texto={titulo} paso={45} />
      </h2>

      {descripcion && (
        <Revelar retardo={280}>
          <p className="parrafo mt-6 text-tenue">{descripcion}</p>
        </Revelar>
      )}
    </div>
  );
}
