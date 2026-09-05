import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, Tag, SectionHeader } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const LyricsCreatorScreen = ({ navigation }) => {
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('pop');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [topic, setTopic] = useState('');
  const [lyrics, setLyrics] = useState(null);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('edit');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, mRes] = await Promise.all([
        authFetch(api.lyricsGenres),
        authFetch(api.lyricsMoods),
      ]);
      if (gRes.ok) setGenres(await gRes.json());
      if (mRes.ok) setMoods(await mRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setGenerating(true);
    try {
      const res = await authFetch(api.lyricsGenerate, {
        method: 'POST',
        body: JSON.stringify({ topic, genre: selectedGenre, mood: selectedMood }),
      });
      if (res.ok) {
        const data = await res.json();
        setLyrics(data);
        const text = data.lyrics?.map(s => {
          const lines = s.lines?.join('\n') || '';
          return `[${s.section_name?.toUpperCase()}]\n${lines}`;
        }).join('\n\n') || '';
        setEditedLyrics(text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!editedLyrics.trim()) return;
    
    try {
      const res = await authFetch(api.lyricsAnalyze, {
        method: 'POST',
        body: JSON.stringify({ lyrics: editedLyrics }),
      });
      if (res.ok) setAnalysis(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        {...createGradient(['#9C27B0', '#E91E63'])}
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
            <Animated.Text style={styles.headerTitle}>Lyrics Creator</Animated.Text>
            <Animated.Text style={styles.headerSubtitle}>AI-powered songwriting assistant</Animated.Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Section */}
        {!lyrics && (
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            {/* Topic Input */}
            <View style={styles.inputCard}>
              <Animated.Text style={styles.inputLabel}>What's your song about?</Animated.Text>
              <TextInput
                style={styles.topicInput}
                placeholder="e.g., love, summer, freedom..."
                placeholderTextColor={COLORS.gray400}
                value={topic}
                onChangeText={setTopic}
                multiline
              />
            </View>

            {/* Genre Selection */}
            <View style={styles.selectionCard}>
              <Animated.Text style={styles.selectionLabel}>Genre</Animated.Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.chip, selectedGenre === genre.id && styles.chipSelected]}
                    onPress={() => setSelectedGenre(genre.id)}
                  >
                    <Animated.Text style={[styles.chipText, selectedGenre === genre.id && styles.chipTextSelected]}>
                      {genre.name}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mood Selection */}
            <View style={styles.selectionCard}>
              <Animated.Text style={styles.selectionLabel}>Mood</Animated.Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[styles.chip, selectedMood === mood.id && styles.chipSelected]}
                    onPress={() => setSelectedMood(mood.id)}
                  >
                    <Animated.Text style={styles.chipEmoji}>{mood.emoji}</Animated.Text>
                    <Animated.Text style={[styles.chipText, selectedMood === mood.id && styles.chipTextSelected]}>
                      {mood.name}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Generate Button */}
            <GradientButton
              title="Generate Lyrics"
              onPress={handleGenerate}
              loading={generating}
              disabled={!topic.trim()}
              icon="creation"
              colors={['#9C27B0', '#E91E63']}
              style={styles.generateButton}
            />
          </Animated.View>
        )}

        {/* Lyrics Editor */}
        {lyrics && (
          <Animated.View style={[styles.editorSection, { opacity: fadeAnim }]}>
            {/* Title & Meta */}
            <View style={styles.titleCard}>
              <Animated.Text style={styles.lyricsTitle}>{lyrics.title || 'Untitled'}</Animated.Text>
              <View style={styles.metaRow}>
                <Tag label={lyrics.genre} color={COLORS.primary} />
                <Tag label={lyrics.mood} color={COLORS.secondary} />
                {lyrics.suggested_tempo && <Tag label={`${lyrics.suggested_tempo} BPM`} />}
                {lyrics.suggested_key && <Tag label={lyrics.suggested_key} variant="light" />}
              </View>
            </View>

            {/* View Mode Tabs */}
            <View style={styles.viewTabs}>
              {['edit', 'preview', 'analysis'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.viewTab, viewMode === mode && styles.viewTabSelected]}
                  onPress={() => {
                    setViewMode(mode);
                    if (mode === 'analysis') handleAnalyze();
                  }}
                >
                  <MaterialCommunityIcons 
                    name={mode === 'edit' ? 'pencil' : mode === 'preview' ? 'eye' : 'chart-bar'} 
                    size={16} 
                    color={viewMode === mode ? COLORS.white : COLORS.gray500} 
                  />
                  <Animated.Text style={[styles.viewTabText, viewMode === mode && styles.viewTabTextSelected]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Animated.Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Edit Mode */}
            {viewMode === 'edit' && (
              <TextInput
                style={styles.lyricsEditor}
                value={editedLyrics}
                onChangeText={setEditedLyrics}
                multiline
                textAlignVertical="top"
                placeholder="Edit your lyrics here..."
                placeholderTextColor={COLORS.gray400}
              />
            )}

            {/* Preview Mode */}
            {viewMode === 'preview' && (
              <View style={styles.previewContainer}>
                {lyrics.lyrics?.map((section, i) => (
                  <View key={i} style={styles.sectionPreview}>
                    <Animated.Text style={styles.sectionName}>{section.section_name?.toUpperCase()}</Animated.Text>
                    {section.lines?.map((line, j) => (
                      <Animated.Text key={j} style={styles.lyricLine}>{line}</Animated.Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Analysis Mode */}
            {viewMode === 'analysis' && analysis && (
              <View style={styles.analysisContainer}>
                <View style={styles.statsGrid}>
                  {[
                    { label: 'Words', value: analysis.word_count, icon: 'format-text' },
                    { label: 'Lines', value: analysis.line_count, icon: 'format-list-bulleted' },
                    { label: 'Avg Words/Line', value: analysis.avg_words_per_line, icon: 'chart-line' },
                    { label: 'Unique Words', value: analysis.unique_words, icon: 'database' },
                  ].map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                      <MaterialCommunityIcons name={stat.icon} size={20} color={COLORS.primary} />
                      <Animated.Text style={styles.statValue}>{stat.value}</Animated.Text>
                      <Animated.Text style={styles.statLabel}>{stat.label}</Animated.Text>
                    </View>
                  ))}
                </View>

                {/* Sentiment */}
                <View style={styles.sentimentCard}>
                  <Animated.Text style={styles.sentimentLabel}>Sentiment</Animated.Text>
                  <Animated.Text style={[
                    styles.sentimentValue,
                    { color: analysis.sentiment === 'positive' ? COLORS.success : analysis.sentiment === 'negative' ? COLORS.error : COLORS.warning }
                  ]}>
                    {analysis.sentiment?.toUpperCase()}
                  </Animated.Text>
                  <Animated.Text style={styles.sentimentDetail}>
                    {analysis.positive_words} positive / {analysis.negative_words} negative words
                  </Animated.Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {[
                { title: 'More Emotional', icon: 'heart', instruction: 'make it more emotional' },
                { title: 'Better Rhymes', icon: 'rhombus', instruction: 'improve the rhyme scheme' },
                { title: 'More Poetic', icon: 'format-text', instruction: 'make it more poetic' },
              ].map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionButton}
                  onPress={() => {/* Improve lyrics */}}
                >
                  <MaterialCommunityIcons name={action.icon} size={20} color={COLORS.primary} />
                  <Animated.Text style={styles.actionButtonText}>{action.title}</Animated.Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start Over */}
            <TouchableOpacity 
              style={styles.startOverButton}
              onPress={() => { setLyrics(null); setEditedLyrics(''); setAnalysis(null); }}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
              <Animated.Text style={styles.startOverText}>Start Over</Animated.Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputSection: {},
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  topicInput: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: 16,
    minHeight: 80,
    color: COLORS.black,
  },
  selectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  generateButton: {
    marginTop: SPACING.sm,
  },
  editorSection: {},
  titleCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  lyricsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  viewTabSelected: {
    backgroundColor: COLORS.primary,
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    marginLeft: SPACING.xs,
  },
  viewTabTextSelected: {
    color: COLORS.white,
  },
  lyricsEditor: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 400,
    color: COLORS.black,
    fontFamily: 'monospace',
    ...SHADOWS.small,
  },
  previewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    minHeight: 400,
    ...SHADOWS.small,
  },
  sectionPreview: {
    marginBottom: SPACING.xl,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  lyricLine: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.gray700,
    marginBottom: 2,
  },
  analysisContainer: {},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  sentimentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  sentimentLabel: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  sentimentValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  sentimentDetail: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  startOverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  startOverText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  bottomPadding: {
    height: 100,
  },
});

export default LyricsCreatorScreen;
