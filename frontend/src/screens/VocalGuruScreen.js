import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, Tag } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GURU_DATA = [
  {
    id: 'classical',
    name: 'Pandit Ravi',
    initials: 'PR',
    style: 'Classical',
    color: '#FF9800',
    gradient: ['#FF9800', '#F57C00'],
    specialties: ['Alaap', 'Taan', 'Raga'],
  },
  {
    id: 'contemporary',
    name: 'Maya Singh',
    initials: 'MS',
    style: 'Contemporary',
    color: '#E91E63',
    gradient: ['#E91E63', '#C2185B'],
    specialties: ['Pop Vocals', 'Harmony', 'Falsetto'],
  },
  {
    id: 'carnatic',
    name: 'Smt. Priya',
    initials: 'SP',
    style: 'Carnatic',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#7B1FA2'],
    specialties: ['Gamaka', 'Swaras', 'Bhakti'],
  },
];

const TOPICS = [
  { key: 'breathing', title: 'Breathing', icon: 'weather-windy', difficulty: 'beginner' },
  { key: 'pitch', title: 'Pitch', icon: 'music-note', difficulty: 'intermediate' },
  { key: 'warmup', title: 'Warmup', icon: 'fire', difficulty: 'beginner' },
];

const LESSON_STEPS = {
  breathing: [
    { id: 1, text: 'Stand upright with shoulders relaxed', tip: 'Keep your spine straight for optimal airflow.' },
    { id: 2, text: 'Inhale slowly through your nose for 4 counts', tip: 'Feel your belly expand as air fills your lungs.' },
    { id: 3, text: 'Hold your breath gently for 2 counts', tip: 'Don't force — keep it comfortable.' },
    { id: 4, text: 'Exhale smoothly through your mouth for 6 counts', tip: 'Control the release for sustained vocal support.' },
    { id: 5, text: 'Repeat 5 times, gradually extending each phase', tip: 'Consistency builds breath capacity over time.' },
  ],
  pitch: [
    { id: 1, text: 'Start with a comfortable middle note', tip: 'Use "La" or "Ah" to find your natural pitch.' },
    { id: 2, text: 'Scale up one note at a time slowly', tip: 'Listen carefully and match each interval precisely.' },
    { id: 3, text: 'Hold each note for 3 seconds steady', tip: 'Avoid vibrato — focus on a clean, sustained tone.' },
    { id: 4, text: 'Scale back down to your starting note', tip: 'Descending is harder — stay focused on pitch accuracy.' },
    { id: 5, text: 'Record yourself and compare with the reference', tip: 'Self-assessment is the fastest path to improvement.' },
  ],
  warmup: [
    { id: 1, text: 'Hum gently for 30 seconds on one pitch', tip: 'Humming warms up vocal cords safely.' },
    { id: 2, text: 'Lip trills from low to high (siren)', tip: 'Keep lips loose — buzz like a motorboat.' },
    { id: 3, text: 'Tongue trills rolling "R" on scales', tip: 'Roll the tongue to relax jaw and throat tension.' },
    { id: 4, text: 'Sing "Mah-May-Mee-Moh-Moo" ascending', tip: 'Exaggerate vowel shapes for maximum benefit.' },
    { id: 5, text: 'Finish with gentle staccato notes on "Ha"', tip: 'Sharp, short breaths activate your diaphragm.' },
  ],
};

const SoundBars = ({ isPlaying, color = COLORS.white }) => {
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(0.7)).current;
  const bar3 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isPlaying) {
      const createLoop = (val, min, max, duration) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(val, { toValue: min, duration, useNativeDriver: false }),
          ])
        );
      const a = createLoop(bar1, 0.3, 1, 400);
      const b = createLoop(bar2, 0.5, 1, 550);
      const c = createLoop(bar3, 0.4, 0.9, 475);
      a.start();
      b.start();
      c.start();
      return () => { a.stop(); b.stop(); c.stop(); };
    } else {
      bar1.setValue(0.4);
      bar2.setValue(0.7);
      bar3.setValue(0.5);
    }
  }, [isPlaying]);

  return (
    <View style={styles.soundBars}>
      {[bar1, bar2, bar3].map((bar, i) => (
        <Animated.View
          key={i}
          style={[styles.soundBar, { backgroundColor: color, height: 16, transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
};

const AnimatedCheckmark = ({ checked, color }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (checked) {
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 200, useNativeDriver: true }).start();
    } else {
      scale.setValue(0);
    }
  }, [checked]);

  return (
    <Animated.View style={[styles.stepCheck, { backgroundColor: checked ? color : COLORS.gray200, transform: [{ scale }] }]}>
      <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
    </Animated.View>
  );
};

const ScoreRing = ({ score }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (circumference * Math.min(score, 100)) / 100;

  useEffect(() => {
    Animated.timing(progress, { toValue: strokeDashoffset, duration: 1500, useNativeDriver: false }).start();
  }, []);

  const ringColor = score >= 80 ? '#4CAF50' : score >= 50 ? '#FFC107' : '#F44336';

  return (
    <View style={styles.scoreRingContainer}>
      <View style={styles.scoreRingOuter}>
        <View style={styles.scoreRingBg} />
        <View style={[styles.scoreRingFill, { borderColor: ringColor }]} />
        <View style={styles.scoreRingInner}>
          <Text style={[styles.scoreNumber, { color: ringColor }]}>{score}</Text>
          <Text style={styles.scoreLabel}>score</Text>
        </View>
      </View>
    </View>
  );
};

const StarRating = ({ count }) => {
  const stars = [1, 2, 3];

  return (
    <View style={styles.starsRow}>
      {stars.map((star, index) => {
        const anim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
          if (star <= count) {
            Animated.sequence([
              Animated.delay(index * 300),
              Animated.spring(anim, { toValue: 1, damping: 6, stiffness: 200, useNativeDriver: true }),
            ]).start();
          }
        }, []);

        return (
          <Animated.View key={star} style={[styles.star, { transform: [{ scale: anim }] }]}>
            <MaterialCommunityIcons
              name={star <= count ? 'star' : 'star-outline'}
              size={40}
              color={star <= count ? '#FFD700' : COLORS.gray300}
            />
          </Animated.View>
        );
      })}
    </View>
  );
};

