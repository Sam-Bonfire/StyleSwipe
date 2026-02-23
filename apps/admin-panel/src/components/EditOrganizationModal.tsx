import { useUpdateOrganization } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import React, { useState } from 'react';
import { Dialog, YStack, XStack, Text, Input, Label } from 'tamagui';

interface EditOrganizationModalProps {
    organization: {
        _id: string;
        name: string;
        slug: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditOrganizationModal({ organization, open, onOpenChange, onSuccess }: EditOrganizationModalProps) {
    const [name, setName] = useState(organization.name);
    const [slug, setSlug] = useState(organization.slug);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateOrganization = useUpdateOrganization();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await updateOrganization({
                id: organization._id,
                data: {
                    name,
                    slug,
                }
            });
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert('Failed to update organization. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Dialog.Content
                    bordered
                    elevate
                    key="content"
                    animateOnly={['transform', 'opacity']}
                    animation={[
                        'quick',
                        {
                            opacity: {
                                overshootClamping: true,
                            },
                        },
                    ]}
                    enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                    exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                    gap="$4"
                    padding="$6"
                    width={500}
                    maxWidth="90vw"
                >
                    <Dialog.Title fontSize="$6" fontWeight="600">
                        Edit Organization
                    </Dialog.Title>

                    <YStack gap="$4">
                        <YStack gap="$2">
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input
                                id="org-name"
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter organization name"
                                disabled={isSubmitting}
                            />
                        </YStack>

                        <YStack gap="$2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChangeText={setSlug}
                                placeholder="Enter organization slug"
                                disabled={isSubmitting || organization.slug === 'core'}
                            />
                            {organization.slug === 'core' && (
                                <Text fontSize="$2" color="$color" opacity={0.6}>
                                    Core organization slug cannot be changed
                                </Text>
                            )}
                        </YStack>
                    </YStack>

                    <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
                        <Dialog.Close asChild>
                            <Button variant="secondary" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            variant="primary"
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </XStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}
