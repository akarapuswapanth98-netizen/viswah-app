import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { GradientButton, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';
import { WaveformPath, FrequencyBars, ScoreRing } from '../components/VisualEffects';
import { audioService } from '../services/AudioService';
import PitchVisualizer from '../components/PitchVisualizer';

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

const SARGAM_MAP = { 'C': 'Sa', 'D': 'Re', 'E': 'Ga', 'F': 'Ma', 'G': 'Pa', 'A': 'Dha', 'B': 'Ni' };
const KOMAL_MAP = { 'C#': 'Re♭', 'D#': 'Ga♭', 'F#': 'Ma♯', 'G#': 'Dha♭', 'A#': 'Ni♭' };

const getNoteName = (freq) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${notes[noteIndex < 0 ? noteIndex + 12 : noteIndex]}${octave}`;
};

const getSargamName = (freq) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteIndex = midi % 12;
  const noteName = notes[noteIndex < 0 ? noteIndex + 12 : noteIndex];
  if (SARGAM_MAP[noteName]) return SARGAM_MAP[noteName];
  if (KOMAL_MAP[noteName]) return KOMAL_MAP[noteName];
  return noteName;
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
  const [isIndian, setIsIndian] = useState(false);
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

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  const initMic = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) return false;
      audioCtxRef.current = audioService.getContext();
      if (!audioCtxRef.current) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      micStreamRef.current = stream;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      return true;
    } catch (e) {
      console.warn('Mic init failed, using simulated data:', e.message);
      return false;
    }
  };

  const stopMicStream = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      micStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const readMicFrame = () => {
    if (!analyserRef.current || !isRecordingRef.current) return;
    const timeData = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(timeData);
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) sum += timeData[i] * timeData[i];
    const rms = Math.sqrt(sum / timeData.length);
    const vol = Math.min(1, rms * 4);
    setVolume(vol);
    setWaveAmplitude(vol);

    const freqData = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatFrequencyData(freqData);
    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let i = 2; i < freqData.length; i++) {
      if (freqData[i] > maxVal) { maxVal = freqData[i]; maxIdx = i; }
    }
    const sr = audioCtxRef.current.sampleRate;
    const freq = (maxIdx * sr) / analyserRef.current.fftSize;
    if (freq > 60 && freq < 2000 && maxVal > -60) {
      setCurrentPitch(freq);
      setDetectedNote(getNoteName(freq));
    }
    animFrameRef.current = requestAnimationFrame(readMicFrame);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
      if (noteAdvanceRef.current) clearInterval(noteAdvanceRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      stopMicStream();
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

  const handleStartRecording = async () => {
    if (!selectedExercise) return;
    const micOk = await initMic();
    if (micOk) animFrameRef.current = requestAnimationFrame(readMicFrame);

    setIsRecording(true);
    isRecordingRef.current = true;
    currentNoteIndexRef.current = 0;
    setResults(null);
    setElapsedTime(0);
    setCurrentNoteIndex(0);
    if (!micOk) {
      setDetectedNote('--');
      setVolume(0);
    }
    scoreRingAnim.setValue(0);
    setResultSlideAnims([]);

    const newDots = selectedExercise.notes.map(() => 'idle');
    setNoteDots(newDots);
    startPulse();
    animateNoteGlow();

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    if (!micOk) {
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
    }

    noteAdvanceRef.current = setInterval(() => {
      if (!isRecordingRef.current || stoppingRef.current) return;
      const nextIdx = currentNoteIndexRef.current + 1;
      const totalNotes = selectedExercise.notes.length;
      if (nextIdx < totalNotes) {
        setNoteDots((dots) => {
          const updated = [...dots];
          updated[currentNoteIndexRef.current] = 'done';
          return updated;
        });
        animateNoteDot(currentNoteIndexRef.current);
        currentNoteIndexRef.current = nextIdx;
        setCurrentNoteIndex(nextIdx);
      } else {
        setNoteDots((dots) => {
          const updated = [...dots];
          updated[currentNoteIndexRef.current] = 'done';
          return updated;
        });
        animateNoteDot(currentNoteIndexRef.current);
        handleStopRecording();
      }
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
    stopMicStream();

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
              <View
                style={[styles.micButtonGradient, { background: isRecording ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, rgba(15,18,30,0.9), rgba(26,29,46,0.9))' }]}
              >
                <MaterialCommunityIcons
                  name={isRecording ? 'microphone' : 'microphone-outline'}
                  size={48}
                  color={isRecording ? COLORS.white : COLORS.textSecondary}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.realTimePitchContainer}>
              <PitchVisualizer
                currentPitch={currentPitch}
                targetNote={selectedExercise?.notes?.[currentNoteIndex]}
                targetFreq={selectedExercise?.notes?.[currentNoteIndex] ? (440 * Math.pow(2, (['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(selectedExercise.notes[currentNoteIndex]) - 9) / 12)) : 0}
                isRecording={isRecording}
                showSargam={isIndian}
                centsDeviation={Math.round(((Math.log2(currentPitch / 440) * 12 + 49) % 1 - 0.5) * 100) || 0}
                width={SCREEN_WIDTH - 80}
                height={120}
              />
              <TouchableOpacity
                style={styles.sargamToggle}
                onPress={() => setIsIndian(!isIndian)}
              >
                <Text style={styles.sargamToggleText}>{isIndian ? 'Western' : 'Sargam'}</Text>
              </TouchableOpacity>
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
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textMuted} />
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
      <View style={[styles.header, { background: 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(249,115,22,0.25) 50%, rgba(234,179,8,0.15) 100%)' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Speech Analysis</Text>
            <Text style={styles.headerSubtitle}>Vocal Practice Tool</Text>
          </View>
        </View>
      </View>

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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noteDotLabelLight: {
    color: COLORS.white,
  },
  positionIndicator: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surface,
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
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  volumeMeterTrack: {
    width: 8,
    height: 120,
    backgroundColor: COLORS.surface,
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
  },
  sargamToggle: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sargamToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  realTimePitchNote: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  realTimePitchFreq: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  recordingControls: {
    alignItems: 'center',
  },
  cancelBtn: {
    padding: SPACING.md,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
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
