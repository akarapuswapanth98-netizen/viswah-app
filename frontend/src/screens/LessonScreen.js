import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { api, authFetch } from '../config/api';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, courseId, courseName } = route.params;
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const markCompleteAnim = useRef(new Animated.Value(1)).current;
  const markCompleteBg = useRef(new Animated.Value(0)).current;
  const markCompleteWidth = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLesson();
  }, []);

  const fetchLesson = async () => {
    try {
      const [lessonRes, progressRes] = await Promise.all([
        authFetch(api.lesson(lessonId)),
        authFetch(`${api.progressByLesson(lessonId)}`),
      ]);

      if (lessonRes.ok) setLesson(await lessonRes.json());
      if (progressRes.ok) {
        const data = await progressRes.json();
        const record = Array.isArray(data) ? data[0] : data;
        setProgress(record);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMarkComplete = async () => {
    if (progress?.completed) return;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(markCompleteWidth, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(markCompleteAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const res = await authFetch(api.progressById(lessonId), {
        method: 'POST',
        body: JSON.stringify({ completed: true, score: 100 }),
      });
      if (res.ok) {
        setProgress({ completed: true, score: 100 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakeQuiz = () => {
    navigation.navigate('Quiz', {
      lessonId: lesson?.id,
      lessonTitle: lesson?.title,
      courseId,
    });
  };

  const renderContentBlock = (block, index) => {
    if (!block) return null;

    const fadeIn = contentFade.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const slideUp = contentFade.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    switch (block.type) {
      case 'header':
        return (
          <Animated.View
            key={index}
            style={[styles.contentHeader, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <Text style={styles.contentHeaderText}>{block.text}</Text>
          </Animated.View>
        );

      case 'paragraph':
        return (
          <Animated.View
            key={index}
            style={[styles.contentParagraph, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <Text style={styles.contentParagraphText}>{block.text}</Text>
          </Animated.View>
        );

      case 'list':
        return (
          <Animated.View
            key={index}
            style={[styles.contentList, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            {(block.items || []).map((item, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        );

      case 'bold':
        return (
          <Animated.View
            key={index}
            style={[styles.contentBold, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <Text style={styles.contentBoldText}>{block.text}</Text>
          </Animated.View>
        );

      case 'divider':
        return (
          <Animated.View
            key={index}
            style={[styles.contentDivider, { opacity: fadeIn }]}
          />
        );

      default:
        return (
          <Animated.View
            key={index}
            style={[styles.contentParagraph, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <Text style={styles.contentParagraphText}>{block.text || block}</Text>
          </Animated.View>
        );
    }
  };

  const renderLessonContent = () => {
    if (!lesson?.content) {
      return (
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="book-open-variant" size={48} color={COLORS.gray300} />
          <Text style={styles.emptyContentText}>No content available for this lesson yet.</Text>
        </View>
      );
    }

    if (typeof lesson.content === 'string') {
      const paragraphs = lesson.content.split('\n').filter((p) => p.trim());
      return paragraphs.map((p, i) =>
        renderContentBlock({ type: 'paragraph', text: p }, i)
      );
    }

    if (Array.isArray(lesson.content)) {
      return lesson.content.map((block, i) => renderContentBlock(block, i));
    }

    return (
      <View style={styles.emptyContent}>
        <MaterialCommunityIcons name="book-open-variant" size={48} color={COLORS.gray300} />
        <Text style={styles.emptyContentText}>No content available for this lesson yet.</Text>
      </View>
    );
  };

  const isCompleted = progress?.completed;

  const renderMarkCompleteButton = () => {
    const bgInterpolate = markCompleteBg.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <View style={styles.bottomBar}>
        <Animated.View
          style={[
            styles.markCompleteWrapper,
            {
              flex: markCompleteWidth,
              opacity: markCompleteAnim,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleMarkComplete}
            disabled={isCompleted}
            activeOpacity={0.8}
            style={[styles.markCompleteButton, isCompleted && styles.markCompleteButtonDone]}
          >
            <LinearGradient
              {...createGradient(isCompleted ? [COLORS.success, '#388E3C'] : [COLORS.primary, COLORS.primaryDark])}
              style={styles.markCompleteGradient}
            >
              <MaterialCommunityIcons
                name={isCompleted ? 'check-circle' : 'check'}
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.markCompleteText}>
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.checkDoneContainer,
            {
              flex: Animated.add(1, Animated.multiply(-1, markCompleteWidth)),
              opacity: checkScale,
            },
          ]}
        >
          <View style={styles.checkDoneBadge}>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <MaterialCommunityIcons name="check-circle" size={28} color={COLORS.white} />
            </Animated.View>
          </View>
        </Animated.View>

        <TouchableOpacity
          onPress={handleTakeQuiz}
          activeOpacity={0.8}
          style={styles.quizButton}
        >
          <View style={styles.quizButtonInner}>
            <MaterialCommunityIcons name="frequently-asked-questions" size={18} color={COLORS.primary} />
            <Text style={styles.quizButtonText}>Quiz</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={styles.backButtonBar}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.gray600} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
            </TouchableOpacity>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitleText}>{lesson?.title || 'Lesson'}</Text>
                <Text style={styles.headerSubText}>{courseName}</Text>
              </View>

            {lesson?.duration && (
              <View style={styles.durationBadge}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.white} />
                <Text style={styles.durationText}>{lesson.duration}m</Text>
              </View>
            )}

            <View
              style={[
                styles.statusDot,
                { backgroundColor: isCompleted ? COLORS.success : COLORS.warning },
              ]}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status Banner */}
        <Animated.View style={[styles.statusBanner, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.statusBannerInner,
              {
                backgroundColor: isCompleted ? `${COLORS.success}15` : `${COLORS.primary}10`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isCompleted ? 'check-circle' : 'clock-outline'}
              size={20}
              color={isCompleted ? COLORS.success : COLORS.primary}
            />
            <Text
              style={[
                styles.statusBannerText,
                { color: isCompleted ? COLORS.success : COLORS.primary },
              ]}
            >
              {isCompleted ? 'Lesson Completed' : 'In Progress'}
            </Text>
            {isCompleted && progress?.score && (
              <View style={styles.scoreInline}>
                <MaterialCommunityIcons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.scoreInlineText}>{progress.score}%</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Lesson Content */}
        <Animated.View style={[styles.contentCard, { opacity: contentFade }]}>
          <View style={styles.contentCardHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={22} color={COLORS.primary} />
            <Text style={styles.contentCardTitle}>Lesson Content</Text>
          </View>

          {renderLessonContent()}
        </Animated.View>

        {/* Quick Actions */}
        {!isCompleted && (
          <Animated.View style={[styles.quickActions, { opacity: fadeAnim }]}>
            <TouchableOpacity
              onPress={handleTakeQuiz}
              activeOpacity={0.8}
              style={styles.quizActionCard}
            >
              <View style={styles.quizActionInner}>
                <MaterialCommunityIcons name="frequently-asked-questions" size={24} color={COLORS.secondary} />
              <View style={styles.quizActionInfo}>
                <Text style={styles.quizActionTitle}>Take the Quiz</Text>
                <Text style={styles.quizActionDesc}>Test your knowledge from this lesson</Text>
              </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray400} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {renderMarkCompleteButton()}
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

  // Sticky Header
  stickyHeader: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  headerBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  headerSubText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Content Area
  contentArea: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },

  // Status Banner
  statusBanner: {
    marginBottom: SPACING.lg,
  },
  statusBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  scoreInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warning,
    marginLeft: 4,
  },

  // Content Card
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  contentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  contentCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },

  // Content Blocks
  contentHeader: {
    marginBottom: SPACING.lg,
  },
  contentHeaderText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 30,
  },
  contentParagraph: {
    marginBottom: SPACING.lg,
  },
  contentParagraphText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.gray700,
  },
  contentList: {
    marginBottom: SPACING.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  listBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: SPACING.md,
  },
  listItemText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray700,
    flex: 1,
  },
  contentBold: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.primary}08`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  contentBoldText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    lineHeight: 22,
  },
  contentDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.xl,
  },

  // Empty Content
  emptyContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyContentText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  // Quick Actions
  quickActions: {
    marginBottom: SPACING.lg,
  },
  quizActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  quizActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  quizActionInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  quizActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  quizActionDesc: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  // Bottom Action Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    ...SHADOWS.medium,
  },
  markCompleteWrapper: {
    marginRight: SPACING.sm,
  },
  markCompleteButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  markCompleteButtonDone: {},
  markCompleteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  markCompleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  checkDoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDoneBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizButton: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  quizButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  quizButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  backButtonBar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },

  bottomPadding: {
    height: 20,
  },
});

export default LessonScreen;
