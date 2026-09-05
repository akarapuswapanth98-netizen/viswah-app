import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [gRes, mRes] = await Promise.all([
        authFetch(api.lyricsGenres),
        authFetch(api.lyricsMoods),
      ]);
      const gData = gRes.ok ? await gRes.json() : [];
      const mData = mRes.ok ? await mRes.json() : [];
      setGenres(Array.isArray(gData) && gData.length > 0 ? gData : [
        { id: 'pop', name: 'Pop', description: 'Catchy and upbeat' },
        { id: 'rock', name: 'Rock', description: 'Powerful and energetic' },
        { id: 'ballad', name: 'Ballad', description: 'Emotional and slow' },
      ]);
      setMoods(Array.isArray(mData) && mData.length > 0 ? mData : [
        { id: 'happy', name: 'Happy', emoji: '😊' },
        { id: 'sad', name: 'Sad', emoji: '😢' },
        { id: 'romantic', name: 'Romantic', emoji: '❤️' },
      ]);
    } catch (e) {
      setGenres([{ id: 'pop', name: 'Pop' }, { id: 'rock', name: 'Rock' }, { id: 'ballad', name: 'Ballad' }]);
      setMoods([{ id: 'happy', name: 'Happy', emoji: '😊' }, { id: 'sad', name: 'Sad', emoji: '😢' }]);
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }
    setGenerating(true);
    try {
      const res = await authFetch(api.lyricsGenerate, {
        method: 'POST',
        body: JSON.stringify({ topic, genre: selectedGenre, mood: selectedMood }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setLyrics(data);
      // Convert to editable text
      const text = data.lyrics?.map(s => {
        const lines = s.lines?.join('\n') || '';
        return `[${s.section_name?.toUpperCase()}]\n${lines}`;
      }).join('\n\n') || '';
      setEditedLyrics(text);
    } catch (e) {
      Alert.alert('Error', 'Could not generate lyrics');
    } finally { setGenerating(false); }
  };

  const handleAnalyze = async () => {
    if (!editedLyrics.trim()) {
      Alert.alert('Error', 'No lyrics to analyze');
      return;
    }
    try {
      const res = await authFetch(api.lyricsAnalyze, {
        method: 'POST',
        body: JSON.stringify({ lyrics: editedLyrics }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      Alert.alert('Error', 'Could not analyze lyrics');
    }
  };

  const handleImprove = async (instruction) => {
    if (!editedLyrics.trim()) {
      Alert.alert('Error', 'No lyrics to improve');
      return;
    }
    try {
      const res = await authFetch(api.lyricsImprove, {
        method: 'POST',
        body: JSON.stringify({ lyrics: editedLyrics, instruction }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.improved_lyrics) {
        setEditedLyrics(data.improved_lyrics);
        Alert.alert('Improved!', data.changes_made?.join('\n') || 'Lyrics improved');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not improve lyrics');
    }
  };

  if (loading) return <View style={styles.loading}><Paragraph>Loading...</Paragraph></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Lyrics Creator</Title>
        <Paragraph style={styles.headerSub}>AI-powered songwriting assistant</Paragraph>
      </View>

      <ScrollView style={styles.content}>
        {/* Input Section */}
        {!lyrics && (
          <>
            <Card style={styles.inputCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>What's your song about?</Title>
                <TextInput
                  style={styles.topicInput}
                  placeholder="e.g., love, summer, freedom..."
                  value={topic}
                  onChangeText={setTopic}
                  multiline
                />

                <Title style={styles.sectionTitle}>Genre</Title>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {genres.map(g => (
                    <Chip
                      key={g.id}
                      selected={selectedGenre === g.id}
                      onPress={() => setSelectedGenre(g.id)}
                      style={[styles.chip, selectedGenre === g.id && styles.chipSelected]}
                    >
                      {g.name}
                    </Chip>
                  ))}
                </ScrollView>

                <Title style={styles.sectionTitle}>Mood</Title>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {moods.map(m => (
                    <Chip
                      key={m.id}
                      selected={selectedMood === m.id}
                      onPress={() => setSelectedMood(m.id)}
                      style={[styles.chip, selectedMood === m.id && styles.chipSelected]}
                    >
                      {m.emoji} {m.name}
                    </Chip>
                  ))}
                </ScrollView>

                <Button
                  mode="contained"
                  icon="music-note-plus"
                  onPress={handleGenerate}
                  loading={generating}
                  disabled={generating || !topic.trim()}
                  style={styles.generateBtn}
                >
                  {generating ? 'Generating...' : 'Generate Lyrics'}
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        {/* Lyrics Editor */}
        {lyrics && (
          <>
            <Card style={styles.editorCard}>
              <Card.Content>
                <View style={styles.editorHeader}>
                  <Title style={styles.lyricsTitle}>{lyrics.title || 'Untitled'}</Title>
                  <View style={styles.viewModes}>
                    <Chip icon="pencil" selected={viewMode === 'edit'} onPress={() => setViewMode('edit')} style={styles.modeChip}>Edit</Chip>
                    <Chip icon="eye" selected={viewMode === 'preview'} onPress={() => setViewMode('preview')} style={styles.modeChip}>Preview</Chip>
                    <Chip icon="chart-bar" selected={viewMode === 'analysis'} onPress={() => { setViewMode('analysis'); handleAnalyze(); }} style={styles.modeChip}>Stats</Chip>
                  </View>
                </View>

                <View style={styles.metaInfo}>
                  <Chip style={styles.metaChip}>{lyrics.genre}</Chip>
                  <Chip style={styles.metaChip}>{lyrics.mood}</Chip>
                  {lyrics.suggested_tempo && <Chip style={styles.metaChip}>{lyrics.suggested_tempo} BPM</Chip>}
                  {lyrics.suggested_key && <Chip style={styles.metaChip}>{lyrics.suggested_key}</Chip>}
                </View>

                {viewMode === 'edit' && (
                  <TextInput
                    style={styles.lyricsEditor}
                    value={editedLyrics}
                    onChangeText={setEditedLyrics}
                    multiline
                    textAlignVertical="top"
                    placeholder="Edit your lyrics here..."
                  />
                )}

                {viewMode === 'preview' && (
                  <View style={styles.previewContainer}>
                    {lyrics.lyrics?.map((section, i) => (
                      <View key={i} style={styles.sectionPreview}>
                        <Title style={styles.sectionName}>{section.section_name?.toUpperCase()}</Title>
                        {section.lines?.map((line, j) => (
                          <Paragraph key={j} style={styles.lyricLine}>{line}</Paragraph>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {viewMode === 'analysis' && analysis && (
                  <View style={styles.analysisContainer}>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Title style={styles.statNum}>{analysis.word_count}</Title>
                        <Paragraph style={styles.statLabel}>Words</Paragraph>
                      </View>
                      <View style={styles.statBox}>
                        <Title style={styles.statNum}>{analysis.line_count}</Title>
                        <Paragraph style={styles.statLabel}>Lines</Paragraph>
                      </View>
                      <View style={styles.statBox}>
                        <Title style={styles.statNum}>{analysis.avg_words_per_line}</Title>
                        <Paragraph style={styles.statLabel}>Avg Words/Line</Paragraph>
                      </View>
                      <View style={styles.statBox}>
                        <Title style={styles.statNum}>{analysis.unique_words}</Title>
                        <Paragraph style={styles.statLabel}>Unique Words</Paragraph>
                      </View>
                    </View>
                    <Card style={styles.sentimentCard}>
                      <Card.Content>
                        <Paragraph style={styles.sentimentLabel}>Sentiment:</Paragraph>
                        <Title style={[styles.sentimentValue, {color: analysis.sentiment === 'positive' ? '#4CAF50' : analysis.sentiment === 'negative' ? '#F44336' : '#FF9800'}]}>
                          {analysis.sentiment?.toUpperCase()}
                        </Title>
                        <Paragraph style={styles.sentimentDetail}>
                          {analysis.positive_words} positive / {analysis.negative_words} negative words
                        </Paragraph>
                      </Card.Content>
                    </Card>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Action Buttons */}
            <Card style={styles.actionsCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Actions</Title>
                <View style={styles.actionGrid}>
                  <Button mode="outlined" icon="auto-fix-high" onPress={() => handleImprove('make it more emotional')} style={styles.actionBtn}>
                    More Emotional
                  </Button>
                  <Button mode="outlined" icon="rhombus" onPress={() => handleImprove('improve the rhyme scheme')} style={styles.actionBtn}>
                    Better Rhymes
                  </Button>
                  <Button mode="outlined" icon="format-text" onPress={() => handleImprove('make it more poetic')} style={styles.actionBtn}>
                    More Poetic
                  </Button>
                  <Button mode="outlined" icon="refresh" onPress={() => { setLyrics(null); setEditedLyrics(''); setAnalysis(null); }} style={styles.actionBtn}>
                    Start Over
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#FF5722' },
  headerTitle: { color: 'white', fontSize: 24 },
  headerSub: { color: 'white', opacity: 0.8 },
  content: { flex: 1, padding: 16 },
  inputCard: { marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, marginTop: 12, marginBottom: 8 },
  topicInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 60, backgroundColor: 'white' },
  chipScroll: { marginBottom: 8 },
  chip: { marginRight: 8 },
  chipSelected: { backgroundColor: '#FF5722' },
  generateBtn: { marginTop: 16 },
  editorCard: { marginBottom: 16, elevation: 2 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  lyricsTitle: { fontSize: 18, flex: 1 },
  viewModes: { flexDirection: 'row', marginTop: 4 },
  modeChip: { marginRight: 4 },
  metaInfo: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  metaChip: { marginRight: 4, marginBottom: 4 },
  lyricsEditor: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 300, backgroundColor: '#fafafa', fontFamily: 'monospace' },
  previewContainer: { minHeight: 300 },
  sectionPreview: { marginBottom: 16 },
  sectionName: { color: '#FF5722', fontSize: 14, marginBottom: 4 },
  lyricLine: { fontSize: 16, lineHeight: 24, marginBottom: 2 },
  analysisContainer: { marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '48%', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  statNum: { fontSize: 24, color: '#FF5722' },
  statLabel: { fontSize: 12, color: '#666' },
  sentimentCard: { marginTop: 8 },
  sentimentLabel: { fontSize: 14, color: '#666' },
  sentimentValue: { fontSize: 20, marginTop: 4 },
  sentimentDetail: { fontSize: 12, color: '#999', marginTop: 4 },
  actionsCard: { marginBottom: 16, elevation: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', marginBottom: 8 },
});

export default LyricsCreatorScreen;