import { Button, SearchBar, useToast } from '@app/ui-kit';
import { api } from '@convex-api';
import { usePaginatedQuery, useQuery } from 'convex/react';
import React, { useState, useEffect } from 'react';
import {
    YStack,
    Text,
    XStack,
    H3,
    Spinner,
    ScrollView,
    styled,
    Card,
    Accordion,
    Square,
} from 'tamagui';
import { Building2, Users, ChevronDown, Edit3, Crown, AlertCircle } from '@tamagui/lucide-icons';
import { useDebounce } from '../hooks/useDebounce';
import { EditOrganizationModal } from '../components/EditOrganizationModal';

const Header = styled(YStack, {
    gap: '$3',
});

export function OrganizationsScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { showToast } = useToast();
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const allOrgs = usePaginatedQuery(
        api.organizationAdmin.listOrganizationsWithMembers,
        {},
        { initialNumItems: 50 }
    );

    const searchResults = useQuery(
        api.organizationAdmin.searchOrganizations,
        debouncedSearch ? {
            searchTerm: debouncedSearch,
            paginationOpts: { numItems: 50, cursor: null }
        } : 'skip'
    );

    useEffect(() => {
        if (searchResults === null) {
            showToast({
                variant: 'error',
                title: 'Search Error',
                message: 'Failed to search organizations. Please try again.',
            });
        }
    }, [searchResults, showToast]);

    const displayResults = debouncedSearch ? (searchResults?.page || []) : (allOrgs.results || []);
    const isLoading = allOrgs.status === 'LoadingFirstPage';

    return (
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack padding="$3" paddingBottom="$8" gap="$3">
                <Header>
                    <YStack gap="$1">
                        <H3 color="$color">Organization Management</H3>
                        <Text fontSize="$2" color="$color" opacity={0.6} fontWeight="500">
                            Manage organizations and their members
                        </Text>
                    </YStack>

                    <SearchBar
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder="Search organizations..."
                    />
                </Header>

                {isLoading ? (
                    <YStack alignItems="center" padding="$8">
                        <Spinner size="large" color="$primary" />
                        <Text marginTop="$3" color="$color" opacity={0.6}>
                            Loading organizations...
                        </Text>
                    </YStack>
                ) : null}

                {!isLoading && displayResults.length > 0 ? (
                    <Card
                        padding="$0"
                        bordered
                        backgroundColor="$background"
                        borderRadius="$3"
                        overflow="hidden"
                    >
                        <Accordion type="multiple">
                            {displayResults.map((org: any, index: number) => (
                                <Accordion.Item key={org._id} value={org._id}>
                                    <Accordion.Trigger
                                        flexDirection="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        padding="$3"
                                        borderBottomWidth={index === displayResults.length - 1 ? 0 : 1}
                                        borderColor="$borderColor"
                                        backgroundColor="$background"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        cursor="pointer"
                                    >
                                        {({ open }: { open: boolean }) => (
                                            <>
                                                <XStack gap="$3" alignItems="center" flex={1}>
                                                    <YStack
                                                        width={40}
                                                        height={40}
                                                        borderRadius="$2"
                                                        backgroundColor="$backgroundHover"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <Building2 size={20} color="$primary" />
                                                    </YStack>

                                                    <YStack flex={1} gap="$1" alignItems="flex-start">
                                                        <XStack gap="$2" alignItems="center">
                                                            <Text fontSize="$3" fontWeight="600" color="$color">
                                                                {org.name}
                                                            </Text>
                                                            {org.slug === 'core' ? (
                                                                <XStack
                                                                    backgroundColor="#16a34a"
                                                                    paddingHorizontal="$2"
                                                                    paddingVertical="$1"
                                                                    borderRadius="$2"
                                                                    alignItems="center"
                                                                    gap="$1"
                                                                >
                                                                    <Crown size={10} color="white" />
                                                                    <Text fontSize="$1" color="white" fontWeight="600" textTransform="uppercase">
                                                                        CORE
                                                                    </Text>
                                                                </XStack>
                                                            ) : null}
                                                        </XStack>
                                                        <Text fontSize="$2" color="$color" opacity={0.6}>
                                                            {org.slug}
                                                        </Text>
                                                    </YStack>

                                                    <XStack gap="$2" alignItems="center">
                                                        <Users size={14} color="#3b82f6" />
                                                        <Text fontSize="$2" color="#3b82f6" fontWeight="600">
                                                            {org.memberCount || 0} member{(org.memberCount || 0) !== 1 ? 's' : ''}
                                                        </Text>
                                                    </XStack>
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
                                            borderBottomWidth={1}
                                            borderColor="$borderColor"
                                        >
                                            <YStack gap="$3">
                                                <XStack gap="$6" flexWrap="wrap">
                                                    <YStack gap="$2" flex={1} minWidth={200}>
                                                        <Text fontSize="$1" fontWeight="600" color="$color" opacity={0.6} textTransform="uppercase" letterSpacing={0.5}>
                                                            Organization Details
                                                        </Text>
                                                        <DetailRow label="Org ID" value={org._id.slice(-12)} mono />
                                                        <DetailRow label="Slug" value={org.slug} />
                                                        <DetailRow label="Members" value={String(org.memberCount || 0)} />
                                                    </YStack>

                                                    <YStack gap="$2" flex={1} minWidth={200}>
                                                        <Text fontSize="$1" fontWeight="600" color="$color" opacity={0.6} textTransform="uppercase" letterSpacing={0.5}>
                                                            Members
                                                        </Text>
                                                        {org.members && org.members.length > 0 ? (
                                                            org.members.slice(0, 5).map((member: any) => (
                                                                <XStack key={member._id} gap="$2" alignItems="center" justifyContent="space-between">
                                                                    <XStack gap="$2" alignItems="center">
                                                                        <Users size={12} color="$color" opacity={0.5} />
                                                                        <Text fontSize="$2" color="$color">
                                                                            {member.name || member.email}
                                                                        </Text>
                                                                    </XStack>
                                                                    <Text fontSize="$1" color="$primary" fontWeight="600" textTransform="uppercase">
                                                                        {member.role}
                                                                    </Text>
                                                                </XStack>
                                                            ))
                                                        ) : (
                                                            <Text fontSize="$2" color="$color" opacity={0.5}>
                                                                No members
                                                            </Text>
                                                        )}
                                                        {org.members && org.members.length > 5 ? (
                                                            <Text fontSize="$2" color="$primary" fontWeight="600">
                                                                +{org.members.length - 5} more
                                                            </Text>
                                                        ) : null}
                                                    </YStack>
                                                </XStack>

                                                <XStack gap="$2" marginTop="$2">
                                                    <Button
                                                        size="small"
                                                        variant="secondary"
                                                        icon={<Edit3 size={14} />}
                                                        onPress={() => {
                                                            setSelectedOrg(org);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        Edit Organization
                                                    </Button>
                                                </XStack>
                                            </YStack>
                                        </Accordion.Content>
                                    </Accordion.HeightAnimator>
                                </Accordion.Item>
                            ))}
                        </Accordion>

                        {allOrgs.status === 'CanLoadMore' && !debouncedSearch ? (
                            <XStack padding="$3" justifyContent="center" borderTopWidth={1} borderColor="$borderColor">
                                <Button variant="secondary" onPress={() => allOrgs.loadMore(20)}>
                                    Load More Organizations
                                </Button>
                            </XStack>
                        ) : null}
                    </Card>
                ) : null}

                {selectedOrg && (
                    <EditOrganizationModal
                        organization={selectedOrg}
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        onSuccess={() => {
                            showToast({
                                title: 'Organization Updated',
                                message: 'Organization details have been successfully updated.',
                                variant: 'success',
                            });
                        }}
                    />
                )}

                {!isLoading && displayResults.length === 0 ? (
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
                                <Building2 size={32} color="$color" opacity={0.3} />
                            )}
                        </YStack>
                        <YStack gap="$1" alignItems="center">
                            <Text fontSize="$5" fontWeight="600" color="$color">
                                {debouncedSearch ? 'No organizations found' : 'No organizations yet'}
                            </Text>
                            <Text fontSize="$3" color="$color" opacity={0.6} textAlign="center">
                                {debouncedSearch
                                    ? `No organizations match "${debouncedSearch}"`
                                    : 'Organizations will appear here once created'}
                            </Text>
                        </YStack>
                    </YStack>
                ) : null}
            </YStack>
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
