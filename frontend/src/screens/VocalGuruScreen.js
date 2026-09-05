import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const VocalGuruScreen = ({ navigation }) => {
  const [gurus, setGurus] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGurus();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchGurus = async () => {
    try {
      const res = await authFetch(api.vocalGurus);
      if (res.ok) {
        const data = await res.json();
        setGurus(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuru = (guru) => {
    setSelectedGuru(guru);
    setCurrentLesson(null);
  };

  const handleStartLesson = async (topic) => {
    if (!selectedGuru) return;
    
    try {
      const res = await authFetch(api.vocalGuruGreet(selectedGuru.id));
      if (res.ok) {
        const data = await res.json();
        setCurrentLesson({
          topic,
          message: data.message || `Welcome! Let's learn about ${topic}`,
          guru: selectedGuru,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeak = async (text) => {
    try {
      setSpeaking(true);
      const res = await authFetch(api.vocalGuruSpeak, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        // Audio playback would be handled here
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSpeaking(false);
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
            <Animated.Text style={styles.headerTitle}>Vocal Guru</Animated.Text>
            <Animated.Text style={styles.headerSubtitle}>Learn from AI music instructors</Animated.Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Guru Selection */}
        {!currentLesson && (
          <>
            <Animated.Text style={styles.sectionTitle}>Choose Your Guru</Animated.Text>
            <View style={styles.gurusGrid}>
              {gurus.map((guru) => (
                <TouchableOpacity
                  key={guru.id}
                  style={[styles.guruCard, selectedGuru?.id === guru.id && styles.guruCardSelected]}
                  onPress={() => handleSelectGuru(guru)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={selectedGuru?.id === guru.id ? COLORS.gradient.primary : [COLORS.gray100, COLORS.white]}
                    style={styles.guruGradient}
                  >
                    <View style={[styles.guruAvatar, { backgroundColor: guru.color || COLORS.primary }]}>
                      <MaterialCommunityIcons name={guru.icon || "account-music"} size={32} color={COLORS.white} />
                    </View>
                    <Animated.Text style={[styles.guruName, selectedGuru?.id === guru.id && styles.guruNameSelected]}>
                      {guru.name || 'Guru'}
                    </Animated.Text>
                    <Animated.Text style={[styles.guruStyle, selectedGuru?.id === guru.id && styles.guruStyleSelected]}>
                      {guru.style || 'Vocal Training'}
                    </Animated.Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lesson Topics */}
            {selectedGuru && (
              <Animated.View style={[styles.topicsContainer, { opacity: fadeAnim }]}>
                <Animated.Text style={styles.sectionTitle}>Choose a Topic</Animated.Text>
                {['breathing', 'pitch', 'warmup', 'scales', 'vibrato'].map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={styles.topicCard}
                    onPress={() => handleStartLesson(topic)}
                  >
                    <View style={[styles.topicIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                      <MaterialCommunityIcons name="music-note" size={24} color={COLORS.primary} />
                    </View>
                    <Animated.Text style={styles.topicTitle}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Animated.Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray400} />
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </>
        )}

        {/* Current Lesson */}
        {currentLesson && (
          <Animated.View style={[styles.lessonContainer, { opacity: fadeAnim }]}>
            {/* Lesson Header */}
            <View style={styles.lessonHeader}>
              <View style={[styles.guruAvatarLarge, { backgroundColor: currentLesson.guru.color || COLORS.primary }]}>
                <MaterialCommunityIcons name={currentLesson.guru.icon || "account-music"} size={48} color={COLORS.white} />
              </View>
              <Animated.Text style={styles.lessonGuruName}>{currentLesson.guru.name}</Animated.Text>
              <Tag label={currentLesson.topic} color={COLORS.primary} />
            </View>

            {/* Lesson Content */}
            <View style={styles.lessonCard}>
              <Animated.Text style={styles.lessonMessage}>{currentLesson.message}</Animated.Text>
              
              <View style={styles.lessonActions}>
                <GradientButton
                  title="Listen"
                  onPress={() => handleSpeak(currentLesson.message)}
                  icon="volume-high"
                  colors={COLORS.gradient.ocean}
                  loading={speaking}
                  style={styles.listenButton}
                />
                <TouchableOpacity 
                  style={styles.stopButton}
                  onPress={() => {/* Stop audio */}}
                >
                  <MaterialCommunityIcons name="stop" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Next Steps */}
            <View style={styles.nextSteps}>
              <Animated.Text style={styles.nextStepsTitle}>Next Steps</Animated.Text>
              {['Practice breathing', 'Try pitch exercises', 'Record yourself'].map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                    <Animated.Text style={styles.stepNumberText}>{index + 1}</Animated.Text>
                  </View>
                  <Animated.Text style={styles.stepText}>{step}</Animated.Text>
                </View>
              ))}
            </View>

            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backToGurusButton}
              onPress={() => setCurrentLesson(null)}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.primary} />
              <Animated.Text style={styles.backToGurusText}>Choose Another Guru</Animated.Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  gurusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  guruCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  guruCardSelected: {
    ...SHADOWS.medium,
  },
  guruGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  guruAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  guruName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  guruNameSelected: {
    color: COLORS.white,
  },
  guruStyle: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  guruStyleSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  topicsContainer: {
    marginTop: SPACING.lg,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  lessonContainer: {
    marginTop: SPACING.lg,
  },
  lessonHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  guruAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  lessonGuruName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  lessonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  lessonMessage: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.gray700,
    marginBottom: SPACING.xl,
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listenButton: {
    flex: 1,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  nextSteps: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  backToGurusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backToGurusText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  bottomPadding: {
    height: 100,
  },
});

export default VocalGuruScreen;
