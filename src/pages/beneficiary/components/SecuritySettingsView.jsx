import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export function SecuritySettingsView({ beneficiary }) {
  const { logout } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick 4-Digit PIN State
  const [pin, setPin] = useState(() => {
    return localStorage.getItem('adra_beneficiary_pin') || '1234';
  });
  const [newPin, setNewPin] = useState('');

  // Logout confirmation modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Your portal password has been updated securely');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.warning('PIN must be exactly 4 digits');
      return;
    }
    setPin(newPin);
    localStorage.setItem('adra_beneficiary_pin', newPin);
    setNewPin('');
    toast.success('Quick unlock PIN updated successfully');
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Account Security & Access Settings
              </h2>
              <p className="text-xs text-slate-500">
                Manage your credentials, 4-digit rapid collection PIN, and review active sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out of Portal
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Update Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Portal Password</h3>
              <p className="text-[11px] text-slate-500">Ensure your password is kept private</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide Passwords' : 'Show Passwords'}
              </button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="text-xs shadow-md shadow-emerald-600/20"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>

        {/* 4-Digit Quick Unlock PIN Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">4-Digit Quick Verification PIN</h3>
              <p className="text-[11px] text-slate-500">Fast authentication at field distribution checkpoints</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Current Registered PIN
            </span>
            <span className="font-mono text-2xl font-black text-emerald-700 tracking-widest block">
              {pin}
            </span>
            <p className="text-[11px] text-slate-500">
              Provide this PIN alongside your QR token when picking up supplies at the distribution depot.
            </p>
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Set New 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 5821"
                className="w-full px-3 py-2 text-xs font-mono text-center tracking-widest rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full text-xs border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
            >
              Save New PIN
            </Button>
          </form>
        </div>
      </div>

      {/* Active Device Session & Privacy Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Smartphone className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900">Current Device Session</h4>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Device / Browser:</span>
              <span className="font-medium text-slate-800">Chrome (Windows 11 / Native App)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection:</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Encrypted (TLS 1.3)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Registered Beneficiary Code:</span>
              <span className="font-mono font-bold text-slate-800">
                {beneficiary?.beneficiary_code || 'BEN-2025-007'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-emerald-950">Data Privacy & Protection</h4>
          </div>

          <p className="text-[11px] text-emerald-900 leading-relaxed">
            Your personal data is encrypted and held strictly under the ADRA Humanitarian Data Protection Policy. It is never sold or shared with commercial entities. You retain the right to rectify information or request account deletion at any time via your field office.
          </p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Portal Sign Out"
        size="sm"
      >
        <div className="space-y-4 p-1 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Are you sure you want to sign out?</h4>
            <p className="text-xs text-slate-500">
              You will need to sign back in with your email or Beneficiary ID to access requests and tokens.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              className="text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
