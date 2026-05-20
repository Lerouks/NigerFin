'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; ring: string; icon: typeof CheckCircle2; iconColor: string }
> = {
  success: {
    bg: 'bg-white',
    ring: 'ring-emerald-500/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    bg: 'bg-white',
    ring: 'ring-red-500/20',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
  info: {
    bg: 'bg-white',
    ring: 'ring-gold/30',
    icon: Info,
    iconColor: 'text-gold',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[10000] flex flex-col items-end gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const v = VARIANT_STYLES[toast.variant];
  const Icon = v.icon;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 ${v.bg} ${v.ring} ring-1 ring-inset rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] px-4 py-3 max-w-sm animate-slide-up`}
      role="status"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
      <p className="text-[13px] text-[#111] leading-snug flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors -mr-1 -mt-0.5"
        aria-label="Fermer la notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit etre appele a l\'interieur de <ToastProvider>');
  }
  return ctx;
}
