import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Path, Rect } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Glow particle burst on key press
export const GlowBurst = ({ active, color = '#6C63FF', x = 0, y = 0, count = 6 }) => {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      anim: new Animated.Value(0),
      offsetX: (Math.random() - 0.5) * 60,
      offsetY: -Math.random() * 50 - 10,
      size: Math.random() * 4 + 2,
    }))
  ).current;

  useEffect(() => {
    if (active) {
      particles.forEach((p) => {
        p.anim.setValue(0);
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 400 + Math.random() * 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={[styles.glowBurstContainer, { left: x, top: y }]} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.glowParticle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              opacity: p.anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.offsetX],
                  }),
                },
                {
                  translateY: p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.offsetY],
                  }),
                },
                {
                  scale: p.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.2, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

// Frequency visualizer bars
export const FrequencyBars = ({ values, color = '#6C63FF', barCount = 16, height = 60, style }) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    const anims = animatedValues.map((anim, i) => {
      const target = values && values[i] !== undefined ? values[i] : Math.random() * 0.8 + 0.2;
      return Animated.timing(anim, {
        toValue: target,
        duration: 100,
        useNativeDriver: false,
      });
    });
    Animated.parallel(anims).start();
  }, [values]);

  return (
    <View style={[styles.freqBarsContainer, { height }, style]} pointerEvents="none">
      {animatedValues.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.freqBar,
            {
              backgroundColor: color,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [4, height],
              }),
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.3, 0.7, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

// Glassmorphism card wrapper
export const GlassCard = ({ children, style, intensity = 'medium' }) => {
  const opacities = {
    light: 'rgba(255,255,255,0.08)',
    medium: 'rgba(255,255,255,0.12)',
    heavy: 'rgba(255,255,255,0.18)',
  };
  const borderOpacities = {
    light: 'rgba(255,255,255,0.1)',
    medium: 'rgba(255,255,255,0.15)',
    heavy: 'rgba(255,255,255,0.25)',
  };

  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: opacities[intensity],
          borderColor: borderOpacities[intensity],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Animated ring for score display
export const ScoreRing = ({ score = 0, size = 120, color = '#6C63FF', animValue }) {
  const circumference = Math.PI * (size - 12);
  const strokeDashoffset = animValue
    ? animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, circumference * (1 - score / 100)],
      })
    : circumference * (1 - score / 100);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 12) / 2}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={6}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={(size - 12) / 2}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.scoreRingInner, { width: size, height: size }]}>
        <Animated.Text style={[styles.scoreRingText, { fontSize: size * 0.28 }]}>
          {score}
        </Animated.Text>
        <Animated.Text style={[styles.scoreRingLabel, { fontSize: size * 0.1 }]}>
          SCORE
        </Animated.Text>
      </View>
    </View>
  );
};

// Waveform path for speech analysis
export const WaveformPath = ({ amplitude = 0.5, width = 300, height = 60, color = '#6C63FF' }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(animValue, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const points = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const phase = (i / segments) * Math.PI * 4;
    const y = height / 2 + Math.sin(phase) * (height / 2) * amplitude * 0.8;
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.6" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={points.join(' ')} stroke={color} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
};

// Ripple effect on touch
export const RippleEffect = ({ active, color = '#6C63FF', size = 100 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={[styles.rippleContainer, { width: size, height: size }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ scale: anim }],
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glowBurstContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 100,
  },
  glowParticle: {
    position: 'absolute',
  },
  freqBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  freqBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scoreRingInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreRingLabel: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginTop: 2,
  },
  rippleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
  },
});
