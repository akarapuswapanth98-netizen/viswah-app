import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

import HomeScreen from './src/screens/HomeScreen';
import CourseScreen from './src/screens/CourseScreen';
import LessonScreen from './src/screens/LessonScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import VocalGuruScreen from './src/screens/VocalGuruScreen';
import SpeechAnalysisScreen from './src/screens/SpeechAnalysisScreen';
import LyricsCreatorScreen from './src/screens/LyricsCreatorScreen';

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#6200EE', accent: '#03DAC6' },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Viswah' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="VocalGuru" component={VocalGuruScreen} options={{ title: 'Vocal Guru' }} />
          <Stack.Screen name="SpeechAnalysis" component={SpeechAnalysisScreen} options={{ title: 'Speech Analysis' }} />
          <Stack.Screen name="LyricsCreator" component={LyricsCreatorScreen} options={{ title: 'Lyrics Creator' }} />
          <Stack.Screen name="Course" component={CourseScreen} options={{ title: 'Course' }} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: 'Lesson' }} />
          <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}