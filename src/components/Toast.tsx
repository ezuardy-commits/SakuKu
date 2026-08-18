import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          isError
            ? 'bg-rose-900/90 border-rose-700 text-white'
            : isInfo
            ? 'bg-slate-900/90 border-slate-700 text-white'
            : 'bg-emerald-900/95 border-emerald-600 text-white shadow-emerald-950/20'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-300" />
            ) : isInfo ? (
              <Info className="w-5 h-5 text-blue-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            )}
          </div>
          <p className="text-xs font-semibold leading-tight text-white truncate">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
