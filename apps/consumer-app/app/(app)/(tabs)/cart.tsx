import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { CartScreen } from '../../../src/screens/commerce/CartScreen';

export default function CartRoute() {
  return (
    <ErrorBoundary>
      <CartScreen />
    </ErrorBoundary>
  );
}
