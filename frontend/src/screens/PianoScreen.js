import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated,
  Dimensions, StatusBar, Platform, Vibration,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect, Circle, Ellipse, Filter, FeGaussianBlur } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import AudioVisualizer3D from '../components/AudioVisualizer3D';
import { getAuthToken } from '../config/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NOTES = [
  { note: 'C4', freq: 261.63, type: 'white' },
  { note: 'C#4', freq: 277.18, type: 'black' },
  { note: 'D4', freq: 293.66, type: 'white' },
  { note: 'D#4', freq: 311.13, type: 'black' },
  { note: 'E4', freq: 329.63, type: 'white' },
  { note: 'F4', freq: 349.23, type: 'white' },
  { note: 'F#4', freq: 369.99, type: 'black' },
  { note: 'G4', freq: 392.0, type: 'white' },
  { note: 'G#4', freq: 415.30, type: 'black' },
  { note: 'A4', freq: 440.0, type: 'white' },
  { note: 'A#4', freq: 466.16, type: 'black' },
  { note: 'B4', freq: 493.88, type: 'white' },
  { note: 'C5', freq: 523.25, type: 'white' },
  { note: 'C#5', freq: 554.37, type: 'black' },
  { note: 'D5', freq: 587.33, type: 'white' },
  { note: 'D#5', freq: 622.25, type: 'black' },
  { note: 'E5', freq: 659.25, type: 'white' },
];

const KEY_MAP = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p',';'];

const OCTAVES = [-1, 0, 1];

const PRESETS = {
  Grand: { waveform: 'sine', attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8, gain: 0.25 },
  Bright: { waveform: 'triangle', attack: 0.005, decay: 0.15, sustain: 0.6, release: 0.4, gain: 0.3 },
  Warm: { waveform: 'sine', attack: 0.03, decay: 0.5, sustain: 0.3, release: 1.0, gain: 0.2 },
};

const VEL_CURVE = [
  { threshold: 0.08, velocity: 0.3, label: 'ppp' },
  { threshold: 0.12, velocity: 0.45, label: 'pp' },
  { threshold: 0.16, velocity: 0.6, label: 'p' },
  { threshold: 0.2, velocity: 0.75, label: 'mp' },
  { threshold: 0.25, velocity: 0.85, label: 'mf' },
  { threshold: 0.3, velocity: 0.92, label: 'f' },
  { threshold: 0.4, velocity: 1.0, label: 'ff' },
];

