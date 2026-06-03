'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Nav config ───────────────────────────────────── */

const NAV_MAIN = [
  { href: '/employer',            icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/employer/jobs',       icon: Briefcase,       label: 'Jobs' },
  { href: '/employer/candidates', icon: Users,           label: 'Candidates' },
  { href: '/employer/analytics',  icon: BarChart2,       label: 'Analytics' },
];

const NAV_SETTINGS = [
  { href: '/employer/settings', icon: Settings, label: 'Settings' },
];

const NAV_LINKS = [
  { href: '/careers', icon: Globe, label: 'Public Portal', external: true },
];

/* ─── Role badge colours ───────────────────────────── */
const ROLE_COLOURS: Record<string, string> = {
  admin:         'bg-[#E66423]/20 text-[#E66423]',
  recruiter:     'bg-[#001CB0]/30 text-[#93A8FF]',
  hr_manager:    'bg-[#12A150]/20 text-[#4ADEAC]',
  hiring_manager:'bg-purple-500/20 text-purple-300',
};

/* ─── Props ────────────────────────────────────────── */
interface SidebarProps {
  user?: {
    firstName: string;
    lastName: string;
    role: string;
    avatarInitials: string;
  };
  /** Called when mobile close button is pressed */
  onClose?: () => void;
  /** Whether the mobile sidebar is open (controls X-button visibility) */
  mobileOpen?: boolean;
}

/* ─── Component ─────────────────────────────────────── */
export default function Sidebar({ user, onClose, mobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const displayUser = user ?? {
    firstName: 'User',
    lastName: '',
    role: 'recruiter',
    avatarInitials: 'U',
  };

  const roleBadge =
    ROLE_COLOURS[displayUser.role] ?? 'bg-white/10 text-white/60';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/employer';
  };

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  /* ── Width logic ── */
  const w = collapsed ? 'w-[64px]' : 'w-[256px]';

  /* ── Nav item renderer ── */
  const renderItem = (
    item: { href: string; icon: React.ElementType; label: string; exact?: boolean; external?: boolean },
    idx: number,
  ) => {
    const active = isActive(item.href, item.exact);
    const Icon   = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        target={item.external ? '_blank' : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          'nav-item group relative transition-all duration-200',
          collapsed ? 'justify-center px-0' : 'px-3',
          active
            ? 'active bg-[#001CB0]/40 text-white border-l-2 border-[#E66423] rounded-l-none rounded-r-xl pl-[10px]'
            : 'hover:bg-white/[0.07] hover:text-white/90 border-l-2 border-transparent rounded-xl',
        )}
        style={{ animationDelay: `${idx * 40}ms` }}
      >
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-colors duration-200',
            active ? 'text-white' : 'text-white/50 group-hover:text-white/80',
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-[13.5px]">{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E66423] shrink-0" />
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'sidebar flex flex-col h-screen sticky top-0 z-50 shrink-0 overflow-hidden',
        'bg-gradient-to-b from-[#0A0F24] to-[#0D1535]',
        'border-r border-white/[0.06]',
        'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        w,
      )}
    >
      {/* ── Subtle top glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-48 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, #001CB0 0%, transparent 70%)',
        }}
      />

      {/* ══════════════════════════════════════
          LOGO AREA
          ══════════════════════════════════════ */}
      <div
        className={cn(
          'relative flex items-center border-b border-white/[0.08] shrink-0',
          collapsed ? 'justify-center px-0 py-[18px]' : 'gap-2.5 px-4 py-[18px]',
        )}
        style={{ minHeight: 64 }}
      >
        {/* Mobile close button */}
        {mobileOpen && onClose && !collapsed && (
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}

        {/* Logo mark */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0',
            'bg-gradient-to-br from-[#001CB0] to-[#0025E0]',
            'shadow-[0_4px_12px_rgba(0,28,176,0.5)]',
          )}
        >
          A
        </div>

        {/* Brand text */}
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <div className="font-bold text-white text-sm leading-tight tracking-[-0.01em]">
              RIE AGL
            </div>
            <div className="text-white/40 text-[11px] leading-tight font-medium">
              Recruitment Platform
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════
          MAIN NAV
          ══════════════════════════════════════ */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {/* Section label */}
        {!collapsed && (
          <p className="section-heading mb-1">Main Menu</p>
        )}

        {NAV_MAIN.map((item, i) => renderItem(item, i))}

        <div className={cn('divider mx-2', collapsed ? 'my-3' : 'my-4')} />

        {/* Settings */}
        {!collapsed && (
          <p className="section-heading mb-1">Preferences</p>
        )}

        {NAV_SETTINGS.map((item, i) => renderItem(item, i))}

        <div className={cn('divider mx-2', collapsed ? 'my-3' : 'my-4')} />

        {/* Quick links */}
        {!collapsed && (
          <p className="section-heading mb-1">Quick Links</p>
        )}

        {NAV_LINKS.map((item, i) => renderItem(item, i))}
      </nav>

      {/* ── Expand button (collapsed only) ── */}
      {collapsed && (
        <div className="px-2 pb-2">
          <button
            onClick={() => setCollapsed(false)}
            className="nav-item w-full justify-center hover:bg-white/[0.07] rounded-xl"
            title="Expand sidebar"
          >
            <ChevronRight size={18} className="text-white/50" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          USER FOOTER
          ══════════════════════════════════════ */}
      <div
        className={cn(
          'relative border-t border-white/[0.08] shrink-0',
          collapsed ? 'px-2 py-3' : 'px-3 py-3',
        )}
      >
        {/* Subtle shine line */}
        <div
          aria-hidden
          className="absolute top-0 left-4 right-4 h-px opacity-30"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />

        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center',
                'text-white text-[13px] font-bold shrink-0',
                'bg-gradient-to-br from-[#001CB0] to-[#0025E0]',
                'ring-2 ring-white/10',
              )}
            >
              {displayUser.avatarInitials}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate leading-tight">
                {displayUser.firstName} {displayUser.lastName}
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold',
                  roleBadge,
                )}
              >
                <Sparkles size={9} />
                {displayUser.role.replace('_', ' ')}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="nav-item w-full justify-center hover:bg-white/[0.07] rounded-xl"
            title="Sign out"
          >
            <LogOut size={18} className="text-white/50" />
          </button>
        )}
      </div>
    </aside>
  );
}
