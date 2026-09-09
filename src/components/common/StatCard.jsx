import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'emerald',
  onClick,
}) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-500/30',
    blue: 'text-sky-700 bg-sky-50 border-sky-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    cyan: 'text-teal-700 bg-teal-50 border-teal-200',
  };

  return (
    <Card
      hover={Boolean(onClick)}
      onClick={onClick}
      className="flex flex-col justify-between relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading tracking-tight truncate">{value}</h3>
        </div>
        {Icon && (
          <div className={cn('p-2 sm:p-3 rounded-xl border shrink-0', colorMap[color] || colorMap.emerald)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {(subtitle || trendValue) && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-2 sm:pt-3 border-t border-slate-800 text-[11px] sm:text-xs text-slate-400">
          {trendValue && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded',
                trend === 'down' ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-500/30'
              )}
            >
              {trend === 'down' ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
