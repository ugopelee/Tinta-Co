"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { infoSeccion, normalizarSitio, plantilla } from "@tinta/compartido/web/catalogo";
import type { MensajeEditor, MensajeVista, Sitio } from "@tinta/compartido/web/esquema";
import { ORIGEN_WEB, URL_WEB } from "./url-web";
import { descartarBorrador, guardarBorrador, publicarWeb } from "@/app/acciones-web";
import { BarraEditor, type FaseGuardado, type FasePublicacion } from "./BarraEditor";
import { PanelPlantilla } from "./PanelPlantilla";
import { PanelSecciones } from "./PanelSecciones";
import { PanelEstilo } from "./PanelEstilo";
import { PanelAjustes } from "./PanelAjustes";
import { VistaPrevia, type Dispositivo } from "./VistaPrevia";
import { tituloDe, useHistorial } from "./historial";
import type { Ancla } from "./Campos";

const ESPERA_GUARDADO = 1200;

type Pestana = "plantilla" | "secciones" | "estilo" | "ajustes";
const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: "plantilla", texto: "Plantilla" },
  { id: "secciones", texto: "Secciones" },
  { id: "estilo", texto: "Estilo" },
  { id: "ajustes", texto: "Ajustes" },
];

/* ---- ¿pantalla de escritorio? (en el servidor se asume que sí) ---- */
const MQ = "(min-width: 768px)";
const suscribirMq = (cb: () => void) => {
  const m = window.matchMedia(MQ);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useEscritorio = () =>
  useSyncExternalStore(
    suscribirMq,
    () => window.matchMedia(MQ).matches,
    () => true,
  );

export type PropsEditor = {
  inicial: Sitio;
  publicado: Sitio | null;
  borradorEn: string | null;
  publicadoEn: string | null;
};

export function EditorWeb({ inicial, publicado, borradorEn, publicadoEn }: PropsEditor) {
  const { sitio, cambiar, deshacer, rehacer, puedeDeshacer, puedeRehacer } = useHistorial(inicial);
  const json = useMemo(() => JSON.stringify(sitio), [sitio]);

  /* ---------------- estado de guardado y publicación ---------------- */

  const [guardado, setGuardado] = useState(() => ({ json: JSON.stringify(inicial), en: borradorEn ?? publicadoEn }));
  const [publicacion, setPublicacion] = useState(() => ({ json: publicado ? JSON.stringify(publicado) : null, en: publicadoEn }));
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  const sitioRef = useRef(sitio);
  const jsonRef = useRef(json);
  const guardadoRef = useRef(guardado.json);
  const enVuelo = useRef(false);
  useEffect(() => {
    sitioRef.current = sitio;
    jsonRef.current = json;
    guardadoRef.current = guardado.json;
  }, [sitio, json, guardado.json]);

  // Al salir a otra pantalla del CRM (navegación interna, sin beforeunload) se guarda lo que quede pendiente.
  useEffect(() => {
    const refs = { sitioRef, jsonRef, guardadoRef, enVuelo };
    return () => {
      if (refs.jsonRef.current !== refs.guardadoRef.current && !refs.enVuelo.current) {
        void guardarBorrador(refs.sitioRef.current).catch(() => {});
      }
    };
  }, []);

  const guardar = useCallback(async () => {
    if (enVuelo.current) return;
    const enviado = jsonRef.current;
    enVuelo.current = true;
    setGuardando(true);
    let r: { ok: boolean; mensaje?: string; en?: string };
    try {
      r = await guardarBorrador(sitioRef.current);
    } catch {
      r = { ok: false, mensaje: "Sin conexión con el servidor." };
    }
    enVuelo.current = false;
    setGuardando(false);
    if (r.ok) {
      setErrorGuardar(null);
      // Si mientras tanto hubo más cambios, el efecto de abajo vuelve a programar el guardado.
      setGuardado({ json: enviado, en: r.en ?? new Date().toISOString() });
    } else {
      const mensaje = r.mensaje ?? "No se han podido guardar los cambios.";
      setErrorGuardar(mensaje);
      setAnuncio(`No se han guardado los cambios. ${mensaje}`);
    }
  }, []);

  // Guardado automático: 1,2 s después del último cambio.
  const pendiente = json !== guardado.json;
  useEffect(() => {
    if (!pendiente) return;
    const t = setTimeout(guardar, ESPERA_GUARDADO);
    return () => clearTimeout(t);
  }, [json, pendiente, guardar]);

  // Aviso al salir con cambios sin guardar.
  const sinGuardar = pendiente || guardando;
  useEffect(() => {
    if (!sinGuardar) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sinGuardar]);

  const faseGuardado: FaseGuardado = guardando ? "guardando" : errorGuardar ? "error" : pendiente ? "pendiente" : "guardado";
  const fasePublicacion: FasePublicacion = publicacion.json == null ? "nunca" : json === publicacion.json ? "publicado" : "cambios";

  async function publicar() {
    if (publicando) return;
    const enviado = json;
    setPublicando(true);
    let r: { ok: boolean; mensaje?: string; en?: string };
    try {
      r = await publicarWeb(sitio);
    } catch {
      r = { ok: false, mensaje: "Sin conexión con el servidor." };
    }
    setPublicando(false);
    if (!r.ok) {
      const mensaje = r.mensaje ?? "No se ha podido publicar la web.";
      toast.error("No se ha publicado", { description: mensaje });
      setAnuncio(`No se ha publicado. ${mensaje}`);
      return;
    }
    const en = r.en ?? new Date().toISOString();
    setErrorGuardar(null);
    setGuardado({ json: enviado, en });
    setPublicacion({ json: enviado, en });
    setAnuncio("Web publicada.");
    toast.success("Web publicada", {
      description: "Los cambios ya se ven en la web pública.",
      action: { label: "Ver web", onClick: () => window.open(URL_WEB, "_blank", "noopener,noreferrer") },
    });
  }

  async function descartar() {
    setDescartando(true);
    let r: { ok: boolean; mensaje?: string; sitio?: Sitio };
    try {
      r = await descartarBorrador();
    } catch {
      r = { ok: false, mensaje: "Sin conexión con el servidor." };
    }
    setDescartando(false);
    setConfirmarDescarte(false);
    if (!r.ok || !r.sitio) {
      toast.error("No se han descartado los cambios", { description: r.mensaje ?? "Inténtalo de nuevo." });
      return;
    }
    const s = normalizarSitio(r.sitio);
    const j = JSON.stringify(s);
    // Se marca como guardado para no volver a crear el borrador; con Deshacer se recupera (y se guarda).
    setGuardado({ json: j, en: publicacion.en });
    setPublicacion((p) => ({ ...p, json: j }));
    setErrorGuardar(null);
    cambiar(() => s);
    setAbierta(null);
    setCatalogo(false);
    setAnuncio("Cambios descartados. La web vuelve a la versión publicada.");
    toast("Cambios descartados", { description: "Vuelves a la versión publicada.", action: { label: "Deshacer", onClick: deshacer } });
  }

  /* ---------------- navegación del panel ---------------- */

  const [pestana, setPestana] = useState<Pestana>("secciones");
  const [abiertaId, setAbierta] = useState<string | null>(null);
  const [catalogo, setCatalogo] = useState(false);
  const [vistaMovil, setVistaMovil] = useState<"editar" | "vista">("editar");
  const [dispositivo, setDispositivo] = useState<Dispositivo>("escritorio");
  const escritorio = useEscritorio();
  const dispositivoVista: Dispositivo = escritorio ? dispositivo : "movil";

  const abierta = abiertaId ? (sitio.secciones.find((x) => x.id === abiertaId) ?? null) : null;
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [abiertaId, catalogo, pestana]);

  const anclas = useMemo<Ancla[]>(
    () =>
      sitio.secciones
        .filter((x) => x.visible)
        .map((x) => ({ texto: tituloDe(x) || infoSeccion(x.tipo).nombre, destino: `#${x.id}` })),
    [sitio.secciones],
  );

  /* ---------------- atajos de teclado ---------------- */

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) rehacer();
        else deshacer();
      } else if (k === "y" && !e.shiftKey) {
        e.preventDefault();
        rehacer();
      } else if (k === "s" && !e.shiftKey) {
        e.preventDefault();
        guardar();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [deshacer, rehacer, guardar]);

  /* ---------------- vista previa (postMessage) ---------------- */

  const iframe = useRef<HTMLIFrameElement>(null);
  // Cuenta las veces que la vista previa dice «lista» (se recarga si cambia el código o se pulsa Recargar).
  const [listas, setListas] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const lista = listas > 0;
  const desdeVista = useRef(false);

  const enviar = useCallback((m: MensajeVista) => {
    iframe.current?.contentWindow?.postMessage(m, ORIGEN_WEB);
  }, []);

  useEffect(() => {
    function recibir(e: MessageEvent) {
      // La vista previa es la web pública: otro origen, y solo ese.
      if (e.origin !== ORIGEN_WEB) return;
      if (!iframe.current || e.source !== iframe.current.contentWindow) return;
      const m = e.data as MensajeEditor | null;
      if (!m || typeof m !== "object") return;
      if (m.tipo === "lista") setListas((n) => n + 1);
      else if (m.tipo === "elegir" && typeof m.id === "string") {
        desdeVista.current = true;
        setPestana("secciones");
        setCatalogo(false);
        setAbierta(m.id);
        setVistaMovil("editar");
      }
    }
    window.addEventListener("message", recibir);
    return () => window.removeEventListener("message", recibir);
  }, []);

  useEffect(() => {
    if (listas) enviar({ tipo: "sitio", sitio });
  }, [listas, sitio, enviar]);

  useEffect(() => {
    if (!listas) return;
    // Si la elección vino de un clic en la vista previa, la sección ya está a la vista.
    if (desdeVista.current) {
      desdeVista.current = false;
      return;
    }
    enviar({ tipo: "enfocar", id: abiertaId });
  }, [listas, abiertaId, enviar]);

  /* ---------------- pintado ---------------- */

  const nombrePlantilla = plantilla(sitio.plantilla).nombre;
  const puedeDescartar = publicacion.json != null && fasePublicacion === "cambios" && !descartando;

  return (
    // Llena el hueco que deja el panel: cabecera móvil o márgenes de la tarjeta, y el pie del <main>.
    <section
      className="tarjeta flex h-[calc(100dvh-6rem)] min-h-[28rem] flex-col overflow-hidden lg:h-[calc(100dvh-3.75rem)]"
      aria-label="Editor de la web"
    >
      <BarraEditor
        nombrePlantilla={nombrePlantilla}
        guardado={faseGuardado}
        guardadoEn={guardado.en}
        publicacion={fasePublicacion}
        publicadoEn={publicacion.en}
        alReintentar={guardar}
        puedeDeshacer={puedeDeshacer}
        puedeRehacer={puedeRehacer}
        alDeshacer={deshacer}
        alRehacer={rehacer}
        dispositivo={dispositivo}
        alDispositivo={setDispositivo}
        puedeDescartar={puedeDescartar}
        alDescartar={() => setConfirmarDescarte(true)}
        publicando={publicando}
        alPublicar={publicar}
      />

      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {/* Móvil: panel y vista previa en dos pestañas. */}
      <div className="grid shrink-0 grid-cols-2 border-b border-borde bg-superficie px-3 py-2 md:hidden" role="group" aria-label="Qué ver">
        <div className="col-span-2 flex rounded-full bg-superficie-alta p-0.5">
          {(
            [
              ["editar", "Editar"],
              ["vista", "Vista previa"],
            ] as const
          ).map(([v, t]) => (
            <button
              key={v}
              type="button"
              aria-pressed={vistaMovil === v}
              onClick={() => setVistaMovil(v)}
              className={`h-8 flex-1 rounded-full text-[0.8125rem] font-medium transition-colors duration-150 ${
                vistaMovil === v ? "bg-texto font-semibold text-fondo" : "text-tenue"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <Tabs
          value={pestana}
          onValueChange={(v) => {
            setPestana(v as Pestana);
            setCatalogo(false);
          }}
          className={`${vistaMovil === "editar" ? "flex" : "hidden"} min-h-0 w-full shrink-0 flex-col gap-0 border-borde bg-superficie md:flex md:w-[380px] md:border-r`}
        >
          <TabsList variant="line" className="h-11 w-full shrink-0 justify-start gap-1 border-b border-borde px-3" aria-label="Partes del editor">
            {PESTANAS.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="h-full flex-none px-2.5">
                {p.texto}
              </TabsTrigger>
            ))}
          </TabsList>

          <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-5">
            <TabsContent value="plantilla">
              <PanelPlantilla sitio={sitio} cambiar={cambiar} />
            </TabsContent>
            <TabsContent value="secciones">
              <PanelSecciones
                sitio={sitio}
                cambiar={cambiar}
                anclas={anclas}
                abierta={abierta}
                catalogo={catalogo}
                alAbrir={setAbierta}
                alCatalogo={setCatalogo}
              />
            </TabsContent>
            <TabsContent value="estilo">
              <PanelEstilo sitio={sitio} cambiar={cambiar} />
            </TabsContent>
            <TabsContent value="ajustes">
              <PanelAjustes sitio={sitio} cambiar={cambiar} anclas={anclas} />
            </TabsContent>
          </div>
        </Tabs>

        <section
          aria-label="Vista previa"
          className={`${vistaMovil === "vista" ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-superficie-alta md:flex`}
        >
          <VistaPrevia
            dispositivo={dispositivoVista}
            iframeRef={iframe}
            lista={lista}
            recarga={recarga}
            alRecargar={() => {
              setListas(0);
              setRecarga((n) => n + 1);
            }}
          />
        </section>
      </div>

      <Dialog open={confirmarDescarte} onOpenChange={(o) => !descartando && setConfirmarDescarte(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Descartar los cambios sin publicar?</DialogTitle>
            <DialogDescription>
              El editor vuelve a la versión que está publicada ahora. Mientras no cierres esta pantalla, puedes recuperarlos con Deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmarDescarte(false)} disabled={descartando}>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={descartar} disabled={descartando}>
              {descartando ? "Descartando…" : "Descartar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
