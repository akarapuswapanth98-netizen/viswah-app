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
  FlatList,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ErrorBoundary from './src/components/ErrorBoundary';
import Sidebar from './src/components/Sidebar';
import TopBar from './src/components/TopBar';
import AmbientBackground from './src/components/AmbientBackground';
import { COLORS, createGradient, BORDER_RADIUS, SHADOWS, LAYOUT, GLASS } from './src/theme';

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
const IS_WEB = Platform.OS === 'web';
const IS_DESKTOP = IS_WEB && SCREEN_WIDTH > 900;
const Stack = createStackNavigator();

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
          Animated.timing(translateY, { toValue: -20, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: duration * 0.3, useNativeDriver: true }),
            Animated.delay(duration * 0.4),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.particle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, left: startX, transform: [{ translateY }], opacity }]}
    />
  );
};

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
          Animated.timing(translateY, { toValue: -60, duration, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: rotateDeg, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.8, duration: duration * 0.15, useNativeDriver: true }),
            Animated.delay(duration * 0.6),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.25, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.Text
      style={[styles.floatingNote, { fontSize: size, left: startX, transform: [{ translateY }, { rotate: rotate.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) }], opacity }]}
    >
      {symbol}
    </Animated.Text>
  );
};

const SplashScreen = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const noteSymbols = ['♪', '♫', '♬', '♩', '♪', '♫'];
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ id: i, delay: Math.random() * 2000, color: ['#8A2BE2', '#00F5D4', '#FF007F', '#FFC107', '#00D4FF'][Math.floor(Math.random() * 5)] })), []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(logoRotate, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.timing(progressWidth, { toValue: 1, duration: 2500, useNativeDriver: false }).start(() => { setTimeout(onFinish, 300); });
  }, []);

  const progressInterpolate = progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.splashContainer}>
      <LinearGradient {...createGradient(['#0B0D17', '#111424', '#161B30'])} style={styles.splashGradient}>
        <View style={styles.particlesContainer}>
          {particles.map((p) => (<Particle key={p.id} delay={p.delay} color={p.color} />))}
        </View>
        <View style={styles.notesContainer}>
          {noteSymbols.map((symbol, i) => (<MusicNote key={i} symbol={symbol} delay={i * 400} />))}
        </View>
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }, { rotate: logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          <View style={styles.logoCircle}>
            <LinearGradient colors={['#8A2BE2', '#00F5D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradientBg}>
              <MaterialCommunityIcons name="music-note" size={60} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.splashTitle}>VISWAH</Text>
          <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
            Your Musical Journey Begins
          </Animated.Text>
        </Animated.View>
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
        Animated.timing(translateX, { toValue: xDist, duration: 900, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: yDist, duration: 900, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: Math.random() * 720 - 360, duration: 900, useNativeDriver: true }),
        Animated.sequence([Animated.delay(400), Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true })]),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View style={[styles.confettiDot, { width: size, height: size, backgroundColor: color, borderRadius: size / 2, left: x, top: y, transform: [{ translateX }, { translateY }, { rotate: rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) }], opacity }]} />
  );
};

const ONBOARDING_DATA = [
  { id: '1', title: 'Learn Any Instrument', subtitle: 'AI-powered interactive lessons for piano, drums, vocals, and more.', illustration: 'piano', gradient: ['#8A2BE2', '#00F5D4'] },
  { id: '2', title: 'Vocal Training', subtitle: 'Real-time pitch analysis and personalized vocal exercises.', illustration: 'mic', gradient: ['#FF007F', '#FF6B6B'] },
  { id: '3', title: 'Track Progress', subtitle: 'Set goals, earn achievements, and watch your skills grow.', illustration: 'ring', gradient: ['#00D4FF', '#8A2BE2'] },
];

const PianoIllustration = () => {
  const anims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    const loops = anims.map((a, i) => Animated.loop(Animated.sequence([Animated.delay(i * 600), Animated.timing(a, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(a, { toValue: 0, duration: 400, useNativeDriver: true })])));
    Animated.parallel(loops).start();
  }, []);
  return (
    <View style={styles.pianoIllust}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Animated.View key={i} style={[styles.pianoKeyIllust, i % 2 === 0 ? styles.pianoKeyWhiteIllust : styles.pianoKeyBlackIllust, { transform: [{ scaleY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) }] }]} />
      ))}
    </View>
  );
};

