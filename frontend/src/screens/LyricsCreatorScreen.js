import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { GradientButton, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STYLES = [
  { id: 'pop', label: 'Pop', color: '#FF6B6B', icon: 'music-note' },
  { id: 'rock', label: 'Rock', color: '#FF5722', icon: 'guitar' },
  { id: 'classical', label: 'Classical', color: '#9C27B0', icon: 'piano' },
  { id: 'rap', label: 'Rap', color: '#2196F3', icon: 'microphone' },
  { id: 'romantic', label: 'Romantic', color: '#E91E63', icon: 'heart' },
  { id: 'devotional', label: 'Devotional', color: '#FF9800', icon: 'church' },
];

const LyricsCreatorScreen = ({ navigation }) => {
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('pop');
  const [lyrics, setLyrics] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [visibleLines, setVisibleLines] = useState(0);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lineAnims = useRef([]).current;
  const saveScale = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const lyricsRef = useRef(null);
  const textInputRef = useRef(null);

  const lines = lyrics.split('\n');
  const wordCount = lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0;

  useEffect(() => {
    cursorBlink();
  }, []);

  useEffect(() => {
    if (lyrics) {
      const lineCount = lyrics.split('\n').length;
      lineAnims.length = 0;
      for (let i = 0; i < lineCount; i++) {
        lineAnims.push(new Animated.Value(0));
      }
      setVisibleLines(0);
      animateLines(lineCount);
    }
  }, [lyrics]);

  const cursorBlink = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateLines = (count) => {
    const animations = [];
    for (let i = 0; i < count; i++) {
      animations.push(
        Animated.delay(i * 50),
        Animated.timing(lineAnims[i], { toValue: 1, duration: 200, useNativeDriver: true })
      );
    }
    Animated.sequence(animations).start(() => setVisibleLines(count));
  };

  const startSpinner = () => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start();
  };

  const stopSpinner = () => {
    spinAnim.stopAnimation();
    spinAnim.setValue(0);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || generating) return;
    setGenerating(true);
    startSpinner();
    try {
      const res = await authFetch(api.lyricsGenerate, {
        method: 'POST',
        body: JSON.stringify({ topic, genre: selectedStyle, mood: 'happy', language: 'english' }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.lyrics
          ?.map((s) => {
            const sectionLines = s.lines?.join('\n') || '';
            return `[${s.section_name?.toUpperCase()}]\n${sectionLines}`;
          })
          .join('\n\n') || data.lyrics || data.text || '';
        setLyrics(text);
        setVisibleLines(0);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch (e) {
      console.error('Generate error:', e);
    } finally {
      stopSpinner();
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!lyrics.trim()) return;
    setSaveState('saving');
    try {
      await authFetch(api.lyricsAnalyze, {
        method: 'POST',
        body: JSON.stringify({ lyrics: lyrics.trim() }),
      });
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaveState('saved');
      Animated.spring(saveScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.spring(saveScale, { toValue: 0, friction: 4, useNativeDriver: true }).start(() => {
            setSaveState('idle');
          });
        }, 1500);
      });
    }
  };

  const handleShare = async () => {
    if (!lyrics.trim()) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: lyrics, title: `Lyrics about ${topic}` });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(lyrics);
        alert('Lyrics copied to clipboard!');
      } else {
        alert('Sharing not available on this browser.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') console.error('Share error:', e);
    }
  };

  const handleNewLyrics = () => {
    setLyrics('');
    setTopic('');
    setAnalysis(null);
    setVisibleLines(0);
    fadeAnim.setValue(0);
  };

  const spinInterpolate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const lineNumbers = lines.map((_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { background: 'linear-gradient(135deg, #9C27B0, #E91E63)' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lyrics Creator</Text>
          <TouchableOpacity style={styles.saveHeaderButton} onPress={handleSave}>
            <MaterialCommunityIcons name="content-save" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!lyrics ? (
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="pen" size={18} color={COLORS.primary} />
                <TextInput
                  ref={textInputRef}
                  style={styles.topicInput}
                  placeholder="What should the lyrics be about?"
                  placeholderTextColor={COLORS.textMuted}
                  value={topic}
                  onChangeText={setTopic}
                  multiline
                />
              </View>
            </View>

            <View style={styles.styleSection}>
              <Text style={styles.sectionLabel}>Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {STYLES.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      style={[styles.chip, isSelected && { backgroundColor: style.color }]}
                      onPress={() => setSelectedStyle(style.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={style.icon}
                        size={16}
                        color={isSelected ? COLORS.white : style.color}
                        style={styles.chipIcon}
                      />
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.generateButton, (!topic.trim() || generating) && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={!topic.trim() || generating}
              activeOpacity={0.8}
            >
              <View
                style={[styles.generateButtonGradient, { background: 'linear-gradient(135deg, #9C63FF, #E91E63)' }]}
              >
                {generating ? (
                  <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                    <MaterialCommunityIcons name="loading" size={22} color={COLORS.white} />
                  </Animated.View>
                ) : (
                  <MaterialCommunityIcons name="creation" size={22} color={COLORS.white} />
                )}
                <Text style={styles.generateButtonText}>
                  {generating ? 'Generating...' : 'Generate Lyrics'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.editorSection, { opacity: fadeAnim }]}>
            <View style={styles.editorHeader}>
              <View style={styles.editorTitleRow}>
                <MaterialCommunityIcons name="music-note" size={20} color={COLORS.primary} />
                <Text style={styles.editorTitle}>{topic || 'Untitled Lyrics'}</Text>
              </View>
              <Tag label={STYLES.find(s => s.id === selectedStyle)?.label} color={STYLES.find(s => s.id === selectedStyle)?.color} />
            </View>

            <View style={styles.editorContainer}>
              <View style={styles.lineNumberColumn}>
                {lineNumbers.map((num) => (
                  <Text key={num} style={styles.lineNumber}>{num}</Text>
                ))}
              </View>
              <View style={styles.textAreaContainer}>
                <TextInput
                  ref={lyricsRef}
                  style={styles.lyricsInput}
                  value={lyrics}
                  onChangeText={setLyrics}
                  multiline
                  textAlignVertical="top"
                  placeholder="Edit your lyrics..."
                  placeholderTextColor={COLORS.textMuted}
                  selectionColor="#9C63FF"
                  scrollEnabled={false}
                />
              </View>
            </View>

            <View style={styles.wordCountBar}>
              <MaterialCommunityIcons name="format-text" size={14} color={COLORS.textSecondary} />
              <Text style={styles.wordCountText}>{wordCount} words · {lines.length} lines</Text>
            </View>

            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                  {saveState === 'saved' && (
                    <Animated.View style={[styles.checkmarkOverlay, { transform: [{ scale: saveScale }] }]}>
                      <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
                    </Animated.View>
                  )}
                </View>
                <Text style={[styles.actionLabel, saveState === 'saved' && { color: COLORS.success }]}>
                  {saveState === 'saved' ? 'Saved!' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="share-variant" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleNewLyrics}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="refresh" size={24} color={COLORS.secondary} />
                </View>
                <Text style={styles.actionLabel}>New Lyrics</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  saveHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  inputSection: {},
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: SPACING.sm,
    minHeight: 48,
    paddingTop: 0,
  },
  styleSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  chipScroll: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    ...SHADOWS.subtle,
  },
  chipIcon: {
    marginRight: SPACING.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  generateButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 4,
    borderRadius: BORDER_RADIUS.lg,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  editorSection: {},
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  editorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  editorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    minHeight: 400,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  lineNumberColumn: {
    width: 40,
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.lg,
    alignItems: 'flex-end',
    paddingRight: SPACING.sm,
  },
  lineNumber: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  textAreaContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  lyricsInput: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.black,
    fontFamily: 'monospace',
    minHeight: 360,
    padding: 0,
  },
  wordCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  wordCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  checkmarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.success,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});

export default LyricsCreatorScreen;
