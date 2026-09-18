import { estudio } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Diseno } from "@tinta/compartido/tipos";
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
import { TarjetaReservaRapida } from "@/components/TarjetaReservaRapida";
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

      <main>
        <Hero sesion={sesion} />
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

function Hero({ sesion }: { sesion: Sesion | null }) {
  return (
    <section className="p-3 sm:p-5">
      <div className="cristal relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[1.75rem] p-6 sm:min-h-[calc(100vh-2.5rem)] sm:rounded-[2.25rem] sm:p-10">
        {/* Niebla del fondo: dos focos que se cruzan, como en una sesión nocturna. */}
        <Parallax
          intensidad={0.16}
          className="pointer-events-none absolute inset-0"
        >
          <div
            aria-hidden
            className="absolute left-1/2 top-0 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[150px]"
            style={{ background: "var(--acento)" }}
          />
          <div
            aria-hidden
            className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full opacity-20 blur-[140px]"
            style={{ background: "var(--acento-suave)" }}
          />
        </Parallax>

        <div className="relative">
          <Revelar>
            <Cabecera sesion={sesion} />
          </Revelar>
        </div>

        <div className="relative mt-16 flex flex-1 flex-col justify-between gap-14 lg:mt-20">
          <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-start">
            <h1 className="titular text-[clamp(3rem,10.5vw,8.5rem)] leading-[0.86]">
              {estudio.hero.lineas.map((linea, indice) => (
                <Revelar key={linea} retardo={160 + indice * 130}>
                  <span
                    className={`block ${
                      indice === estudio.hero.lineaApagada
                        ? "titular-apagado"
                        : ""
                    }`}
                  >
                    {linea}
                  </span>
                </Revelar>
              ))}
            </h1>

            <Revelar retardo={620} className="lg:pt-10">
              <TarjetaReservaRapida />
            </Revelar>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-10">
            <Revelar retardo={760}>
              <p className="parrafo max-w-xs text-sm text-tenue">
                {estudio.hero.entradilla}
              </p>
            </Revelar>

            <Revelar retardo={860}>
              <div className="flex items-center gap-8">
                <div>
                  <p className="flex items-baseline gap-2">
                    <span aria-hidden className="text-acento">
                      ★
                    </span>
                    <span className="cifra text-2xl">4,9</span>
                  </p>
                  <p className="mt-1 text-xs text-tenue">
                    de {estudio.cifras[1].valor.toLocaleString("es-ES")} piezas
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="cifra text-2xl">{estudio.cifras[0].valor}</p>
                  <p className="mt-1 text-xs text-tenue">años tatuando</p>
                </div>
              </div>
            </Revelar>
          </div>
        </div>
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