const MicIllustration = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })])).start(); }, []);
  return (
    <View style={styles.micIllust}>
      <Animated.View style={[styles.micRing, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.15], outputRange: [0.3, 0.1] }) }]} />
      <View style={styles.micCore}>
        <MaterialCommunityIcons name="microphone" size={48} color={COLORS.white} />
      </View>
    </View>
  );
};

const ProgressRingIllust = () => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(progress, { toValue: 0.85, duration: 2000, useNativeDriver: false }).start(); }, []);
  const circumference = 2 * Math.PI * 40;
  return (
    <View style={styles.ringIllust}>
      <View style={styles.ringBg} />
      <View style={[styles.ringFill, { borderTopColor: progress._value > 0.25 ? COLORS.neon : 'transparent', borderRightColor: progress._value > 0.5 ? COLORS.neon : 'transparent', borderBottomColor: progress._value > 0.75 ? COLORS.neon : 'transparent', borderColor: COLORS.neon }]} />
      <View style={styles.ringCenter}>
        <Text style={styles.ringText}>85%</Text>
      </View>
    </View>
  );
};

const OnboardingFlow = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiParticles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ id: i, x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 20, y: SCREEN_HEIGHT - 140, color: ['#8A2BE2', '#00F5D4', '#FF007F', '#FFC107', '#00D4FF'][Math.floor(Math.random() * 5)], delay: Math.random() * 300 })), []);

  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })])).start(); }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => { if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index || 0); }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < 2) { flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true }); }
  };
  const handleSkip = () => { flatListRef.current?.scrollToIndex({ index: 2, animated: true }); };
  const handleGetStarted = () => { setShowConfetti(true); setTimeout(onComplete, 800); };

  const renderOnboardingItem = ({ item }) => (
    <View style={styles.onboardingPage}>
      <LinearGradient {...createGradient(item.gradient)} style={styles.onboardingGradient}>
        <View style={styles.illustrationArea}>
          <Animated.View style={[styles.illustContainer, { transform: [{ scale: pulseAnim }] }]}>
            {item.illustration === 'piano' && <PianoIllustration />}
            {item.illustration === 'mic' && <MicIllustration />}
            {item.illustration === 'ring' && <ProgressRingIllust />}
          </Animated.View>
        </View>
        <View style={styles.onboardingTextContainer}>
          <Text style={styles.onboardingTitle}>{item.title}</Text>
          <Text style={styles.onboardingSubtitle}>{item.subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const isLastScreen = currentIndex === 2;

  return (
    <View style={styles.onboardingContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {!isLastScreen && (<TouchableOpacity style={styles.skipButton} onPress={handleSkip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>)}
      <FlatList ref={flatListRef} data={ONBOARDING_DATA} renderItem={renderOnboardingItem} keyExtractor={(item) => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })} scrollEventThrottle={16} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} />
      <View style={styles.onboardingBottom}>
        <View style={styles.dotsRow}>
          {ONBOARDING_DATA.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: i === currentIndex ? COLORS.neon : 'rgba(255,255,255,0.3)' }]} />;
          })}
        </View>
        {isLastScreen ? (
          <View style={styles.getStartedWrapper}>
            {showConfetti && confettiParticles.map((p) => (<ConfettiParticle key={p.id} x={p.x} y={p.y} color={p.color} delay={p.delay} />))}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleGetStarted}>
                <LinearGradient colors={['#8A2BE2', '#00F5D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.getStartedBtn}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
              <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Next</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.neon} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const forSlideFade = ({ current, layouts }) => ({
  cardStyle: {
    opacity: current.progress,
    transform: [{ translateX: current.progress.interpolate({ inputRange: [0, 1], outputRange: [layouts.screen.width * 0.3, 0] }) }, { scale: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
  },
});

const FULL_SCREEN_ROUTES = ['Piano', 'Drums'];

function DesktopLayout({ children }) {
  return (
    <View style={styles.desktopRoot}>
      <Sidebar navigation={children.props?.navigation} currentRoute={children.props?.route?.name} />
      <View style={styles.desktopMain}>
        <TopBar />
        <View style={styles.desktopContent}>
          {children}
        </View>
      </View>
      <AmbientBackground />
    </View>
  );
}

function MainNavigator() {
  const [currentRoute, setCurrentRoute] = useState('Home');
  const navRef = useRef(null);

  return (
    <View style={styles.desktopRoot}>
      {IS_DESKTOP && (
        <View style={styles.sidebarWrapper}>
          <Sidebar navigation={navRef.current} currentRoute={currentRoute} />
        </View>
      )}
      <View style={styles.desktopMain}>
        {IS_DESKTOP && <TopBar username="Student" />}
        <View style={styles.desktopContent}>
          <NavigationContainer
            ref={navRef}
            onStateChange={(state) => {
              if (state) {
                const route = state.routes[state.index];
                setCurrentRoute(route.name);
              }
            }}
          >
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
                cardStyle: { backgroundColor: COLORS.bg },
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
              <Stack.Screen name="Piano" component={PianoScreen} options={{ cardStyle: { backgroundColor: '#0B0D17' } }} />
              <Stack.Screen name="Drums" component={DrumsScreen} options={{ cardStyle: { backgroundColor: '#0B0D17' } }} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
      {IS_DESKTOP && <AmbientBackground />}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [appState, setAppState] = useState('splash');

  const handleSplashFinish = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setAppState(hasLaunched ? 'main' : 'onboarding');
    } catch (e) {
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setAppState('main');
  };

  if (appState === 'splash') return <SplashScreen onFinish={handleSplashFinish} />;
  if (appState === 'onboarding') return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1 },
  splashGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  particlesContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  particle: { position: 'absolute' },
  notesContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  floatingNote: { position: 'absolute', color: 'rgba(255,255,255,0.4)' },
  logoContainer: { alignItems: 'center', zIndex: 10 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', marginBottom: 24, ...SHADOWS.large },
  logoGradientBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { fontSize: 44, fontWeight: '800', color: COLORS.white, letterSpacing: 6, marginBottom: 8 },
  splashTagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  progressContainer: { position: 'absolute', bottom: 80, width: SCREEN_WIDTH * 0.6, alignItems: 'center' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.neon, borderRadius: 2 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
  onboardingContainer: { flex: 1, backgroundColor: COLORS.bg },
  onboardingPage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  onboardingGradient: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40, justifyContent: 'space-between' },
  illustrationArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  onboardingTextContainer: { paddingHorizontal: 36, paddingBottom: 40, alignItems: 'center' },
  onboardingTitle: { fontSize: 30, fontWeight: '800', color: COLORS.white, marginBottom: 14, textAlign: 'center', letterSpacing: 1 },
  onboardingSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  skipButton: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, right: 24, zIndex: 20, paddingVertical: 8, paddingHorizontal: 16 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
  onboardingBottom: { alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 50 : 36, zIndex: 20 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  nextBtnText: { color: COLORS.neon, fontSize: 17, fontWeight: '700', marginRight: 8 },
  getStartedWrapper: { alignItems: 'center', overflow: 'visible' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 56, borderRadius: 30, ...SHADOWS.neon },
  getStartedText: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginRight: 10, letterSpacing: 0.5 },
  confettiDot: { position: 'absolute', zIndex: 100 },
  pianoIllust: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 },
  pianoKeyIllust: { width: 24, borderRadius: 4 },
  pianoKeyWhiteIllust: { height: 120, backgroundColor: 'rgba(255,255,255,0.9)' },
  pianoKeyBlackIllust: { height: 75, backgroundColor: 'rgba(0,0,0,0.8)', marginHorizontal: -8, zIndex: 1 },
  micIllust: { alignItems: 'center', justifyContent: 'center', width: 160, height: 160 },
  micRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  micCore: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  ringIllust: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ringBg: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: 'rgba(255,255,255,0.15)' },
  ringFill: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '-90deg' }] },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  illustContainer: { alignItems: 'center', justifyContent: 'center' },
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.bg },
  sidebarWrapper: { width: LAYOUT.sidebarWidth },
  desktopMain: { flex: 1, backgroundColor: 'transparent' },
  desktopContent: { flex: 1 },
});
