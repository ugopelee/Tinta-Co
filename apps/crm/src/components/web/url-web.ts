/**
 * Dirección de la web pública. La vista previa vive allí (otro origen que el
 * panel), así que de aquí salen el `src` del iframe y el origen de confianza
 * para los mensajes.
 */
export const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "http://localhost:3000";

export const ORIGEN_WEB = (() => {
  try {
    return new URL(URL_WEB).origin;
  } catch {
    return "http://localhost:3000";
  }
})();
