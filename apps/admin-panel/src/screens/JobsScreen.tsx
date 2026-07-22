import { useScrapingJobs } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { ChevronDown, Clock, Package, Hash, Cpu, FileStack } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import {
  YStack,
  Text,
  XStack,
  Spinner,
  ScrollView,
  ColorTokens,
  Accordion,
  Square,
  H3,
} from 'tamagui';

import { NewJobModal } from '../components/NewJobModal';

// Helper Functions & Components
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
  const colors: Record<string, string> = {
    category: '$blue10', // Fixed color token
    search: '$yellow10',
    single: '$gray10',
  };

  return (
    <XStack
      backgroundColor={(colors[type] || '$gray10') as ColorTokens}
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
  highlight = false,
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
        <Text fontSize="$2" color="$textSecondary">
          {label}
        </Text>
      </XStack>
      <Text
        fontSize="$2"
        fontFamily={mono ? '$mono' : '$body'}
        fontWeight={highlight ? '600' : '400'}
        color={highlight ? '$primary' : '$color'}
      >
        {value}
      </Text>
    </XStack>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    completed: { bg: '$success', text: 'Completed' },
    processing: { bg: '$blue10', text: 'Running' },
    pending: { bg: '$yellow10', text: 'Pending' },
    failed: { bg: '$error', text: 'Failed' },
  };

  const { bg, text } = config[status] || { bg: '$gray10', text: status };

  return (
    <XStack
      backgroundColor={bg as ColorTokens}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      alignItems="center"
    >
      <Text fontSize="$1" fontWeight="600" color="$textInverse" textTransform="uppercase">
        {text}
      </Text>
    </XStack>
  );
}

// Main Component
export function JobsScreen() {
  const { results: jobs, status, loadMore } = useScrapingJobs(20);
  const [modalOpen, setModalOpen] = useState(false);

  // Loading State
  const isLoading = status === 'LoadingFirstPage';

  return (
    <YStack gap="$4" flex={1} padding="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <H3>Scraping Jobs</H3>
          <Text fontSize="$2" color="$textSecondary">
            Manage and monitor your data collection tasks
          </Text>
        </YStack>
        <Button onPress={() => setModalOpen(true)}>+ New Job</Button>
      </XStack>

      <NewJobModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <YStack
        flex={1}
        backgroundColor="$background"
        overflow="hidden"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {isLoading ? (
          <YStack padding="$6" alignItems="center" justifyContent="center" flex={1}>
            <Spinner size="large" color="$primary" />
            <Text marginTop="$3" color="$textSecondary">
              Loading jobs...
            </Text>
          </YStack>
        ) : !jobs || jobs.length === 0 ? (
          <YStack padding="$6" alignItems="center" justifyContent="center" flex={1}>
            <FileStack size={48} color="$neutral400" />
            <Text marginTop="$3" fontSize="$5" fontWeight="600">
              No jobs yet
            </Text>
            <Text marginTop="$1" color="$textSecondary" textAlign="center">
              Create your first scraping job to start collecting product data
            </Text>
          </YStack>
        ) : (
          <ScrollView>
            <Accordion type="multiple">
              {jobs.map((job) => (
                <Accordion.Item
                  key={job._id}
                  value={job._id}
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
                    padding="$4"
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
                        <Square rotate={open ? '180deg' : '0deg'} marginLeft="$3">
                          <ChevronDown size={20} color="$textSecondary" />
                        </Square>
                      </>
                    )}
                  </Accordion.Trigger>
                  <Accordion.HeightAnimator>
                    <Accordion.Content
                     
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      backgroundColor="$backgroundHover"
                    >
                      <XStack gap="$6" flexWrap="wrap">
                        <YStack gap="$3" flex={1} minWidth={200}>
                          <Text
                            fontSize="$2"
                            fontWeight="600"
                            color="$textSecondary"
                            textTransform="uppercase"
                            letterSpacing={0.5}
                          >
                            Job Configuration
                          </Text>
                          <DetailRow
                            icon={<Hash size={14} color="$textSecondary" />}
                            label="Job ID"
                            value={job._id.slice(-12)}
                            mono
                          />
                          <DetailRow
                            icon={<Cpu size={14} color="$textSecondary" />}
                            label="Scraper Mode"
                            value={job.scraperMode || 'API'}
                          />
                          {job.type === 'category' && (
                            <DetailRow
                              label="Page Range"
                              value={`${job.startPage || 1} - ${(job.startPage || 1) + (job.maxPages || 5) - 1}`}
                            />
                          )}
                        </YStack>
                        <YStack gap="$3" flex={1} minWidth={200}>
                          <Text
                            fontSize="$2"
                            fontWeight="600"
                            color="$textSecondary"
                            textTransform="uppercase"
                            letterSpacing={0.5}
                          >
                            Results
                          </Text>
                          <DetailRow
                            icon={<Package size={14} color="$textSecondary" />}
                            label="Products Found"
                            value={
                              job.productsFound !== undefined ? String(job.productsFound) : '—'
                            }
                            highlight={job.productsFound !== undefined && job.productsFound > 0}
                          />
                          <DetailRow
                            label="Created"
                            value={new Date(job.createdAt).toLocaleString()}
                          />
                          <DetailRow
                            label="Last Update"
                            value={new Date(job.updatedAt).toLocaleString()}
                          />
                        </YStack>
                      </XStack>
                      {job.errorMessage && (
                        <YStack
                          marginTop="$3"
                          padding="$3"
                          backgroundColor={"$red10" as ColorTokens}
                          borderRadius="$2"
                        >
                          <Text fontSize="$2" fontWeight="600" color="$error">
                            Error Details
                          </Text>
                          <Text fontSize="$2" color="$error" marginTop="$1">
                            {job.errorMessage}
                          </Text>
                        </YStack>
                      )}
                    </Accordion.Content>
                  </Accordion.HeightAnimator>
                </Accordion.Item>
              ))}
            </Accordion>
            {status === 'CanLoadMore' && (
              <XStack padding="$4" justifyContent="center">
                <Button variant="outlined" onPress={() => loadMore(10)}>
                  Load More Jobs
                </Button>
              </XStack>
            )}
          </ScrollView>
        )}
      </YStack>
    </YStack>
  );
}
