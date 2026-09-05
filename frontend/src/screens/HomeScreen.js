import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { SectionHeader, Tag, ProgressBar } from '../components/UIComponents';
import { api, authFetch, getAuthToken } from '../config/api';

const { width } = Dimensions.get('window');

const SECTIONS = [
  { key: 'header', delay: 0 },
  { key: 'continueLearning', delay: 100 },
  { key: 'vocalGuru', delay: 200 },
  { key: 'instruments', delay: 300 },
  { key: 'speechAnalysis', delay: 400 },
  { key: 'lyricsCreator', delay: 500 },
  { key: 'browseCourses', delay: 600 },
];

const ENROLLED_COURSES = [
  { id: 1, title: 'Vocal Fundamentals', progress: 0.65, instrument: 'vocal', stage: 1 },
  { id: 2, title: 'Piano Basics', progress: 0.32, instrument: 'piano', stage: 1 },
  { id: 3, title: 'Rhythm & Timing', progress: 0.88, instrument: 'drums', stage: 2 },
];

const BROWSE_COURSES = [
  { id: 4, title: 'Advanced Vocal', difficulty: 'advanced', stage: 3, instrument: 'vocal', progress: 0 },
  { id: 5, title: 'Jazz Piano', difficulty: 'intermediate', stage: 2, instrument: 'piano', progress: 0 },
  { id: 6, title: 'Drum Grooves', difficulty: 'beginner', stage: 1, instrument: 'drums', progress: 0 },
  { id: 7, title: 'Music Theory', difficulty: 'beginner', stage: 1, instrument: 'vocal', progress: 0 },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getInstrumentIcon = (instrument) => {
  const icons = { vocal: 'account-music', piano: 'piano', drums: 'drum' };
  return icons[instrument] || 'music-note';
};

const getStageColor = (stage) => {
  const colors = { 1: COLORS.stage1, 2: COLORS.stage2, 3: COLORS.stage3, 4: COLORS.stage4 };
  return colors[stage] || COLORS.primary;
};

const getDifficultyColor = (diff) => {
  const colors = { beginner: COLORS.success, intermediate: COLORS.warning, advanced: COLORS.error };
  return colors[diff] || COLORS.primary;
};

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState(ENROLLED_COURSES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('Student');
  const [notificationCount] = useState(3);

  const sectionAnimations = useRef(SECTIONS.map(() => new Animated.Value(0))).current;
  const cardScales = useRef({}).current;
  const waveAnimations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.6),
    new Animated.Value(0.4),
    new Animated.Value(0.5),
  ]).current;
  const waveAnimRefs = useRef([]);
  const pullRefreshAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    startWaveAnimations();
    startStaggeredEntrance();
    return () => {
      waveAnimRefs.current.forEach((anim) => {
        if (anim) anim.stop();
      });
    };
  }, []);

  const fetchData = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const enrolledRes = await authFetch(api.enrolled);
        if (enrolledRes.ok) {
          const enrolledData = await enrolledRes.json();
          if (Array.isArray(enrolledData) && enrolledData.length > 0) {
            setEnrolledCourses(enrolledData);
          }
        }
        const userRes = await authFetch(api.me);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.name) setUsername(userData.name.split(' ')[0]);
        }
      }
      const coursesRes = await authFetch(api.courses);
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        if (Array.isArray(coursesData)) setCourses(coursesData);
      }
    } catch (error) {
      // silent fail - use defaults
    } finally {
      setLoading(false);
    }
  };

  const startStaggeredEntrance = () => {
    const animations = SECTIONS.map((section, index) =>
      Animated.timing(sectionAnimations[index], {
        toValue: 1,
        duration: 400,
        delay: section.delay,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  };

  const startWaveAnimations = () => {
    waveAnimRefs.current = waveAnimations.map((anim, index) => {
      const loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 600 + index * 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 600 + index * 200,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();
      return loopAnim;
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Animated.spring(pullRefreshAnim, { toValue: 1, useNativeDriver: true }).start();
    await fetchData();
    Animated.spring(pullRefreshAnim, { toValue: 0, useNativeDriver: true }).start(() => {
      setRefreshing(false);
    });
  }, []);

  const handleCardPressIn = (cardId) => {
    if (!cardScales[cardId]) cardScales[cardId] = new Animated.Value(1);
    Animated.spring(cardScales[cardId], { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handleCardPressOut = (cardId) => {
    if (!cardScales[cardId]) cardScales[cardId] = new Animated.Value(1);
    Animated.spring(cardScales[cardId], { toValue: 1, useNativeDriver: true }).start();
  };

  const renderAnimatedSection = (key, children) => {
    const index = SECTIONS.findIndex((s) => s.key === key);
    const anim = sectionAnimations[index] || new Animated.Value(1);
    return (
      <Animated.View
        key={key}
        style={{
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    );
  };

  const renderHeader = () =>
    renderAnimatedSection('header', (
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.usernameText}>{username}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.gray700} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    ));

  const renderCircularProgress = (progress, size = 48) => {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.progressCircleBg,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            styles.progressCircleFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: COLORS.primary,
              borderTopColor: 'transparent',
              borderRightColor: progress > 0.25 ? COLORS.primary : 'transparent',
              borderBottomColor: progress > 0.5 ? COLORS.primary : 'transparent',
              borderLeftColor: progress > 0.75 ? COLORS.primary : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
        <View style={[styles.progressText, { width: size, height: size }]}>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    );
  };

  const renderContinueLearning = () =>
    renderAnimatedSection('continueLearning', (
      <View style={styles.sectionContainer}>
        <SectionHeader
          title="Continue Learning"
          subtitle="Pick up where you left off"
          action="See All"
          onAction={() => {}}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {enrolledCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.continueCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Course', { courseId: course.id })}
            >
              <LinearGradient
                {...createGradient(COLORS.gradient.royal)}
                style={styles.continueCardGradient}
              >
                <View style={styles.continueCardOverlay} />
                <View style={styles.continueCardContent}>
                  <View style={styles.continueCardTop}>
                    <MaterialCommunityIcons
                      name={getInstrumentIcon(course.instrument)}
                      size={24}
                      color="rgba(255,255,255,0.9)"
                    />
                    {renderCircularProgress(course.progress)}
                  </View>
                  <Text style={styles.continueCardTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={styles.continueCardStage}>Stage {course.stage}</Text>
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => navigation.navigate('Course', { courseId: course.id })}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ));

  const renderVocalGuru = () =>
    renderAnimatedSection('vocalGuru', (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('VocalGuru')}
        >
          <LinearGradient
            {...createGradient(['#6C63FF', '#9C27B0'])}
            style={styles.vocalGuruCard}
          >
            <View style={styles.vocalGuruContent}>
              <View style={styles.vocalGuruTextSection}>
                <Text style={styles.vocalGuruLabel}>VOCAL GURU</Text>
                <Text style={styles.vocalGuruTitle}>Master Your Voice</Text>
                <Text style={styles.vocalGuruSub}>
                  AI-powered personalized vocal training sessions
                </Text>
                <TouchableOpacity
                  style={styles.startSessionButton}
                  onPress={() => navigation.navigate('VocalGuru')}
                >
                  <MaterialCommunityIcons name="play" size={16} color={COLORS.primary} />
                  <Text style={styles.startSessionText}>Start Session</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.waveContainer}>
                {waveAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 40 + index * 8],
                        }),
                        backgroundColor: `rgba(255,255,255,${0.5 + index * 0.1})`,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ));

  const renderPianoIllustration = () => (
    <View style={styles.pianoIllustration}>
      <View style={styles.pianoKeys}>
        <View style={styles.pianoKeyWhite} />
        <View style={styles.pianoKeyBlack} />
        <View style={[styles.pianoKeyWhite, { marginHorizontal: 6 }]} />
        <View style={styles.pianoKeyBlack} />
        <View style={styles.pianoKeyWhite} />
      </View>
    </View>
  );

  const renderDrumIllustration = () => (
    <View style={styles.drumIllustration}>
      <View style={styles.drumGrid}>
        {['#FF6B6B', '#4ECDC4', '#FFC107', '#6C63FF'].map((color, index) => (
          <View
            key={index}
            style={[styles.drumPad, { backgroundColor: color }]}
          />
        ))}
      </View>
    </View>
  );

  const renderInstruments = () =>
    renderAnimatedSection('instruments', (
      <View style={styles.sectionContainer}>
        <SectionHeader title="Virtual Instruments" subtitle="Play & Create" />
        <View style={styles.instrumentsRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => handleCardPressIn('piano')}
            onPressOut={() => handleCardPressOut('piano')}
            onPress={() => navigation.navigate('Piano')}
            style={styles.instrumentCardWrapper}
          >
            <LinearGradient
              {...createGradient(['#6C63FF', '#9C27B0'])}
              style={styles.instrumentCard}
            >
              {renderPianoIllustration()}
              <Text style={styles.instrumentTitle}>Piano</Text>
              <Text style={styles.instrumentSub}>Play now</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => handleCardPressIn('drums')}
            onPressOut={() => handleCardPressOut('drums')}
            onPress={() => navigation.navigate('Drums')}
            style={styles.instrumentCardWrapper}
          >
            <LinearGradient
              {...createGradient(['#FF6B6B', '#FF8E53'])}
              style={styles.instrumentCard}
            >
              {renderDrumIllustration()}
              <Text style={styles.instrumentTitle}>Drums</Text>
              <Text style={styles.instrumentSub}>Play now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    ));

  const renderSpeechAnalysis = () =>
    renderAnimatedSection('speechAnalysis', (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SpeechAnalysis')}
        >
          <LinearGradient
            {...createGradient(['#4ECDC4', '#44A08D'])}
            style={styles.featureCard}
          >
            <View style={styles.featureCardContent}>
              <View style={styles.featureCardLeft}>
                <View style={styles.featureIconCircle}>
                  <MaterialCommunityIcons name="microphone" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.featureTitle}>Speech Analysis</Text>
                  <Text style={styles.featureSub}>Analyze your pronunciation & pitch</Text>
                </View>
              </View>
              <View style={styles.speechWaveContainer}>
                {waveAnimations.slice(0, 3).map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.speechWaveBar,
                      {
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [4, 18 + index * 4],
                        }),
                        backgroundColor: `rgba(255,255,255,${0.6 + index * 0.12})`,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={() => navigation.navigate('SpeechAnalysis')}
            >
              <Text style={styles.practiceButtonText}>Practice Now</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ));

  const renderLyricsCreator = () =>
    renderAnimatedSection('lyricsCreator', (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('LyricsCreator')}
        >
          <LinearGradient
            {...createGradient(['#9C27B0', '#E91E63'])}
            style={styles.featureCard}
          >
            <View style={styles.featureCardContent}>
              <View style={styles.featureCardLeft}>
                <View style={styles.featureIconCircle}>
                  <MaterialCommunityIcons name="pen" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.featureTitle}>Lyrics Creator</Text>
                  <Text style={styles.featureSub}>AI-assisted songwriting</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="music-note-plus"
                size={32}
                color="rgba(255,255,255,0.4)"
              />
            </View>
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={() => navigation.navigate('LyricsCreator')}
            >
              <Text style={styles.practiceButtonText}>Write Lyrics</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ));

  const renderBrowseCourses = () =>
    renderAnimatedSection('browseCourses', (
      <View style={styles.sectionContainer}>
        <SectionHeader title="Browse Courses" subtitle="Discover new skills" action="See All" onAction={() => {}} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {BROWSE_COURSES.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.browseCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Course', { courseId: course.id })}
            >
              <View style={styles.browseCardInner}>
                <View style={styles.browseCardTop}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: `${getDifficultyColor(course.difficulty)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(course.difficulty) },
                      ]}
                    >
                      {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.stageChip}>
                    <Text style={styles.stageChipText}>Stage {course.stage}</Text>
                  </View>
                </View>
                <View style={styles.browseCardIcon}>
                  <MaterialCommunityIcons
                    name={getInstrumentIcon(course.instrument)}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.browseCardTitle} numberOfLines={1}>
                  {course.title}
                </Text>
                <ProgressBar progress={course.progress} height={4} color={COLORS.primary} />
                <View style={styles.browseCardFooter}>
                  <Text style={styles.browseLessons}>12 Lessons</Text>
                  <MaterialCommunityIcons name="play-circle-outline" size={20} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressViewOffset={20}
          />
        }
      >
        {renderHeader()}
        {renderContinueLearning()}
        {renderVocalGuru()}
        {renderInstruments()}
        {renderSpeechAnalysis()}
        {renderLyricsCreator()}
        {renderBrowseCourses()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  // Header
  headerWrapper: {
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '400',
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Continue Learning
  horizontalScroll: {
    paddingRight: SPACING.lg,
  },
  continueCard: {
    width: width * 0.42,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  continueCardGradient: {
    padding: SPACING.lg,
    minHeight: 180,
    position: 'relative',
  },
  continueCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: BORDER_RADIUS.xl,
  },
  continueCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  continueCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  continueCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  continueCardStage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.sm,
  },
  continueButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  continueButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Circular Progress
  progressCircleBg: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  progressCircleFill: {
    position: 'absolute',
  },
  progressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Vocal Guru
  vocalGuruCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    minHeight: 160,
    ...SHADOWS.medium,
  },
  vocalGuruContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vocalGuruTextSection: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  vocalGuruLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  vocalGuruTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  vocalGuruSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  startSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  startSessionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 50,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },

  // Instruments
  instrumentsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  instrumentCardWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  instrumentCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  instrumentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  instrumentSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Piano Illustration
  pianoIllustration: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pianoKeys: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
  },
  pianoKeyWhite: {
    width: 16,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 3,
    marginHorizontal: 2,
  },
  pianoKeyBlack: {
    width: 12,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    marginTop: 0,
    marginHorizontal: 2,
    zIndex: 1,
  },

  // Drum Illustration
  drumIllustration: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  drumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 56,
    gap: 4,
  },
  drumPad: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },

  // Feature Cards (Speech & Lyrics)
  featureCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  featureCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  featureSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  speechWaveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 30,
  },
  speechWaveBar: {
    width: 4,
    borderRadius: 2,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  practiceButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Browse Courses
  browseCard: {
    width: width * 0.44,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  browseCardInner: {
    padding: SPACING.lg,
  },
  browseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  difficultyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stageChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray100,
  },
  stageChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  browseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  browseCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  browseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  browseLessons: {
    fontSize: 12,
    color: COLORS.gray500,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default HomeScreen;
