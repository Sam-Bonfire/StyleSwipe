import { useState } from 'react';
import { styled, YStack, XStack, Input, Label, Text } from 'tamagui';

import { Button } from './Button';

export const INDIAN_STATES: readonly string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export interface Address {
  fullName: string;
  street: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  pincode: string;
  phone: string;
  country: string;
  isDefault: boolean;
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
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  submitLabel?: string;
  loading?: boolean;
}

function validatePincode(pincode: string): string | null {
  if (!pincode) return 'Pincode required';
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return 'Invalid pincode: 6 digits';
  return null;
}

export const AddressForm = ({ initialAddress, onSubmit, submitLabel = 'Save & Continue', loading = false }: AddressFormProps) => {
  const [formData, setFormData] = useState<Address>({
    fullName: initialAddress?.fullName ?? '',
    street: initialAddress?.street ?? '',
    line2: initialAddress?.line2 ?? '',
    city: initialAddress?.city ?? '',
    state: initialAddress?.state ?? '',
    zipCode: initialAddress?.zipCode ?? initialAddress?.pincode ?? '',
    pincode: initialAddress?.pincode ?? initialAddress?.zipCode ?? '',
    phone: initialAddress?.phone ?? '',
    country: initialAddress?.country ?? 'India',
    isDefault: initialAddress?.isDefault ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof Address, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value as never,
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors['fullName'] = 'Full name required';
    if (!formData.phone.trim()) newErrors['phone'] = 'Phone required';
    else if (!/^\+?[1-9]\d{7,14}$|^[0-9]{10}$/.test(formData.phone)) newErrors['phone'] = 'Invalid phone';
    if (!formData.street.trim()) newErrors['street'] = 'Address required';
    if (!formData.city.trim()) newErrors['city'] = 'City required';
    if (!formData.state.trim()) newErrors['state'] = 'State required';
    else if (formData.state && !INDIAN_STATES.includes(formData.state)) newErrors['state'] = 'Invalid state';
    const pin = formData.pincode || formData.zipCode;
    const pinErr = validatePincode(pin);
    if (pinErr) newErrors['pincode'] = pinErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // normalize zipCode/pincode
    const normalized: Address = {
      ...formData,
      zipCode: pin,
      pincode: pin,
    };
    onSubmit(normalized);
  };

  return (
    <FormContainer>
      <InputGroup>
        <Label htmlFor="fullname">Full Name</Label>
        <StyledInput
         
          placeholder="e.g. Sam Altman"
          value={formData.fullName}
          onChangeText={(val) => handleChange('fullName', val)}
        />
        {errors['fullName'] ? <Text fontSize="$2" color="$error">{errors['fullName']}</Text> : null}
      </InputGroup>

      <InputGroup>
        <Label htmlFor="phone">Phone Number</Label>
        <StyledInput
         
          placeholder="e.g. 9876543210"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(val) => handleChange('phone', val)}
        />
        {errors['phone'] ? <Text fontSize="$2" color="$error">{errors['phone']}</Text> : null}
      </InputGroup>

      <InputGroup>
        <Label htmlFor="street">Street Address (Line 1)</Label>
        <StyledInput
         
          placeholder="House No, Building, Street"
          value={formData.street}
          onChangeText={(val) => handleChange('street', val)}
        />
        {errors['street'] ? <Text fontSize="$2" color="$error">{errors['street']}</Text> : null}
      </InputGroup>

      <InputGroup>
        <Label htmlFor="line2">Landmark / Line 2 (Optional)</Label>
        <StyledInput
         
          placeholder="Near park, floor"
          value={formData.line2 ?? ''}
          onChangeText={(val) => handleChange('line2', val)}
        />
      </InputGroup>

      <XStack gap="$3">
        <InputGroup flex={1}>
          <Label htmlFor="city">City</Label>
          <StyledInput
           
            placeholder="City"
            value={formData.city}
            onChangeText={(val) => handleChange('city', val)}
          />
          {errors['city'] ? <Text fontSize="$2" color="$error">{errors['city']}</Text> : null}
        </InputGroup>
        <InputGroup flex={1}>
          <Label htmlFor="state">State</Label>
          <StyledInput
           
            placeholder="Maharashtra"
            value={formData.state}
            onChangeText={(val) => handleChange('state', val)}
          />
          {errors['state'] ? <Text fontSize="$2" color="$error">{errors['state']}</Text> : null}
        </InputGroup>
      </XStack>

      <XStack gap="$3">
        <InputGroup flex={1}>
          <Label htmlFor="zip">Pincode</Label>
          <StyledInput
           
            placeholder="400001"
            keyboardType="numeric"
            maxLength={6}
            value={formData.pincode}
            onChangeText={(val) => {
              handleChange('pincode', val);
              handleChange('zipCode', val);
            }}
          />
          {errors['pincode'] ? <Text fontSize="$2" color="$error">{errors['pincode']}</Text> : null}
        </InputGroup>
        <InputGroup flex={1}>
          <Label htmlFor="country">Country</Label>
          <StyledInput value={formData.country} onChangeText={(val) => handleChange('country', val)} disabled opacity={0.7} />
        </InputGroup>
      </XStack>

      {/* isDefault toggle simplified as text */}
      <XStack alignItems="center" gap="$2" marginTop="$2">
        <Button
          variant={formData.isDefault ? 'primary' : 'outlined'}
          size="small"
          onPress={() => handleChange('isDefault', !formData.isDefault)}
        >
          {formData.isDefault ? '✓ Default Address' : 'Set as Default'}
        </Button>
        <Text fontSize="$2" color="$textSecondary">Default delivery address</Text>
      </XStack>

      <Button variant="primary" size="large" marginTop="$4" fullWidth onPress={handleSubmit} disabled={loading} opacity={loading ? 0.6 : 1}>
        {submitLabel}
      </Button>
    </FormContainer>
  );
};
