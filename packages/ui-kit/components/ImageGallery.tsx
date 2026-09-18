import { useState, useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, useWindowDimensions, Pressable, Modal } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image, XStack, YStack, Text } from 'tamagui';

type ImageGalleryProps = {
  images: string[];
  initialIndex?: number;
};

export const ImageGallery = ({ images, initialIndex = 0 }: ImageGalleryProps) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const [zoomVisible, setZoomVisible] = useState<boolean>(false);
  const [zoomIndex, setZoomIndex] = useState<number>(initialIndex);
  const ASPECT_RATIO = 0.7;
  const galleryHeight = windowWidth / ASPECT_RATIO;

  const scale = useSharedValue<number>(1);
  const savedScale = useSharedValue<number>(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composed = Gesture.Simultaneous(pinch, doubleTap);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const index = event.nativeEvent.contentOffset.x / slideSize;
      const roundIndex = Math.round(index);
      if (roundIndex !== activeIndex) setActiveIndex(roundIndex);
    },
    [activeIndex],
  );

  const openZoom = useCallback(
    (index: number) => {
      setZoomIndex(index);
      scale.value = 1;
      savedScale.value = 1;
      setZoomVisible(true);
    },
    [scale, savedScale],
  );

  if (!images || images.length === 0) return null;

  return (
    <>
      <YStack position="relative" width={windowWidth} height={galleryHeight}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
        >
          {images.map((img, index) => (
            <Pressable key={index} onPress={() => openZoom(index)} style={{ width: windowWidth, height: galleryHeight }}>
              <YStack width={windowWidth} height={galleryHeight} justifyContent="center" alignItems="center" backgroundColor="$background">
                <Image source={{ uri: img, width: windowWidth, height: galleryHeight }} resizeMode="cover" />
              </YStack>
            </Pressable>
          ))}
        </ScrollView>

        <XStack position="absolute" bottom={20} left={0} right={0} justifyContent="center" gap="$2">
          {images.map((_, index) => (
            <YStack
              key={index}
              width="$1"
              height="$1"
              borderRadius="$full"
              backgroundColor={index === activeIndex ? '$primary' : '$neutral300'}
              opacity={index === activeIndex ? 1 : 0.5}
            />
          ))}
        </XStack>
        <Pressable
          onPress={() => openZoom(activeIndex)}
          style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
        >
          <Text color="white" fontSize="$2">
            {activeIndex + 1} / {images.length} • Tap to zoom
          </Text>
        </Pressable>
      </YStack>

      <Modal visible={zoomVisible} transparent animationType="fade" onRequestClose={() => setZoomVisible(false)}>
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.95)" justifyContent="center" alignItems="center">
          <Pressable onPress={() => setZoomVisible(false)} style={{ position: 'absolute', top: 40, right: 16, zIndex: 10, padding: 12 }}>
            <Text color="white" fontSize="$6">
              ✕
            </Text>
          </Pressable>
          <GestureDetector gesture={composed}>
            <Animated.View style={[{ width: windowWidth, height: windowHeight * 0.7, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
              <Image
                source={{ uri: images[zoomIndex], width: windowWidth, height: windowWidth / 0.7 }}
                resizeMode="contain"
                style={{ width: windowWidth, height: windowWidth / 0.7 } as unknown as Record<string, unknown>}
              />
            </Animated.View>
          </GestureDetector>
          <XStack gap="$2" marginTop="$4">
            {images.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setZoomIndex(idx);
                  scale.value = 1;
                  savedScale.value = 1;
                }}
              >
                <YStack width={48} height={64} borderRadius="$2" overflow="hidden" borderWidth={idx === zoomIndex ? 2 : 0} borderColor="$primary">
                  <Image source={{ uri: images[idx], width: 48, height: 64 }} resizeMode="cover" />
                </YStack>
              </Pressable>
            ))}
          </XStack>
          <Text color="white" fontSize="$2" marginTop="$2">
            Pinch to zoom • Double-tap to toggle
          </Text>
        </YStack>
      </Modal>
    </>
  );
};
