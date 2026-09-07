import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, LAYOUT } from '../theme';

const TopBar = ({ username, onProfilePress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{username || 'Student'}</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={14} color={COLORS.warning} />
          <Text style={styles.streakText}>7 day streak</Text>
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={18} color={COLORS.neon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    backgroundColor: 'rgba(11, 13, 23, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  profileButton: {
    padding: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TopBar;
