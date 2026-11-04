# Facturas de ejemplo

Facturas inventadas para probar el agente a mano. Cópialas a `facturas/entrada/`
o súbelas en el CRM (**Caja → Proveedores → Subir facturas**). Procesa la 01
antes que la 06.

| Archivo | Resultado esperado |
|---|---|
| `01-ok-luz-octubre.pdf` | `procesadas/`; en el CRM, por revisar (119,64 €) |
| `02-ok-material-tatuaje.pdf` | `procesadas/` (207,70 €) |
| `03-ok-sin-nif-limpieza.pdf` | `procesadas/`, con el NIF vacío (169,40 €) |
| `04-ok-ticket-taxi.png` | `procesadas/`; foto torcida de un ticket con IVA del 10 % (15,00 €) |
| `05-mal-importes-no-cuadran.pdf` | `errores/`: «Los importes no cuadran» (100 + 21 ≠ 131) |
| `06-mal-duplicada-luz.pdf` | `errores/`: «Factura duplicada» (mismo NIF y número que la 01) |
| `07-mal-no-es-factura.pdf` | `errores/`: es un presupuesto sin número ni fecha; Claude no la guarda |
| `08-mal-pdf-roto.pdf` | `errores/`: el archivo está dañado y el modelo no puede leerlo |
| `09-mal-formato-no-soportado.txt` | Se queda en `entrada/` sin tocar (solo lee PDF, JPG, PNG y WEBP) |

Si 01–04 se validan en el CRM, la 06 sigue saliendo duplicada; si se descarta
la 01, la 06 entra bien.
