import { useCurrentUser, useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { AddressForm, type Address as FormAddress } from '@app/ui-kit/components/AddressForm';
import { ChevronLeft, Trash2, Star } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, Text, XStack, ScrollView, Separator } from 'tamagui';

export function AddressesScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const addresses = useAddresses(userId);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleCreate = async (addr: FormAddress) => {
    if (!userId) return;
    await createAddress({
      userId,
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.street,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode || addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowForm(false);
  };

  const handleUpdate = async (addr: FormAddress) => {
    if (!editingId) return;
    await updateAddress({
      addressId: editingId,
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.street,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode || addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack alignItems="center" gap="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
        <TopBarIconButton onPress={() => router.back()} backgroundColor="$background">
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
        <Text fontSize="$5" fontWeight="bold">Saved Addresses</Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          {addresses === undefined ? (
            <Text>Loading addresses...</Text>
          ) : addresses.length === 0 && !showForm ? (
            <YStack alignItems="center" gap="$3" padding="$4">
              <Text fontSize="$5" fontWeight="600">No addresses yet</Text>
              <Text color="$textSecondary" textAlign="center">Add your first delivery address (Indian pincode + state).</Text>
              <Button backgroundColor="$primary" onPress={() => setShowForm(true)}>Add Address</Button>
            </YStack>
          ) : (
            <YStack gap="$3">
              {addresses.map((addr: unknown) => {
                const a = addr as unknown as {
                  _id: string;
                  fullName: string;
                  phone: string;
                  line1: string;
                  line2?: string;
                  city: string;
                  state: string;
                  pincode: string;
                  country: string;
                  isDefault: boolean;
                };
                if (editingId === a._id) {
                  return (
                    <YStack key={a._id} backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                      <Text fontWeight="600" marginBottom="$2">Edit Address</Text>
                      <AddressForm
                        initialAddress={{
                          fullName: a.fullName,
                          street: a.line1,
                          line2: a.line2,
                          city: a.city,
                          state: a.state,
                          zipCode: a.pincode,
                          pincode: a.pincode,
                          phone: a.phone,
                          country: a.country,
                          isDefault: a.isDefault,
                        }}
                        onSubmit={handleUpdate}
                        submitLabel="Update Address"
                      />
                      <Button chromeless marginTop="$2" onPress={() => setEditingId(null)}><Text color="$textSecondary">Cancel</Text></Button>
                    </YStack>
                  );
                }
                return (
                  <YStack key={a._id} backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="600">{a.fullName}</Text>
                      {a.isDefault ? <XStack backgroundColor="$primary" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2"><Text fontSize="$1" color="white" fontWeight="700">DEFAULT</Text></XStack> : null}
                    </XStack>
                    <Text fontSize="$3" color="$textSecondary">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}</Text>
                    <Text fontSize="$2" color="$textSecondary">{a.country} • {a.phone}</Text>
                    <Separator borderColor="$borderColor" />
                    <XStack gap="$2">
                      <Button size="small" variant="outlined" onPress={() => setEditingId(a._id)}>Edit</Button>
                      <Button size="small" variant="outlined" onPress={() => deleteAddress(a._id)} icon={Trash2}>Delete</Button>
                      {!a.isDefault ? (
                        <Button size="small" backgroundColor="$primary" onPress={() => setDefault(a._id)} icon={Star}>
                          <Text color="white" fontSize="$2">Set Default</Text>
                        </Button>
                      ) : null}
                    </XStack>
                  </YStack>
                );
              })}

              {!showForm && !editingId ? (
                <Button backgroundColor="$primary" onPress={() => setShowForm(true)}>+ Add New Address</Button>
              ) : null}

              {showForm ? (
                <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                  <Text fontWeight="600" marginBottom="$2">Add Address</Text>
                  <AddressForm onSubmit={handleCreate} submitLabel="Save Address" />
                  <Button chromeless marginTop="$2" onPress={() => setShowForm(false)}><Text color="$textSecondary">Cancel</Text></Button>
                </YStack>
              ) : null}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

export default AddressesScreen;
