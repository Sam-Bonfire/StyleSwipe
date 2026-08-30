/**
 * SwipeCardStack Component
 *
 * PRD Source: Tinder-style Discover Mode swipe mechanics [cite: 16, 18, 19]
 * Features: Card deck with gesture handlers, swipe left/right/up actions
 */

import { Heart, X, Star } from '@tamagui/lucide-icons';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  type SharedValue,
} from 'react-native-reanimated';
import { styled, GetProps, YStack, Text } from 'tamagui';

// Safe polyfill for Pointer Events capture/release DOMExceptions on Web browsers
if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  if (Element.prototype.releasePointerCapture) {
    const originalRelease = Element.prototype.releasePointerCapture;
    Element.prototype.releasePointerCapture = function (pointerId) {
      try {
        originalRelease.call(this, pointerId);
      } catch {
        // Silence invalid pointer capture release errors safely on Web
      }
    };
  }
  if (Element.prototype.setPointerCapture) {
    const originalSet = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function (pointerId) {
      try {
        originalSet.call(this, pointerId);
      } catch {
        // Silence invalid pointer capture set errors safely on Web
      }
    };
  }
}


const StackContainer = styled(YStack, {
  name: 'SwipeCardStack',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
});

const CardWrapper = styled(YStack, {
  name: 'SwipeCardWrapper',
});

