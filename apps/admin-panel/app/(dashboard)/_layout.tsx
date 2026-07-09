import { useCurrentUser } from '@app/infrastructure';
import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';

import { DashboardLayout } from '../../src/components/DashboardLayout';

type Page = 'overview' | 'products' | 'jobs' | 'users' | 'organizations' | 'feedback' | 'logs' | 'analytics';

/**
 * Maps URL pathname to Page type for the Sidebar active state.
 */
function pathnameToPage(pathname: string): Page {
  const segment = pathname.split('/').filter(Boolean).pop() || 'overview';
  // Handle index route
  if (segment === '(dashboard)') return 'overview';
  return (segment as Page) || 'overview';
}

export default function DashboardGroupLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();

  const activePage = pathnameToPage(pathname);

  const handleNavigate = (page: Page) => {
    if (page === 'overview') {
      router.push('/(dashboard)');
    } else {
      router.push(`/(dashboard)/${page}` as `/${string}`);
    }
  };

  return (
    <DashboardLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      isAdmin={user?.isCoreAdmin ?? false}
    >
      <Slot />
    </DashboardLayout>
  );
}
