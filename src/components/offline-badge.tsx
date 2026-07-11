import { CloudOff, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useOnline } from "@/hooks/use-online";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
    >
      <CloudOff className="h-3.5 w-3.5" aria-hidden />
      Offline mode
    </span>
  );
}

export function InstallButton() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !evt) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={async () => {
        try {
          await evt.prompt();
          await evt.userChoice;
        } finally {
          setEvt(null);
        }
      }}
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      Install app
    </Button>
  );
}