import { api } from '@app/convex';
import { Button, CategoryChip } from '@app/ui-kit';
import { useMutation } from 'convex/react';
import React, { useState } from 'react';
import { Dialog, YStack, XStack, Text, Input, Label, Button as TButton } from 'tamagui';

interface NewJobModalProps {
  open: boolean;
  onClose: () => void;
}

type JobType = 'category' | 'search' | 'single';
type ScraperMode = 'API' | 'BROWSER';

export function NewJobModal({ open, onClose }: NewJobModalProps) {
  const createJob = useMutation(api.scraper.createJob);

  const [query, setQuery] = useState('');
  const [type, setType] = useState<JobType>('category');
  const [maxPages, setMaxPages] = useState('5');
  const [startPage, setStartPage] = useState('1');
  const [scraperMode, setScraperMode] = useState<ScraperMode>('API');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('URL/Query is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createJob({
        type,
        query: query.trim(),
        maxPages: parseInt(maxPages, 10) || 5,
        startPage: parseInt(startPage, 10) || 1,
        scraperMode,
      });
      // Reset form and close
      setQuery('');
      setMaxPages('5');
      setStartPage('1');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
          animation={['quick', { opacity: { overshootClamping: true } }]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width={400}
          padding="$4"
        >
          <Dialog.Title>New Scrape Job</Dialog.Title>
          <Dialog.Description size="$2" color="$textSecondary">
            Configure and submit a new scraping job.
          </Dialog.Description>

          <YStack gap="$3">
            {/* URL/Query Input */}
            <YStack gap="$1">
              <Label htmlFor="query">URL / Query *</Label>
              <Input
                id="query"
                placeholder="https://www.myntra.com/men-casual-shirts"
                value={query}
                onChangeText={setQuery}
              />
            </YStack>

            {/* Job Type */}
            <YStack gap="$1">
              <Label>Job Type</Label>
              <XStack gap="$2">
                {(['category', 'search', 'single'] as JobType[]).map((t) => (
                  <CategoryChip
                    key={t}
                    label={t}
                    selected={type === t}
                    onToggle={() => setType(t)}
                    size="medium"
                  />
                ))}
              </XStack>
            </YStack>

            {/* Scraper Mode Toggle */}
            <YStack gap="$1">
              <Label>Scraper Mode</Label>
              <XStack gap="$2">
                <CategoryChip
                  label="API (Fast)"
                  selected={scraperMode === 'API'}
                  onToggle={() => setScraperMode('API')}
                  size="medium"
                />
                <CategoryChip
                  label="Browser"
                  selected={scraperMode === 'BROWSER'}
                  onToggle={() => setScraperMode('BROWSER')}
                  size="medium"
                />
              </XStack>
            </YStack>

            {/* Pagination Options */}
            {type === 'category' && (
              <XStack gap="$3">
                <YStack gap="$1" flex={1}>
                  <Label htmlFor="startPage">Start Page</Label>
                  <Input
                    id="startPage"
                    keyboardType="numeric"
                    value={startPage}
                    onChangeText={setStartPage}
                  />
                </YStack>
                <YStack gap="$1" flex={1}>
                  <Label htmlFor="maxPages">Max Pages</Label>
                  <Input
                    id="maxPages"
                    keyboardType="numeric"
                    value={maxPages}
                    onChangeText={setMaxPages}
                  />
                </YStack>
              </XStack>
            )}

            {/* Error Message */}
            {error && (
              <Text color="$error" fontSize="$2">
                {error}
              </Text>
            )}
          </YStack>

          {/* Actions */}
          <XStack gap="$3" justifyContent="flex-end">
            <Dialog.Close displayWhenAdapted asChild>
              <TButton chromeless onPress={onClose}>
                Cancel
              </TButton>
            </Dialog.Close>
            <Button onPress={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
