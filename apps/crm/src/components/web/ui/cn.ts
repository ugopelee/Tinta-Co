import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases de Tailwind y resuelve los choques (la última gana). */
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}
