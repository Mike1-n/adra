import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 focus:ring-emerald-500 border border-emerald-700/40',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold border border-slate-300 focus:ring-emerald-500 shadow-sm',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 focus:ring-rose-500 border border-rose-600',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold focus:ring-emerald-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-emerald-500',
    accent: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold focus:ring-emerald-500 shadow-md',
    lightGreen: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-500/30 focus:ring-emerald-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
