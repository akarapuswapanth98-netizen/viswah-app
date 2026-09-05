import React, { useRef } from 'react';
import { View, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';

export const GlassCard = ({ children, style, onPress, intensity }) => {
  const bg = intensity === 'light'
    ? 'rgba(255,255,255,0.03)'
    : intensity === 'heavy'
      ? 'rgba(255,255,255,0.08)'
      : COLORS.glass.bg;
  const borderColor = intensity === 'heavy'
    ? 'rgba(255,255,255,0.15)'
    : COLORS.glass.border;

  const content = (
    <View style={[styles.card, { backgroundColor: bg, borderColor: borderColor }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    overflow: 'hidden',
  },
});

export const TiltCard = ({ children, style, onPress }) => {
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.spring(tiltX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(tiltY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleMouseMove = (e) => {
    if (Platform.OS !== 'web') return;
    const { locationX, locationY } = e.nativeEvent;
    const cardWidth = 300;
    const cardHeight = 200;
    const rotateXVal = ((locationY - cardHeight / 2) / (cardHeight / 2)) * -8;
    const rotateYVal = ((locationX - cardWidth / 2) / (cardWidth / 2)) * 8;
    Animated.parallel([
      Animated.timing(tiltX, { toValue: rotateXVal, duration: 100, useNativeDriver: true }),
      Animated.timing(tiltY, { toValue: rotateYVal, duration: 100, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.4, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const card = (
    <Animated.View
      style={[
        styles.tiltCard,
        style,
        {
          transform: [
            { perspective: 1000 },
            { rotateX: tiltX.interpolate({ inputRange: [-10, 10], outputRange: ['8deg', '-8deg'] }) },
            { rotateY: tiltY.interpolate({ inputRange: [-10, 10], outputRange: ['-8deg', '8deg'] }) },
            { scale },
          ],
        },
      ]}
    >
      <Animated.View style={[styles.tiltGlow, { opacity: glowOpacity }]} pointerEvents="none" />
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onMouseMove={handleMouseMove}
        activeOpacity={1}
      >
        {card}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onMouseMove={handleMouseMove}
      activeOpacity={1}
    >
      {card}
    </TouchableOpacity>
  );
};

const styles2 = StyleSheet.create({
  tiltCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.bg,
    padding: SPACING.xl,
    overflow: 'hidden',
  },
  tiltGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
  },
});

// Merge styles
const mergedStyles = { ...styles, ...styles2 };
styles.tiltCard = styles2.tiltCard;
styles.tiltGlow = styles2.tiltGlow;

export default TiltCard;
