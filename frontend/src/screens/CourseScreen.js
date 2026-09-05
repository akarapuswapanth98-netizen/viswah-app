import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { SectionHeader, ProgressBar, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const CourseScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCourse();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchCourse = async () => {
    try {
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        authFetch(`${api.courses}/${courseId}`),
        authFetch(`${api.courses}/${courseId}/lessons`),
        authFetch(`${api.progress}?course_id=${courseId}`),
      ]);

      if (courseRes.ok) setCourse(await courseRes.json());
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(Array.isArray(data) ? data : []);
      }
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getLessonProgress = (lessonId) => {
    return progress.find(p => p.lesson_id === lessonId && p.completed);
  };

  const getCompletedCount = () => {
    return progress.filter(p => p.completed).length;
  };

  const getProgressPercent = () => {
    if (lessons.length === 0) return 0;
    return getCompletedCount() / lessons.length;
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
            <Animated.Text style={styles.courseTitle}>{course?.title || 'Course'}</Animated.Text>
            <Animated.Text style={styles.courseDesc}>{course?.description}</Animated.Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Animated.Text style={styles.progressTitle}>Your Progress</Animated.Text>
            <Animated.Text style={styles.progressPercent}>{Math.round(getProgressPercent() * 100)}%</Animated.Text>
          </View>
          <ProgressBar 
            progress={getProgressPercent()} 
            height={10}
            color={COLORS.white}
            backgroundColor="rgba(255,255,255,0.3)"
          />
          <Animated.Text style={styles.progressDetail}>
            {getCompletedCount()} of {lessons.length} lessons completed
          </Animated.Text>
        </View>
      </LinearGradient>

      {/* Lessons List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader 
          title="Lessons" 
          subtitle={`${lessons.length} lessons available`}
        />

        {lessons.map((lesson, index) => {
          const isCompleted = getLessonProgress(lesson.id);
          const isNext = !isCompleted && index === getCompletedCount();
          
          return (
            <Animated.View key={lesson.id} style={[styles.lessonCard, { opacity: fadeAnim }]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Lesson', { 
                  lessonId: lesson.id, 
                  courseId: course?.id,
                  courseName: course?.title 
                })}
                activeOpacity={0.9}
              >
                <View style={[
                  styles.lessonContent,
                  isCompleted && styles.lessonCompleted,
                  isNext && styles.lessonNext,
                ]}>
                  {/* Lesson Number */}
                  <View style={[
                    styles.lessonNumber,
                    isCompleted && styles.lessonNumberCompleted,
                    isNext && styles.lessonNumberNext,
                  ]}>
                    {isCompleted ? (
                      <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                    ) : (
                      <Animated.Text style={[
                        styles.lessonNumberText,
                        isCompleted && styles.lessonNumberTextCompleted,
                      ]}>
                        {index + 1}
                      </Animated.Text>
                    )}
                  </View>

                  {/* Lesson Info */}
                  <View style={styles.lessonInfo}>
                    <Animated.Text style={[
                      styles.lessonTitle,
                      isCompleted && styles.lessonTitleCompleted,
                    ]}>
                      {lesson.title}
                    </Animated.Text>
                    <Animated.Text style={styles.lessonDesc} numberOfLines={2}>
                      {lesson.description || 'No description'}
                    </Animated.Text>
                    
                    {/* Tags */}
                    <View style={styles.lessonTags}>
                      {lesson.content_type && (
                        <Tag 
                          label={lesson.content_type} 
                          size="small"
                          variant="light"
                        />
                      )}
                      {isNext && (
                        <Tag 
                          label="Next" 
                          color={COLORS.success}
                          size="small"
                        />
                      )}
                    </View>
                  </View>

                  {/* Arrow */}
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color={COLORS.gray400} 
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

import { useRef } from 'react';

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
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  courseDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
  progressDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  lessonCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  lessonCompleted: {
    backgroundColor: COLORS.gray100,
  },
  lessonNext: {
    backgroundColor: `${COLORS.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  lessonNumberCompleted: {
    backgroundColor: COLORS.success,
  },
  lessonNumberNext: {
    backgroundColor: COLORS.primary,
  },
  lessonNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  lessonNumberTextCompleted: {
    color: COLORS.white,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  lessonTitleCompleted: {
    color: COLORS.gray500,
  },
  lessonDesc: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  lessonTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bottomPadding: {
    height: 100,
  },
});

export default CourseScreen;
