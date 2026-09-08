import React, { useState } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function SettingsPage() {
  const { currentUser, quickSwitchRole } = useAuth();
  const toast = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const testSupabaseConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. The application is running in fully interactive Mock/Demo database mode.');
      }
      const { data, error } = await supabase.from('projects').select('id').limit(1);
      if (error) throw error;
      setConnectionStatus({ success: true, message: 'Supabase PostgreSQL connection successful and responsive!' });
      toast.success('Database connection verified!');
    } catch (err) {
      setConnectionStatus({ success: false, message: err.message });
      toast.error('Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset local mock database to default academic seed state?')) {
      localStorage.clear();
      toast.success('Local database state reset to defaults. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            System Configuration & Database Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Database connection parameters, role switching, and academic demonstration settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Status Card */}
        <Card>
          <CardHeader
            title="Database Connection State"
            subtitle="Backend PostgreSQL / Supabase integration"
          />

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    {isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Demo Data Engine'}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {isSupabaseConfigured
                      ? 'Live connection with RLS security policies enabled'
                      : 'Running reactive offline storage for presentation & defense'}
                  </p>
                </div>
              </div>

              <span className={isSupabaseConfigured ? 'badge-emerald' : 'badge-amber'}>
                {isSupabaseConfigured ? 'Connected' : 'Offline / Demo'}
              </span>
            </div>

            {connectionStatus && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${connectionStatus.success ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="leading-snug">{connectionStatus.message}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                loading={testing}
                onClick={testSupabaseConnection}
                icon={Server}
              >
                Test Connection
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemoData}
                icon={RefreshCw}
              >
                Reset Demo Data
              </Button>
            </div>
          </div>
        </Card>

        {/* Academic Defense / Presentation Guide */}
        <Card>
          <CardHeader
            title="Academic Defense Quick Reference"
            subtitle="Guidance for demonstrating system features to examiners"
          />

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Role-Based Access Control (RBAC)
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Use the top-right header or sidebar switcher to dynamically show examiners how permissions change between Administrator, Project Officer, Finance Officer, and M&E Officer.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Database Schema & RLS
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The SQL definitions with 12 normalized tables, Row Level Security policies, indexes, and triggers are located in <code className="text-emerald-300 font-mono">supabase/schema.sql</code> and <code className="text-emerald-300 font-mono">supabase/seed.sql</code>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
