'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Menu, UserPlus, Award, Calendar, BellOff } from 'lucide-react';
import { cn, formatRelativeTime } from '../../lib/utils';
import { useSidebar } from './SidebarContext';

/* ─── Props ─────────────────────────────────────────── */
interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    firstName: string;
    lastName?: string;
    avatarInitials: string;
    avatarUrl?: string;
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
  const [currentUser, setCurrentUser] = useState<any>(user);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.user) {
          setCurrentUser(d.data.user);
        }
      })
      .catch((err) => console.error('Error fetching user in Header:', err));
  }, [user]);

  const displayUser = currentUser ?? { firstName: 'User', lastName: '', avatarInitials: 'U' };

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string;
    type: 'application' | 'score' | 'interview';
    title: string;
    description: string;
    createdAt: string;
    link: string;
    unread: boolean;
  }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/applications?limit=6')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const lastRead = localStorage.getItem('notifications_last_read');
          const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;

          const list = data.data.map((app: any) => {
            const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
            const jobTitle = app.jobTitle;
            let type: 'application' | 'score' | 'interview' = 'application';
            let title = 'New Application';
            let description = `${candidateName} applied for ${jobTitle}`;

            if (app.status === 'interview_invited') {
              type = 'interview';
              title = 'Interview Shortlist';
              description = `${candidateName} has been shortlisted for ${jobTitle}`;
            } else if (app.atsScore != null) {
              type = 'score';
              title = 'CV Automatically Scored';
              description = `${candidateName} scored ${app.atsScore.toFixed(0)}% for ${jobTitle}`;
            }

            const isUnread = new Date(app.createdAt).getTime() > lastReadTime;

            return {
              id: app.id,
              type,
              title,
              description,
              createdAt: app.createdAt,
              link: `/employer/candidates/${app.candidateId}?appId=${app.id}`,
              unread: isUnread,
            };
          });

          setNotifications(list);

          // Calculate unread count
          const unreads = list.filter(
            (n: any) => new Date(n.createdAt).getTime() > lastReadTime
          ).length;
          setUnreadCount(unreads);
        }
      })
      .catch((err) => console.error('Error fetching notifications:', err));
  }, []);

  // Close notifications dropdown on clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const close = () => setShowNotifications(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showNotifications]);

  let toggleMobileSidebar = () => {};
  try {
    const sidebar = useSidebar();
    toggleMobileSidebar = sidebar.toggleMobileSidebar;
  } catch {
    // context not available
  }

  const hour     = new Date().getHours();
  const greeting = getGreeting(hour);



  return (
    <header
      className={cn(
        'bg-white border-b border-[#E2E6EF]',
        'px-6 h-16 shrink-0',
        'sticky top-0 z-40',
      )}
    >
      <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-4 h-full">
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
          <div className="relative">
            <button
              id="header-notifications-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  localStorage.setItem('notifications_last_read', new Date().toISOString());
                  setUnreadCount(0);
                  // Mark locally as read
                  setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                }
              }}
              className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-xl',
                'text-[#535E75] bg-transparent',
                'hover:bg-[#F4F6F9] hover:text-[#0A0F24]',
                'transition-all duration-150',
              )}
              aria-label="Notifications"
            >
              <Bell size={17} strokeWidth={2} />
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5',
                    'w-2 h-2 rounded-full bg-[#E66423]',
                    'border-2 border-white',
                    'ring-0',
                  )}
                />
              )}
            </button>

            {/* Dropdown panel */}
            {showNotifications && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E6EF] rounded-2xl shadow-xl z-50 overflow-hidden text-left animate-scale-in"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E6EF]">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#0A0F24]">Recent Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E66423]/10 text-[#E66423]">
                      New
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-auto divide-y divide-[#F4F6F9]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-[#535E75]">
                      <BellOff size={24} className="opacity-40 mb-2" />
                      <span className="text-xs font-semibold">No recent alerts</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => setShowNotifications(false)}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-[#F8FAFC] transition-colors",
                          n.unread && "bg-[#001CB0]/5 hover:bg-[#001CB0]/8"
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                            n.type === 'interview'
                              ? 'bg-green-50 text-green-600'
                              : n.type === 'score'
                              ? 'bg-blue-50 text-[#001CB0]'
                              : 'bg-orange-50 text-[#E66423]',
                          )}
                        >
                          {n.type === 'interview' ? (
                            <Calendar size={13} />
                          ) : n.type === 'score' ? (
                            <Award size={13} />
                          ) : (
                            <UserPlus size={13} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-[#0A0F24] block">{n.title}</span>
                          <span className="text-[11px] text-[#535E75] block mt-0.5 leading-normal truncate-2-lines">
                            {n.description}
                          </span>
                          <span className="text-[9.5px] text-[#8A93AA] block mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  href="/employer/candidates"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-center justify-center py-2.5 bg-[#F8FAFC] hover:bg-[#EEF2F6] border-t border-[#E2E6EF] text-[11px] font-bold text-[#001CB0] transition-colors"
                >
                  View All Candidates →
                </Link>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#E2E6EF] mx-1" />

          {/* User avatar + name + chevron */}
          <button
            id="header-user-menu-btn"
            title={`${greeting}, ${displayUser.firstName} ${displayUser.lastName || ''}`.trim()}
            className={cn(
              'flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl',
              'hover:bg-[#F4F6F9]',
              'transition-all duration-150 group',
            )}
            aria-label="User menu"
          >
            {/* Avatar */}
            {displayUser.avatarUrl ? (
              <img
                src={displayUser.avatarUrl}
                alt={`${displayUser.firstName} ${displayUser.lastName}`}
                className="w-[36px] h-[36px] rounded-full object-cover shrink-0 ring-2 ring-[#001CB0]/20"
              />
            ) : (
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
            )}

            {/* Name + greeting */}
            <div className="hidden md:flex flex-col items-start min-w-0">
              <span className="text-[13px] font-semibold text-[#0A0F24] leading-tight truncate max-w-[160px]">
                {greeting}, {displayUser.firstName}
              </span>
              <span className="text-[11.5px] text-[#535E75] leading-tight truncate max-w-[160px]">
                {displayUser.firstName} {displayUser.lastName || ''}
              </span>
            </div>

            <ChevronDown
              size={14}
              strokeWidth={2.5}
              className="text-[#8A93AA] group-hover:text-[#535E75] transition-colors"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
