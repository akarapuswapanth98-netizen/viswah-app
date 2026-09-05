import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, ProgressBar } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, courseId, courseName } = route.params;
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLesson();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchLesson = async () => {
    try {
      const [lessonRes, progressRes] = await Promise.all([
        authFetch(api.lesson(lessonId)),
        authFetch(`${api.progress}/${courseId}/${lessonId}`),
      ]);

      if (lessonRes.ok) setLesson(await lessonRes.json());
      if (progressRes.ok) setProgress(await progressRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const res = await authFetch(`${api.progress}/${courseId}/${lessonId}`, {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  const isCompleted = progress?.completed;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Animated.Text style={styles.lessonTitle}>{lesson?.title || 'Lesson'}</Animated.Text>
            <Animated.Text style={styles.courseName}>{courseName}</Animated.Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
            <MaterialCommunityIcons 
              name={isCompleted ? "check-circle" : "clock-outline"} 
              size={20} 
              color={isCompleted ? COLORS.white : COLORS.white} 
            />
            <Animated.Text style={styles.statusText}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </Animated.Text>
          </View>
          {progress?.score && (
            <View style={styles.scoreBadge}>
              <MaterialCommunityIcons name="star" size={16} color={COLORS.white} />
              <Animated.Text style={styles.scoreText}>{progress.score}%</Animated.Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lesson Content */}
        <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color={COLORS.primary} />
            <Animated.Text style={styles.sectionTitle}>Lesson Content</Animated.Text>
          </View>
          
          <Animated.Text style={styles.contentText}>
            {lesson?.content || 'No content available'}
          </Animated.Text>
        </Animated.View>

        {/* Quiz Section */}
        <Animated.View style={[styles.quizCard, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="frequently-asked-questions" size={24} color={COLORS.secondary} />
            <Animated.Text style={styles.sectionTitle}>Quiz</Animated.Text>
          </View>
          
          <Animated.Text style={styles.quizDescription}>
            Test your knowledge with a quick quiz
          </Animated.Text>
          
          <GradientButton
            title="Take Quiz"
            onPress={handleTakeQuiz}
            icon="quiz"
            colors={COLORS.gradient.sunset}
            style={styles.quizButton}
          />
        </Animated.View>

        {/* Mark Complete Button */}
        {!isCompleted && (
          <Animated.View style={[styles.completeCard, { opacity: fadeAnim }]}>
            <GradientButton
              title="Mark as Complete"
              onPress={handleMarkComplete}
              icon="check-circle"
              colors={COLORS.gradient.ocean}
              style={styles.completeButton}
            />
          </Animated.View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.primary} />
            <Animated.Text style={styles.navButtonText}>Previous</Animated.Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Course', { courseId })}
          >
            <Animated.Text style={styles.navButtonText}>Course</Animated.Text>
            <MaterialCommunityIcons name="book" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

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
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  headerInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  courseName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  scoreText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  completeCard: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.gray700,
  },
  quizDescription: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
  },
  quizButton: {
    marginTop: SPACING.sm,
  },
  completeButton: {},
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: SPACING.xs,
  },
  bottomPadding: {
    height: 100,
  },
});

export default LessonScreen;
