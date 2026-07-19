"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, Check, X } from "lucide-react";

export interface PageToast {
  id: string;
  title: string;
  message: string;
  href?: string;
}

interface ToastContextValue {
  pushToast: (toast: Omit<PageToast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 8000;
const NAVBAR_GAP_PX = 12;
const MIN_RIGHT_PX = 16;

function readToastAnchor(): { top: number; right: number } {
  const header = document.getElementById("site-navbar");
  if (!header) return { top: 84, right: 24 };

  const headerRect = header.getBoundingClientRect();
  const nav = header.querySelector("nav");
  const anchorRect = nav?.getBoundingClientRect() ?? headerRect;

  return {
    top: headerRect.height + NAVBAR_GAP_PX,
    right: Math.max(MIN_RIGHT_PX, window.innerWidth - anchorRect.right),
  };
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: PageToast[];
  onDismiss: (id: string) => void;
}) {
  const [anchor, setAnchor] = useState({ top: 84, right: 24 });

  useLayoutEffect(() => {
    function syncAnchor() {
      setAnchor(readToastAnchor());
    }

    syncAnchor();
    window.addEventListener("resize", syncAnchor);
    window.addEventListener("scroll", syncAnchor, { passive: true });

    const nav = document.getElementById("site-navbar");
    const observer =
      nav && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncAnchor)
        : null;
    if (nav && observer) observer.observe(nav);

    return () => {
      window.removeEventListener("resize", syncAnchor);
      window.removeEventListener("scroll", syncAnchor);
      observer?.disconnect();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="page-toast-stack"
      style={{ top: anchor.top, right: anchor.right }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-[#002FA7]/15 bg-white shadow-[0_18px_45px_rgba(0,47,167,0.22)]"
        >
          <div className="flex items-start gap-3 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/8 text-[#002FA7]">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#002FA7] font-semibold">
                {toast.title}
              </p>
              <p className="mt-1 text-sm font-light leading-relaxed text-slate-700">{toast.message}</p>
              {toast.href && (
                <Link
                  href={toast.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#002FA7] px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-white transition hover:bg-[#001e6c]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Open
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-full p-1 text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<PageToast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<PageToast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current.slice(-4), { ...toast, id }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted ? createPortal(<ToastStack toasts={toasts} onDismiss={dismissToast} />, document.body) : null}
    </ToastContext.Provider>
  );
}

export function usePageToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("usePageToast must be used within PageToastProvider");
  }
  return context;
}
