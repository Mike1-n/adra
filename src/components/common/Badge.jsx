import React from 'react';
import { cn, getStatusBadgeClass } from '../../lib/utils';

export function Badge({ children, variant, status, className }) {
  const badgeClass = status ? getStatusBadgeClass(status) : (variant ? `badge-${variant}` : 'badge-slate');

  return (
    <span className={cn(badgeClass, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children || status}
    </span>
  );
}
