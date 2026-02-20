import { useUsersWithOrgs, useSearchUsers } from '@app/infrastructure';
import { Button, SearchBar, useToast } from '@app/ui-kit';
import { Users, Mail, Building2, ChevronDown, Edit3, Shield, AlertCircle } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import {
    YStack,
    Text,
    XStack,
    H3,
    Spinner,
    ScrollView,
    Avatar,
    styled,
    Accordion,
    Square,
} from 'tamagui';

import { EditUserModal } from '../components/EditUserModal';
import { useDebounce } from '../hooks/useDebounce';

const Header = styled(YStack, {
    gap: '$3',
});

export function UsersScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { showToast } = useToast();
    const [selectedUser, setSelectedUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { results: users, status, loadMore } = useUsersWithOrgs(50);
    const searchResults = useSearchUsers(debouncedSearch || '');

    const displayResults = debouncedSearch ? (searchResults?.results || []) : (users || []);
    const isLoading = status === 'LoadingFirstPage';

    return (
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack padding="$3" paddingBottom="$8" gap="$3">
                <Header>
                    <YStack gap="$1">
                        <H3 color="$color">User Management</H3>
                        <Text fontSize="$2" color="$color" opacity={0.6} fontWeight="500">
                            Manage and monitor all platform users
                        </Text>
                    </YStack>

                    <SearchBar
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder="Search by name or email..."
                    />
                </Header>

                {isLoading ? (
                    <YStack alignItems="center" padding="$8">
                        <Spinner size="large" color="$primary" />
                        <Text marginTop="$3" color="$color" opacity={0.6}>
                            Loading users...
                        </Text>
                    </YStack>
                ) : null}

                {!isLoading && displayResults.length > 0 ? (
                    <YStack
                        backgroundColor="$background"
                        overflow="hidden"
                    >
                        <Accordion type="multiple">
                            {displayResults.map((user: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                <Accordion.Item
                                    key={user._id}
                                    value={user._id}
                                    marginBottom="$2"
                                    borderRadius="$4"
                                    borderWidth={1}
                                    borderColor="$borderColor"
                                    overflow="hidden"
                                    backgroundColor="$background"
                                >
                                    <Accordion.Trigger
                                        flexDirection="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        padding="$3"
                                        backgroundColor="$background"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        cursor="pointer"
                                    >
                                        {({ open }: { open: boolean }) => (
                                            <>
                                                <XStack gap="$3" alignItems="center" flex={1}>
                                                    <Avatar circular size="$4" borderWidth={1} borderColor="$borderColor">
                                                        <Avatar.Image src={user.image} />
                                                        <Avatar.Fallback backgroundColor="$primary" alignItems="center" justifyContent="center">
                                                            <Users size={20} color="white" />
                                                        </Avatar.Fallback>
                                                    </Avatar>

                                                    <YStack flex={1} gap="$1" alignItems="flex-start">
                                                        <Text fontSize="$3" fontWeight="600" color="$color">
                                                            {user.name || 'Unnamed User'}
                                                        </Text>
                                                        <XStack gap="$2" alignItems="center">
                                                            <Mail size={12} color="$color" opacity={0.5} />
                                                            <Text fontSize="$2" color="$color" opacity={0.6}>
                                                                {user.email}
                                                            </Text>
                                                        </XStack>
                                                    </YStack>

                                                    {user.organizations && user.organizations.length > 0 ? (
                                                        <XStack gap="$2" alignItems="center">
                                                            <Building2 size={14} color="$primary" />
                                                            <Text fontSize="$2" color="$primary" fontWeight="600">
                                                                {user.organizations.length} org{user.organizations.length > 1 ? 's' : ''}
                                                            </Text>
                                                        </XStack>
                                                    ) : null}
                                                </XStack>

                                                <Square animation="quick" rotate={open ? '180deg' : '0deg'} marginLeft="$2">
                                                    <ChevronDown size={18} color="$color" opacity={0.5} />
                                                </Square>
                                            </>
                                        )}
                                    </Accordion.Trigger>

                                    <Accordion.HeightAnimator animation="quick">
                                        <Accordion.Content
                                            animation="quick"
                                            paddingHorizontal="$4"
                                            paddingVertical="$3"
                                            backgroundColor="$backgroundHover"
                                        >
                                            <YStack gap="$3">
                                                <XStack gap="$6" flexWrap="wrap">
                                                    <YStack gap="$2" flex={1}>
                                                        <Text fontSize="$1" fontWeight="600" color="$color" opacity={0.6} textTransform="uppercase" letterSpacing={0.5}>
                                                            User Details
                                                        </Text>
                                                        <DetailRow label="User ID" value={user._id.slice(-12)} mono />
                                                        <DetailRow label="Email" value={user.email} />
                                                        {user.emailVerified ? (
                                                            <XStack gap="$2" alignItems="center">
                                                                <Shield size={12} color="$success" />
                                                                <Text fontSize="$2" color="$success" fontWeight="600">
                                                                    Email Verified
                                                                </Text>
                                                            </XStack>
                                                        ) : null}
                                                    </YStack>

                                                    <YStack gap="$2" flex={1} minWidth={200}>
                                                        <Text fontSize="$1" fontWeight="600" color="$color" opacity={0.6} textTransform="uppercase" letterSpacing={0.5}>
                                                            Organizations
                                                        </Text>
                                                        {user.organizations && user.organizations.length > 0 ? (
                                                            user.organizations.map((org: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                                <XStack key={org._id} gap="$2" alignItems="center" justifyContent="space-between">
                                                                    <XStack gap="$2" alignItems="center">
                                                                        <Building2 size={12} color="$color" opacity={0.5} />
                                                                        <Text fontSize="$2" color="$color">
                                                                            {org.name}
                                                                        </Text>
                                                                    </XStack>
                                                                    <Text fontSize="$1" color="$primary" fontWeight="600" textTransform="uppercase">
                                                                        {org.role}
                                                                    </Text>
                                                                </XStack>
                                                            ))
                                                        ) : (
                                                            <Text fontSize="$2" color="$color" opacity={0.5}>
                                                                No organizations
                                                            </Text>
                                                        )}
                                                    </YStack>
                                                </XStack>

                                                <XStack gap="$2" marginTop="$2">
                                                    <Button
                                                        size="small"
                                                        variant="secondary"
                                                        icon={<Edit3 size={14} />}
                                                        onPress={() => {
                                                            setSelectedUser(user);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        Edit User
                                                    </Button>
                                                </XStack>
                                            </YStack>
                                        </Accordion.Content>
                                    </Accordion.HeightAnimator>
                                </Accordion.Item>
                            ))}
                        </Accordion>

                        {status === 'CanLoadMore' && !debouncedSearch ? (
                            <XStack padding="$3" justifyContent="center" borderTopWidth={1} borderColor="$borderColor">
                                <Button variant="secondary" onPress={() => loadMore(20)}>
                                    Load More Users
                                </Button>
                            </XStack>
                        ) : null}
                    </YStack>
                ) : null}

                {!isLoading && (!displayResults || displayResults.length === 0) ? (
                    <YStack alignItems="center" padding="$8" gap="$3">
                        <YStack
                            width={64}
                            height={64}
                            borderRadius="$full"
                            backgroundColor="$backgroundHover"
                            alignItems="center"
                            justifyContent="center"
                        >
                            {debouncedSearch ? (
                                <AlertCircle size={32} color="$color" opacity={0.3} />
                            ) : (
                                <Users size={32} color="$color" opacity={0.3} />
                            )}
                        </YStack>
                        <YStack gap="$1" alignItems="center">
                            <Text fontSize="$5" fontWeight="600" color="$color">
                                {debouncedSearch ? 'No users found' : 'No users yet'}
                            </Text>
                            <Text fontSize="$3" color="$color" opacity={0.6} textAlign="center">
                                {debouncedSearch
                                    ? `No users match "${debouncedSearch}"`
                                    : 'Users will appear here once they sign up'}
                            </Text>
                        </YStack>
                    </YStack>
                ) : null}
            </YStack>

            {selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSuccess={() => {
                        showToast({
                            title: 'User Updated',
                            message: 'User details have been successfully updated.',
                            variant: 'success',
                        });
                    }}
                />
            )}
        </ScrollView>
    );
}

function DetailRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$2" color="$color" opacity={0.6}>
                {label}
            </Text>
            <Text
                fontSize="$2"
                fontFamily={mono ? '$mono' : '$body'}
                color="$color"
                fontWeight="500"
            >
                {value}
            </Text>
        </XStack>
    );
}
