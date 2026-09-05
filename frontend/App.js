import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ErrorBoundary from './src/components/ErrorBoundary';
import { COLORS, createGradient, BORDER_RADIUS, SHADOWS } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import CourseScreen from './src/screens/CourseScreen';
import LessonScreen from './src/screens/LessonScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import VocalGuruScreen from './src/screens/VocalGuruScreen';
import SpeechAnalysisScreen from './src/screens/SpeechAnalysisScreen';
import LyricsCreatorScreen from './src/screens/LyricsCreatorScreen';
import PianoScreen from './src/screens/PianoScreen';
import DrumsScreen from './src/screens/DrumsScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const Stack = createStackNavigator();

// ─────────────────────────────────────────────
// PARTICLE COMPONENT FOR SPLASH BACKGROUND
// ─────────────────────────────────────────────
const Particle = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const size = useMemo(() => Math.random() * 6 + 3, []);
  const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const duration = useMemo(() => Math.random() * 3000 + 4000, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -20,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.delay(duration * 0.4),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// FLOATING MUSIC NOTE FOR SPLASH
// ─────────────────────────────────────────────
const MusicNote = ({ symbol, delay }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const startX = useMemo(() => Math.random() * (SCREEN_WIDTH - 40), []);
  const duration = useMemo(() => Math.random() * 3000 + 4000, []);
  const size = useMemo(() => Math.random() * 16 + 20, []);
  const rotateDeg = useMemo(() => Math.random() * 60 - 30, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: rotateDeg,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: duration * 0.15,
              useNativeDriver: true,
            }),
            Animated.delay(duration * 0.6),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.25,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingNote,
        {
          fontSize: size,
          left: startX,
          transform: [
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [-30, 30],
                outputRange: ['-30deg', '30deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
};

// ─────────────────────────────────────────────
// PREMIUM SPLASH SCREEN
// ─────────────────────────────────────────────
const SplashScreen = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;

  const noteSymbols = ['♪', '♫', '♬', '♩', '♪', '♫'];

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2000,
        color:
          ['#6C63FF', '#4ECDC4', '#FF6B6B', '#FFC107', '#8B85FF'][
            Math.floor(Math.random() * 5)
          ],
      })),
    []
  );

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fade in
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Progress bar fill over 2.5s
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(onFinish, 300);
    });
  }, []);

  const progressInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.splashContainer}>
      <LinearGradient
        {...createGradient(['#1A1A2E', '#16213E', '#0F3460'])}
        style={styles.splashGradient}
      >
        {/* Particle Background */}
        <View style={styles.particlesContainer}>
          {particles.map((p) => (
            <Particle key={p.id} delay={p.delay} color={p.color} />
          ))}
        </View>

        {/* Floating Music Notes */}
        <View style={styles.notesContainer}>
          {noteSymbols.map((symbol, i) => (
            <MusicNote key={i} symbol={symbol} delay={i * 400} />
          ))}
        </View>

        {/* Logo Area */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                {
                  rotate: logoRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <LinearGradient
              colors={['#6C63FF', '#4ECDC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradientBg}
            >
              <MaterialCommunityIcons
                name="music-note"
                size={60}
                color={COLORS.white}
              />
            </LinearGradient>
          </View>

          <Text style={styles.splashTitle}>VISWAH</Text>
          <Animated.Text
            style={[
              styles.splashTagline,
              { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            Your Musical Journey Begins
          </Animated.Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressInterpolate }]} />
          </View>
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─────────────────────────────────────────────
// CONFETTI PARTICLE FOR GET STARTED BUTTON
// ─────────────────────────────────────────────
const ConfettiParticle = ({ x, y, color, delay }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const size = useMemo(() => Math.random() * 8 + 4, []);
  const direction = useMemo(() => (Math.random() > 0.5 ? 1 : -1), []);
  const xDist = useMemo(() => (Math.random() * 120 + 40) * direction, [direction]);
  const yDist = useMemo(() => -(Math.random() * 150 + 60), []);

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: xDist,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: yDist,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 720 - 360,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.confettiDot,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
          left: x,
          top: y,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
          ],
          opacity,
        },
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// ANIMATED MUSICAL STAFF ILLUSTRATION
// ─────────────────────────────────────────────
const MusicalStaff = ({ progress }) => {
  const lineScale = useRef(new Animated.Value(0)).current;
  const noteOpacities = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const noteScales = noteOpacities.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    if (progress > 0.2) {
      Animated.timing(lineScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      noteOpacities.forEach((op, i) => {
        Animated.sequence([
          Animated.delay(i * 150 + 300),
          Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(noteScales[i], { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }
  }, [progress]);

  const notePositions = [
    { left: 40, top: 15, color: '#6C63FF' },
    { left: 95, top: 35, color: '#4ECDC4' },
    { left: 145, top: 8, color: '#FF6B6B' },
    { left: 200, top: 28, color: '#FFC107' },
  ];

  return (
    <View style={styles.staffContainer}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.staffLine,
            {
              top: 8 + i * 14,
              transform: [{ scaleX: lineScale }],
              opacity: lineScale,
            },
          ]}
        />
      ))}
      {notePositions.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            styles.staffNote,
            {
              left: pos.left,
              top: pos.top,
              backgroundColor: pos.color,
              opacity: noteOpacities[i],
              transform: [{ scale: noteScales[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// ANIMATED BOUNCING AVATAR
// ─────────────────────────────────────────────
const BouncingAvatar = ({ progress }) => {
  const bounceY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (progress > 0.2) {
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: -18, duration: 500, useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.avatarContainer,
        {
          transform: [{ translateY: bounceY }, { scale }],
        },
      ]}
    >
      <LinearGradient colors={['#6C63FF', '#9C27B0']} style={styles.avatarGradient}>
        <MaterialCommunityIcons name="account" size={50} color={COLORS.white} />
      </LinearGradient>
      <View style={styles.avatarPulseRing} />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// ANIMATED PROGRESS RING
// ─────────────────────────────────────────────
const ProgressRing = ({ progress }) => {
  const fillProgress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (progress > 0.2) {
      Animated.spring(scale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();
      Animated.timing(fillProgress, {
        toValue: 0.75,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }
  }, [progress]);

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View style={[styles.ringContainer, { transform: [{ scale }] }]}>
      <View style={styles.ringOuter}>
        <View style={styles.ringBgCircle} />
        <Animated.View
          style={[
            styles.ringFill,
            {
              borderColor: '#4ECDC4',
              transform: [{ rotate: '-90deg' }],
              borderWidth: 8,
              opacity: fillProgress,
            },
          ]}
        />
        <View style={styles.ringCenter}>
          <MaterialCommunityIcons name="chart-line" size={36} color="#6C63FF" />
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// ONBOARDING DOT INDICATOR
// ─────────────────────────────────────────────
const DotIndicator = ({ index, scrollX }) => {
  const dotWidths = [0, 1, 2].map((i) => {
    const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
    return scrollX.interpolate({
      inputRange,
      outputRange: [8, 24, 8],
      extrapolate: 'clamp',
    });
  });

  const dotColors = [0, 1, 2].map((i) => {
    const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
    return scrollX.interpolate({
      inputRange,
      outputRange: ['rgba(255,255,255,0.3)', '#FFFFFF', 'rgba(255,255,255,0.3)'],
      extrapolate: 'clamp',
    });
  });

  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: dotWidths[i],
              backgroundColor: dotColors[i],
            },
          ]}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// ONBOARDING SCREEN
// ─────────────────────────────────────────────
const OnboardingFlow = ({ onComplete }) => {
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for buttons
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleNext = () => {
    if (currentIndex < 2) {
      flatListRef.current?.scrollToOffset({ offset: (currentIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const onboardingData = [
    {
      id: '1',
      title: 'Learn Music',
      subtitle: 'Master instruments and vocals with interactive lessons designed just for you',
      gradient: ['#6C63FF', '#4ECDC4'],
      illustration: 'staff',
    },
    {
      id: '2',
      title: 'Practice with AI Gurus',
      subtitle: 'Get personalized guidance from AI music mentors that adapt to your skill level',
      gradient: ['#9C27B0', '#E91E63'],
      illustration: 'avatar',
    },
    {
      id: '3',
      title: 'Track Progress',
      subtitle: 'Watch yourself improve with detailed analytics and milestone celebrations',
      gradient: ['#4ECDC4', '#44A08D'],
      illustration: 'ring',
    },
  ];

  // Confetti state for last screen
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 140 });

  const confettiColors = ['#6C63FF', '#4ECDC4', '#FF6B6B', '#FFC107', '#8B85FF', '#FF8E53', '#4CAF50'];
  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        delay: Math.random() * 200,
        x: confettiOrigin.x,
        y: confettiOrigin.y,
      })),
    [showConfetti]
  );

  const handleGetStarted = () => {
    setShowConfetti(true);
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const renderOnboardingItem = ({ item, index }) => {
    // Parallax offset
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const parallaxX = scrollX.interpolate({
      inputRange,
      outputRange: [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
      extrapolate: 'clamp',
    });
    const parallaxOpacity = scrollX.interpolate({
      inputRange: [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.onboardingPage, { opacity: parallaxOpacity }]}>
        <LinearGradient
          {...createGradient(item.gradient)}
          style={styles.onboardingGradient}
        >
          {/* Illustration Area */}
          <Animated.View
            style={[
              styles.illustrationArea,
              { transform: [{ translateX: parallaxX }] },
            ]}
          >
            {item.illustration === 'staff' && <MusicalStaff progress={1} />}
            {item.illustration === 'avatar' && <BouncingAvatar progress={1} />}
            {item.illustration === 'ring' && <ProgressRing progress={1} />}
          </Animated.View>

          {/* Text Content */}
          <View style={styles.onboardingTextContainer}>
            <Text style={styles.onboardingTitle}>{item.title}</Text>
            <Text style={styles.onboardingSubtitle}>{item.subtitle}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const isLastScreen = currentIndex === 2;

  return (
    <View style={styles.onboardingContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip Button */}
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* FlatList */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Bottom Controls */}
      <View style={styles.onboardingBottom}>
        <DotIndicator index={currentIndex} scrollX={scrollX} />

        {isLastScreen ? (
          <View style={styles.getStartedWrapper}>
            {/* Confetti */}
            {showConfetti &&
              confettiParticles.map((p) => (
                <ConfettiParticle
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  color={p.color}
                  delay={p.delay}
                />
              ))}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleGetStarted}>
                <LinearGradient
                  colors={['#6C63FF', '#4ECDC4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.getStartedBtn}
                >
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
              <LinearGradient
                colors={['#FFFFFF', 'rgba(255,255,255,0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#6C63FF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// CUSTOM TRANSITIONS
// ─────────────────────────────────────────────
const forSlideFade = ({ current, next, layouts }) => ({
  cardStyle: {
    opacity: current.progress,
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width * 0.3, 0],
        }),
      },
      {
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  },
});

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [appState, setAppState] = useState('splash'); // 'splash' | 'onboarding' | 'main'

  useEffect(() => {
    // Initialization handled by splash screen
  }, []);

  const handleSplashFinish = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setAppState('onboarding');
      } else {
        setAppState('main');
      }
    } catch (e) {
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setAppState('main');
  };

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: forSlideFade,
          transitionSpec: {
            open: { animation: 'spring', config: { damping: 22, stiffness: 180 } },
            close: { animation: 'timing', config: { duration: 280 } },
          },
          cardStyle: { backgroundColor: '#F8F9FE' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="VocalGuru" component={VocalGuruScreen} />
        <Stack.Screen name="SpeechAnalysis" component={SpeechAnalysisScreen} />
        <Stack.Screen name="LyricsCreator" component={LyricsCreatorScreen} />
        <Stack.Screen name="Course" component={CourseScreen} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Piano" component={PianoScreen} />
        <Stack.Screen name="Drums" component={DrumsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Splash Screen ──
  splashContainer: {
    flex: 1,
  },
  splashGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  notesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingNote: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.4)',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.large,
  },
  logoGradientBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 6,
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    width: SCREEN_WIDTH * 0.6,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 0.5,
  },

  // ── Onboarding ──
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  onboardingPage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  onboardingGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'space-between',
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  onboardingTextContainer: {
    paddingHorizontal: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 24,
    zIndex: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  onboardingBottom: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
    zIndex: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    ...SHADOWS.medium,
  },
  nextBtnText: {
    color: '#6C63FF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  getStartedWrapper: {
    alignItems: 'center',
    overflow: 'visible',
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 30,
    ...SHADOWS.large,
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 0.5,
  },
  confettiDot: {
    position: 'absolute',
    zIndex: 100,
  },

  // ── Illustrations ──
  staffContainer: {
    width: 250,
    height: 80,
    position: 'relative',
  },
  staffLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  staffNote: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    ...SHADOWS.small,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  avatarPulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 110,
    height: 110,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBgCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});