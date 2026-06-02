import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';

import { PartnerSyncRepository, UserRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';
import { RecommendationService } from '../application/DiscoveryPorts';

export class RecommendationError extends Error {
    readonly _tag = 'RecommendationError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'RecommendationError';
    }
}

export const getVectorFeed = (
    userId: string,
    limit: number,
): Effect.Effect<Product[], RecommendationError | RepositoryError, RecommendationService | PartnerSyncRepository | UserRepository> => Effect.gen(function* (_) {
    const recommendations = yield* _(RecommendationService);
    const partnerSyncRepo = yield* _(PartnerSyncRepository);
    const userRepository = yield* _(UserRepository);
    
    // Check for active syncs
    const activeSyncs = yield* _(partnerSyncRepo.findActiveByUser(userId));
    
    if (activeSyncs && activeSyncs.length > 0) {
        // Fetch User's Profile
        const currentUser = yield* _(userRepository.findById(userId));
        const userVector = currentUser?.styleProfile?.preferenceVector;
        
        if (userVector) {
             const partnerVectors: number[][] = [];
             for (const sync of activeSyncs) {
                 const partnerId = sync.initiatorId === userId ? sync.partnerId : sync.initiatorId;
                 if (partnerId) {
                     const partner = yield* _(userRepository.findById(partnerId));
                     if (partner?.styleProfile?.preferenceVector) {
                         partnerVectors.push(partner.styleProfile.preferenceVector);
                     }
                 }
             }
             
             if (partnerVectors.length > 0) {
                 // Calculate Averaged Vector (Option A)
                 const blendedVector = new Array(userVector.length).fill(0);
                 
                 // Sum up all vectors including user's
                 const allVectors = [userVector, ...partnerVectors];
                 for (let i = 0; i < allVectors.length; i++) {
                     for (let j = 0; j < userVector.length; j++) {
                         blendedVector[j] += allVectors[i][j];
                     }
                 }
                 
                 // Average them
                 for (let j = 0; j < blendedVector.length; j++) {
                     blendedVector[j] /= allVectors.length;
                 }
                 
                 // Fetch feed using blended vector override
                 return yield* _(recommendations.getVectorFeed(userId, limit, blendedVector));
             }
        }
    }

    return yield* _(recommendations.getVectorFeed(userId, limit));
});

export const getCalibrationFeed = (
    userId: string,
    limit: number,
): Effect.Effect<Product[], RecommendationError | RepositoryError, RecommendationService> => Effect.gen(function* (_) {
    const recommendations = yield* _(RecommendationService);
    return yield* _(recommendations.getCalibrationFeed(userId, limit));
});
