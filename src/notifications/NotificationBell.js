import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useNotifications } from './NotificationsContext';
import PropTypes from 'prop-types';

export default function NotificationBell({ onPress }) {
  const { unreadCount } = useNotifications();

  return (
    <Pressable onPress={onPress} style={styles.wrap} hitSlop={10} accessibilityLabel="Notifications">
      <MaterialIcons name="notifications-none" size={26} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.card, fontSize: 10, fontWeight: '600' },
});

NotificationBell.propTypes = {
  onPress: PropTypes.func,
};

NotificationBell.defaultProps = {
  onPress: () => {},
};
