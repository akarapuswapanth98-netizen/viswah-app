import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch, getAuthToken } from '../config/api';

const QuizScreen = ({ route, navigation }) => {
  const { lessonId } = route.params || {};
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const startTime = useRef(null);

  useEffect(() => { 
    startTime.current = Date.now();
    fetchQuiz(); 
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await authFetch(api.lesson(lessonId));
      if (!res.ok) throw new Error('Lesson not found');
      const data = await res.json();
      if (data.quiz_questions?.length > 0) {
        setQuiz({ questions: data.quiz_questions });
      } else { throw new Error('No quiz'); }
    } catch {
      setQuiz({ questions: [
        { question: "How many notes in the musical alphabet?", options: ["5","6","7","8"], correct_answer: "7" },
        { question: "What comes after G?", options: ["H","A","I","F"], correct_answer: "A" },
      ]});
    } finally { setLoading(false); }
  };

  const selectAnswer = (qi, ans) => setAnswers({...answers, [qi]: ans});

  const next = () => {
    if (currentQ < quiz.questions.length - 1) setCurrentQ(currentQ + 1);
    else calculateScore();
  };

  const prev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };

  const calculateScore = async () => {
    let correct = 0;
    quiz.questions.forEach((q, i) => { if (answers[i] === q.correct_answer) correct++; });
    const finalScore = Math.round((correct / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);

    // Fix #2, #11: Save score only if authenticated
    const token = await getAuthToken();
    if (token) {
      try {
        const timeSpent = Math.round((Date.now() - startTime.current) / 60000);
        await authFetch(api.progress, {
          method: 'POST',
          body: JSON.stringify({
            lesson_id: Number(lessonId),
            completed: true,
            score: finalScore,
            time_spent_minutes: Math.max(1, timeSpent)
          }),
        });
      } catch (e) {
        console.log('Could not save score');
      }
    }
  };

  const retry = () => { setCurrentQ(0); setAnswers({}); setShowResults(false); setScore(0); };

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  if (showResults) {
    const pass = score >= 70;
    return (
      <View style={styles.container}>
        <View style={styles.results}>
          <Card style={styles.resultCard}>
            <Card.Content style={styles.resultContent}>
              <MaterialCommunityIcons name={pass ? "check-circle" : "alert-circle"} size={80} color={pass ? "#4CAF50" : "#F44336"} />
              <Title style={styles.resultTitle}>{pass ? "Great job!" : "Keep trying!"}</Title>
              <Paragraph style={styles.resultScore}>Score: {score}%</Paragraph>
              <View style={styles.resultBtns}>
                <Button mode="outlined" onPress={retry} style={styles.retryBtn}>Retry</Button>
                <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.homeBtn}>Home</Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  const q = quiz.questions[currentQ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Question {currentQ + 1}/{quiz.questions.length}</Title>
      </View>
      <View style={styles.prog}><ProgressBar progress={(currentQ+1)/quiz.questions.length} color="#6200EE" style={styles.bar} /></View>
      <ScrollView style={styles.qContainer}>
        <Card style={styles.qCard}>
          <Card.Content>
            <Title style={styles.qText}>{q.question}</Title>
            {q.options.map((opt, i) => (
              <TouchableOpacity key={i} onPress={() => selectAnswer(currentQ, opt)} style={[styles.opt, answers[currentQ]===opt && styles.selected]}>
                <RadioButton value={opt} status={answers[currentQ]===opt ? 'checked' : 'unchecked'} onPress={() => selectAnswer(currentQ, opt)} />
                <Paragraph style={[styles.optText, answers[currentQ]===opt && styles.selectedText]}>{opt}</Paragraph>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
      <View style={styles.bottom}>
        <Button mode="outlined" onPress={prev} disabled={currentQ===0} style={styles.navBtn}>Prev</Button>
        <Button mode="contained" onPress={next} disabled={!answers[currentQ]} style={styles.navBtn}>{currentQ===quiz.questions.length-1?'Finish':'Next'}</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#6200EE' },
  title: { color: 'white', fontSize: 22 },
  prog: { padding: 16, backgroundColor: 'white' },
  bar: { height: 8, borderRadius: 4 },
  qContainer: { flex: 1, padding: 16 },
  qCard: { elevation: 2 },
  qText: { fontSize: 18, marginBottom: 20 },
  opt: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  selected: { backgroundColor: '#E8EAF6', borderColor: '#6200EE' },
  optText: { flex: 1, marginLeft: 8 },
  selectedText: { color: '#6200EE', fontWeight: 'bold' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 8 },
  navBtn: { flex: 1, marginHorizontal: 8 },
  results: { flex: 1, justifyContent: 'center', padding: 16 },
  resultCard: { elevation: 4 },
  resultContent: { alignItems: 'center', padding: 20 },
  resultTitle: { fontSize: 24, marginTop: 16 },
  resultScore: { fontSize: 18, color: '#666', marginTop: 8 },
  resultBtns: { flexDirection: 'row', marginTop: 32, width: '100%' },
  retryBtn: { flex: 1, marginRight: 8 },
  homeBtn: { flex: 1, marginLeft: 8 },
});

export default QuizScreen;