import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Shield,
  Edit2,
  Mail,
  Building,
  Key,
  CheckCircle2,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function UsersPage() {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('Project Officer');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await db.getUsers();
      setUsers(userList);
    } catch (err) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenEditRole = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setIsEditRoleOpen(true);
  };

  const handleOpenPasswordModal = (u) => {
    setSelectedUser(u);
    setNewPassword('Password123!');
    setConfirmPassword('Password123!');
    setShowPassword(false);
    setIsCopied(false);
    setIsPasswordModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = 'Adra@2026';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsResetting(true);
      await db.resetUserPassword(selectedUser.id, newPassword);
      toast.success(`Password successfully changed for ${selectedUser.full_name}`);
      setIsPasswordModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await db.updateUserRole(selectedUser.id, newRole);
      toast.success(`Updated role for ${selectedUser.full_name} to ${newRole}`);
      setIsEditRoleOpen(false);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            User Management & Access Control (RBAC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Admin console for managing user accounts, permissions, and security roles.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading system users..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {users.map((u) => (
            <Card key={u.id} className="adra-card-hover flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 truncate">
                    {u.full_name}
                  </h3>
                  <span className="badge-emerald text-[11px]">
                    <Shield className="w-3 h-3" />
                    {u.role}
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Department: <span className="text-slate-300">{u.department || 'Field Operations'}</span>
                </p>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Active Account
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPasswordModal(u)}
                      icon={Key}
                    >
                      Password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditRole(u)}
                      icon={Edit2}
                    >
                      Role
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={isEditRoleOpen}
          onClose={() => setIsEditRoleOpen(false)}
          title={`Modify Permissions: ${selectedUser.full_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-300 font-medium">{selectedUser.full_name}</p>
              <p className="text-slate-500">{selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assign System Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="adra-select text-sm font-medium"
              >
                <option value="Administrator">Administrator (Full System Access)</option>
                <option value="Project Officer">Project Officer (Projects & Field Operations)</option>
                <option value="Finance Officer">Finance Officer (Budgets & Expenditures)</option>
                <option value="M&E Officer">M&E Officer (Indicators & Logframe)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Permission
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Change Password Modal */}
      {selectedUser && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`Change Password: ${selectedUser.full_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-300 font-medium">{selectedUser.full_name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{selectedUser.email}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Password</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="adra-input text-sm font-mono pr-16"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-slate-200 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      setIsCopied(true);
                      toast.info('Password copied!');
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="p-1 hover:text-slate-200 transition cursor-pointer"
                    title="Copy password"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="adra-input text-sm font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isResetting}>
                Save Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
