import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, SectionHeader, Tag } from '../components/UIComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Note frequencies for 2 octaves (C4 to B5)
const NOTES = [
  { note: 'C4', freq: 261.63, isBlack: false },
  { note: 'C#4', freq: 277.18, isBlack: true },
  { note: 'D4', freq: 293.66, isBlack: false },
  { note: 'D#4', freq: 311.13, isBlack: true },
  { note: 'E4', freq: 329.63, isBlack: false },
  { note: 'F4', freq: 349.23, isBlack: false },
  { note: 'F#4', freq: 369.99, isBlack: true },
  { note: 'G4', freq: 392.00, isBlack: false },
  { note: 'G#4', freq: 415.30, isBlack: true },
  { note: 'A4', freq: 440.00, isBlack: false },
  { note: 'A#4', freq: 466.16, isBlack: true },
  { note: 'B4', freq: 493.88, isBlack: false },
  { note: 'C5', freq: 523.25, isBlack: false },
  { note: 'C#5', freq: 554.37, isBlack: true },
  { note: 'D5', freq: 587.33, isBlack: false },
  { note: 'D#5', freq: 622.25, isBlack: true },
  { note: 'E5', freq: 659.25, isBlack: false },
  { note: 'F5', freq: 698.46, isBlack: false },
  { note: 'F#5', freq: 739.99, isBlack: true },
  { note: 'G5', freq: 783.99, isBlack: false },
  { note: 'G#5', freq: 830.61, isBlack: true },
  { note: 'A5', freq: 880.00, isBlack: false },
  { note: 'A#5', freq: 932.33, isBlack: true },
  { note: 'B5', freq: 987.77, isBlack: false },
];

