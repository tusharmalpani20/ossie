import { type ElementType, type ReactNode, useId } from "react";
import { cn } from "./utils";

export type StatusPanelTone =
  | "neutral"
  | "loading"
  | "empty"
  | "error"
  | "not-found"
  | "forbidden";

export type StatusPanelProps = {
  tone?: StatusPanelTone;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
};

const illustrationBadgeColors: Record<StatusPanelTone, string> = {
  neutral:
    "border-[var(--ossie-color-accent)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-accent)]",
  loading:
    "border-[var(--ossie-color-accent)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-accent)]",
  empty:
    "border-[var(--ossie-color-accent)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-accent)]",
  error:
    "border-[var(--ossie-color-danger)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-danger)]",
  "not-found":
    "border-[var(--ossie-color-warning)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-warning)]",
  forbidden:
    "border-[var(--ossie-color-warning)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-warning)]",
};

function OssieIllustration({ tone }: { tone: StatusPanelTone }) {
  const marker =
    tone === "loading"
      ? "…"
      : tone === "error"
        ? "×"
        : tone === "not-found"
          ? "?"
          : tone === "forbidden"
            ? "!"
            : tone === "empty"
              ? "+"
              : "·";

  return (
    <div className="relative h-20 w-20">
      <img
        aria-hidden="true"
        alt=""
        className="h-20 w-20 rounded-[var(--ossie-radius-card)] object-cover"
        src="/brand/ossie-app-icon-256.png"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 text-lg font-bold leading-none shadow-[var(--ossie-shadow-control)]",
          illustrationBadgeColors[tone],
        )}
      >
        {marker}
      </span>
    </div>
  );
}

export function StatusPanel({
  tone = "neutral",
  title,
  description,
  action,
  className,
  titleAs = "h2",
}: StatusPanelProps) {
  const titleId = useId();
  const role =
    tone === "error" ? "alert" : tone === "loading" ? "status" : "region";
  const Heading = titleAs as ElementType;

  return (
    <section
      aria-busy={tone === "loading" ? true : undefined}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-[var(--ossie-space-4)] rounded-[var(--ossie-radius-card)] border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] px-[var(--ossie-space-6)] py-[var(--ossie-space-8)] text-center shadow-[var(--ossie-shadow-card)]",
        className,
      )}
    >
      <div
        aria-labelledby={titleId}
        className="flex w-full flex-col items-center gap-[var(--ossie-space-4)]"
        role={role}
      >
        <OssieIllustration tone={tone} />
        <div className="grid w-full max-w-[34rem] gap-[var(--ossie-space-2)] break-words">
          <Heading
            className={cn(
              "font-semibold tracking-normal text-[var(--ossie-color-text)] [text-wrap:balance]",
              titleAs === "h1"
                ? "[font-size:var(--ossie-font-size-xl)] [line-height:var(--ossie-line-height-tight)]"
                : "[font-size:var(--ossie-font-size-md)] [line-height:var(--ossie-line-height-tight)]",
            )}
            id={titleId}
          >
            {title}
          </Heading>
          {description ? (
            <p className="break-words [font-size:var(--ossie-font-size-sm)] [line-height:var(--ossie-line-height-normal)] text-[var(--ossie-color-muted)] [text-wrap:pretty]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex flex-wrap items-center justify-center gap-[var(--ossie-space-2)]">
          {action}
        </div>
      ) : null}
    </section>
  );
}
