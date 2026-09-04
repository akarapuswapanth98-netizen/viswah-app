# Home Screen - Course List

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8000';

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback courses
      setCourses([
        { id: 1, title: 'Music Fundamentals', description: 'Learn the basics of music theory', stage: 1, instrument: 'vocal', difficulty: 'beginner' },
        { id: 2, title: 'Vocal Training', description: 'Develop your singing voice', stage: 1, instrument: 'vocal', difficulty: 'beginner' },
        { id: 3, title: 'Piano Basics', description: 'Start your piano journey', stage: 1, instrument: 'piano', difficulty: 'beginner' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage ? course.stage === selectedStage : true;
    return matchesSearch && matchesStage;
  });

  const getInstrumentIcon = (instrument) => {
    switch (instrument) {
      case 'vocal': return 'account-music';
      case 'piano': return 'piano';
      case 'drums': return 'drum';
      default: return 'music';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Welcome to Viswah</Title>
        <Paragraph style={styles.headerSubtitle}>Start your music journey</Paragraph>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Search courses..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Stage Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageFilter}>
        {[1, 2, 3, 4].map(stage => (
          <Chip
            key={stage}
            selected={selectedStage === stage}
            onPress={() => setSelectedStage(selectedStage === stage ? null : stage)}
            style={styles.chip}
          >
            Stage {stage}
          </Chip>
        ))}
      </ScrollView>

      {/* Course List */}
      <ScrollView style={styles.courseList}>
        {loading ? (
          <Paragraph style={styles.loading}>Loading courses...</Paragraph>
        ) : (
          filteredCourses.map(course => (
            <TouchableOpacity
              key={course.id}
              onPress={() => navigation.navigate('Course', { courseId: course.id })}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name={getInstrumentIcon(course.instrument)}
                      size={24}
                      color="#6200EE"
                    />
                    <Chip
                      style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(course.difficulty) }]}
                      textStyle={{ color: 'white', fontSize: 12 }}
                    >
                      {course.difficulty}
                    </Chip>
                  </View>
                  <Title style={styles.cardTitle}>{course.title}</Title>
                  <Paragraph style={styles.cardDescription}>{course.description}</Paragraph>
                  <Paragraph style={styles.cardStage}>Stage {course.stage}</Paragraph>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Button
          mode="contained"
          icon="account"
          onPress={() => navigation.navigate('Profile')}
          style={styles.navButton}
        >
          Profile
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
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
  },
  headerSubtitle: {
    color: 'white',
    opacity: 0.8,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  stageFilter: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  courseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 18,
  },
  cardDescription: {
    color: '#666',
    marginTop: 4,
  },
  cardStage: {
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  difficultyChip: {
    height: 24,
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  bottomNav: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 8,
  },
  navButton: {
    paddingVertical: 4,
  },
});

export default HomeScreen;