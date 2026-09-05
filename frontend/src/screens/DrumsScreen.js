import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, SectionHeader, Tag } from '../components/UIComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DRUMS = [
  { id: 'kick', name: 'Kick', icon: 'drum', color: '#E91E63', freq: 60, type: 'sine' },
  { id: 'snare', name: 'Snare', icon: 'drum', color: '#9C27B0', freq: 200, type: 'triangle' },
  { id: 'hihat', name: 'Hi-Hat', icon: 'cymbal', color: '#FF9800', freq: 800, type: 'square' },
  { id: 'tom', name: 'Tom', icon: 'drum', color: '#4CAF50', freq: 120, type: 'sine' },
  { id: 'cymbal', name: 'Cymbal', icon: 'cymbal', color: '#2196F3', freq: 1200, type: 'sawtooth' },
  { id: 'clap', name: 'Clap', icon: 'hand', color: '#FF5722', freq: 400, type: 'triangle' },
];

const BEAT_PATTERNS = [
  { name: 'Basic Rock', pattern: ['kick', null, 'snare', null, 'kick', null, 'snare', null] },
  { name: 'Four on Floor', pattern: ['kick', 'kick', 'kick', 'kick', 'snare', 'snare', 'snare', 'snare'] },
  { name: 'Syncopated', pattern: ['kick', null, null, 'hihat', 'snare', null, 'hihat', null] },
];

