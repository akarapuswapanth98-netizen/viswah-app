import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, Tag, ProgressBar } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAGE_COLORS = {
  1: COLORS.stage1,
  2: COLORS.stage2,
  3: COLORS.stage3,
  4: COLORS.stage4,
};

const DIFFICULTY_COLORS = {
  beginner: COLORS.accent,
  intermediate: COLORS.warning,
  advanced: COLORS.secondary,
};

const INSTRUMENT_ICONS = {
  piano: 'piano',
  guitar: 'guitar',
  drums: 'drum',
  vocals: 'microphone',
  violin: 'violin',
  default: 'music',
};

const CourseScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef([]);
  const checkAnimations = useRef({});

  useEffect(() => {
    fetchData();
    animatePulse();
  }, []);

  useEffect(() => {
    if (lessons.length > 0) {
      animateCards();
    }
  }, [lessons.length]);

  useEffect(() => {
    const pct = getProgressPercent();
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, lessons.length]);

  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchData = async () => {
    try {
      const [courseRes, lessonsRes, enrolledRes, progressRes] = await Promise.all([
        authFetch(api.course(courseId)),
        authFetch(api.courseLessons(courseId)),
        authFetch(api.enrolled),
        authFetch(`${api.progress}?course_id=${courseId}`),
      ]);

      if (courseRes.ok) setCourse(await courseRes.json());
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(Array.isArray(data) ? data : []);
      }
      if (enrolledRes.ok) {
        const data = await enrolledRes.json();
        const enrolled = Array.isArray(data) ? data : [];
        setIsEnrolled(enrolled.some((e) => e.course_id === parseInt(courseId)));
      }
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const animateCards = () => {
    cardAnimations.current = lessons.map(() => new Animated.Value(0));
    const stagger = lessons.map((_, i) =>
      Animated.timing(cardAnimations.current[i], {
        toValue: 1,
        duration: 400,
        delay: i * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, stagger).start();
  };

  const getLessonProgress = (lessonId) =>
    progress.find((p) => p.lesson_id === lessonId && p.completed);

  const getCompletedCount = () => progress.filter((p) => p.completed).length;

  const getProgressPercent = () => {
    if (lessons.length === 0) return 0;
    return getCompletedCount() / lessons.length;
  };

  const getStageColor = () => STAGE_COLORS[course?.stage] || COLORS.primary;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await authFetch(api.enroll(courseId), { method: 'POST' });
      if (res.ok) {
        setIsEnrolled(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkComplete = async (lessonId) => {
    setCompletingLesson(lessonId);
    try {
      const res = await authFetch(api.progressById(lessonId), {
        method: 'POST',
        body: JSON.stringify({ completed: true, score: 100 }),
      });
      if (res.ok) {
        checkAnimations.current[lessonId] = new Animated.Value(0);
        Animated.spring(checkAnimations.current[lessonId], {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }).start(() => {
          setProgress((prev) => [...prev, { lesson_id: lessonId, completed: true }]);
          setCompletingLesson(null);
        });
      }
    } catch (e) {
      console.error(e);
      setCompletingLesson(null);
    }
  };

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  const stageColor = getStageColor();
  const completedCount = getCompletedCount();
  const totalCount = lessons.length;
  const progressPercent = getProgressPercent();
  const nextLessonIndex = completedCount;

  const renderProgressRing = () => {
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const strokeDashoffset = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
    });

    return (
      <View style={styles.ringContainer}>
        <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]}>
          <Animated.View
            style={[
              styles.ringFill,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: stageColor,
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
        </View>
        <View style={styles.ringCenter}>
          <Animated.Text style={[styles.ringPercent, { color: stageColor }]}>
            {Math.round(progressPercent * 100)}%
          </Animated.Text>
          <View style={styles.ringLabel}>
            <Text style={[styles.ringLabelText, { color: COLORS.gray500 }]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLessonCard = (lesson, index) => {
    const isCompleted = getLessonProgress(lesson.id);
    const isCurrent = !isCompleted && index === nextLessonIndex;
    const isLocked = !isCompleted && !isCurrent;
    const cardAnim = cardAnimations.current[index] || new Animated.Value(1);

    const slideIn = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });

    const typeIcon =
      lesson.content_type === 'video'
        ? 'play-circle'
        : lesson.content_type === 'quiz'
        ? 'frequently-asked-questions'
        : lesson.content_type === 'exercise'
        ? 'dumbbell'
        : 'book-open-variant';

    return (
      <Animated.View
        key={lesson.id}
        style={[
          styles.lessonCard,
          isCompleted && styles.lessonCardCompleted,
          isCurrent && styles.lessonCardCurrent,
          isLocked && styles.lessonCardLocked,
          {
            opacity: cardAnim,
            transform: [{ translateX: slideIn }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (isLocked) return;
            navigation.navigate('Lesson', {
              lessonId: lesson.id,
              courseId: course?.id,
              courseName: course?.title,
            });
          }}
          activeOpacity={isLocked ? 1 : 0.8}
          disabled={isLocked}
        >
          <View style={styles.lessonInner}>
            <View
              style={[
                styles.lessonNumberCircle,
                isCompleted && { backgroundColor: COLORS.success },
                isCurrent && { backgroundColor: stageColor },
                isLocked && { backgroundColor: COLORS.gray300 },
              ]}
            >
              {isCompleted ? (
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: checkAnimations.current[lesson.id] || new Animated.Value(1),
                      },
                    ],
                  }}
                >
                  <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                </Animated.View>
              ) : isLocked ? (
                <MaterialCommunityIcons name="lock" size={16} color={COLORS.gray500} />
              ) : (
                <View style={[styles.lessonNumberText, isCurrent && { color: COLORS.white }]}>
                  <Text style={[styles.lessonNumberText, isCurrent && { color: COLORS.white }]}>
                    {index + 1}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.lessonInfo}>
            <View
              style={[
                styles.lessonTitleRow,
                isLocked && { opacity: 0.5 },
              ]}
            >
              <Text
                style={[
                  styles.lessonTitleText,
                  isCompleted && { color: COLORS.gray500 },
                  isCurrent && { color: COLORS.black },
                  isLocked && { color: COLORS.gray400 },
                ]}
              >
                {lesson.title}
              </Text>
                {isCurrent && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={[styles.pulsingDot, { backgroundColor: stageColor }]} />
                  </Animated.View>
                )}
              </View>

              <View style={styles.lessonMeta}>
                <MaterialCommunityIcons
                  name={typeIcon}
                  size={14}
                  color={isLocked ? COLORS.gray400 : COLORS.gray500}
                />
                <Text
                  style={[
                    styles.lessonTypeText,
                    { color: isLocked ? COLORS.gray400 : COLORS.gray500 },
                  ]}
                >
                  {lesson.content_type || 'Lesson'}
                </Text>
              </View>
            </View>

            {isCompleted ? (
              <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.success} />
            ) : isCurrent ? (
              <MaterialCommunityIcons name="chevron-right" size={24} color={stageColor} />
            ) : (
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.gray400} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEnrollSection = () => {
    const learnPoints = [
      'Structured curriculum designed by music experts',
      'Hands-on exercises and real practice sessions',
      'Quizzes to test your understanding',
      'Track your progress at every step',
    ];

    return (
      <Animated.View style={[styles.enrollSection, { opacity: fadeAnim }]}>
        <View style={styles.enrollCard}>
          <View style={styles.enrollHeader}>
            <MaterialCommunityIcons name="information-outline" size={24} color={stageColor} />
              <View style={styles.enrollHeaderText}>
                <Text style={styles.enrollTitle}>Course Overview</Text>
              </View>
          </View>

          <Text style={styles.enrollDescText}>
            {course?.description || 'Start your musical journey with this comprehensive course.'}
          </Text>

          <View style={styles.learnSection}>
            <Text style={styles.learnTitle}>What you'll learn</Text>
            {learnPoints.map((point, i) => (
              <View key={i} style={styles.learnItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={stageColor} />
                <Text style={styles.learnPointText}>{point}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <GradientButton
              title={enrolling ? 'Enrolling...' : 'Enroll Now'}
              onPress={handleEnroll}
              disabled={enrolling}
              loading={enrolling}
              icon="school"
              colors={[stageColor, COLORS.primaryDark]}
              style={styles.enrollButton}
            />
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[stageColor, `${stageColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerOverlay} />

          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTitleRow}>
              <MaterialCommunityIcons
                name={INSTRUMENT_ICONS[course?.instrument] || INSTRUMENT_ICONS.default}
                size={28}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.heroTitleText}>{course?.title || 'Course'}</Text>
            </View>

            <Text style={styles.heroDescText}>{course?.description}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {course?.stage && (
                <Tag
                  label={`Stage ${course.stage}`}
                  color={COLORS.white}
                  size="medium"
                  style={[styles.statTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                />
              )}
              {course?.difficulty && (
                <Tag
                  label={course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                  color={DIFFICULTY_COLORS[course.difficulty] || COLORS.white}
                  size="medium"
                  style={[styles.statTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                />
              )}
              <View style={styles.statChip}>
                <MaterialCommunityIcons
                  name={INSTRUMENT_ICONS[course?.instrument] || INSTRUMENT_ICONS.default}
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.statChipText}>
                  {course?.instrument?.charAt(0).toUpperCase() + (course?.instrument?.slice(1) || '')}
                </Text>
              </View>
              <View style={styles.statChip}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={COLORS.white} />
                <Text style={styles.statChipText}>{totalCount} lessons</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Progress Section (Enrolled) */}
        {isEnrolled && (
          <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <Text style={styles.progressCardTitle}>Your Progress</Text>
                <Text style={[styles.progressCardPercent, { color: stageColor }]}>
                  {Math.round(progressPercent * 100)}%
                </Text>
              </View>

              <View style={styles.progressCardBody}>
                {renderProgressRing()}
                <View style={styles.progressDetails}>
              <Text style={styles.progressLessonsText}>
                {completedCount} of {totalCount} lessons complete
              </Text>
                  <ProgressBar
                    progress={progressPercent}
                    height={8}
                    color={stageColor}
                    style={styles.progressBar}
                  />
                </View>
              </View>

              {progressPercent < 1 && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <GradientButton
                    title="Continue Learning"
                    onPress={() => {
                      const nextLesson = lessons[nextLessonIndex];
                      if (nextLesson) {
                        navigation.navigate('Lesson', {
                          lessonId: nextLesson.id,
                          courseId: course?.id,
                          courseName: course?.title,
                        });
                      }
                    }}
                    icon="play"
                    colors={[stageColor, COLORS.primaryDark]}
                    style={styles.continueButton}
                  />
                </Animated.View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Lesson List */}
        <View style={styles.lessonSection}>
          <View style={styles.lessonSectionHeader}>
            <Text style={styles.lessonSectionTitle}>Lessons</Text>
            <Text style={styles.lessonSectionCount}>{totalCount} total</Text>
          </View>

          {lessons.map((lesson, index) => renderLessonCard(lesson, index))}
        </View>

        {/* Enroll Section (Not Enrolled) */}
        {!isEnrolled && renderEnrollSection()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Header
  headerWrapper: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  headerNav: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: SPACING.lg,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitleText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  heroDescText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statTag: {
    borderRadius: BORDER_RADIUS.full,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },

  // Progress Section
  progressSection: {
    padding: SPACING.lg,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  progressCardPercent: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  ringContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xl,
  },
  ringTrack: {
    position: 'absolute',
    borderColor: COLORS.gray200,
  },
  ringFill: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 22,
    fontWeight: '700',
  },
  ringLabel: {
    marginTop: 2,
  },
  ringLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressDetails: {
    flex: 1,
  },
  progressLessonsText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  progressBar: {
    marginTop: SPACING.xs,
  },
  continueButton: {
    marginTop: SPACING.sm,
  },

  // Lesson List
  lessonSection: {
    padding: SPACING.lg,
  },
  lessonSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  lessonSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  lessonSectionCount: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  lessonCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  lessonCardCompleted: {
    backgroundColor: `${COLORS.success}08`,
  },
  lessonCardCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  lessonCardLocked: {
    backgroundColor: COLORS.gray100,
    opacity: 0.7,
  },
  lessonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  lessonNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  lessonNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  lessonTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTypeText: {
    fontSize: 12,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },

  // Enroll Section
  enrollSection: {
    padding: SPACING.lg,
  },
  enrollCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  enrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  enrollHeaderText: {
    marginLeft: SPACING.sm,
  },
  enrollTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  enrollDescText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray600,
    marginBottom: SPACING.xl,
  },
  learnSection: {
    marginBottom: SPACING.xl,
  },
  learnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  learnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  learnPointText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  enrollButton: {
    marginTop: SPACING.sm,
  },

  bottomPadding: {
    height: 100,
  },
});

export default CourseScreen;
