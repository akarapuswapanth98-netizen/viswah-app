import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { SectionHeader, GradientCard, Tag } from '../components/UIComponents';
import { api, authFetch, clearAuthToken } from '../config/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchUserData = async () => {
    try {
      const [profileRes, coursesRes] = await Promise.all([
        authFetch(api.me),
        authFetch(`${api.progress}/user`),
      ]);

      if (profileRes.ok) setUser(await profileRes.json());
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setEnrolledCourses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthToken();
    navigation.replace('Home');
  };

  const getStats = () => {
    const completed = enrolledCourses.filter(c => c.completed).length;
    const inProgress = enrolledCourses.filter(c => !c.completed).length;
    const totalScore = enrolledCourses.reduce((sum, c) => sum + (c.score || 0), 0);
    const avgScore = enrolledCourses.length > 0 ? Math.round(totalScore / enrolledCourses.length) : 0;
    
    return { completed, inProgress, avgScore };
  };

  const stats = getStats();

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
        {...createGradient(COLORS.gradient.royal)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Animated.Text style={styles.headerTitle}>Profile</Animated.Text>
          <TouchableOpacity style={styles.settingsButton}>
            <MaterialCommunityIcons name="cog" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.avatarGradient}
            >
              <MaterialCommunityIcons name="account" size={60} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          
          <Animated.Text style={styles.userName}>{user?.username || 'Guest'}</Animated.Text>
          <Animated.Text style={styles.userEmail}>{user?.email || 'Login to track progress'}</Animated.Text>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Animated.Text style={styles.statNumber}>{stats.completed}</Animated.Text>
              <Animated.Text style={styles.statLabel}>Completed</Animated.Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Animated.Text style={styles.statNumber}>{stats.inProgress}</Animated.Text>
              <Animated.Text style={styles.statLabel}>In Progress</Animated.Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Animated.Text style={styles.statNumber}>{stats.avgScore}%</Animated.Text>
              <Animated.Text style={styles.statLabel}>Avg Score</Animated.Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Achievements */}
        <SectionHeader title="Achievements" subtitle="Your milestones" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {[
            { icon: 'music-note', title: 'First Lesson', unlocked: stats.completed > 0 },
            { icon: 'star', title: 'High Scorer', unlocked: stats.avgScore >= 80 },
            { icon: 'fire', title: 'On Fire', unlocked: stats.completed >= 5 },
            { icon: 'trophy', title: 'Champion', unlocked: stats.completed >= 10 },
          ].map((achievement, index) => (
            <View key={index} style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}>
              <MaterialCommunityIcons 
                name={achievement.icon} 
                size={32} 
                color={achievement.unlocked ? COLORS.white : COLORS.gray400} 
              />
              <Animated.Text style={[styles.achievementTitle, !achievement.unlocked && styles.achievementTitleLocked]}>
                {achievement.title}
              </Animated.Text>
            </View>
          ))}
        </ScrollView>

        {/* Enrolled Courses */}
        <SectionHeader 
          title="My Courses" 
          subtitle={`${enrolledCourses.length} courses enrolled`}
        />
        
        {enrolledCourses.length === 0 ? (
          <View style={styles.emptyCourses}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={COLORS.gray300} />
            <Animated.Text style={styles.emptyText}>No courses enrolled yet</Animated.Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Animated.Text style={styles.exploreButtonText}>Explore Courses</Animated.Text>
            </TouchableOpacity>
          </View>
        ) : (
          enrolledCourses.map((course, index) => (
            <Animated.View key={course.id || index} style={[styles.courseCard, { opacity: fadeAnim }]}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Course', { courseId: course.course_id })}
                activeOpacity={0.9}
              >
                <View style={styles.courseContent}>
                  <View style={[styles.courseIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                    <MaterialCommunityIcons name="book" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Animated.Text style={styles.courseTitle}>{course.title || 'Course'}</Animated.Text>
                    <View style={styles.courseProgress}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${course.progress || 0}%` }]} />
                      </View>
                      <Animated.Text style={styles.progressText}>{course.progress || 0}%</Animated.Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray400} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        {/* Menu Items */}
        <SectionHeader title="Settings" />
        <View style={styles.menuCard}>
          {[
            { icon: 'bell', title: 'Notifications', color: COLORS.primary },
            { icon: 'shield', title: 'Privacy', color: COLORS.success },
            { icon: 'help-circle', title: 'Help & Support', color: COLORS.info },
            { icon: 'information', title: 'About', color: COLORS.warning },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
              </View>
              <Animated.Text style={styles.menuTitle}>{item.title}</Animated.Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Animated.Text style={styles.logoutText}>Logout</Animated.Text>
        </TouchableOpacity>

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
    paddingBottom: SPACING.xxl,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: -SPACING.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  achievementsScroll: {
    marginBottom: SPACING.xl,
  },
  achievementCard: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  achievementLocked: {
    backgroundColor: COLORS.gray200,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: COLORS.gray500,
  },
  emptyCourses: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  courseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  courseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  bottomPadding: {
    height: 100,
  },
});

export default ProfileScreen;
