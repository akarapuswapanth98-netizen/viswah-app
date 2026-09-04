# Lesson Screen - Content View

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8000';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, lessonTitle } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLesson();
  }, []);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`${API_URL}/api/lessons/${lessonId}`);
      const data = await response.json();
      setLesson(data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      // Fallback lesson content
      setLesson({
        id: lessonId,
        title: lessonTitle || 'Music Fundamentals',
        content: `
# Introduction to Music Notes

Music is made up of different sounds called **notes**. These notes are the building blocks of all music.

## The Musical Alphabet

Music uses just 7 letter names:
**A, B, C, D, E, F, G**

After G, we start over at A again!

## Note Positions

- Notes go from low (bass) to high (treble)
- On piano, notes go from left (low) to right (high)
- Each note has a specific pitch

## Staff and Clefs

Music is written on a **staff** - 5 horizontal lines:
- **Treble Clef (G Clef)**: Higher notes (right hand on piano)
- **Bass Clef (F Clef)**: Lower notes (left hand on piano)

## Practice Activity

1. Say the note names out loud: A B C D E F G
2. Try to find these notes on a piano or instrument
3. Listen to how each note sounds different
        `,
        lesson_type: 'theory',
        duration_minutes: 10
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading lesson...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>{lesson?.title}</Title>
        <View style={styles.headerInfo}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="white" />
          <Paragraph style={styles.headerTime}>{lesson?.duration_minutes} min</Paragraph>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        <Card style={styles.contentCard}>
          <Card.Content>
            {/* Render markdown-like content */}
            {lesson?.content?.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <Title key={index} style={styles.h1}>{line.slice(2)}</Title>;
              }
              if (line.startsWith('## ')) {
                return <Title key={index} style={styles.h2}>{line.slice(3)}</Title>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <Paragraph key={index} style={styles.bold}>{line.slice(2, -2)}</Paragraph>;
              }
              if (line.startsWith('- ')) {
                return (
                  <View key={index} style={styles.listItem}>
                    <Paragraph>• {line.slice(2)}</Paragraph>
                  </View>
                );
              }
              if (line.match(/^\d\./)) {
                return (
                  <View key={index} style={styles.listItem}>
                    <Paragraph>{line}</Paragraph>
                  </View>
                );
              }
              if (line.trim() === '') {
                return <View key={index} style={{ height: 12 }} />;
              }
              return <Paragraph key={index} style={styles.paragraph}>{line}</Paragraph>;
            })}
          </Card.Content>
        </Card>

        {/* Practice Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#FFC107" />
              <Title style={styles.tipsTitle}>Practice Tips</Title>
            </View>
            <Divider style={styles.divider} />
            <Paragraph style={styles.tip}>• Practice for 15-20 minutes daily</Paragraph>
            <Paragraph style={styles.tip}>• Use a metronome to keep steady time</Paragraph>
            <Paragraph style={styles.tip}>• Record yourself to track progress</Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back
        </Button>
        <Button
          mode="contained"
          icon="arrow-right"
          onPress={() => navigation.navigate('Quiz', { lessonId })}
          style={styles.nextButton}
        >
          Take Quiz
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
    fontSize: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  headerTime: {
    color: 'white',
    opacity: 0.8,
    marginLeft: 4,
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  contentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  h1: {
    fontSize: 24,
    marginBottom: 12,
  },
  h2: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    lineHeight: 24,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  listItem: {
    marginLeft: 16,
    marginBottom: 4,
  },
  tipsCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFF8E1',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsTitle: {
    marginLeft: 8,
    fontSize: 16,
  },
  divider: {
    marginVertical: 12,
  },
  tip: {
    marginBottom: 8,
    color: '#666',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    elevation: 8,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default LessonScreen;