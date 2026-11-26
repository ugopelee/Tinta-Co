"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { menuDe } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";
import { CampoImagen, CampoTexto, type Ancla } from "./Campos";
import { Grupo, Input, claseBotonIcono } from "./Piezas";
import { mover, type Cambiar } from "./historial";

const MAX_MENU = 7;

function Menu({ sitio, cambiar, anclas }: { sitio: Sitio; cambiar: Cambiar; anclas: Ancla[] }) {
  const id = useId();
  const manual = sitio.menu.length > 0;
  const poner = (menu: Sitio["menu"], clave?: string) => cambiar((s) => ({ ...s, menu }), clave);

  if (!manual) {
    const auto = menuDe(sitio);
    return (
      <Grupo titulo="Menú" descripcion="Se genera solo con las secciones visibles. Si cambias el orden o el antetítulo de una sección, el menú se actualiza.">
        {auto.length ? (
          <ol className="flex flex-col gap-1 text-[0.8125rem]">
            {auto.map((e) => (
              <li key={e.destino} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-texto">{e.texto}</span>
                <span className="font-mono text-xs text-tenue">{e.destino}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[0.8125rem] text-tenue">Ahora mismo no hay secciones para el menú.</p>
        )}
        <Button type="button" variant="secondary" className="w-fit" onClick={() => poner(auto.length ? auto.map((e) => ({ ...e })) : [{ texto: "Reserva", destino: "#reserva" }])}>
          Escribir el menú a mano
        </Button>
      </Grupo>
    );
  }

  return (
    <Grupo
      titulo="Menú"
      descripcion="Escrito a mano. Los enlaces sin texto no se muestran."
      extra={
        <Button type="button" variant="ghost" size="sm" className="-mr-1 shrink-0 text-tenue" onClick={() => poner([])}>
          Volver al automático
        </Button>
      }
    >
      <ol className="flex flex-col">
        {sitio.menu.map((e, i) => (
          <li key={i} className="flex flex-col gap-2 border-t border-borde py-3 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-1">
              <span className="flex-1 text-xs font-semibold text-tenue">Enlace {i + 1}</span>
              <button type="button" className={`${claseBotonIcono} size-7`} aria-label={`Subir enlace ${i + 1}`} disabled={i === 0} onClick={() => poner(mover(sitio.menu, i, i - 1))}>
                <ArrowUp aria-hidden />
              </button>
              <button
                type="button"
                className={`${claseBotonIcono} size-7`}
                aria-label={`Bajar enlace ${i + 1}`}
                disabled={i === sitio.menu.length - 1}
                onClick={() => poner(mover(sitio.menu, i, i + 1))}
              >
                <ArrowDown aria-hidden />
              </button>
              <button
                type="button"
                className={`${claseBotonIcono} size-7 hover:text-acento`}
                aria-label={`Eliminar enlace ${i + 1}`}
                onClick={() => poner(sitio.menu.filter((_, j) => j !== i))}
              >
                <Trash2 aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-1.5">
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${id}-${i}-t`} className="text-xs font-medium text-tenue">
                  Texto
                </label>
                <Input
                  id={`${id}-${i}-t`}
                  value={e.texto}
                  maxLength={30}
                  onChange={(ev) => poner(sitio.menu.map((x, j) => (j === i ? { ...x, texto: ev.target.value } : x)), `menu.${i}.t`)}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${id}-${i}-d`} className="text-xs font-medium text-tenue">
                  Destino
                </label>
                <Input
                  id={`${id}-${i}-d`}
                  value={e.destino}
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-[0.8125rem]"
                  onChange={(ev) => poner(sitio.menu.map((x, j) => (j === i ? { ...x, destino: ev.target.value } : x)), `menu.${i}.d`)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={claseBotonIcono} aria-label={`Enlazar el enlace ${i + 1} a una sección`} disabled={!anclas.length}>
                    <Link2 aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-tenue">Llevar a una sección</DropdownMenuLabel>
                  {anclas.map((a) => (
                    <DropdownMenuItem
                      key={a.destino}
                      onSelect={() => poner(sitio.menu.map((x, j) => (j === i ? { texto: x.texto.trim() ? x.texto : a.texto, destino: a.destino } : x)))}
                    >
                      <span className="min-w-0 flex-1 truncate">{a.texto}</span>
                      <span className="font-mono text-xs text-tenue">{a.destino}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        disabled={sitio.menu.length >= MAX_MENU}
        onClick={() => poner([...sitio.menu, { texto: "", destino: "#" }])}
      >
        <Plus aria-hidden />
        Añadir enlace
      </Button>
      {sitio.menu.length >= MAX_MENU && <p className="text-xs text-tenue">Con más de {MAX_MENU} enlaces el menú no cabe en el móvil.</p>}
    </Grupo>
  );
}

export function PanelAjustes({ sitio, cambiar, anclas }: { sitio: Sitio; cambiar: Cambiar; anclas: Ancla[] }) {
  const marca = (parche: Partial<Sitio["marca"]>, clave?: string) => cambiar((s) => ({ ...s, marca: { ...s.marca, ...parche } }), clave);
  const pie = (parche: Partial<Sitio["pie"]>, clave?: string) => cambiar((s) => ({ ...s, pie: { ...s.pie, ...parche } }), clave);
  const seo = (parche: Partial<Sitio["seo"]>, clave?: string) => cambiar((s) => ({ ...s, seo: { ...s.seo, ...parche } }), clave);

  return (
    <div className="flex flex-col gap-8">
      <Grupo titulo="Marca">
        <CampoTexto etiqueta="Nombre" valor={sitio.marca.nombre} max={40} onChange={(v) => marca({ nombre: v }, "marca.nombre")} />
        <CampoTexto etiqueta="Eslogan" valor={sitio.marca.eslogan} max={80} onChange={(v) => marca({ eslogan: v }, "marca.eslogan")} />
        <CampoImagen
          etiqueta="Logotipo"
          ayuda="Opcional. Sin logo, la plantilla escribe el nombre con la letra de los titulares."
          valor={sitio.marca.logo}
          onChange={(v, agrupar) => marca({ logo: v as Sitio["marca"]["logo"] }, agrupar ? "marca.logo" : undefined)}
        />
      </Grupo>

      <Menu sitio={sitio} cambiar={cambiar} anclas={anclas} />

      <Grupo titulo="Pie de página">
        <CampoTexto etiqueta="Texto" largo valor={sitio.pie.texto} max={240} onChange={(v) => pie({ texto: v }, "pie.texto")} />
        <CampoTexto etiqueta="Email" tipo="email" valor={sitio.pie.email} placeholder="hola@tintaco.studio" onChange={(v) => pie({ email: v }, "pie.email")} />
        <CampoTexto etiqueta="Teléfono" tipo="tel" valor={sitio.pie.telefono} placeholder="+34 600 123 456" onChange={(v) => pie({ telefono: v }, "pie.telefono")} />
        <CampoTexto
          etiqueta="Instagram"
          valor={sitio.pie.instagram}
          placeholder="@tintaco.studio"
          ayuda="El usuario, con o sin @. Los campos vacíos no se muestran."
          onChange={(v) => pie({ instagram: v }, "pie.instagram")}
        />
      </Grupo>

      <Grupo titulo="Buscadores" descripcion="Cómo aparece la web en Google y al compartirla.">
        <CampoTexto etiqueta="Título" valor={sitio.seo.titulo} max={60} recomendado onChange={(v) => seo({ titulo: v }, "seo.titulo")} />
        <CampoTexto etiqueta="Descripción" largo valor={sitio.seo.descripcion} max={160} recomendado onChange={(v) => seo({ descripcion: v }, "seo.descripcion")} />
        <div className="flex flex-col gap-0.5 rounded-lg bg-superficie-alta px-3 py-2.5" aria-label="Así se vería en Google" role="group">
          <span className="text-xs text-tenue">Así se vería en Google</span>
          <span className="line-clamp-1 text-[0.9375rem] font-medium text-azul">{sitio.seo.titulo || sitio.marca.nombre || "Sin título"}</span>
          <span className="line-clamp-2 text-[0.8125rem] leading-snug text-tenue">{sitio.seo.descripcion || "Sin descripción."}</span>
        </div>
      </Grupo>
    </div>
  );
}
