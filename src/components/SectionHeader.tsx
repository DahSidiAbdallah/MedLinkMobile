import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
};

export default function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
  icon,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.actionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
