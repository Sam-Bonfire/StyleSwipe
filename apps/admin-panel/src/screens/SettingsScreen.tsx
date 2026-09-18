import {
  useFeatureFlags,
  useSaveFeatureFlag,
  useRemoveFeatureFlag,
  type FlagEnvironment,
} from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { Pencil, Plus, Settings2, Trash2 } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, H3, Separator } from 'tamagui';

import { FeatureFlagModal, type FeatureFlagNode } from '../components/FeatureFlagModal';

const ENVIRONMENTS: FlagEnvironment[] = ['dev', 'staging', 'prod'];

export function SettingsScreen() {
  const [environment, setEnvironment] = useState<FlagEnvironment>('staging');
  const flags = useFeatureFlags(environment);
  const saveFlag = useSaveFeatureFlag();
  const removeFlag = useRemoveFeatureFlag();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureFlagNode | null>(null);

  const nodes = (flags ?? []) as unknown as FeatureFlagNode[];

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (node: FeatureFlagNode) => {
    setEditing(node);
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; description?: string; isEnabled: boolean }) => {
    await saveFlag({ id: editing?._id, environment, ...values });
    showToast({
      variant: 'success',
      title: editing ? 'Flag updated' : 'Flag created',
      message: `${values.name} (${environment})`,
    });
  };

  const handleToggle = async (node: FeatureFlagNode) => {
    try {
      await saveFlag({
        id: node._id,
        name: node.name,
        environment,
        description: node.description,
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

  const handleDelete = (node: FeatureFlagNode) => {
    Alert.alert('Delete flag', `Delete "${node.name}" for ${environment}? Clients fall back to OFF.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFlag(node._id);
            showToast({ variant: 'success', title: 'Flag deleted', message: node.name });
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

  return (
    <YStack gap="$4" flex={1} padding="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <H3>Settings</H3>
        <Button size="small" variant="primary" icon={Plus} onPress={openCreate}>
          New Flag
        </Button>
      </XStack>

      <XStack gap="$2" alignItems="center">
        <Settings2 size={16} color="$textSecondary" />
        {ENVIRONMENTS.map((env) => (
          <Button
            key={env}
            size="small"
            variant={environment === env ? 'primary' : 'outlined'}
            onPress={() => setEnvironment(env)}
          >
            {env}
          </Button>
        ))}
      </XStack>

      <Separator borderColor="$borderColor" />

      {flags === undefined ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      ) : nodes.length === 0 ? (
        <Card padding="$4">
          <Text color="$textSecondary">No flags for {environment} yet. Create the first one above.</Text>
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
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600">
                  {node.name}
                </Text>
                {node.description ? (
                  <Text fontSize="$2" color="$textSecondary">
                    {node.description}
                  </Text>
                ) : null}
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

      <FeatureFlagModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </YStack>
  );
}
