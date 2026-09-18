import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { DiscoveryScreen } from '../../../src/screens/discovery/DiscoveryScreen';

export default function DiscoverRoute() {
  return (
    <ErrorBoundary>
      <DiscoveryScreen />
    </ErrorBoundary>
  );
}
