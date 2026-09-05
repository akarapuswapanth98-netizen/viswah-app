import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton, ProgressBar } from '../components/UIComponents';
import { api, authFetch } from '../config/api';

const QuizScreen = ({ route, navigation }) => {
  const { lessonId, lessonTitle, courseId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (quiz && !showResult) {
      startTimer();
    }
  }, [currentIndex, quiz]);

  const fetchQuiz = async () => {
    try {
      const res = await authFetch(api.lesson(lessonId));
      if (res.ok) {
        const data = await res.json();
        // Parse quiz questions from lesson content
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
          // Default quiz
          setQuiz({
            title: lessonTitle || 'Quiz',
            questions: [
              { id: 0, question: 'What is the main topic of this lesson?', options: ['Music theory', 'Practice', 'Performance', 'All of the above'], correct: 3 },
              { id: 1, question: 'How often should you practice?', options: ['Daily', 'Weekly', 'Monthly', 'Never'], correct: 0 },
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

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNext();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentQuestion = quiz?.questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correct;
    
    setAnswers([...answers, {
      question: currentQuestion?.question,
      selected: selectedAnswer,
      correct: currentQuestion?.correct,
      isCorrect,
    }]);
    
    if (isCorrect) setScore(score + 1);
    
    if (currentIndex < quiz?.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      slideAnim.setValue(100);
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
    } else {
      setShowResult(true);
      saveScore();
    }
  };

  const saveScore = async () => {
    try {
      await authFetch(`${api.progress}/${courseId}/${lessonId}`, {
        method: 'POST',
        body: JSON.stringify({
          completed: true,
          score: Math.round((score / quiz.questions.length) * 100),
        }),
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
    startTimer();
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
          <GradientButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            icon="arrow-left"
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  // Results Screen
  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const isPassed = percentage >= 70;
    
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={isPassed ? COLORS.gradient.ocean : COLORS.gradient.sunset}
          style={styles.resultGradient}
        >
          <View style={styles.resultContent}>
            <View style={styles.resultIconContainer}>
              <MaterialCommunityIcons 
                name={isPassed ? "trophy" : "emoticon-sad"} 
                size={80} 
                color={COLORS.white} 
              />
            </View>
            
            <Animated.Text style={styles.resultTitle}>
              {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
            </Animated.Text>
            
            <Animated.Text style={styles.resultScore}>{percentage}%</Animated.Text>
            <Animated.Text style={styles.resultDetail}>
              {score} of {quiz.questions.length} correct
            </Animated.Text>
            
            {/* Answers Review */}
            <ScrollView style={styles.answersReview}>
              {answers.map((answer, index) => (
                <View key={index} style={styles.answerReviewItem}>
                  <MaterialCommunityIcons 
                    name={answer.isCorrect ? "check-circle" : "close-circle"} 
                    size={20} 
                    color={answer.isCorrect ? COLORS.white : 'rgba(255,255,255,0.7)'} 
                  />
                  <Animated.Text style={styles.answerReviewText} numberOfLines={2}>
                    {answer.question}
                  </Animated.Text>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.resultButtons}>
              <GradientButton
                title="Try Again"
                onPress={handleRetry}
                icon="refresh"
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.resultButton}
              />
              <GradientButton
                title="Continue"
                onPress={() => navigation.goBack()}
                icon="arrow-right"
                colors={COLORS.gradient.primary}
                style={styles.resultButton}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = (currentIndex + 1) / quiz.questions.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
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
            <Animated.Text style={styles.quizTitle}>{quiz.title}</Animated.Text>
            <Animated.Text style={styles.questionCount}>
              Question {currentIndex + 1} of {quiz.questions.length}
            </Animated.Text>
          </View>
          
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer" size={16} color={COLORS.white} />
            <Animated.Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
              {timeLeft}s
            </Animated.Text>
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

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.questionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.Text style={styles.questionText}>{currentQuestion.question}</Animated.Text>
          
          {/* Options */}
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(index)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.optionIndicator,
                selectedAnswer === index && styles.optionIndicatorSelected,
              ]}>
                <Animated.Text style={[
                  styles.optionLetter,
                  selectedAnswer === index && styles.optionLetterSelected,
                ]}>
                  {String.fromCharCode(65 + index)}
                </Animated.Text>
              </View>
              <Animated.Text style={[
                styles.optionText,
                selectedAnswer === index && styles.optionTextSelected,
              ]}>
                {option}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={currentIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
            onPress={handleNext}
            icon={currentIndex === quiz.questions.length - 1 ? "check" : "arrow-right"}
            disabled={selectedAnswer === null}
            colors={COLORS.gradient.primary}
            style={styles.nextButton}
          />
        </View>

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
    marginRight: SPACING.lg,
  },
  headerInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  questionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: SPACING.xs,
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
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  optionSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionIndicatorSelected: {
    backgroundColor: COLORS.primary,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  optionLetterSelected: {
    color: COLORS.white,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray700,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: SPACING.lg,
  },
  nextButton: {
    width: '100%',
  },
  bottomPadding: {
    height: 100,
  },
  // Results
  resultGradient: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    padding: SPACING.xl,
    paddingTop: 60,
  },
  resultIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  resultScore: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  resultDetail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  answersReview: {
    flex: 1,
    marginBottom: SPACING.xl,
  },
  answerReviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  answerReviewText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  resultButtons: {
    gap: SPACING.md,
  },
  resultButton: {
    width: '100%',
  },
});

export default QuizScreen;
