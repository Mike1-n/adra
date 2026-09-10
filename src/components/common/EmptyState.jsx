import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria. Create a new entry or adjust your search filter.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
      <div className="p-3.5 rounded-2xl bg-white text-slate-500 mb-3.5 border border-slate-200 shadow-xs">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
