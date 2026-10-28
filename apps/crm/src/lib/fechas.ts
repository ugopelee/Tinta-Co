/**
 * Fecha de una columna `date` (sin hora). Se formatea en UTC: en la zona
 * local, medianoche UTC caería en el día anterior en cualquier huso al oeste.
 */
export function fecha(valor: string, largo = false): string {
  return new Date(valor).toLocaleDateString("es-ES", {
    day: "numeric",
    month: largo ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
