# Quiz Screen - Test Knowledge

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const QuizScreen = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    // Fallback quiz data
    setQuiz({
      questions: [
        {
          id: 1,
          question: "How many notes are in the musical alphabet?",
          options: ["5", "6", "7", "8"],
          correct_answer: "7"
        },
        {
          id: 2,
          question: "What comes after G in the musical alphabet?",
          options: ["H", "A", "I", "F"],
          correct_answer: "A"
        },
        {
          id: 3,
          question: "Which clef is used for higher notes?",
          options: ["Bass Clef", "Treble Clef", "Alto Clef", "Tenor Clef"],
          correct_answer: "Treble Clef"
        },
        {
          id: 4,
          question: "How many lines are on a musical staff?",
          options: ["4", "5", "6", "7"],
          correct_answer: "5"
        },
        {
          id: 5,
          question: "What are the building blocks of music called?",
          options: ["Beats", "Notes", "Bars", "Rests"],
          correct_answer: "Notes"
        }
      ]
    });
    setLoading(false);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading quiz...</Paragraph>
      </View>
    );
  }

  if (showResults) {
    const percentage = (score / quiz.questions.length) * 100;
    const isPassed = percentage >= 70;

    return (
      <View style={styles.container}>
        <View style={styles.resultsContainer}>
          <Card style={styles.resultsCard}>
            <Card.Content style={styles.resultsContent}>
              <MaterialCommunityIcons
                name={isPassed ? "check-circle" : "alert-circle"}
                size={80}
                color={isPassed ? "#4CAF50" : "#F44336"}
              />
              <Title style={styles.resultsTitle}>
                {isPassed ? "Congratulations!" : "Keep Practicing!"}
              </Title>
              <Paragraph style={styles.resultsScore}>
                You scored {score} out of {quiz.questions.length}
              </Paragraph>
              <Paragraph style={styles.resultsPercentage}>
                {percentage.toFixed(0)}%
              </Paragraph>

              <View style={styles.resultsDetails}>
                <View style={styles.resultItem}>
                  <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                  <Paragraph style={styles.resultText}>Correct: {score}</Paragraph>
                </View>
                <View style={styles.resultItem}>
                  <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                  <Paragraph style={styles.resultText}>Wrong: {quiz.questions.length - score}</Paragraph>
                </View>
              </View>

              <View style={styles.resultsButtons}>
                <Button
                  mode="outlined"
                  onPress={handleRetry}
                  style={styles.retryButton}
                >
                  Try Again
                </Button>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Home')}
                  style={styles.homeButton}
                >
                  Back to Home
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = (currentQuestion + 1) / quiz.questions.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Quiz</Title>
        <Paragraph style={styles.headerProgress}>
          Question {currentQuestion + 1} of {quiz.questions.length}
        </Paragraph>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color="#6200EE" style={styles.progressBar} />
      </View>

      {/* Question */}
      <ScrollView style={styles.questionContainer}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <Title style={styles.questionText}>{question.question}</Title>

            <View style={styles.optionsContainer}>
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswerSelect(question.id, option)}
                  style={[
                    styles.optionButton,
                    selectedAnswers[question.id] === option && styles.selectedOption
                  ]}
                >
                  <RadioButton
                    value={option}
                    status={selectedAnswers[question.id] === option ? 'checked' : 'unchecked'}
                    onPress={() => handleAnswerSelect(question.id, option)}
                  />
                  <Paragraph style={[
                    styles.optionText,
                    selectedAnswers[question.id] === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Paragraph>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.bottomBar}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestion === 0}
          style={styles.navButton}
        >
          Previous
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!selectedAnswers[question.id]}
          style={styles.navButton}
        >
          {currentQuestion === quiz.questions.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
  },
  headerProgress: {
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#E8EAF6',
    borderColor: '#6200EE',
  },
  optionText: {
    flex: 1,
    marginLeft: 8,
  },
  selectedOptionText: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    elevation: 8,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  // Results styles
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  resultsCard: {
    elevation: 4,
  },
  resultsContent: {
    alignItems: 'center',
    padding: 20,
  },
  resultsTitle: {
    fontSize: 24,
    marginTop: 16,
  },
  resultsScore: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  resultsPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200EE',
    marginTop: 8,
  },
  resultsDetails: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-around',
    width: '100%',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    marginLeft: 8,
    fontSize: 16,
  },
  resultsButtons: {
    flexDirection: 'row',
    marginTop: 32,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    marginRight: 8,
  },
  homeButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default QuizScreen;