const ActionOverlay = styled(YStack, {
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

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
};

// Swipe thresholds
const SWIPE_THRESHOLD = 120;
const SWIPE_UP_THRESHOLD = 100;
const SWIPE_DOWN_THRESHOLD = 100;

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

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

export interface SwipeCardStackRef {
  rewind: () => void;
}

// Animated Card Component

export interface AnimatedCardProps<T> {
  item: T;
  index: number;
  animIndex: SharedValue<number>;
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  onSwipeStart?: (direction: SwipeDirection) => void;
  onSwipeEnd?: () => void;
  isTop: boolean;
  cardOffset: number;
  cardScale: number;
  sharedX: SharedValue<number>;
  sharedY: SharedValue<number>;
  entranceDirection?: SwipeDirection | null;
}

const AnimatedCard = React.forwardRef(
  <T,>(
    {
      item,
      index,
      renderCard,
      onSwipe,
      onSwipeStart,
      onSwipeEnd,
      animIndex,
      isTop,
      cardOffset,
      cardScale,
      sharedX,
      sharedY,
      entranceDirection,
    }: AnimatedCardProps<T>,
    ref: React.Ref<{ swipe: (dir: SwipeDirection) => void }>,
  ) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Initial rewind entrance animation
    useEffect(() => {
      if (entranceDirection) {
        if (entranceDirection === 'left') translateX.value = -1000;
        else if (entranceDirection === 'right') translateX.value = 1000;
        else if (entranceDirection === 'up') translateY.value = -1000;
        else if (entranceDirection === 'down') translateY.value = 1000;

        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    }, [entranceDirection, translateX, translateY]);

    const superLikeScale = useSharedValue(1);

    // Sync local movement to shared values if top card
    useAnimatedReaction(
      () => ({ x: translateX.value, y: translateY.value, active: isTop }),
      (result) => {
        if (result.active) {
          sharedX.value = result.x;
          sharedY.value = result.y;
        }
      },
      [isTop],
    );

    const handleSwipeCompletion = useCallback(
      (direction: SwipeDirection) => {
        onSwipe(direction);
      },
      [onSwipe],
    );

    const triggerSwipe = useCallback(
      (direction: SwipeDirection) => {
        'worklet';
        const EXIT_DURATION = 300;
        if (direction === 'right') {
          translateX.value = withTiming(1000, { duration: EXIT_DURATION }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('right');
          });
        } else if (direction === 'left') {
          translateX.value = withTiming(-1000, { duration: EXIT_DURATION }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('left');
          });
        } else if (direction === 'up') {
          superLikeScale.value = withTiming(1.05, { duration: 150 });
          translateY.value = withTiming(-1000, { duration: EXIT_DURATION }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('up');
          });
        } else if (direction === 'down') {
          translateY.value = withTiming(1000, { duration: EXIT_DURATION }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('down');
          });
        }
      },
      [translateX, translateY, handleSwipeCompletion],
    );

    React.useImperativeHandle(ref, () => ({
      swipe: triggerSwipe,
    }));

    const panGesture = Gesture.Pan()
      .enabled(isTop)
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        if (Math.abs(event.translationX) > 50 && onSwipeStart) {
          runOnJS(onSwipeStart)(event.translationX > 0 ? 'right' : 'left');
        } else if (event.translationY < -50 && onSwipeStart) {
          runOnJS(onSwipeStart)('up');
        } else if (event.translationY > 50 && onSwipeStart) {
          runOnJS(onSwipeStart)('down');
        }
      })
      .onEnd((event) => {
        if (event.translationX > SWIPE_THRESHOLD) {
          translateX.value = withTiming(1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('right');
          });
        } else if (event.translationX < -SWIPE_THRESHOLD) {
          translateX.value = withTiming(-1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('left');
          });
        } else if (event.translationY < -SWIPE_UP_THRESHOLD) {
          superLikeScale.value = withTiming(1.05, { duration: 150 });
          translateY.value = withTiming(-1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('up');
          });
        } else if (event.translationY > SWIPE_DOWN_THRESHOLD) {
          translateY.value = withTiming(1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('down');
          });
        } else {
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
        }
        if (onSwipeEnd) runOnJS(onSwipeEnd)();
      });

    const animatedStyle = useAnimatedStyle(() => {
      const rotate = isTop
        ? interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15], Extrapolate.CLAMP)
        : 0;

      const maxInteraction = Math.max(Math.abs(sharedX.value), Math.abs(sharedY.value));
      const progress = interpolate(maxInteraction, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP);

      // Current base position values
      const curScale = isTop ? 1.0 : cardScale - animIndex.value * 0.05;
      const curY = isTop ? 0 : animIndex.value * cardOffset;

      // Target position values (once swiped away)
      const nextIdx = animIndex.value - 1;
      const effNextIdx = nextIdx < 0 ? 0 : nextIdx;
      const nxtScale = effNextIdx === 0 ? 1.0 : cardScale - effNextIdx * 0.05;
      const nxtY = effNextIdx * cardOffset;

      // Pure layout interpolation: transition seamlessly under top card dragging
      // If the item is swiped up (super like), mix in the super like scale
      const superLikeScaleValue = translateY.value < 0 ? superLikeScale.value : 1;

      const baseScale = interpolate(progress, [0, 1], [curScale, nxtScale]);
      const interpolatedScale = isTop ? baseScale * superLikeScaleValue : baseScale;

      const interpolatedY = interpolate(progress, [0, 1], [curY, nxtY]);

      // Calculate super like exit fade out
      const superLikeOpacityValue = translateY.value < -SWIPE_UP_THRESHOLD
        ? interpolate(translateY.value, [-SWIPE_UP_THRESHOLD, -SWIPE_UP_THRESHOLD - 200], [1, 0], Extrapolate.CLAMP)
        : 1;

      return {
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value + interpolatedY },
          { rotate: `${rotate}deg` },
          { scale: interpolatedScale },
        ],
        opacity: isTop ? superLikeOpacityValue : 1,
        zIndex: 100 - Math.round(animIndex.value),
      } as const;
    });

    const superLikeGlow = useAnimatedStyle(() => {
      const glowOpacity = interpolate(translateY.value, [0, -SWIPE_UP_THRESHOLD], [0, 1], Extrapolate.CLAMP);
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: '#00d0ff',
        opacity: glowOpacity,
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

    return (
      <Animated.View style={animatedStyle}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ width: '100%', height: '100%' }}>
            <CardWrapper pointerEvents={isTop ? 'auto' : 'none'} width="100%" height="100%">
              {renderCard(item, index)}
              {isTop && <Animated.View pointerEvents="none" style={superLikeGlow} />}
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' },
                  likeOpacity,
                ]}
              >
                <LikeOverlay>
                  <Heart size={64} color="$success" fill="currentColor" />
                </LikeOverlay>
              </Animated.View>
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, right: 0, pointerEvents: 'none' },
                  nopeOpacity,
                ]}
              >
                <NopeOverlay>
                  <X size={64} color="$error" />
                </NopeOverlay>
              </Animated.View>
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, alignSelf: 'center', pointerEvents: 'none' },
                  superLikeOpacity,
                ]}
              >
                <SuperLikeOverlay>
                  <Star size={64} color="$info" fill="currentColor" />
                </SuperLikeOverlay>
              </Animated.View>
            </CardWrapper>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    );
  },
);

