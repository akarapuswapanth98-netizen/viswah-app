# Profile Screen

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Card, Button, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    coursesEnrolled: 3,
    lessonsCompleted: 12,
    quizzesPassed: 8,
    streak: 5
  });

  useEffect(() => {
    // Fallback user data
    setUser({
      username: 'Music Student',
      email: 'student@viswah.com',
      level: 'intermediate'
    });
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text size={80} label="MS" style={styles.avatar} />
        <Title style={styles.username}>{user?.username}</Title>
        <Paragraph style={styles.email}>{user?.email}</Paragraph>
        <View style={styles.levelBadge}>
          <Paragraph style={[styles.levelText, { color: getLevelColor(user?.level) }]}>
            {user?.level?.toUpperCase()}
          </Paragraph>
        </View>
      </View>

      {/* Stats */}
      <ScrollView style={styles.content}>
        <Title style={styles.sectionTitle}>Your Progress</Title>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="book-open-variant" size={32} color="#6200EE" />
              <Title style={styles.statNumber}>{stats.coursesEnrolled}</Title>
              <Paragraph style={styles.statLabel}>Courses</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
              <Title style={styles.statNumber}>{stats.lessonsCompleted}</Title>
              <Paragraph style={styles.statLabel}>Lessons</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="frequently-asked-questions" size={32} color="#FF9800" />
              <Title style={styles.statNumber}>{stats.quizzesPassed}</Title>
              <Paragraph style={styles.statLabel}>Quizzes</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="fire" size={32} color="#F44336" />
              <Title style={styles.statNumber}>{stats.streak}</Title>
              <Paragraph style={styles.statLabel}>Day Streak</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Achievements */}
        <Title style={styles.sectionTitle}>Achievements</Title>
        <Card style={styles.achievementCard}>
          <Card.Content>
            <View style={styles.achievementItem}>
              <MaterialCommunityIcons name="medal" size={24} color="#FFD700" />
              <View style={styles.achievementInfo}>
                <Title style={styles.achievementTitle}>First Lesson</Title>
                <Paragraph style={styles.achievementDesc}>Complete your first lesson</Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.achievementItem}>
              <MaterialCommunityIcons name="star" size={24} color="#FF9800" />
              <View style={styles.achievementInfo}>
                <Title style={styles.achievementTitle}>Quiz Master</Title>
                <Paragraph style={styles.achievementDesc}>Pass 5 quizzes with 100%</Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.achievementItem}>
              <MaterialCommunityIcons name="fire" size={24} color="#F44336" />
              <View style={styles.achievementInfo}>
                <Title style={styles.achievementTitle}>On Fire</Title>
                <Paragraph style={styles.achievementDesc}>Maintain a 7-day streak</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Title style={styles.sectionTitle}>Settings</Title>
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Button
              mode="text"
              icon="account-edit"
              onPress={() => {}}
              style={styles.settingsButton}
            >
              Edit Profile
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="bell"
              onPress={() => {}}
              style={styles.settingsButton}
            >
              Notifications
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="logout"
              onPress={() => navigation.navigate('Home')}
              style={styles.settingsButton}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  username: {
    color: 'white',
    fontSize: 24,
    marginTop: 12,
  },
  email: {
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  levelText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 28,
    marginTop: 8,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  achievementCard: {
    elevation: 2,
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementInfo: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  settingsCard: {
    elevation: 2,
    marginBottom: 32,
  },
  settingsButton: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
});

export default ProfileScreen;