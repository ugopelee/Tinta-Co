import { estudio } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Diseno } from "@tinta/compartido/tipos";
import {
  BarraProgreso,
  Contador,
  DesvanecerAlSalir,
  Filete,
  Parallax,
  Revelar,
  TextoRevelado,
} from "@/components/animaciones";
import { Cabecera } from "@/components/Cabecera";
import type { Sesion } from "@/components/MenuCuenta";
import { GaleriaDisenos } from "@/components/GaleriaDisenos";
import { MarcaDeAgua } from "@/components/MarcaDeAgua";
import { Servicios } from "@/components/Servicios";
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
        <Hero disenos={disenos} />
        <Cifras />
        <Servicios />
        <Catalogo disenos={disenos} />
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

function Hero({ disenos }: { disenos: Diseno[] }) {
  return (
    <section>
      <DesvanecerAlSalir className="relative overflow-hidden px-6 pb-16 pt-28 sm:px-10 sm:pb-24 sm:pt-36">
        {/* Niebla del fondo: dos focos que se cruzan, como en una sesión nocturna. */}
        <Parallax
          intensidad={0.16}
          className="pointer-events-none absolute inset-0"
        >
          <div
            aria-hidden
            className="absolute left-1/4 top-0 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[150px]"
            style={{ background: "var(--acento)" }}
          />
          <div
            aria-hidden
            className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full opacity-20 blur-[140px]"
            style={{ background: "var(--acento-suave)" }}
          />
        </Parallax>

        {/* El monograma del estudio, tan bajo que se lee como textura. */}
        <MarcaDeAgua className="pointer-events-none absolute -right-24 top-1/2 h-[46rem] w-auto -translate-y-1/2 text-texto opacity-[0.035] sm:right-[6%]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-14">
          <div className="flex flex-col justify-between lg:pt-4">
            <h1 className="titular text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02]">
              {estudio.hero.lineas.map((linea, indice) => (
                <Revelar key={linea} retardo={120 + indice * 130}>
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

            <Revelar retardo={560}>
              <p className="parrafo mt-8 max-w-sm text-sm text-tenue sm:text-base">
                {estudio.hero.entradilla}
              </p>
            </Revelar>

            <Revelar retardo={680}>
              <div className="mt-10 flex flex-wrap items-end gap-10">
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
                <div>
                  <p className="cifra text-2xl">{estudio.cifras[0].valor}</p>
                  <p className="mt-1 text-xs text-tenue">años tatuando</p>
                </div>
                <div>
                  <p className="cifra text-2xl">{estudio.cifras[2].valor}</p>
                  <p className="mt-1 text-xs text-tenue">artistas</p>
                </div>
              </div>
            </Revelar>
          </div>

          <Revelar retardo={420} className="h-full">
            <div
              id="reserva"
              className="cristal-denso flex h-full scroll-mt-28 flex-col rounded-2xl p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="titular text-2xl">{estudio.reserva.titulo}</h2>
                  <p className="mt-1.5 text-sm text-tenue">
                    {estudio.reserva.entradilla}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm text-tenue">
                  ✦
                </span>
              </div>

              <div className="mt-7">
                <FormularioReserva disenos={disenos} />
              </div>
            </div>
          </Revelar>
        </div>
      </DesvanecerAlSalir>
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

function Catalogo({ disenos }: { disenos: Diseno[] }) {
  return (
    <section
      id="catalogo"
      className="relative scroll-mt-24 overflow-hidden bg-fondo py-24 sm:py-32"
    >
      {/* Trama de puntos y marcas de plano: textura de taller, no de web. */}
      <div aria-hidden className="trama-puntos absolute inset-0" />
      {[
        "left-[12%] top-[18%]",
        "right-[16%] top-[26%]",
        "left-[22%] bottom-[14%]",
        "right-[8%] bottom-[22%]",
      ].map((posicion) => (
        <span
          key={posicion}
          aria-hidden
          className={`cruceta absolute ${posicion} h-3 w-3`}
        />
      ))}

      <div className="relative">
        <div className="mx-auto max-w-7xl px-6">
          <TituloSeccion
            etiqueta="Catálogo flash"
            titulo="Piezas listas para tatuar"
            descripcion="Cada diseño se tatúa una sola vez. Pasa el ratón para detener la tira y toca una pieza para llevarla al formulario."
          />
        </div>

        {disenos.length === 0 ? (
          <p className="mx-auto mt-16 max-w-7xl px-6 text-tenue">
            Estamos preparando el próximo set de flash. Vuelve pronto.
          </p>
        ) : (
          <Revelar retardo={200}>
            <div className="mt-16">
              <GaleriaDisenos disenos={disenos} />
            </div>
          </Revelar>
        )}
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
