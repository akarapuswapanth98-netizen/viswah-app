import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, ProgressBar } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_SIZE = 44;
const TIMER_STROKE = 4;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;
const OPTION_GRID_GAP = SPACING.md;
const OPTION_CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - OPTION_GRID_GAP) / 2;
const CONFETTI_COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFC107', '#E91E63', '#FF5722'];
const TIMER_DURATION = 30;

const playCorrectSound = () => {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

const playWrongSound = () => {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

const ConfettiParticle = ({ delay, color }) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const xPos = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: 2000 + Math.random() * 1500,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 360 + Math.random() * 720,
        duration: 2000 + Math.random() * 1500,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          left: xPos,
          backgroundColor: color,
          transform: [
            { translateY: fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, Dimensions.get('window').height + 50] }) },
            { rotate: rotateAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  );
};

const QuizScreen = ({ route, navigation }) => {
  const { lessonId, lessonTitle, courseId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [answered, setAnswered] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const optionFades = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const selectedScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const correctPulse = useRef(new Animated.Value(0)).current;
  const scoreCircleAnim = useRef(new Animated.Value(0)).current;
  const scoreNumberAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([]).current;
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (quiz && !showResult && !answered) {
      startTimer();
      animateQuestionIn();
    }
  }, [currentIndex, quiz]);

  useEffect(() => {
    if (showResult && quiz) {
      const percentage = Math.round((score / quiz.questions.length) * 100);
      Animated.parallel([
        Animated.timing(scoreCircleAnim, {
          toValue: percentage / 100,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scoreNumberAnim, {
          toValue: percentage,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showResult, quiz]);

  const fetchQuiz = async () => {
    try {
      const res = await authFetch(api.lesson(lessonId));
      if (res.ok) {
        const data = await res.json();
        const questions = data.quiz_questions || [];
        if (questions.length > 0) {
          setQuiz({
            title: lessonTitle || 'Quiz',
            questions: questions.map((q, i) => ({
              id: i,
              question: q.question,
              options: q.options || [],
              correct: q.correct_answer || 0,
            })),
          });
        } else {
          setQuiz({
            title: lessonTitle || 'Quiz',
            questions: [
              { id: 0, question: 'What is the main topic of this lesson?', options: ['Music theory', 'Practice', 'Performance', 'All of the above'], correct: 3 },
              { id: 1, question: 'How often should you practice?', options: ['Daily', 'Weekly', 'Monthly', 'Never'], correct: 0 },
              { id: 2, question: 'Which skill is most important?', options: ['Reading', 'Listening', 'Timing', 'All of the above'], correct: 3 },
              { id: 3, question: 'What helps you improve fastest?', options: ['Random practice', 'Focused practice', 'No practice', 'Watching others'], correct: 1 },
            ],
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const animateQuestionIn = () => {
    slideAnim.setValue(SCREEN_WIDTH);
    fadeAnim.setValue(0);
    optionFades.forEach((a) => a.setValue(0));

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.stagger(
        100,
        optionFades.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start();
    });
  };

  const startTimer = () => {
    setTimeLeft(TIMER_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUpRef = useRef(null);
  handleTimeUpRef.current = { answered, currentIndex, handleAnswerSelection, handleNext };

  const handleTimeUp = useCallback(() => {
    const { answered: isAnswered, handleAnswerSelection: selectAnswer, handleNext: goNext } = handleTimeUpRef.current;
    if (isAnswered) return;
    selectAnswer(null);
    setTimeout(() => goNext(), 600);
  }, []);

  const handleAnswerSelection = (index) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);

    const currentQuestion = quiz?.questions[currentIndex];
    const isCorrect = index === currentQuestion?.correct;

    setFeedbackType(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playCorrectSound();
      Animated.sequence([
        Animated.timing(correctPulse, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(correctPulse, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      Animated.sequence([
        Animated.spring(selectedScale, { toValue: 1.05, tension: 200, friction: 10, useNativeDriver: true }),
        Animated.spring(selectedScale, { toValue: 1.03, tension: 200, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      playWrongSound();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = quiz?.questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correct;

    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion?.question,
        options: currentQuestion?.options,
        selected: selectedAnswer,
        correct: currentQuestion?.correct,
        isCorrect,
      },
    ]);

    if (isCorrect) setScore((prev) => prev + 1);

    if (currentIndex < quiz?.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setFeedbackType(null);
      selectedScale.setValue(1);
      shakeAnim.setValue(0);
      correctPulse.setValue(0);
    } else {
      setShowResult(true);
      saveScore();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !answered) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setFeedbackType(null);
      selectedScale.setValue(1);
      shakeAnim.setValue(0);
      correctPulse.setValue(0);
    }
  };

  const saveScore = async () => {
    try {
      const percentage = Math.round((score / quiz.questions.length) * 100);
      await authFetch(api.progress, {
        method: 'POST',
        body: JSON.stringify({ lesson_id: parseInt(lessonId), completed: true, score: percentage }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setAnswered(false);
    setFeedbackType(null);
    selectedScale.setValue(1);
    shakeAnim.setValue(0);
    correctPulse.setValue(0);
    scoreCircleAnim.setValue(0);
    scoreNumberAnim.setValue(0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={COLORS.primary} />
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="quiz" size={64} color={COLORS.gray300} />
          <Animated.Text style={styles.emptyTitle}>No Quiz Available</Animated.Text>
          <Animated.Text style={styles.emptySubtitle}>This lesson doesn't have a quiz yet</Animated.Text>
          <GradientButton title="Go Back" onPress={() => navigation.goBack()} icon="arrow-left" style={styles.emptyButton} />
        </View>
      </View>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const isPassed = percentage >= 70;

    const animatedScore = scoreNumberAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 100],
    });

    const confettiParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 800,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));

    const stars = isPassed
      ? Array.from({ length: Math.min(3, Math.ceil(percentage / 35)) }, (_, i) => i)
      : [];

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={isPassed ? COLORS.gradient.ocean : COLORS.gradient.sunset}
          style={styles.resultGradient}
        >
          {isPassed && (
            <View style={styles.confettiContainer}>
              {confettiParticles.map((p) => (
                <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
              ))}
            </View>
          )}

          <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.resultContent}>
              <View style={styles.scoreCircleContainer}>
                <View style={styles.scoreCircleOuter}>
                  <View style={styles.scoreCircleBg} />
                  <Animated.View
                    style={[
                      styles.scoreCircleFill,
                      {
                        transform: [{ scale: scoreCircleAnim }],
                      },
                    ]}
                  />
                  <View style={styles.scoreCircleInner}>
                    <Animated.Text style={styles.scorePercentage}>
                      {animatedScore.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0', '100'],
                        extrapolate: 'clamp',
                      })}
                      %
                    </Animated.Text>
                    <Animated.Text style={styles.scoreDetail}>
                      {score} / {quiz.questions.length}
                    </Animated.Text>
                  </View>
                </View>
              </View>

              {isPassed && (
                <View style={styles.starsContainer}>
                  {stars.map((_, i) => (
                    <Animated.View key={i} style={styles.starItem}>
                      <MaterialCommunityIcons name="star" size={32} color="#FFD700" />
                    </Animated.View>
                  ))}
                </View>
              )}

              <Animated.Text style={styles.resultTitle}>
                {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
              </Animated.Text>

              {isPassed && (
                <Animated.Text style={styles.resultEmoji}>
                  🎉
                </Animated.Text>
              )}

              <Animated.Text style={styles.resultSubtitle}>
                {isPassed
                  ? 'You have passed the quiz!'
                  : 'You need 70% to pass. Try again!'}
              </Animated.Text>

              <View style={styles.reviewSection}>
                <Animated.Text style={styles.reviewTitle}>Question Review</Animated.Text>
                {answers.map((answer, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <View style={[styles.reviewIcon, { backgroundColor: answer.isCorrect ? '#4CAF5020' : '#F4433620' }]}>
                      <MaterialCommunityIcons
                        name={answer.isCorrect ? 'check' : 'close'}
                        size={18}
                        color={answer.isCorrect ? '#4CAF50' : '#F44336'}
                      />
                    </View>
                    <View style={styles.reviewContent}>
                      <Animated.Text style={styles.reviewQuestion} numberOfLines={2}>
                        {answer.question}
                      </Animated.Text>
                      {answer.selected !== null && (
                        <Animated.Text style={styles.reviewAnswer}>
                          Your answer: {answer.options?.[answer.selected]}
                        </Animated.Text>
                      )}
                      {answer.selected === null && (
                        <Animated.Text style={[styles.reviewAnswer, { color: COLORS.gray400 }]}>
                          No answer (time expired)
                        </Animated.Text>
                      )}
                      {!answer.isCorrect && (
                        <Animated.Text style={styles.reviewCorrect}>
                          Correct: {answer.options?.[answer.correct]}
                        </Animated.Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.resultButtons}>
                <GradientButton
                  title="Retry Quiz"
                  onPress={handleRetry}
                  icon="refresh"
                  colors={COLORS.gradient.primary}
                  style={styles.resultButton}
                />
                <GradientButton
                  title="Back to Course"
                  onPress={() => navigation.goBack()}
                  icon="arrow-left"
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.resultButton}
                />
              </View>

              {!isPassed && (
                <TouchableOpacity onPress={handleRetry} style={styles.tryAgainButton}>
                  <MaterialCommunityIcons name="refresh" size={18} color={COLORS.white} />
                  <Animated.Text style={styles.tryAgainText}>Try Again</Animated.Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 60 }} />
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = (currentIndex + 1) / quiz.questions.length;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const timerProgress = timeLeft / TIMER_DURATION;
  const timerDashOffset = TIMER_CIRCUMFERENCE * (1 - timerProgress);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Animated.Text style={styles.quizTitle}>{quiz.title}</Animated.Text>
            <Animated.Text style={styles.questionCount}>
              Question {currentIndex + 1} of {quiz.questions.length}
            </Animated.Text>
          </View>

          <View style={styles.timerCircleContainer}>
            <View style={styles.timerCircleOuter}>
              <View style={[styles.timerBgCircle, { width: TIMER_SIZE, height: TIMER_SIZE, borderRadius: TIMER_SIZE / 2, borderWidth: TIMER_STROKE, borderColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={[styles.timerFillCircle, { 
                width: TIMER_SIZE, 
                height: TIMER_SIZE, 
                borderRadius: TIMER_SIZE / 2, 
                borderWidth: TIMER_STROKE, 
                borderColor: timeLeft <= 10 ? COLORS.secondary : COLORS.white,
                borderTopColor: 'transparent',
                transform: [{ rotate: '-90deg' }],
              }]} />
              <View style={styles.timerTextContainer}>
                <Animated.Text
                  style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}
                >
                  {timeLeft}
                </Animated.Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            height={6}
            color={COLORS.white}
            backgroundColor="rgba(255,255,255,0.3)"
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.questionCard,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Animated.Text style={styles.questionText}>
            {currentQuestion.question}
          </Animated.Text>
        </Animated.View>

        <View style={styles.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correct;
            const showCorrect = answered && isCorrect;
            const showWrong = answered && isSelected && !isCorrect;

            let bgColor = COLORS.white;
            let borderColor = COLORS.gray200;
            let textColor = COLORS.gray700;
            let letterBg = COLORS.gray100;
            let letterColor = COLORS.gray600;

            if (isSelected && !answered) {
              bgColor = `${COLORS.primary}15`;
              borderColor = COLORS.primary;
              textColor = COLORS.primary;
              letterBg = COLORS.primary;
              letterColor = COLORS.white;
            }

            if (showCorrect) {
              bgColor = '#4CAF5020';
              borderColor = '#4CAF50';
              textColor = '#4CAF50';
              letterBg = '#4CAF50';
              letterColor = COLORS.white;
            }

            if (showWrong) {
              bgColor = '#F4433620';
              borderColor = '#F44336';
              textColor = '#F44336';
              letterBg = '#F44336';
              letterColor = COLORS.white;
            }

            return (
              <Animated.View
                key={index}
                style={[
                  styles.optionCardWrapper,
                  {
                    opacity: optionFades[index],
                    transform: [
                      { scale: isSelected && !answered ? selectedScale : new Animated.Value(1) },
                      ...(showWrong ? [{ translateX: shakeAnim }] : []),
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleAnswerSelection(index)}
                  activeOpacity={0.8}
                  disabled={answered}
                >
                  <View style={[styles.optionLetterCircle, { backgroundColor: letterBg }]}>
                    <Animated.Text style={[styles.optionLetter, { color: letterColor }]}>
                      {String.fromCharCode(65 + index)}
                    </Animated.Text>
                  </View>
                  <Animated.Text style={[styles.optionText, { color: textColor }]} numberOfLines={3}>
                    {option}
                  </Animated.Text>
                  {showCorrect && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={styles.optionStatusIcon} />
                  )}
                  {showWrong && (
                    <MaterialCommunityIcons name="close-circle" size={20} color="#F44336" style={styles.optionStatusIcon} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.navContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={currentIndex === 0 ? COLORS.gray300 : COLORS.primary}
            />
            <Animated.Text
              style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}
            >
              Previous
            </Animated.Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext, !answered && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={!answered}
          >
            <Animated.Text
              style={[styles.navButtonText, styles.navButtonTextNext, !answered && styles.navButtonTextDisabled]}
            >
              {isLastQuestion ? 'Submit' : 'Next'}
            </Animated.Text>
            <MaterialCommunityIcons
              name={isLastQuestion ? 'check' : 'chevron-right'}
              size={20}
              color={!answered ? COLORS.gray300 : COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    width: 200,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  questionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  timerCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircleOuter: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSvg: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  timerWarning: {
    color: COLORS.secondary,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: OPTION_GRID_GAP,
    marginBottom: SPACING.xl,
  },
  optionCardWrapper: {
    width: OPTION_CARD_WIDTH,
  },
  optionCard: {
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },
  optionLetterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  optionStatusIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  navButtonNext: {
    backgroundColor: COLORS.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  navButtonTextNext: {
    color: COLORS.white,
  },
  navButtonTextDisabled: {
    color: COLORS.gray300,
  },
  resultGradient: {
    flex: 1,
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    padding: SPACING.xl,
    paddingTop: 60,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scoreCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreCircleBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scoreCircleFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scoreCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
  },
  scoreDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  starItem: {
    marginHorizontal: 4,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  resultEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  resultSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  reviewSection: {
    marginBottom: SPACING.xl,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  reviewContent: {
    flex: 1,
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  reviewAnswer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  reviewCorrect: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  resultButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  resultButton: {
    width: '100%',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
  },
});

export default QuizScreen;
