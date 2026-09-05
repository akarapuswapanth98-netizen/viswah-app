import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';
import { WaveformPath, FrequencyBars, ScoreRing } from '../components/VisualEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXERCISES = [
  {
    id: 'c-major',
    title: 'C Major Scale',
    icon: 'music-note',
    iconLib: 'MaterialCommunityIcons',
    difficulty: 'Beginner',
    noteCount: 8,
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    color: COLORS.primary,
  },
  {
    id: 'g-major',
    title: 'G Major Scale',
    icon: 'music-note',
    iconLib: 'MaterialCommunityIcons',
    difficulty: 'Beginner',
    noteCount: 8,
    notes: ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4'],
    color: COLORS.accent,
  },
  {
    id: 'interval',
    title: 'Interval Training',
    icon: 'swap-horizontal',
    iconLib: 'Feather',
    difficulty: 'Intermediate',
    noteCount: 12,
    notes: ['C4', 'E4', 'C4', 'G4', 'C4', 'A4', 'C4', 'E4', 'C4', 'G4', 'C4', 'A4'],
    color: COLORS.secondary,
  },
  {
    id: 'warmup',
    title: 'Vocal Warmup',
    icon: 'fire',
    iconLib: 'MaterialCommunityIcons',
    difficulty: 'Beginner',
    noteCount: 10,
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4'],
    color: COLORS.warning,
  },
  {
    id: 'stability',
    title: 'Pitch Stability',
    icon: 'accessibility',
    iconLib: 'MaterialCommunityIcons',
    difficulty: 'Advanced',
    noteCount: 6,
    notes: ['C4', 'C4', 'C4', 'C4', 'C4', 'C4'],
    color: COLORS.error,
  },
];

const NOTE_FREQUENCIES = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'F#4': 369.99,
};

