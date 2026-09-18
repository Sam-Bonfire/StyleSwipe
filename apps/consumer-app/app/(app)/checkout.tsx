import { DirectShoppingGate } from '../../src/components/DirectShoppingGate';
import { CheckoutScreen } from '../../src/screens/commerce/CheckoutScreen';

export default function CheckoutRoute() {
  return (
    <DirectShoppingGate>
      <CheckoutScreen />
    </DirectShoppingGate>
  );
}
