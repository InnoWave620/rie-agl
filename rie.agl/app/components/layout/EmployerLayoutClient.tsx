'use client';

import { SidebarProvider, useSidebar } from './SidebarContext';
import Sidebar from './Sidebar';

interface Props {
  user: {
    firstName: string;
    lastName: string;
    role: string;
    avatarInitials: string;
  };
  children: React.ReactNode;
}

function LayoutContent({ user, children }: Props) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#F4F6F9] overflow-x-hidden">
      {/* Sidebar Container */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
            style={{ width: '100vw', height: '100vh' }}
          />
        )}
        
        {/* Sidebar Component */}
        <Sidebar
          user={user}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}

export default function EmployerLayoutClient({ user, children }: Props) {
  return (
    <SidebarProvider>
      <LayoutContent user={user}>{children}</LayoutContent>
    </SidebarProvider>
  );
}