const PianoScreen = ({ navigation }) => {
  const [activeNote, setActiveNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentOctave, setCurrentOctave] = useState(4);
  
  const audioContext = useRef(null);
  const activeOscillators = useRef({});
  const recordingStart = useRef(0);
  const playbackTimeout = useRef(null);
  const pressAnimations = useRef({});

  useEffect(() => {
    return () => {
      Object.values(activeOscillators.current).forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContext.current) {
      const AudioContext = Platform.OS === 'web' 
        ? window.AudioContext || window.webkitAudioContext 
        : require('expo-audio').AudioContext;
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  };

  const playNote = useCallback((note) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = note.freq;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      
      activeOscillators.current[note.note] = osc;
      
      setActiveNote(note.note);
      
      // Animate press
      if (!pressAnimations.current[note.note]) {
        pressAnimations.current[note.note] = new Animated.Value(1);
      }
      Animated.sequence([
        Animated.timing(pressAnimations.current[note.note], {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(pressAnimations.current[note.note], {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Record note
      if (isRecording) {
        const timestamp = Date.now() - recordingStart.current;
        setRecordedNotes(prev => [...prev, { note: note.note, freq: note.freq, time: timestamp, duration: 300 }]);
      }
      
      setTimeout(() => setActiveNote(null), 300);
    } catch (e) {
      console.error('Error playing note:', e);
    }
  }, [volume, isRecording]);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      recordingStart.current = Date.now();
      setIsRecording(true);
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
      const note = NOTES.find(n => n.note === noteData.note);
      if (note) playNote(note);
      
      index++;
      const delay = index < recordedNotes.length 
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

  const renderWhiteKeys = () => {
    const whiteNotes = NOTES.filter(n => !n.isBlack);
    const keyWidth = (SCREEN_WIDTH - 32) / 14;
    
    return whiteNotes.map((note, index) => {
      const isActive = activeNote === note.note;
      const anim = pressAnimations.current[note.note] || new Animated.Value(1);
      
      return (
        <Animated.View
          key={note.note}
          style={[
            styles.whiteKey,
            { width: keyWidth, transform: [{ scale: anim }] },
            isActive && styles.whiteKeyActive,
          ]}
        >
          <TouchableOpacity
            style={styles.whiteKeyTouchable}
            onPressIn={() => playNote(note)}
            activeOpacity={0.8}
          >
            <View style={[styles.whiteKeyInner, isActive && styles.whiteKeyInnerActive]}>
              <View style={[styles.noteLabel, isActive && styles.noteLabelActive]}>
                <Animated.Text style={[styles.noteText, isActive && styles.noteTextActive]}>
                  {note.note}
                </Animated.Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  const renderBlackKeys = () => {
    const blackNotes = NOTES.filter(n => n.isBlack);
    const whiteKeyWidth = (SCREEN_WIDTH - 32) / 14;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    
    // Position black keys relative to white keys
    const blackKeyPositions = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15];
    
    return blackNotes.map((note, index) => {
      const isActive = activeNote === note.note;
      const anim = pressAnimations.current[note.note] || new Animated.Value(1);
      const pos = blackKeyPositions[index] || index;
      
      return (
        <Animated.View
          key={note.note}
          style={[
            styles.blackKey,
            {
              left: pos * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2,
              width: blackKeyWidth,
              transform: [{ scale: anim }],
            },
            isActive && styles.blackKeyActive,
          ]}
        >
          <TouchableOpacity
            style={styles.blackKeyTouchable}
            onPressIn={() => playNote(note)}
            activeOpacity={0.8}
          >
            <View style={[styles.blackKeyInner, isActive && styles.blackKeyInnerActive]}>
              <Animated.Text style={[styles.blackKeyText, isActive && styles.blackKeyTextActive]}>
                {note.note}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        {...createGradient(COLORS.gradient.royal)}
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
            <Animated.Text style={styles.headerSubtitle}>2 Octaves - C4 to B5</Animated.Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Note Display */}
        <View style={styles.noteDisplay}>
          <Animated.Text style={styles.currentNote}>
            {activeNote || 'Tap a key'}
          </Animated.Text>
          {activeNote && (
            <Tag 
              label={`${NOTES.find(n => n.note === activeNote)?.freq.toFixed(1)} Hz`} 
              color={COLORS.accent}
            />
          )}
        </View>

        {/* Piano Keyboard */}
        <View style={styles.pianoContainer}>
          <View style={styles.pianoWhiteKeys}>
            {renderWhiteKeys()}
          </View>
          <View style={styles.pianoBlackKeys}>
            {renderBlackKeys()}
          </View>
        </View>

        {/* Volume Control */}
        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <MaterialCommunityIcons name="volume-low" size={20} color={COLORS.gray500} />
            <View style={styles.sliderContainer}>
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.volumeButton, volume === v && styles.volumeButtonActive]}
                  onPress={() => setVolume(v)}
                >
                  <View style={[styles.volumeIndicator, { height: `${v * 100}%`, backgroundColor: volume >= v ? COLORS.primary : COLORS.gray300 }]} />
                </TouchableOpacity>
              ))}
            </View>
            <MaterialCommunityIcons name="volume-high" size={20} color={COLORS.gray500} />
            <Animated.Text style={styles.volumeText}>{Math.round(volume * 100)}%</Animated.Text>
          </View>
        </View>

        {/* Record Controls */}
        <View style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <MaterialCommunityIcons name="record" size={20} color={isRecording ? COLORS.error : COLORS.gray500} />
            <Animated.Text style={styles.recordTitle}>
              {isRecording ? 'Recording...' : 'Record & Playback'}
            </Animated.Text>
            {recordedNotes.length > 0 && (
              <Tag label={`${recordedNotes.length} notes`} size="small" />
            )}
          </View>
          
          <View style={styles.recordButtons}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={handleRecord}
            >
              <MaterialCommunityIcons 
                name={isRecording ? "stop" : "record"} 
                size={24} 
                color={COLORS.white} 
              />
              <Animated.Text style={styles.recordButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Animated.Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.playButton, recordedNotes.length === 0 && styles.playButtonDisabled]}
              onPress={handlePlayback}
              disabled={recordedNotes.length === 0 || isPlaying}
            >
              <MaterialCommunityIcons 
                name={isPlaying ? "stop" : "play"} 
                size={24} 
                color={COLORS.white} 
              />
              <Animated.Text style={styles.playButtonText}>
                {isPlaying ? 'Playing...' : 'Play'}
              </Animated.Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <MaterialCommunityIcons name="delete" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Guide */}
        <View style={styles.guideCard}>
          <Animated.Text style={styles.guideTitle}>Note Guide</Animated.Text>
          <View style={styles.guideGrid}>
            {NOTES.filter(n => !n.isBlack).map((note) => (
              <View key={note.note} style={styles.guideItem}>
                <View style={styles.guideDot} />
                <Animated.Text style={styles.guideNote}>{note.note}</Animated.Text>
                <Animated.Text style={styles.guideFreq}>{note.freq.toFixed(0)} Hz</Animated.Text>
              </View>
            ))}
          </View>
        </View>

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
  noteDisplay: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  currentNote: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  pianoContainer: {
    position: 'relative',
    height: 200,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  pianoWhiteKeys: {
    flexDirection: 'row',
    height: 200,
  },
  pianoBlackKeys: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  whiteKey: {
    height: 200,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
  },
  whiteKeyTouchable: {
    flex: 1,
  },
  whiteKeyInner: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  whiteKeyInnerActive: {
    backgroundColor: COLORS.primaryLight,
  },
  whiteKeyActive: {
    backgroundColor: COLORS.primaryLight,
  },
  noteLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabelActive: {
    backgroundColor: COLORS.primary,
  },
  noteText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  noteTextActive: {
    color: COLORS.white,
  },
  blackKey: {
    position: 'absolute',
    height: 120,
    zIndex: 10,
  },
  blackKeyTouchable: {
    flex: 1,
  },
  blackKeyInner: {
    flex: 1,
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  blackKeyInnerActive: {
    backgroundColor: COLORS.primaryDark,
  },
  blackKeyActive: {
    backgroundColor: COLORS.primaryDark,
  },
  blackKeyText: {
    fontSize: 7,
    fontWeight: '600',
    color: COLORS.white,
  },
  blackKeyTextActive: {
    color: COLORS.primaryLight,
  },
  controlCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
    marginHorizontal: SPACING.md,
    gap: 8,
  },
  volumeButton: {
    width: 20,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeButtonActive: {},
  volumeIndicator: {
    width: '100%',
    borderRadius: 4,
  },
  volumeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
    marginLeft: SPACING.sm,
    minWidth: 36,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recordTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },
  recordButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  recordButtonActive: {
    backgroundColor: COLORS.error,
  },
  recordButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  playButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  clearButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
  },
  guideCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  guideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.xs,
  },
  guideNote: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginRight: SPACING.xs,
  },
  guideFreq: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  bottomPadding: {
    height: 100,
  },
});

export default PianoScreen;
