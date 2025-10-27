import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import axios from 'axios';
import { apiUrl } from '../../app/constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const SLIDE_INTERVAL = 3000; // 3 seconds per slide

interface ImageCarouselProps {
  images: ImageSourcePropType[];
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  dotBottom?: number;
}

const useDotAnimation = (currentIndex: Animated.SharedValue<number>, dotIndex: number) => {
  const AnimatedRe = require('react-native-reanimated'); // ensure hook context
  return AnimatedRe.useAnimatedStyle(() => ({
    backgroundColor: AnimatedRe.withSpring(
      currentIndex.value === dotIndex ? '#C2000E' : '#D9D9D9'
    ),
    transform: [
      {
        scale: AnimatedRe.withSpring(currentIndex.value === dotIndex ? 1.2 : 1),
      },
    ],
  }));
};

interface SlideshowItem {
  id: string;
  type: string;
  url: string;
  compressed_url?: string | null;
  title: string;
  description: string;
  order: string;
  status: string;
  updated_at: string;
  created_at: string;
  deleted_at: string | null;
}

export default function ImageCarousel({
  height = 240,
  autoPlay = false,
  autoPlayInterval = SLIDE_INTERVAL,
  dotBottom = 16,
}: ImageCarouselProps) {
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const currentIndex = useSharedValue(0);

  // Track the actual container width instead of global window width
  const [containerWidth, setContainerWidth] = useState(WINDOW_WIDTH);
  const slideWidth = useSharedValue(WINDOW_WIDTH);

  const [images, setImages] = useState<ImageSourcePropType[]>([]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      // Use the measured slide width to compute index
      const w = slideWidth.value || 1;
      currentIndex.value = Math.round(x / w);
    },
  });

  // Auto-sliding
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex.value + 1) % images.length;
      // Scroll using the measured container width
      scrollViewRef.current?.scrollTo({
        x: nextIndex * containerWidth,
        animated: true,
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length, containerWidth]);

  const PaginationDot = ({ index }: { index: number }) => {
    const dotStyle = useDotAnimation(currentIndex, index);
    return <Animated.View style={[styles.paginationDot, dotStyle]} />;
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get<{ result: SlideshowItem[] }>(
          apiUrl + 'slideshow',
          { headers }
        );
        const result = response.data?.result || [];
        const imageUrls = result.map((item) => ({ uri: item.url }));
        setImages(imageUrls);
      } catch (err: any) {
        console.log('Error fetching slideshow:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          console.timeLog('expired token');
        }
      }
    };
    fetchImages();
  }, []);

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width || WINDOW_WIDTH;
        setContainerWidth(w);
        slideWidth.value = w;
      }}
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <View key={index} style={[styles.slide, { width: containerWidth }]}>
            <Image
              source={image}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.pagination, { bottom: dotBottom }]}>
        {images.map((_, index) => (
          <PaginationDot key={index} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slide: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});