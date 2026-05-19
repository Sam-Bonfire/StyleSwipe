/**
 * SwipeCardStack Component
 *
 * PRD Source: Tinder-style Discover Mode swipe mechanics [cite: 16, 18, 19]
 * Features: Card deck with gesture handlers, swipe left/right/up actions
 */

import { Heart, X, Star } from '@tamagui/lucide-icons';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { styled, GetProps, Stack, YStack, Text } from 'tamagui';

const StackContainer = styled(YStack, {
  name: 'SwipeCardStack',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
});

const CardWrapper = styled(Stack, {
  name: 'SwipeCardWrapper',
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

// Animated Card Component

const AnimatedCard = React.forwardRef(
  (
    {
      item,
      index,
      renderCard,
      onSwipe,
      onSwipeStart,
      onSwipeEnd,
      isTop,
      cardOffset,
      cardScale,
      sharedX,
      sharedY,
    }: {
      item: any;
      index: number;

      renderCard: (item: any, index: number) => React.ReactNode;
      onSwipe: (direction: SwipeDirection) => void;
      onSwipeStart?: (direction: SwipeDirection) => void;
      onSwipeEnd?: () => void;
      isTop: boolean;
      cardOffset: number;
      cardScale: number;
      sharedX: Animated.SharedValue<number>;
      sharedY: Animated.SharedValue<number>;
    },
    ref,
  ) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Physical slot positions
    const slotScale = useSharedValue(isTop ? 1 : cardScale - index * 0.05);
    const slotYOffset = useSharedValue(isTop ? 0 : index * cardOffset);

    // Sync prop changes (promotion) with spring
    useEffect(() => {
      const targetScale = isTop ? 1 : cardScale - index * 0.05;
      const targetY = isTop ? 0 : index * cardOffset;

      slotScale.value = withSpring(targetScale, SPRING_CONFIG);
      slotYOffset.value = withSpring(targetY, SPRING_CONFIG);
    }, [index, isTop, cardScale, cardOffset]);

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

    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onActive: (event) => {
        if (!isTop) return;
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        if (Math.abs(event.translationX) > 50 && onSwipeStart) {
          runOnJS(onSwipeStart)(event.translationX > 0 ? 'right' : 'left');
        } else if (event.translationY < -50 && onSwipeStart) {
          runOnJS(onSwipeStart)('up');
        } else if (event.translationY > 50 && onSwipeStart) {
          runOnJS(onSwipeStart)('down');
        }
      },
      onEnd: (event) => {
        if (!isTop) return;
        if (event.translationX > SWIPE_THRESHOLD) {
          translateX.value = withTiming(1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('right');
          });
        } else if (event.translationX < -SWIPE_THRESHOLD) {
          translateX.value = withTiming(-1000, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeCompletion)('left');
          });
        } else if (event.translationY < -SWIPE_UP_THRESHOLD) {
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
      },
    }, [isTop, handleSwipeCompletion, onSwipeStart, onSwipeEnd]);

    const animatedStyle = useAnimatedStyle(() => {
      const rotate = isTop
        ? interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15], Extrapolate.CLAMP)
        : 0;

      const maxInteraction = Math.max(Math.abs(sharedX.value), Math.abs(sharedY.value));
      const progress = interpolate(maxInteraction, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP);

      // Simple drift calculation
      const nextIdx = index - 1;
      const effNextIdx = nextIdx < 0 ? 0 : nextIdx;
      const curScale = isTop ? 1 : cardScale - index * 0.05;
      const nxtScale = cardScale - effNextIdx * 0.05;
      const sDrift = isTop ? 0 : (nxtScale - curScale) * progress;

      const curY = isTop ? 0 : index * cardOffset;
      const nxtY = effNextIdx * cardOffset;
      const yDrift = isTop ? 0 : (nxtY - curY) * progress;

      return {
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value + slotYOffset.value + yDrift },
          { rotate: `${rotate}deg` },
          { scale: slotScale.value + sDrift },
        ] as any,
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

    return (
      <Animated.View style={animatedStyle}>
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          onHandlerStateChange={gestureHandler}
          enabled={isTop}
        >
          <Animated.View style={{ width: '100%', height: '100%' }}>
            <CardWrapper pointerEvents={isTop ? 'auto' : 'none'} width="100%" height="100%">
              {renderCard(item, index)}
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
        </PanGestureHandler>
      </Animated.View>
    );
  },
);

export function SwipeCardStack<T>({
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
}: SwipeCardStackProps<T>) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const stackWidth = screenWidth * 0.9;
  const stackHeight = screenHeight * 0.72;

  const [currentIndex, setCurrentIndex] = useState(0);

  const sharedX = useSharedValue(0);
  const sharedY = useSharedValue(0);

  const handleSwipe = useCallback(
    (item: T, direction: SwipeDirection) => {
      // RESET sharedX/Y immediately to stop drift calculation for the next card
      sharedX.value = 0;
      sharedY.value = 0;
      onSwipe(item, direction);
      setCurrentIndex((prev) => prev + 1);
    },
    [onSwipe, sharedX, sharedY],
  );

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
      <Stack width={stackWidth} height={stackHeight} position="relative">
        {visibleData
          .map((item, index) => (
            <AnimatedCard
              // @ts-ignore
              ref={index === 0 ? topCardRef : null}
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
              sharedX={sharedX}
              sharedY={sharedY}
            />
          ))
          .reverse()}
      </Stack>
    </StackContainer>
  );
}

SwipeCardStack.displayName = 'SwipeCardStack';
export default SwipeCardStack;
