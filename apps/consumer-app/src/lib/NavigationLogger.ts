import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { logger } from './logger';

/**
 * Hook to log navigation state changes using Expo Router's pathname.
 * Call this in the root layout to track screen views.
 */
export function useNavigationLogger() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      previousPathname.current = pathname;
      logger.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        data: {
          route: pathname,
        },
      });
    }
  }, [pathname]);
}
