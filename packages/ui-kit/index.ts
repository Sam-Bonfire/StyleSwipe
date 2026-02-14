/**
 * StyleSwipe UI-Kit
 *
 * Tamagui-based design system for StyleSwipe
 * Exports theme configuration and all components
 */

// Theme and Configuration
export { config, tokens } from './theme';
export type { AppConfig } from './theme';
export { default as tamaguiConfig } from './theme';

// All Components
export * from './components';
export { StyleSwipeProvider } from './provider';
