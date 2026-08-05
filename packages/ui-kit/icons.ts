/**
 * Themed Lucide Icons for StyleSwipe
 *
 * Wraps lucide-react-native icons with Tamagui theme token resolution,
 * replacing @tamagui/lucide-icons which has version conflicts with
 * @tamagui/core@2.5.0.
 *
 * Usage: <Plus size={24} color="$textPrimary" />
 */

import type { LucideIcon } from 'lucide-react-native';

import {
  Activity as _Activity,
  Bell as _Bell,
  Box as _Box,
  Building2 as _Building2,
  Check as _Check,
  ChevronDown as _ChevronDown,
  ChevronLeft as _ChevronLeft,
  ChevronRight as _ChevronRight,
  Clock as _Clock,
  Copy as _Copy,
  Cpu as _Cpu,
  CreditCard as _CreditCard,
  Crown as _Crown,
  ExternalLink as _ExternalLink,
  Eye as _Eye,
  File as _File,
  FileStack as _FileStack,
  Hash as _Hash,
  Heart as _Heart,
  HeartHandshake as _HeartHandshake,
  Info as _Info,
  Layers as _Layers,
  Leaf as _Leaf,
  Link2 as _Link2,
  Loader as _Loader,
  LogOut as _LogOut,
  Mail as _Mail,
  MapPin as _MapPin,
  MessageSquare as _MessageSquare,
  Minus as _Minus,
  Package as _Package,
  Plus as _Plus,
  QrCode as _QrCode,
  RefreshCw as _RefreshCw,
  Search as _Search,
  Send as _Send,
  Shield as _Shield,
  ShieldCheck as _ShieldCheck,
  ShoppingBag as _ShoppingBag,
  ShoppingCart as _ShoppingCart,
  Sparkles as _Sparkles,
  Star as _Star,
  StarHalf as _StarHalf,
  Tag as _Tag,
  Trash2 as _Trash2,
  TrendingUp as _TrendingUp,
  Truck as _Truck,
  Upload as _Upload,
  User as _User,
  Users as _Users,
  X as _X,
  ArrowLeftRight as _ArrowLeftRight,
  // Renamed icons in lucide-react-native
  CircleAlert as _AlertCircle,
  CircleCheck as _CheckCircle,
  Pencil as _Edit3,
  ListFilter as _Filter,
  Grid3x3 as _Grid,
  House as _Home,
  ChartPie as _PieChart,
} from 'lucide-react-native';
import React, { memo, ComponentType } from 'react';
import { useTheme } from 'tamagui';

// Theme token resolution for icon color props
function resolveColor(color: string | undefined, theme: Record<string, any>): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('$')) {
    const tokenName = color.slice(1);
    const themeValue = theme[tokenName];
    if (themeValue) {
      return typeof themeValue === 'object' && themeValue.val !== undefined
        ? themeValue.val
        : String(themeValue);
    }
  }
  return color;
}

// Props that our themed icons accept
interface ThemedIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  [key: string]: any;
}

// HOC that wraps a Lucide icon with Tamagui theme resolution
function themed(IconComponent: LucideIcon): ComponentType<ThemedIconProps> {
  const ThemedIcon = memo(function ThemedIcon(props: ThemedIconProps) {
    const theme = useTheme();
    const { color, size, ...rest } = props;
    const resolvedColor = resolveColor(color, theme as Record<string, any>);

    return React.createElement(IconComponent, {
      ...rest,
      color: resolvedColor,
      size: size,
    });
  });

  ThemedIcon.displayName = IconComponent.displayName || IconComponent.name;
  return ThemedIcon;
}

// ---- Export themed icons ----
// Original names (same as @tamagui/lucide-icons)
export const Activity = themed(_Activity);
export const AlertCircle = themed(_AlertCircle);
export const ArrowLeftRight = themed(_ArrowLeftRight);
export const Bell = themed(_Bell);
export const Box = themed(_Box);
export const Building2 = themed(_Building2);
export const Check = themed(_Check);
export const CheckCircle = themed(_CheckCircle);
export const ChevronDown = themed(_ChevronDown);
export const ChevronLeft = themed(_ChevronLeft);
export const ChevronRight = themed(_ChevronRight);
export const Clock = themed(_Clock);
export const Copy = themed(_Copy);
export const Cpu = themed(_Cpu);
export const CreditCard = themed(_CreditCard);
export const Crown = themed(_Crown);
export const Edit3 = themed(_Edit3);
export const ExternalLink = themed(_ExternalLink);
export const Eye = themed(_Eye);
export const File = themed(_File);
export const FileStack = themed(_FileStack);
export const Filter = themed(_Filter);
export const Grid = themed(_Grid);
export const Hash = themed(_Hash);
export const Heart = themed(_Heart);
export const HeartHandshake = themed(_HeartHandshake);
export const Home = themed(_Home);
export const Info = themed(_Info);
export const Layers = themed(_Layers);
export const Leaf = themed(_Leaf);
export const Link2 = themed(_Link2);
export const Loader = themed(_Loader);
export const LogOut = themed(_LogOut);
export const Mail = themed(_Mail);
export const MapPin = themed(_MapPin);
export const MessageSquare = themed(_MessageSquare);
export const Minus = themed(_Minus);
export const Package = themed(_Package);
export const PieChart = themed(_PieChart);
export const Plus = themed(_Plus);
export const QrCode = themed(_QrCode);
export const RefreshCw = themed(_RefreshCw);
export const Search = themed(_Search);
export const Send = themed(_Send);
export const Shield = themed(_Shield);
export const ShieldCheck = themed(_ShieldCheck);
export const ShoppingBag = themed(_ShoppingBag);
export const ShoppingCart = themed(_ShoppingCart);
export const Sparkles = themed(_Sparkles);
export const Star = themed(_Star);
export const StarHalf = themed(_StarHalf);
export const Tag = themed(_Tag);
export const Trash2 = themed(_Trash2);
export const TrendingUp = themed(_TrendingUp);
export const Truck = themed(_Truck);
export const Upload = themed(_Upload);
export const User = themed(_User);
export const Users = themed(_Users);
export const X = themed(_X);
