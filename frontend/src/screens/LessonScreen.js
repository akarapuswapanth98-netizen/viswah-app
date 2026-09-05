import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Paragraph, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch, getAuthToken } from '../config/api';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, lessonTitle } = route.params || {};
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => { fetchLesson(); }, []);

  const fetchLesson = async () => {
    try {
      const res = await authFetch(api.lesson(lessonId));
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setLesson(data);
    } catch (e) {
      setLesson({
        id: lessonId, title: lessonTitle || 'Lesson',
        content: '# Introduction to Music\n\nMusic is made up of notes.\n\n## The Musical Alphabet\n\nA, B, C, D, E, F, G',
        duration_minutes: 10
      });
    } finally { setLoading(false); }
  };

  // Fix #12: Mark as complete
  const markComplete = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Login Required', 'Please login to save progress', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel' }
      ]);
      return;
    }

    setCompleting(true);
    try {
      const res = await authFetch(api.progress, {
        method: 'POST',
        body: JSON.stringify({
          lesson_id: Number(lessonId),
          completed: true,
          score: 100,
          time_spent_minutes: lesson?.duration_minutes || 10
        }),
      });
      if (!res.ok) throw new Error('Failed');
      Alert.alert('Done', 'Lesson completed!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save progress');
    } finally { setCompleting(false); }
  };

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{lesson?.title}</Title>
        <View style={styles.info}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="white" />
          <Paragraph style={styles.time}>{lesson?.duration_minutes} min</Paragraph>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {lesson?.content?.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <Title key={i} style={styles.h1}>{line.slice(2)}</Title>;
              if (line.startsWith('## ')) return <Title key={i} style={styles.h2}>{line.slice(3)}</Title>;
              if (line.startsWith('- ')) return <View key={i} style={styles.list}><Paragraph>• {line.slice(2)}</Paragraph></View>;
              if (line.match(/^\d+\./)) return <View key={i} style={styles.list}><Paragraph>{line}</Paragraph></View>;
              if (line.trim() === '') return <View key={i} style={{height:12}} />;
              // Fix #14: Handle inline bold
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return <Paragraph key={i} style={styles.p}>{parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <Paragraph key={j} style={styles.boldInline}>{part.slice(2, -2)}</Paragraph>;
                }
                return part;
              })}</Paragraph>;
            })}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottom}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backBtn}>Back</Button>
        <Button mode="contained" onPress={markComplete} loading={completing} style={styles.completeBtn}>Mark Complete</Button>
        <Button mode="contained" onPress={() => navigation.navigate('Quiz', { lessonId })} style={styles.quizBtn}>Quiz</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#6200EE' },
  title: { color: 'white', fontSize: 20 },
  info: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  time: { color: 'white', opacity: 0.8, marginLeft: 4, fontSize: 14 },
  content: { flex: 1, padding: 16 },
  card: { marginBottom: 16, elevation: 2 },
  h1: { fontSize: 24, marginBottom: 12 },
  h2: { fontSize: 18, marginTop: 16, marginBottom: 8 },
  p: { lineHeight: 24, marginBottom: 4 },
  bold: { fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  boldInline: { fontWeight: 'bold' },
  list: { marginLeft: 16, marginBottom: 4 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 8 },
  backBtn: { flex: 1, marginRight: 4 },
  completeBtn: { flex: 1, marginHorizontal: 4 },
  quizBtn: { flex: 1, marginLeft: 4 },
});

export default LessonScreen;