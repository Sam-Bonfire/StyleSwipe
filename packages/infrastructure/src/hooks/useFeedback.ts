import { api } from '@app/convex';
/**
 * useFeedback — User-side feedback hooks
 * Reads wrap Convex queries; writes route through ManageFeedback use case.
 */
import { useQuery, useMutation } from 'convex/react';

/**
 * Read — fetches current user's feedback.
 */
export function useMyFeedback() {
    return useQuery(api.feedback.listByUser);
}

/**
 * Write — creates new feedback.
 */
export function useCreateFeedback() {
    return useMutation(api.feedback.create);
}

/**
 * Write — generates a file upload URL.
 */
export function useGenerateUploadUrl() {
    return useMutation(api.feedback.generateUploadUrl);
}
