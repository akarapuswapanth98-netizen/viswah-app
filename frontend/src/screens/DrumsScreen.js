import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { Tag } from '../components/UIComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD_SIZE = Math.min((SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 3 - SPACING.sm, 130);

const DRUMS = [
  { id: 'tom', name: 'Tom', icon: 'drum', gradient: ['#FF9800', '#F57C00'], freq: 120, type: 'sine', decay: 0.25 },
  { id: 'cymbal', name: 'Cymbal', icon: 'cymbal', gradient: ['#9C27B0', '#7B1FA2'], freq: 1200, type: 'sawtooth', decay: 0.5 },
  { id: 'clap', name: 'Clap', icon: 'hand', gradient: ['#E91E63', '#AD1457'], freq: 400, type: 'triangle', decay: 0.15 },
  { id: 'kick', name: 'Kick', icon: 'drum', gradient: ['#E91E63', '#C2185B'], freq: 60, type: 'sine', decay: 0.3 },
  { id: 'snare', name: 'Snare', icon: 'drum', gradient: ['#2196F3', '#1565C0'], freq: 200, type: 'triangle', decay: 0.2 },
  { id: 'hihat', name: 'Hi-Hat', icon: 'cymbal', gradient: ['#4CAF50', '#2E7D32'], freq: 800, type: 'square', decay: 0.08 },
];

const BEAT_PATTERNS = [
  {
    name: 'Basic Rock',
    pattern: ['kick', null, 'snare', null, 'kick', null, 'snare', null, 'hihat', null, 'hihat', null, 'hihat', null, 'hihat', null],
  },
  {
    name: 'Four on Floor',
    pattern: ['kick', null, 'kick', null, 'kick', null, 'kick', null, 'snare', null, 'snare', null, 'snare', null, 'snare', null],
  },
  {
    name: 'Syncopated',
    pattern: ['kick', null, null, 'hihat', 'snare', null, 'hihat', null, 'kick', null, 'hihat', null, 'snare', 'hihat', null, null],
  },
];

