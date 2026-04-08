import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  Pressable, 
  Alert, 
  Animated,
  ScrollView,
  Linking 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
// Guard AsyncStorage: require lazily to avoid module-eval crashes on some runtimes
let AsyncStorage: any = null;
function getAsyncStorage() {
  if (AsyncStorage) return AsyncStorage;
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // fallback minimal in-memory implementation
    const store: Record<string, string> = {};
    AsyncStorage = {
      getItem: async (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: async (k: string, v: string) => { store[k] = v; },
      removeItem: async (k: string) => { delete store[k]; },
    };
  }
  return AsyncStorage;
}
import { colors, spacing, radius, shadow, animation } from '../theme';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { useToast } from '../hooks/useToast';
import { LinearGradient } from 'expo-linear-gradient';

const TELEMETRY_KEY = 'settings_telemetry_enabled_v1';
const HAPTICS_KEY = 'settings_haptics_enabled_v1';
const NOTIFICATIONS_KEY = 'settings_notifications_enabled_v1';
const DARK_MODE_KEY = 'settings_dark_mode_enabled_v1';
const BIOMETRIC_KEY = 'settings_biometric_enabled_v1';

type SettingsProps = {
  navigation?: any;
};

export default function Settings({ navigation }: SettingsProps) {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [telemetry, setTelemetry] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const storage = getAsyncStorage();
        const [t, h, n, d, b] = await Promise.all([
          storage.getItem(TELEMETRY_KEY),
          storage.getItem(HAPTICS_KEY),
          storage.getItem(NOTIFICATIONS_KEY),
          storage.getItem(DARK_MODE_KEY),
          storage.getItem(BIOMETRIC_KEY),
        ]);
        if (!mounted) return;
        setTelemetry(t !== '0');
        setHaptics(h !== '0');
        setNotifications(n !== '0');
        setDarkMode(d === '1');
        setBiometric(b === '1');
      } catch {}
    }
    load();
    return () => { mounted = false; };
  }, []);

  const updateSetting = async (key: string, value: boolean, setter: (v: boolean) => void, successMessage: string) => {
    setter(value);
    try {
      await getAsyncStorage().setItem(key, value ? '1' : '0');
      showSuccess(t('settings.settingsUpdated', 'Settings Updated'), successMessage);
    } catch (e) {
      showError(t('common.error', 'Error'), t('settings.failedToSave', 'Failed to save setting'));
      setter(!value);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    const name = lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية';
    showSuccess(t('settings.languageChanged', 'Language Changed'), t('settings.languageChangedTo', 'Language changed to {{name}}', { name }));
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOutConfirmTitle', 'Sign Out'),
      t('settings.signOutConfirmMessage', 'Are you sure you want to sign out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.signOut', 'Sign Out'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut(auth);
              showSuccess(t('settings.signedOutTitle', 'Signed Out'), t('settings.signedOutMessage', 'You have been signed out successfully'));
            } catch (error) {
              showError(t('common.error', 'Error'), t('settings.failedToSignOut', 'Failed to sign out. Please try again.'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      showError(t('common.error', 'Error'), t('settings.linkError', 'Could not open link'));
    });
  };

  const renderSettingRow = (
    icon: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    disabled = false
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.line, true: colors.primary400 }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );

  const renderActionRow = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
    destructive = false
  ) => (
    <Pressable style={styles.actionRow} onPress={onPress}>
      <View style={[styles.settingIcon, destructive && { backgroundColor: colors.danger100 }]}>
        <Ionicons name={icon as any} size={20} color={destructive ? colors.danger : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && { color: colors.danger }]}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>{t('settings.title', 'Settings')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('settings.subtitle', 'Customize your MedLink experience')}
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.preferences', 'Preferences')}</Text>
          {renderSettingRow(
            'notifications',
            t('settings.notifications', 'Notifications'),
            t('settings.notificationsDesc', 'Receive medication reminders and alerts'),
            notifications,
            (value) => updateSetting(NOTIFICATIONS_KEY, value, setNotifications, t('settings.notificationsUpdated', 'Notification preferences updated'))
          )}
          {renderSettingRow(
            'phone-portrait',
            t('settings.haptics', 'Haptic Feedback'),
            t('settings.hapticsDesc', 'Vibrate when scans complete successfully'),
            haptics,
            (value) => updateSetting(HAPTICS_KEY, value, setHaptics, t('settings.hapticsUpdated', 'Haptic feedback preferences updated'))
          )}
          {renderSettingRow(
            'moon',
            t('settings.darkMode', 'Dark Mode'),
            t('settings.darkModeDesc', 'Use dark theme (coming soon)'),
            darkMode,
            (value) => updateSetting(DARK_MODE_KEY, value, setDarkMode, t('settings.darkModeUpdated', 'Dark mode preferences updated')),
            true // Disabled for now
          )}
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.security', 'Security & Privacy')}</Text>
          {renderSettingRow(
            'finger-print',
            t('settings.biometric', 'Biometric Authentication'),
            t('settings.biometricDesc', 'Use fingerprint or face ID to unlock (coming soon)'),
            biometric,
            (value) => updateSetting(BIOMETRIC_KEY, value, setBiometric, t('settings.biometricUpdated', 'Biometric authentication preferences updated')),
            true // Disabled for now
          )}
          {renderSettingRow(
            'analytics',
            t('settings.telemetry', 'Anonymous Analytics'),
            t('settings.telemetryDesc', 'Share usage insights to help us improve'),
            telemetry,
            (value) => updateSetting(TELEMETRY_KEY, value, setTelemetry, t('settings.analyticsUpdated', 'Analytics preferences updated'))
          )}
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.language', 'Language')}</Text>
          <View style={styles.languageGrid}>
            {[
              { code: 'en', name: 'English', flag: '🇺🇸' },
              { code: 'fr', name: 'Français', flag: '🇫🇷' },
              { code: 'ar', name: 'العربية', flag: '🇸🇦' },
            ].map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.languageOptionActive
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  i18n.language === lang.code && styles.languageNameActive
                ]}>
                  {lang.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.support', 'Support & Legal')}</Text>
          {renderActionRow(
            'help-circle',
            t('settings.help', 'Help & FAQ'),
            t('settings.helpDesc', 'Get answers to common questions'),
            () => showSuccess(t('settings.helpComingSoon', 'Coming Soon'), t('settings.helpComingSoonDesc', 'Help center is coming soon'))
          )}
          {renderActionRow(
            'document-text',
            t('settings.privacy', 'Privacy Policy'),
            t('settings.privacyDesc', 'Learn how we protect your data'),
            () => openURL('https://example.com/privacy')
          )}
          {renderActionRow(
            'document',
            t('settings.terms', 'Terms of Service'),
            t('settings.termsDesc', 'Read our terms and conditions'),
            () => openURL('https://example.com/terms')
          )}
          {renderActionRow(
            'mail',
            t('settings.contact', 'Contact Support'),
            t('settings.contactDesc', 'Get help from our support team'),
            () => Linking.openURL('mailto:support@medlink.app')
          )}
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.account', 'Account')}</Text>
          {renderActionRow(
            'log-out',
            t('settings.signOut', 'Sign Out'),
            t('settings.signOutDesc', 'Sign out of your account'),
            handleSignOut,
            true
          )}
        </Card>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('settings.version', 'MedLink v{{version}}', { version: '1.0.0' })}</Text>
        <Text style={styles.footerText}>{t('settings.madeBy', 'Made with ❤️ by XHARA')}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  hero: {
    paddingTop: spacing.xxl * 1.2,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#fff',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  sectionCard: {
    gap: spacing.lg,
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginVertical: spacing.xs,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
  },
  languageGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  languageOption: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  languageOptionActive: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  languageNameActive: {
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
