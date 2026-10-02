/** El catálogo avisa al formulario por evento: no comparten árbol de React. */
export const EVENTO_ELEGIR_PIEZA = "tintaco:elegir-pieza";

function bajarAlFormulario() {
  (document.getElementById("formulario-reserva") ?? document.getElementById("reserva"))
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Deja el formulario en modo cita con la pieza del escaparate apuntada. */
export function llevarPiezaAlFormulario(nombre: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_PIEZA, { detail: nombre }));
  bajarAlFormulario();
}
