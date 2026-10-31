/**
 * Toast — slide-in notification from the top-right.
 * Props: message, type ("success"|"error"|"info"), onClose, show (boolean)
 * Auto-dismisses after 4 s unless closed manually.
 */

import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const typeConfig = {
  success: {
    icon: CheckCircle2,
    border: 'border-[#2EA366]/30',
    iconClass: 'text-[#2EA366]',
    bg: 'bg-[#141312]',
  },
  error: {
    icon: XCircle,
    border: 'border-rose-800/40',
    iconClass: 'text-rose-400',
    bg: 'bg-[#141312]',
  },
  info: {
    icon: Info,
    border: 'border-sky-800/40',
    iconClass: 'text-sky-400',
    bg: 'bg-[#141312]',
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
      className={`fixed top-4 right-4 z-[9999] flex items-start gap-3 min-w-[260px] max-w-sm
        px-4 py-3 rounded-xl border shadow-xl shadow-black/40
        transition-all duration-300 ease-out
        ${cfg.bg} ${cfg.border}
        ${show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconClass}`} />

      <p className="flex-1 text-sm font-sans text-[#CDC5B6] leading-snug">
        {message}
      </p>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="shrink-0 text-[#9C9384] hover:text-[#FAF7F2] transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default Toast;
