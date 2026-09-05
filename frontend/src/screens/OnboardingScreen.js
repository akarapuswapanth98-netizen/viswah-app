import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, createGradient } from '../theme';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Welcome to Viswah',
    subtitle: 'Your journey to musical mastery begins here',
    icon: 'music-note',
    gradient: COLORS.gradient.royal,
  },
  {
    id: '2',
    title: 'AI-Powered Learning',
    subtitle: 'Personalized lessons that adapt to your pace and style',
    icon: 'brain',
    gradient: COLORS.gradient.ocean,
  },
  {
    id: '3',
    title: 'Vocal Training',
    subtitle: 'Real-time pitch analysis and feedback from vocal gurus',
    icon: 'microphone',
    gradient: COLORS.gradient.sunset,
  },
  {
    id: '4',
    title: 'Create Your Music',
    subtitle: 'Write lyrics, compose songs, and express yourself',
    icon: 'creation',
    gradient: ['#9C27B0', '#E91E63'],
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <LinearGradient
        {...createGradient(item.gradient)}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={item.icon} size={100} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.textContainer}>
          <Animated.Text style={styles.title}>{item.title}</Animated.Text>
          <Animated.Text style={styles.subtitle}>{item.subtitle}</Animated.Text>
        </View>
      </LinearGradient>
    </View>
  );

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Home');
    }
  };

  const handleSkip = () => {
    navigation.replace('Home');
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
      />
      
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Animated.Text style={styles.skipText} onPress={handleSkip}>
          Skip
        </Animated.Text>
      </View>

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity },
                ]}
              />
            );
          })}
        </View>
        
        <View style={styles.nextButton}>
          <MaterialCommunityIcons
            name={currentIndex === ONBOARDING_DATA.length - 1 ? 'check' : 'arrow-right'}
            size={24}
            color={COLORS.white}
            onPress={handleNext}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  slide: {
    width,
    height,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxxxl,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: SPACING.xl,
  },
  skipText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingScreen;
