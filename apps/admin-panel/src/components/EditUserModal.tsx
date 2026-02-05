import { api } from '@app/convex';
import { Button } from '@app/ui-kit';
import { useMutation } from 'convex/react';
import React, { useState } from 'react';
import { Dialog, YStack, XStack, Input, Label } from 'tamagui';

interface EditUserModalProps {
    user: {
        _id: string;
        name: string;
        email: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditUserModal({ user, open, onOpenChange, onSuccess }: EditUserModalProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateUser = useMutation(api.organizationAdmin.updateUserDetails);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await updateUser({
                userId: user._id,
                name,
                email,
            });
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Please try again.');
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
                        Edit User
                    </Dialog.Title>

                    <YStack gap="$4">
                        <YStack gap="$2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter user name"
                                disabled={isSubmitting}
                            />
                        </YStack>

                        <YStack gap="$2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter email address"
                                disabled={isSubmitting}
                            />
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
