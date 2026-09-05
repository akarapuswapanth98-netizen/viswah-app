import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { SectionHeader, ProgressBar, Tag, GradientCard } from '../components/UIComponents';
import { api, authFetch, getAuthToken } from '../config/api';

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAuth();
    fetchCourses();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkAuth = async () => {
    const token = await getAuthToken();
    setIsLoggedIn(!!token);
  };

  const fetchCourses = async () => {
    try {
      const response = await authFetch(api.courses);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      setCourses([
        { id: 1, title: 'Music Fundamentals', description: 'Learn the basics', stage: 1, instrument: 'vocal', difficulty: 'beginner' },
        { id: 2, title: 'Vocal Training', description: 'Develop your voice', stage: 1, instrument: 'vocal', difficulty: 'beginner' },
        { id: 3, title: 'Piano Basics', description: 'Start piano', stage: 1, instrument: 'piano', difficulty: 'beginner' },
      ]);
    } finally { setLoading(false); }
  };

  const filteredCourses = courses.filter(c => {
    const matchStage = selectedStage ? c.stage === selectedStage : true;
    return matchStage;
  });

  const getIcon = (i) => i === 'vocal' ? 'account-music' : i === 'piano' ? 'piano' : 'drum';
  const getStageColor = (s) => {
    const colors = { 1: COLORS.stage1, 2: COLORS.stage2, 3: COLORS.stage3, 4: COLORS.stage4 };
    return colors[s] || COLORS.primary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient {...createGradient(COLORS.gradient.royal)} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Animated.Text style={styles.greeting}>Welcome to</Animated.Text>
            <Animated.Text style={styles.appName}>Viswah</Animated.Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate(isLoggedIn ? 'Profile' : 'Login')}
            style={styles.profileButton}
          >
            <MaterialCommunityIcons 
              name={isLoggedIn ? 'account-circle' : 'login'} 
              size={28} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color={COLORS.white} />
            <View style={styles.statText}>
              <Animated.Text style={styles.statNumber}>{courses.length}</Animated.Text>
              <Animated.Text style={styles.statLabel}>Courses</Animated.Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="music-note" size={24} color={COLORS.white} />
            <View style={styles.statText}>
              <Animated.Text style={styles.statNumber}>4</Animated.Text>
              <Animated.Text style={styles.statLabel}>Stages</Animated.Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="star" size={24} color={COLORS.white} />
            <View style={styles.statText}>
              <Animated.Text style={styles.statNumber}>Pro</Animated.Text>
              <Animated.Text style={styles.statLabel}>Level</Animated.Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('VocalGuru')}
          >
            <LinearGradient {...createGradient(COLORS.gradient.ocean)} style={styles.quickActionGradient}>
              <MaterialCommunityIcons name="account-music" size={32} color={COLORS.white} />
              <Animated.Text style={styles.quickActionTitle}>Vocal Guru</Animated.Text>
              <Animated.Text style={styles.quickActionSub}>Learn from AI</Animated.Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('SpeechAnalysis')}
          >
            <LinearGradient {...createGradient(COLORS.gradient.sunset)} style={styles.quickActionGradient}>
              <MaterialCommunityIcons name="microphone" size={32} color={COLORS.white} />
              <Animated.Text style={styles.quickActionTitle}>Speech</Animated.Text>
              <Animated.Text style={styles.quickActionSub}>Analyze voice</Animated.Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('LyricsCreator')}
          >
            <LinearGradient {...createGradient(['#9C27B0', '#E91E63'])} style={styles.quickActionGradient}>
              <MaterialCommunityIcons name="creation" size={32} color={COLORS.white} />
              <Animated.Text style={styles.quickActionTitle}>Lyrics</Animated.Text>
              <Animated.Text style={styles.quickActionSub}>Write songs</Animated.Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stage Filter */}
        <SectionHeader title="Courses" subtitle="Browse by stage" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
          {[1, 2, 3, 4].map(stage => (
            <TouchableOpacity
              key={stage}
              onPress={() => setSelectedStage(selectedStage === stage ? null : stage)}
              style={[styles.stageChip, selectedStage === stage && { backgroundColor: getStageColor(stage) }]}
            >
              <MaterialCommunityIcons 
                name={`numeric-${stage}-box`} 
                size={16} 
                color={selectedStage === stage ? COLORS.white : getStageColor(stage)} 
              />
              <Animated.Text style={[
                styles.stageChipText, 
                selectedStage === stage && { color: COLORS.white }
              ]}>
                Stage {stage}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Course List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
          </View>
        ) : (
          filteredCourses.map((course, index) => (
            <Animated.View key={course.id} style={[styles.courseCard, { opacity: fadeAnim }]}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Course', { courseId: course.id })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[getStageColor(course.stage), `${getStageColor(course.stage)}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.courseGradient}
                >
                  <View style={styles.courseHeader}>
                    <MaterialCommunityIcons name={getIcon(course.instrument)} size={32} color={COLORS.white} />
                    <Tag label={course.difficulty} color={COLORS.white} variant="light" />
                  </View>
                  <Animated.Text style={styles.courseTitle}>{course.title}</Animated.Text>
                  <Animated.Text style={styles.courseDesc}>{course.description}</Animated.Text>
                  <View style={styles.courseFooter}>
                    <View style={styles.courseStage}>
                      <MaterialCommunityIcons name="layers" size={14} color="rgba(255,255,255,0.8)" />
                      <Animated.Text style={styles.courseStageText}>Stage {course.stage}</Animated.Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

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
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  statText: {
    marginLeft: SPACING.sm,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  quickAction: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  quickActionGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  quickActionSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  stageScroll: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    ...SHADOWS.subtle,
  },
  stageChipText: {
    marginLeft: SPACING.xs,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  courseCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  courseGradient: {
    padding: SPACING.xl,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  courseDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.lg,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseStage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseStageText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: SPACING.xs,
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
