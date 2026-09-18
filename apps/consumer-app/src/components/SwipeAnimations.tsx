import { Star } from '@tamagui/lucide-icons';
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { YStack } from 'tamagui';

interface SuperLikeStarburstProps {
  trigger: number;
}

const NUM_PARTICLES = 12;

interface ParticleProps {
  index: number;
  trigger: number;
}

const Particle = ({ index, trigger }: ParticleProps) => {
  const progress = useSharedValue(0);

  // Calculate distance once per particle to avoid jitter in the UI thread
  const distance = React.useMemo(() => 150 + Math.random() * 50, []);

  useEffect(() => {
    if (trigger > 0) {
      progress.value = 0;
      progress.value = withDelay(
        index * 20,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    }
  }, [trigger, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const angle = (index * (360 / NUM_PARTICLES) * Math.PI) / 180;

    const translateX = progress.value * distance * Math.cos(angle);
    const translateY = progress.value * distance * Math.sin(angle);
    const scale = progress.value > 0 ? (1 - progress.value) * 1.5 : 0;
    const opacity = progress.value > 0 ? 1 - progress.value : 0;

    return {
      position: 'absolute',
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Star size={24} color="$info" fill="currentColor" />
    </Animated.View>
  );
};

export const SuperLikeStarburst = ({ trigger }: SuperLikeStarburstProps) => {
  return (
    <YStack
      position="absolute"
      top="50%"
      left="50%"
      width={0}
      height={0}
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
      zIndex={1000}
    >
      {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
        <Particle key={i} index={i} trigger={trigger} />
      ))}
    </YStack>
  );
};
