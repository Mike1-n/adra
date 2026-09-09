import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle,
  MapPin,
  Users,
  Target,
  Search,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function ProgrammeInformationView({ onApplyProgramme }) {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const toast = useToast();

  useEffect(() => {
    const loadProgrammes = async () => {
      try {
        setLoading(true);
        const data = await db.getProjects();
        setProgrammes(data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load programmes');
      } finally {
        setLoading(false);
      }
    };
    loadProgrammes();
  }, []);

  const sectors = ['ALL', 'Agriculture & Food', 'WASH & Water', 'Livelihoods', 'Emergency Relief'];

  const filtered = programmes.filter(p => {
    const matchSearch = p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (sectorFilter === 'ALL') return matchSearch;
    return matchSearch && (
      (sectorFilter.includes('Agriculture') && p.project_name.includes('Drought')) ||
      (sectorFilter.includes('WASH') && p.project_name.includes('Water')) ||
      (sectorFilter.includes('Livelihoods') && p.project_name.includes('Youth')) ||
      (sectorFilter.includes('Emergency') && p.project_name.includes('Flood'))
    );
  });

  const getEligibilityCriteria = (prog) => {
    if (prog.project_name?.includes('Drought') || prog.project_name?.includes('Agriculture')) {
      return {
        whoCanBenefit: 'Agro-pastoralist households, smallholder farmers, and female-headed families in semi-arid drought areas.',
        intakeStatus: 'Open for Enrollment',
        isOpen: true,
        itemsProvided: 'Certified drought-tolerant seed packages, micro-drip irrigation kits, agronomic pest management training.'
      };
    }
    if (prog.project_name?.includes('Water') || prog.project_name?.includes('WASH')) {
      return {
        whoCanBenefit: 'Households residing >2km from potable water sources, school communities, and health facilities in high-salinity zones.',
        intakeStatus: 'Open for Enrollment',
        isOpen: true,
        itemsProvided: 'Water purification Aquatabs, 20L food-grade jerricans, community solar pump access.'
      };
    }
    if (prog.project_name?.includes('Youth') || prog.project_name?.includes('Livelihoods')) {
      return {
        whoCanBenefit: 'Youth aged 18-30 seeking certified technical vocational training and micro-enterprise start-up grants.',
        intakeStatus: 'Intake Ongoing',
        isOpen: true,
        itemsProvided: 'Solar PV installation course tuition fee scholarships and start-up toolkits.'
      };
    }
    return {
      whoCanBenefit: 'Severely displaced households and flood-impacted families verified by Red Cross / County emergency committees.',
      intakeStatus: 'Emergency Response Only',
      isOpen: true,
      itemsProvided: 'Emergency mobile cash transfers, temporary shelter tarpaulins, high-protein rations.'
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-emerald-600" />
          Available ADRA Programmes & Eligibility Criteria
        </h2>
        <p className="text-xs text-slate-500">
          Explore active humanitarian projects in your region and discover who qualifies for ongoing community aid
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search programmes by name, location, or keyword..."
            className="adra-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                sectorFilter === sec
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-850 text-slate-600 hover:text-slate-900 border border-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Programme Cards */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading programmes catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="adra-card p-12 text-center text-xs text-slate-500 bg-white">
          No programmes matching your query. Try adjusting your search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(prog => {
            const eligibility = getEligibilityCriteria(prog);
            return (
              <div
                key={prog.id}
                className="adra-card p-5 bg-white border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                        {prog.project_code || 'PRJ-2025'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-100 mt-1">{prog.project_name}</h3>
                    </div>

                    <span className="badge-emerald shrink-0 text-[11px]">
                      <CheckCircle className="w-3 h-3" />
                      {eligibility.intakeStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {prog.description || 'Targeted humanitarian assistance and community empowerment program.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {prog.location || 'Kenya Country Office'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      Status: <strong className="text-slate-800 font-semibold">{prog.status}</strong>
                    </span>
                  </div>

                  {/* Who Can Benefit Box */}
                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Who Can Benefit:
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {eligibility.whoCanBenefit}
                    </p>

                    <p className="font-semibold text-slate-900 pt-1 border-t border-slate-200 flex items-center gap-1">
                      <Info className="w-3 h-3 text-slate-500" /> Assistance Provided:
                    </p>
                    <p className="text-slate-600">
                      {eligibility.itemsProvided}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApplyProgramme(prog)}
                  icon={ArrowRight}
                  className="w-full justify-center shadow-sm"
                >
                  Apply for Assistance under this Programme
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
