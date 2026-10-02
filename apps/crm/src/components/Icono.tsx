import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  CircleHelp,
  Clock,
  CreditCard,
  Download,
  FileChartColumn,
  Euro,
  ExternalLink,
  House,
  Images,
  Inbox,
  Keyboard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  NotebookPen,
  PanelLeft,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Sun,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Los nombres siguen siendo los del panel: si mañana se cambia de juego de
 * iconos, solo se toca este mapa y no las cuarenta llamadas.
 */
const ICONOS = {
  panel: LayoutDashboard,
  calendario: CalendarDays,
  personas: Users,
  llave: KeyRound,
  enlace: ExternalLink,
  salir: LogOut,
  flecha: ArrowRight,
  diagonal: ArrowUpRight,
  reloj: Clock,
  nota: NotebookPen,
  euro: Euro,
  buscar: Search,
  sol: Sun,
  luna: Moon,
  plegar: PanelLeft,
  casa: House,
  grafico: ChartColumn,
  tarjeta: CreditCard,
  aviso: TriangleAlert,
  estudio: Store,
  mas: Plus,
  bandeja: Inbox,
  ayuda: CircleHelp,
  mensaje: Mail,
  teclado: Keyboard,
  bien: CircleCheck,
  catalogo: Images,
  descargar: Download,
  informe: FileChartColumn,
  consentimiento: ShieldCheck,
} satisfies Record<string, LucideIcon>;

export type NombreIcono = keyof typeof ICONOS;

export function Icono({
  nombre,
  className = "",
}: {
  nombre: NombreIcono;
  className?: string;
}) {
  const Svg = ICONOS[nombre];
  return <Svg aria-hidden className={className} strokeWidth={1.75} />;
}
