import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Fingerprint,
  GraduationCap,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OfflineBadge } from "@/components/offline-badge";

export const TOOLS = [
  { to: "/exam", label: "Exam mode", Icon: GraduationCap },
  { to: "/notes", label: "Notes AI", Icon: BookOpen },
  { to: "/teach", label: "Reverse Teacher", Icon: Users },
  { to: "/detective", label: "AI Detective", Icon: Fingerprint },
] as const;

type Props = {
  /** Name of the current tool, shown as the page context. */
  current?: string;
};

/** Shared header for every feature page so navigation feels identical app-wide. */
export function AppHeader({ current }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <BrandMark size={32} />
          <span className="font-display text-lg font-semibold tracking-tight">Pratikriya</span>
        </Link>

        {current && (
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            / {current}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <OfflineBadge />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 font-normal text-muted-foreground hover:text-foreground">
                Learning tools
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {TOOLS.map(({ to, label, Icon }) => (
                <DropdownMenuItem key={to} asChild>
                  <Link to={to}>
                    <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