export const SwipeCardStack = React.forwardRef(
  <T,>(
    {
      data,
      renderCard,
      keyExtractor,
      onSwipe,
      onSwipeStart,
      onSwipeEnd,
      visibleCards = 4,
      cardOffset = 28,
      cardScale = 0.96,
      ...props
    }: SwipeCardStackProps<T>,
    ref: React.Ref<SwipeCardStackRef>
  ) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const stackWidth = screenWidth * 0.9;
  const stackHeight = screenHeight * 0.72;

  const [currentIndex, setCurrentIndex] = useState(0);

  const sharedX = useSharedValue(0);
  const sharedY = useSharedValue(0);
  const animIndices = Array.from({ length: visibleCards }).map((_, i) => useSharedValue(i));

  const [swipeHistory, setSwipeHistory] = useState<{ item: T; direction: SwipeDirection }[]>([]);
  const [lastEntrance, setLastEntrance] = useState<SwipeDirection | null>(null);

  const handleSwipe = useCallback(
    (item: T, direction: SwipeDirection) => {
      setSwipeHistory((prev) => [...prev, { item, direction }]);
      setLastEntrance(null); // Clear entrance direction for next card
      onSwipe(item, direction);
      setCurrentIndex((prev) => prev + 1);

      // Animate indices forward
      animIndices.forEach((animVal, i) => {
        if (i < visibleCards - 1) {
          animVal.value = withSpring(i, { damping: 20, stiffness: 150 });
        }
      });
    },
    [onSwipe, visibleCards, animIndices],
  );

  React.useImperativeHandle(ref, () => ({
    rewind: () => {
      if (swipeHistory.length > 0 && currentIndex > 0) {
        const lastSwipe = swipeHistory[swipeHistory.length - 1];
        setSwipeHistory((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
        setLastEntrance(lastSwipe.direction);

        // Animate indices backward
        animIndices.forEach((animVal, i) => {
          if (i > 0) {
             // The card at logical index `i` in the new stack was previously at index `i - 1`.
             // Setting the current value to `i - 1` and springing to `i` animates it backward nicely.
             animVal.value = i - 1;
             animVal.value = withSpring(i, { damping: 20, stiffness: 150 });
          }
        });
      }
    }
  }));

  // Sync reset of shared animation values with the commit of the index promotion.
  // This prevents the underlying card from dropping its active layout drift
  // during the 1-2 frame asynchronous lag while React commits the index update.
  useEffect(() => {
    sharedX.value = 0;
    sharedY.value = 0;
  }, [currentIndex, sharedX, sharedY]);

  const visibleData = data.slice(currentIndex, currentIndex + visibleCards);
  const topCardRef = useRef<{ swipe: (dir: SwipeDirection) => void }>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!topCardRef.current) return;
        if (e.key === 'ArrowRight') topCardRef.current.swipe('right');
        if (e.key === 'ArrowLeft') topCardRef.current.swipe('left');
        if (e.key === 'ArrowUp') topCardRef.current.swipe('up');
        if (e.key === 'ArrowDown') topCardRef.current.swipe('down');
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [currentIndex]);

  if (visibleData.length === 0) {
    return (
      <StackContainer {...props} backgroundColor="$background">
        <Text fontSize="$6" color="black" textAlign="center" padding="$4">
          That's all for now!
        </Text>
      </StackContainer>
    );
  }

  return (
    <StackContainer {...props}>
      <YStack width={stackWidth} height={stackHeight} position="relative">
        {visibleData
          .map((item, index) => (
            <AnimatedCard<T>
              ref={index === 0 ? topCardRef : null}
              key={keyExtractor(item, currentIndex + index)}
              item={item}
              index={index}
              animIndex={animIndices[index] || animIndices[animIndices.length - 1]}
              renderCard={renderCard}
              onSwipe={(direction) => handleSwipe(item, direction)}
              onSwipeStart={onSwipeStart}
              onSwipeEnd={onSwipeEnd}
              isTop={index === 0}
              cardOffset={cardOffset}
              cardScale={cardScale}
              sharedX={sharedX}
              sharedY={sharedY}
              entranceDirection={index === 0 ? lastEntrance : null}
            />
          ))
          .reverse()}
      </YStack>
    </StackContainer>
  );
});

// @ts-ignore
SwipeCardStack.displayName = 'SwipeCardStack';
export default SwipeCardStack;
