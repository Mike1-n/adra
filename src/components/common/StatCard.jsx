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
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
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
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-2 sm:pt-3 border-t border-slate-800/60 text-[11px] sm:text-xs text-slate-400">
          {trendValue && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded',
                trend === 'down' ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'
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
