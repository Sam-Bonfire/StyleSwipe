import { vi } from 'vitest';

// react-test-renderer requires an explicitly flagged act environment.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// NOTE: react-test-renderer is deprecated upstream. If React removes it,
// this harness needs its official successor; the RN/svg/icon mocks above
// transfer as-is since they sit below the renderer boundary.

// react-native ships Flow types that Node cannot parse. For component
// tests, every 'react-native' (and 'react-native-svg') import resolves to
// string host components plus the small API surface Tamagui needs.
// react-test-renderer instantiates them without a DOM.
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
    // Web target (matches the staging web build under test).
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

// The real icon package pulls Flow-typed sources Node cannot parse.
// Every icon used in ui-kit/app is stubbed as a recording null-component;
// usage is asserted through globalThis.__iconCalls. NOTE: plain object,
// not a Proxy — Vitest's mocker cannot wrap a Proxy factory result.
// If a component uses a new icon, add its name here (render would crash).
vi.mock('@tamagui/lucide-icons', () => {
  const calls: { name: string; props: unknown }[] = [];
  (globalThis as Record<string, unknown>).__iconCalls = calls;
  const names = [
    'AlertCircle', 'ArrowLeftRight', 'Bell', 'BellRing', 'Check', 'CheckCircle',
    'ChevronDown', 'ChevronLeft', 'ChevronRight', 'Clock', 'CloudOff', 'CreditCard',
    'Crown', 'ExternalLink', 'Eye', 'File', 'Filter', 'Grid', 'Heart', 'HeartHandshake',
    'Home', 'Info', 'Layers', 'LayoutGrid', 'Leaf', 'Link2', 'Loader', 'LogOut',
    'Mail', 'MapPin', 'MessageSquare', 'Minus', 'Package', 'PieChart', 'Plus',
    'QrCode', 'RefreshCw', 'Ruler', 'Search', 'Send', 'Share', 'Share2', 'Shield',
    'ShieldCheck', 'ShoppingBag', 'ShoppingCart', 'SlidersHorizontal', 'Sparkles',
    'Star', 'StarHalf', 'Tag', 'Trash2', 'TrendingUp', 'Truck', 'Undo2', 'Upload',
    'User', 'Users', 'Wallet', 'WifiOff', 'X', 'XCircle',
  ];
  const stubs: Record<string, unknown> = { __esModule: true };
  for (const name of names) {
    const Component = (props: unknown) => {
      calls.push({ name, props });
      return null;
    };
    Object.defineProperty(Component, 'name', { value: `${name}Mock` });
    stubs[name] = Component;
  }
  return stubs;
});
