import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { SearchScreen } from '../../../src/screens/search/SearchScreen';

export default function SearchRoute() {
  return (
    <ErrorBoundary>
      <SearchScreen />
    </ErrorBoundary>
  );
}
