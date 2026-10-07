import React from 'react';

/**
 * ADRA Official Brand Logo Component
 * - When isCollapsed is true: Displays ONLY the ADRA emblem (upper globe with 3 figures) in compact icon format.
 * - When enlarged (isCollapsed is false): Displays the newly uploaded official ADRA logo with the full green emblem and "ADRA" name on transparent background.
 */
export function AdraLogo({
  isCollapsed = false,
  subtitle = 'DMS',
  description = 'Field Application',
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
}) {
  // Collapsed Mode: Only the pure ADRA emblem (upper globe with 3 figures) is visible
  if (isCollapsed) {
    return (
      <div
        onClick={onClick}
        title="ADRA - Click to expand"
        className={`relative overflow-hidden rounded-xl bg-[#006E51] flex items-center justify-center shrink-0 shadow-sm border border-emerald-600/30 transition-all duration-200 ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
        } ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400/50' : ''} ${className}`}
      >
        {/* Precise crop focusing on the upper globe emblem without the 'ADRA' text */}
        <img
          src="/images/adra-logo.png"
          alt="ADRA Emblem"
          className="w-[165%] h-[165%] max-w-none object-cover object-[center_12%] select-none pointer-events-none"
        />
      </div>
    );
  }

  // Enlarged / Expanded Mode: Full Logo with the name "ADRA" using uploaded transparent green logo
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Uploaded official ADRA logo image (green emblem + ADRA text) */}
      <img
        src="/images/adra-logo-expanded.png"
        alt="ADRA Logo"
        className="h-10 w-auto max-w-[48px] object-contain shrink-0 drop-shadow-2xs"
      />

      {(subtitle || description) && (
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              ADRA
            </span>
            {subtitle && (
              <span className="text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-500/30 leading-none">
                {subtitle}
              </span>
            )}
          </div>
          {description && (
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
