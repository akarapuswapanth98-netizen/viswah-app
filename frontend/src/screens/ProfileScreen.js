import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { Tag, GradientButton } from '../components/UIComponents';
import { api, authFetch, clearAuthToken } from '../config/api';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const BADGES = [
  { id: 1, icon: 'music-note', name: 'First Lesson', date: '2026-01-15', earned: true },
  { id: 2, icon: 'star', name: 'High Scorer', date: '2026-02-20', earned: true },
  { id: 3, icon: 'fire', name: 'On Fire', date: '2026-03-10', earned: true },
  { id: 4, icon: 'trophy', name: 'Champion', date: '', earned: false },
  { id: 5, icon: 'medal', name: 'Perfectionist', date: '2026-04-05', earned: true },
  { id: 6, icon: 'crown', name: 'Royalty', date: '', earned: false },
  { id: 7, icon: 'diamond-stone', name: 'Diamond', date: '', earned: false },
  { id: 8, icon: 'rocket-launch', name: 'Rising Star', date: '2026-03-28', earned: true },
];

const CountUp = ({ target, duration = 1200, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const display = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = display.addListener(({ value: v }) => {
      setValue(Math.round(v));
    });

    return () => display.removeListener(listener);
  }, []);

  useEffect(() => {
    display.setValue(0);
    const anim = Animated.timing(display, {
      toValue: target,
      duration,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [target, duration]);

  return <Animated.Text style={style}>{value}</Animated.Text>;
};

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const avatarScale = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(DAYS.map(() => new Animated.Value(0))).current;
  const badgePulses = useRef(BADGES.map(() => new Animated.Value(1))).current;

  const runBadgePulse = useCallback(() => {
    BADGES.forEach((b, i) => {
      if (b.earned) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(badgePulses[i], {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(badgePulses[i], {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });
  }, []);

  useEffect(() => {
    fetchUserData();

    Animated.spring(avatarScale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.stagger(
        120,
        dotAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ).start();
    }, 600);

    runBadgePulse();
  }, []);

  const fetchUserData = async () => {
    try {
      const [profileRes, coursesRes] = await Promise.all([
        authFetch(api.me),
        authFetch(api.enrolled),
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
    const coursesEnrolled = enrolledCourses.length;
    const lessonsCompleted = enrolledCourses.filter((c) => c.completed).length;
    const quizzesPassed = enrolledCourses.filter((c) => (c.score || 0) >= 70).length;
    const streak = Math.max(1, Math.floor(enrolledCourses.length * 1.5));
    return { coursesEnrolled, lessonsCompleted, quizzesPassed, streak };
  };

  const stats = getStats();

  const weeklyActivity = [true, true, false, true, true, false, true];

  const getInitials = () => {
    if (!user?.username) return null;
    return user.username
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <LinearGradient colors={['#6C63FF', '#9C27B0']} style={styles.header}>
        <View style={styles.headerTopBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialCommunityIcons name="cog" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCenter}>
          <Animated.View
            style={[styles.avatarOuter, { transform: [{ scale: avatarScale }] }]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
              style={styles.avatarCircle}
            >
              {getInitials() ? (
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              ) : (
                <MaterialCommunityIcons name="account" size={52} color={COLORS.white} />
              )}
            </LinearGradient>
            <View style={styles.onlineDot} />
          </Animated.View>

          <Animated.Text style={styles.userName}>{user?.username || 'Guest'}</Animated.Text>
          <Animated.Text style={styles.userEmail}>{user?.email || 'Login to track progress'}</Animated.Text>

          <Tag
            label={stats.coursesEnrolled >= 5 ? 'Pro' : 'Beginner'}
            color={stats.coursesEnrolled >= 5 ? COLORS.warning : COLORS.white}
            variant={stats.coursesEnrolled >= 5 ? 'filled' : 'outlined'}
            size="medium"
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Courses', value: stats.coursesEnrolled, icon: 'book-open-variant', color: COLORS.primary },
            { label: 'Lessons', value: stats.lessonsCompleted, icon: 'check-circle', color: COLORS.success },
            { label: 'Quizzes', value: stats.quizzesPassed, icon: 'star', color: COLORS.warning },
            { label: 'Streak', value: stats.streak, icon: 'fire', color: COLORS.error, suffix: ' days' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${stat.color}18` }]}>
                <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
              </View>
              <CountUp target={stat.value} duration={1000 + i * 200} style={styles.statNumber} />
              <Animated.Text style={styles.statLabel}>
                {stat.label}{stat.suffix || ''}
              </Animated.Text>
            </View>
          ))}
        </View>

        {/* Weekly Activity */}
        <View style={styles.sectionCard}>
          <Animated.Text style={styles.sectionTitle}>Weekly Activity</Animated.Text>
          <Animated.Text style={styles.sectionSub}>This Week</Animated.Text>
          <View style={styles.activityRow}>
            {DAYS.map((day, i) => (
              <View key={i} style={styles.activityCol}>
                <Animated.View
                  style={[
                    styles.activityDot,
                    {
                      opacity: dotAnims[i],
                      transform: [{ scale: dotAnims[i] }],
                      backgroundColor: weeklyActivity[i] ? COLORS.success : COLORS.gray300,
                    },
                  ]}
                />
                <Animated.Text style={styles.activityDay}>{day}</Animated.Text>
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.sectionCard}>
          <Animated.Text style={styles.sectionTitle}>Badges</Animated.Text>
          <Animated.Text style={styles.sectionSub}>Your achievements</Animated.Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
            {BADGES.map((badge, i) => (
              <Animated.View
                key={badge.id}
                style={[
                  styles.badgeItem,
                  !badge.earned && styles.badgeItemLocked,
                  { transform: [{ scale: badgePulses[i] }] },
                ]}
              >
                <View
                  style={[
                    styles.badgeIconCircle,
                    !badge.earned && styles.badgeIconCircleLocked,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={badge.earned ? badge.icon : 'lock'}
                    size={28}
                    color={badge.earned ? COLORS.white : COLORS.gray400}
                  />
                </View>
                <Animated.Text
                  style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}
                >
                  {badge.name}
                </Animated.Text>
                {badge.earned && (
                  <Animated.Text style={styles.badgeDate}>{badge.date}</Animated.Text>
                )}
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Settings */}
        <View style={styles.sectionCard}>
          <Animated.Text style={styles.sectionTitle}>Settings</Animated.Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: `${COLORS.primary}18` }]}>
              <MaterialCommunityIcons name="account-cog" size={20} color={COLORS.primary} />
            </View>
            <Animated.Text style={styles.settingLabel}>Account Settings</Animated.Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray400} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: `${COLORS.info}18` }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.info} />
            </View>
            <Animated.Text style={styles.settingLabel}>Notifications</Animated.Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}60` }}
              thumbColor={notifications ? COLORS.primary : COLORS.gray400}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: `${COLORS.success}18` }]}>
              <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.success} />
            </View>
            <Animated.Text style={styles.settingLabel}>About</Animated.Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Animated.Text style={styles.logoutText}>Logout</Animated.Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 52,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCenter: { alignItems: 'center' },
  avatarOuter: { position: 'relative', marginBottom: SPACING.lg },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: SPACING.md,
  },

  content: { flex: 1, padding: SPACING.lg },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
  },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityCol: { alignItems: 'center' },
  activityDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: SPACING.sm,
  },
  activityDay: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
  },

  badgeScroll: { marginHorizontal: -SPACING.xl, paddingHorizontal: SPACING.xl },
  badgeItem: {
    width: 88,
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  badgeItemLocked: { opacity: 0.55 },
  badgeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  badgeIconCircleLocked: {
    backgroundColor: COLORS.gray200,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
  },
  badgeNameLocked: { color: COLORS.gray400 },
  badgeDate: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 2,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.error,
    ...SHADOWS.small,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default ProfileScreen;
