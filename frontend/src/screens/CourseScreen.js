# Course Screen - Lesson List

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8000';

const CourseScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, []);

  const fetchCourseData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`${API_URL}/api/courses/${courseId}`),
        fetch(`${API_URL}/api/courses/${courseId}/lessons`)
      ]);
      const courseData = await courseRes.json();
      const lessonsData = await lessonsRes.json();
      setCourse(courseData);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error fetching course data:', error);
      // Fallback data
      setCourse({
        id: courseId,
        title: 'Music Fundamentals',
        description: 'Learn the basics of music theory',
        stage: 1,
        difficulty: 'beginner'
      });
      setLessons([
        { id: 1, title: 'Introduction to Notes', order: 1, lesson_type: 'theory', duration_minutes: 10 },
        { id: 2, title: 'Understanding Rhythm', order: 2, lesson_type: 'theory', duration_minutes: 15 },
        { id: 3, title: 'Basic Scales', order: 3, lesson_type: 'practice', duration_minutes: 20 },
        { id: 4, title: 'Knowledge Check', order: 4, lesson_type: 'quiz', duration_minutes: 10 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'theory': return 'book-open-variant';
      case 'practice': return 'music-note';
      case 'quiz': return 'frequently-asked-questions';
      default: return 'circle';
    }
  };

  const getLessonColor = (type) => {
    switch (type) {
      case 'theory': return '#2196F3';
      case 'practice': return '#4CAF50';
      case 'quiz': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading course...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Course Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>{course?.title}</Title>
        <Paragraph style={styles.headerDescription}>{course?.description}</Paragraph>
        <View style={styles.headerChips}>
          <Chip style={styles.chip}>Stage {course?.stage}</Chip>
          <Chip style={[styles.chip, { backgroundColor: '#4CAF50' }]} textStyle={{ color: 'white' }}>
            {course?.difficulty}
          </Chip>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Paragraph style={styles.progressLabel}>Course Progress</Paragraph>
        <ProgressBar progress={0.3} color="#6200EE" style={styles.progressBar} />
        <Paragraph style={styles.progressText}>30% Complete</Paragraph>
      </View>

      {/* Lessons List */}
      <ScrollView style={styles.lessonList}>
        {lessons.map((lesson, index) => (
          <TouchableOpacity
            key={lesson.id}
            onPress={() => navigation.navigate('Lesson', {
              lessonId: lesson.id,
              lessonTitle: lesson.title
            })}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.lessonIcon, { backgroundColor: getLessonColor(lesson.lesson_type) }]}>
                      <MaterialCommunityIcons
                        name={getLessonIcon(lesson.lesson_type)}
                        size={24}
                        color="white"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Title style={styles.lessonTitle}>{lesson.title}</Title>
                      <Paragraph style={styles.lessonMeta}>
                        {lesson.lesson_type.charAt(0).toUpperCase() + lesson.lesson_type.slice(1)} • {lesson.duration_minutes} min
                      </Paragraph>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          icon="play"
          onPress={() => navigation.navigate('Lesson', {
            lessonId: lessons[0]?.id,
            lessonTitle: lessons[0]?.title
          })}
          style={styles.startButton}
        >
          Continue Learning
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
  },
  headerDescription: {
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  headerChips: {
    flexDirection: 'row',
    marginTop: 12,
  },
  chip: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  lessonList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
  },
  lessonMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 8,
  },
  startButton: {
    paddingVertical: 4,
  },
});

export default CourseScreen;