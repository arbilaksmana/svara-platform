"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

const Ctx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

/**
 * One polite live region, rendered before any message so announcements fire.
 * Toasts with an action stay until dismissed; plain ones clear after 6s.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((t: Omit<Toast, "id">) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
  }, []);

  useEffect(() => {
    if (toast && !toast.action) {
      timer.current = setTimeout(() => setToast(null), 6000);
    }
    return () => clearTimeout(timer.current);
  }, [toast]);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end">
        <div role="status" aria-live="polite" className="pointer-events-auto">
          {toast && (
            <div className="flex max-w-md items-center gap-3 rounded-xl bg-surface-inverse py-2 ps-4 pe-2 text-sm text-fg-inverse shadow-lg">
              <span className="min-w-0 py-1.5">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  className="press min-h-9 shrink-0 rounded-lg px-3 font-semibold underline underline-offset-4 hover:bg-fg-inverse/10"
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => setToast(null)}
                className="press inline-flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-fg-inverse/10"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
