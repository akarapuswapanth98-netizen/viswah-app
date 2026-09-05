import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { Tag } from '../components/UIComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NOTE_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC107', '#4ECDC4', '#6C63FF',
  '#9C27B0', '#E91E63', '#FF5722', '#00BCD4', '#8BC34A',
];

const NOTE_FREQUENCIES = {
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13,
  E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.00,
  'G#4': 415.30, A4: 440.00, 'A#4': 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25,
  E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99,
  'G#5': 830.61, A5: 880.00, 'A#5': 932.33, B5: 987.77,
};

const ALL_NOTES = [
  { note: 'C4', isBlack: false },
  { note: 'C#4', isBlack: true },
  { note: 'D4', isBlack: false },
  { note: 'D#4', isBlack: true },
  { note: 'E4', isBlack: false },
  { note: 'F4', isBlack: false },
  { note: 'F#4', isBlack: true },
  { note: 'G4', isBlack: false },
  { note: 'G#4', isBlack: true },
  { note: 'A4', isBlack: false },
  { note: 'A#4', isBlack: true },
  { note: 'B4', isBlack: false },
  { note: 'C5', isBlack: false },
  { note: 'C#5', isBlack: true },
  { note: 'D5', isBlack: false },
  { note: 'D#5', isBlack: true },
  { note: 'E5', isBlack: false },
  { note: 'F5', isBlack: false },
  { note: 'F#5', isBlack: true },
  { note: 'G5', isBlack: false },
  { note: 'G#5', isBlack: true },
  { note: 'A5', isBlack: false },
  { note: 'A#5', isBlack: true },
  { note: 'B5', isBlack: false },
  { note: 'C6', isBlack: false },
  { note: 'C#6', isBlack: true },
  { note: 'D6', isBlack: false },
  { note: 'D#6', isBlack: true },
  { note: 'E6', isBlack: false },
  { note: 'F6', isBlack: false },
  { note: 'F#6', isBlack: true },
  { note: 'G6', isBlack: false },
  { note: 'G#6', isBlack: true },
  { note: 'A6', isBlack: false },
  { note: 'A#6', isBlack: true },
  { note: 'B6', isBlack: false },
];

const WHITE_KEY_WIDTH = 40;
const BLACK_KEY_WIDTH = 24;
const KEY_HEIGHT = 200;
const BLACK_KEY_HEIGHT = 130;

