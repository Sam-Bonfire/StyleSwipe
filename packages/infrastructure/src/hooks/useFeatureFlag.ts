import { api } from '@app/convex';
import { useQuery } from 'convex/react';

export type FlagEnvironment = 'dev' | 'staging' | 'prod';

function currentEnvironment(): FlagEnvironment {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'dev' || raw === 'staging' || raw === 'prod') return raw;
  return 'prod';
}

/**
 * useFeatureFlag — server-driven flag. Returns undefined while loading,
 * false when the row is missing or disabled. Missing means OFF.
 */
export function useFeatureFlag(name: string): boolean | undefined {
  const flag = useQuery(api.featureFlags.getByEnvName, {
    name,
    environment: currentEnvironment(),
  });
  if (flag === undefined) return undefined;
  return flag === null ? false : flag.isEnabled;
}

/** Environment-gated flag for the direct-shopping route (checkout/orders). */
export function useDirectShoppingEnabled(): boolean | undefined {
  return useFeatureFlag('direct_shopping');
}
