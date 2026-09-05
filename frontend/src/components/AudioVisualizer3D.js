import React, { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import { Svg, Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NUM_BANDS = 32;
const CANVAS_HEIGHT = 120;

const AudioVisualizer3D = ({ analyser, isPlaying, color1 = '#7C3AED', color2 = '#06B6D4', style }) => {
  const freqRef = useRef(new Uint8Array(NUM_BANDS));
  const smoothRef = useRef(new Float32Array(NUM_BANDS));
  const framesRef = useRef(0);
  const idleAnim = useRef(new Animated.Value(0)).current;
  const energy = useRef(new Animated.Value(0)).current;
  const animFrame = useRef(null);
  const svgRef = useRef(null);
  const [freqData, setFreqData] = React.useState(() => new Float32Array(NUM_BANDS).fill(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(idleAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    Animated.spring(energy, { toValue: isPlaying ? 1 : 0, friction: 8, tension: 40, useNativeDriver: false }).start();
  }, [isPlaying]);

  const tick = useCallback(() => {
    framesRef.current++;
    const doUpdate = framesRef.current % 2 === 0;

    if (analyser && isPlaying) {
      const arr = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(arr);
      const step = Math.max(1, Math.floor(arr.length / NUM_BANDS));
      for (let i = 0; i < NUM_BANDS; i++) {
        const idx = Math.min(i * step, arr.length - 1);
        freqRef.current[i] = arr[idx] / 255;
      }
    } else {
      const t = framesRef.current * 0.04;
      for (let i = 0; i < NUM_BANDS; i++) {
        const wave = Math.sin(t + i * 0.4) * 0.3 + 0.15;
        const ambient = Math.sin(t * 0.3 + i * 0.15) * 0.08;
        freqRef.current[i] = Math.max(0, Math.min(1, wave + ambient));
      }
    }

    for (let i = 0; i < NUM_BANDS; i++) {
      const target = freqRef.current[i];
      smoothRef.current[i] += (target - smoothRef.current[i]) * 0.35;
    }

    if (doUpdate) {
      setFreqData(new Float32Array(smoothRef.current));
    }
    animFrame.current = requestAnimationFrame(tick);
  }, [analyser, isPlaying]);

  useEffect(() => {
    animFrame.current = requestAnimationFrame(tick);
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [tick]);

  const bandWidth = SCREEN_WIDTH / NUM_BANDS;

  const buildFrequencyPath = useCallback(() => {
    const points = [];
    for (let i = 0; i < NUM_BANDS; i++) {
      const x = i * bandWidth + bandWidth / 2;
      const barH = smoothRef.current[i] * CANVAS_HEIGHT * 0.85;
      const y = CANVAS_HEIGHT - barH;
      if (i === 0) {
        points.push(`M ${x},${y}`);
      } else {
        const prevX = (i - 1) * bandWidth + bandWidth / 2;
        const prevBarH = smoothRef.current[i - 1] * CANVAS_HEIGHT * 0.85;
        const prevY = CANVAS_HEIGHT - prevBarH;
        const cpx = (prevX + x) / 2;
        points.push(`C ${cpx},${prevY} ${cpx},${y} ${x},${y}`);
      }
    }
    points.push(`L ${(NUM_BANDS - 1) * bandWidth + bandWidth / 2},${CANVAS_HEIGHT}`);
    points.push(`L ${bandWidth / 2},${CANVAS_HEIGHT}`);
    points.push('Z');
    return points.join(' ');
  }, [bandWidth]);

  const buildRibbonPath = useCallback((offset) => {
    const points = [];
    for (let i = 0; i < NUM_BANDS; i++) {
      const x = i * bandWidth + bandWidth / 2;
      const barH = smoothRef.current[i] * CANVAS_HEIGHT * 0.65;
      const y = CANVAS_HEIGHT / 2 + Math.sin(i * 0.5 + offset) * 8 - barH * 0.5;
      if (i === 0) {
        points.push(`M ${x},${y}`);
      } else {
        const prevX = (i - 1) * bandWidth + bandWidth / 2;
        const prevBarH = smoothRef.current[i - 1] * CANVAS_HEIGHT * 0.65;
        const prevY = CANVAS_HEIGHT / 2 + Math.sin((i - 1) * 0.5 + offset) * 8 - prevBarH * 0.5;
        const cpx = (prevX + x) / 2;
        points.push(`C ${cpx},${prevY} ${cpx},${y} ${x},${y}`);
      }
    }
    return points.join(' ');
  }, [bandWidth]);

  const particlePositions = useRef(
    Array.from({ length: 12 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      r: 1 + Math.random() * 2,
    }))
  ).current;

  const midVal = smoothRef.current[Math.floor(NUM_BANDS / 2)] || 0;

  return (
    <Animated.View
      style={[{
        height: CANVAS_HEIGHT,
        width: SCREEN_WIDTH,
        overflow: 'hidden',
        borderRadius: 16,
        backgroundColor: 'rgba(9,10,15,0.6)',
      }, style]}
    >
      <Svg ref={svgRef} width={SCREEN_WIDTH} height={CANVAS_HEIGHT}>
        <Defs>
          <LinearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color2} stopOpacity="0.7" />
            <Stop offset="50%" stopColor={color1} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={color2} stopOpacity="0.7" />
          </LinearGradient>
          <LinearGradient id="ribbonG" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color2} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color1} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        <G opacity={0.35}>
          {particlePositions.map((p, i) => {
            const floatY = Math.sin(framesRef.current * 0.02 + i) * 5;
            return (
              <Circle key={`p${i}`} cx={p.x} cy={p.y + floatY} r={p.r} fill={i % 2 === 0 ? color1 : color2} opacity={0.3 + midVal * 0.4} />
            );
          })}
        </G>

        <Path d={buildFrequencyPath()} fill="url(#rg)" opacity={0.85} />
        <Path d={buildRibbonPath(framesRef.current * 0.06)} stroke="url(#ribbonG)" strokeWidth="2" fill="none" opacity={0.9} />

        <G opacity={0.5}>
          {[0.25, 0.5, 0.75].map((frac, idx) => {
            const lineY = CANVAS_HEIGHT * frac;
            return (
              <Path key={`h${idx}`} d={`M 0,${lineY} L ${SCREEN_WIDTH},${lineY}`} stroke={color1} strokeWidth="0.5" opacity={0.15} />
            );
          })}
        </G>
      </Svg>
    </Animated.View>
  );
};

export default AudioVisualizer3D;
