/**
 * StyleSwipe UI-Kit Components
 * Barrel export for all components
 */

// Core Atomic Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { FashionCard } from './FashionCard';
export type { FashionCardProps } from './FashionCard';

export { CategoryChip } from './CategoryChip';
export type { CategoryChipProps } from './CategoryChip';

export { ProductTile } from './ProductTile';
export type { ProductTileProps } from './ProductTile';

export { ImageGallery } from './ImageGallery';
// export type { ImageGalleryProps } from './ImageGallery'; // Not exporting props yet as it's not exported in file

// Navigation Components
export { NavigationBar } from './NavigationBar';
export type { NavigationBarProps, NavigationItem } from './NavigationBar';

export * from './TopBar';

// Style DNA / Onboarding Components
export { GridSelection } from './GridSelection';
export type { GridSelectionProps, GridSelectionItem } from './GridSelection';

export { BudgetSlider, DEFAULT_BUDGET_BANDS } from './BudgetSlider';
export type { BudgetSliderProps, BudgetBand } from './BudgetSlider';

export { FitPreferenceButtons, DEFAULT_FIT_GROUPS } from './FitPreferenceButtons';
export type { FitPreferenceButtonsProps, FitGroup, FitOption } from './FitPreferenceButtons';

export { SizeChipGroup, DEFAULT_SIZE_FIELDS } from './SizeChipGroup';
export type { SizeChipGroupProps, SizeField, SizeOption } from './SizeChipGroup';

// Swipe Components
export { SwipeCardStack } from './SwipeCardStack';
export type { SwipeCardStackProps, SwipeDirection } from './SwipeCardStack';

// Commerce Components
export { CartItem } from './CartItem';
export type { CartItemProps } from './CartItem';

export { PriceSummary } from './PriceSummary';
export type { PriceSummaryProps } from './PriceSummary';

export { TransactionalFooter } from './TransactionalFooter';
export type { TransactionalFooterProps } from './TransactionalFooter';

export { CouponInput } from './CouponInput';
export type { CouponInputProps, CouponStatus } from './CouponInput';

export { AddressForm } from './AddressForm';
export type { AddressFormProps } from './AddressForm';

// Feedback Components
export { Toast } from './Toast';
export type { ToastProps, ToastVariant } from './Toast';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateType } from './EmptyState';

export { LoadingSkeleton, ProductTileSkeleton, FashionCardSkeleton, CartItemSkeleton } from './LoadingSkeleton';
export type { LoadingSkeletonProps } from './LoadingSkeleton';

export { RatingStars } from './RatingStars';
export type { RatingStarsProps } from './RatingStars';

// Partner Sync Components
export { PartnerSyncCard } from './PartnerSyncCard';
export type { PartnerSyncCardProps, Duration } from './PartnerSyncCard';

export { BlendSlider } from './BlendSlider';
export type { BlendSliderProps } from './BlendSlider';

export { AvatarGroup } from './AvatarGroup';
export type { AvatarGroupProps, AvatarItem } from './AvatarGroup';
