import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { audioService } from '../services/AudioService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIME_SIGNATURES = [
  { id: '4/4', label: '4/4', beats: 4, noteValue: 4 },
  { id: '3/4', label: '3/4', beats: 3, noteValue: 4 },
  { id: '2/4', label: '2/4', beats: 2, noteValue: 4 },
  { id: '6/8', label: '6/8', beats: 6, noteValue: 8 },
  { id: '5/4', label: '5/4', beats: 5, noteValue: 4 },
  { id: '7/8', label: '7/8', beats: 7, noteValue: 8 },
];

const INDIAN_TALAS = [
  { id: 'teentaal', name: 'Teentaal', beats: 16, divisions: 4, bols: ['Dha','Dhin','Dhin','Dha','Dha','Dhin','Dhin','Dha','Dha','Tin','Tin','Tat','Ta','Dhin','Dhin','Dha'], claps: [0, 4, 8, 12], khali: [12] },
  { id: 'jhaptaal', name: 'Jhaptaal', beats: 10, divisions: 5, bols: ['Dhi','Dhi','Dhi','Dhi','Dhi','Tin','Ta','Ta','Dhi','Dhi'], claps: [0, 2, 4, 6], khali: [8] },
  { id: 'rupak', name: 'Rupak', beats: 7, divisions: 3, bols: ['Tin','Ta','Ka','Dhi','Na','Dhi','Na'], claps: [0, 3], khali: [5] },
  { id: 'ektaal', name: 'Ektaal', beats: 12, divisions: 6, bols: ['Dhin','Dhin','DhaGe','TiRaKi','Ta','Dhi','Dhom','Ge','TiRaKi','Ta','Dhi','Dha'], claps: [0, 4, 8], khali: [2, 6, 10] },
  { id: 'jherwa', name: 'Jherwa', beats: 8, divisions: 4, bols: ['Dha','Dhin','Dha','Dhin','Dha','Tin','Ta','Ta'], claps: [0, 2, 6], khali: [4] },
  { id: 'dadera', name: 'Dadra', beats: 6, divisions: 2, bols: ['Dha','Dhi','Na','Dha','Ti','Na'], claps: [0], khali: [3] },
];

const SUBDIVISIONS = [
  { id: 'none', label: 'None', multiplier: 1 },
  { id: 'half', label: '1/2', multiplier: 2 },
  { id: 'third', label: '1/3', multiplier: 3 },
  { id: 'quarter', label: '1/4', multiplier: 4 },
];

