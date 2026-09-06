import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';

import type { FlagEnvironment } from './useFeatureFlag';

export interface SaveFlagInput {
  id?: string;
  name: string;
  environment: FlagEnvironment;
  isEnabled: boolean;
  description?: string;
}

export function useFeatureFlags(environment: FlagEnvironment) {
  return useQuery(api.featureFlags.getByEnvironment, { environment });
}

export function useSaveFeatureFlag() {
  const create = useMutation(api.featureFlags.create);
  const update = useMutation(api.featureFlags.update);
  return async (input: SaveFlagInput) => {
    if (input.id) {
      return await update({
        id: input.id as Id<'feature_flags'>,
        name: input.name,
        environment: input.environment,
        isEnabled: input.isEnabled,
        description: input.description,
        updatedAt: Date.now(),
      });
    }
    return await create({
      name: input.name,
      environment: input.environment,
      isEnabled: input.isEnabled,
      description: input.description,
      updatedAt: Date.now(),
    });
  };
}

export function useRemoveFeatureFlag() {
  const remove = useMutation(api.featureFlags.remove);
  return async (id: string) => {
    return await remove({ id: id as Id<'feature_flags'> });
  };
}
