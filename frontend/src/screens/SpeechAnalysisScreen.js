import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, Chip, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, authFetch } from '../config/api';

const SpeechAnalysisScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [realtimePitch, setRealtimePitch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => { fetchExercises(); }, []);

  const fetchExercises = async () => {
    try {
      const res = await authFetch(api.speechExercises);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : []);
    } catch (e) {
      setExercises([
        { id: 'scale_c_major', name: 'C Major Scale', description: 'Sing the C major scale', difficulty: 'beginner' },
        { id: 'vocal_warmup', name: 'Vocal Warm-up', description: 'Five-note pattern', difficulty: 'beginner' },
        { id: 'pitch_stability', name: 'Pitch Stability', description: 'Hold each note steady', difficulty: 'intermediate' },
      ]);
    } finally { setLoading(false); }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0);
    setAnalysis(null);
    setRealtimePitch(null);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
      // Simulate real-time pitch detection
      const fakeNotes = ['C4', 'D4', 'E4', 'F4', 'G4'];
      setRealtimePitch(fakeNotes[Math.floor(Math.random() * fakeNotes.length)]);
    }, 1000);

    // Auto-stop after exercise duration
    setTimeout(() => {
      if (isRecording) stopRecording();
    }, 15000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    setRealtimePitch(null);

    // Simulate analysis result
    if (selectedExercise) {
      setAnalysis({
        exercise: selectedExercise.name,
        overall_score: Math.floor(Math.random() * 40) + 60,
        total_notes: 8,
        analyzed_notes: 8,
        note_results: Array(8).fill(null).map((_, i) => ({
          score: Math.floor(Math.random() * 30) + 70,
          target_note: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4'][i],
          actual_note: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4'][i],
          cents_off: Math.floor(Math.random() * 40) - 20,
          feedback: ['Great pitch!', 'Almost there', 'Good tone'][Math.floor(Math.random() * 3)]
        })),
        summary: 'Good performance! Keep practicing for better accuracy.'
      });
    }
  };

  const getScoreColor = (score) => score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';

  const getDifficultyColor = (d) => d === 'beginner' ? '#4CAF50' : d === 'intermediate' ? '#FF9800' : '#F44336';

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Speech Analysis</Title>
        <Paragraph style={styles.headerSub}>Analyze your voice in real-time</Paragraph>
      </View>

      <ScrollView style={styles.content}>
        {/* Real-time Display */}
        {isRecording && (
          <Card style={styles.realtimeCard}>
            <Card.Content style={styles.realtimeContent}>
              <MaterialCommunityIcons name="microphone" size={48} color="#F44336" />
              <Title style={styles.recordingTitle}>Recording...</Title>
              <Paragraph style={styles.timer}>{recordingTime}s</Paragraph>
              {realtimePitch && (
                <View style={styles.pitchDisplay}>
                  <Title style={styles.pitchNote}>{realtimePitch}</Title>
                  <Paragraph style={styles.pitchLabel}>Detected Pitch</Paragraph>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Exercises */}
        {!isRecording && !analysis && (
          <>
            <Title style={styles.sectionTitle}>Choose Exercise</Title>
            {exercises.map(ex => (
              <TouchableOpacity key={ex.id} onPress={() => setSelectedExercise(ex)}>
                <Card style={[styles.exerciseCard, selectedExercise?.id === ex.id && styles.exerciseSelected]}>
                  <Card.Content>
                    <View style={styles.exerciseHeader}>
                      <MaterialCommunityIcons name="music-note" size={24} color="#6200EE" />
                      <View style={styles.exerciseInfo}>
                        <Title style={styles.exerciseName}>{ex.name}</Title>
                        <Paragraph style={styles.exerciseDesc}>{ex.description}</Paragraph>
                      </View>
                      <Chip style={[styles.diffChip, {backgroundColor: getDifficultyColor(ex.difficulty)}]} textStyle={{color: 'white', fontSize: 10}}>
                        {ex.difficulty}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}

            {selectedExercise && (
              <Button mode="contained" icon="microphone" onPress={startRecording} style={styles.recordBtn}>
                Start Recording
              </Button>
            )}
          </>
        )}

        {/* Results */}
        {analysis && (
          <Card style={styles.resultCard}>
            <Card.Content>
              <View style={styles.scoreHeader}>
                <View style={[styles.scoreCircle, {borderColor: getScoreColor(analysis.overall_score)}]}>
                  <Title style={[styles.scoreNum, {color: getScoreColor(analysis.overall_score)}]}>{analysis.overall_score}</Title>
                  <Paragraph style={styles.scoreLabel}>Score</Paragraph>
                </View>
                <View style={styles.scoreInfo}>
                  <Title>{analysis.exercise}</Title>
                  <Paragraph style={styles.scoreSummary}>{analysis.summary}</Paragraph>
                  <Paragraph style={styles.noteCount}>{analysis.analyzed_notes}/{analysis.total_notes} notes analyzed</Paragraph>
                </View>
              </View>

              <Title style={styles.sectionTitle}>Note-by-Note</Title>
              {analysis.note_results?.map((note, i) => (
                <View key={i} style={styles.noteRow}>
                  <View style={styles.noteInfo}>
                    <Paragraph style={styles.noteTarget}>{note.target_note}</Paragraph>
                    <Paragraph style={[styles.noteActual, {color: note.target_note === note.actual_note ? '#4CAF50' : '#FF9800'}]}>
                      {note.actual_note}
                    </Paragraph>
                  </View>
                  <ProgressBar progress={note.score / 100} color={getScoreColor(note.score)} style={styles.noteBar} />
                  <Paragraph style={styles.noteScore}>{note.score}%</Paragraph>
                </View>
              ))}

              <Button mode="outlined" onPress={() => { setAnalysis(null); setSelectedExercise(null); }} style={styles.retryBtn}>
                Try Another Exercise
              </Button>
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
  realtimeCard: { marginBottom: 16, elevation: 4, backgroundColor: '#FFEBEE' },
  realtimeContent: { alignItems: 'center', padding: 20 },
  recordingTitle: { color: '#F44336', marginTop: 8 },
  timer: { fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  pitchDisplay: { marginTop: 16, alignItems: 'center' },
  pitchNote: { fontSize: 48, color: '#6200EE' },
  pitchLabel: { color: '#666' },
  exerciseCard: { marginBottom: 12, elevation: 2 },
  exerciseSelected: { borderColor: '#6200EE', borderWidth: 2 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseName: { fontSize: 16 },
  exerciseDesc: { fontSize: 12, color: '#666' },
  diffChip: { height: 24 },
  recordBtn: { marginTop: 16 },
  resultCard: { elevation: 2 },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 28, fontWeight: 'bold' },
  scoreLabel: { fontSize: 12, color: '#666' },
  scoreInfo: { flex: 1, marginLeft: 16 },
  scoreSummary: { color: '#666', marginTop: 4 },
  noteCount: { color: '#999', marginTop: 4, fontSize: 12 },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  noteInfo: { width: 60 },
  noteTarget: { fontWeight: 'bold', fontSize: 14 },
  noteActual: { fontSize: 12 },
  noteBar: { flex: 1, marginHorizontal: 8, height: 8 },
  noteScore: { width: 40, textAlign: 'right', fontSize: 12 },
  retryBtn: { marginTop: 16 },
});

export default SpeechAnalysisScreen;