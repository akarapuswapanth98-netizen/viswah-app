import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, ProgressBar, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const SpeechAnalysisScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isRecordingRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExercises();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await authFetch(api.speechExercises);
      if (res.ok) {
        const data = await res.json();
        setExercises(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    isRecordingRef.current = true;
    setResults(null);
    setTimeLeft(selectedExercise?.duration || 15);
    startPulse();
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleStopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Simulate pitch detection
    const pitchInterval = setInterval(() => {
      if (!isRecordingRef.current) {
        clearInterval(pitchInterval);
        return;
      }
      setCurrentPitch(Math.random() * 500 + 100);
    }, 100);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    stopPulse();
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Get results
    try {
      const res = await authFetch(`${api.speechScore}`, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: selectedExercise?.id,
          pitch_data: [currentPitch],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        {...createGradient(COLORS.gradient.sunset)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Animated.Text style={styles.headerTitle}>Speech Analysis</Animated.Text>
            <Animated.Text style={styles.headerSubtitle}>Analyze your voice in real-time</Animated.Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Selection */}
        {!selectedExercise && (
          <>
            <Animated.Text style={styles.sectionTitle}>Choose an Exercise</Animated.Text>
            {exercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => setSelectedExercise(exercise)}
              >
                <View style={[styles.exerciseIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <MaterialCommunityIcons name="music-note" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Animated.Text style={styles.exerciseTitle}>{exercise.title || 'Exercise'}</Animated.Text>
                  <Animated.Text style={styles.exerciseDesc}>{exercise.description}</Animated.Text>
                  <View style={styles.exerciseTags}>
                    <Tag label={`${exercise.duration || 15}s`} size="small" />
                    <Tag label={exercise.difficulty || 'Beginner'} size="small" variant="light" />
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Recording Interface */}
        {selectedExercise && !results && (
          <Animated.View style={[styles.recordingContainer, { opacity: fadeAnim }]}>
            {/* Exercise Info */}
            <View style={styles.exerciseHeader}>
              <Animated.Text style={styles.exerciseTitleLarge}>{selectedExercise.title}</Animated.Text>
              <Animated.Text style={styles.exerciseDescLarge}>{selectedExercise.description}</Animated.Text>
            </View>

            {/* Recording Circle */}
            <View style={styles.recordingCircleContainer}>
              <Animated.View style={[styles.recordingCircle, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={isRecording ? COLORS.gradient.sunset : [COLORS.gray200, COLORS.gray300]}
                  style={styles.recordingGradient}
                >
                  <MaterialCommunityIcons 
                    name={isRecording ? "microphone" : "microphone-outline"} 
                    size={60} 
                    color={isRecording ? COLORS.white : COLORS.gray500} 
                  />
                </LinearGradient>
              </Animated.View>
              
              {/* Pitch Indicator */}
              {isRecording && (
                <View style={styles.pitchIndicator}>
                  <Animated.Text style={styles.pitchValue}>{Math.round(currentPitch)} Hz</Animated.Text>
                </View>
              )}
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Animated.Text style={[styles.timerText, timeLeft <= 5 && styles.timerWarning]}>
                {timeLeft}s
              </Animated.Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              {!isRecording ? (
                <GradientButton
                  title="Start Recording"
                  onPress={handleStartRecording}
                  icon="microphone"
                  colors={COLORS.gradient.sunset}
                  style={styles.recordButton}
                />
              ) : (
                <GradientButton
                  title="Stop Recording"
                  onPress={handleStopRecording}
                  icon="stop"
                  colors={['#F44336', '#E53935']}
                  style={styles.recordButton}
                />
              )}
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setSelectedExercise(null)}
              >
                <Animated.Text style={styles.cancelText}>Cancel</Animated.Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Results */}
        {results && (
          <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
            <View style={styles.resultsHeader}>
              <MaterialCommunityIcons name="chart-bar" size={40} color={COLORS.primary} />
              <Animated.Text style={styles.resultsTitle}>Analysis Complete</Animated.Text>
            </View>

            {/* Score Card */}
            <View style={styles.scoreCard}>
              <Animated.Text style={styles.scoreLabel}>Overall Score</Animated.Text>
              <Animated.Text style={[styles.scoreValue, { color: results.score >= 70 ? COLORS.success : results.score >= 50 ? COLORS.warning : COLORS.error }]}>
                {results.score || 0}%
              </Animated.Text>
              <ProgressBar 
                progress={(results.score || 0) / 100} 
                height={10}
                color={results.score >= 70 ? COLORS.success : results.score >= 50 ? COLORS.warning : COLORS.error}
              />
            </View>

            {/* Detailed Results */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="music-note" size={20} color={COLORS.primary} />
                <Animated.Text style={styles.detailLabel}>Pitch Accuracy</Animated.Text>
                <Animated.Text style={styles.detailValue}>{results.pitch_accuracy || 0}%</Animated.Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="waveform" size={20} color={COLORS.secondary} />
                <Animated.Text style={styles.detailLabel}>Stability</Animated.Text>
                <Animated.Text style={styles.detailValue}>{results.stability || 0}%</Animated.Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="volume-high" size={20} color={COLORS.success} />
                <Animated.Text style={styles.detailLabel}>Volume</Animated.Text>
                <Animated.Text style={styles.detailValue}>{results.volume || 0}%</Animated.Text>
              </View>
            </View>

            {/* Feedback */}
            {results.feedback && (
              <View style={styles.feedbackCard}>
                <Animated.Text style={styles.feedbackTitle}>Feedback</Animated.Text>
                <Animated.Text style={styles.feedbackText}>{results.feedback}</Animated.Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <GradientButton
                title="Try Again"
                onPress={() => { setResults(null); setSelectedExercise(null); }}
                icon="refresh"
                colors={COLORS.gradient.primary}
                style={styles.actionButton}
              />
              <TouchableOpacity 
                style={styles.backToListButton}
                onPress={() => { setResults(null); setSelectedExercise(null); }}
              >
                <Animated.Text style={styles.backToListText}>Back to Exercises</Animated.Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  exerciseDesc: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  exerciseHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  exerciseTitleLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  exerciseDescLarge: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  recordingCircleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  recordingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    ...SHADOWS.large,
  },
  recordingGradient: {
    flex: 1,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchIndicator: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  pitchValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timerContainer: {
    marginBottom: SPACING.xxl,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.black,
  },
  timerWarning: {
    color: COLORS.error,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
  },
  recordButton: {
    width: '80%',
    marginBottom: SPACING.lg,
  },
  cancelButton: {
    padding: SPACING.md,
  },
  cancelText: {
    color: COLORS.gray500,
    fontSize: 14,
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: SPACING.md,
  },
  scoreCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
    marginLeft: SPACING.md,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  feedbackCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.gray700,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  actionButton: {
    width: '80%',
    marginBottom: SPACING.lg,
  },
  backToListButton: {
    padding: SPACING.md,
  },
  backToListText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default SpeechAnalysisScreen;
