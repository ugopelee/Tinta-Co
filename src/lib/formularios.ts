/**
 * Estados iniciales de los formularios. Viven fuera de los archivos
 * "use server", que solo pueden exportar funciones async.
 */

export type ResultadoFormulario = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
};

export const formularioInicial: ResultadoFormulario = {
  estado: "inicial",
  mensaje: "",
};
