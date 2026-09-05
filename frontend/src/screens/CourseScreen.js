import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch, getAuthToken } from '../config/api';

const CourseScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        authFetch(api.course(courseId)),
        authFetch(api.courseLessons(courseId)),
      ]);
      if (!cRes.ok || !lRes.ok) throw new Error('Failed to fetch');
      const courseData = await cRes.json();
      const lessonsData = await lRes.json();
      setCourse(courseData);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);

      // Check enrollment and progress
      const token = await getAuthToken();
      if (token) {
        try {
          const [eRes, pRes] = await Promise.all([
            authFetch(api.enrolled),
            authFetch(api.progress),
          ]);
          const enrolledCourses = eRes.ok ? await eRes.json() : [];
          const enrolledIds = Array.isArray(enrolledCourses) ? enrolledCourses.map(c => c.id) : [];
          setEnrolled(enrolledIds.includes(Number(courseId)));

          const prog = pRes.ok ? await pRes.json() : [];
          // Fix #3: Filter progress to only lessons in this course
          const lessonIds = lessonsData.map(l => l.id);
          const courseProg = Array.isArray(prog) ? prog.filter(p => lessonIds.includes(p.lesson_id)) : [];
          const completedIdsList = courseProg.filter(p => p.completed).map(p => p.lesson_id);
          setCompletedIds(completedIdsList);
          const completed = lessonsData.filter(l => completedIdsList.includes(l.id)).length;
          setProgress(lessonsData.length > 0 ? completed / lessonsData.length : 0);
        } catch (e) { console.warn('Failed to load enrollment data:', e); }
      }
    } catch (e) {
      setCourse({ id: courseId, title: 'Course', description: 'Loading...', stage: 1, difficulty: 'beginner', instrument: 'vocal', image_url: null });
      setLessons([{ id: 1, title: 'Lesson 1', order: 1, lesson_type: 'theory', duration_minutes: 10 }]);
    } finally { setLoading(false); }
  };

  const handleEnroll = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Login Required', 'Please login to enroll', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel' }
      ]);
      return;
    }

    setEnrolling(true);
    try {
      const res = await authFetch(api.enroll(courseId), { method: 'POST' });
      if (res.ok) {
        setEnrolled(true);
        Alert.alert('Enrolled!', 'You can now start learning');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Could not enroll');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not enroll');
    } finally { setEnrolling(false); }
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

      {enrolled ? (
        <View style={styles.progBox}>
          <Paragraph>Progress</Paragraph>
          <ProgressBar progress={progress} color="#6200EE" style={styles.bar} />
          <Paragraph style={styles.progText}>{Math.round(progress*100)}% Complete</Paragraph>
        </View>
      ) : (
        <View style={styles.enrollBox}>
          <Button mode="contained" onPress={handleEnroll} loading={enrolling} icon="school" style={styles.enrollBtn}>
            Enroll in this Course
          </Button>
        </View>
      )}

      <ScrollView style={styles.list}>
        {lessons.map(l => (
          <TouchableOpacity key={l.id} onPress={() => {
            if (!enrolled) {
              Alert.alert('Enroll First', 'Please enroll to access lessons');
              return;
            }
            navigation.navigate('Lesson', { lessonId: l.id, lessonTitle: l.title });
          }}>
            <Card style={[styles.card, !enrolled && styles.cardLocked]}>
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
                  <MaterialCommunityIcons name={enrolled ? "chevron-right" : "lock"} size={24} color={enrolled ? "#999" : "#ccc"} />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {enrolled && (
        <View style={styles.bottom}>
          <Button mode="contained" icon="play" onPress={() => {
            // Find first incomplete lesson
            const nextLesson = lessons.find(l => !completedIds.includes(l.id)) || lessons[0];
            if (nextLesson) navigation.navigate('Lesson', { lessonId: nextLesson.id, lessonTitle: nextLesson.title });
          }} style={styles.btn}>Continue</Button>
        </View>
      )}
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
  enrollBox: { padding: 16, backgroundColor: 'white', margin: 16, borderRadius: 8, elevation: 2, alignItems: 'center' },
  enrollBtn: { width: '100%' },
  list: { flex: 1, paddingHorizontal: 16 },
  card: { marginBottom: 12, elevation: 2 },
  cardLocked: { opacity: 0.6 },
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