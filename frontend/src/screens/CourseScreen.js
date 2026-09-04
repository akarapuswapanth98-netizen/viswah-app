import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch } from '../config/api';

const CourseScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, lRes, pRes] = await Promise.all([
        authFetch(api.course(courseId)),
        authFetch(api.courseLessons(courseId)),
        authFetch(api.progress).catch(() => ({ json: () => [] })),
      ]);
      setCourse(await cRes.json());
      setLessons(await lRes.json());
      const prog = await pRes.json();
      const completed = prog.filter(p => p.completed).length;
      setProgress(lessons.length > 0 ? completed / lessons.length : 0);
    } catch (e) {
      setCourse({ id: courseId, title: 'Course', description: 'Loading...', stage: 1, difficulty: 'beginner' });
      setLessons([{ id: 1, title: 'Lesson 1', order: 1, lesson_type: 'theory', duration_minutes: 10 }]);
    } finally { setLoading(false); }
  };

  const getIcon = (t) => t === 'theory' ? 'book-open-variant' : t === 'practice' ? 'music-note' : 'frequently-asked-questions';
  const getColor = (t) => t === 'theory' ? '#2196F3' : t === 'practice' ? '#4CAF50' : '#FF9800';

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{course?.title}</Title>
        <Paragraph style={styles.desc}>{course?.description}</Paragraph>
        <View style={styles.chips}>
          <Chip style={styles.chip}>Stage {course?.stage}</Chip>
          <Chip style={[styles.chip, {backgroundColor:'#4CAF50'}]} textStyle={{color:'white'}}>{course?.difficulty}</Chip>
        </View>
      </View>

      <View style={styles.progBox}>
        <Paragraph>Progress</Paragraph>
        <ProgressBar progress={progress} color="#6200EE" style={styles.bar} />
        <Paragraph style={styles.progText}>{Math.round(progress*100)}% Complete</Paragraph>
      </View>

      <ScrollView style={styles.list}>
        {lessons.map(l => (
          <TouchableOpacity key={l.id} onPress={() => navigation.navigate('Lesson', { lessonId: l.id, lessonTitle: l.title })}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.icon, {backgroundColor: getColor(l.lesson_type)}]}>
                      <MaterialCommunityIcons name={getIcon(l.lesson_type)} size={24} color="white" />
                    </View>
                    <View style={styles.info}>
                      <Title style={styles.lessonTitle}>{l.title}</Title>
                      <Paragraph style={styles.meta}>{l.lesson_type} • {l.duration_minutes} min</Paragraph>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <Button mode="contained" icon="play" onPress={() => lessons[0] && navigation.navigate('Lesson', { lessonId: lessons[0].id, lessonTitle: lessons[0].title })} style={styles.btn}>Continue</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#6200EE' },
  title: { color: 'white', fontSize: 22 },
  desc: { color: 'white', opacity: 0.8, marginTop: 4 },
  chips: { flexDirection: 'row', marginTop: 12 },
  chip: { marginRight: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  progBox: { padding: 16, backgroundColor: 'white', margin: 16, borderRadius: 8, elevation: 2 },
  bar: { marginTop: 8, height: 8, borderRadius: 4 },
  progText: { marginTop: 8, fontSize: 12, color: '#999', textAlign: 'right' },
  list: { flex: 1, paddingHorizontal: 16 },
  card: { marginBottom: 12, elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  info: { marginLeft: 12, flex: 1 },
  lessonTitle: { fontSize: 16 },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  bottom: { padding: 16, backgroundColor: 'white', elevation: 8 },
  btn: { paddingVertical: 4 },
});

export default CourseScreen;