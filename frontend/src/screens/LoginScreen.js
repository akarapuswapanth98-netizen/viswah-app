import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createGradient } from '../theme';
import { GradientButton } from '../components/UIComponents';
import { api, authFetch, setAuthToken } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MUSIC_NOTES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  symbol: ['♪', '♫', '♬', '♩'][i % 4],
  x: Math.random() * SCREEN_WIDTH,
  delay: Math.random() * 4000,
  duration: 6000 + Math.random() * 4000,
  size: 14 + Math.random() * 10,
}));

const FloatingNote = ({ symbol, x, delay, duration, size }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(Dimensions.get('window').height + 50);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.35, duration: Math.max(0, duration - 1600), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingNote,
        {
          left: x,
          fontSize: size,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
};

const getErrorKey = (placeholder) => {
  const p = placeholder?.toLowerCase() || '';
  if (p.includes('confirm')) return 'confirmPassword';
  if (p.includes('username')) return 'username';
  if (p.includes('email')) return 'email';
  if (p.includes('password')) return 'password';
  return '';
};

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const logoScale = useRef(new Animated.Value(0)).current;
  const formSlideY = useRef(new Animated.Value(300)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const inputScales = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 8,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(formSlideY, {
          toValue: 0,
          damping: 12,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      animateInputs(isLogin ? 2 : 4);
    });
  }, []);

  const animateInputs = (count) => {
    const anims = Array.from({ length: count }, (_, i) =>
      Animated.timing(inputScales[i], {
        toValue: 1,
        duration: 300,
        delay: i * 100,
        useNativeDriver: true,
      })
    );
    Animated.parallel(anims).start();
  };

  const resetInputs = () => {
    inputScales.forEach((anim) => anim.setValue(0));
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const newErrors = {};

    if (!username.trim() || username.trim().length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!email.trim() || !email.includes('@')) {
        newErrors.email = 'Please enter a valid email';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      triggerShake();
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const endpoint = isLogin ? api.login : api.register;
      const body = isLogin
        ? { username: username.trim(), password }
        : { username: username.trim(), email: email.trim(), password };

      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (data.access_token) {
        await setAuthToken(data.access_token);
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          navigation.replace('Home');
        });
      }
    } catch (e) {
      setErrors({ general: e.message || 'Something went wrong' });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    resetInputs();
    setTimeout(() => {
      animateInputs(!isLogin ? 2 : 4);
    }, 100);
  };

  const renderInput = (index, { icon, placeholder, value, onChangeText, secure, onToggleSecure, showSecure, keyboardType }) => {
    const inputCount = isLogin ? 2 : 4;
    if (index >= inputCount) return null;

    const errorKey = getErrorKey(placeholder);

    return (
      <Animated.View
        key={placeholder}
        style={{
          transform: [
            { scale: inputScales[index] },
            { translateX: shakeAnim },
          ],
          opacity: inputScales[index],
        }}
      >
        <View style={[styles.inputContainer, errors[errorKey] && styles.inputError]}>
          <MaterialCommunityIcons name={icon} size={20} color={COLORS.gray400} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray400}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secure || false}
            autoCapitalize="none"
            keyboardType={keyboardType || 'default'}
          />
          {onToggleSecure && (
            <TouchableOpacity onPress={onToggleSecure}>
              <MaterialCommunityIcons
                name={showSecure ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[errorKey] ? (
          <View style={styles.inlineError}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#FF3B30" />
            <Text style={styles.inlineErrorText}>{errors[errorKey]}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.outerContainer, { opacity: fadeOut }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#6C63FF', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

          {MUSIC_NOTES.map((note) => (
            <FloatingNote key={note.id} {...note} />
          ))}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: logoScale }] },
              ]}
            >
              <MaterialCommunityIcons name="music-note" size={60} color={COLORS.white} />
            </Animated.View>
            <Animated.Text style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Join Viswah'}
            </Animated.Text>
            <Animated.Text style={styles.subtitle}>
              {isLogin ? 'Continue your musical journey' : 'Start your musical journey'}
            </Animated.Text>
          </View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateY: formSlideY }],
                opacity: formOpacity,
              },
            ]}
          >
            <View style={styles.formCard}>
              {errors.general ? (
                <View style={styles.generalError}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#FF3B30" />
                  <Text style={styles.generalErrorText}>{errors.general}</Text>
                </View>
              ) : null}

              {renderInput(0, {
                icon: 'account',
                placeholder: 'Username',
                value: username,
                onChangeText: setUsername,
              })}

              {!isLogin &&
                renderInput(1, {
                  icon: 'email',
                  placeholder: 'Email',
                  value: email,
                  onChangeText: setEmail,
                  keyboardType: 'email-address',
                })}

              {renderInput(isLogin ? 1 : 2, {
                icon: 'lock',
                placeholder: 'Password',
                value: password,
                onChangeText: setPassword,
                secure: !showPassword,
                onToggleSecure: () => setShowPassword(!showPassword),
                showSecure: showPassword,
              })}

              {!isLogin &&
                renderInput(3, {
                  icon: 'lock-check',
                  placeholder: 'Confirm Password',
                  value: confirmPassword,
                  onChangeText: setConfirmPassword,
                  secure: !showConfirmPassword,
                  onToggleSecure: () => setShowConfirmPassword(!showConfirmPassword),
                  showSecure: showConfirmPassword,
                })}

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <GradientButton
                  title={isLogin ? 'Login' : 'Create Account'}
                  onPress={handleSubmit}
                  loading={loading}
                  icon={isLogin ? 'login' : 'account-plus'}
                  colors={['#6C63FF', '#9C27B0']}
                  style={styles.submitButton}
                />
              </Animated.View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <Text style={styles.toggleLink}>
                  {isLogin ? 'Register' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  floatingNote: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.35)',
    zIndex: 0,
  },
  backButton: {
    marginTop: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: SPACING.xl,
    zIndex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
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
    zIndex: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xxl,
    ...SHADOWS.large,
  },
  generalError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  generalErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF8F8',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.black,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  inlineErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dividerText: {
    marginHorizontal: SPACING.lg,
    color: COLORS.gray500,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  toggleText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  toggleLink: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xl,
    zIndex: 1,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;
