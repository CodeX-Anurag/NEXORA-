/**
 * Toast — slide-in notification from the top-right.
 * Props: message, type ("success"|"error"|"info"), onClose, show (boolean)
 * Auto-dismisses after 4 s unless closed manually.
 */

import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const typeConfig = {
  success: {
    icon: CheckCircle2,
    border: 'border-[#A6F4C5] dark:border-emerald-800/60',
    iconClass: 'text-[#12B76A] dark:text-emerald-400',
    bg: 'bg-white dark:bg-[#111827]',
  },
  error: {
    icon: XCircle,
    border: 'border-[#FECDCA] dark:border-rose-800/60',
    iconClass: 'text-[#F04438] dark:text-rose-400',
    bg: 'bg-white dark:bg-[#111827]',
  },
  info: {
    icon: Info,
    border: 'border-[#B9E6FE] dark:border-blue-800/60',
    iconClass: 'text-[#4F7CFF] dark:text-blue-400',
    bg: 'bg-white dark:bg-[#111827]',
  },
};

export function Toast({ message, type = 'info', onClose, show = false }) {
  const timerRef = useRef(null);
  const cfg = typeConfig[type] ?? typeConfig.info;
  const Icon = cfg.icon;

  useEffect(() => {
    if (show && onClose) {
      timerRef.current = setTimeout(() => onClose(), 4000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 z-[9999] flex items-start gap-3 min-w-[280px] max-w-sm
        px-4 py-3.5 rounded-2xl border shadow-xl shadow-slate-900/10 dark:shadow-black/40
        transition-all duration-300 ease-out
        ${cfg.bg} ${cfg.border}
        ${show ? 'opacity-100 translate-y-0 pointer-events-auto animate-toast-slide-in' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconClass}`} />

      <p className="flex-1 text-xs sm:text-sm font-sans text-[#172033] dark:text-slate-100 leading-snug">
        {message}
      </p>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="shrink-0 text-[#98A2B3] hover:text-[#172033] dark:hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default Toast;
