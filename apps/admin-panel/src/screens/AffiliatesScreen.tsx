import {
  useAffiliateLinks,
  useRedirectStats,
  useSaveAffiliateLink,
  useRemoveAffiliateLink,
} from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { ExternalLink, Pencil, Plus, Trash2 } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, H3, Separator } from 'tamagui';

import {
  AffiliateLinkModal,
  type AffiliateLinkNode,
  type AffiliateLinkFormValues,
} from '../components/AffiliateLinkModal';

export function AffiliatesScreen() {
  const links = useAffiliateLinks();
  const stats = useRedirectStats();
  const saveLink = useSaveAffiliateLink();
  const removeLink = useRemoveAffiliateLink();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateLinkNode | null>(null);

  const nodes = (links ?? []) as unknown as AffiliateLinkNode[];

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (node: AffiliateLinkNode) => {
    setEditing(node);
    setModalOpen(true);
  };

  const handleSubmit = async (values: AffiliateLinkFormValues) => {
    await saveLink({ id: editing?._id, ...values });
    showToast({
      variant: 'success',
      title: editing ? 'Rule updated' : 'Rule created',
      message: values.merchantDomain,
    });
  };

  const handleToggle = async (node: AffiliateLinkNode) => {
    try {
      await saveLink({
        id: node._id,
        merchantDomain: node.merchantDomain,
        merchantName: node.merchantName,
        network: node.network,
        trackingParams: node.trackingParams,
        isEnabled: !node.isEnabled,
      });
    } catch (e) {
      showToast({
        variant: 'error',
        title: 'Toggle failed',
        message: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  };

  const handleDelete = (node: AffiliateLinkNode) => {
    Alert.alert('Delete rule', `Stop applying tracking params for ${node.merchantDomain}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeLink(node._id);
            showToast({ variant: 'success', title: 'Rule deleted', message: node.merchantDomain });
          } catch (e) {
            showToast({
              variant: 'error',
              title: 'Delete failed',
              message: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        },
      },
    ]);
  };

  if (!links) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <YStack gap="$4" flex={1} padding="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <H3>Affiliate Redirects</H3>
        <Button size="small" variant="primary" icon={Plus} onPress={openCreate}>
          New Rule
        </Button>
      </XStack>

      <XStack gap="$3">
        <Card flex={1} padding="$3">
          <Text fontSize="$2" color="$textSecondary" textTransform="uppercase">
            Affiliate Redirects
          </Text>
          <Text fontSize="$7" fontWeight="800">
            {stats?.affiliateRedirect ?? '—'}
          </Text>
        </Card>
        <Card flex={1} padding="$3">
          <Text fontSize="$2" color="$textSecondary" textTransform="uppercase">
            Merchant Redirects
          </Text>
          <Text fontSize="$7" fontWeight="800">
            {stats?.merchantRedirect ?? '—'}
          </Text>
        </Card>
      </XStack>

      <Separator borderColor="$borderColor" />

      {nodes.length === 0 ? (
        <Card padding="$4">
          <Text color="$textSecondary">
            No redirect rules yet. Outbound links pass through unchanged until a rule is enabled.
          </Text>
        </Card>
      ) : (
        <YStack gap="$2">
          {nodes.map((node) => (
            <XStack
              key={node._id}
              alignItems="center"
              gap="$2"
              padding="$3"
              backgroundColor="$surface"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <ExternalLink size={18} color="$textSecondary" />
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600">
                  {node.merchantName}
                </Text>
                <Text fontSize="$2" color="$textSecondary">
                  {node.merchantDomain} · {node.network} · {node.trackingParams.length} param
                  {node.trackingParams.length === 1 ? '' : 's'}
                </Text>
              </YStack>
              <Button size="small" variant={node.isEnabled ? 'primary' : 'outlined'} onPress={() => handleToggle(node)}>
                {node.isEnabled ? 'On' : 'Off'}
              </Button>
              <Button size="small" variant="ghost" icon={Pencil} onPress={() => openEdit(node)}>
                Edit
              </Button>
              <Button size="small" variant="ghost" icon={Trash2} onPress={() => handleDelete(node)}>
                Delete
              </Button>
            </XStack>
          ))}
        </YStack>
      )}

      <AffiliateLinkModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </YStack>
  );
}
