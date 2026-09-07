import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated,
  Dimensions, StatusBar, Platform, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AudioVisualizer3D from '../components/AudioVisualizer3D';
import { getAuthToken } from '../config/api';
import { audioService } from '../services/AudioService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAD_SOUNDS = [
  { id: 'kick', label: 'KICK', color: '#7C3AED', icon: '🔊', freq: 60, type: 'low', pad: 0 },
  { id: 'snare', label: 'SNARE', color: '#06B6D4', icon: '💥', freq: 200, type: 'mid', pad: 1 },
  { id: 'hihat', label: 'HI-HAT', color: '#10B981', icon: '🔊', freq: 800, type: 'high', pad: 2 },
  { id: 'tom1', label: 'TOM 1', color: '#F59E0B', icon: '🥁', freq: 150, type: 'mid', pad: 3 },
  { id: 'tom2', label: 'TOM 2', color: '#EF4444', icon: '🥁', freq: 120, type: 'mid', pad: 4 },
  { id: 'crash', label: 'CRASH', color: '#EC4899', icon: '💥', freq: 1200, type: 'high', pad: 5 },
  { id: 'ride', label: 'RIDE', color: '#8B5CF6', icon: '🔔', freq: 900, type: 'high', pad: 6 },
  { id: 'clap', label: 'CLAP', color: '#14B8A6', icon: '👏', freq: 500, type: 'mid', pad: 7 },
  { id: 'rim', label: 'RIM', color: '#F97316', icon: '🔥', freq: 700, type: 'mid', pad: 8 },
];

const BEAT_PATTERNS = {
  basic: [
    { pad: 0, time: 0 }, { pad: 2, time: 0.5 }, { pad: 1, time: 1 }, { pad: 2, time: 1.5 },
    { pad: 0, time: 2 }, { pad: 2, time: 2.5 }, { pad: 1, time: 3 }, { pad: 2, time: 3.5 },
  ],
  hiphop: [
    { pad: 0, time: 0 }, { pad: 2, time: 0.5 }, { pad: 0, time: 1 }, { pad: 1, time: 1.25 },
    { pad: 2, time: 1.5 }, { pad: 0, time: 2 }, { pad: 2, time: 2.5 }, { pad: 1, time: 3 }, { pad: 2, time: 3.5 },
  ],
  rock: [
    { pad: 0, time: 0 }, { pad: 2, time: 0.5 }, { pad: 0, time: 0.75 }, { pad: 2, time: 1 },
    { pad: 1, time: 1 }, { pad: 2, time: 1.5 }, { pad: 0, time: 2 }, { pad: 2, time: 2.25 },
    { pad: 0, time: 2.5 }, { pad: 2, time: 3 }, { pad: 1, time: 3 }, { pad: 2, time: 3.5 },
  ],
  jazz: [
    { pad: 2, time: 0 }, { pad: 2, time: 0.75 }, { pad: 6, time: 0.5 },
    { pad: 2, time: 1 }, { pad: 2, time: 1.75 }, { pad: 6, time: 1.5 },
    { pad: 2, time: 2 }, { pad: 2, time: 2.75 }, { pad: 6, time: 2.5 },
    { pad: 2, time: 3 }, { pad: 2, time: 3.75 }, { pad: 6, time: 3.5 },
  ],
  electronic: [
    { pad: 0, time: 0 }, { pad: 5, time: 0.5 }, { pad: 1, time: 0.75 },
    { pad: 2, time: 1 }, { pad: 0, time: 1.5 }, { pad: 5, time: 2 },
    { pad: 1, time: 2.5 }, { pad: 2, time: 3 }, { pad: 0, time: 3.5 },
  ],
};

const PAD_GRID = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

const DrumsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [pattern, setPattern] = useState('basic');
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingHits, setRecordingHits] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [activePads, setActivePads] = useState({});
  const [velocityMap, setVelocityMap] = useState({});
  const [padBounces, setPadBounces] = useState({});
  const [ledFlashes, setLedFlashes] = useState({});
  const [ripples, setRipples] = useState({});

  useEffect(() => {
    getAuthToken().then(t => { if (t) setUser({ token: t }); });
  }, []);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainRef = useRef(null);
  const playTimerRef = useRef(null);
  const recordStartRef = useRef(null);
  const padAnims = useRef({}).current;
  const ledAnims = useRef({}).current;
  const rippleAnims = useRef({}).current;

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.gain.value = 0.6;
      gainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playPadSound = useCallback((padId, velocity = 0.8) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sound = PAD_SOUNDS.find(s => s.id === padId);
    if (!sound) return;

    const velGain = 0.5 + velocity * 0.5;
    if (Platform.OS !== 'web') { try { Vibration.vibrate(20); } catch (e) {} }

    // Main impact noise burst
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = sound.freq;
    noiseFilter.Q.value = 2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(velGain * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainRef.current);
    noiseSource.start(now);
    noiseSource.stop(now + 0.1);

    // Tonal body
    const osc = ctx.createOscillator();
    osc.type = sound.type === 'low' ? 'sine' : sound.type === 'mid' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(sound.freq, now);
    if (sound.type === 'low') {
      osc.frequency.exponentialRampToValueAtTime(sound.freq * 0.4, now + 0.2);
    } else {
      osc.frequency.exponentialRampToValueAtTime(sound.freq * 0.8, now + 0.05);
    }
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(velGain * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(gainRef.current);
    osc.start(now);
    osc.stop(now + 0.2);

    // Resonant body for kick/tom
    if (sound.type === 'low') {
      const bodyOsc = ctx.createOscillator();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(80, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(velGain * 0.3, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(gainRef.current);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.3);
    }

    setActivePads(prev => ({ ...prev, [padId]: true }));
    setVelocityMap(prev => ({ ...prev, [padId]: Math.round(velocity * 100) + '%' }));
    setPadBounces(prev => ({ ...prev, [padId]: true }));
    setLedFlashes(prev => ({ ...prev, [padId]: true }));
    setRipples(prev => ({ ...prev, [padId]: { id: Date.now(), color: sound.color } }));

    setTimeout(() => {
      setActivePads(prev => { const c = { ...prev }; delete c[padId]; return c; });
      setVelocityMap(prev => { const c = { ...prev }; delete c[padId]; return c; });
      setPadBounces(prev => { const c = { ...prev }; delete c[padId]; return c; });
      setLedFlashes(prev => { const c = { ...prev }; delete c[padId]; return c; });
    }, 180);

    setTimeout(() => setRipples(prev => { const c = { ...prev }; delete c[padId]; return c; }), 500);

    if (recording) {
      const elapsed = Date.now() - recordStartRef.current;
      setRecordingHits(prev => [...prev, { padId, time: elapsed, velocity }]);
    }
  }, [getAudioContext, recording]);

  const playPattern = useCallback((pat) => {
    const beats = BEAT_PATTERNS[pat];
    if (!beats) return;
    setPlaying(true);
    const msPerBeat = 60000 / bpm;
    beats.forEach(hit => {
      setTimeout(() => playPadSound(PAD_SOUNDS[hit.pad].id, 0.85), hit.time * msPerBeat);
    });
    setTimeout(() => setPlaying(false), beats[beats.length - 1].time * msPerBeat + 200);
  }, [bpm, playPadSound]);

  const startRecording = useCallback(() => {
    setRecordingHits([]);
    recordStartRef.current = Date.now();
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (recordingHits.length > 0) {
      const rec = {
        id: Date.now(),
        pattern,
        bpm,
        date: new Date().toLocaleDateString(),
        hits: recordingHits,
      };
      setRecordings(prev => [...prev, rec]);
    }
  }, [recordingHits, pattern, bpm, user]);

  const deleteRecording = useCallback((id) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  const playRecording = useCallback((rec) => {
    setPlaying(true);
    const timers = [];
    rec.hits.forEach(hit => {
      timers.push(setTimeout(() => playPadSound(hit.padId, hit.velocity), hit.time));
    });
    const maxTime = rec.hits.length > 0 ? Math.max(...rec.hits.map(h => h.time)) : 0;
    timers.push(setTimeout(() => setPlaying(false), maxTime + 500));
    return () => timers.forEach(t => clearTimeout(t));
  }, [playPadSound]);

  const handlePadPress = useCallback((padId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    const touch = e?.nativeEvent?.locationY || 0;
    const padHeight = 100;
    const velocity = Math.min(1, Math.max(0.2, 1 - touch / padHeight + 0.4));
    playPadSound(padId, velocity);
  }, [playPadSound]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={(e) => { if(e.stopPropagation) e.stopPropagation(); navigation.navigate('Home'); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#C4B5FD" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Drums</Text>
            <Text style={styles.headerSub}>{bpm} BPM | {pattern}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Visualizer */}
        <AudioVisualizer3D
          analyser={analyserRef.current}
          isPlaying={playing || Object.keys(activePads).length > 0}
          color1="#06B6D4"
          color2="#10B981"
          style={styles.visualizerWrap}
        />

        {/* Active pad display */}
        <View style={styles.activeDisplayRow}>
          {Object.keys(activePads).map(id => (
            <View key={id} style={styles.activePadChip}>
              <Text style={styles.activePadText}>{PAD_SOUNDS.find(s => s.id === id)?.label}</Text>
              <Text style={styles.activeVelText}>{velocityMap[id] || ''}</Text>
            </View>
          ))}
          {Object.keys(activePads).length === 0 && (
            <Text style={styles.hintText}>Tap a pad to play</Text>
          )}
        </View>

        {/* MPC Pad Grid */}
        <View style={styles.padGrid}>
          {PAD_GRID.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.padRow}>
              {row.map(padIdx => {
                const sound = PAD_SOUNDS[padIdx];
                const isActive = activePads[sound.id];
                const isBouncing = padBounces[sound.id];
                const isFlashing = ledFlashes[sound.id];
                const ripple = ripples[sound.id];
                return (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.mpcPad,
                      isActive && styles.mpcPadActive,
                      isBouncing && styles.mpcPadBounce,
                    ]}
                    activeOpacity={0.85}
                    onPressIn={(e) => { if(e.stopPropagation) e.stopPropagation(); }}
                    onPress={(e) => handlePadPress(sound.id, e)}
                  >
                    {/* LED perimeter ring */}
                    <View style={[
                      styles.ledRing,
                      isFlashing && { borderColor: sound.color, shadowColor: sound.color },
                    ]} />

                    {/* Pad inner bevel */}
                    <View style={[
                      styles.padInner,
                      isActive && { backgroundColor: sound.color + '30' },
                    ]}>
                      {/* Rubber texture lines */}
                      <View style={styles.rubberLines}>
                        {[0,1,2,3,4].map(i => (
                          <View key={i} style={styles.rubberLine} />
                        ))}
                      </View>

                      {/* Center dot */}
                      <View style={[
                        styles.centerDot,
                        isActive && { backgroundColor: sound.color },
                      ]} />

                      {/* Label */}
                      <Text style={[
                        styles.padLabel,
                        isActive && { color: sound.color },
                      ]}>
                        {sound.label}
                      </Text>
                    </View>

                    {/* Impact ripple */}
                    {ripple && (
                      <View style={[
                        styles.ripple,
                        {
                          borderColor: ripple.color,
                          opacity: 0,
                        },
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* BPM Control */}
        <View style={styles.bpmRow}>
          <Text style={styles.bpmLabel}>BPM</Text>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => setBpm(b => Math.max(40, b - 5))}>
            <Ionicons name="remove" size={18} color="#C4B5FD" />
          </TouchableOpacity>
          <Text style={styles.bpmValue}>{bpm}</Text>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => setBpm(b => Math.min(240, b + 5))}>
            <Ionicons name="add" size={18} color="#C4B5FD" />
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={[styles.bpmBtn, playing && styles.bpmBtnActive]} onPress={() => playPattern(pattern)}>
            <Ionicons name={playing ? 'pause' : 'play'} size={18} color={playing ? '#F43F5E' : '#10B981'} />
          </TouchableOpacity>
        </View>

        {/* Pattern Selector */}
        <View style={styles.patternRow}>
          {Object.keys(BEAT_PATTERNS).map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.patternBtn, pattern === name && styles.patternBtnActive]}
              onPress={() => { setPattern(name); if (playing) playPattern(name); }}
            >
              <Text style={[styles.patternBtnText, pattern === name && styles.patternBtnTextActive]}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Record Controls */}
        <View style={styles.recordRow}>
          <TouchableOpacity
            style={[styles.recordBtn, recording && styles.recordBtnActive]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Ionicons name={recording ? 'stop' : 'radio'} size={20} color="#F43F5E" />
            <Text style={styles.recordBtnText}>{recording ? 'Stop Rec' : 'Record'}</Text>
          </TouchableOpacity>
        </View>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <View style={styles.recordingsSection}>
            <Text style={styles.sectionTitle}>Recordings ({recordings.length})</Text>
            {recordings.map((rec, idx) => (
              <View key={rec.id} style={styles.recordingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>#{idx + 1} - {rec.pattern} @ {rec.bpm} BPM</Text>
                  <Text style={styles.recSub}>{rec.date} | {rec.hits.length} hits</Text>
                </View>
                <TouchableOpacity onPress={() => playRecording(rec)} style={styles.recAction}>
                  <Ionicons name="play" size={16} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecording(rec.id)} style={styles.recAction}>
                  <Ionicons name="trash" size={16} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  scrollContent: { paddingTop: Platform.OS === 'web' ? 20 : 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(6,182,212,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F3F0FF', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#67E8F9', marginTop: 2 },
  visualizerWrap: { height: 100, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  activeDisplayRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14, minHeight: 36, alignItems: 'center' },
  activePadChip: { backgroundColor: 'rgba(6,182,212,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', borderWidth: 1, borderColor: '#06B6D4' },
  activePadText: { fontSize: 12, fontWeight: '800', color: '#67E8F9' },
  activeVelText: { fontSize: 9, color: '#06B6D4', marginTop: 1 },
  hintText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  padGrid: { alignItems: 'center', marginBottom: 16, gap: 10 },
  padRow: { flexDirection: 'row', gap: 10 },
  mpcPad: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#12151F',
    borderWidth: 2,
    borderColor: '#1E2233',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mpcPadActive: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    transform: [{ scale: 0.95 }],
  },
  mpcPadBounce: {
    transform: [{ scale: 0.92 }],
  },
  ledRing: {
    position: 'absolute',
    top: 3, left: 3, right: 3, bottom: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E2233',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  padInner: {
    width: '85%',
    height: '85%',
    borderRadius: 8,
    backgroundColor: 'rgba(18,21,31,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rubberLines: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
  },
  rubberLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 1,
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D3348',
    marginBottom: 6,
  },
  padLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  ripple: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 100, height: 100,
    marginTop: -50, marginLeft: -50,
    borderRadius: 50,
    borderWidth: 2,
  },
  bpmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  bpmLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', marginRight: 4 },
  bpmBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(30,30,50,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  bpmBtnActive: { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: '#F43F5E' },
  bpmValue: { fontSize: 22, fontWeight: '800', color: '#F3F0FF', minWidth: 44, textAlign: 'center' },
  patternRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14 },
  patternBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  patternBtnActive: { backgroundColor: 'rgba(6,182,212,0.2)', borderColor: '#06B6D4' },
  patternBtnText: { fontSize: 11, color: '#9CA3AF', fontWeight: '700' },
  patternBtnTextActive: { color: '#67E8F9' },
  recordRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 14 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  recordBtnActive: { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: '#F43F5E' },
  recordBtnText: { fontSize: 13, color: '#E5E7EB', fontWeight: '700' },
  recordingsSection: { marginTop: 4, padding: 14, borderRadius: 14, backgroundColor: 'rgba(14,17,26,0.7)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.15)' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#67E8F9', marginBottom: 8 },
  recordingItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: 'rgba(30,30,50,0.5)', marginBottom: 6, borderWidth: 1, borderColor: 'rgba(100,100,120,0.15)' },
  recTitle: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  recSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  recAction: { padding: 8, marginLeft: 8 },
});

export default DrumsScreen;
