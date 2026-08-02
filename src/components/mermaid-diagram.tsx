import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { Download, Share2, Maximize2 } from "lucide-react";
import { toast } from "sonner";

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
  const [pngUrl, setPngUrl] = useState<string>("");
  const [svgUrl, setSvgUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const idRef = useRef(`m-${++uid}-${Date.now().toString(36)}`);

  useEffect(() => {
    let cancelled = false;
    let revokeSvg: string | null = null;
    ensureInit();
    mermaid
      .render(idRef.current, code)
      .then(({ svg }) => {
        if (cancelled) return;
        // Ensure the SVG has explicit dimensions for canvas rasterization.
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
        const svgEl = doc.documentElement as unknown as SVGSVGElement;
        const viewBox = svgEl.getAttribute("viewBox");
        let width = parseFloat(svgEl.getAttribute("width") || "0");
        let height = parseFloat(svgEl.getAttribute("height") || "0");
        if ((!width || !height) && viewBox) {
          const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
          width = width || vw;
          height = height || vh;
        }
        width = width || 800;
        height = height || 500;
        svgEl.setAttribute("width", String(width));
        svgEl.setAttribute("height", String(height));
        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const serialized = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
        const svgObjectUrl = URL.createObjectURL(svgBlob);
        revokeSvg = svgObjectUrl;
        setSvgUrl(svgObjectUrl);

        // Rasterize to PNG at 2x for crisp preview.
        const scale = 2;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled) return;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            setPngUrl(canvas.toDataURL("image/png"));
            setDims({ w: width, h: height });
            setError(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        };
        img.onerror = () => {
          if (!cancelled) setError("Could not rasterize diagram");
        };
        img.src = svgObjectUrl;
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
      if (revokeSvg) URL.revokeObjectURL(revokeSvg);
    };
  }, [code]);

  const downloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `pratikriya-diagram-${Date.now()}.png`;
    a.click();
  };

  const share = async () => {
    if (!pngUrl) return;
    try {
      const res = await fetch(pngUrl);
      const blob = await res.blob();
      const file = new File([blob], "pratikriya-diagram.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "Pratikriya diagram" });
        return;
      }
      if (navigator.clipboard && "write" in navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("Diagram copied to clipboard");
        return;
      }
      downloadPng();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't share diagram");
    }
  };

  const openFullSize = () => {
    if (!pngUrl) return;
    const w = window.open("");
    if (!w) return;
    w.document.write(
      `<title>Pratikriya diagram</title><body style="margin:0;background:#0f172a;display:grid;place-items:center;min-height:100vh"><img src="${pngUrl}" style="max-width:100%;max-height:100vh"/></body>`,
    );
  };

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-xs text-muted-foreground">
        Couldn't render diagram. Here's the source:
        <pre className="mt-2 overflow-x-auto text-[11px]">{code}</pre>
      </div>
    );
  }

  if (!pngUrl) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-2xl border border-border bg-[oklch(0.99_0.008_180)] text-xs text-muted-foreground"
        aria-busy="true"
      >
        Rendering diagram…
      </div>
    );
  }

  return (
    <figure className="mermaid-diagram overflow-hidden rounded-2xl border border-border bg-[oklch(0.99_0.008_180)]">
      <button
        type="button"
        onClick={openFullSize}
        className="block w-full cursor-zoom-in p-4 transition-opacity hover:opacity-95"
        aria-label="Open diagram full size"
      >
        <img
          src={pngUrl}
          alt="Diagram illustrating the concept"
          width={dims?.w}
          height={dims?.h}
          className="mx-auto h-auto max-w-full"
          loading="lazy"
        />
      </button>
      <figcaption className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/60 px-3 py-2">
        <Button type="button" size="sm" variant="ghost" onClick={openFullSize} className="rounded-full">
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          View
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={share} className="rounded-full">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={downloadPng} className="rounded-full">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PNG
        </Button>
      </figcaption>
    </figure>
  );
}