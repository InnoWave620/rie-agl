'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import { Shield, Users, Bell, Database, Key, Plus, Edit2, Loader2, CheckCircle, Save, User, Camera, Upload, AlertCircle, ChevronDown, X } from 'lucide-react';

const SETTING_TABS = [
  { key: 'profile',       label: 'My Profile',           icon: User },
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
  avatarUrl?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  const [users, setUsers]         = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [notifs, setNotifs] = useState({
    newApplicant: true, scoring: true, hrReview: true, weeklyDigest: true,
  });
  const [retention, setRetention] = useState('365');

  // Profile Form States
  const [session, setSession] = useState<any>(null);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Invite Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'hr_manager' | 'recruiter'>('recruiter');
  const [inviteDivision, setInviteDivision] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.user) {
          const u = d.data.user;
          setSession(u);
          setProfileFirstName(u.firstName ?? '');
          setProfileLastName(u.lastName ?? '');
          setProfileEmail(u.email ?? '');
          setProfileRole(u.role ?? 'recruiter');
          setProfileAvatarUrl(u.avatarUrl ?? '');
        }
      });

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSaveError(null);
    setSaveSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setProfileAvatarUrl(data.url);
        setSaveSuccess('Profile picture uploaded successfully!');
      } else {
        setSaveError(data.error ?? 'Failed to upload profile picture.');
      }
    } catch {
      setSaveError('Network error uploading profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setSaveError('Passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileFirstName,
          lastName: profileLastName,
          email: profileEmail,
          role: profileRole,
          avatarUrl: profileAvatarUrl,
          password: profilePassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Profile updated successfully!');
        setProfilePassword('');
        setProfileConfirmPassword('');
        // Reload to update sidebar and header immediately
        window.location.reload();
      } else {
        setSaveError(data.error ?? 'Failed to update profile.');
      }
    } catch {
      setSaveError('Network error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteFullName.trim() || !inviteEmail.trim() || !invitePassword) {
      setInviteError('All fields are required');
      setInviteSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteFullName,
          email: inviteEmail,
          password: invitePassword,
          role: inviteRole,
          division: inviteDivision,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteSuccess('Team member invited successfully!');
        // Refresh the user list
        fetch('/api/users')
          .then(r => r.json())
          .then(d => { if (d.success) setUsers(d.data ?? []); });
        
        setTimeout(() => {
          setShowInviteModal(false);
        }, 1500);
      } else {
        setInviteError(data.error ?? 'Failed to invite team member.');
      }
    } catch {
      setInviteError('Network error inviting team member.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Settings" subtitle="Platform configuration and user profile settings" />

      <main className="flex-1 p-6 sm:p-8 overflow-auto bg-[#F4F6F9]">
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">

          {/* ── Sidebar ── */}
          <aside className="w-full md:w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:sticky md:top-6">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-4">Settings</p>
              <nav className="space-y-1.5">
                {SETTING_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === tab.key
                        ? 'bg-[#001CB0] text-white shadow-md shadow-[#001CB0]/20'
                        : 'text-gray-500 hover:text-[#001CB0] hover:bg-[#001CB0]/5'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* ── My Profile Settings ── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-[#0A0F24]">My Profile</h2>
                  <p className="text-sm text-gray-400 mt-1 font-medium">Manage your personal details and platform settings</p>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl text-sm font-semibold bg-red-50 text-red-800 border border-red-200">
                    <AlertCircle size={16} className="text-red-600" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group shrink-0">
                    {profileAvatarUrl ? (
                      <img
                        src={profileAvatarUrl}
                        alt="Profile avatar"
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-[#001CB0]/10"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#001CB0] to-[#0025E0] flex items-center justify-center text-white text-3xl font-black ring-4 ring-[#001CB0]/10">
                        {session?.avatarInitials ?? 'U'}
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                      <Camera size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <div className="text-sm font-bold text-[#0A0F24]">Profile Picture</div>
                    <div className="text-xs text-gray-400 font-medium">Upload a square image (PNG or JPG) up to 2MB.</div>
                    <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#001CB0] bg-[#001CB0]/10 hover:bg-[#001CB0]/20 cursor-pointer transition-all">
                        {uploading ? (
                          <>
                            <Loader2 size={12} className="animate-spin animate-infinite" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={12} />
                            Upload Photo
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {profileAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatarUrl('')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                      value={profileFirstName}
                      onChange={e => setProfileFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                      value={profileLastName}
                      onChange={e => setProfileLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="role">
                      Role at Company
                    </label>
                    <div className="relative">
                      <select
                        id="role"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all appearance-none cursor-pointer"
                        value={profileRole}
                        onChange={e => setProfileRole(e.target.value)}
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Avatar URL input */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="avatarUrl">
                    Profile Picture URL (Optional)
                  </label>
                  <input
                    id="avatarUrl"
                    type="text"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                    placeholder="https://example.com/avatar.jpg"
                    value={profileAvatarUrl}
                    onChange={e => setProfileAvatarUrl(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Or paste an external web URL linking directly to your profile image.</p>
                </div>

                {/* Password Section */}
                <div className="pt-6 border-t border-gray-100 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-[#0A0F24]">Security Settings</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Update your account login password</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="newPassword">
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                        placeholder="••••••••"
                        value={profilePassword}
                        onChange={e => setProfilePassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                        placeholder="••••••••"
                        value={profileConfirmPassword}
                        onChange={e => setProfileConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-md shadow-[#001CB0]/20 hover:shadow-[#001CB0]/30 transition-all disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Profile Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── Team Management ── */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-[#0A0F24]">Team Members</h2>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Manage HR team access to the platform</p>
                  </div>
                  <button
                    onClick={() => {
                      setInviteFullName('');
                      setInviteEmail('');
                      setInvitePassword('AGLTempPassword123!');
                      setInviteRole('recruiter');
                      setInviteDivision('Human Resources');
                      setInviteError(null);
                      setInviteSuccess(null);
                      setShowInviteModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-sm shadow-[#001CB0]/20 transition-all"
                  >
                    <Plus size={15} /> Invite Member
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
                            <th key={h} className="px-7 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-7 py-5">
                              <div className="flex items-center gap-3">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ background: user.id === currentUserId ? '#E66423' : '#001CB0' }}
                                  >
                                    {user.avatarInitials}
                                  </div>
                                )}
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
                            <td className="px-7 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleBadgeStyle(user.role)}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-7 py-5 text-sm text-gray-600 font-medium">{user.division ?? 'All Divisions'}</td>
                            <td className="px-7 py-5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-green-700 bg-green-50">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Active
                              </span>
                            </td>
                            <td className="px-7 py-5">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <h2 className="text-lg font-bold text-[#0A0F24] mb-1.5">Role-Based Access Control</h2>
                <p className="text-sm text-gray-400 font-medium mb-7">Define what each role can see and do within the platform.</p>

                <div className="space-y-5">
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
                    <div key={r.role} className={`p-6 rounded-xl border ${r.bg} ${r.border}`}>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <h2 className="text-lg font-bold text-[#0A0F24] mb-1.5">Notification Preferences</h2>
                <p className="text-sm text-gray-400 font-medium mb-7">Choose when and how you receive platform alerts.</p>

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

                <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all shadow-sm">
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            )}

            {/* ── POPIA Compliance ── */}
            {activeTab === 'compliance' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                  <h2 className="text-lg font-bold text-[#0A0F24] mb-1.5">POPIA Compliance Settings</h2>
                  <p className="text-sm text-gray-400 font-medium mb-7">Configure data retention and consent management.</p>

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

                  <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all shadow-sm">
                    <Save size={14} /> Save Compliance Settings
                  </button>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <h2 className="text-lg font-bold text-[#0A0F24] mb-1.5">Security Settings</h2>
                <p className="text-sm text-gray-400 font-medium mb-7">Platform security configuration and active protections.</p>

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
      {/* ── Invite Member Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0F24]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-150 overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-[#0A0F24] flex items-center gap-2 text-base">
                <Plus size={18} className="text-[#001CB0]" /> Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteMember}>
              <div className="px-6 py-5 space-y-4">
                {inviteError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold bg-red-50 border border-red-150 text-red-600">
                    <AlertCircle size={14} className="shrink-0" />
                    {inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold bg-green-50 border border-green-150 text-green-700">
                    <CheckCircle size={14} className="shrink-0" />
                    {inviteSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="invite-name">
                    Full Name
                  </label>
                  <input
                    id="invite-name"
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                    value={inviteFullName}
                    onChange={e => setInviteFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="invite-email">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="e.g. sarah.jenkins@agl.co.za"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="invite-password">
                    Temporary Password
                  </label>
                  <input
                    id="invite-password"
                    type="text"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all font-mono"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-505 uppercase tracking-wider mb-1.5" htmlFor="invite-role">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        id="invite-role"
                        className="w-full appearance-none px-4 py-2.5 pr-8 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all cursor-pointer"
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as any)}
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-505 uppercase tracking-wider mb-1.5" htmlFor="invite-division">
                      Division
                    </label>
                    <div className="relative">
                      <select
                        id="invite-division"
                        className="w-full appearance-none px-4 py-2.5 pr-8 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all cursor-pointer"
                        value={inviteDivision}
                        onChange={e => setInviteDivision(e.target.value)}
                      >
                        <option value="Human Resources">HR</option>
                        <option value="Logistics">Logistics</option>
                        <option value="IT & Tech">IT & Tech</option>
                        <option value="Operations">Operations</option>
                        <option value="Executive">Executive</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-150 hover:text-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-md shadow-[#001CB0]/20 transition-all disabled:opacity-50"
                >
                  {inviteSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Inviting…
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Invite Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