const PianoScreen = ({ onNavigate }) => {
  const [user, setUser] = useState(null);
  const [preset, setPreset] = useState('Grand');
  const [selectedOctave, setSelectedOctave] = useState(0);
  const [octave, setOctave] = useState(4);
  const [activeKeys, setActiveKeys] = useState({});
  const [recording, setRecording] = useState(false);
  const [playback, setPlayback] = useState(false);
  const [recordingData, setRecordingData] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [velocityMap, setVelocityMap] = useState({});
  const [reverbOn, setReverb] = useState(false);
  const [sustainOn, setSustain] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState('frequency');

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const recordStartRef = useRef(null);
  const keyAnims = useRef({}).current;
  const glowAnims = useRef({}).current;
  const prevNoteRef = useRef(null);

  useEffect(() => {
    getAuthToken().then(t => { if (t) setUser({ token: t }); });
  }, []);

  useEffect(() => {
    setOctave(4 + selectedOctave);
  }, [selectedOctave]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.75;
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = PRESETS[preset].gain;
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      if (reverbOn) {
        reverbNodeRef.current = audioCtxRef.current.createConvolver();
        const len = audioCtxRef.current.sampleRate * 1.5;
        const buf = audioCtxRef.current.createBuffer(2, len, audioCtxRef.current.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const data = buf.getChannelData(ch);
          for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        }
        reverbNodeRef.current.buffer = buf;
        reverbNodeRef.current.connect(gainNodeRef.current);
      }
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, [preset, reverbOn]);

  const playNote = useCallback((note, velocity = 0.8) => {
    const ctx = getAudioContext();
    const settings = PRESETS[preset];
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = settings.waveform;
    osc.frequency.setValueAtTime(note.freq, now);

    const velSetting = VEL_CURVE.find(v => velocity <= v.threshold) || VEL_CURVE[VEL_CURVE.length - 1];
    const velGain = velSetting.velocity;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(settings.gain * velGain, now + settings.attack);
    gain.gain.linearRampToValueAtTime(settings.gain * velGain * settings.sustain, now + settings.attack + settings.decay);

    if (sustainOn) {
      gain.gain.setValueAtTime(settings.gain * velGain * settings.sustain, now + settings.attack + settings.decay);
    } else {
      gain.gain.linearRampToValueAtTime(0, now + settings.attack + settings.decay + settings.release);
    }

    osc.connect(reverbOn && reverbNodeRef.current ? reverbNodeRef.current : gain);
    gain.connect(reverbOn && reverbNodeRef.current ? reverbNodeRef.current : gainNodeRef.current);
    osc.start(now);
    osc.stop(now + settings.attack + settings.decay + settings.release + 0.1);

    setActiveKeys(prev => ({ ...prev, [note.note]: true }));
    setVelocityMap(prev => ({ ...prev, [note.note]: velSetting.label }));
    Vibration.vibrate(15);

    if (recording) {
      const elapsed = Date.now() - recordStartRef.current;
      setRecordingData(prev => [...prev, { note: note.note, time: elapsed, velocity: velGain, duration: 0 }]);
    }

    prevNoteRef.current = { note, osc, gain, startTime: now, settings };

    setTimeout(() => {
      setActiveKeys(prev => {
        const copy = { ...prev };
        delete copy[note.note];
        return copy;
      });
      setVelocityMap(prev => {
        const copy = { ...prev };
        delete copy[note.note];
        return copy;
      });
    }, sustainOn ? 2000 : (settings.attack + settings.decay + settings.release) * 1000 + 200);
  }, [getAudioContext, preset, sustainOn, recording]);

  const stopNote = useCallback((note) => {
    if (sustainOn) return;
    if (prevNoteRef.current && prevNoteRef.current.note.note === note.note) {
      const { gain, settings } = prevNoteRef.current;
      const ctx = audioCtxRef.current;
      if (ctx && gain) {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + settings.release * 0.5);
      }
    }
    setActiveKeys(prev => {
      const copy = { ...prev };
      delete copy[note.note];
      return copy;
    });
  }, [sustainOn]);

  const startRecording = useCallback(() => {
    setRecordingData([]);
    recordStartRef.current = Date.now();
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (recordingData.length > 0) {
      const rec = {
        id: Date.now(),
        preset,
        octave,
        date: new Date().toLocaleDateString(),
        notes: recordingData,
      };
      setRecordings(prev => [...prev, rec]);
    }
  }, [recordingData, preset, octave, user]);

  const playRecording = useCallback((rec) => {
    setPlayback(true);
    rec.notes.forEach(n => {
      const noteObj = NOTES.find(nn => nn.note === n.note);
      if (noteObj) {
        setTimeout(() => playNote(noteObj, n.velocity), n.time);
      }
    });
    setTimeout(() => setPlayback(false), Math.max(...rec.notes.map(n => n.time)) + 1500);
  }, [playNote]);

  const deleteRecording = useCallback((id) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  const whiteKeys = NOTES.filter(n => n.type === 'white');
  const blackKeys = NOTES.filter(n => n.type === 'black');

  const getBlackKeyLeft = (idx) => {
    const posMap = [0, 1, 3, 4, 5];
    const pianoWidth = SCREEN_WIDTH - 32;
    const wKeyW = pianoWidth / whiteKeys.length;
    return posMap[idx] * wKeyW + wKeyW * 0.65;
  };

  const handleKeyPress = useCallback((note, e) => {
    const touch = e?.nativeEvent?.locationY || 20;
    const keyHeight = 200;
    const velocity = Math.min(1, Math.max(0, (touch / keyHeight) * 1.2 + 0.2));
    playNote(note, velocity);
  }, [playNote]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#C4B5FD" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Piano</Text>
            <Text style={styles.headerSub}>{preset} | Oct {octave}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Visualizer */}
        <AudioVisualizer3D
          analyser={analyserRef.current}
          isPlaying={Object.keys(activeKeys).length > 0}
          style={styles.visualizerWrap}
        />

        {/* Octave Selector */}
        <View style={styles.octaveRow}>
          <Text style={styles.octaveLabel}>Octave</Text>
          <View style={styles.octaveButtons}>
            {OCTAVES.map(o => (
              <TouchableOpacity
                key={o}
                style={[styles.octaveBtn, selectedOctave === o && styles.octaveBtnActive]}
                onPress={() => setSelectedOctave(o)}
              >
                <Text style={[styles.octaveBtnText, selectedOctave === o && styles.octaveBtnTextActive]}>
                  {4 + o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active note display */}
        <View style={styles.noteDisplayRow}>
          {Object.keys(activeKeys).map(n => (
            <View key={n} style={styles.noteChip}>
              <Text style={styles.noteChipText}>{n}</Text>
              <Text style={styles.velLabel}>{velocityMap[n] || ''}</Text>
            </View>
          ))}
          {Object.keys(activeKeys).length === 0 && (
            <Text style={styles.hintText}>Tap a key to play</Text>
          )}
        </View>

        {/* Piano Keyboard */}
        <View style={styles.pianoWrap}>
          <Svg width={SCREEN_WIDTH - 32} height={240} style={styles.pianoSvg}>
            <Defs>
              <LinearGradient id="whiteKey" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="85%" stopColor="#F0EDE8" />
                <Stop offset="100%" stopColor="#E8E4DC" />
              </LinearGradient>
              <LinearGradient id="whiteKeyActive" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#C4B5FD" />
                <Stop offset="100%" stopColor="#7C3AED" />
              </LinearGradient>
              <LinearGradient id="blackKey" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#2D2D2D" />
                <Stop offset="70%" stopColor="#1A1A1A" />
                <Stop offset="100%" stopColor="#0D0D0D" />
              </LinearGradient>
              <LinearGradient id="blackKeyActive" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#7C3AED" />
                <Stop offset="100%" stopColor="#4C1D95" />
              </LinearGradient>
              <LinearGradient id="specularWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                <Stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
              </LinearGradient>
              <LinearGradient id="specularBlack" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <Stop offset="25%" stopColor="rgba(255,255,255,0.03)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
              </LinearGradient>
            </Defs>

            {/* White keys */}
            {whiteKeys.map((n, i) => {
              const w = (SCREEN_WIDTH - 32) / whiteKeys.length;
              const isActive = activeKeys[n.note];
              return (
                <G key={n.note} onPress={(e) => handleKeyPress(n, e)}>
                  <Rect x={i * w} y={0} width={w - 2} height={200} rx={4} fill={isActive ? 'url(#whiteKeyActive)' : 'url(#whiteKey)'} stroke="#D1CBC2" strokeWidth={0.5} />
                  <Rect x={i * w} y={0} width={w - 2} height={200} rx={4} fill="url(#specularWhite)" />
                  {isActive && (
                    <>
                      <Rect x={i * w + 2} y={185} width={w - 6} height={12} rx={6} fill="#7C3AED" opacity={0.5} />
                      <Circle cx={i * w + w / 2} cy={195} r={14} fill="#7C3AED" opacity={0.15} />
                    </>
                  )}
                  <Text
                    x={i * w + w / 2}
                    y={192}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#8B8580"
                    fontWeight="500"
                  >
                    {n.note.replace('4','').replace('5','') + (KEY_MAP[i] ? ` [${KEY_MAP[i].toUpperCase()}]` : '')}
                  </Text>
                </G>
              );
            })}

            {/* Black keys */}
            {blackKeys.map((n, i) => {
              const left = getBlackKeyLeft(i);
              const isActive = activeKeys[n.note];
              return (
                <G key={n.note} onPress={(e) => handleKeyPress(n, e)}>
                  <Rect x={left} y={0} width={((SCREEN_WIDTH - 32) / whiteKeys.length) * 0.62} height={125} rx={3} fill={isActive ? 'url(#blackKeyActive)' : 'url(#blackKey)'} stroke="#111" strokeWidth={0.5} />
                  <Rect x={left} y={0} width={((SCREEN_WIDTH - 32) / whiteKeys.length) * 0.62} height={125} rx={3} fill="url(#specularBlack)" />
                  {isActive && (
                    <>
                      <Rect x={left + 2} y={110} width={((SCREEN_WIDTH - 32) / whiteKeys.length) * 0.62 - 4} height={10} rx={5} fill="#7C3AED" opacity={0.6} />
                      <Circle cx={left + ((SCREEN_WIDTH - 32) / whiteKeys.length) * 0.31} cy={118} r={12} fill="#7C3AED" opacity={0.2} />
                    </>
                  )}
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Sustain & Reverb */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.ctrlBtn, sustainOn && styles.ctrlBtnActive]}
            onPress={() => setSustain(s => !s)}
          >
            <Ionicons name={sustainOn ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={sustainOn ? '#10B981' : '#6B7280'} />
            <Text style={[styles.ctrlBtnText, sustainOn && styles.ctrlBtnTextActive]}>Sustain</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctrlBtn, reverbOn && styles.ctrlBtnActive]}
            onPress={() => setReverb(r => !r)}
          >
            <Ionicons name={reverbOn ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={reverbOn ? '#06B6D4' : '#6B7280'} />
            <Text style={[styles.ctrlBtnText, reverbOn && styles.ctrlBtnTextActive]}>Reverb</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Selector */}
        <View style={styles.presetRow}>
          {Object.keys(PRESETS).map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.presetBtn, preset === name && styles.presetBtnActive]}
              onPress={() => setPreset(name)}
            >
              <Text style={[styles.presetBtnText, preset === name && styles.presetBtnTextActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Record / Playback */}
        <View style={styles.recordRow}>
          <TouchableOpacity
            style={[styles.recordBtn, recording && styles.recordBtnActive]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Ionicons name={recording ? 'stop' : 'radio'} size={20} color="#F43F5E" />
            <Text style={styles.recordBtnText}>{recording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recordBtn, playback && styles.recordBtnActive]}
            disabled={playback || recordings.length === 0}
            onPress={() => recordings.length > 0 && playRecording(recordings[recordings.length - 1])}
          >
            <Ionicons name="play" size={20} color="#10B981" />
            <Text style={styles.recordBtnText}>Play</Text>
          </TouchableOpacity>
        </View>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <View style={styles.recordingsSection}>
            <Text style={styles.sectionTitle}>Recordings ({recordings.length})</Text>
            {recordings.map((rec, idx) => (
              <View key={rec.id} style={styles.recordingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>#{idx + 1} - {rec.preset}</Text>
                  <Text style={styles.recSub}>{rec.date} | {rec.notes.length} notes</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F3F0FF', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#A78BFA', marginTop: 2 },
  visualizerWrap: { height: 100, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  octaveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  octaveLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  octaveButtons: { flexDirection: 'row', gap: 6 },
  octaveBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  octaveBtnActive: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7C3AED' },
  octaveBtnText: { fontSize: 13, color: '#9CA3AF', fontWeight: '700' },
  octaveBtnTextActive: { color: '#C4B5FD' },
  noteDisplayRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8, minHeight: 36, alignItems: 'center' },
  noteChip: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', borderWidth: 1, borderColor: '#7C3AED' },
  noteChipText: { fontSize: 14, fontWeight: '800', color: '#C4B5FD' },
  velLabel: { fontSize: 9, color: '#A78BFA', marginTop: 1 },
  hintText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  pianoWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0E111A', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', marginBottom: 12, paddingVertical: 8 },
  pianoSvg: { alignSelf: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 10 },
  ctrlBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  ctrlBtnActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' },
  ctrlBtnText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  ctrlBtnTextActive: { color: '#C4B5FD' },
  presetRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  presetBtnActive: { backgroundColor: 'rgba(6,182,212,0.2)', borderColor: '#06B6D4' },
  presetBtnText: { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  presetBtnTextActive: { color: '#67E8F9' },
  recordRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 14 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(30,30,50,0.6)', borderWidth: 1, borderColor: 'rgba(100,100,120,0.2)' },
  recordBtnActive: { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: '#F43F5E' },
  recordBtnText: { fontSize: 13, color: '#E5E7EB', fontWeight: '700' },
  recordingsSection: { marginTop: 4, padding: 14, borderRadius: 14, backgroundColor: 'rgba(14,17,26,0.7)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#C4B5FD', marginBottom: 8 },
  recordingItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: 'rgba(30,30,50,0.5)', marginBottom: 6, borderWidth: 1, borderColor: 'rgba(100,100,120,0.15)' },
  recTitle: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  recSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  recAction: { padding: 8, marginLeft: 8 },
});

export default PianoScreen;
