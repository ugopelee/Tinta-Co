import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@tinta/compartido/estudio";

export const metadata: Metadata = { title: "Declaración de accesibilidad" };

/** Fecha de la última revisión. Se actualiza cada vez que se vuelve a auditar. */
const REVISION = "19 de octubre de 2026";

/**
 * Información de accesibilidad que pide la Ley 11/2023 (Directiva europea de
 * accesibilidad): nivel de cumplimiento, lo que aún no es accesible y una vía
 * para avisar que no sea solo el teléfono.
 */
export default function Accesibilidad() {
  return (
    <main id="contenido" tabIndex={-1} className="relative z-10 px-6 py-20 md:py-28">
      <article className="mx-auto w-full max-w-2xl">
        <p className="etiqueta">Información legal</p>
        <h1 className="titular mt-6 text-[clamp(2.25rem,6vw,4rem)] leading-[1.02]">
          Declaración de accesibilidad
        </h1>
        <p className="parrafo mt-6 text-tenue">
          En {estudio.nombre} queremos que cualquier persona pueda conocer el estudio y pedir cita,
          use la tecnología que use. Esta declaración explica hasta dónde llega hoy esta web y cómo
          avisarnos si algo no te funciona.
        </p>

        <section className="mt-14">
          <h2 className="titular text-2xl">Normativa y nivel de cumplimiento</h2>
          <div className="parrafo mt-4 space-y-4 text-tenue">
            <p>
              Tomamos como referencia la Ley 11/2023, que aplica en España la Directiva europea de
              accesibilidad, y la norma EN 301 549. Diseñamos para el nivel AA de las pautas WCAG 2.2
              del W3C, que cubre lo que piden estas normas.
            </p>
            <p>
              Esta web es <strong className="font-medium text-texto">parcialmente conforme</strong>{" "}
              con WCAG 2.2 AA: cumple la mayoría de los requisitos y estamos corrigiendo los puntos
              que se indican abajo.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="titular text-2xl">Qué hemos hecho</h2>
          <ul className="parrafo mt-4 list-disc space-y-2 pl-5 text-tenue">
            <li>Contraste de al menos 4,5 a 1 en el texto y de 3 a 1 en los bordes de los campos.</li>
            <li>Toda la web se puede usar con el teclado, con el foco siempre visible.</li>
            <li>Un enlace al principio de cada página para saltar directamente al contenido.</li>
            <li>Formularios con etiquetas, campos obligatorios indicados con palabras y errores explicados.</li>
            <li>Los estados y avisos no dependen solo del color.</li>
            <li>Las animaciones se detienen si activas «Reducir movimiento» en tu dispositivo.</li>
            <li>El texto se puede ampliar al 200 % y la página se adapta a pantallas de 320 px.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="titular text-2xl">Lo que todavía no es accesible</h2>
          <ul className="parrafo mt-4 list-disc space-y-2 pl-5 text-tenue">
            <li>
              Las fotos de los tatuajes del catálogo se describen solo con el nombre del diseño, no con
              una descripción completa de la pieza.
            </li>
            <li>
              El acceso con Google depende de una página de Google, cuya accesibilidad no controlamos.
              Puedes crear la cuenta con email y contraseña.
            </li>
          </ul>
          <p className="parrafo mt-4 text-tenue">
            Si necesitas cualquier información de esta web en otro formato, escríbenos y te la
            enviamos.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="titular text-2xl">Avísanos si algo no funciona</h2>
          <div className="parrafo mt-4 space-y-4 text-tenue">
            <p>
              Puedes escribirnos a{" "}
              <a
                href={`mailto:${estudio.contacto.email}?subject=Accesibilidad`}
                className="text-texto underline underline-offset-4"
              >
                {estudio.contacto.email}
              </a>{" "}
              o usar el{" "}
              <Link href="/#reserva" className="text-texto underline underline-offset-4">
                formulario de contacto
              </Link>
              . No hace falta llamar por teléfono. Respondemos en menos de 48 horas.
            </p>
            <p>
              Si la respuesta no te satisface, puedes presentar una reclamación ante los servicios de
              consumo de la Comunidad de Madrid.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="titular text-2xl">Cómo se ha revisado</h2>
          <p className="parrafo mt-4 text-tenue">
            Autoevaluación con axe-core, pruebas con teclado, lector de pantalla y simulación de
            daltonismo y visión borrosa. Última revisión: {REVISION}.
          </p>
        </section>

        <Link
          href="/"
          className="enlace-sutil mt-14 inline-block py-1 text-sm text-tenue transition-colors hover:text-texto"
        >
          ← Volver a la web
        </Link>
      </article>
    </main>
  );
}
