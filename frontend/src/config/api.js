// API Configuration
import { Platform } from 'react-native';

// Change this to your server IP for physical devices
const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${LOCALHOST}:8000`;

export const api = {
  // Auth
  register: `${API_URL}/api/auth/register`,
  login: `${API_URL}/api/auth/login`,
  me: `${API_URL}/api/auth/me`,

  // Courses
  courses: `${API_URL}/api/courses`,
  course: (id) => `${API_URL}/api/courses/${id}`,
  courseLessons: (id) => `${API_URL}/api/courses/${id}/lessons`,
  lesson: (id) => `${API_URL}/api/lessons/${id}`,

  // Enrollment
  enroll: (courseId) => `${API_URL}/api/enroll/${courseId}`,
  enrolled: `${API_URL}/api/enrolled`,

  // Progress
  progress: `${API_URL}/api/progress`,
  progressById: (id) => `${API_URL}/api/progress/${id}`,

  // AI
  generateLesson: `${API_URL}/api/ai/generate-lesson`,
  generateExercise: `${API_URL}/api/ai/generate-exercise`,
  topics: (instrument, difficulty) => `${API_URL}/api/ai/topics/${instrument}/${difficulty}`,
};

// Auth token storage
let authToken = null;

export const setAuthToken = (token) => { authToken = token; };
export const getAuthToken = () => authToken;
export const clearAuthToken = () => { authToken = null; };

// Authenticated fetch helper
export const authFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return fetch(url, { ...options, headers });
};