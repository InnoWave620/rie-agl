'use client';

import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebar } from './SidebarContext';

/* ─── Props ─────────────────────────────────────────── */
interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    firstName: string;
    lastName?: string;
    avatarInitials: string;
  };
}

/* ─── Helpers ───────────────────────────────────────── */
function getGreeting(hour: number): string {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/* ─── Component ─────────────────────────────────────── */
export default function Header({ title, subtitle, user }: HeaderProps) {
  const displayUser = user ?? { firstName: 'User', lastName: '', avatarInitials: 'U' };

  let toggleMobileSidebar = () => {};
  try {
    const sidebar = useSidebar();
    toggleMobileSidebar = sidebar.toggleMobileSidebar;
  } catch {
    // context not available
  }

  const hour     = new Date().getHours();
  const greeting = getGreeting(hour);

  // Greeting icon based on time
  const greetIcon =
    hour < 5  ? '🌙' :
    hour < 12 ? '☀️' :
    hour < 17 ? '⛅' :
    hour < 21 ? '🌆' :
               '🌙';

  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4',
        'bg-white border-b border-[#E2E6EF]',
        'px-6 h-16 shrink-0',
        'sticky top-0 z-40',
      )}
    >
      {/* ══════════════════════════════════
          LEFT — Page Title
          ══════════════════════════════════ */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 -ml-2 mr-1 rounded-xl text-[#535E75] hover:bg-[#F4F6F9] hover:text-[#0A0F24] transition-all md:hidden shrink-0"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        <div className="min-w-0">
          <h1 className="font-semibold text-xl text-[#0A0F24] leading-tight tracking-[-0.02em] truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#535E75] mt-0.5 leading-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT — Actions
          ══════════════════════════════════ */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Search icon button */}
        <button
          id="header-search-btn"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl',
            'text-[#535E75] bg-transparent',
            'hover:bg-[#F4F6F9] hover:text-[#0A0F24]',
            'transition-all duration-150',
          )}
          aria-label="Search"
        >
          <Search size={17} strokeWidth={2} />
        </button>

        {/* Notification bell */}
        <button
          id="header-notifications-btn"
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-xl',
            'text-[#535E75] bg-transparent',
            'hover:bg-[#F4F6F9] hover:text-[#0A0F24]',
            'transition-all duration-150',
          )}
          aria-label="Notifications"
        >
          <Bell size={17} strokeWidth={2} />
          {/* Orange dot */}
          <span
            className={cn(
              'absolute top-1.5 right-1.5',
              'w-2 h-2 rounded-full bg-[#E66423]',
              'border-2 border-white',
              'ring-0',
            )}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#E2E6EF] mx-1" />

        {/* User avatar + name + chevron */}
        <button
          id="header-user-menu-btn"
          className={cn(
            'flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl',
            'hover:bg-[#F4F6F9]',
            'transition-all duration-150 group',
          )}
          aria-label="User menu"
        >
          {/* Avatar */}
          <div
            className={cn(
              'w-[36px] h-[36px] rounded-full shrink-0',
              'flex items-center justify-center',
              'bg-gradient-to-br from-[#001CB0] to-[#0025E0]',
              'text-white text-[13px] font-bold',
              'ring-2 ring-[#001CB0]/20',
            )}
          >
            {displayUser.avatarInitials}
          </div>

          {/* Name + greeting */}
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-[13px] font-semibold text-[#0A0F24] leading-tight truncate max-w-[120px]">
              {greetIcon}&nbsp;{greeting}
            </span>
            <span className="text-[11.5px] text-[#535E75] leading-tight truncate max-w-[120px]">
              {displayUser.firstName}
              {displayUser.lastName ? ` ${displayUser.lastName}` : ''}
            </span>
          </div>

          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className="text-[#8A93AA] group-hover:text-[#535E75] transition-colors"
          />
        </button>
      </div>
    </header>
  );
}
