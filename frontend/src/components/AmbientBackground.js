import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GlowOrb = ({ color, size, startX, startY, duration, delay }) => {
  const animX = useRef(new Animated.Value(startX)).current;
  const animY = useRef(new Animated.Value(startY)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(animX, {
              toValue: startX + (Math.random() - 0.5) * 200,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(animX, {
              toValue: startX,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animY, {
              toValue: startY + (Math.random() - 0.5) * 150,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
            Animated.timing(animY, {
              toValue: startY,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animOpacity, {
              toValue: 0.6,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(animOpacity, {
              toValue: 0.2,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: animOpacity,
        transform: [{ translateX: animX }, { translateY: animY }],
        filter: 'blur(80px)',
      }}
      pointerEvents="none"
    />
  );
};

const AmbientBackground = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <GlowOrb color="rgba(138, 43, 226, 0.18)" size={300} startX={SCREEN_W * 0.15} startY={SCREEN_H * 0.2} duration={12000} delay={0} />
      <GlowOrb color="rgba(0, 245, 212, 0.12)" size={250} startX={SCREEN_W * 0.7} startY={SCREEN_H * 0.6} duration={15000} delay={2000} />
      <GlowOrb color="rgba(255, 0, 127, 0.10)" size={200} startX={SCREEN_W * 0.5} startY={SCREEN_H * 0.8} duration={18000} delay={4000} />
      <GlowOrb color="rgba(0, 212, 255, 0.08)" size={180} startX={SCREEN_W * 0.85} startY={SCREEN_H * 0.15} duration={14000} delay={1000} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
});

export default AmbientBackground;
