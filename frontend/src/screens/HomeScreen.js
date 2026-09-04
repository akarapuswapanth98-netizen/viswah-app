import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Searchbar, Banner } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch, getAuthToken } from '../config/api';

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCourses();
  }, []);

  const checkAuth = async () => {
    const token = await getAuthToken();
    setIsLoggedIn(!!token);
  };

  const fetchCourses = async () => {
    try {
      const response = await authFetch(api.courses);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      setCourses([
        { id: 1, title: 'Music Fundamentals', description: 'Learn the basics', stage: 1, instrument: 'vocal', difficulty: 'beginner', image_url: null },
        { id: 2, title: 'Vocal Training', description: 'Develop your voice', stage: 1, instrument: 'vocal', difficulty: 'beginner', image_url: null },
        { id: 3, title: 'Piano Basics', description: 'Start piano', stage: 1, instrument: 'piano', difficulty: 'beginner', image_url: null },
      ]);
    } finally { setLoading(false); }
  };

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStage = selectedStage ? c.stage === selectedStage : true;
    return matchSearch && matchStage;
  });

  const getIcon = (i) => i === 'vocal' ? 'account-music' : i === 'piano' ? 'piano' : 'drum';
  const getColor = (d) => d === 'beginner' ? '#4CAF50' : d === 'intermediate' ? '#FF9800' : '#F44336';

  return (
    <View style={styles.container}>
      {/* Fix #13: Login prompt banner */}
      {!isLoggedIn && (
        <Banner
          visible={!isLoggedIn}
          actions={[{ label: 'Login', onPress: () => navigation.navigate('Login') }]}
          icon="account-circle"
          style={styles.banner}
        >
          Login to track progress and enroll in courses
        </Banner>
      )}

      <View style={styles.header}>
        <Title style={styles.headerTitle}>Welcome to Viswah</Title>
        <Paragraph style={styles.headerSub}>Start your music journey</Paragraph>
      </View>

      {/* Vocal Guru Quick Access */}
      <TouchableOpacity onPress={() => navigation.navigate('VocalGuru')} style={styles.guruBanner}>
        <MaterialCommunityIcons name="account-music" size={32} color="white" />
        <View style={styles.guruBannerText}>
          <Title style={styles.guruTitle}>Vocal Guru</Title>
          <Paragraph style={styles.guruSub}>Learn from AI music instructors</Paragraph>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
      </TouchableOpacity>

      <Searchbar placeholder="Search..." onChangeText={setSearchQuery} value={searchQuery} style={styles.search} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {[1,2,3,4].map(s => (
          <Chip key={s} selected={selectedStage===s} onPress={() => setSelectedStage(selectedStage===s?null:s)} style={styles.chip}>Stage {s}</Chip>
        ))}
      </ScrollView>

      <ScrollView style={styles.list}>
        {loading ? <Paragraph style={styles.loading}>Loading...</Paragraph> : filteredCourses.map(c => (
          <TouchableOpacity key={c.id} onPress={() => navigation.navigate('Course', { courseId: c.id })}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name={getIcon(c.instrument)} size={24} color="#6200EE" />
                  <Chip style={[styles.diff, {backgroundColor: getColor(c.difficulty)}]} textStyle={{color:'white',fontSize:12}}>{c.difficulty}</Chip>
                </View>
                <Title style={styles.cardTitle}>{c.title}</Title>
                <Paragraph style={styles.cardDesc}>{c.description}</Paragraph>
                <Paragraph style={styles.cardStage}>Stage {c.stage}</Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <Button mode="contained" icon="account" onPress={() => navigation.navigate(isLoggedIn ? 'Profile' : 'Login')} style={styles.btn}>
          {isLoggedIn ? 'Profile' : 'Login'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  banner: { backgroundColor: '#E8EAF6' },
  header: { padding: 20, backgroundColor: '#6200EE' },
  headerTitle: { color: 'white', fontSize: 24 },
  headerSub: { color: 'white', opacity: 0.8 },
  guruBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9C27B0', margin: 16, padding: 16, borderRadius: 12 },
  guruBannerText: { flex: 1, marginLeft: 12 },
  guruTitle: { color: 'white', fontSize: 18 },
  guruSub: { color: 'white', opacity: 0.8, fontSize: 12 },
  search: { margin: 16, elevation: 2 },
  chips: { paddingHorizontal: 16, marginBottom: 8 },
  chip: { marginRight: 8 },
  list: { flex: 1, paddingHorizontal: 16 },
  card: { marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { marginTop: 8, fontSize: 18 },
  cardDesc: { color: '#666', marginTop: 4 },
  cardStage: { color: '#999', marginTop: 8, fontStyle: 'italic' },
  diff: { height: 24 },
  loading: { textAlign: 'center', marginTop: 20, color: '#999' },
  bottom: { padding: 16, backgroundColor: 'white', elevation: 8 },
  btn: { paddingVertical: 4 },
});

export default HomeScreen;