import { useState } from 'react';
import { styled, YStack, XStack, Input, Label } from 'tamagui';

import { Button } from './Button';

export interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

const FormContainer = styled(YStack, {
  name: 'AddressFormContainer',
  gap: '$3',
});

const InputGroup = styled(YStack, {
  name: 'InputGroup',
  gap: '$1',
});

const StyledInput = styled(Input, {
  borderColor: '$borderColor',
  borderRadius: '$3',
  backgroundColor: '$surface',
  padding: '$3',
  fontSize: '$4',

  focusStyle: {
    borderColor: '$primary',
  },
});

export interface AddressFormProps {
  initialAddress?: Address;
  onSubmit: (address: Address) => void;
}

export const AddressForm = ({ initialAddress, onSubmit }: AddressFormProps) => {
  const [formData, setFormData] = useState<Address>(
    initialAddress || {
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
    },
  );

  const handleChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.zipCode) {
      // In a real app, use toast or error state
      console.warn('Please fill required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <FormContainer>
      <InputGroup>
        <Label htmlFor="fullname">Full Name</Label>
        <StyledInput
          id="fullname"
          placeholder="e.g. Sam Altman"
          value={formData.fullName}
          onChangeText={(val) => handleChange('fullName', val)}
        />
      </InputGroup>

      <InputGroup>
        <Label htmlFor="phone">Phone Number</Label>
        <StyledInput
          id="phone"
          placeholder="e.g. 555-0199"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(val) => handleChange('phone', val)}
        />
      </InputGroup>

      <InputGroup>
        <Label htmlFor="street">Street Address</Label>
        <StyledInput
          id="street"
          placeholder="House No, Building, Street"
          value={formData.street}
          onChangeText={(val) => handleChange('street', val)}
        />
      </InputGroup>

      <XStack gap="$3">
        <InputGroup flex={1}>
          <Label htmlFor="city">City</Label>
          <StyledInput
            id="city"
            placeholder="City"
            value={formData.city}
            onChangeText={(val) => handleChange('city', val)}
          />
        </InputGroup>
        <InputGroup flex={1}>
          <Label htmlFor="state">State</Label>
          <StyledInput
            id="state"
            placeholder="State"
            value={formData.state}
            onChangeText={(val) => handleChange('state', val)}
          />
        </InputGroup>
      </XStack>

      <InputGroup>
        <Label htmlFor="zip">ZIP Code</Label>
        <StyledInput
          id="zip"
          placeholder="ZIP Code"
          keyboardType="numeric"
          value={formData.zipCode}
          onChangeText={(val) => handleChange('zipCode', val)}
        />
      </InputGroup>

      <Button variant="primary" size="large" marginTop="$4" fullWidth onPress={handleSubmit}>
        Save & Continue
      </Button>
    </FormContainer>
  );
};
