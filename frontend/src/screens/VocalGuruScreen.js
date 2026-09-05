import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch } from '../config/api';

const VocalGuruScreen = ({ navigation }) => {
  const [gurus, setGurus] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teaching, setTeaching] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const fallbackGurus = [
      { id: 'classical', name: 'Pandit Ravi', description: 'Classical music maestro', specialties: ['raga', 'tal', 'classical scales'] },
      { id: 'contemporary', name: 'Maya Singh', description: 'Modern vocal coach', specialties: ['pop', 'rock', 'jazz'] },
      { id: 'carnatic', name: 'Smt. Priya', description: 'Carnatic music expert', specialties: ['carnatic', 'swaras', 'bhajans'] },
    ];
    try {
      const [gRes, tRes] = await Promise.all([
        authFetch(api.vocalGurus),
        authFetch(api.vocalGuruTopics),
      ]);
      const gurusData = gRes.ok ? await gRes.json() : [];
      const topicsData = tRes.ok ? await tRes.json() : [];
      setGurus(Array.isArray(gurusData) && gurusData.length > 0 ? gurusData : fallbackGurus);
      setTopics(Array.isArray(topicsData) && topicsData.length > 0 ? topicsData : ['breathing', 'pitch', 'warmup']);
    } catch (e) {
      setGurus(fallbackGurus);
      setTopics(['breathing', 'pitch', 'warmup']);
    } finally { setLoading(false); }
  };

  const handleGreet = async (guruId) => {
    setSelectedGuru(guruId);
    setTeaching(true);
    try {
      const res = await authFetch(api.vocalGuruGreet(guruId), { method: 'POST' });
      if (!res.ok) throw new Error('Guru not found');
      const data = await res.json();
      Alert.alert(data.name || 'Guru', data.greeting || 'Welcome!');
    } catch (e) {
      Alert.alert('Error', 'Could not connect to guru');
    } finally { setTeaching(false); }
  };

  const handleTeach = async (topic) => {
    if (!selectedGuru) {
      Alert.alert('Select Guru', 'Please greet a guru first');
      return;
    }
    setTeaching(true);
    try {
      const res = await authFetch(api.vocalGuruTeach(topic, selectedGuru), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to load lesson');
      const data = await res.json();
      setLesson(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load lesson');
    } finally { setTeaching(false); }
  };

  const getGuruColor = (id) => {
    switch (id) {
      case 'classical': return '#FF9800';
      case 'contemporary': return '#E91E63';
      case 'carnatic': return '#9C27B0';
      default: return '#6200EE';
    }
  };

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Vocal Guru</Title>
        <Paragraph style={styles.headerSub}>Learn from AI music instructors</Paragraph>
      </View>

      <ScrollView style={styles.content}>
        {/* Gurus Section */}
        <Title style={styles.sectionTitle}>Choose Your Guru</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gurusScroll}>
          {gurus.map(guru => (
            <TouchableOpacity key={guru.id} onPress={() => handleGreet(guru.id)}>
              <Card style={[styles.guruCard, selectedGuru === guru.id && styles.guruSelected]}>
                <Card.Content>
                  <View style={[styles.guruIcon, {backgroundColor: getGuruColor(guru.id)}]}>
                    <MaterialCommunityIcons name="account-music" size={32} color="white" />
                  </View>
                  <Title style={styles.guruName}>{guru.name}</Title>
                  <Paragraph style={styles.guruDesc}>{guru.description}</Paragraph>
                  <View style={styles.specialties}>
                    {guru.specialties?.slice(0, 2).map(s => (
                      <Chip key={s} style={styles.specialtyChip}>{s}</Chip>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Topics Section */}
        <Title style={styles.sectionTitle}>Lessons</Title>
        {topics.map(topic => (
          <TouchableOpacity key={topic} onPress={() => handleTeach(topic)}>
            <Card style={styles.topicCard}>
              <Card.Content>
                <View style={styles.topicContent}>
                  <MaterialCommunityIcons name="music-note" size={24} color="#6200EE" />
                  <View style={styles.topicInfo}>
                    <Title style={styles.topicTitle}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Title>
                    <Paragraph style={styles.topicDesc}>Learn {topic} techniques</Paragraph>
                  </View>
                  <MaterialCommunityIcons name="play-circle" size={24} color="#6200EE" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Lesson Display */}
        {lesson && (
          <Card style={styles.lessonCard}>
            <Card.Content>
              <Title style={styles.lessonTitle}>{lesson.title}</Title>
              <Paragraph style={styles.lessonGuru}>With {lesson.guru_name}</Paragraph>

              <Title style={styles.stepsTitle}>Steps:</Title>
              {lesson.steps?.map((step, i) => (
                <View key={i} style={styles.step}>
                  <Paragraph style={styles.stepNum}>{i + 1}.</Paragraph>
                  <Paragraph style={styles.stepText}>{step}</Paragraph>
                </View>
              ))}

              <Title style={styles.tipsTitle}>Tips:</Title>
              {lesson.tips?.map((tip, i) => (
                <Paragraph key={i} style={styles.tip}>• {tip}</Paragraph>
              ))}

              {lesson.audio_available && (
                <Button mode="contained" icon="play" style={styles.playBtn} onPress={() => Alert.alert('Coming Soon', 'Audio playback will be available soon!')}>
                  Listen to Guru
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#6200EE' },
  headerTitle: { color: 'white', fontSize: 24 },
  headerSub: { color: 'white', opacity: 0.8 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, marginTop: 16, marginBottom: 12 },
  gurusScroll: { marginBottom: 16 },
  guruCard: { width: 200, marginRight: 16, elevation: 2 },
  guruSelected: { borderColor: '#6200EE', borderWidth: 2 },
  guruIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  guruName: { fontSize: 16 },
  guruDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  specialties: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  specialtyChip: { marginRight: 4, marginBottom: 4, height: 24 },
  topicCard: { marginBottom: 12, elevation: 2 },
  topicContent: { flexDirection: 'row', alignItems: 'center' },
  topicInfo: { flex: 1, marginLeft: 12 },
  topicTitle: { fontSize: 16 },
  topicDesc: { fontSize: 12, color: '#666' },
  lessonCard: { marginTop: 16, elevation: 2, backgroundColor: '#E8EAF6' },
  lessonTitle: { fontSize: 20 },
  lessonGuru: { color: '#666', marginTop: 4 },
  stepsTitle: { marginTop: 16, marginBottom: 8 },
  step: { flexDirection: 'row', marginBottom: 8 },
  stepNum: { fontWeight: 'bold', marginRight: 8 },
  stepText: { flex: 1 },
  tipsTitle: { marginTop: 16, marginBottom: 8 },
  tip: { marginBottom: 4, color: '#666' },
  playBtn: { marginTop: 16 },
});

export default VocalGuruScreen;