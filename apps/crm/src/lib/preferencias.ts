/**
 * Preferencias de interfaz (tema y barra lateral). Viven en atributos del
 * <html>, no en React: un guion del <head> las aplica antes de pintar, así
 * que no hay fogonazo ni desajuste de hidratación. Aquí solo las leemos y
 * las escribimos.
 */

export type Tema = "claro" | "oscuro";

function suscribirA(atributo: string) {
  return (alCambiar: () => void) => {
    const observador = new MutationObserver(alCambiar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [atributo],
    });
    return () => observador.disconnect();
  };
}

function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Navegación privada: la preferencia durará solo esta sesión.
  }
}

/* --- Tema ------------------------------------------------------------ */

export const suscribirTema = suscribirA("data-tema");

export const leerTema = (): Tema =>
  (document.documentElement.dataset.tema as Tema | undefined) ?? "oscuro";

export const temaPorDefecto = (): Tema => "oscuro";

export function aplicarTema(nuevo: Tema) {
  document.documentElement.dataset.tema = nuevo;
  guardar("tema", nuevo);
}

/* --- Barra lateral --------------------------------------------------- */

export const suscribirBarra = suscribirA("data-barra");

export const leerBarra = () =>
  document.documentElement.dataset.barra === "plegada";

export const barraPorDefecto = () => false;

export function alternarBarra(plegar: boolean) {
  const valor = plegar ? "plegada" : "abierta";
  document.documentElement.dataset.barra = valor;
  guardar("barra", valor);
}
