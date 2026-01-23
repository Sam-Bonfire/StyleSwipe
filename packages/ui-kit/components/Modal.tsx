/**
 * Modal Component
 * 
 * PRD Source: Dialogs for confirmations, Partner Sync invites
 * Features: Overlay, centered content, close on backdrop, animations
 */

import React, { useEffect } from 'react';
import { styled, GetProps, YStack, XStack, Text, Stack, Portal } from 'tamagui';
import { X } from '@tamagui/lucide-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

const Backdrop = styled(Stack, {
    name: 'ModalBackdrop',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '$overlay',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '$4',
});

const ModalFrame = styled(YStack, {
    name: 'Modal',
    backgroundColor: '$surface',
    borderRadius: '$4',
    maxWidth: 480,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
});

const ModalHeader = styled(XStack, {
    name: 'ModalHeader',
    padding: '$3',
    paddingBottom: '$2',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '$borderColor',
});

const ModalTitle = styled(Text, {
    name: 'ModalTitle',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
    flex: 1,
});

const CloseButton = styled(Stack, {
    name: 'ModalCloseButton',
    width: 36,
    height: 36,
    borderRadius: '$full',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.95,
    },
});

const ModalBody = styled(YStack, {
    name: 'ModalBody',
    padding: '$3',
    flex: 1,
});

const ModalFooter = styled(XStack, {
    name: 'ModalFooter',
    padding: '$3',
    paddingTop: '$2',
    gap: '$2',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '$borderColor',
});

export type ModalProps = GetProps<typeof ModalFrame> & {
    open: boolean;
    onClose: () => void;
    title?: string;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

export const Modal = React.forwardRef<typeof ModalFrame, ModalProps>(
    ({
        open,
        onClose,
        title,
        showCloseButton = true,
        closeOnBackdrop = true,
        footer,
        children,
        ...props
    }, ref) => {
        const backdropOpacity = useSharedValue(0);
        const modalScale = useSharedValue(0.9);
        const modalOpacity = useSharedValue(0);

        useEffect(() => {
            if (open) {
                backdropOpacity.value = withTiming(1, { duration: 200 });
                modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
                modalOpacity.value = withTiming(1, { duration: 200 });
            } else {
                backdropOpacity.value = withTiming(0, { duration: 150 });
                modalScale.value = withTiming(0.9, { duration: 150 });
                modalOpacity.value = withTiming(0, { duration: 150 });
            }
        }, [open]);

        const backdropStyle = useAnimatedStyle(() => ({
            opacity: backdropOpacity.value,
        }));

        const modalStyle = useAnimatedStyle(() => ({
            opacity: modalOpacity.value,
            transform: [{ scale: modalScale.value }],
        }));

        const handleBackdropPress = () => {
            if (closeOnBackdrop) {
                onClose();
            }
        };

        const handleModalPress = (e: any) => {
            e.stopPropagation();
        };

        if (!open) return null;

        return (
            <Portal>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        },
                        backdropStyle,
                    ]}
                >
                    <Backdrop onPress={handleBackdropPress}>
                        <Animated.View style={modalStyle}>
                            <ModalFrame ref={ref} onPress={handleModalPress} {...props}>
                                {(title || showCloseButton) && (
                                    <ModalHeader>
                                        {title && <ModalTitle>{title}</ModalTitle>}
                                        {showCloseButton && (
                                            <CloseButton onPress={onClose}>
                                                <X size={20} color="$textSecondary" />
                                            </CloseButton>
                                        )}
                                    </ModalHeader>
                                )}

                                <ModalBody>{children}</ModalBody>

                                {footer && <ModalFooter>{footer}</ModalFooter>}
                            </ModalFrame>
                        </Animated.View>
                    </Backdrop>
                </Animated.View>
            </Portal>
        );
    }
);

Modal.displayName = 'Modal';

export default Modal;
