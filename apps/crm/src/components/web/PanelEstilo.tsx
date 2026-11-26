"use client";

import { useId, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { ACENTOS, ESQUINAS, FUENTES_TEXTO, FUENTES_TITULOS } from "@tinta/compartido/web/catalogo";
import { contraste, neutros, sobre } from "@tinta/compartido/web/tema";
import type { Esquinas, IdFuenteTexto, IdFuenteTitulos, Modo, Sitio, Tema } from "@tinta/compartido/web/esquema";
import { Aviso, Grupo, LETRA_TEXTO, LETRA_TITULOS, ListaOpciones, Segmentado, Input } from "./Piezas";
import type { Cambiar } from "./historial";

/** Peso real de cada familia de titulares: la gótica solo existe en 700 y el rótulo en 800. */
const PESO_TITULOS: Record<IdFuenteTitulos, number> = { serif: 400, grotesca: 700, gotica: 700, rotulo: 800 };

const HEX = /^#[0-9a-f]{6}$/i;
const ratio = (n: number) => n.toFixed(1).replace(".", ",");

/** Nombre corto para la lista: «Rótulo (Big Shoulders Display)» → nombre y familia por separado. */
function partes(nombre: string) {
  const m = nombre.match(/^(.*?)\s*\((.*)\)$/);
  return m ? { nombre: m[1], familia: m[2] } : { nombre, familia: "" };
}

function Esquina({ radio }: { radio: number }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d={`M3 14 V${3 + radio} ${radio ? `Q3 3 ${3 + radio} 3` : ""} H14`} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PanelEstilo({ sitio, cambiar }: { sitio: Sitio; cambiar: Cambiar }) {
  const tema = sitio.tema;
  const id = useId();
  const poner = (parche: Partial<Tema>, clave?: string) => cambiar((s) => ({ ...s, tema: { ...s.tema, ...parche } }), clave);

  // Borrador del hex: se puede escribir a medias sin romper el tema.
  const [hex, setHex] = useState<string | null>(null);
  const fondo = neutros(sitio).fondo;
  const c = contraste(tema.acento, fondo);

  return (
    <div className="flex flex-col gap-8">
      <Grupo titulo="Color de acento" descripcion="Botones, enlaces y detalles. Los textos en este color se ajustan solos para leerse.">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Colores propuestos</legend>
          <div className="flex flex-wrap gap-2">
            {ACENTOS.map((a) => {
              const on = a.toUpperCase() === tema.acento.toUpperCase();
              return (
                <label key={a} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-acento`}
                    value={a}
                    checked={on}
                    onChange={() => {
                      setHex(null);
                      poner({ acento: a.toUpperCase() });
                    }}
                    aria-label={a}
                    className="peer sr-only"
                  />
                  <span
                    className={`grid size-8 place-items-center rounded-lg ring-1 ring-borde ring-inset peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-texto ${
                      on ? "outline-2 outline-offset-2 outline-texto" : ""
                    }`}
                    style={{ backgroundColor: a, color: sobre(a) }}
                  >
                    {on && <Check className="size-4" aria-hidden />}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-color`} className="text-xs font-medium text-tenue">
              Otro color
            </label>
            <input
              id={`${id}-color`}
              type="color"
              value={tema.acento.toLowerCase()}
              onChange={(e) => {
                setHex(null);
                poner({ acento: e.target.value.toUpperCase() }, "tema.acento");
              }}
              className="h-8 w-12 cursor-pointer rounded-lg border border-borde-campo bg-superficie p-0.5 [&::-moz-color-swatch]:rounded-md [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor={`${id}-hex`} className="text-xs font-medium text-tenue">
              Código hex
            </label>
            <Input
              id={`${id}-hex`}
              value={hex ?? tema.acento}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={hex != null && !HEX.test(hex) ? true : undefined}
              aria-describedby={`${id}-contraste`}
              className="font-mono uppercase"
              onChange={(e) => {
                const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                setHex(v);
                if (HEX.test(v)) poner({ acento: v.toUpperCase() }, "tema.acento");
              }}
              onBlur={() => setHex(null)}
            />
          </div>
        </div>

        <div id={`${id}-contraste`}>
          {hex != null && !HEX.test(hex) ? (
            <Aviso>Escribe seis cifras hexadecimales, por ejemplo #C6F432.</Aviso>
          ) : c < 3 ? (
            <Aviso>
              Poco contraste con el fondo ({ratio(c)}:1; lo mínimo es 3:1). Los botones y bloques de este color costarán de ver. Prueba un
              tono más {tema.modo === "oscuro" ? "claro" : "oscuro"}.
            </Aviso>
          ) : (
            <p className="text-xs text-tenue">Contraste con el fondo: {ratio(c)}:1.</p>
          )}
        </div>
      </Grupo>

      <Grupo titulo="Modo">
        <Segmentado<Modo>
          etiqueta="Modo de color"
          ocultarEtiqueta
          valor={tema.modo}
          onChange={(v) => poner({ modo: v })}
          opciones={[
            {
              valor: "oscuro",
              texto: (
                <>
                  <Moon aria-hidden /> Oscuro
                </>
              ),
            },
            {
              valor: "claro",
              texto: (
                <>
                  <Sun aria-hidden /> Claro
                </>
              ),
            },
          ]}
        />
      </Grupo>

      <Grupo titulo="Letras">
        <ListaOpciones<IdFuenteTitulos>
          etiqueta="Titulares"
          valor={tema.titulos}
          onChange={(v) => poner({ titulos: v })}
          opciones={FUENTES_TITULOS.map((f) => {
            const p = partes(f.nombre);
            return {
              valor: f.id,
              contenido: (
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-lg leading-tight" style={{ fontFamily: LETRA_TITULOS[f.id], fontWeight: PESO_TITULOS[f.id] }}>
                    {p.nombre}
                  </span>
                  {p.familia && <span className="shrink-0 text-xs text-tenue">{p.familia}</span>}
                </span>
              ),
            };
          })}
        />
        <ListaOpciones<IdFuenteTexto>
          etiqueta="Texto"
          valor={tema.texto}
          onChange={(v) => poner({ texto: v })}
          opciones={FUENTES_TEXTO.map((f) => ({
            valor: f.id,
            contenido: (
              <span className="block truncate text-[0.9375rem]" style={{ fontFamily: LETRA_TEXTO[f.id] }}>
                {f.nombre}
              </span>
            ),
          }))}
        />
      </Grupo>

      <Grupo titulo="Esquinas" descripcion="De fotos, tarjetas y botones.">
        <Segmentado<Esquinas>
          etiqueta="Esquinas"
          ocultarEtiqueta
          valor={tema.esquinas}
          onChange={(v) => poner({ esquinas: v })}
          opciones={ESQUINAS.map((e) => ({
            valor: e.id,
            texto: (
              <>
                <Esquina radio={e.id === "rectas" ? 0 : e.id === "suaves" ? 3 : 7} />
                {e.nombre}
              </>
            ),
          }))}
        />
      </Grupo>
    </div>
  );
}
