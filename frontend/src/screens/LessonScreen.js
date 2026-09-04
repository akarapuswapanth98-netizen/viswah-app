import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch } from '../config/api';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, lessonTitle } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLesson(); }, []);

  const fetchLesson = async () => {
    try {
      const res = await authFetch(api.lesson(lessonId));
      setLesson(await res.json());
    } catch (e) {
      setLesson({
        id: lessonId, title: lessonTitle || 'Lesson',
        content: '# Introduction to Music\n\nMusic is made up of notes.\n\n## The Musical Alphabet\n\nA, B, C, D, E, F, G\n\n## Practice\n\n1. Say the notes out loud\n2. Find them on an instrument\n3. Listen to each note',
        duration_minutes: 10
      });
    } finally { setLoading(false); }
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
              if (line.startsWith('**') && line.endsWith('**')) return <Paragraph key={i} style={styles.bold}>{line.slice(2, -2)}</Paragraph>;
              if (line.startsWith('- ')) return <View key={i} style={styles.list}><Paragraph>• {line.slice(2)}</Paragraph></View>;
              if (line.match(/^\d+\./)) return <View key={i} style={styles.list}><Paragraph>{line}</Paragraph></View>;
              if (line.trim() === '') return <View key={i} style={{height:12}} />;
              return <Paragraph key={i} style={styles.p}>{line}</Paragraph>;
            })}
          </Card.Content>
        </Card>

        <Card style={styles.tips}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#FFC107" />
              <Title style={styles.tipsTitle}>Practice Tips</Title>
            </View>
            <Divider style={{marginVertical:12}} />
            <Paragraph style={styles.tip}>• Practice 15-20 minutes daily</Paragraph>
            <Paragraph style={styles.tip}>• Use a metronome</Paragraph>
            <Paragraph style={styles.tip}>• Record yourself</Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottom}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backBtn}>Back</Button>
        <Button mode="contained" icon="arrow-right" onPress={() => navigation.navigate('Quiz', { lessonId })} style={styles.nextBtn}>Quiz</Button>
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
  list: { marginLeft: 16, marginBottom: 4 },
  tips: { marginBottom: 16, elevation: 2, backgroundColor: '#FFF8E1' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center' },
  tipsTitle: { marginLeft: 8, fontSize: 16 },
  tip: { marginBottom: 8, color: '#666' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 8 },
  backBtn: { flex: 1, marginRight: 8 },
  nextBtn: { flex: 1, marginLeft: 8 },
});

export default LessonScreen;