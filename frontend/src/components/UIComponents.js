import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, createGradient } from '../theme';

// Gradient Button
export const GradientButton = ({ 
  onPress, 
  title, 
  icon, 
  colors = COLORS.gradient.primary,
  style, 
  disabled = false,
  loading = false,
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    disabled={disabled || loading}
    style={[styles.buttonContainer, style]}
    activeOpacity={0.8}
  >
    <LinearGradient
      {...createGradient(colors)}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      {loading ? (
        <MaterialCommunityIcons name="loading" size={20} color={COLORS.white} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.white} />
      ) : null}
      <View style={[styles.buttonTextContainer, icon && { marginLeft: SPACING.sm }]}>
        <View style={styles.buttonText}>{title}</View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// Gradient Card
export const GradientCard = ({ 
  onPress, 
  children, 
  colors = COLORS.gradient.primary,
  style,
  icon,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
    <LinearGradient
      {...createGradient(colors)}
      style={[styles.card, style]}
    >
      {icon && (
        <MaterialCommunityIcons 
          name={icon} 
          size={40} 
          color="rgba(255,255,255,0.9)" 
          style={styles.cardIcon}
        />
      )}
      {children}
    </LinearGradient>
  </TouchableOpacity>
);

// Section Header
export const SectionHeader = ({ title, subtitle, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={styles.sectionTitle}>{title}</View>
      {subtitle && <View style={styles.sectionSubtitle}>{subtitle}</View>}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction} style={styles.sectionAction}>
        <View style={styles.sectionActionText}>{action}</View>
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
);

// Avatar
export const Avatar = ({ 
  source, 
  size = 48, 
  icon, 
  gradient,
  style 
}) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
    {gradient ? (
      <LinearGradient
        {...createGradient(gradient)}
        style={[styles.avatarGradient, { borderRadius: size / 2 }]}
      >
        {icon && <MaterialCommunityIcons name={icon} size={size * 0.5} color={COLORS.white} />}
      </LinearGradient>
    ) : (
      <>
        {icon && <MaterialCommunityIcons name={icon} size={size * 0.5} color={COLORS.white} />}
      </>
    )}
  </View>
);

// Badge
export const Badge = ({ 
  count, 
  size = 'small', 
  color = COLORS.secondary,
  style 
}) => {
  const sizeStyles = {
    small: { width: 18, height: 18, fontSize: 10 },
    medium: { width: 22, height: 22, fontSize: 12 },
    large: { width: 26, height: 26, fontSize: 14 },
  };
  
  const currentSize = sizeStyles[size];
  
  if (!count || count === 0) return null;
  
  return (
    <View style={[styles.badge, { backgroundColor: color, width: currentSize.width, height: currentSize.height }, style]}>
      <View style={[styles.badgeText, { fontSize: currentSize.fontSize }]}>{count > 99 ? '99+' : count}</View>
    </View>
  );
};

// Tag
export const Tag = ({ 
  label, 
  color = COLORS.primary, 
  variant = 'filled',
  size = 'small',
  style 
}) => {
  const variantStyles = {
    filled: { backgroundColor: color },
    outlined: { backgroundColor: 'transparent', borderColor: color, borderWidth: 1 },
    light: { backgroundColor: `${color}20` },
  };
  
  const sizeStyles = {
    small: { paddingVertical: 4, paddingHorizontal: 8 },
    medium: { paddingVertical: 6, paddingHorizontal: 12 },
    large: { paddingVertical: 8, paddingHorizontal: 16 },
  };
  
  return (
    <View style={[styles.tag, variantStyles[variant], sizeStyles[size], style]}>
      <View style={[styles.tagText, { color: variant === 'filled' ? COLORS.white : color }]}>{label}</View>
    </View>
  );
};

// Progress Bar
export const ProgressBar = ({ 
  progress, 
  height = 8, 
  color = COLORS.primary,
  backgroundColor = COLORS.gray200,
  showLabel = false,
  style 
}) => (
  <View style={[styles.progressContainer, style]}>
    {showLabel && (
      <View style={styles.progressLabel}>{Math.round(progress * 100)}%</View>
    )}
    <View style={[styles.progressBar, { height, backgroundColor }]}>
      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// Divider
export const Divider = ({ style }) => (
  <View style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  // Button
  buttonContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextContainer: {},
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Card
  card: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
  },
  cardIcon: {
    marginBottom: SPACING.lg,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Avatar
  avatar: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Badge
  badge: {
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  
  // Tag
  tag: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    fontWeight: '600',
  },
  
  // Progress Bar
  progressContainer: {
    width: '100%',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
    textAlign: 'right',
  },
  progressBar: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.lg,
  },
});

export default {
  GradientButton,
  GradientCard,
  SectionHeader,
  Avatar,
  Badge,
  Tag,
  ProgressBar,
  Divider,
};
