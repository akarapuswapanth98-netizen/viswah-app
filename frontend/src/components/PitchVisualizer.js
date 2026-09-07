import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

const NOTE_NAMES_WESTERN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_SARGAM = ['Sa', 'Re♭', 'Re', 'Ga♭', 'Ga', 'Ma', 'Ma♯', 'Pa', 'Dha♭', 'Dha', 'Ni♭', 'Ni'];

const PitchVisualizer = ({
  currentPitch = 0,
  targetNote = null,
  targetFreq = 0,
  isRecording = false,
  showSargam = false,
  centsDeviation = 0,
  width = 300,
  height = 200,
}) => {
  const graphRef = useRef(null);
  const pitchHistoryRef = useRef([]);
  const canvasWidth = width;
  const canvasHeight = height;
  const maxHistory = Math.floor(canvasWidth / 2);

  useEffect(() => {
    if (isRecording && currentPitch > 0) {
      pitchHistoryRef.current = [...pitchHistoryRef.current.slice(-maxHistory + 1), currentPitch];
    }
  }, [currentPitch, isRecording, maxHistory]);

  const getNoteFromFreq = (freq) => {
    if (freq <= 0) return { note: '--', octave: '', cents: 0 };
    const noteNum = 12 * (Math.log2(freq / 440)) + 69;
    const noteIdx = Math.round(noteNum) % 12;
    const octave = Math.floor(Math.round(noteNum) / 12) - 1;
    const cents = Math.round((noteNum - Math.round(noteNum)) * 100);
    return {
      note: NOTE_NAMES_WESTERN[noteIdx < 0 ? noteIdx + 12 : noteIdx],
      sargam: NOTE_NAMES_SARGAM[noteIdx < 0 ? noteIdx + 12 : noteIdx],
      octave,
      cents,
    };
  };

  const currentNote = getNoteFromFreq(currentPitch);
  const targetNoteInfo = targetFreq > 0 ? getNoteFromFreq(targetFreq) : null;

  const centsBarWidth = Math.min(100, Math.abs(centsDeviation));
  const centsDirection = centsDeviation > 0 ? 'sharp' : centsDeviation < 0 ? 'flat' : 'in-tune';
  const centsColor = Math.abs(centsDeviation) <= 10 ? COLORS.success : Math.abs(centsDeviation) <= 30 ? COLORS.warning : COLORS.error;

  const history = pitchHistoryRef.current;
  const minFreq = history.length > 0 ? Math.min(...history) * 0.8 : 100;
  const maxFreq = history.length > 0 ? Math.max(...history) * 1.2 : 1000;

  return (
    <View style={[styles.container, { width: canvasWidth }]}>
      {/* Current Note Display */}
      <View style={styles.noteDisplay}>
        <View style={styles.noteMain}>
          <Text style={styles.noteName}>{showSargam ? currentNote.sargam : currentNote.note}</Text>
          {currentNote.octave !== undefined && (
            <Text style={styles.noteOctave}>{currentNote.octave}</Text>
          )}
        </View>
        {targetNoteInfo && (
          <View style={styles.targetNote}>
            <Text style={styles.targetLabel}>Target</Text>
            <Text style={styles.targetValue}>{showSargam ? targetNoteInfo.sargam : targetNoteInfo.note}{targetNoteInfo.octave}</Text>
          </View>
        )}
      </View>

      {/* Cents Deviation Bar */}
      <View style={styles.centsContainer}>
        <Text style={[styles.centsLabel, { color: COLORS.textMuted }]}>-50</Text>
        <View style={styles.centsBarBg}>
          <View style={styles.centsBarCenter} />
          {centsDirection !== 'in-tune' && (
            <View
              style={[
                styles.centsBarFill,
                {
                  width: `${centsBarWidth}%`,
                  backgroundColor: centsColor,
                  [centsDirection === 'sharp' ? 'right' : 'left']: '50%',
                },
              ]}
            />
          )}
          {centsDirection === 'in-tune' && <View style={styles.centsBarInTune} />}
        </View>
        <Text style={[styles.centsLabel, { color: COLORS.textMuted }]}>+50</Text>
      </View>
      <Text style={[styles.centsValue, { color: centsColor }]}>
        {centsDeviation > 0 ? '+' : ''}{centsDeviation} cents
        {centsDirection === 'sharp' ? ' (sharp)' : centsDirection === 'flat' ? ' (flat)' : ' (in tune)'}
      </Text>

      {/* Pitch Graph */}
      <View style={[styles.graphContainer, { width: canvasWidth, height: canvasHeight }]} ref={graphRef}>
        {Platform.OS === 'web' ? (
          <svg width={canvasWidth} height={canvasHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line key={ratio} x1={0} y1={canvasHeight * ratio} x2={canvasWidth} y2={canvasHeight * ratio}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            ))}
            {/* Target note line */}
            {targetFreq > 0 && (
              <line
                x1={0}
                y1={canvasHeight - ((targetFreq - minFreq) / (maxFreq - minFreq || 1)) * canvasHeight}
                x2={canvasWidth}
                y2={canvasHeight - ((targetFreq - minFreq) / (maxFreq - minFreq || 1)) * canvasHeight}
                stroke={COLORS.success}
                strokeWidth={2}
                strokeDasharray="6,4"
                opacity={0.6}
              />
            )}
            {/* Pitch history line */}
            {history.length > 1 && (
              <polyline
                points={history.map((f, i) =>
                  `${(i / maxHistory) * canvasWidth},${canvasHeight - ((f - minFreq) / (maxFreq - minFreq || 1)) * canvasHeight}`
                ).join(' ')}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Current pitch dot */}
            {currentPitch > 0 && history.length > 0 && (
              <circle
                cx={((history.length - 1) / maxHistory) * canvasWidth}
                cy={canvasHeight - ((currentPitch - minFreq) / (maxFreq - minFreq || 1)) * canvasHeight}
                r={5}
                fill={COLORS.primary}
                stroke={COLORS.white}
                strokeWidth={2}
              />
            )}
            {/* Note labels on left */}
            {history.length > 0 && (() => {
              const uniqueNotes = [...new Set(history.map(f => getNoteFromFreq(f).note))];
              return uniqueNotes.slice(0, 5).map((note, i) => {
                const freq = history.find(f => getNoteFromFreq(f).note === note);
                const y = canvasHeight - ((freq - minFreq) / (maxFreq - minFreq || 1)) * canvasHeight;
                return (
                  <text key={note} x={4} y={Math.max(12, Math.min(canvasHeight - 4, y + 4))}
                    fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="monospace">
                    {note}
                  </text>
                );
              });
            })()}
          </svg>
        ) : (
          <View style={styles.graphFallback}>
            <Text style={styles.graphFallbackText}>Pitch graph (web only)</Text>
          </View>
        )}

        {!isRecording && history.length === 0 && (
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>Start singing to see pitch graph</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  noteDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 12 },
  noteMain: { flexDirection: 'row', alignItems: 'baseline' },
  noteName: { fontSize: 48, fontWeight: '800', color: COLORS.white },
  noteOctave: { fontSize: 24, fontWeight: '600', color: COLORS.textSecondary, marginLeft: 4 },
  targetNote: { alignItems: 'center' },
  targetLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1 },
  targetValue: { fontSize: 20, fontWeight: '700', color: COLORS.success },
  centsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginBottom: 4 },
  centsLabel: { fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },
  centsBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' },
  centsBarCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: -1 },
  centsBarFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },
  centsBarInTune: { position: 'absolute', left: '48%', right: '48%', top: 0, bottom: 0, borderRadius: 4, backgroundColor: COLORS.success },
  centsValue: { fontSize: 12, fontWeight: '600', marginBottom: 12, fontVariant: ['tabular-nums'] },
  graphContainer: { borderRadius: BORDER_RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' },
  graphFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  graphFallbackText: { color: COLORS.textMuted, fontSize: 12 },
  graphPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  graphPlaceholderText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
});

export default PitchVisualizer;
