import { Button } from '@app/ui-kit';
import React, { useEffect, useState } from 'react';
import { Dialog, YStack, XStack, Input, Label, Text, ScrollView } from 'tamagui';
import { z } from 'zod';

export interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  image?: string;
}

const CategoryFormSchema = z.object({
  name: z.string().min(2, 'Name needs at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug needs at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and dashes'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CategoryNode | null;
  categories: CategoryNode[];
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CategoryFormModal({ open, onOpenChange, initial, categories, onSubmit }: CategoryFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState<string | undefined>(initial?.parentId);
  const [image, setImage] = useState(initial?.image ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setSlug(initial?.slug ?? '');
      setSlugTouched(false);
      setDescription(initial?.description ?? '');
      setParentId(initial?.parentId);
      setImage(initial?.image ?? '');
      setError(null);
    }
  }, [open, initial]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const parentOptions = categories.filter((c) => c._id !== initial?._id);

  const handleSubmit = async () => {
    const parsed = CategoryFormSchema.safeParse({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      parentId,
      image: image.trim() || undefined,
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
      setError(e instanceof Error ? e.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content width={480} maxWidth="90%">
          <Dialog.Title>{initial ? 'Edit Category' : 'New Category'}</Dialog.Title>
          <YStack gap="$3" marginTop="$3">
            <YStack gap="$1">
              <Label>Name</Label>
              <Input value={name} onChangeText={handleNameChange} placeholder="e.g. Kurtas" />
            </YStack>
            <YStack gap="$1">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChangeText={(v: string) => {
                  setSlug(v);
                  setSlugTouched(true);
                }}
                placeholder="e.g. kurtas"
                autoCapitalize="none"
              />
            </YStack>
            <YStack gap="$1">
              <Label>Description (optional)</Label>
              <Input value={description} onChangeText={setDescription} placeholder="Short description" />
            </YStack>
            <YStack gap="$1">
              <Label>Image URL (optional)</Label>
              <Input value={image} onChangeText={setImage} placeholder="https://…" autoCapitalize="none" />
            </YStack>
            <YStack gap="$1">
              <Label>Parent (optional — empty means root)</Label>
              <ScrollView maxHeight={160} borderWidth={1} borderColor="$borderColor" borderRadius="$2">
                <YStack
                  padding="$2"
                  backgroundColor={!parentId ? '$backgroundHover' : undefined}
                  onPress={() => setParentId(undefined)}
                  cursor="pointer"
                >
                  <Text fontSize="$3">(None — root category)</Text>
                </YStack>
                {parentOptions.map((c) => (
                  <YStack
                    key={c._id}
                    padding="$2"
                    paddingLeft={(c.level + 1) * 12}
                    backgroundColor={parentId === c._id ? '$backgroundHover' : undefined}
                    onPress={() => setParentId(c._id)}
                    cursor="pointer"
                  >
                    <Text fontSize="$3">{c.name}</Text>
                  </YStack>
                ))}
              </ScrollView>
            </YStack>
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
                {isSubmitting ? 'Saving…' : 'Save Category'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
