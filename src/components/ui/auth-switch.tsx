import { cn } from "@/lib/utils";
import { useId } from "react";

export type AuthMode = "signin" | "signup";

interface AuthSwitchProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
  className?: string;
}

export function AuthSwitch({ mode, onChange, className }: AuthSwitchProps) {
  const baseId = useId();

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className={cn(
        "relative flex w-full rounded-full border border-border bg-muted/60 p-1",
        className
      )}
    >
      <div
        className="absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-[var(--shadow-soft)] transition-all duration-300 ease-out"
        style={{
          left: mode === "signin" ? "0.25rem" : "calc(50% + 0.25rem)",
        }}
        aria-hidden="true"
      />
      <button
        type="button"
        role="tab"
        aria-selected={mode === "signin"}
        id={`${baseId}-signin`}
        aria-controls={`${baseId}-panel`}
        onClick={() => onChange("signin")}
        className={cn(
          "relative z-10 flex-1 rounded-full py-2 text-sm font-medium transition-colors duration-300",
          mode === "signin"
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "signup"}
        id={`${baseId}-signup`}
        aria-controls={`${baseId}-panel`}
        onClick={() => onChange("signup")}
        className={cn(
          "relative z-10 flex-1 rounded-full py-2 text-sm font-medium transition-colors duration-300",
          mode === "signup"
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign up
      </button>
    </div>
  );
}
