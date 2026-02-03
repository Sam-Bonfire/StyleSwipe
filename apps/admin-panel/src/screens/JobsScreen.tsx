
import { Button } from '@app/ui-kit';
import { api } from '@convex-api';
import { ChevronDown, Clock, Package, Hash, Cpu, FileStack } from '@tamagui/lucide-icons';
import { usePaginatedQuery } from 'convex/react';
import React, { useState } from 'react';
import { YStack, Text, Card, H2, XStack, Spinner, ScrollView, ColorTokens, Accordion, Square } from 'tamagui';

import { NewJobModal } from '../components/NewJobModal';

interface ScrapeJob {
    _id: string;
    type: string;
    query: string;
    status: string;
    createdAt: number;
    updatedAt: number;
    productsFound?: number;
    errorMessage?: string;
    maxPages?: number;
    startPage?: number;
    scraperMode?: string;
}

export function JobsScreen() {
    const jobs = usePaginatedQuery(api.admin.getScrapingJobs, {}, { initialNumItems: 20 });
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <YStack gap="$4" flex={1}>
            <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                    <H2>Scraping Jobs</H2>
                    <Text fontSize="$2" color="$textSecondary">
                        Manage and monitor your data collection tasks
                    </Text>
                </YStack>
                <Button onPress={() => setModalOpen(true)}>+ New Job</Button>
            </XStack>

            <NewJobModal open={modalOpen} onClose={() => setModalOpen(false)} />

            <Card
                padding="$0"
                bordered
                backgroundColor="$background"
                flex={1}
                borderRadius="$4"
                overflow="hidden"
                elevate
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.1}
                shadowRadius={8}
            >
                {!jobs ? (
                    <YStack padding="$6" alignItems="center" justifyContent="center" flex={1}>
                        <Spinner size="large" color="$primary" />
                        <Text marginTop="$3" color="$textSecondary">Loading jobs...</Text>
                    </YStack>
                ) : jobs.results.length === 0 ? (
                    <YStack padding="$6" alignItems="center" justifyContent="center" flex={1}>
                        <FileStack size={48} color="$neutral400" />
                        <Text marginTop="$3" fontSize="$5" fontWeight="600">No jobs yet</Text>
                        <Text marginTop="$1" color="$textSecondary" textAlign="center">
                            Create your first scraping job to start collecting product data
                        </Text>
                    </YStack>
                ) : (
                    <ScrollView>
                        <Accordion type="multiple">
                            {jobs.results.map((job: ScrapeJob, index: number) => (
                                <Accordion.Item key={job._id} value={job._id}>
                                    <Accordion.Trigger
                                        flexDirection="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        padding="$4"
                                        borderBottomWidth={index === jobs.results.length - 1 ? 0 : 1}
                                        borderColor="$borderColor"
                                        backgroundColor="$background"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        cursor="pointer"
                                    >
                                        {({ open }: { open: boolean }) => (
                                            <>
                                                <YStack flex={1} gap="$2">
                                                    <XStack alignItems="center" gap="$2">
                                                        <JobTypeBadge type={job.type} />
                                                        <Text
                                                            fontWeight="600"
                                                            numberOfLines={1}
                                                            flex={1}
                                                            fontSize="$4"
                                                            userSelect="text"
                                                            cursor="text"
                                                        >
                                                            {job.query}
                                                        </Text>
                                                    </XStack>
                                                    <XStack gap="$3" alignItems="center">
                                                        <XStack gap="$1" alignItems="center">
                                                            <Clock size={12} color="$textSecondary" />
                                                            <Text fontSize="$2" color="$textSecondary">
                                                                {formatRelativeTime(job.createdAt)}
                                                            </Text>
                                                        </XStack>
                                                        {job.productsFound !== undefined && (
                                                            <XStack gap="$1" alignItems="center">
                                                                <Package size={12} color="$textSecondary" />
                                                                <Text fontSize="$2" color="$textSecondary">
                                                                    {job.productsFound} products
                                                                </Text>
                                                            </XStack>
                                                        )}
                                                        <StatusChip status={job.status} />
                                                    </XStack>
                                                </YStack>
                                                <Square
                                                    animation="quick"
                                                    rotate={open ? '180deg' : '0deg'}
                                                    marginLeft="$3"
                                                >
                                                    <ChevronDown size={20} color="$textSecondary" />
                                                </Square>
                                            </>
                                        )}
                                    </Accordion.Trigger>
                                    <Accordion.HeightAnimator animation="quick">
                                        <Accordion.Content
                                            animation="quick"
                                            paddingHorizontal="$4"
                                            paddingVertical="$3"
                                            backgroundColor="$neutral50"
                                            borderBottomWidth={1}
                                            borderColor="$borderColor"
                                        >
                                            <XStack gap="$6" flexWrap="wrap">
                                                <YStack gap="$3" flex={1} minWidth={200}>
                                                    <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase" letterSpacing={0.5}>
                                                        Job Configuration
                                                    </Text>
                                                    <DetailRow icon={<Hash size={14} color="$textSecondary" />} label="Job ID" value={job._id.slice(-12)} mono />
                                                    <DetailRow icon={<Cpu size={14} color="$textSecondary" />} label="Scraper Mode" value={job.scraperMode || 'API'} />
                                                    {job.type === 'category' && (
                                                        <>
                                                            <DetailRow label="Page Range" value={`${job.startPage || 1} - ${(job.startPage || 1) + (job.maxPages || 5) - 1}`} />
                                                        </>
                                                    )}
                                                </YStack>
                                                <YStack gap="$3" flex={1} minWidth={200}>
                                                    <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase" letterSpacing={0.5}>
                                                        Results
                                                    </Text>
                                                    <DetailRow
                                                        icon={<Package size={14} color="$textSecondary" />}
                                                        label="Products Found"
                                                        value={job.productsFound !== undefined ? String(job.productsFound) : '—'}
                                                        highlight={job.productsFound !== undefined && job.productsFound > 0}
                                                    />
                                                    <DetailRow label="Created" value={new Date(job.createdAt).toLocaleString()} />
                                                    <DetailRow label="Last Update" value={new Date(job.updatedAt).toLocaleString()} />
                                                </YStack>
                                            </XStack>
                                            {job.errorMessage && (
                                                <Card
                                                    marginTop="$3"
                                                    padding="$3"
                                                    backgroundColor="$error"
                                                    borderRadius="$2"
                                                    opacity={0.1}
                                                >
                                                    <Text fontSize="$2" fontWeight="600" color="$error">Error Details</Text>
                                                    <Text fontSize="$2" color="$error" marginTop="$1">{job.errorMessage}</Text>
                                                </Card>
                                            )}
                                        </Accordion.Content>
                                    </Accordion.HeightAnimator>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {jobs.status === "CanLoadMore" && (
                            <XStack padding="$4" justifyContent="center">
                                <Button variant="secondary" onPress={() => jobs.loadMore(10)}>
                                    Load More Jobs
                                </Button>
                            </XStack>
                        )}
                    </ScrollView>
                )}
            </Card>
        </YStack>
    )
}

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

function JobTypeBadge({ type }: { type: string }) {
    const colors: Record<string, ColorTokens> = {
        category: '$info',
        search: '$warning',
        single: '$neutral400',
    };

    return (
        <XStack
            backgroundColor={colors[type] || '$neutral400'}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
        >
            <Text fontSize="$1" fontWeight="600" color="$textInverse" textTransform="uppercase">
                {type}
            </Text>
        </XStack>
    );
}

function DetailRow({
    label,
    value,
    icon,
    mono = false,
    highlight = false
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    mono?: boolean;
    highlight?: boolean;
}) {
    return (
        <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
                {icon}
                <Text fontSize="$2" color="$textSecondary">{label}</Text>
            </XStack>
            <Text
                fontSize="$2"
                fontFamily={mono ? '$mono' : '$body'}
                fontWeight={highlight ? '600' : '400'}
                color={highlight ? '$primary' : '$textPrimary'}
            >
                {value}
            </Text>
        </XStack>
    );
}

function StatusChip({ status }: { status: string }) {
    const config: Record<string, { bg: ColorTokens; text: string }> = {
        completed: { bg: '$success', text: 'Completed' },
        processing: { bg: '$info', text: 'Running' },
        pending: { bg: '$warning', text: 'Pending' },
        failed: { bg: '$error', text: 'Failed' },
    };

    const { bg, text } = config[status] || { bg: '$neutral400', text: status };

    return (
        <XStack
            backgroundColor={bg}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            alignItems="center"
        >
            <Text fontSize="$1" fontWeight="600" color="$textInverse" textTransform="uppercase">
                {text}
            </Text>
        </XStack>
    )
}
