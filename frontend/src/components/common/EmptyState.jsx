import React from 'react';

/**
 * EmptyState — reusable empty / zero-data placeholder.
 * Props: icon, title, description, action, size ("sm" | "md" | "lg")
 */

const sizeMap = {
  sm: {
    wrapper: 'py-6 gap-2',
    iconBox: 'w-10 h-10 text-xl',
    title: 'text-sm',
    desc: 'text-xs',
  },
  md: {
    wrapper: 'py-10 gap-3',
    iconBox: 'w-14 h-14 text-2xl',
    title: 'text-base',
    desc: 'text-xs',
  },
  lg: {
    wrapper: 'py-16 gap-4',
    iconBox: 'w-20 h-20 text-3xl',
    title: 'text-lg',
    desc: 'text-sm',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
}) {
  const s = sizeMap[size] ?? sizeMap.md;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <span className={s.iconBox.split(' ').find((c) => c.startsWith('text-'))}>
          {icon}
        </span>
      );
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComponent = icon;
      return <IconComponent className="w-6 h-6 text-[#9C9384]" size={24} />;
    }
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${s.wrapper}`}
    >
      {icon && (
        <div
          className={`flex items-center justify-center rounded-2xl bg-[#22201D] border border-[#2D2925] ${s.iconBox}`}
        >
          {renderIcon()}
        </div>
      )}

      {title && (
        <p
          className={`font-display font-semibold text-[#FAF7F2] ${s.title} mt-1`}
        >
          {title}
        </p>
      )}

      {description && (
        <p className={`text-[#9C9384] max-w-xs ${s.desc}`}>{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
