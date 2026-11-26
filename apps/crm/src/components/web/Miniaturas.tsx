import type { IdPlantilla } from "@tinta/compartido/web/esquema";

/**
 * Miniaturas dibujadas de cada plantilla. Usan los colores propios de cada
 * plantilla (no los del CRM): son un retrato de la web, no parte de la interfaz.
 */

/** Lámina: hoja de flash oscura, marcos finos, numeración y titular condensado. */
function Lamina() {
  return (
    <svg viewBox="0 0 160 100" className="size-full" aria-hidden>
      <rect width="160" height="100" fill="#0E0E10" />
      {/* marco de hoja */}
      <rect x="5.5" y="5.5" width="149" height="89" fill="none" stroke="#3A3A3F" strokeWidth="0.6" />
      {/* menú: marca y rótulos mono */}
      <rect x="12" y="11" width="20" height="3.5" fill="#F2EEE6" />
      <rect x="104" y="12" width="10" height="1.6" fill="#8C8A84" />
      <rect x="118" y="12" width="10" height="1.6" fill="#8C8A84" />
      <rect x="132" y="10" width="16" height="5" fill="none" stroke="#C2452F" strokeWidth="0.8" />
      {/* titular condensado apretado */}
      <rect x="12" y="26" width="64" height="12" fill="#F2EEE6" />
      <rect x="12" y="41" width="48" height="12" fill="#F2EEE6" />
      <rect x="12" y="59" width="40" height="2" fill="#8C8A84" />
      <rect x="12" y="64" width="32" height="2" fill="#8C8A84" />
      <rect x="12" y="74" width="26" height="7" fill="#C2452F" />
      {/* cuadrícula de piezas con su número */}
      <g stroke="#3A3A3F" strokeWidth="0.6" fill="#17171A">
        <rect x="88" y="24" width="28" height="30" />
        <rect x="120" y="24" width="28" height="30" />
        <rect x="88" y="58" width="28" height="28" />
        <rect x="120" y="58" width="28" height="28" />
      </g>
      <g fill="#C2452F">
        <rect x="91" y="27" width="7" height="1.6" />
        <rect x="123" y="27" width="7" height="1.6" />
        <rect x="91" y="61" width="7" height="1.6" />
        <rect x="123" y="61" width="7" height="1.6" />
      </g>
      <path d="M96 48 Q102 32 108 48 Q102 42 96 48 Z" fill="#F2EEE6" opacity="0.85" />
      <circle cx="134" cy="40" r="6" fill="none" stroke="#F2EEE6" strokeWidth="1" opacity="0.85" />
      <path d="M94 80 L102 64 L110 80 Z" fill="none" stroke="#F2EEE6" strokeWidth="1" opacity="0.85" />
      <path d="M126 80 Q134 62 142 80" fill="none" stroke="#F2EEE6" strokeWidth="1" opacity="0.85" />
    </svg>
  );
}

/** Revista: papel hueso, titular serif con una palabra en cursiva y foto a sangre. */
function Revista() {
  return (
    <svg viewBox="0 0 160 100" className="size-full" aria-hidden>
      <rect width="160" height="100" fill="#F1EBDD" />
      <rect x="12" y="9" width="22" height="2.6" rx="1.3" fill="#1D1A15" />
      <rect x="104" y="9.5" width="12" height="1.6" rx="0.8" fill="#6B665B" />
      <rect x="120" y="9.5" width="12" height="1.6" rx="0.8" fill="#6B665B" />
      <rect x="136" y="9.5" width="12" height="1.6" rx="0.8" fill="#A8361F" />
      <line x1="12" y1="17" x2="148" y2="17" stroke="#1D1A15" strokeWidth="0.5" />
      {/* titular: dos líneas y una palabra inclinada en el acento */}
      <rect x="12" y="28" width="52" height="7" rx="3.5" fill="#1D1A15" />
      <rect x="12" y="38" width="22" height="7" rx="3.5" fill="#1D1A15" />
      <g transform="skewX(-14) translate(14 0)">
        <rect x="38" y="38" width="26" height="7" rx="3.5" fill="#A8361F" />
      </g>
      <rect x="12" y="54" width="46" height="1.8" rx="0.9" fill="#6B665B" />
      <rect x="12" y="59" width="40" height="1.8" rx="0.9" fill="#6B665B" />
      <rect x="12" y="64" width="44" height="1.8" rx="0.9" fill="#6B665B" />
      <rect x="12" y="74" width="26" height="1.4" fill="#1D1A15" />
      {/* foto grande a sangre por abajo y por la derecha */}
      <rect x="76" y="24" width="84" height="76" fill="#CFC4AC" />
      <circle cx="104" cy="46" r="8" fill="#EDE5D2" />
      <path d="M76 84 L102 62 L122 78 L136 68 L160 86 L160 100 L76 100 Z" fill="#B3A68A" />
      <path d="M76 92 L96 78 L116 90 L160 74 L160 100 L76 100 Z" fill="#8F8369" opacity="0.7" />
    </svg>
  );
}

/** Cartel: bloques planos de lima, gótica gigante y un sello inclinado. */
function Cartel() {
  return (
    <svg viewBox="0 0 160 100" className="size-full" aria-hidden>
      <rect width="160" height="100" fill="#0B0B0C" />
      <rect x="8" y="6" width="20" height="5" fill="#F5F2EA" />
      <rect x="126" y="5" width="26" height="7" fill="#C6F432" />
      {/* bloque de color con la gótica enorme */}
      <rect x="0" y="16" width="160" height="52" fill="#C6F432" />
      <g fill="#0B0B0C">
        <path d="M8 56 L8 28 L16 28 L16 34 L24 28 L32 28 L32 56 L24 56 L24 40 L16 46 L16 56 Z" />
        <path d="M36 56 L36 28 L50 28 L50 34 L44 34 L44 40 L50 40 L50 56 Z" />
        <path d="M54 56 L54 28 L70 28 L70 36 L62 36 L62 56 Z" />
        <path d="M74 56 L74 28 L90 28 L90 56 L82 56 L82 36 Z" />
      </g>
      {/* sello inclinado */}
      <g transform="rotate(-10 128 40)">
        <rect x="108" y="30" width="40" height="20" fill="#0B0B0C" />
        <rect x="112" y="35" width="32" height="2.4" fill="#C6F432" />
        <rect x="112" y="41" width="22" height="2.4" fill="#C6F432" />
      </g>
      {/* franjas */}
      <rect x="0" y="70" width="78" height="30" fill="#1B1B1D" />
      <rect x="82" y="70" width="78" height="30" fill="#F5F2EA" />
      <rect x="8" y="78" width="34" height="5" fill="#F5F2EA" />
      <rect x="90" y="78" width="40" height="5" fill="#0B0B0C" />
      <rect x="8" y="88" width="50" height="2.4" fill="#8A8A82" />
      <rect x="90" y="88" width="56" height="2.4" fill="#5A5A54" />
    </svg>
  );
}

export function MiniaturaPlantilla({ id }: { id: IdPlantilla }) {
  if (id === "revista") return <Revista />;
  if (id === "cartel") return <Cartel />;
  return <Lamina />;
}
