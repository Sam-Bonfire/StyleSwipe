import { OutboundClickEvent, OutboundClickEventSchema } from '../domain/AffiliateRedirect';
import { Effect } from 'effect';

export const trackAffiliateRedirect = (
  clickEvent: unknown
): Effect.Effect<OutboundClickEvent, Error> => {
  return Effect.try({
    try: () => {
      return OutboundClickEventSchema.parse(clickEvent);
    },
    catch: (error) => new Error(`Invalid outbound click event: ${error}`),
  });
};
