# Viswah Frontend - App Entry Point

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CourseScreen from './src/screens/CourseScreen';
import LessonScreen from './src/screens/LessonScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200EE',
    accent: '#03DAC6',
    background: '#F6F6F6',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Viswah' }}
          />
          <Stack.Screen
            name="Course"
            component={CourseScreen}
            options={{ title: 'Course' }}
          />
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{ title: 'Lesson' }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ title: 'Quiz' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}