# Agente lector de facturas

Programa en Python + LangChain que corre en un servidor. Toma las facturas de
proveedor (PDF o foto) de una carpeta, se las pasa a Claude por OpenRouter,
Claude las lee (OCR/visión) y pide llamar a `guardar_factura` con los datos. El
**agente** (nunca Claude) ejecuta esa herramienta, que sube el archivo al bucket
privado `facturas-proveedor` e inserta la fila en `facturas_proveedor`
(estado `por_revisar`). Claude nunca toca la base de datos ni ve la clave de Supabase.

## Las cinco partes

| Parte | Dónde está |
|---|---|
| Modelo | `MODELO_POR_DEFECTO` en `agente.py` (`anthropic/claude-sonnet-5.5`, variable `MODELO`), temperatura 0 |
| Prompt del sistema | `PROMPT_SISTEMA` en `agente.py` |
| Herramienta `guardar_factura` | `crear_guardar_factura` y `DatosFactura` en `herramientas.py` |
| Memoria | Ninguna: `_ejecutar` crea un agente nuevo, sin checkpointer, por cada factura |
| Bucle | 1. el agente manda la factura a Claude; 2. Claude pide `guardar_factura` con los datos; 3. el agente la ejecuta (INSERT); 4. se detiene, sin más llamadas a Claude (`return_direct` + `ModelCallLimitMiddleware`) |

## Instalación

```bash
cd agente
py -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt   # en Linux/macOS: .venv/bin/python
```

## Configuración

Copia `.env.example` a `.env` y rellena `OPENROUTER_API_KEY`, `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY`. Opcionales: `MODELO` y `CARPETA_FACTURAS`
(por defecto `agente/facturas`). La migración `20261028120000_modulo_ventas_facturacion.sql`
debe estar aplicada.

## Uso

```bash
.venv/Scripts/python agente.py             # una pasada por entrada/
.venv/Scripts/python agente.py --vigilar   # repite la pasada cada 10 s
```

Se escribe una línea de registro por archivo (`ok` o `error` con el motivo).

## Carpetas

```
facturas/
  entrada/      aquí se dejan los PDF, JPG, PNG o WEBP
  procesadas/   facturas guardadas correctamente
  errores/      archivo + <archivo>.error.txt con el motivo
```

Los archivos con otra extensión se dejan en `entrada/` sin tocar, y los modificados hace menos de 2 s se esperan a la pasada siguiente. Si el nombre ya existe en `procesadas/` o `errores/`, se añade una marca de fecha antes de la extensión. Van a `errores/` los importes que no cuadran
(base + IVA frente a total, tolerancia 0,02), las facturas duplicadas
(motivo "duplicada") y cualquier fallo de lectura o de base de datos.

## Pruebas

```bash
.venv/Scripts/python -m pytest -q
```

No usan red: el modelo y Supabase son dobles de prueba.
