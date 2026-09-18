import { Button } from '@app/ui-kit';
import React, { useEffect, useState } from 'react';
import { Dialog, YStack, XStack, Input, Label, Text } from 'tamagui';
import { z } from 'zod';

export const NETWORKS = ['DIRECT', 'IMPACT', 'CJ', 'RAKUTEN', 'CUSTOM'] as const;
export type Network = (typeof NETWORKS)[number];

const TrackingParamSchema = z.object({
  key: z.string().min(1, 'Param key required'),
  value: z.string().min(1, 'Param value required'),
});

const AffiliateLinkFormSchema = z.object({
  merchantName: z.string().min(2, 'Merchant name needs at least 2 characters'),
  merchantDomain: z
    .string()
    .min(3, 'Domain required')
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Must be a bare domain like myntra.com'),
  network: z.enum(NETWORKS),
  trackingParams: z.array(TrackingParamSchema),
  isEnabled: z.boolean(),
});

export type AffiliateLinkFormValues = z.infer<typeof AffiliateLinkFormSchema>;

export interface AffiliateLinkNode {
  _id: string;
  merchantDomain: string;
  merchantName: string;
  network: Network;
  trackingParams: Array<{ key: string; value: string }>;
  isEnabled: boolean;
}

interface AffiliateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AffiliateLinkNode | null;
  onSubmit: (values: AffiliateLinkFormValues) => Promise<void>;
}

export function AffiliateLinkModal({ open, onOpenChange, initial, onSubmit }: AffiliateLinkModalProps) {
  const [merchantName, setMerchantName] = useState(initial?.merchantName ?? '');
  const [merchantDomain, setMerchantDomain] = useState(initial?.merchantDomain ?? '');
  const [network, setNetwork] = useState<Network>(initial?.network ?? 'DIRECT');
  const [params, setParams] = useState<Array<{ key: string; value: string }>>(
    initial?.trackingParams ?? [],
  );
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMerchantName(initial?.merchantName ?? '');
      setMerchantDomain(initial?.merchantDomain ?? '');
      setNetwork(initial?.network ?? 'DIRECT');
      setParams(initial?.trackingParams ?? []);
      setIsEnabled(initial?.isEnabled ?? true);
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const parsed = AffiliateLinkFormSchema.safeParse({
      merchantName: merchantName.trim(),
      merchantDomain: merchantDomain.trim().toLowerCase(),
      network,
      trackingParams: params.filter((p) => p.key.trim() || p.value.trim()),
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
      setError(e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content width={520} maxWidth="92%">
          <Dialog.Title>{initial ? 'Edit Redirect Rule' : 'New Redirect Rule'}</Dialog.Title>
          <YStack gap="$3" marginTop="$3">
            <YStack gap="$1">
              <Label>Merchant name</Label>
              <Input value={merchantName} onChangeText={setMerchantName} placeholder="e.g. Myntra" />
            </YStack>
            <YStack gap="$1">
              <Label>Merchant domain</Label>
              <Input
                value={merchantDomain}
                onChangeText={setMerchantDomain}
                placeholder="e.g. myntra.com"
                autoCapitalize="none"
              />
            </YStack>
            <YStack gap="$1">
              <Label>Network</Label>
              <XStack gap="$2" flexWrap="wrap">
                {NETWORKS.map((n) => (
                  <Button
                    key={n}
                    size="small"
                    variant={network === n ? 'primary' : 'outlined'}
                    onPress={() => setNetwork(n)}
                  >
                    {n}
                  </Button>
                ))}
              </XStack>
            </YStack>
            <YStack gap="$1">
              <Label>Tracking params</Label>
              {params.map((p, i) => (
                <XStack key={i} gap="$2">
                  <Input
                    flex={1}
                    value={p.key}
                    onChangeText={(v: string) =>
                      setParams((prev) => prev.map((row, j) => (j === i ? { ...row, key: v } : row)))
                    }
                    placeholder="key"
                    autoCapitalize="none"
                  />
                  <Input
                    flex={2}
                    value={p.value}
                    onChangeText={(v: string) =>
                      setParams((prev) => prev.map((row, j) => (j === i ? { ...row, value: v } : row)))
                    }
                    placeholder="value"
                    autoCapitalize="none"
                  />
                  <Button
                    size="small"
                    variant="ghost"
                    onPress={() => setParams((prev) => prev.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                </XStack>
              ))}
              <Button size="small" variant="outlined" onPress={() => setParams((prev) => [...prev, { key: '', value: '' }])}>
                Add Param
              </Button>
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
                {isSubmitting ? 'Saving…' : 'Save Rule'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
