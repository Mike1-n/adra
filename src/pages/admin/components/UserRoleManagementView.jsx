import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Power,
  Mail,
  Building,
  Key,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Users,
  Clock,
  UserX,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function UserRoleManagementView() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const toast = useToast();

  const southSudanStates = [
    'Central Equatoria',
    'Eastern Equatoria',
    'Western Equatoria',
    'Jonglei',
    'Unity',
    'Upper Nile',
    'Lakes',
    'Warrap',
    'Northern Bahr el Ghazal',
    'Western Bahr el Ghazal',
    'Administrative Areas'
  ];

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Field Worker',
    department: 'Humanitarian Operations',
    phone: '',
    avatar: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: ''
  });

  const [assignedRole, setAssignedRole] = useState('Field Worker');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, rList] = await Promise.all([
        db.getUsers(),
        db.getRoles()
      ]);
      setUsers(uList || []);
      setRoles(rList || []);
    } catch (err) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, stateFilter, itemsPerPage]);

  const handleOpenCreate = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: roles[0] || 'Field Worker',
      department: 'Field Operations',
      phone: '',
      avatar: ''
    });
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await db.createUser(formData);
      toast.success(`Account created for ${formData.full_name} (${formData.role})`);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create user.');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      department: user.department || '',
      phone: user.phone || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await db.updateUser(selectedUser.id, editFormData);
      toast.success(`Updated profile for ${editFormData.full_name}`);
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to update user.');
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setAssignedRole(user.role || 'Field Worker');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await db.updateUserRole(selectedUser.id, assignedRole);
      toast.success(`Assigned role ${assignedRole} to ${selectedUser.full_name}`);
      setIsRoleModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await db.toggleUserStatus(user.id, newStatus);
      toast.info(`Account status for ${user.full_name} changed to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to change status.');
    }
  };

  const handleVerifyUser = async (user) => {
    try {
      await db.verifyUser(user.id);
      toast.success(`Account for ${user.full_name} has been verified and activated!`);
      loadData();
    } catch (err) {
      toast.error('Failed to verify account.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await db.deleteUser(selectedUser.id);
      toast.success(`Deleted user account: ${selectedUser.full_name}`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Pending Verification'
        ? (u.status === 'Pending Verification' || u.is_active === false)
        : (u.status || 'Active') === statusFilter);
    const matchesState =
      stateFilter === 'ALL' ||
      ((u.state || '').toLowerCase() === stateFilter.toLowerCase()) ||
      ((u.location || '').toLowerCase().includes(stateFilter.toLowerCase())) ||
      ((u.department || '').toLowerCase().includes(stateFilter.toLowerCase())) ||
      ((u.assigned_area || '').toLowerCase().includes(stateFilter.toLowerCase()));

    return matchesSearch && matchesRole && matchesStatus && matchesState;
  });

  // Calculate pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const activeCount = users.filter(u => (u.status || 'Active') === 'Active' && u.is_active !== false).length;
  const pendingCount = users.filter(u => u.status === 'Pending Verification' || u.is_active === false).length;
  const deactivatedCount = users.filter(u => u.status === 'Deactivated' || u.status === 'Suspended').length;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold';
      case 'Program Manager':
        return 'bg-blue-100 text-blue-950 border-blue-400 font-bold';
      case 'Supervisor':
        return 'bg-indigo-100 text-indigo-950 border-indigo-400 font-bold';
      case 'Finance Officer':
        return 'bg-amber-100 text-amber-950 border-amber-400 font-bold';
      case 'Project Officer':
        return 'bg-cyan-100 text-cyan-950 border-cyan-400 font-bold';
      case 'Field Worker':
        return 'bg-teal-100 text-teal-950 border-teal-400 font-bold';
      case 'Supplier':
        return 'bg-purple-100 text-purple-950 border-purple-400 font-bold';
      case 'Donor':
        return 'bg-rose-100 text-rose-950 border-rose-400 font-bold';
      case 'Beneficiary':
        return 'bg-slate-200 text-slate-950 border-slate-400 font-bold';
      default:
        return 'bg-slate-200 text-slate-950 border-slate-400 font-bold';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            User & Role Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Create, view, edit, deactivate, and assign role-based access for system stakeholders.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={UserPlus}
        >
          Create User Account
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <p className="text-xl font-bold text-slate-900">{users.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Verification</p>
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deactivated</p>
            <p className="text-xl font-bold text-rose-700">{deactivatedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Query */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, phone..."
              className="adra-input pl-10 text-xs sm:text-sm w-full"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="adra-select text-xs sm:text-sm w-full"
            >
              <option value="ALL">All Roles ({roles.length})</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Location / State Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="adra-select text-xs sm:text-sm w-full font-medium"
            >
              <option value="ALL">All Locations / States</option>
              {southSudanStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adra-select text-xs sm:text-sm w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Accounts</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>

          {/* Items Per Page */}
          <div className="sm:col-span-1 lg:col-span-2">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="adra-select text-xs sm:text-sm w-full"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      {loading ? (
        <LoadingSpinner text="Retrieving registered system users..." />
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No users match your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or role/status filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User Profile</th>
                  <th className="py-3.5 px-3">System Role</th>
                  <th className="py-3.5 px-3">Department / Location</th>
                  <th className="py-3.5 px-3">Account Status</th>
                  <th className="py-3.5 px-3">Joined / Created</th>
                  <th className="py-3.5 px-3 text-right w-44 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => {
                  const isActive = (u.status || 'Active') === 'Active' && u.is_active !== false;
                  const isPending = u.status === 'Pending Verification' || u.is_active === false;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* User Profile */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar || u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={u.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {u.full_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  • <Phone className="w-2 h-2 shrink-0" />
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRoleBadgeStyle(u.role)}`}>
                          {u.role || 'Field Worker'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {u.department || 'Operations'}
                          </span>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Pending Verification
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            {u.status || (isActive ? 'Active' : 'Deactivated')}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'Default'}
                        </span>
                      </td>

                      {/* Actions (Compact & High Contrast) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isPending ? (
                            <button
                              onClick={() => handleVerifyUser(u)}
                              className="px-2 py-1 text-[11px] rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold transition flex items-center gap-1 shadow-2xs border border-emerald-700 cursor-pointer"
                              title="Verify & Activate Account"
                            >
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              Verify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRoleModal(u)}
                              className="px-2 py-1 text-[11px] rounded-md font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center gap-1 shadow-2xs border border-emerald-700 cursor-pointer"
                              title="Change System Role"
                            >
                              <Shield className="w-3 h-3 text-white" />
                              Role
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Profile"
                            className="p-1 rounded-md text-white bg-slate-700 hover:bg-slate-800 transition cursor-pointer shadow-2xs border border-slate-800"
                          >
                            <Edit2 className="w-3 h-3 text-white" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={isActive ? 'Deactivate Account' : 'Reactivate Account'}
                            className={`p-1 rounded-md text-white transition cursor-pointer shadow-2xs ${
                              isActive
                                ? 'bg-amber-600 hover:bg-amber-700 border border-amber-700'
                                : 'bg-teal-600 hover:bg-teal-700 border border-teal-700'
                            }`}
                          >
                            <Power className="w-3 h-3 text-white" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDeleteOpen(true);
                            }}
                            title="Delete User Account"
                            className="p-1 rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition cursor-pointer shadow-2xs border border-red-700"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="py-3 px-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>
              Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalItems}</span> users
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create System User Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Grace Wambui"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="g.wambui@adra.org"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="adra-input text-xs sm:text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Assigned Stakeholder Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Department / Operations Zone</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Humanitarian Operations"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Phone Number (Optional)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+211-920-000000"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Profile: ${selectedUser.full_name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="adra-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="adra-input text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Department</label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Phone</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={`Role Assignment: ${selectedUser.full_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedUser.full_name}</p>
              <p className="text-slate-500">{selectedUser.email}</p>
              <p className="text-emerald-700 font-semibold mt-1 text-[11px]">Current Role: {selectedUser.role}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Assign System Role
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                className="adra-select text-xs sm:text-sm font-medium w-full"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Assign Role
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {selectedUser && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Confirm User Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Irreversible Action</p>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  Are you sure you want to permanently delete the user account for <strong>{selectedUser.full_name}</strong> ({selectedUser.email})?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
