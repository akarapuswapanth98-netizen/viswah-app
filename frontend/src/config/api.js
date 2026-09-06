import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '8003';
export const API_URL = `http://${LOCALHOST}:${API_PORT}`;

export const api = {
  register: `${API_URL}/api/auth/register`,
  login: `${API_URL}/api/auth/login`,
  me: `${API_URL}/api/auth/me`,
  courses: `${API_URL}/api/courses`,
  course: (id) => `${API_URL}/api/courses/${id}`,
  courseLessons: (id) => `${API_URL}/api/courses/${id}/lessons`,
  lesson: (id) => `${API_URL}/api/lessons/${id}`,
  enroll: (courseId) => `${API_URL}/api/enroll/${courseId}`,
  enrolled: `${API_URL}/api/enrolled`,
  progress: `${API_URL}/api/progress`,
  progressById: (id) => `${API_URL}/api/progress/${id}`,
  progressByLesson: (lessonId) => `${API_URL}/api/progress?lesson_id=${lessonId}`,
  generateLesson: `${API_URL}/api/ai/generate-lesson`,
  generateExercise: `${API_URL}/api/ai/generate-exercise`,
  topics: (instrument, difficulty) => `${API_URL}/api/ai/topics/${instrument}/${difficulty}`,
  vocalGurus: `${API_URL}/api/vocal-guru/gurus`,
  vocalGuruTopics: `${API_URL}/api/vocal-guru/topics`,
  vocalGuruGreet: (id) => `${API_URL}/api/vocal-guru/greet/${id}`,
  vocalGuruTeach: (topic, guruId) => `${API_URL}/api/vocal-guru/teach/${topic}?guru_id=${guruId}`,
  vocalGuruSpeak: `${API_URL}/api/vocal-guru/speak`,
  vocalGuruAudio: (filename) => `${API_URL}/api/vocal-guru/audio/${filename}`,
  speechExercises: `${API_URL}/api/speech/exercises`,
  speechExercise: (id) => `${API_URL}/api/speech/exercises/${id}`,
  speechAnalyzePitch: `${API_URL}/api/speech/analyze-pitch`,
  speechAnalyzeVolume: `${API_URL}/api/speech/analyze-volume`,
  speechScore: `${API_URL}/api/speech/score`,
  speechAnalyzeSession: `${API_URL}/api/speech/analyze-session`,
  speechUploadAudio: `${API_URL}/api/speech/upload-audio`,
  lyricsGenres: `${API_URL}/api/lyrics/genres`,
  lyricsMoods: `${API_URL}/api/lyrics/moods`,
  lyricsGenerate: `${API_URL}/api/lyrics/generate`,
  lyricsImprove: `${API_URL}/api/lyrics/improve`,
  lyricsAnalyze: `${API_URL}/api/lyrics/analyze`,
  lyricsFormat: `${API_URL}/api/lyrics/format`,
  musicologyGenres: `${API_URL}/api/v1/musicology/genres`,
};

const TOKEN_KEY = '@viswah_token';
let authToken = null;

export const setAuthToken = async (token) => {
  authToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  if (authToken) return authToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  if (stored) authToken = stored;
  return stored;
};

export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// Fix #7: User headers take precedence
export const authFetch = async (url, options = {}) => {
  const token = await getAuthToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...options.headers,
  };
  // Only set Content-Type for requests with body
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};