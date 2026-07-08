import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "strict",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    themeVariables: {
      primaryColor: "#dbeee6",
      primaryTextColor: "#1f3a3a",
      primaryBorderColor: "#7fb8a8",
      lineColor: "#7fb8a8",
      secondaryColor: "#eaf3ee",
      tertiaryColor: "#f4f9f6",
      fontSize: "14px",
    },
  });
  initialized = true;
}

let uid = 0;

export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`m-${++uid}-${Date.now().toString(36)}`);

  useEffect(() => {
    let cancelled = false;
    ensureInit();
    mermaid
      .render(idRef.current, code)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-xs text-muted-foreground">
        Couldn't render diagram. Here's the source:
        <pre className="mt-2 overflow-x-auto text-[11px]">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram flex justify-center overflow-x-auto rounded-2xl border border-border bg-[oklch(0.99_0.008_180)] p-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}