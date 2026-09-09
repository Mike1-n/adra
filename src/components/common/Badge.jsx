import React from 'react';
import { cn, getStatusBadgeClass } from '../../lib/utils';

export function Badge({ children, variant, status, className }) {
  let badgeClass = 'badge-slate';
  if (status) {
    badgeClass = getStatusBadgeClass(status);
  } else if (variant) {
    switch (variant) {
      case 'primary':
        badgeClass = 'badge-primary';
        break;
      case 'darkgreen':
        badgeClass = 'badge-darkgreen';
        break;
      case 'lightgreen':
      case 'emerald':
        badgeClass = 'badge-emerald';
        break;
      default:
        badgeClass = `badge-${variant}`;
    }
  }

  return (
    <span className={cn(badgeClass, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children || status}
    </span>
  );
}