const DrumsScreen = ({ navigation }) => {
  const [activeDrum, setActiveDrum] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBeats, setRecordedBeats] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [flashPad, setFlashPad] = useState(null);

  const audioContext = useRef(null);
  const padAnimations = useRef({});
  const flashAnimations = useRef({});
  const recordingStart = useRef(0);
  const playbackTimeout = useRef(null);
  const patternInterval = useRef(null);
  const recordPulse = useRef(new Animated.Value(1)).current;
  const sequencerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
      if (patternInterval.current) clearInterval(patternInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulse.setValue(1);
    }
  }, [isRecording]);

  const getAudioContext = () => {
    if (!audioContext.current) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioContext.current = new AudioContextClass();
        }
      }
    }
    return audioContext.current;
  };

  const playDrum = useCallback((drum) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (drum.id === 'snare') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(drum.freq, now);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + drum.decay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + drum.decay);

        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.2);
      } else if (drum.id === 'hihat') {
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + drum.decay);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + drum.decay);
      } else if (drum.id === 'cymbal') {
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + drum.decay);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + drum.decay + 0.1);
      } else if (drum.id === 'clap') {
        for (let r = 0; r < 3; r++) {
          const offset = r * 0.01;
          const bufferSize = ctx.sampleRate * 0.05;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.7, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + drum.decay);
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = drum.freq;
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start(now + offset);
          noise.stop(now + offset + drum.decay + 0.05);
        }
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = drum.id === 'kick' ? 'sine' : drum.type;
        if (drum.id === 'kick') {
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(drum.freq, now + 0.07);
        } else {
          osc.frequency.setValueAtTime(drum.freq, now);
        }
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + drum.decay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + drum.decay + 0.05);
      }

      setActiveDrum(drum.id);
      setFlashPad(drum.id);

      if (!padAnimations.current[drum.id]) {
        padAnimations.current[drum.id] = new Animated.Value(1);
      }
      if (!flashAnimations.current[drum.id]) {
        flashAnimations.current[drum.id] = new Animated.Value(0);
      }

      Animated.sequence([
        Animated.timing(padAnimations.current[drum.id], {
          toValue: 0.88,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.spring(padAnimations.current[drum.id], {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(flashAnimations.current[drum.id], {
          toValue: 0.5,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnimations.current[drum.id], {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (isRecording) {
        const timestamp = Date.now() - recordingStart.current;
        setRecordedBeats((prev) => [...prev, { drum: drum.id, time: timestamp }]);
      }

      setTimeout(() => {
        setActiveDrum(null);
        setFlashPad(null);
      }, 150);
    } catch (e) {
      console.error('Error playing drum:', e);
    }
  }, [isRecording]);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedBeats([]);
      recordingStart.current = Date.now();
      setIsRecording(true);
    }
  };

  const handlePlayback = () => {
    if (recordedBeats.length === 0) return;
    setIsPlaying(true);
    let index = 0;

    const playNext = () => {
      if (index >= recordedBeats.length) {
        setIsPlaying(false);
        return;
      }
      const beat = recordedBeats[index];
      const drum = DRUMS.find((d) => d.id === beat.drum);
      if (drum) playDrum(drum);
      index++;
      const delay = index < recordedBeats.length ? recordedBeats[index].time - beat.time : 200;
      playbackTimeout.current = setTimeout(playNext, Math.max(delay, 50));
    };

    playNext();
  };

  const handleClear = () => {
    setRecordedBeats([]);
    if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    setIsPlaying(false);
    setCurrentStep(-1);
    setSelectedPattern(null);
    if (patternInterval.current) {
      clearInterval(patternInterval.current);
      patternInterval.current = null;
    }
  };

  const handlePatternPlay = (pattern) => {
    if (patternInterval.current) {
      clearInterval(patternInterval.current);
      patternInterval.current = null;
      setCurrentStep(-1);
      setSelectedPattern(null);
      return;
    }

    setSelectedPattern(pattern.name);
    let step = 0;
    const stepDuration = 60000 / bpm / 2;

    patternInterval.current = setInterval(() => {
      const drumId = pattern.pattern[step % pattern.pattern.length];
      if (drumId) {
        const drum = DRUMS.find((d) => d.id === drumId);
        if (drum) playDrum(drum);
      }
      setCurrentStep(step % pattern.pattern.length);

      sequencerAnim.setValue(0);
      Animated.timing(sequencerAnim, {
        toValue: 1,
        duration: stepDuration * 0.9,
        useNativeDriver: false,
      }).start();

      step++;
    }, stepDuration);
  };

  const renderDrumPad = (drum, index) => {
    const scale = padAnimations.current[drum.id] || new Animated.Value(1);
    const flash = flashAnimations.current[drum.id] || new Animated.Value(0);
    const isActive = activeDrum === drum.id;

    return (
      <TouchableOpacity
        key={drum.id}
        onPressIn={() => playDrum(drum)}
        activeOpacity={1}
        style={styles.padWrapper}
      >
        <Animated.View
          style={[
            styles.pad,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <LinearGradient
            {...createGradient(drum.gradient)}
            style={styles.padGradient}
          >
            <Animated.View style={[styles.padFlash, { opacity: flash }]} />
            <View style={styles.padIconContainer}>
              <MaterialCommunityIcons
                name={drum.icon}
                size={40}
                color="rgba(255,255,255,0.95)"
              />
            </View>
            <View style={styles.padLabelContainer}>
              <Animated.Text style={styles.padLabel}>{drum.name}</Animated.Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderSequencerDot = (step, drumId, isLast) => {
    const isActive = currentStep === step;
    return (
      <View key={step} style={styles.sequencerDotContainer}>
        <View
          style={[
            styles.sequencerDot,
            isActive && styles.sequencerDotActive,
            isActive && { backgroundColor: DRUMS.find((d) => d.id === drumId)?.gradient[0] || COLORS.primary },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        {...createGradient(['#1A1A2E', '#2D2D44'])}
        style={styles.background}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Animated.Text style={styles.headerTitle}>Virtual Drums</Animated.Text>
          </View>
          <View style={styles.bpmContainer}>
            <Animated.Text style={styles.bpmValue}>{bpm}</Animated.Text>
            <Animated.Text style={styles.bpmLabel}>BPM</Animated.Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.padGrid}>
            <View style={styles.padRow}>
              {DRUMS.slice(0, 3).map((drum, i) => renderDrumPad(drum, i))}
            </View>
            <View style={styles.padRow}>
              {DRUMS.slice(3, 6).map((drum, i) => renderDrumPad(drum, i + 3))}
            </View>
          </View>

          <View style={styles.controlsBar}>
            <TouchableOpacity
              style={[styles.controlButton, isRecording && styles.controlButtonRecording]}
              onPress={handleRecord}
            >
              {isRecording ? (
                <Animated.View style={{ transform: [{ scale: recordPulse }] }}>
                  <MaterialCommunityIcons name="record" size={20} color="#FF1744" />
                </Animated.View>
              ) : (
                <MaterialCommunityIcons name="record" size={20} color="#FF1744" />
              )}
              <Animated.Text style={[styles.controlLabel, isRecording && styles.controlLabelActive]}>
                {isRecording ? 'Stop' : 'Record'}
              </Animated.Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, recordedBeats.length === 0 && styles.controlButtonDisabled]}
              onPress={isPlaying ? handleClear : handlePlayback}
              disabled={recordedBeats.length === 0 && !isPlaying}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'stop' : 'play'}
                size={20}
                color={recordedBeats.length === 0 ? COLORS.gray500 : COLORS.white}
              />
              <Animated.Text
                style={[
                  styles.controlLabel,
                  recordedBeats.length === 0 && styles.controlLabelDisabled,
                ]}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </Animated.Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleClear}>
              <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6E40" />
              <Animated.Text style={styles.controlLabel}>Clear</Animated.Text>
            </TouchableOpacity>

            {recordedBeats.length > 0 && (
              <Tag label={`${recordedBeats.length} beats`} size="small" />
            )}
          </View>

          <View style={styles.sequencerCard}>
            <Animated.Text style={styles.sequencerTitle}>16-Step Sequencer</Animated.Text>
            <View style={styles.sequencerRow}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={styles.sequencerDotOuter}>
                  <View
                    style={[
                      styles.sequencerDot,
                      currentStep === i && styles.sequencerDotActive,
                    ]}
                  />
                </View>
              ))}
            </View>
            {selectedPattern && (
              <Animated.Text style={styles.patternIndicator}>
                {selectedPattern} - Step {(currentStep % 16) + 1}
              </Animated.Text>
            )}
          </View>

          <View style={styles.patternCard}>
            <Animated.Text style={styles.patternTitle}>Beat Patterns</Animated.Text>
            <View style={styles.patternList}>
              {BEAT_PATTERNS.map((pattern, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.patternItem,
                    selectedPattern === pattern.name && styles.patternItemActive,
                  ]}
                  onPress={() => handlePatternPlay(pattern)}
                >
                  <MaterialCommunityIcons
                    name={selectedPattern === pattern.name ? 'stop-circle' : 'play-circle'}
                    size={28}
                    color={selectedPattern === pattern.name ? '#FF1744' : COLORS.white}
                  />
                  <View style={styles.patternInfo}>
                    <Animated.Text style={styles.patternName}>{pattern.name}</Animated.Text>
                    <View style={styles.patternDots}>
                      {pattern.pattern.map((step, i) => (
                        <View
                          key={i}
                          style={[
                            styles.patternDot,
                            step && styles.patternDotActive,
                            currentStep === i && selectedPattern === pattern.name && styles.patternDotCurrent,
                            step && { backgroundColor: DRUMS.find((d) => d.id === step)?.gradient[0] || COLORS.primary },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  bpmContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  bpmValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  bpmLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
  },
  padGrid: {
    marginBottom: SPACING.lg,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  padWrapper: {
    width: PAD_SIZE,
    height: PAD_SIZE,
  },
  pad: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  padGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  padFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  padIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  padLabelContainer: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  padLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 64,
  },
  controlButtonRecording: {
    backgroundColor: 'rgba(255,23,68,0.15)',
    borderWidth: 1,
    borderColor: '#FF1744',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 2,
  },
  controlLabelActive: {
    color: '#FF1744',
  },
  controlLabelDisabled: {
    color: COLORS.gray500,
  },
  sequencerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sequencerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  sequencerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sequencerDotOuter: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequencerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sequencerDotActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  patternIndicator: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  patternList: {
    gap: SPACING.sm,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  patternItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  patternInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  patternName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  patternDots: {
    flexDirection: 'row',
    gap: 3,
  },
  patternDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  patternDotActive: {
    opacity: 0.8,
  },
  patternDotCurrent: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});

export default DrumsScreen;