const DrumsScreen = ({ navigation }) => {
  const [activeDrum, setActiveDrum] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBeats, setRecordedBeats] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [patternStep, setPatternStep] = useState(-1);
  
  const audioContext = useRef(null);
  const recordingStart = useRef(0);
  const playbackTimeout = useRef(null);
  const patternInterval = useRef(null);
  const padAnimations = useRef({});

  useEffect(() => {
    return () => {
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
      if (patternInterval.current) clearInterval(patternInterval.current);
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext.current;
  };

  const playDrum = useCallback((drum) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Different sound synthesis for each drum
      osc.type = drum.type;
      
      if (drum.id === 'kick') {
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else if (drum.id === 'snare') {
        osc.frequency.setValueAtTime(drum.freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        // Add noise for snare
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.2);
      } else if (drum.id === 'hihat') {
        osc.frequency.setValueAtTime(drum.freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      } else if (drum.id === 'cymbal') {
        osc.frequency.setValueAtTime(drum.freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(drum.freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      }
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(5000, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      
      // Visual feedback
      setActiveDrum(drum.id);
      
      if (!padAnimations.current[drum.id]) {
        padAnimations.current[drum.id] = new Animated.Value(1);
      }
      Animated.sequence([
        Animated.timing(padAnimations.current[drum.id], {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(padAnimations.current[drum.id], {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Record beat
      if (isRecording) {
        const timestamp = Date.now() - recordingStart.current;
        setRecordedBeats(prev => [...prev, { drum: drum.id, time: timestamp }]);
      }
      
      setTimeout(() => setActiveDrum(null), 150);
    } catch (e) {
      console.error('Error playing drum:', e);
    }
  }, [volume, isRecording]);

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
      const drum = DRUMS.find(d => d.id === beat.drum);
      if (drum) playDrum(drum);
      
      index++;
      const delay = index < recordedBeats.length 
        ? recordedBeats[index].time - beat.time 
        : 200;
      
      playbackTimeout.current = setTimeout(playNext, Math.max(delay, 50));
    };
    
    playNext();
  };

  const handleClear = () => {
    setRecordedBeats([]);
    if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    setIsPlaying(false);
  };

  const handlePatternPlay = (pattern) => {
    if (patternInterval.current) {
      clearInterval(patternInterval.current);
      setPatternStep(-1);
      setSelectedPattern(null);
      return;
    }
    
    setSelectedPattern(pattern.name);
    let step = 0;
    
    patternInterval.current = setInterval(() => {
      const drumId = pattern.pattern[step % pattern.pattern.length];
      if (drumId) {
        const drum = DRUMS.find(d => d.id === drumId);
        if (drum) playDrum(drum);
      }
      setPatternStep(step % pattern.pattern.length);
      step++;
    }, 250); // 240 BPM = 250ms per step
  };

  const renderDrumPad = (drum) => {
    const isActive = activeDrum === drum.id;
    const anim = padAnimations.current[drum.id] || new Animated.Value(1);
    
    return (
      <TouchableOpacity
        key={drum.id}
        style={[styles.drumPad, { borderColor: drum.color }]}
        onPressIn={() => playDrum(drum)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.drumPadInner, { transform: [{ scale: anim }] }, isActive && { backgroundColor: drum.color }]}>
          <MaterialCommunityIcons 
            name={drum.icon} 
            size={36} 
            color={isActive ? COLORS.white : drum.color} 
          />
          <Animated.Text style={[styles.drumPadText, isActive && styles.drumPadTextActive]}>
            {drum.name}
          </Animated.Text>
          {isActive && <View style={[styles.drumPadGlow, { backgroundColor: drum.color }]} />}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        {...createGradient(['#E91E63', '#9C27B0'])}
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
            <Animated.Text style={styles.headerTitle}>Virtual Drums</Animated.Text>
            <Animated.Text style={styles.headerSubtitle}>6 pads - Multi-touch ready</Animated.Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Drum Display */}
        <View style={styles.activeDisplay}>
          <Animated.Text style={styles.activeDrumName}>
            {activeDrum ? DRUMS.find(d => d.id === activeDrum)?.name : 'Tap a pad'}
          </Animated.Text>
        </View>

        {/* Drum Pads Grid */}
        <View style={styles.padsGrid}>
          {DRUMS.map(drum => renderDrumPad(drum))}
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
                  <View style={[styles.volumeIndicator, { height: `${v * 100}%`, backgroundColor: volume >= v ? '#E91E63' : COLORS.gray300 }]} />
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
            {recordedBeats.length > 0 && (
              <Tag label={`${recordedBeats.length} beats`} size="small" />
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
              style={[styles.playButton, recordedBeats.length === 0 && styles.playButtonDisabled]}
              onPress={handlePlayback}
              disabled={recordedBeats.length === 0 || isPlaying}
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

        {/* Beat Patterns */}
        <View style={styles.patternCard}>
          <Animated.Text style={styles.patternTitle}>Beat Patterns</Animated.Text>
          <View style={styles.patternList}>
            {BEAT_PATTERNS.map((pattern, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.patternItem, selectedPattern === pattern.name && styles.patternItemActive]}
                onPress={() => handlePatternPlay(pattern)}
              >
                <MaterialCommunityIcons 
                  name={selectedPattern === pattern.name ? "stop-circle" : "play-circle"} 
                  size={24} 
                  color={selectedPattern === pattern.name ? COLORS.error : COLORS.primary} 
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
                          patternStep === i && styles.patternDotCurrent,
                        ]} 
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
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
  activeDisplay: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  activeDrumName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  padsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  drumPad: {
    width: (SCREEN_WIDTH - 56) / 2,
    height: (SCREEN_WIDTH - 56) / 2,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  drumPadInner: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumPadText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
    marginTop: SPACING.sm,
  },
  drumPadTextActive: {
    color: COLORS.white,
  },
  drumPadGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.8,
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
  patternCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  patternList: {
    gap: SPACING.sm,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  patternItemActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  patternInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  patternName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  patternDots: {
    flexDirection: 'row',
    gap: 4,
  },
  patternDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray300,
  },
  patternDotActive: {
    backgroundColor: COLORS.primary,
  },
  patternDotCurrent: {
    backgroundColor: COLORS.error,
  },
  bottomPadding: {
    height: 100,
  },
});

export default DrumsScreen;
