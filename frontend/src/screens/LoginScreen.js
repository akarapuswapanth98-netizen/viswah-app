import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton } from '../components/UIComponents';
import { api, authFetch, setAuthToken } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isLogin ? api.login : api.register;
      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }
      
      // Store token
      if (data.access_token) {
        await setAuthToken(data.access_token);
        navigation.replace('Home');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        {...createGradient(COLORS.gradient.royal)}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="music-note" size={60} color={COLORS.white} />
          </View>
          <Animated.Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Join Viswah'}
          </Animated.Text>
          <Animated.Text style={styles.subtitle}>
            {isLogin ? 'Continue your musical journey' : 'Start your musical journey'}
          </Animated.Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.formCard}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.gray400}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock" size={20} color={COLORS.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={COLORS.gray400} 
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                <Animated.Text style={styles.errorText}>{error}</Animated.Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <GradientButton
              title={isLogin ? 'Login' : 'Sign Up'}
              onPress={handleSubmit}
              loading={loading}
              icon={isLogin ? "login" : "account-plus"}
              colors={COLORS.gradient.primary}
              style={styles.submitButton}
            />

            {/* Toggle Auth Mode */}
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              <Animated.Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Animated.Text>
              <Animated.Text style={styles.toggleLink}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.Text style={styles.footer}>
          By continuing, you agree to our Terms of Service
        </Animated.Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  backButton: {
    marginTop: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxxxl,
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    ...SHADOWS.large,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.black,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
  submitButton: {
    marginBottom: SPACING.lg,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  toggleLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: SPACING.xl,
  },
});

export default LoginScreen;
