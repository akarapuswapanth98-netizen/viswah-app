import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, LAYOUT, GLASS } from '../theme';

const NAV_ITEMS = [
  { key: 'Home', icon: 'home-outline', label: 'Home' },
  { key: 'Piano', icon: 'piano', label: 'Piano' },
  { key: 'Drums', icon: 'drum', label: 'Drums' },
  { key: 'VocalGuru', icon: 'account-music', label: 'Vocal Guru' },
  { key: 'SpeechAnalysis', icon: 'microphone', label: 'Speech' },
  { key: 'LyricsCreator', icon: 'lead-pencil', label: 'Lyrics' },
  { key: 'Course', icon: 'book-open-variant', label: 'Courses' },
  { key: 'Profile', icon: 'account-circle-outline', label: 'Profile' },
];

const Sidebar = ({ navigation, currentRoute }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoMark}>
          <MaterialCommunityIcons name="music-note-sixteenth-dotted" size={28} color={COLORS.neon} />
        </View>
        <Text style={styles.logoText}>VISWAH</Text>
      </View>

      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navigation.navigate(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={isActive ? COLORS.neon : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: LAYOUT.sidebarWidth,
    height: '100%',
    backgroundColor: 'rgba(11, 13, 23, 0.95)',
    borderRightWidth: 1,
    borderRightColor: COLORS.surfaceBorder,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 3,
  },
  navSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  navLabelActive: {
    color: COLORS.neon,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: -SPACING.md,
    top: '50%',
    marginTop: -12,
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: COLORS.neon,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  versionText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default Sidebar;
