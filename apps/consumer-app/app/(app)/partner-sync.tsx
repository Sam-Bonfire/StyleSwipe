import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { PartnerSyncSettingsScreen } from '../../src/screens/profile/PartnerSyncSettingsScreen';

export default function PartnerSync() {
  return (
    <ErrorBoundary>
      <PartnerSyncSettingsScreen />
    </ErrorBoundary>
  );
}
