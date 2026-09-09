import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  FolderKanban,
  HeartHandshake,
  UserCheck,
  Truck,
  ArrowRight,
  Filter,
  X,
  FileCheck
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';

export function GlobalSearchView({ onSelectEntity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await db.globalAdminSearch(query);
        setResults(matches);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = typeFilter === 'ALL'
    ? results
    : results.filter(r => r.type === typeFilter);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'User':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'Beneficiary':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'Programme':
        return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case 'Distribution':
        return <HeartHandshake className="w-4 h-4 text-purple-400" />;
      case 'Supplier':
        return <Truck className="w-4 h-4 text-amber-400" />;
      default:
        return <FileCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'User':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Beneficiary':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Programme':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Distribution':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Supplier':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-400" />
          Global Multi-Entity Admin Search
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Unified real-time search across users, registered beneficiaries, programmes, direct aid transactions, and suppliers.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search users, beneficiaries, programmes, aid dispatches, or suppliers..."
          className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition shadow-xl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggested Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 mr-1 flex items-center gap-1 font-medium">
          <Filter className="w-3 h-3" /> Filter by type:
        </span>
        {['ALL', 'User', 'Beneficiary', 'Programme', 'Distribution', 'Supplier'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
              typeFilter === t
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {t === 'ALL' ? 'All Entities' : t}
          </button>
        ))}
      </div>

      {/* Results Content */}
      {loading ? (
        <LoadingSpinner text="Scanning database indices..." />
      ) : query.trim().length >= 2 && filteredResults.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No records found for "{query}"</p>
          <p className="text-xs text-slate-500 mt-1">Try searching for a different name, ID, or location.</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-slate-400 px-1">
            Found {filteredResults.length} matching entities
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResults.map((r, idx) => (
              <Card
                key={`${r.type}-${r.id}-${idx}`}
                className="adra-card-hover p-4 flex items-start gap-3.5 relative"
              >
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getTypeIcon(r.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(r.type)}`}>
                      {r.type}
                    </span>
                    {r.badge && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {r.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1 truncate">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 truncate">
                    {r.subtitle}
                  </p>
                  {r.meta && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {r.meta}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Empty / Initial State with Sample Keywords */
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Discovery Prompts
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {['Turkana', 'WASH', 'Grace', 'Drought', 'Solar', 'Morgan', 'USAID', 'Seeds'].map(keyword => (
              <button
                key={keyword}
                onClick={() => setQuery(keyword)}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition"
              >
                "{keyword}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
