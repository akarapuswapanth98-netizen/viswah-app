import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_URL = `http://${LOCALHOST}:8000`;

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
  generateLesson: `${API_URL}/api/ai/generate-lesson`,
  generateExercise: `${API_URL}/api/ai/generate-exercise`,
  topics: (instrument, difficulty) => `${API_URL}/api/ai/topics/${instrument}/${difficulty}`,
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

export const authFetch = async (url, options = {}) => {
  const token = await getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};