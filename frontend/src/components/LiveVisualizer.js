import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { COLORS } from '../theme';

const BAR_COUNT = 32;
const BAR_GAP = 3;

const LiveVisualizer = ({ active, width, height, color }) => {
  const barsRef = useRef(
    Array.from({ length: BAR_COUNT }, () => ({
      anim: new Animated.Value(0.1),
      target: 0.1,
    }))
  ).current;

  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        barsRef.forEach((bar) => {
          bar.target = Math.random() * 0.8 + 0.15;
          Animated.timing(bar.anim, {
            toValue: bar.target,
            duration: 80 + Math.random() * 60,
            useNativeDriver: false,
          }).start();
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      barsRef.forEach((bar) => {
        Animated.timing(bar.anim, {
          toValue: 0.08,
          duration: 400,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const barWidth = Math.max(2, ((width || 300) - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT);
  const maxH = (height || 80) - 10;

  return (
    <View style={[styles.container, { width: width || 300, height: height || 80 }]} pointerEvents="none">
      {barsRef.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: color || COLORS.neon,
              height: bar.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [3, maxH],
              }),
              opacity: bar.anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.3, 0.6, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: BAR_GAP,
  },
  bar: {
    borderRadius: 2,
    minHeight: 3,
  },
});

export default LiveVisualizer;
