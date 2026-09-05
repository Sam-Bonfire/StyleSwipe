import { DirectShoppingGate } from '../../../src/components/DirectShoppingGate';
import { OrderDetailScreen } from '../../../src/screens/profile/OrderDetailScreen';

export default function OrderDetailRoute() {
  return (
    <DirectShoppingGate>
      <OrderDetailScreen />
    </DirectShoppingGate>
  );
}
