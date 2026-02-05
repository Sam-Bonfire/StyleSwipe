import React, { createContext, useContext, useState, useCallback } from 'react';
import { YStack, Portal, Theme } from 'tamagui';

import { Toast, ToastProps } from './Toast';

type ToastOptions = Omit<ToastProps, 'onDismiss'>;

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([]);

    const showToast = useCallback((options: ToastOptions) => {
        setToasts((prev) => [...prev, { ...options, id: Date.now() }] as (ToastOptions & { id: number })[]);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Portal>
                <Theme name="light">
                    <YStack
                        position="absolute"
                        top={60}
                        left={0}
                        right={0}
                        width="100%"
                        alignItems="center"
                        pointerEvents="none"
                        gap="$2"
                        zIndex={200000}
                    >
                        {toasts.map((toast) => (
                            <Toast
                                key={toast.id}
                                {...toast}
                                pointerEvents="auto"
                                alignSelf="center"
                                onDismiss={() => dismissToast(toast.id)}
                            />
                        ))}
                    </YStack>
                </Theme>
            </Portal>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