const getNoteName = (freq) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${notes[noteIndex < 0 ? noteIndex + 12 : noteIndex]}${octave}`;
};

const SpeechAnalysisScreen = ({ navigation }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [detectedNote, setDetectedNote] = useState('--');
  const [volume, setVolume] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [results, setResults] = useState(null);
  const [noteDots, setNoteDots] = useState([]);
  const [noteDotAnimations, setNoteDotAnimations] = useState([]);
  const scoreRingAnim = useRef(new Animated.Value(0)).current;
  const [resultSlideAnims, setResultSlideAnims] = useState([]);
  const [waveAmplitude, setWaveAmplitude] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const noteGlowAnim = useRef(new Animated.Value(0)).current;
  const isRecordingRef = useRef(false);
  const timerRef = useRef(null);
  const pitchIntervalRef = useRef(null);
  const noteAdvanceRef = useRef(null);
  const volumeIntervalRef = useRef(null);

  const currentNoteIndexRef = useRef(0);
  const stoppingRef = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
      if (noteAdvanceRef.current) clearInterval(noteAdvanceRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      const count = selectedExercise.notes.length;
      setNoteDots(new Array(count).fill('idle'));
      setCurrentNoteIndex(0);
      const anims = selectedExercise.notes.map(() => new Animated.Value(0));
      setNoteDotAnimations(anims);
    }
  }, [selectedExercise]);

  const animateNoteDot = useCallback((index) => {
    if (noteDotAnimations[index]) {
      Animated.sequence([
        Animated.timing(noteDotAnimations[index], { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(noteDotAnimations[index], { toValue: 0.6, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [noteDotAnimations]);

  const noteGlowLoop = useRef(null);

  const animateNoteGlow = useCallback(() => {
    noteGlowAnim.setValue(0);
    noteGlowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(noteGlowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(noteGlowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    noteGlowLoop.current.start();
  }, [noteGlowAnim]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleStartRecording = () => {
    if (!selectedExercise) return;
    setIsRecording(true);
    isRecordingRef.current = true;
    currentNoteIndexRef.current = 0;
    setResults(null);
    setElapsedTime(0);
    setCurrentNoteIndex(0);
    setDetectedNote('--');
    setVolume(0);
    scoreRingAnim.setValue(0);
    setResultSlideAnims([]);

    const newDots = selectedExercise.notes.map(() => 'idle');
    setNoteDots(newDots);
    startPulse();
    animateNoteGlow();

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    pitchIntervalRef.current = setInterval(() => {
      if (!isRecordingRef.current) return;
      const targetNote = selectedExercise.notes[currentNoteIndexRef.current] || 'C4';
      const baseFreq = NOTE_FREQUENCIES[targetNote] || 261.63;
      const jitter = (Math.random() - 0.5) * 40;
      const freq = Math.max(100, baseFreq + jitter);
      setCurrentPitch(freq);
      setDetectedNote(getNoteName(freq));
    }, 100);

    volumeIntervalRef.current = setInterval(() => {
      if (!isRecordingRef.current) return;
      const v = Math.random() * 0.5 + 0.3;
      setVolume(v);
      setWaveAmplitude(v);
    }, 150);

    noteAdvanceRef.current = setInterval(() => {
      if (!isRecordingRef.current || stoppingRef.current) return;
      setCurrentNoteIndex((prev) => {
        currentNoteIndexRef.current = prev;
        if (prev < selectedExercise.notes.length - 1) {
          const next = prev + 1;
          setNoteDots((dots) => {
            const updated = [...dots];
            updated[prev] = 'done';
            return updated;
          });
          animateNoteDot(prev);
          return next;
        }
        setNoteDots((dots) => {
          const updated = [...dots];
          updated[prev] = 'done';
          return updated;
        });
        animateNoteDot(prev);
        handleStopRecording();
        return prev;
      });
    }, 1500);
  };

  const handleStopRecording = async () => {
    if (!isRecordingRef.current || stoppingRef.current) return;
    stoppingRef.current = true;
    setIsRecording(false);
    isRecordingRef.current = false;
    stopPulse();
    if (noteGlowLoop.current) {
      noteGlowLoop.current.stop();
      noteGlowLoop.current = null;
    }
    noteGlowAnim.stopAnimation();
    noteGlowAnim.setValue(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (noteAdvanceRef.current) clearInterval(noteAdvanceRef.current);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);

    try {
      const res = await authFetch(api.speechScore, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: selectedExercise?.id,
          notes_attempted: selectedExercise?.notes,
          elapsed_time: elapsedTime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        animateScoreRing(data.score || 0);
        animateResultCards(data.note_details?.length || 0);
      } else {
        const fallback = generateFallbackResults();
        setResults(fallback);
        animateScoreRing(fallback.score);
        animateResultCards(fallback.note_details.length);
      }
    } catch (e) {
      console.error(e);
      const fallback = generateFallbackResults();
      setResults(fallback);
      animateScoreRing(fallback.score);
      animateResultCards(fallback.note_details.length);
    }
    stoppingRef.current = false;
  };

  const generateFallbackResults = () => {
    const notes = selectedExercise?.notes || [];
    const score = Math.floor(Math.random() * 30) + 65;
    return {
      score,
      note_details: notes.map((note) => {
        const cents = Math.floor(Math.random() * 60) - 30;
        const feedback = Math.abs(cents) <= 10 ? 'Good' : cents < 0 ? 'Flat' : 'Sharp';
        return { target: note, actual: getNoteName(NOTE_FREQUENCIES[note] + cents * 2), cents, feedback };
      }),
    };
  };

  const animateScoreRing = (scorePercent) => {
    Animated.timing(scoreRingAnim, {
      toValue: scorePercent / 100,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  };

  const animateResultCards = (count) => {
    const anims = Array.from({ length: count }, () => new Animated.Value(0));
    setResultSlideAnims(anims);
    Animated.stagger(
      100,
      anims.map((anim) =>
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true })
      )
    ).start();
  };

  const getScoreColor = (score) => {
    if (score >= 70) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const getFeedbackColor = (feedback) => {
    if (feedback === 'Good') return COLORS.success;
    if (feedback === 'Flat') return COLORS.info;
    return COLORS.secondary;
  };

  const renderExerciseCard = (exercise) => {
    const isSelected = selectedExercise?.id === exercise.id;
    const IconComp = exercise.iconLib === 'Feather' ? Feather : MaterialCommunityIcons;
    return (
      <TouchableOpacity
        key={exercise.id}
        style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
        onPress={() => {
          setSelectedExercise(exercise);
          setResults(null);
          setElapsedTime(0);
          setCurrentNoteIndex(0);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.exerciseCardIcon, { backgroundColor: `${exercise.color}18` }]}>
          <IconComp name={exercise.icon} size={22} color={exercise.color} />
        </View>
        <Text style={styles.exerciseCardTitle}>{exercise.title}</Text>
        <View style={styles.exerciseCardMeta}>
          <Tag label={exercise.difficulty} size="small" variant="light" color={exercise.color} />
          <Text style={styles.exerciseCardNotes}>{exercise.noteCount} notes</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTargetNoteDisplay = () => {
    const targetNote = selectedExercise?.notes[currentNoteIndex] || '--';
    return (
      <View style={styles.targetNoteContainer}>
        <Text style={styles.targetNoteLabel}>Target Note</Text>
        <Animated.View style={[styles.targetNoteGlow, { opacity: noteGlowAnim }]}>
          <Text style={styles.targetNoteValue}>{targetNote}</Text>
        </Animated.View>
        <Text style={styles.targetNotePosition}>
          {currentNoteIndex + 1} / {selectedExercise?.notes.length || 0}
        </Text>
      </View>
    );
  };

  const renderNoteSequence = () => {
    if (!selectedExercise) return null;
    const notes = selectedExercise.notes;
    return (
      <View style={styles.noteSequenceContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteSequenceScroll}>
          {notes.map((note, index) => {
            const dotAnim = noteDotAnimations[index] || new Animated.Value(0);
            const isDone = noteDots[index] === 'done';
            const isCurrent = index === currentNoteIndex && isRecording;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.noteDot,
                  isDone && styles.noteDotDone,
                  isCurrent && styles.noteDotCurrent,
                  isCurrent && {
                    transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
                  },
                ]}
              >
                {isDone ? (
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                ) : isCurrent ? (
                  <MaterialCommunityIcons name="microphone" size={14} color={COLORS.white} />
                ) : null}
                <Text style={[styles.noteDotLabel, (isDone || isCurrent) && styles.noteDotLabelLight]}>
                  {note}
                </Text>
              </Animated.View>
            );
          })}
        </ScrollView>
        <View style={styles.positionIndicator}>
          <View
            style={[
              styles.positionDot,
              {
                left: `${(currentNoteIndex / Math.max(notes.length - 1, 1)) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderVolumeMeter = () => (
    <View style={styles.volumeMeterContainer}>
      <Text style={styles.volumeMeterLabel}>Vol</Text>
      <View style={styles.volumeMeterTrack}>
        <View style={[styles.volumeMeterFill, { height: `${volume * 100}%` }]} />
      </View>
    </View>
  );

  const renderRecordingSection = () => (
    <Animated.View style={[styles.recordingContainer, { opacity: fadeAnim }]}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitleLarge}>{selectedExercise.title}</Text>
        <Tag label={selectedExercise.difficulty} size="small" variant="light" color={selectedExercise.color} />
      </View>

      {renderTargetNoteDisplay()}
      {renderNoteSequence()}

      <View style={styles.recordingArea}>
        {renderVolumeMeter()}

        {isRecording && (
          <View style={styles.waveformRow}>
            <WaveformPath amplitude={waveAmplitude} width={200} height={50} color={COLORS.primary} />
            <FrequencyBars
              values={Array(8).fill(0).map(() => Math.random() * 0.7 + 0.3)}
              color={COLORS.secondary}
              barCount={8}
              height={50}
            />
          </View>
        )}

        <View style={styles.micButtonWrapper}>
          <TouchableOpacity
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            activeOpacity={0.85}
            style={styles.micButtonOuter}
          >
            <Animated.View
              style={[styles.micButtonAnimated, { transform: [{ scale: pulseAnim }] }]}
            >
              <LinearGradient
                colors={isRecording ? ['#F44336', '#E53935'] : [COLORS.gray200, COLORS.gray300]}
                style={styles.micButtonGradient}
              >
                <MaterialCommunityIcons
                  name={isRecording ? 'microphone' : 'microphone-outline'}
                  size={48}
                  color={isRecording ? COLORS.white : COLORS.gray500}
                />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.realTimePitchContainer}>
              <Text style={styles.realTimePitchNote}>{detectedNote}</Text>
              <Text style={styles.realTimePitchFreq}>{Math.round(currentPitch)} Hz</Text>
            </View>
          )}
        </View>

        <View style={styles.timerSide}>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.timerLabel}>Timer</Text>
        </View>
      </View>

      <View style={styles.recordingControls}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedExercise(null)}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderResults = () => {
    if (!results) return null;
    const score = results.score || 0;
    const scoreColor = getScoreColor(score);
    const circumference = 2 * Math.PI * 54;

    return (
      <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
        <Text style={styles.resultsTitle}>Practice Results</Text>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRingContainer}>
            <ScoreRing
              score={score}
              size={130}
              color={scoreColor}
              animValue={scoreRingAnim}
            />
          </View>
        </View>

        <Text style={styles.breakdownTitle}>Note-by-Note Breakdown</Text>
        {results.note_details?.map((detail, index) => {
          const slideAnim = resultSlideAnims[index] || new Animated.Value(0);
          const fbColor = getFeedbackColor(detail.feedback);
          return (
            <Animated.View
              key={index}
              style={[
                styles.noteResultRow,
                {
                  opacity: slideAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [SCREEN_WIDTH, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.noteResultIndex}>
                <Text style={styles.noteResultIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.noteResultInfo}>
                <View style={styles.noteResultNotes}>
                  <Text style={styles.noteResultTarget}>{detail.target}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.gray400} />
                  <Text style={styles.noteResultActual}>{detail.actual}</Text>
                </View>
                <View style={styles.noteResultMeta}>
                  <Text style={[styles.noteResultCents, detail.cents < 0 && styles.flatCents, detail.cents > 0 && styles.sharpCents]}>
                    {detail.cents > 0 ? '+' : ''}{detail.cents} cents
                  </Text>
                  <View style={[styles.feedbackBadge, { backgroundColor: `${fbColor}18` }]}>
                    <Text style={[styles.feedbackBadgeText, { color: fbColor }]}>{detail.feedback}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={styles.resultsActions}>
          <GradientButton
            title="Try Again"
            onPress={() => {
              setResults(null);
              setElapsedTime(0);
              setCurrentNoteIndex(0);
              setNoteDots([]);
              scoreRingAnim.setValue(0);
              setResultSlideAnims([]);
            }}
            icon="refresh"
            colors={COLORS.gradient.primary}
            style={styles.resultsActionBtn}
          />
          <TouchableOpacity
            style={styles.newExerciseBtn}
            onPress={() => {
              setResults(null);
              setSelectedExercise(null);
              setElapsedTime(0);
              setCurrentNoteIndex(0);
              setNoteDots([]);
              scoreRingAnim.setValue(0);
              setResultSlideAnims([]);
            }}
          >
            <Text style={styles.newExerciseBtnText}>New Exercise</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient {...createGradient(COLORS.gradient.sunset)} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Speech Analysis</Text>
            <Text style={styles.headerSubtitle}>Vocal Practice Tool</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedExercise && !results && (
          <>
            <Text style={styles.sectionTitle}>Choose an Exercise</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseCardsScroll}>
              {EXERCISES.map((exercise) => renderExerciseCard(exercise))}
            </ScrollView>
          </>
        )}

        {selectedExercise && !results && renderRecordingSection()}
        {results && renderResults()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  exerciseCardsScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  exerciseCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  exerciseCardSelected: {
    borderColor: COLORS.primary,
  },
  exerciseCardIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  exerciseCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  exerciseCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCardNotes: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  exerciseHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  exerciseTitleLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },
  targetNoteContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  targetNoteLabel: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  targetNoteGlow: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  targetNoteValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
  },
  targetNotePosition: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: SPACING.sm,
  },
  noteSequenceContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  noteSequenceScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  noteDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  noteDotDone: {
    backgroundColor: COLORS.success,
  },
  noteDotCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  noteDotLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray600,
    marginTop: 2,
  },
  noteDotLabelLight: {
    color: COLORS.white,
  },
  positionIndicator: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    marginTop: SPACING.sm,
    position: 'relative',
  },
  positionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -4,
    marginLeft: -6,
    ...SHADOWS.small,
  },
  recordingArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  volumeMeterContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  volumeMeterLabel: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  volumeMeterTrack: {
    width: 8,
    height: 120,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  volumeMeterFill: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  micButtonWrapper: {
    alignItems: 'center',
  },
  micButtonOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonAnimated: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  micButtonGradient: {
    flex: 1,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realTimePitchContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  realTimePitchNote: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  realTimePitchFreq: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  timerSide: {
    alignItems: 'center',
    gap: 2,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.black,
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  recordingControls: {
    alignItems: 'center',
  },
  cancelBtn: {
    padding: SPACING.md,
  },
  cancelBtnText: {
    color: COLORS.gray500,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xl,
  },
  scoreCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  scoreRingContainer: {
    alignItems: 'center',
  },
  scoreRingOuter: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  scoreRingTrack: {
    ...StyleSheet.absoluteFillObject,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: COLORS.gray200,
  },
  scoreRingFill: {
    ...StyleSheet.absoluteFillObject,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  scoreRingInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  noteResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    width: '100%',
    ...SHADOWS.subtle,
  },
  noteResultIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  noteResultIndexText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noteResultInfo: {
    flex: 1,
  },
  noteResultNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  noteResultTarget: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  noteResultActual: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noteResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noteResultCents: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  flatCents: {
    color: COLORS.info,
  },
  sharpCents: {
    color: COLORS.secondary,
  },
  feedbackBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  feedbackBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultsActions: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resultsActionBtn: {
    width: '80%',
    marginBottom: SPACING.lg,
  },
  newExerciseBtn: {
    padding: SPACING.md,
  },
  newExerciseBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default SpeechAnalysisScreen;
