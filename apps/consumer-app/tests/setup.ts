import { vi } from 'vitest';

// react-test-renderer requires an explicitly flagged act environment.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// NOTE: react-test-renderer is deprecated upstream — see packages/ui-kit/tests/setup.ts.

// Mirror of packages/ui-kit/tests/setup.ts: react-native ships Flow types
// Node cannot parse, and the real icon package pulls them in too.
vi.mock('react-native', () => ({
  __esModule: true,
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  TextInput: 'TextInput',
  Switch: 'Switch',
  Modal: 'Modal',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  StyleSheet: {
    create: (styles: unknown) => styles,
    flatten: (style: unknown) => {
      if (Array.isArray(style)) return Object.assign({}, ...style);
      return style ?? {};
    },
    hairlineWidth: 1,
  },
  Platform: {
    OS: 'web',
    select: (options: Record<string, unknown>) => options.web ?? options.default,
  },
  Dimensions: {
    get: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
  },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
  useColorScheme: () => 'light',
  PixelRatio: { get: () => 2 },
  AccessibilityInfo: { isScreenReaderEnabled: async () => false },
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
  I18nManager: { isRTL: false },
  Alert: { alert: () => {} },
  Linking: { openURL: async () => {} },
  Share: { share: async () => ({}) },
}));

vi.mock('react-native-svg', () => ({
  __esModule: true,
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
  Line: 'Line',
  Polyline: 'Polyline',
  Polygon: 'Polygon',
  Ellipse: 'Ellipse',
  G: 'G',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Text: 'SvgText',
  TSpan: 'TSpan',
  Use: 'Use',
  Symbol: 'SvgSymbol',
  Mask: 'Mask',
}));

// NOTE: no '@tamagui/lucide-icons' vi.mock here — icons resolve to
// tests/stubs/lucide-icons.tsx through the vitest alias, which covers
// ui-kit-internal importers that a specifier mock cannot reach.

// expo-router pulls native modules (constants, linking) that cannot load
// in Node. Screens under test only need the router object + params hooks.
vi.mock('expo-router', () => ({
  router: { replace: vi.fn(), back: vi.fn(), push: vi.fn(), canGoBack: () => false },
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), canGoBack: () => false }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
}));
