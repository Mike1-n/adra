import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Handshake,
  Calendar,
  Globe
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function DonorsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer', 'Finance Officer']);

  const [donors, setDonors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('donors'); // 'donors' | 'partners'
  const [search, setSearch] = useState('');

  // Modals
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [donorForm, setDonorForm] = useState({
    donor_name: '',
    contact_person: '',
    email: '',
    phone: '',
    funding_amount: '',
    funding_date: '',
  });

  const [partnerForm, setPartnerForm] = useState({
    partner_name: '',
    contact_person: '',
    email: '',
    phone: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [donorList, partnerList] = await Promise.all([
        db.getDonors(),
        db.getPartners(),
      ]);
      setDonors(donorList);
      setPartners(partnerList);
    } catch (err) {
      toast.error('Failed to load donors & partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddDonor = () => {
    setDonorForm({
      donor_name: '',
      contact_person: '',
      email: '',
      phone: '',
      funding_amount: '',
      funding_date: new Date().toISOString().split('T')[0],
    });
    setIsDonorModalOpen(true);
  };

  const handleOpenAddPartner = () => {
    setPartnerForm({
      partner_name: '',
      contact_person: '',
      email: '',
      phone: '',
      description: '',
    });
    setIsPartnerModalOpen(true);
  };

  const handleSaveDonor = async (e) => {
    e.preventDefault();
    if (!donorForm.donor_name || !donorForm.contact_person) {
      toast.warning('Please enter donor name and contact person.');
      return;
    }

    try {
      await db.createDonor({
        ...donorForm,
        funding_amount: Number(donorForm.funding_amount || 0),
      });
      toast.success('Donor agency added to registry.');
      setIsDonorModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to add donor.');
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.partner_name || !partnerForm.contact_person) {
      toast.warning('Please enter partner name and contact person.');
      return;
    }

    try {
      await db.createPartner(partnerForm);
      toast.success('Implementing partner added.');
      setIsPartnerModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to add partner.');
    }
  };

  const filteredDonors = donors.filter(d =>
    d.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPartners = partners.filter(p =>
    p.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Donor & Partner Portfolio
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage institutional partners, grant contracts, multilateral agencies, and NGO partnerships.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5">
            {activeTab === 'donors' ? (
              <Button variant="primary" onClick={handleOpenAddDonor} icon={Plus}>
                Register Donor
              </Button>
            ) : (
              <Button variant="primary" onClick={handleOpenAddPartner} icon={Plus}>
                Register Partner
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'donors'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Funding Donors ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'partners'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Implementing Partners ({partners.length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="adra-input text-xs py-2"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading stakeholder directory..." />
      ) : activeTab === 'donors' ? (
        filteredDonors.length === 0 ? (
          <EmptyState
            title="No donors found"
            description="Register a funding agency to link to projects."
            actionText={canEdit ? 'Register Donor' : undefined}
            onAction={handleOpenAddDonor}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonors.map((d) => (
              <Card key={d.id} className="adra-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {formatCurrency(d.funding_amount)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {d.donor_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contact: <span className="text-slate-200 font-medium">{d.contact_person}</span>
                  </p>

                  <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    {d.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{d.email}</span>
                      </div>
                    )}
                    {d.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{d.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Grant Contribution</span>
                  <span>{formatDate(d.funding_date)}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Partners Grid */
        filteredPartners.length === 0 ? (
          <EmptyState
            title="No partners found"
            description="Register an implementing partner or government counterpart."
            actionText={canEdit ? 'Register Partner' : undefined}
            onAction={handleOpenAddPartner}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPartners.map((p) => (
              <Card key={p.id} className="adra-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Handshake className="w-4 h-4" />
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {p.partner_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Focal Point: <span className="text-slate-200 font-medium">{p.contact_person}</span>
                  </p>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    {p.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Add Donor Modal */}
      <Modal
        isOpen={isDonorModalOpen}
        onClose={() => setIsDonorModalOpen(false)}
        title="Register Funding Donor"
      >
        <form onSubmit={handleSaveDonor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Donor / Grant Organization</label>
            <input
              type="text"
              value={donorForm.donor_name}
              onChange={(e) => setDonorForm({ ...donorForm, donor_name: e.target.value })}
              placeholder="e.g. European Commission (ECHO)"
              className="adra-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
              <input
                type="text"
                value={donorForm.contact_person}
                onChange={(e) => setDonorForm({ ...donorForm, contact_person: e.target.value })}
                placeholder="e.g. Marc Dupont"
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Commitment ($ USD)</label>
              <input
                type="number"
                value={donorForm.funding_amount}
                onChange={(e) => setDonorForm({ ...donorForm, funding_amount: e.target.value })}
                placeholder="e.g. 1500000"
                className="adra-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
              <input
                type="email"
                value={donorForm.email}
                onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                placeholder="contact@donor.org"
                className="adra-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={donorForm.phone}
                onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                placeholder="+1-202-555-0143"
                className="adra-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsDonorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Donor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Partner Modal */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title="Register Implementing Partner"
      >
        <form onSubmit={handleSavePartner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Organization Name</label>
            <input
              type="text"
              value={partnerForm.partner_name}
              onChange={(e) => setPartnerForm({ ...partnerForm, partner_name: e.target.value })}
              placeholder="e.g. Community Water & Sanitation Trust"
              className="adra-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Focal Contact Person</label>
            <input
              type="text"
              value={partnerForm.contact_person}
              onChange={(e) => setPartnerForm({ ...partnerForm, contact_person: e.target.value })}
              placeholder="e.g. Amina Hassan"
              className="adra-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={partnerForm.email}
                onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                className="adra-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={partnerForm.phone}
                onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                className="adra-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Scope of Partnership</label>
            <textarea
              value={partnerForm.description}
              onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
              placeholder="Describe technical roles, community mobilization capabilities..."
              className="adra-input min-h-[70px]"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsPartnerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Partner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
