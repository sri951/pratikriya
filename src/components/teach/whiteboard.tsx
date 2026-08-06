import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#1f2d33", "#0e7490", "#be123c", "#b45309", "#15803d"];
const BOARD_BG = "#ffffff";

export function Whiteboard({
  onSend,
  busy,
}: {
  onSend: (dataUrl: string) => void;
  busy?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const snapshots = useRef<ImageData[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(3);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshots.current.push(
      ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
    );
    if (snapshots.current.length > 20) snapshots.current.shift();
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.strokeStyle = erasing ? BOARD_BG : color;
    ctx.lineWidth = erasing ? 24 : width;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function undo() {
    const ctx = canvasRef.current?.getContext("2d");
    const last = snapshots.current.pop();
    if (ctx && last) ctx.putImageData(last, 0, 0);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);
    snapshots.current = [];
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Pen colour ${c}`}
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
            className={`h-6 w-6 rounded-full border transition ${
              color === c && !erasing ? "scale-110 border-foreground" : "border-border"
            }`}
            style={{ background: c }}
          />
        ))}
        <input
          type="range"
          min={1}
          max={12}
          value={width}
          aria-label="Pen thickness"
          onChange={(e) => setWidth(Number(e.target.value))}
          className="ml-1 w-20 accent-primary"
        />
        <Button
          type="button"
          size="sm"
          variant={erasing ? "default" : "ghost"}
          className="rounded-full"
          onClick={() => setErasing((v) => !v)}
        >
          {erasing ? <Eraser className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          <span className="ml-1 text-xs">{erasing ? "Eraser" : "Pen"}</span>
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={clear}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-64 w-full touch-none rounded-2xl border border-border bg-white md:h-[22rem]"
      />

      <Button
        type="button"
        disabled={busy}
        onClick={() => {
          const url = canvasRef.current?.toDataURL("image/png");
          if (url) onSend(url);
        }}
        className="rounded-full"
      >
        <Send className="mr-1 h-4 w-4" /> Show this to my student
      </Button>
    </div>
  );
}