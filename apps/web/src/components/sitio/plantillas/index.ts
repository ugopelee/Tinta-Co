import type { IdPlantilla } from "@tinta/compartido/web/esquema";
import type { DefinicionPlantilla } from "../contrato";
import { lamina } from "./lamina";
import { revista } from "./revista";
import { cartel } from "./cartel";

export const PLANTILLAS_WEB: Record<IdPlantilla, DefinicionPlantilla> = { lamina, revista, cartel };
