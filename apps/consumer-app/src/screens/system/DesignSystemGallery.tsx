/**
 * DesignSystemGallery Screen
 *
 * Displays all tokens and components from the UI-kit for visual verification
 * Purpose: Verify visual consistency across Windows/Linux environments
 */

import {
  config,
  Button,
  FashionCard,
  CategoryChip,
  ProductTile,
  NavigationBar,
  TopBar,
  GridSelection,
  BudgetSlider,
  FitPreferenceButtons,
  SizeChipGroup,
  DEFAULT_BUDGET_BANDS,
  DEFAULT_FIT_GROUPS,
  DEFAULT_SIZE_FIELDS,
} from '@app/ui-kit';
import { Home, Search, Grid, User } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import {
  TamaguiProvider,
  Theme,
  YStack,
  XStack,
  Text,
  Stack,
  ScrollView,
  H1,
  H2,
  H3,
  Separator,
} from 'tamagui';

// Section wrapper component
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <YStack gap="$2" marginBottom="$4">
    <H2 fontSize="$7" fontWeight="700" color="$textPrimary">
      {title}
    </H2>
    <Separator borderColor="$borderColor" />
    <YStack gap="$3" paddingTop="$2">
      {children}
    </YStack>
  </YStack>
);

// Color swatch component
const ColorSwatch = ({ name, color }: { name: string; color: string }) => (
  <YStack alignItems="center" gap="$1" width={80}>
    <Stack
      width={48}
      height={48}
      borderRadius="$2"

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backgroundColor={color as any}
      borderWidth={1}
      borderColor="$borderColor"
    />
    <Text fontSize="$2" color="$textSecondary" textAlign="center">
      {name}
    </Text>
    <Text fontSize="$1" color="$textTertiary">
      {color}
    </Text>
  </YStack>
);

// Spacing visualizer
const SpacingSwatch = ({ name, size }: { name: string; size: number }) => (
  <XStack alignItems="center" gap="$2" marginBottom="$1">
    <Text fontSize="$3" color="$textSecondary" width={60}>
      {name}
    </Text>
    <Stack height={16} width={size} backgroundColor="$primary" borderRadius="$1" />
    <Text fontSize="$2" color="$textTertiary">
      {size}px
    </Text>
  </XStack>
);

