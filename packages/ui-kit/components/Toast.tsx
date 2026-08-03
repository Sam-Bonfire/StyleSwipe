/**
 * Toast Component
 *
 * PRD Source: Non-blocking notifications for user actions
 * Features: Success/Error/Info variants, auto-dismiss, action button
 */

import { Check, AlertCircle, Info, X } from '@tamagui/lucide-icons';
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { styled, GetProps, XStack, YStack, Text } from 'tamagui';

const ToastFrame = styled(XStack, {
  name: 'Toast',
  backgroundColor: '$background',
  borderRadius: '$full', // Pill shape for ultra-premium feel
  paddingVertical: '$1', // More compact
  paddingHorizontal: '$2',
  gap: '$2',
  alignItems: 'center',
  // Premium Layout
  minHeight: 40, // Sleeker touch target
  // Sophisticated Shadow
  elevation: 6,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  maxWidth: '92%',
  borderWidth: 1,
  borderColor: '$neutral200', // Very subtle definition

  // Removed variants for borderLeftColor to make it cleaner
});

const IconContainer = styled(YStack, {
  name: 'ToastIcon',
  width: 28,
  height: 28,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      success: { backgroundColor: '$successLight' },
      error: { backgroundColor: '$errorLight' },
      info: { backgroundColor: '$infoLight' },
      warning: { backgroundColor: '$warningLight' },
    },
  } as const,
});

const ContentContainer = styled(YStack, {
  name: 'ToastContent',
  flex: 1,
  gap: '$0.5',
});

const TitleText = styled(Text, {
  name: 'ToastTitle',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '600', // Semi-bold is more refined than bold
  color: '$textPrimary',
  letterSpacing: 0.2, // Tiny bit of spacing for readability
});

const MessageText = styled(Text, {
  name: 'ToastMessage',
  fontFamily: '$body',
  fontSize: '$3',
  lineHeight: 18, // Fixed line height for consistency
  color: '$textSecondary',
});

const ActionButton = styled(Text, {
  name: 'ToastAction',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '600',
  color: '$primary',
  cursor: 'pointer',

  hoverStyle: {
    textDecorationLine: 'underline',
  },
});

const CloseButton = styled(YStack, {
  name: 'ToastClose',
  width: 24,
  height: 24,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
});

const IconMap = {
  success: Check,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const IconColorMap = {
  success: '$success',
  error: '$error',
  info: '$info',
  warning: '$warning',
};

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastProps = GetProps<typeof ToastFrame> & {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  showClose?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: () => void;
};

export const Toast = React.forwardRef<typeof ToastFrame, ToastProps>(
  (
    {
      title,
      message,
      variant = 'info',
      duration = 4000,
      showClose = true,
      action,
      onDismiss,
      ...props
    },
    ref,
  ) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-20);

    useEffect(() => {
      // Animate in
      opacity.value = withSpring(1);
      translateY.value = withSpring(0);

      // Auto dismiss
      if ((duration as number) > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration as number);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, [duration]);

    const handleDismiss = () => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-20, { duration: 200 }, () => {
        runOnJS(onDismiss as any)();
      });
    };

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));

    const IconComponent = IconMap[variant as ToastVariant];

    return (
      <Animated.View style={animatedStyle}>
        <ToastFrame ref={ref as any} {...props}>
          {
            (
              <IconContainer variant={variant as ToastVariant}>
                <IconComponent size={16} color={IconColorMap[variant as ToastVariant] as any} />
              </IconContainer>
            ) as any
          }

          {
            (
              <ContentContainer>
                {title && <TitleText>{title}</TitleText>}
                <MessageText>{message}</MessageText>

                {action && (
                  <ActionButton onPress={(action as any).onPress}>
                    {(action as any).label}
                  </ActionButton>
                )}
              </ContentContainer>
            ) as any
          }

          {showClose &&
            ((
              <CloseButton onPress={handleDismiss}>
                <X size={16} color="$textSecondary" />
              </CloseButton>
            ) as any)}
        </ToastFrame>
      </Animated.View>
    );
  },
);

Toast.displayName = 'Toast';

export default Toast;
