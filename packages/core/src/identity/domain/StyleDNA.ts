/**
 * StyleDNA domain (identity context).
 *
 * Dense-vector math lives in the shared kernel
 * (`shared/domain/vectors`) — re-exported here so existing
 * `identity/domain/StyleDNA` importers keep working.
 */
export type { Vector384, DisplacementConfig } from '../../../shared/domain/vectors';
import type { Vector384 } from '../../../shared/domain/vectors';
export {
  TOPIC_DIMENSIONS,
  DEFAULT_LEARNING_RATE_ALPHA,
  DEFAULT_PENALTY_RATE_BETA,
  SUPER_LIKE_MULTIPLIER,
  calculateCentroid,
  applyDisplacement,
  cosineSimilarity,
} from '../../../shared/domain/vectors';

export interface StyleDNASwipeEvent {
  id: string;
  timestamp: number;
  userId: string;
  newItemId: string;
  newItemVector: Vector384;
  action: 'like' | 'pass' | 'super';
  previousEventHash?: string;
}

// ... (WeekySummary interface can stay as is or be updated if it uses these keys)
