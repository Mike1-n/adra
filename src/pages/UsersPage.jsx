import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Shield,
  Edit2,
  Mail,
  Building,
  Key,
  CheckCircle2,
  ShieldAlert
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('Project Officer');

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
              <img
                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={u.full_name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
              />

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

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Active Account
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditRole(u)}
                    icon={Edit2}
                  >
                    Change Role
                  </Button>
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
    </div>
  );
}
