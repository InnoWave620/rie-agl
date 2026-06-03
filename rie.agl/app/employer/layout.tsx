import EmployerLayoutClient from '../components/layout/EmployerLayoutClient';
import { getSession } from '../lib/session';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Dashboard — RIE AGL',
};

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  // Read the real logged-in user from JWT cookie
  const session = await getSession();

  const user = session
    ? {
        firstName:      session.firstName,
        lastName:       session.lastName ?? '',
        role:           session.role,
        avatarInitials: session.avatarInitials,
      }
    : {
        firstName:      'User',
        lastName:       '',
        role:           'recruiter' as const,
        avatarInitials: '?',
      };

  return (
    <EmployerLayoutClient user={user}>
      {children}
    </EmployerLayoutClient>
  );
}