const MetronomeScreen = ({ navigation }) => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[0]);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [subdivision, setSubdivision] = useState(SUBDIVISIONS[0]);
  const [mode, setMode] = useState('western');
  const [selectedTala, setSelectedTala] = useState(INDIAN_TALAS[0]);
  const [tapTimes, setTapTimes] = useState([]);
  const [showTalas, setShowTalas] = useState(false);

  const beatAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const beatCountRef = useRef(0);

  const totalBeats = mode === 'indian' ? selectedTala.beats : timeSignature.beats;

  const playClick = useCallback((isAccent) => {
    const ctx = audioService.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(isAccent ? 1000 : 700, now);
    osc.type = 'sine';
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  }, []);

  const playIndianBol = useCallback((bol) => {
    const ctx = audioService.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const isSam = bol === 'Dha' || bol === 'Dhin';
    osc.frequency.setValueAtTime(isSam ? 900 : 600, now);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(isSam ? 0.5 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  }, []);

  const startMetronome = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const msPerBeat = (60 / bpm) * 1000;
    beatCountRef.current = 0;
    setCurrentBeat(0);
    setIsPlaying(true);

    intervalRef.current = setInterval(() => {
      const beat = beatCountRef.current % totalBeats;
      setCurrentBeat(beat);

      Animated.sequence([
        Animated.timing(beatAnim, { toValue: 1.3, duration: 50, useNativeDriver: true }),
        Animated.timing(beatAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      if (mode === 'indian') {
        const tala = selectedTala;
        const isAccent = tala.claps.includes(beat);
        const isKhali = tala.khali.includes(beat);
        playIndianBol(tala.bols[beat]);
      } else {
        playClick(beat === 0);
      }

      beatCountRef.current++;
    }, msPerBeat);
  }, [bpm, totalBeats, mode, selectedTala, playClick, playIndianBol, beatAnim]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentBeat(-1);
    beatCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, totalBeats, mode, selectedTala]);

  const handleTapTempo = () => {
    const now = Date.now();
    const newTimes = [...tapTimes, now].slice(-6);
    setTapTimes(newTimes);
    if (newTimes.length >= 2) {
      const diffs = [];
      for (let i = 1; i < newTimes.length; i++) diffs.push(newTimes[i] - newTimes[i - 1]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const newBpm = Math.round(60000 / avg);
      if (newBpm >= 20 && newBpm <= 300) setBpm(newBpm);
    }
  };

  const tala = selectedTala;
  const accentBeats = mode === 'indian' ? tala.claps : [0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Metronome</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'western' && styles.modeBtnActive]}
            onPress={() => setMode('western')}
          >
            <MaterialCommunityIcons name="music" size={18} color={mode === 'western' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.modeBtnText, mode === 'western' && styles.modeBtnTextActive]}>Western</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'indian' && styles.modeBtnActive]}
            onPress={() => setMode('indian')}
          >
            <MaterialCommunityIcons name="sitar" size={18} color={mode === 'indian' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.modeBtnText, mode === 'indian' && styles.modeBtnTextActive]}>Indian Tala</Text>
          </TouchableOpacity>
        </View>

        {/* BPM Display */}
        <View style={styles.bpmContainer}>
          <Text style={styles.bpmLabel}>BPM</Text>
          <View style={styles.bpmControl}>
            <TouchableOpacity style={styles.bpmBtn} onPress={() => setBpm(Math.max(20, bpm - 5))}>
              <MaterialCommunityIcons name="minus" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bpmValueWrap} onPress={handleTapTempo} activeOpacity={0.7}>
              <Text style={styles.bpmValue}>{bpm}</Text>
              <Text style={styles.tapLabel}>TAP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bpmBtn} onPress={() => setBpm(Math.min(300, bpm + 5))}>
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Beat Indicator */}
        <View style={styles.beatIndicator}>
          {Array.from({ length: totalBeats }).map((_, i) => {
            const isAccent = accentBeats.includes(i);
            const isCurrent = i === currentBeat;
            const isKhali = mode === 'indian' && tala.khali?.includes(i);
            return (
              <View key={i} style={styles.beatColumn}>
                <Animated.View
                  style={[
                    styles.beatDot,
                    isCurrent && { transform: [{ scale: beatAnim }], backgroundColor: isAccent ? COLORS.warning : COLORS.primary },
                    isAccent && !isCurrent && styles.beatDotAccent,
                    isKhali && styles.beatDotKhali,
                  ]}
                />
                {mode === 'indian' && (
                  <Text style={[styles.bolText, isCurrent && styles.bolTextActive]}>
                    {tala.bols[i]}
                  </Text>
                )}
                <Text style={[styles.beatNumber, isCurrent && styles.beatNumberActive]}>{i + 1}</Text>
              </View>
            );
          })}
        </View>

        {/* Time Signature / Tala Selector */}
        {mode === 'western' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Signature</Text>
            <View style={styles.sigGrid}>
              {TIME_SIGNATURES.map((sig) => (
                <TouchableOpacity
                  key={sig.id}
                  style={[styles.sigBtn, timeSignature.id === sig.id && styles.sigBtnActive]}
                  onPress={() => setTimeSignature(sig)}
                >
                  <Text style={[styles.sigText, timeSignature.id === sig.id && styles.sigTextActive]}>{sig.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tala</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.talaScroll}>
              {INDIAN_TALAS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.talaBtn, selectedTala.id === t.id && styles.talaBtnActive]}
                  onPress={() => setSelectedTala(t)}
                >
                  <Text style={[styles.talaBtnName, selectedTala.id === t.id && styles.talaBtnNameActive]}>{t.name}</Text>
                  <Text style={[styles.talaBtnBeats, selectedTala.id === t.id && styles.talaBtnBeatsActive]}>{t.beats} beats</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Subdivision */}
        {mode === 'western' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subdivision</Text>
            <View style={styles.sigGrid}>
              {SUBDIVISIONS.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.sigBtn, subdivision.id === sub.id && styles.sigBtnActive]}
                  onPress={() => setSubdivision(sub)}
                >
                  <Text style={[styles.sigText, subdivision.id === sub.id && styles.sigTextActive]}>{sub.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Play/Stop Button */}
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          onPress={isPlaying ? stopMetronome : startMetronome}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isPlaying ? 'stop' : 'play'}
            size={40}
            color={COLORS.white}
          />
        </TouchableOpacity>

        {/* Tala Info (Indian mode) */}
        {mode === 'indian' && (
          <View style={styles.talaInfoCard}>
            <Text style={styles.talaInfoName}>{tala.name}</Text>
            <Text style={styles.talaInfoDetail}>{tala.beats} matras | {tala.divisions} vibhags</Text>
            <Text style={styles.talaInfoDesc}>
              Clap positions: {tala.claps.map(c => c + 1).join(', ')}
              {tala.khali?.length ? ` | Khali: ${tala.khali.map(k => k + 1).join(', ')}` : ''}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 20 },
  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: 4, marginTop: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: BORDER_RADIUS.md, gap: 6 },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.white },
  bpmContainer: { alignItems: 'center', marginTop: 30 },
  bpmLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 2, marginBottom: 8 },
  bpmControl: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  bpmBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  bpmValueWrap: { alignItems: 'center', justifyContent: 'center' },
  bpmValue: { fontSize: 64, fontWeight: '800', color: COLORS.white, fontVariant: ['tabular-nums'] },
  tapLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 2, marginTop: -4 },
  beatIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginTop: 30, gap: 6, flexWrap: 'wrap' },
  beatColumn: { alignItems: 'center', gap: 4 },
  beatDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.surfaceBorder },
  beatDotAccent: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: COLORS.warning },
  beatDotKhali: { backgroundColor: 'rgba(100, 116, 139, 0.2)', borderColor: COLORS.textMuted },
  bolText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, maxWidth: 40, textAlign: 'center' },
  bolTextActive: { color: COLORS.warning },
  beatNumber: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  beatNumberActive: { color: COLORS.primary },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 },
  sigGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  sigBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  sigBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sigText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  sigTextActive: { color: COLORS.white },
  talaScroll: { marginLeft: -20, paddingLeft: 20 },
  talaBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginRight: 10, minWidth: 100, alignItems: 'center' },
  talaBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  talaBtnName: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  talaBtnNameActive: { color: COLORS.white },
  talaBtnBeats: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  talaBtnBeatsActive: { color: 'rgba(255,255,255,0.7)' },
  playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30, ...SHADOWS.primary },
  playBtnActive: { backgroundColor: COLORS.error },
  talaInfoCard: { marginTop: 20, padding: 16, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  talaInfoName: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  talaInfoDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  talaInfoDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, lineHeight: 18 },
});

export default MetronomeScreen;
