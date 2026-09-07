import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../theme';

const cssGradient = (colors) => {
  if (!colors || colors.length < 2) return {};
  if (Platform.OS === 'web') return { background: `linear-gradient(135deg, ${colors.join(', ')})` };
  return { backgroundColor: colors[0] };
};

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
    <View style={[styles.button, cssGradient(colors), disabled && styles.buttonDisabled]}>
      {loading ? (
        <MaterialCommunityIcons name="loading" size={20} color={COLORS.white} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.white} />
      ) : null}
      <View style={[styles.buttonTextContainer, icon && { marginLeft: SPACING.sm }]}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </View>
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
    <View style={[styles.card, cssGradient(colors), style]}>
      {icon && (
        <MaterialCommunityIcons 
          name={icon} 
          size={40} 
          color="rgba(255,255,255,0.9)" 
          style={styles.cardIcon}
        />
      )}
      {children}
    </View>
  </TouchableOpacity>
);

// Section Header
export const SectionHeader = ({ title, subtitle, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction} style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{action}</Text>
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
      <View style={[styles.avatarGradient, cssGradient(gradient), { borderRadius: size / 2 }]}>
        {icon && <MaterialCommunityIcons name={icon} size={size * 0.5} color={COLORS.white} />}
      </View>
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
      <Text style={[styles.badgeText, { fontSize: currentSize.fontSize }]}>{count > 99 ? '99+' : count}</Text>
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
      <Text style={[styles.tagText, { color: variant === 'filled' ? COLORS.white : color }]}>{label}</Text>
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
      <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
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
