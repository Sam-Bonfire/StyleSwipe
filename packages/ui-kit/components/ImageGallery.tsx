import { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Image, XStack, YStack } from 'tamagui';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
}

export const ImageGallery = ({ images, initialIndex = 0 }: ImageGalleryProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const ASPECT_RATIO = 0.7;
  const galleryHeight = windowWidth / ASPECT_RATIO;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  if (!images || images.length === 0) return null;

  return (
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
          <YStack
            key={index}
            width={windowWidth}
            height={galleryHeight}
            justifyContent="center"
            alignItems="center"
            backgroundColor="$background"
          >
            <Image
              source={{ uri: img, width: windowWidth, height: galleryHeight }}
              resizeMode="cover"
            />
          </YStack>
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
    </YStack>
  );
};
