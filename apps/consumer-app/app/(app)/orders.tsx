import { DirectShoppingGate } from '../../src/components/DirectShoppingGate';
import { OrdersScreen } from '../../src/screens/profile/OrdersScreen';

export default function OrdersRoute() {
  return (
    <DirectShoppingGate>
      <OrdersScreen />
    </DirectShoppingGate>
  );
}
