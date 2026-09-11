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
  Filter
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
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
  const toast = useToast();

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
    avatar: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    department: ''
  });

  const [assignedRole, setAssignedRole] = useState('Field Worker');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, rList] = await Promise.all([
        db.getUsers(),
        db.getRoles()
      ]);
      setUsers(uList);
      setRoles(rList);
    } catch (err) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: roles[0] || 'Field Worker',
      department: '',
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
      full_name: user.full_name,
      email: user.email,
      department: user.department || ''
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
    setAssignedRole(user.role);
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
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Pending Verification'
        ? (u.status === 'Pending Verification' || u.is_active === false)
        : (u.status || 'Active') === statusFilter);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-emerald-50 text-emerald-800 border-emerald-500/30';
      case 'Program Manager':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Supervisor':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'Finance Officer':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'Project Officer':
        return 'bg-cyan-50 text-cyan-900 border-cyan-300';
      case 'Field Worker':
        return 'bg-teal-50 text-teal-900 border-teal-300';
      case 'Supplier':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      case 'Donor':
        return 'bg-rose-50 text-rose-900 border-rose-300';
      case 'Beneficiary':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            User & Role Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Create, view, edit, deactivate, reactivate, and assign roles for all 8 system stakeholders.
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

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="adra-input pl-10 text-xs sm:text-sm"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All System Roles ({roles.length})</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active Accounts</option>
          <option value="Pending Verification">Account Verification Pending (New)</option>
          <option value="Deactivated">Deactivated Accounts</option>
          <option value="Suspended">Suspended Accounts</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving registered system users..." />
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-800">No users match criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search or register a new user account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const isActive = (u.status || 'Active') === 'Active';
            return (
              <Card
                key={u.id}
                className="flex flex-col justify-between adra-card-hover relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.full_name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {u.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">System Role:</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getRoleBadgeStyle(u.role)}`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Department:</span>
                      <span className="text-slate-800 font-medium text-[11px] truncate max-w-[160px]">
                        {u.department || 'Operations'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Account Status:</span>
                      {u.status === 'Pending Verification' || u.is_active === false ? (
                        <span className="text-[11px] font-bold flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          Account Verification Pending
                        </span>
                      ) : (
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${isActive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          {u.status || 'Active'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="flex items-center justify-between gap-1.5 pt-3 mt-4 border-t border-slate-200">
                  {u.status === 'Pending Verification' || u.is_active === false ? (
                    <button
                      onClick={() => handleVerifyUser(u)}
                      className="px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      Verify & Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenRoleModal(u)}
                      className="px-2.5 py-1 text-xs rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-500/30 font-semibold transition cursor-pointer"
                    >
                      Change Role
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Edit Profile"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      title={isActive ? 'Deactivate Account' : 'Reactivate Account'}
                      className={`p-1.5 rounded-lg transition ${isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete User Account"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
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
                placeholder="e.g. Drought Relief Command"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
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

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Department</label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                className="adra-input text-xs sm:text-sm"
              />
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
              <p className="text-emerald-700 font-semibold mt-1 text-[11px]">Current: {selectedUser.role}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Assign System Role
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                className="adra-select text-xs sm:text-sm font-medium"
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
                  Are you sure you want to permanently delete the user account for <strong>{selectedUser.full_name}</strong> ({selectedUser.email})? This action will be audited in the security logs.
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