const PianoScreen = ({ navigation }) => {
  const [activeNote, setActiveNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentOctave, setCurrentOctave] = useState(4);
  const [pressedKeys, setPressedKeys] = useState({});

  const audioContext = useRef(null);
  const activeOscillators = useRef({});
  const activeGains = useRef({});
  const recordingStart = useRef(0);
  const playbackTimeout = useRef(null);
  const pressAnimations = useRef({});
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;
  const timelineScroll = useRef(null);

  useEffect(() => {
    return () => {
      Object.values(activeOscillators.current).forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingPulse.setValue(1);
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

  const playNote = useCallback((noteName) => {
    const freq = NOTE_FREQUENCIES[noteName];
    if (!freq) return;

    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);

      activeOscillators.current[noteName] = osc;
      activeGains.current[noteName] = gainNode;

      setActiveNote(noteName);

      Animated.sequence([
        Animated.timing(volumeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(volumeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      setPressedKeys(prev => ({ ...prev, [noteName]: true }));

      if (!pressAnimations.current[noteName]) {
        pressAnimations.current[noteName] = new Animated.Value(1);
      }
      Animated.sequence([
        Animated.timing(pressAnimations.current[noteName], {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(pressAnimations.current[noteName], {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      if (isRecording) {
        const timestamp = Date.now() - recordingStart.current;
        setRecordedNotes(prev => [
          ...prev,
          { note: noteName, freq, time: timestamp, duration: 300 },
        ]);
      }

      setTimeout(() => {
        setActiveNote(null);
        setPressedKeys(prev => ({ ...prev, [noteName]: false }));
      }, 300);
    } catch (e) {
      console.error('Error playing note:', e);
    }
  }, [isRecording]);

  const stopNote = useCallback((noteName) => {
    if (activeGains.current[noteName]) {
      try {
        const ctx = getAudioContext();
        activeGains.current[noteName].gain.cancelScheduledValues(ctx.currentTime);
        activeGains.current[noteName].gain.setValueAtTime(
          activeGains.current[noteName].gain.value,
          ctx.currentTime
        );
        activeGains.current[noteName].gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.1
        );
      } catch (e) {}
    }
    setPressedKeys(prev => ({ ...prev, [noteName]: false }));
  }, []);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      recordingStart.current = Date.now();
      setIsRecording(true);
    }
  };

  const handleStop = () => {
    if (isRecording) setIsRecording(false);
    if (isPlaying) {
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
      setIsPlaying(false);
    }
  };

  const handlePlayback = () => {
    if (recordedNotes.length === 0) return;

    setIsPlaying(true);
    let index = 0;

    const playNext = () => {
      if (index >= recordedNotes.length) {
        setIsPlaying(false);
        return;
      }

      const noteData = recordedNotes[index];
      playNote(noteData.note);

      index++;
      const delay =
        index < recordedNotes.length
          ? recordedNotes[index].time - noteData.time
          : 300;

      playbackTimeout.current = setTimeout(playNext, Math.max(delay, 100));
    };

    playNext();
  };

  const handleClear = () => {
    setRecordedNotes([]);
    if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    setIsPlaying(false);
  };

  const adjustOctave = (delta) => {
    setCurrentOctave(prev => Math.max(2, Math.min(6, prev + delta)));
  };

  const renderWhiteKeys = () => {
    const whiteNotes = ALL_NOTES.filter(n => !n.isBlack);
    const totalWidth = whiteNotes.length * WHITE_KEY_WIDTH;

    return (
      <View style={[styles.whiteKeysRow, { width: totalWidth }]}>
        {whiteNotes.map((n, index) => {
          const isActive = activeNote === n.note;
          const anim = pressAnimations.current[n.note] || new Animated.Value(1);

          return (
            <Animated.View
              key={n.note}
              style={[
                styles.whiteKeyOuter,
                { width: WHITE_KEY_WIDTH, transform: [{ scale: anim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.whiteKeyTouchable}
                onPressIn={() => playNote(n.note)}
                onPressOut={() => stopNote(n.note)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isActive ? ['#6C63FF', '#8B85FF'] : ['#FFFFFF', '#F0F0F0']}
                  style={styles.whiteKeyInner}
                >
                  <View
                    style={[
                      styles.whiteKeyNoteLabel,
                      isActive && styles.whiteKeyNoteLabelActive,
                    ]}
                  >
                    <Animated.Text
                      style={[
                        styles.whiteKeyNoteText,
                        isActive && styles.whiteKeyNoteTextActive,
                      ]}
                    >
                      {n.note}
                    </Animated.Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderBlackKeys = () => {
    const blackNotes = ALL_NOTES.filter(n => n.isBlack);
    const whiteNotes = ALL_NOTES.filter(n => !n.isBlack);
    const totalWidth = whiteNotes.length * WHITE_KEY_WIDTH;

    return (
      <View style={[styles.blackKeysOverlay, { width: totalWidth }]}>
        {blackNotes.map((n) => {
          const isActive = activeNote === n.note;
          const anim = pressAnimations.current[n.note] || new Animated.Value(1);

          const noteIndex = ALL_NOTES.findIndex(note => note.note === n.note);
          let whiteIndexBefore = 0;
          for (let i = 0; i < noteIndex; i++) {
            if (!ALL_NOTES[i].isBlack) whiteIndexBefore++;
          }
          const leftPos = whiteIndexBefore * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

          return (
            <Animated.View
              key={n.note}
              style={[
                styles.blackKeyOuter,
                {
                  left: leftPos,
                  width: BLACK_KEY_WIDTH,
                  transform: [{ scale: anim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.blackKeyTouchable}
                onPressIn={() => playNote(n.note)}
                onPressOut={() => stopNote(n.note)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isActive ? ['#6C63FF', '#5A52D5'] : ['#333333', '#111111']}
                  style={styles.blackKeyInner}
                >
                  <View
                    style={[
                      styles.blackKeyNoteLabel,
                      isActive && styles.blackKeyNoteLabelActive,
                    ]}
                  >
                    <Animated.Text
                      style={[
                        styles.blackKeyNoteText,
                        isActive && styles.blackKeyNoteTextActive,
                      ]}
                    >
                      {n.note}
                    </Animated.Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const activeFreq = activeNote ? NOTE_FREQUENCIES[activeNote] : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        {...createGradient(['#1A1A2E', '#2D2D44'])}
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
            <Animated.Text style={styles.headerTitle}>Virtual Piano</Animated.Text>
            <Animated.Text style={styles.headerSubtitle}>
              2 Octaves - C4 to B6
            </Animated.Text>
          </View>
          <Animated.View
            style={[
              styles.recordingDot,
              { opacity: recordingPulse },
            ]}
          >
            {isRecording && <View style={styles.recordingDotInner} />}
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Note Display */}
        <View style={styles.noteDisplay}>
          <Animated.Text style={styles.currentNote}>
            {activeNote || 'Tap a key'}
          </Animated.Text>
          {activeFreq && (
            <Animated.Text style={styles.currentFreq}>
              {activeFreq.toFixed(2)} Hz
            </Animated.Text>
          )}
          <View style={styles.volumeMeter}>
            <Animated.View
              style={[
                styles.volumeMeterFill,
                {
                  width: volumeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Piano Keyboard */}
        <View style={styles.pianoShadow}>
          <View style={styles.pianoContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pianoScrollContent}
            >
              {renderWhiteKeys()}
              {renderBlackKeys()}
            </ScrollView>
          </View>
        </View>

        {/* Controls Bar */}
        <View style={styles.controlsBar}>
          {/* Record Button */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
            ]}
            onPress={handleRecord}
          >
            <View
              style={[
                styles.recordBtnDot,
                isRecording && styles.recordBtnDotActive,
              ]}
            />
            <Animated.Text style={styles.recordBtnText}>
              {isRecording ? 'Recording' : 'Record'}
            </Animated.Text>
          </TouchableOpacity>

          {/* Stop Button */}
          <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={handleStop}>
            <MaterialCommunityIcons name="stop" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* Play Button */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              styles.playBtn,
              (recordedNotes.length === 0 || isPlaying) && styles.playBtnDisabled,
            ]}
            onPress={handlePlayback}
            disabled={recordedNotes.length === 0 || isPlaying}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* Tempo & Octave */}
        <View style={styles.settingsRow}>
          <View style={styles.settingGroup}>
            <Animated.Text style={styles.settingLabel}>Tempo</Animated.Text>
            <Animated.Text style={styles.settingValue}>{tempo} BPM</Animated.Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${((tempo - 60) / 140) * 100}%` }]} />
              <View
                style={[styles.sliderThumb, { left: `${((tempo - 60) / 140) * 100}%` }]}
              />
              <ScrollView
                horizontal
                style={styles.sliderHitArea}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sliderHitContent}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const maxScroll = e.nativeEvent.contentSize.width - e.nativeEvent.layoutMeasurement.width;
                  const ratio = maxScroll > 0 ? x / maxScroll : 0;
                  setTempo(Math.round(60 + ratio * 140));
                }}
                scrollEventThrottle={16}
              >
                <View style={{ width: 200, height: 40 }} />
              </ScrollView>
            </View>
          </View>

          <View style={styles.octaveGroup}>
            <Animated.Text style={styles.settingLabel}>Octave</Animated.Text>
            <View style={styles.octaveControls}>
              <TouchableOpacity
                style={styles.octaveBtn}
                onPress={() => adjustOctave(-1)}
              >
                <MaterialCommunityIcons name="minus" size={18} color={COLORS.white} />
              </TouchableOpacity>
              <Animated.Text style={styles.octaveValue}>{currentOctave}</Animated.Text>
              <TouchableOpacity
                style={styles.octaveBtn}
                onPress={() => adjustOctave(1)}
              >
                <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recording Timeline */}
        {recordedNotes.length > 0 && (
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <MaterialCommunityIcons
                name="record"
                size={16}
                color={isRecording ? COLORS.error : COLORS.gray500}
              />
              <Animated.Text style={styles.timelineTitle}>
                Recording Timeline
              </Animated.Text>
              {recordedNotes.length > 0 && (
                <Tag label={`${recordedNotes.length} notes`} size="small" />
              )}
            </View>
            <ScrollView
              horizontal
              ref={timelineScroll}
              showsHorizontalScrollIndicator={false}
              style={styles.timelineScroll}
              contentContainerStyle={styles.timelineContent}
            >
              {recordedNotes.map((noteData, index) => {
                const colorIndex = ALL_NOTES.findIndex(n => n.note === noteData.note) % NOTE_COLORS.length;
                const barWidth = Math.max(30, (noteData.duration / 1000) * 50);
                return (
                  <View
                    key={index}
                    style={[
                      styles.timelineBar,
                      {
                        backgroundColor: NOTE_COLORS[colorIndex],
                        width: barWidth,
                        left: (noteData.time / 10),
                      },
                    ]}
                  >
                    <Animated.Text style={styles.timelineNoteText}>
                      {noteData.note}
                    </Animated.Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
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
  recordingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.error,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  noteDisplay: {
    alignItems: 'center',
    backgroundColor: '#2D2D44',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  currentNote: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  currentFreq: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  volumeMeter: {
    width: '100%',
    height: 4,
    backgroundColor: '#3D3D5C',
    borderRadius: 2,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  volumeMeterFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  pianoShadow: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.large,
  },
  pianoContainer: {
    height: KEY_HEIGHT + 10,
    backgroundColor: '#1A1A2E',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  pianoScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.xs,
    paddingBottom: 0,
  },
  whiteKeysRow: {
    flexDirection: 'row',
    height: KEY_HEIGHT,
    position: 'relative',
    zIndex: 1,
  },
  whiteKeyOuter: {
    height: KEY_HEIGHT,
    paddingHorizontal: 1,
  },
  whiteKeyTouchable: {
    flex: 1,
  },
  whiteKeyInner: {
    flex: 1,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
  },
  whiteKeyNoteLabel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteKeyNoteLabelActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  whiteKeyNoteText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#666666',
  },
  whiteKeyNoteTextActive: {
    color: COLORS.white,
  },
  blackKeysOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: BLACK_KEY_HEIGHT,
    zIndex: 10,
  },
  blackKeyOuter: {
    position: 'absolute',
    height: BLACK_KEY_HEIGHT,
  },
  blackKeyTouchable: {
    flex: 1,
  },
  blackKeyInner: {
    flex: 1,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderWidth: 0.5,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  blackKeyNoteLabel: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackKeyNoteLabelActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  blackKeyNoteText: {
    fontSize: 6,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  blackKeyNoteTextActive: {
    color: COLORS.white,
  },
  controlsBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  controlBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  recordBtn: {
    flex: 1,
    backgroundColor: '#3D3D5C',
    gap: SPACING.xs,
  },
  recordBtnActive: {
    backgroundColor: COLORS.error,
  },
  recordBtnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray500,
  },
  recordBtnDotActive: {
    backgroundColor: COLORS.white,
  },
  recordBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  stopBtn: {
    width: 52,
    backgroundColor: '#3D3D5C',
  },
  playBtn: {
    width: 52,
    backgroundColor: COLORS.primary,
  },
  playBtnDisabled: {
    backgroundColor: '#3D3D5C',
    opacity: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  settingGroup: {
    flex: 2,
    backgroundColor: '#2D2D44',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  octaveGroup: {
    flex: 1,
    backgroundColor: '#2D2D44',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#3D3D5C',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  sliderTrack: {
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    left: 0,
    top: 18,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    top: 12,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sliderHitContent: {
    width: 200,
  },
  octaveControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  octaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D3D5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  octaveValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    minWidth: 24,
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: '#2D2D44',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  timelineTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  timelineScroll: {
    height: 50,
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timelineBar: {
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  timelineNoteText: {
    fontSize: 7,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PianoScreen;
