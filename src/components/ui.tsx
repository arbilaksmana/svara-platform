"use client";

import Link from "next/link";
import { forwardRef, useEffect, useId, useRef } from "react";
import { Archive, CircleDot, FilePen, Lock, X } from "lucide-react";
import type { SurveyStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/survey";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-fg-inverse hover:bg-accent-hover border border-transparent",
  secondary: "bg-surface text-fg border border-line-input hover:bg-surface-muted",
  ghost: "text-fg hover:bg-surface-muted border border-transparent",
  danger: "bg-danger text-fg-inverse hover:bg-danger-hover border border-transparent",
};
const sizes: Record<Size, string> = {
  md: "min-h-10 px-4 text-sm",
  sm: "min-h-9 px-3 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string) {
  return cx(base, variants[variant], sizes[size], extra);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />;
});

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ---------- Status ---------- */

const statusStyle: Record<SurveyStatus, { cls: string; Icon: typeof CircleDot }> = {
  draft: { cls: "bg-surface-muted text-fg-muted border-line", Icon: FilePen },
  published: { cls: "bg-success-soft text-success-text border-success-line", Icon: CircleDot },
  closed: { cls: "bg-warning-soft text-warning-text border-warning-line", Icon: Lock },
  archived: { cls: "bg-surface-muted text-fg-muted border-line", Icon: Archive },
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  const { cls, Icon } = statusStyle[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", cls)}>
      <Icon aria-hidden className="size-3.5" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-medium text-fg-muted">
      {children}
    </span>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" }) {
  return <section className={cx("rounded-xl border border-line bg-surface", className)} {...rest} />;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 tabIndex={-1} id="page-title" className="text-2xl font-semibold tracking-[-0.015em] text-fg outline-none">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-fg-muted">{icon}</div>}
      <p className="font-medium text-fg">{title}</p>
      <p className="mt-1 max-w-md text-sm text-fg-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  icon,
  title,
  children,
  role,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  role?: "status" | "alert";
}) {
  const tones = {
    info: "bg-accent-soft border-accent-soft-line text-fg",
    warning: "bg-warning-soft border-warning-line text-fg",
    danger: "bg-danger-soft border-danger-line text-fg",
    success: "bg-success-soft border-success-line text-fg",
  };
  const iconTone = {
    info: "text-accent-text",
    warning: "text-warning-text",
    danger: "text-danger-text",
    success: "text-success-text",
  };
  return (
    <div role={role} className={cx("flex gap-3 rounded-lg border p-4 text-sm", tones[tone])}>
      {icon && <span className={cx("mt-0.5 shrink-0 [&>svg]:size-4", iconTone[tone])}>{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(Boolean(title) && "mt-1", "max-w-[70ch] text-fg-muted [&_strong]:text-fg")}>{children}</div>}
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */

export const inputClass =
  "block w-full rounded-lg border border-line-input bg-surface px-3 py-2 text-base text-fg placeholder:text-fg-muted sm:text-sm aria-invalid:border-danger-text read-only:bg-surface-muted";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  children,
  className,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required && <span className="font-normal text-fg-muted"> (wajib)</span>}
        {optional && <span className="font-normal text-fg-muted"> (opsional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, hint?: unknown, error?: unknown) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function Switch({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-sm text-fg-muted">
            {description}
          </p>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        onChange={(e) => onChange(e.target.checked)}
        className="peer relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-line-input bg-surface-muted transition-[background-color] duration-150 before:absolute before:top-0.5 before:left-0.5 before:size-[1.125rem] before:rounded-full before:bg-fg-muted before:transition-[translate,background-color] before:duration-150 checked:border-accent checked:bg-accent checked:before:translate-x-5 checked:before:bg-surface motion-reduce:before:transition-none"
      />
    </div>
  );
}

/* ---------- Dialog ---------- */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={() => {
        onClose();
        returnTo.current?.focus();
      }}
      className={cx(
        "m-auto w-[calc(100%-2rem)] overscroll-contain rounded-2xl border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-surface-inverse/50",
        size === "md" ? "max-w-lg" : "max-w-2xl",
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em]">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="press -me-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children && <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pt-4">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-3 px-6 pt-6 pb-6">{footer}</div>}
          {!footer && <div className="pb-6" />}
        </div>
      )}
    </dialog>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-fg-muted">
        {icon && <span className="[&>svg]:size-4">{icon}</span>}
        {label}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-fg tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-fg-muted">{hint}</p>}
    </div>
  );
}