const VocalGuruScreen = ({ navigation }) => {
  const [gurus, setGurus] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [lessonComplete, setLessonComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const topicStagger = useRef(TOPICS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchGurus();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateTopics = () => {
    const animations = topicStagger.map((val, i) =>
      Animated.timing(val, { toValue: 1, duration: 400, delay: i * 120, useNativeDriver: true })
    );
    Animated.stagger(100, animations).start();
  };

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
    setCompletedSteps({});
    setLessonComplete(false);
    animateTopics();
  };

  const handleStartLesson = async (topicKey) => {
    if (!selectedGuru) return;
    try {
      const res = await authFetch(api.vocalGuruGreet(selectedGuru.id));
      let greeting = `Welcome! Let's master ${topicKey} today.`;
      if (res.ok) {
        const data = await res.json();
        if (data.message) greeting = data.message;
      }
      setCurrentLesson({
        topic: topicKey,
        guru: selectedGuru,
        message: greeting,
        steps: LESSON_STEPS[topicKey] || LESSON_STEPS.breathing,
      });
      setCompletedSteps({});
      setLessonComplete(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStep = (stepId) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      const lesson = currentLesson;
      if (lesson && Object.values(next).filter(Boolean).length === lesson.steps.length) {
        setTimeout(() => setLessonComplete(true), 600);
      }
      return next;
    });
  };

  const handleSpeak = async (text) => {
    try {
      setSpeaking(true);
      const res = await authFetch(api.vocalGuruSpeak, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setAudioPlaying(true);
        setTimeout(() => setAudioPlaying(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSpeaking(false);
    }
  };

  const resetLesson = () => {
    setCurrentLesson(null);
    setCompletedSteps({});
    setLessonComplete(false);
  };

  const getGuruColor = (guruId) => {
    const match = GURU_DATA.find((g) => g.id === guruId);
    return match ? match.color : COLORS.primary;
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
      <StatusBar barStyle="light-content" />
      <LinearGradient {...createGradient(COLORS.gradient.royal)} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Vocal Guru</Text>
            <Text style={styles.headerSubtitle}>Your personal vocal coach</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* GURU CAROUSEL */}
        {!currentLesson && (
          <>
            <Animated.Text
              style={[styles.sectionTitle, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
            >
              Choose Your Guru
            </Animated.Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              decelerationRate="fast"
            >
              {GURU_DATA.map((guru, index) => {
                const isSelected = selectedGuru?.id === guru.id;
                const cardSlide = useRef(new Animated.Value(80)).current;
                const cardFade = useRef(new Animated.Value(0)).current;

                useEffect(() => {
                  Animated.parallel([
                    Animated.timing(cardSlide, { toValue: 0, duration: 450, delay: index * 150, useNativeDriver: true }),
                    Animated.timing(cardFade, { toValue: 1, duration: 450, delay: index * 150, useNativeDriver: true }),
                  ]).start();
                }, []);

                return (
                  <TouchableOpacity
                    key={guru.id}
                    activeOpacity={0.9}
                    onPress={() => handleSelectGuru(guru)}
                  >
                    <Animated.View
                      style={[
                        styles.guruCard,
                        {
                          opacity: cardFade,
                          transform: [
                            { translateX: cardSlide },
                            { scale: isSelected ? 1.05 : 1 },
                          ],
                        },
                        isSelected && {
                          shadowColor: guru.color,
                          shadowOpacity: 0.45,
                          shadowRadius: 16,
                          elevation: 10,
                        },
                      ]}
                    >
                      <LinearGradient colors={guru.gradient} style={styles.guruCardGradient}>
                        <View style={[styles.guruAvatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                          <Text style={styles.guruAvatarText}>{guru.initials}</Text>
                        </View>
                        <Text style={styles.guruName}>{guru.name}</Text>
                        <View style={[styles.styleBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                          <Text style={styles.styleBadgeText}>{guru.style}</Text>
                        </View>
                        <View style={styles.specialtiesRow}>
                          {guru.specialties.map((spec) => (
                            <Tag key={spec} label={spec} color={COLORS.white} variant="light" size="small" />
                          ))}
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* TOPICS GRID */}
            {selectedGuru && (
              <Animated.View style={[styles.topicsContainer, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Choose a Topic</Text>
                <View style={styles.topicsGrid}>
                  {TOPICS.map((topic, index) => (
                    <Animated.View
                      key={topic.key}
                      style={{
                        opacity: topicStagger[index],
                        transform: [
                          {
                            translateY: topicStagger[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        style={styles.topicCard}
                        activeOpacity={0.85}
                        onPress={() => handleStartLesson(topic.key)}
                      >
                        <View style={[styles.topicIcon, { backgroundColor: `${COLORS.primary}12` }]}>
                          <MaterialCommunityIcons name={topic.icon} size={28} color={COLORS.primary} />
                        </View>
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        <Tag
                          label={topic.difficulty}
                          color={topic.difficulty === 'beginner' ? COLORS.success : COLORS.warning}
                          variant="light"
                          size="small"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* ACTIVE LESSON */}
        {currentLesson && !lessonComplete && (
          <Animated.View style={[styles.lessonPanel, { opacity: fadeAnim }]}>
            {/* Guru header */}
            <View style={styles.lessonGuruHeader}>
              <View style={[styles.lessonAvatar, { backgroundColor: currentLesson.guru.color }]}>
                <Text style={styles.lessonAvatarText}>{GURU_DATA.find((g) => g.id === currentLesson.guru.id)?.initials || 'G'}</Text>
              </View>
              <View>
                <Text style={styles.lessonGuruName}>{currentLesson.guru.name}</Text>
                <Text style={styles.lessonTopicText}>{currentLesson.topic.charAt(0).toUpperCase() + currentLesson.topic.slice(1)} Lesson</Text>
              </View>
            </View>

            {/* Listen button */}
            <TouchableOpacity
              style={[styles.listenBtn, { backgroundColor: currentLesson.guru.color }]}
              activeOpacity={0.85}
              onPress={() => handleSpeak(currentLesson.message)}
              disabled={speaking}
            >
              {audioPlaying ? (
                <SoundBars isPlaying color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons name={speaking ? 'loading' : 'volume-high'} size={22} color={COLORS.white} />
              )}
              <Text style={styles.listenBtnText}>{speaking ? 'Preparing...' : audioPlaying ? 'Playing...' : 'Listen to Guru'}</Text>
            </TouchableOpacity>

            {/* Steps */}
            <View style={styles.stepsCard}>
              <Text style={styles.stepsCardTitle}>Step by Step</Text>
              {currentLesson.steps.map((step, index) => {
                const checked = !!completedSteps[step.id];
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[styles.stepRow, checked && styles.stepRowDone]}
                    activeOpacity={0.8}
                    onPress={() => handleToggleStep(step.id)}
                  >
                    <AnimatedCheckmark checked={checked} color={currentLesson.guru.color} />
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepText, checked && styles.stepTextDone]}>{step.text}</Text>
                      <Text style={styles.stepTip}>{step.tip}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={checked ? currentLesson.guru.color : COLORS.gray300}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action */}
            <TouchableOpacity
              style={[styles.nextStepBtn, { backgroundColor: currentLesson.guru.color }]}
              activeOpacity={0.85}
              onPress={() => {
                const unchecked = currentLesson.steps.find((s) => !completedSteps[s.id]);
                if (unchecked) handleToggleStep(unchecked.id);
              }}
            >
              <Text style={styles.nextStepBtnText}>
                {Object.values(completedSteps).filter(Boolean).length === currentLesson.steps.length ? 'Complete Lesson' : 'Next Step'}
              </Text>
              <MaterialCommunityIcons
                name={Object.values(completedSteps).filter(Boolean).length === currentLesson.steps.length ? 'check-circle' : 'arrow-right'}
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToGurusBtn} onPress={resetLesson}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.primary} />
              <Text style={styles.backToGurusText}>Back to Gurus</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* SESSION SUMMARY */}
        {lessonComplete && (
          <Animated.View style={[styles.summaryPanel, { opacity: fadeAnim }]}>
            <Text style={styles.summaryTitle}>Great Job!</Text>
            <Text style={styles.summarySubtitle}>You completed the {currentLesson.topic} lesson</Text>

            <ScoreRing score={85} />
            <StarRating count={3} />

            <GradientButton
              title="Try Another Topic"
              icon="refresh"
              colors={COLORS.gradient.primary}
              onPress={resetLesson}
              style={styles.summaryBtn}
            />
            <TouchableOpacity style={styles.backToGurusBtn} onPress={() => { resetLesson(); setSelectedGuru(null); }}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.primary} />
              <Text style={styles.backToGurusText}>Back to Gurus</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 52,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { flex: 1, paddingTop: SPACING.lg },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },

  carouselContainer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.md },

  guruCard: {
    width: SCREEN_WIDTH * 0.62,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  guruCardGradient: { padding: SPACING.xl, alignItems: 'center', minHeight: 220 },
  guruAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  guruAvatarText: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  guruName: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  styleBadge: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  styleBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.white },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },

  topicsContainer: { paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  topicCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  topicIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  topicTitle: { fontSize: 15, fontWeight: '600', color: COLORS.black },

  /* Lesson panel */
  lessonPanel: { paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  lessonGuruHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  lessonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  lessonAvatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  lessonGuruName: { fontSize: 17, fontWeight: '700', color: COLORS.black },
  lessonTopicText: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },

  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  listenBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },

  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  stepsCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.lg },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  stepRowDone: { opacity: 0.7 },
  stepCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepContent: { flex: 1 },
  stepText: { fontSize: 14, fontWeight: '500', color: COLORS.black, lineHeight: 20 },
  stepTextDone: { textDecorationLine: 'line-through', color: COLORS.gray500 },
  stepTip: { fontSize: 12, color: COLORS.gray500, marginTop: 3, fontStyle: 'italic' },

  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  nextStepBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },

  backToGurusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  backToGurusText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginLeft: SPACING.sm },

  /* Summary */
  summaryPanel: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xxxl, alignItems: 'center' },
  summaryTitle: { fontSize: 26, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  summarySubtitle: { fontSize: 14, color: COLORS.gray500, marginBottom: SPACING.xl },

  scoreRingContainer: { marginBottom: SPACING.xl },
  scoreRingOuter: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  scoreRingBg: {
    ...StyleSheet.absoluteFillObject,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: COLORS.gray200,
    alignSelf: 'center',
    marginTop: 10,
  },
  scoreRingFill: {
    ...StyleSheet.absoluteFillObject,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#4CAF50',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: 10,
  },
  scoreRingInner: { alignItems: 'center', zIndex: 1 },
  scoreNumber: { fontSize: 32, fontWeight: '700' },
  scoreLabel: { fontSize: 11, color: COLORS.gray500, fontWeight: '500' },

  starsRow: { flexDirection: 'row', marginBottom: SPACING.xl, gap: SPACING.sm },
  star: { marginHorizontal: 4 },

  summaryBtn: { width: '100%', marginBottom: SPACING.md },

  soundBars: { flexDirection: 'row', alignItems: 'center', height: 20, gap: 3 },
  soundBar: { width: 3.5, borderRadius: 2 },

  bottomPad: { height: 120 },
});

export default VocalGuruScreen;
