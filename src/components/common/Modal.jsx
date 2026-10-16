import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  fullPageOnMobile = true
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex justify-center pb-safe',
        fullPageOnMobile
          ? 'items-stretch sm:items-center p-0 sm:p-6 overflow-hidden sm:overflow-y-auto'
          : 'items-end sm:items-center p-0 sm:p-6 overflow-y-auto'
      )}
    >
      {/* Backdrop (hidden on mobile when full page, shown on desktop) */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in',
          fullPageOnMobile && 'hidden sm:block'
        )}
        onClick={onClose}
      />

      {/* Modal Dialog (Full page on mobile when fullPageOnMobile=true, Centered Card on desktop) */}
      <div
        className={cn(
          'relative w-full bg-white z-10 transition-all flex flex-col',
          fullPageOnMobile
            ? 'h-[100dvh] sm:h-auto min-h-[100dvh] sm:min-h-0 rounded-none sm:rounded-2xl sm:border border-slate-200 shadow-2xl my-0 sm:my-8 overflow-hidden animate-in slide-in-from-right-3 duration-200 sm:animate-scale-up'
            : 'border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl my-0 sm:my-8 overflow-hidden transform animate-in slide-in-from-bottom duration-200 sm:animate-scale-up',
          maxWidth
        )}
      >
        {/* Mobile handle indicator (only when bottom sheet card mode) */}
        {!fullPageOnMobile && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white shrink-0 pt-safe sm:pt-4">
          <div className="flex items-center gap-2 min-w-0">
            {fullPageOnMobile && (
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden p-1.5 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
            )}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className={cn(
            'px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto overscroll-contain text-slate-800',
            fullPageOnMobile ? 'flex-1 pb-10' : 'max-h-[80vh]'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : modalElement;
}
