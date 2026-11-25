import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  ArrowRight
} from 'lucide-react';

export function BeneficiarySearchModal({
  isOpen,
  onClose,
  requests = [],
  initialQuery = '',
  onSelectRequest,
  onApplySearch
}) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery || '');
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, initialQuery, onClose]);

  const q = query.trim().toLowerCase();

  const matchedRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    if (!q) return list;
    return list.filter((r) =>
      [
        r.request_code,
        r.assistance_type,
        r.category,
        r.status,
        r.status_label,
        r.program_name,
        r.description,
        r.reason,
        r.preferred_depot,
        r.location,
        r.county,
        r.state
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [requests, q]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-6 pt-12 sm:pt-20 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search Assistance Requests"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onApplySearch) onApplySearch(query.trim());
            onClose();
          }}
          className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 bg-white"
        >
          <Search className="w-4 h-4 text-[#006B56] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assistance requests by code, category, status, or depot..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            Esc
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="px-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Assistance Requests ({matchedRequests.length})
            </span>
            {q && onApplySearch && (
              <button
                type="button"
                onClick={() => {
                  onApplySearch(query.trim());
                  onClose();
                }}
                className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer"
              >
                Filter list by "{query.trim()}"
              </button>
            )}
          </div>

          {matchedRequests.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <Search className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No matching assistance requests</p>
              <p className="text-[11px] text-slate-400">
                Try searching by request code, aid category, status, or depot.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {matchedRequests.map((req) => (
                <button
                  key={req.id || req.request_code}
                  type="button"
                  onClick={() => {
                    if (onSelectRequest) {
                      onSelectRequest(req);
                    } else if (onApplySearch) {
                      onApplySearch(req.request_code || req.assistance_type || req.category || '');
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#006B56] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {req.assistance_type || req.category || 'Assistance Request'}
                        </span>
                        {req.request_code && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            {req.request_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {req.status_label || req.status || 'Submitted'}
                        {req.preferred_depot ? ` • ${req.preferred_depot}` : ''}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#006B56] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BeneficiarySearchModal;
