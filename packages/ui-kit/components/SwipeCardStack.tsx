/**
 * SwipeCardStack Component
 * 
 * PRD Source: Tinder-style Discover Mode swipe mechanics [cite: 16, 18, 19]
 * Features: Card deck with gesture handlers, swipe left/right/up actions
 */

import React, { useState, useCallback } from 'react';
import { styled, GetProps, Stack, YStack, Text } from 'tamagui';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useAnimatedGestureHandler,
    useSharedValue,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';

const StackContainer = styled(YStack, {
    name: 'SwipeCardStack',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
});

const CardWrapper = styled(Stack, {
    name: 'SwipeCardWrapper',
    position: 'absolute',
});

const ActionOverlay = styled(Stack, {
    name: 'SwipeActionOverlay',
    position: 'absolute',
    top: '$4',
    paddingHorizontal: '$3',
    paddingVertical: '$1.5',
    borderRadius: '$2',
    borderWidth: 3,
    transform: [{ rotate: '-15deg' }],
});

const LikeOverlay = styled(ActionOverlay, {
    left: '$4',
    borderColor: '$success',
});

const NopeOverlay = styled(ActionOverlay, {
    right: '$4',
    borderColor: '$error',
    transform: [{ rotate: '15deg' }],
});

const SuperLikeOverlay = styled(ActionOverlay, {
    left: '50%',
    transform: [{ translateX: -50 }],
    borderColor: '$info',
});

const OverlayText = styled(Text, {
    name: 'SwipeOverlayText',
    fontFamily: '$heading',
    fontSize: '$8',
    fontWeight: '800',
    textTransform: 'uppercase',

    variants: {
        type: {
            like: { color: '$success' },
            nope: { color: '$error' },
            superlike: { color: '$info' },
        },
    } as const,
});

// Spring configuration for natural feel
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 100,
    mass: 0.5,
};

// Swipe thresholds
const SWIPE_THRESHOLD = 120;
const SWIPE_UP_THRESHOLD = 100;

export type SwipeDirection = 'left' | 'right' | 'up';

export type SwipeCardStackProps<T> = Omit<GetProps<typeof StackContainer>, 'children'> & {
    data: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    keyExtractor: (item: T, index: number) => string;
    onSwipe: (item: T, direction: SwipeDirection) => void;
    onSwipeStart?: (direction: SwipeDirection) => void;
    onSwipeEnd?: () => void;
    visibleCards?: number;
    cardOffset?: number;
    cardScale?: number;
};

// Animated Card Component
function AnimatedCard<T>({
    item,
    index,
    renderCard,
    onSwipe,
    onSwipeStart,
    onSwipeEnd,
    isTop,
    cardOffset,
    cardScale,
}: {
    item: T;
    index: number;
    renderCard: (item: T, index: number) => React.ReactNode;
    onSwipe: (direction: SwipeDirection) => void;
    onSwipeStart?: (direction: SwipeDirection) => void;
    onSwipeEnd?: () => void;
    isTop: boolean;
    cardOffset: number;
    cardScale: number;
}) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipe = useCallback((direction: SwipeDirection) => {
        onSwipe(direction);
    }, [onSwipe]);

    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onStart: () => { },
        onActive: (event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;

            // Detect direction for overlay
            if (Math.abs(event.translationX) > 50) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                if (onSwipeStart) {
                    runOnJS(onSwipeStart)(direction);
                }
            } else if (event.translationY < -50) {
                if (onSwipeStart) {
                    runOnJS(onSwipeStart)('up');
                }
            }
        },
        onEnd: (event) => {
            // Check if swipe threshold is met
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withSpring(500, SPRING_CONFIG);
                runOnJS(handleSwipe)('right');
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withSpring(-500, SPRING_CONFIG);
                runOnJS(handleSwipe)('left');
            } else if (event.translationY < -SWIPE_UP_THRESHOLD) {
                translateY.value = withSpring(-600, SPRING_CONFIG);
                runOnJS(handleSwipe)('up');
            } else {
                // Snap back
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG);
            }

            if (onSwipeEnd) {
                runOnJS(onSwipeEnd)();
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-200, 0, 200],
            [-15, 0, 15],
            Extrapolate.CLAMP
        );

        // Scale and offset for stacked cards
        const scale = isTop ? 1 : cardScale - (index * 0.02);
        const yOffset = isTop ? 0 : index * cardOffset;

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value + yOffset },
                { rotate: `${rotate}deg` },
                { scale },
            ],
            zIndex: 100 - index,
        };
    });

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
    }));

    const superLikeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [-SWIPE_UP_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
    }));

    if (!isTop) {
        return (
            <Animated.View style={animatedStyle}>
                <CardWrapper pointerEvents="none">
                    {renderCard(item, index)}
                </CardWrapper>
            </Animated.View>
        );
    }

    return (
        <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={animatedStyle}>
                <CardWrapper>
                    {renderCard(item, index)}

                    {/* Like Overlay */}
                    <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, likeOpacity]}>
                        <LikeOverlay>
                            <OverlayText type="like">LIKE</OverlayText>
                        </LikeOverlay>
                    </Animated.View>

                    {/* Nope Overlay */}
                    <Animated.View style={[{ position: 'absolute', top: 0, right: 0 }, nopeOpacity]}>
                        <NopeOverlay>
                            <OverlayText type="nope">NOPE</OverlayText>
                        </NopeOverlay>
                    </Animated.View>

                    {/* Super Like Overlay */}
                    <Animated.View style={[{ position: 'absolute', top: 0, alignSelf: 'center' }, superLikeOpacity]}>
                        <SuperLikeOverlay>
                            <OverlayText type="superlike">SUPER LIKE</OverlayText>
                        </SuperLikeOverlay>
                    </Animated.View>
                </CardWrapper>
            </Animated.View>
        </PanGestureHandler>
    );
}

export function SwipeCardStack<T>({
    data,
    renderCard,
    keyExtractor,
    onSwipe,
    onSwipeStart,
    onSwipeEnd,
    visibleCards = 3,
    cardOffset = 8,
    cardScale = 0.95,
    ...props
}: SwipeCardStackProps<T>) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSwipe = useCallback((item: T, direction: SwipeDirection) => {
        onSwipe(item, direction);
        setCurrentIndex(prev => prev + 1);
    }, [onSwipe]);

    const visibleData = data.slice(currentIndex, currentIndex + visibleCards);

    if (visibleData.length === 0) {
        return (
            <StackContainer {...props}>
                <Text fontSize="$5" color="$textSecondary">No more cards</Text>
            </StackContainer>
        );
    }

    return (
        <StackContainer {...props}>
            {visibleData.map((item, index) => (
                <AnimatedCard
                    key={keyExtractor(item, currentIndex + index)}
                    item={item}
                    index={index}
                    renderCard={renderCard}
                    onSwipe={(direction) => handleSwipe(item, direction)}
                    onSwipeStart={onSwipeStart}
                    onSwipeEnd={onSwipeEnd}
                    isTop={index === 0}
                    cardOffset={cardOffset}
                    cardScale={cardScale}
                />
            )).reverse()}
        </StackContainer>
    );
}

SwipeCardStack.displayName = 'SwipeCardStack';

export default SwipeCardStack;
