import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Card, Button, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch, clearAuthToken } from '../config/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const [uRes, pRes, eRes] = await Promise.all([
        authFetch(api.me),
        authFetch(api.progress).catch(() => ({ json: () => [] })),
        authFetch(api.enrolled).catch(() => ({ json: () => [] })),
      ]);
      setUser(await uRes.json());
      const progress = await pRes.json();
      const enrolled = await eRes.json();
      setStats({
        courses: enrolled.length,
        lessons: progress.filter(p => p.completed).length,
        quizzes: progress.filter(p => p.score > 0).length,
        streak: 5,
      });
    } catch (e) {
      setUser({ username: 'Guest', email: 'login required', level: 'beginner' });
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigation.navigate('Home');
  };

  const getLevelColor = (l) => l === 'beginner' ? '#4CAF50' : l === 'intermediate' ? '#FF9800' : '#F44336';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={user?.username?.slice(0,2)?.toUpperCase() || '??'} style={styles.avatar} />
        <Title style={styles.username}>{user?.username}</Title>
        <Paragraph style={styles.email}>{user?.email}</Paragraph>
        <View style={styles.levelBadge}>
          <Paragraph style={[styles.level, {color: getLevelColor(user?.level)}]}>{user?.level?.toUpperCase()}</Paragraph>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Title style={styles.sectionTitle}>Your Progress</Title>
        <View style={styles.stats}>
          <Card style={styles.statCard}><Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color="#6200EE" />
            <Title style={styles.statNum}>{stats.courses}</Title><Paragraph style={styles.statLabel}>Courses</Paragraph>
          </Card.Content></Card>
          <Card style={styles.statCard}><Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
            <Title style={styles.statNum}>{stats.lessons}</Title><Paragraph style={styles.statLabel}>Lessons</Paragraph>
          </Card.Content></Card>
          <Card style={styles.statCard}><Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="frequently-asked-questions" size={32} color="#FF9800" />
            <Title style={styles.statNum}>{stats.quizzes}</Title><Paragraph style={styles.statLabel}>Quizzes</Paragraph>
          </Card.Content></Card>
          <Card style={styles.statCard}><Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="fire" size={32} color="#F44336" />
            <Title style={styles.statNum}>{stats.streak}</Title><Paragraph style={styles.statLabel}>Streak</Paragraph>
          </Card.Content></Card>
        </View>

        <Title style={styles.sectionTitle}>Settings</Title>
        <Card style={styles.settings}>
          <Card.Content>
            <Button mode="text" icon="logout" onPress={handleLogout} style={styles.settingsBtn}>Logout</Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: { padding: 20, backgroundColor: '#6200EE', alignItems: 'center' },
  avatar: { backgroundColor: 'rgba(255,255,255,0.3)' },
  username: { color: 'white', fontSize: 24, marginTop: 12 },
  email: { color: 'white', opacity: 0.8, marginTop: 4 },
  levelBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  level: { fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, marginTop: 16, marginBottom: 12 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', marginBottom: 12, elevation: 2 },
  statContent: { alignItems: 'center', padding: 12 },
  statNum: { fontSize: 28, marginTop: 8 },
  statLabel: { color: '#666', fontSize: 12 },
  settings: { elevation: 2, marginBottom: 32 },
  settingsBtn: { justifyContent: 'flex-start', paddingVertical: 8 },
});

export default ProfileScreen;