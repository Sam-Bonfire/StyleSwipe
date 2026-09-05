import { DirectShoppingGate } from '../../src/components/DirectShoppingGate';
import { AddressesScreen } from '../../src/screens/profile/AddressesScreen';

export default function AddressesRoute() {
  return (
    <DirectShoppingGate>
      <AddressesScreen />
    </DirectShoppingGate>
  );
}
