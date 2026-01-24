/**
 * NavigationBar Component
 * 
 * PRD Source: Bottom navigation (Home, Discover, Categories, Account)
 * Features: Icon + label items, active state indicator
 */

import React from 'react';
import { styled, GetProps, XStack, YStack, Text } from 'tamagui';

const NavBarFrame = styled(XStack, {
    name: 'NavigationBar',
    backgroundColor: '$surface',
    borderTopWidth: 1,
    borderTopColor: '$borderColor',
    paddingVertical: '$1',
    paddingHorizontal: '$2',
    justifyContent: 'space-around',
    alignItems: 'center',

    variants: {
        elevated: {
            true: {
                elevation: 8,
                shadowColor: '$shadowColor',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                borderTopWidth: 0,
            },
        },
    } as const,
});

const NavItemFrame = styled(YStack, {
    name: 'NavigationBarItem',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '$1',
    paddingHorizontal: '$2',
    cursor: 'pointer',
    borderRadius: '$2',
    minWidth: 64,

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.95,
    },

    variants: {
        active: {
            true: {
                backgroundColor: '$primaryLight',
            },
        },
    } as const,
});

const NavItemIcon = styled(YStack, {
    name: 'NavigationBarItemIcon',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '$0.5',

    variants: {
        active: {
            true: {
                color: '$primary',
            },
            false: {
                color: '$textSecondary',
            },
        },
    } as const,
});

const NavItemLabel = styled(Text, {
    name: 'NavigationBarItemLabel',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '500',

    variants: {
        active: {
            true: {
                color: '$primary',
            },
            false: {
                color: '$textSecondary',
            },
        },
    } as const,
});

const ActiveIndicator = styled(YStack, {
    name: 'NavigationBarActiveIndicator',
    position: 'absolute',
    top: -1,
    left: '50%',
    width: 24,
    height: 3,
    backgroundColor: '$primary',
    borderRadius: '$full',
    transform: [{ translateX: -12 }],
});

export type NavigationItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
};

export type NavigationBarProps = GetProps<typeof NavBarFrame> & {
    items: NavigationItem[];
    activeKey: string;
    onItemPress: (key: string) => void;
};

export const NavigationBar = React.forwardRef<typeof NavBarFrame, NavigationBarProps>(
    ({ items, activeKey, onItemPress, ...props }, ref) => {
        return (
            <NavBarFrame ref={ref} {...props}>
                {items.map((item) => {
                    const isActive = item.key === activeKey;

                    return (
                        <NavItemFrame
                            key={item.key}
                            active={isActive}
                            onPress={() => onItemPress(item.key)}
                        >
                            {isActive && <ActiveIndicator />}

                            <NavItemIcon active={isActive}>
                                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                            </NavItemIcon>

                            <NavItemLabel active={isActive}>
                                {item.label}
                            </NavItemLabel>
                        </NavItemFrame>
                    );
                })}
            </NavBarFrame>
        );
    }
);

NavigationBar.displayName = 'NavigationBar';

export default NavigationBar;
