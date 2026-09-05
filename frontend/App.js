import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, createGradient } from './src/theme';

import OnboardingScreen from './src/screens/OnboardingScreen';
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
  colors: { 
    ...DefaultTheme.colors, 
    primary: COLORS.primary, 
    accent: COLORS.accent,
  },
};

// Custom transition configs
const forFade = ({ current, closing }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

const forSlide = ({ current, next, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  };
};

// Splash Screen Component
const SplashScreen = ({ onFinish }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onFinish, 1500);
    });
  }, []);

  return (
    <View style={splashStyles.container}>
      <LinearGradient
        {...createGradient(COLORS.gradient.royal)}
        style={splashStyles.gradient}
      >
        <Animated.View style={[splashStyles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <MaterialCommunityIcons name="music-note" size={80} color={COLORS.white} />
          <Animated.Text style={splashStyles.title}>Viswah</Animated.Text>
          <Animated.Text style={splashStyles.subtitle}>Your Musical Journey Begins</Animated.Text>
        </Animated.View>
        
        <Animated.View style={[splashStyles.loadingContainer, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons name="loading" size={24} color={COLORS.white} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
});

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  if (showOnboarding) {
    return (
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <OnboardingScreen navigation={{ replace: handleOnboardingComplete }} />
        </NavigationContainer>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: forFade,
            transitionSpec: {
              open: { animation: 'spring', config: { damping: 20, stiffness: 200 } },
              close: { animation: 'timing', config: { duration: 200 } },
            },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="VocalGuru" component={VocalGuruScreen} />
          <Stack.Screen name="SpeechAnalysis" component={SpeechAnalysisScreen} />
          <Stack.Screen name="LyricsCreator" component={LyricsCreatorScreen} />
          <Stack.Screen name="Course" component={CourseScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
