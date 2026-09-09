import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterOptions = [],
  selectedFilter = '',
  onFilterChange,
  actions,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="adra-input pl-10 pr-9 text-sm"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdown & Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
        {filterOptions.length > 0 && onFilterChange && (
          <div className="relative flex-1 sm:flex-initial flex items-center min-w-[160px]">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="adra-select pl-9 pr-8 text-xs sm:text-sm cursor-pointer w-full"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
