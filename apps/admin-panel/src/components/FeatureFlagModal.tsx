import { Button } from '@app/ui-kit';
import React, { useEffect, useState } from 'react';
import { Dialog, YStack, XStack, Input, Label, Text } from 'tamagui';
import { z } from 'zod';

const FeatureFlagFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name needs at least 2 characters')
    .regex(/^[a-z0-9_.:-]+$/, 'Use lowercase letters, numbers, dots, underscores, colons, or dashes'),
  description: z.string().optional(),
  isEnabled: z.boolean(),
});

export type FeatureFlagFormValues = z.infer<typeof FeatureFlagFormSchema>;

export interface FeatureFlagNode {
  _id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
}

interface FeatureFlagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FeatureFlagNode | null;
  onSubmit: (values: FeatureFlagFormValues) => Promise<void>;
}

export function FeatureFlagModal({ open, onOpenChange, initial, onSubmit }: FeatureFlagModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setIsEnabled(initial?.isEnabled ?? false);
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const parsed = FeatureFlagFormSchema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
      isEnabled,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(parsed.data);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content width={480} maxWidth="90%">
          <Dialog.Title>{initial ? 'Edit Flag' : 'New Flag'}</Dialog.Title>
          <YStack gap="$3" marginTop="$3">
            <YStack gap="$1">
              <Label>Flag name</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="e.g. direct_shopping"
                autoCapitalize="none"
              />
            </YStack>
            <YStack gap="$1">
              <Label>Description (optional)</Label>
              <Input value={description} onChangeText={setDescription} placeholder="What does it gate?" />
            </YStack>
            <XStack gap="$2" alignItems="center">
              <Button size="small" variant={isEnabled ? 'primary' : 'outlined'} onPress={() => setIsEnabled((v) => !v)}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </XStack>
            {error ? (
              <Text color="$error" fontSize="$3">
                {error}
              </Text>
            ) : null}
            <XStack gap="$2" justifyContent="flex-end" marginTop="$2">
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Flag'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
