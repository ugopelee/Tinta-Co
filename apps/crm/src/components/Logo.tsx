import Image from "next/image";

/**
 * Logotipo del estudio (máquinas cruzadas). Va sobre baldosa blanca fija:
 * el dibujo es negro sobre blanco y en tema oscuro se perdería sin ella.
 * El mismo archivo, reducido, es el favicon (`app/icon.png`).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5 ${className}`}
    >
      <Image src="/logo.png" alt="" width={96} height={96} className="h-full w-full object-contain" priority />
    </span>
  );
}