export function DesignSystemGallery() {
  // Demo state for interactive components
  const [selectedChips, setSelectedChips] = useState<string[]>(['casual']);
  const [gridSelection, setGridSelection] = useState<string[]>([]);
  const [budgetBand, setBudgetBand] = useState<string | null>('budget_2');
  const [fitPreferences, setFitPreferences] = useState<Record<string, string[]>>({
    tops: ['regular'],
    bottoms: ['slim'],
    rise: ['mid'],
  });
  const [sizeSelections, setSizeSelections] = useState<Record<string, string[]>>({
    top_size: ['m'],
    bottom_waist: ['32'],
    shoe_size: ['9'],
  });
  const [activeNav, setActiveNav] = useState('home');
  const [wishlist, setWishlist] = useState(false);

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <Home size={22} color="$textSecondary" />,
      activeIcon: <Home size={22} color="$primary" />,
    },
    {
      key: 'discover',
      label: 'Discover',
      icon: <Search size={22} color="$textSecondary" />,
      activeIcon: <Search size={22} color="$primary" />,
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: <Grid size={22} color="$textSecondary" />,
      activeIcon: <Grid size={22} color="$primary" />,
    },
    {
      key: 'account',
      label: 'Account',
      icon: <User size={22} color="$textSecondary" />,
      activeIcon: <User size={22} color="$primary" />,
    },
  ];

  const demoGridItems = [
    { id: '1', imageUrl: 'https://picsum.photos/200/240?random=1', label: 'Minimal' },
    { id: '2', imageUrl: 'https://picsum.photos/200/240?random=2', label: 'Streetwear' },
    { id: '3', imageUrl: 'https://picsum.photos/200/240?random=3', label: 'Casual' },
    { id: '4', imageUrl: 'https://picsum.photos/200/240?random=4', label: 'Formal' },
    { id: '5', imageUrl: 'https://picsum.photos/200/240?random=5', label: 'Ethnic' },
    { id: '6', imageUrl: 'https://picsum.photos/200/240?random=6', label: 'Athleisure' },
  ];

  return (
    <TamaguiProvider config={config}>
      <Theme name="BrandIdentityLight">
        <YStack flex={1} backgroundColor="$background">
          {/* Top Bar Demo */}
          <TopBar addressValue="Koramangala, 560034" wishlistCount={3} cartCount={2} />

          <ScrollView flex={1}>
            <YStack padding="$3" gap="$4">
              <H1 fontSize="$9" fontWeight="700" color="$textPrimary">
                StyleSwipe Design System
              </H1>
              <Text fontSize="$5" color="$textSecondary" marginBottom="$2">
                Token reference and component gallery for visual verification
              </Text>

              {/* Color Tokens */}
              <Section title="Color Palette">
                <H3 fontSize="$5" color="$textSecondary">
                  Brand Colors
                </H3>
                <XStack flexWrap="wrap" gap="$2">
                  <ColorSwatch name="Primary" color="#CD0268" />
                  <ColorSwatch name="Primary Light" color="#E8338A" />
                  <ColorSwatch name="Primary Dark" color="#A10053" />
                  <ColorSwatch name="Secondary" color="#34889E" />
                  <ColorSwatch name="Secondary Light" color="#4BA3BA" />
                  <ColorSwatch name="Secondary Dark" color="#276A7D" />
                </XStack>

                <H3 fontSize="$5" color="$textSecondary" marginTop="$2">
                  Semantic Colors
                </H3>
                <XStack flexWrap="wrap" gap="$2">
                  <ColorSwatch name="Success" color="#10B981" />
                  <ColorSwatch name="Warning" color="#F59E0B" />
                  <ColorSwatch name="Error" color="#EF4444" />
                  <ColorSwatch name="Info" color="#3B82F6" />
                </XStack>

                <H3 fontSize="$5" color="$textSecondary" marginTop="$2">
                  Neutral Scale
                </H3>
                <XStack flexWrap="wrap" gap="$2">
                  <ColorSwatch name="50" color="#F8F9FA" />
                  <ColorSwatch name="200" color="#E9ECEF" />
                  <ColorSwatch name="500" color="#ADB5BD" />
                  <ColorSwatch name="700" color="#495057" />
                  <ColorSwatch name="900" color="#212739" />
                </XStack>
              </Section>

              {/* Spacing Tokens */}
              <Section title="Spacing (8px Grid)">
                <SpacingSwatch name="$0.5" size={4} />
                <SpacingSwatch name="$1" size={8} />
                <SpacingSwatch name="$2" size={16} />
                <SpacingSwatch name="$3" size={24} />
                <SpacingSwatch name="$4" size={32} />
                <SpacingSwatch name="$5" size={40} />
              </Section>

              {/* Typography */}
              <Section title="Typography (Manrope)">
                <Text fontSize="$12" fontWeight="700">
                  Display Large
                </Text>
                <Text fontSize="$9" fontWeight="700">
                  Heading Large
                </Text>
                <Text fontSize="$7" fontWeight="600">
                  Heading
                </Text>
                <Text fontSize="$5" fontWeight="400">
                  Body Text
                </Text>
                <Text fontSize="$3" fontWeight="400" color="$textSecondary">
                  Label / Caption
                </Text>
              </Section>

              {/* Button Component */}
              <Section title="Button Component">
                <XStack gap="$2" flexWrap="wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                </XStack>
                <XStack gap="$2" flexWrap="wrap">
                  <Button size="small">Small</Button>
                  <Button size="medium">Medium</Button>
                  <Button size="large">Large</Button>
                </XStack>
                <XStack gap="$2">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </XStack>
              </Section>

              {/* CategoryChip Component */}
              <Section title="CategoryChip Component">
                <XStack gap="$1.5" flexWrap="wrap">
                  {['Casual', 'Formal', 'Streetwear', 'Minimal'].map((label) => (
                    <CategoryChip
                      key={label}
                      label={label}
                      selected={selectedChips.includes(label.toLowerCase())}
                      onToggle={() => {
                        const id = label.toLowerCase();
                        setSelectedChips((prev) =>
                          prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
                        );
                      }}
                    />
                  ))}
                </XStack>
                <XStack gap="$1.5" flexWrap="wrap">
                  <CategoryChip label="Cotton" variant="filter" onRemove={() => { }} />
                  <CategoryChip label="Under 2000" variant="filter" onRemove={() => { }} />
                </XStack>
              </Section>

              {/* FashionCard Component */}
              <Section title="FashionCard Component">
                <XStack gap="$3" flexWrap="wrap">
                  <FashionCard
                    imageUrl="https://picsum.photos/320/480?random=10"
                    brand="ZARA"
                    title="Oversized Cotton Blazer"
                    price={3999}
                    originalPrice={5999}
                    discountPercentage={33}
                    onAddToCart={() => console.log('Add to cart')}
                  />
                  <FashionCard
                    size="compact"
                    imageUrl="https://picsum.photos/280/400?random=11"
                    brand="H&M"
                    title="Slim Fit Chinos"
                    price={1499}
                    onAddToCart={() => console.log('Add compact')}
                  />
                </XStack>
              </Section>

              {/* ProductTile Component */}
              <Section title="ProductTile Component">
                <XStack gap="$2" flexWrap="wrap">
                  <ProductTile
                    imageUrl="https://picsum.photos/180/240?random=20"
                    brand="Roadster"
                    title="Printed Round Neck T-Shirt"
                    price={599}
                    originalPrice={999}
                    discountPercentage={40}
                    rating={4.2}
                    reviewCount={1250}
                    isOnSale
                    isWishlisted={wishlist}
                    onWishlistToggle={() => setWishlist(!wishlist)}
                  />
                  <ProductTile
                    imageUrl="https://picsum.photos/180/240?random=21"
                    brand="Allen Solly"
                    title="Regular Fit Shirt"
                    price={1299}
                    rating={4.5}
                    reviewCount={890}
                  />
                </XStack>
              </Section>

              {/* GridSelection Component */}
              <Section title="GridSelection (Style DNA)">
                <GridSelection
                  items={demoGridItems}
                  selectedIds={gridSelection}
                  onSelectionChange={setGridSelection}
                  maxSelections={3}
                  itemSize="large"
                />
                <Text fontSize="$3" color="$textSecondary">
                  Selected: {gridSelection.length}/3
                </Text>
              </Section>

              {/* BudgetSlider Component */}
              <Section title="BudgetSlider (Style DNA)">
                <BudgetSlider
                  bands={DEFAULT_BUDGET_BANDS}
                  selectedBandId={budgetBand}
                  onBandSelect={setBudgetBand}
                />
              </Section>

              {/* FitPreferenceButtons Component */}
              <Section title="FitPreferenceButtons (Style DNA)">
                <FitPreferenceButtons
                  groups={DEFAULT_FIT_GROUPS}
                  selectedOptions={fitPreferences}
                  onSelectionChange={(groupId, selected) => {
                    setFitPreferences((prev) => ({
                      ...prev,
                      [groupId]: selected,
                    }));
                  }}
                />
              </Section>

              {/* SizeChipGroup Component */}
              <Section title="SizeChipGroup (Style DNA)">
                <SizeChipGroup
                  fields={DEFAULT_SIZE_FIELDS}
                  selectedSizes={sizeSelections}
                  onSizeChange={(fieldId, selected) => {
                    setSizeSelections((prev) => ({
                      ...prev,
                      [fieldId]: selected,
                    }));
                  }}
                />
              </Section>

              {/* Bottom padding for navigation */}
              <Stack height={80} />
            </YStack>
          </ScrollView>

          {/* Navigation Bar Demo */}
          <NavigationBar
            items={navItems}
            activeKey={activeNav}
            onItemPress={setActiveNav}
            elevated
          />
        </YStack>
      </Theme>
    </TamaguiProvider>
  );
}

export default DesignSystemGallery;
