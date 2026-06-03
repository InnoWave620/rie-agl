'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import { Shield, Users, Bell, Database, Key, Plus, Edit2, Loader2, CheckCircle, Save } from 'lucide-react';

const SETTING_TABS = [
  { key: 'team',          label: 'Team',                 icon: Users },
  { key: 'roles',         label: 'Roles & Permissions',  icon: Shield },
  { key: 'notifications', label: 'Notifications',         icon: Bell },
  { key: 'compliance',    label: 'POPIA & Compliance',   icon: Database },
  { key: 'security',      label: 'Security',             icon: Key },
] as const;

type SettingTab = (typeof SETTING_TABS)[number]['key'];

interface DBUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  division?: string;
  avatarInitials: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('team');
  const [users, setUsers]         = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [notifs, setNotifs] = useState({
    newApplicant: true, scoring: true, hrReview: true, weeklyDigest: true,
  });
  const [retention, setRetention] = useState('365');

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.data ?? []); })
      .finally(() => setLoadingUsers(false));
  }, []);

  // First user is treated as "you" (demo session)
  const currentUserId = users[0]?.id;

  const roleBadgeStyle = (role: string) => {
    if (role === 'admin')      return 'bg-[#E66423]/15 text-[#E66423]';
    if (role === 'hr_manager') return 'bg-[#001CB0]/10 text-[#001CB0]';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <>
      <Header title="Settings" subtitle="Platform configuration and team management" />

      <main className="flex-1 p-4 sm:p-6 overflow-auto bg-[#F4F6F9]">
        <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">

          {/* ── Sidebar ── */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 md:sticky md:top-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-3">Settings</p>
              <nav className="space-y-0.5">
                {SETTING_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === tab.key
                        ? 'bg-[#001CB0] text-white shadow-md shadow-[#001CB0]/20'
                        : 'text-gray-500 hover:text-[#001CB0] hover:bg-[#001CB0]/5'
                    }`}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* ── Team Management ── */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div>
                    <h2 className="font-bold text-[#0A0F24]">Team Members</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Manage HR team access to the platform</p>
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-sm shadow-[#001CB0]/20 transition-all">
                    <Plus size={14} /> Invite Member
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 size={24} className="animate-spin text-[#001CB0]" />
                    <span className="text-sm font-medium">Loading team members…</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/60">
                          {['Member', 'Role', 'Division', 'Status', ''].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                                  style={{ background: user.id === currentUserId ? '#E66423' : '#001CB0' }}
                                >
                                  {user.avatarInitials}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-[#0A0F24]">
                                    {user.firstName} {user.lastName}
                                    {user.id === currentUserId && (
                                      <span className="ml-2 text-[10px] font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">you</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleBadgeStyle(user.role)}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{user.division ?? 'All Divisions'}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-green-700 bg-green-50">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#001CB0] hover:bg-[#001CB0]/10 transition-all">
                                <Edit2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Roles & Permissions ── */}
            {activeTab === 'roles' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#0A0F24] mb-1">Role-Based Access Control</h2>
                <p className="text-xs text-gray-400 font-medium mb-6">Define what each role can see and do within the platform.</p>

                <div className="space-y-4">
                  {[
                    {
                      role: 'Admin',
                      color: '#E66423',
                      bg: 'bg-[#E66423]/5',
                      border: 'border-[#E66423]/20',
                      permissions: ['Full system access', 'User management', 'Audit logs', 'System configuration', 'All jobs and candidates'],
                    },
                    {
                      role: 'HR Manager',
                      color: '#001CB0',
                      bg: 'bg-[#001CB0]/5',
                      border: 'border-[#001CB0]/15',
                      permissions: ['All jobs and candidates', 'Analytics dashboard', 'Team oversight', 'Exportable reports', 'Interview invitations'],
                    },
                    {
                      role: 'Recruiter',
                      color: '#6B7280',
                      bg: 'bg-gray-50',
                      border: 'border-gray-200',
                      permissions: ['Assigned jobs only', 'Candidate profiles', 'Basic pipeline actions', 'Cannot delete or bulk actions', 'Cannot access audit logs'],
                    },
                  ].map(r => (
                    <div key={r.role} className={`p-5 rounded-xl border ${r.bg} ${r.border}`}>
                      <div className="font-bold text-sm mb-3" style={{ color: r.color }}>{r.role}</div>
                      <div className="flex flex-wrap gap-2">
                        {r.permissions.map(p => (
                          <span key={p} className="text-xs px-3 py-1 rounded-full font-medium bg-white text-gray-600 border border-gray-200 shadow-sm">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#0A0F24] mb-1">Notification Preferences</h2>
                <p className="text-xs text-gray-400 font-medium mb-6">Choose when and how you receive platform alerts.</p>

                <div className="space-y-1">
                  {[
                    { key: 'newApplicant', label: 'New Application Received', desc: 'Get notified when a candidate applies' },
                    { key: 'scoring',      label: 'AI Scoring Complete',       desc: 'Alert when CV scoring finishes' },
                    { key: 'hrReview',     label: 'HR Review Required',        desc: 'Notify for scores 70–79 needing manual review' },
                    { key: 'weeklyDigest', label: 'Weekly Pipeline Digest',    desc: 'Summary of pipeline activity every Monday' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="font-semibold text-sm text-[#0A0F24]">{item.label}</div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</div>
                      </div>
                      {/* Custom toggle */}
                      <button
                        role="switch"
                        aria-checked={notifs[item.key as keyof typeof notifs]}
                        onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifs] }))}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${
                          notifs[item.key as keyof typeof notifs] ? 'bg-[#001CB0]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                            notifs[item.key as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all shadow-sm">
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            )}

            {/* ── POPIA Compliance ── */}
            {activeTab === 'compliance' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-[#0A0F24] mb-1">POPIA Compliance Settings</h2>
                  <p className="text-xs text-gray-400 font-medium mb-6">Configure data retention and consent management.</p>

                  <div className="space-y-6">
                    {/* Data Retention */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="retention">
                        Data Retention Period (days)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="retention"
                          type="number"
                          className="w-28 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                          value={retention}
                          onChange={e => setRetention(e.target.value)}
                          min="30"
                          max="730"
                        />
                        <span className="text-sm text-gray-500 font-medium">
                          = {Math.round(parseInt(retention) / 30)} months
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium">Candidate data will be automatically deleted after this period.</p>
                    </div>

                    {/* Consent version */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">POPIA Consent Version</label>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-green-700 bg-green-50 border border-green-200">
                          <CheckCircle size={13} /> v1.0 — Active
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          All {users.length || '—'} HR users have signed
                        </span>
                      </div>
                    </div>

                    {/* Compliance badge */}
                    <div className="p-5 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 font-bold text-sm text-green-700 mb-2">
                        <CheckCircle size={16} /> 100% POPIA Compliant
                      </div>
                      <p className="text-xs text-green-600 leading-relaxed">
                        All data processing activities are logged. Consent is captured on every application.
                        Encryption is AES-256 at rest and TLS 1.3 in transit.
                      </p>
                    </div>
                  </div>

                  <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all shadow-sm">
                    <Save size={14} /> Save Compliance Settings
                  </button>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#0A0F24] mb-1">Security Settings</h2>
                <p className="text-xs text-gray-400 font-medium mb-6">Platform security configuration and active protections.</p>

                <div className="space-y-0 divide-y divide-gray-50">
                  {[
                    { label: 'JWT Access Token Expiry',  value: '15 minutes',           badge: 'Recommended', badgeColor: 'text-[#001CB0] bg-[#001CB0]/10' },
                    { label: 'JWT Refresh Token Expiry', value: '7 days',               badge: null, badgeColor: '' },
                    { label: 'Password Minimum Length',  value: '12 characters',         badge: null, badgeColor: '' },
                    { label: 'Rate Limiting',            value: '100 req/min per IP',    badge: 'Active', badgeColor: 'text-green-700 bg-green-50' },
                    { label: 'Transport Security',       value: 'TLS 1.3',              badge: 'Active', badgeColor: 'text-green-700 bg-green-50' },
                    { label: 'S3 Encryption',            value: 'SSE-KMS (AES-256)',    badge: 'Active', badgeColor: 'text-green-700 bg-green-50' },
                    { label: 'Audit Logging',            value: 'All actions logged',    badge: 'Active', badgeColor: 'text-green-700 bg-green-50' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-4">
                      <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 font-medium">{item.value}</span>
                        {item.badge && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${item.badgeColor}`}>
                            {item.badge === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
