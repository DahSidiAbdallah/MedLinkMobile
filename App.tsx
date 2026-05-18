import React, { useState, useEffect } from 'react';
// Statically import i18n to avoid dynamic import issues on some Hermes/native setups
// This file performs i18n initialization (language detector, resource registration).
try {
  // eslint-disable-next-line import/no-unassigned-import
  require('./src/i18n');
} catch (e) {
  // If i18n fails to load, log and continue — UI will render with defaults.
  // eslint-disable-next-line no-console
  console.warn('i18n static import failed, continuing without translations:', e);
}
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, Platform, Text, Dimensions, StatusBar, Pressable } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import Dashboard from './src/screens/Dashboard';
import Reminders from './src/screens/Reminders';
import UserProfile from './src/screens/UserProfile';
import Clinics from './src/screens/Clinics';
import FacilityDetail from './src/screens/FacilityDetail';
import BarcodeScanner from './src/screens/BarcodeScanner';
import Settings from './src/screens/Settings';
import { colors, spacing, radius, shadow, animation } from './src/theme';
import Login from './src/screens/Login';
import SplashScreen from './src/components/SplashScreen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/lib/firebase';
import { RemindersProvider } from './src/hooks/RemindersContext';
import { NotificationsProvider } from './src/notifications/NotificationsContext';
import { LoadingProvider } from './src/hooks/LoadingContext';
import { ToastProvider } from './src/hooks/useToast';
import GlobalLoader from './src/components/GlobalLoader';
import { createTelemetryService, setTelemetryService } from './src/core/telemetryService';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeAuthPersistence, initializeAuthQuick, persistAuth, debugAuthState, restoreAuthFromStorage, clearStoredAuth } from './src/lib/authPersistence';
import { useOnboarding } from './src/hooks/useOnboarding';
import OnboardingFlow from './src/components/OnboardingFlow';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const getTabIcon = (route: { name: string }, focused: boolean, color: string, size: number) => {
  switch (route.name) {
    case 'Dashboard':
      return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />;
    case 'Reminders':
      return <Ionicons name={focused ? "notifications" : "notifications-outline"} size={size} color={color} />;
    case 'Barcode':
      return (
        <MaterialCommunityIcons
          name="barcode-scan"
          size={size + 8}
          color="#fff"
        />
      );
    case 'Clinics':
      return <Ionicons name={focused ? "location" : "location-outline"} size={size} color={color} />;
    case 'UserProfile':
      return <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />;
    default:
      return null;
  }
};

import { useTranslation } from 'react-i18next';

function CustomTabBar(props: Readonly<BottomTabBarProps>) {
  const { state, navigation } = props;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const windowHeight = Platform.OS === 'web' && typeof window !== 'undefined'
    ? (window as any).innerHeight
    : Dimensions.get('window').height;
  const compact = windowHeight < 620;
  const fabSize = compact ? 60 : 68;
  const iconSize = compact ? 22 : 24;
  const labelFont = 11;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 16,
        paddingHorizontal: 16,
        ...(Platform.OS === 'ios' && {
          backgroundColor: 'rgba(255,255,255,0.98)',
        }),
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: compact ? 56 : 60,
      }}>
        {state.routes.map((route, index) => {
          let label = '';
          switch (route.name) {
            case 'Dashboard': label = t('navigation.dashboard', 'Home'); break;
            case 'Reminders': label = t('navigation.reminders', 'Schedule'); break;
            case 'Barcode': label = t('navigation.scanner', 'Scan'); break;
            case 'Clinics': label = t('navigation.clinics', 'Clinics'); break;
            case 'UserProfile': label = t('navigation.profile', 'Profile'); break;
            default: label = route.name;
          }

          const isFocused = state.index === index;
          const isBarcode = route.name === 'Barcode';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (isBarcode) {
            return (
              <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.85}
                  style={{
                    width: fabSize,
                    height: fabSize,
                    borderRadius: fabSize / 2,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: -(fabSize / 2) - 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 12,
                    borderWidth: 4,
                    borderColor: '#fff',
                  }}
                >
                  {getTabIcon(route, isFocused, '#fff', iconSize + 6)}
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                gap: 6,
              }}
            >
              <View style={{
                width: 48,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? colors.primary50 : 'transparent',
              }}>
                {getTabIcon(route, isFocused, isFocused ? colors.primary : colors.textTertiary, iconSize)}
              </View>
              <Text style={{
                fontSize: labelFont,
                fontWeight: isFocused ? '600' : '500',
                color: isFocused ? colors.primary : colors.textTertiary,
                letterSpacing: 0.2,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Reminders" component={Reminders} />
      <Tab.Screen name="Barcode" component={BarcodeScanner} />
      <Tab.Screen name="Clinics" component={Clinics} />
      <Tab.Screen name="UserProfile" component={UserProfile} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="FacilityDetail" 
          component={FacilityDetail}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={Settings}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Always call hooks in the same order
  const { isOnboardingCompleted, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();

  // Set a timeout for loading to show manual continue option
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleManualContinue = () => {
    console.log('Manual continue pressed, proceeding without auth');
    setUser(null);
    setAuthInitialized(true);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Initialize telemetry service
        const telemetryService = createTelemetryService();
        setTelemetryService(telemetryService);

        // Try quick auth initialization first
        console.log('Starting auth initialization...');
        await debugAuthState(); // Debug current state
        
        let restoredUser: User | null = null;
        
        try {
          restoredUser = await initializeAuthQuick();
          
          // If quick auth didn't work but we have stored auth, try manual restoration
          if (!restoredUser) {
            const manualUser = await restoreAuthFromStorage();
            if (manualUser) {
              console.log('Manually restored user from storage');
              restoredUser = manualUser;
            }
          }
        } catch (error) {
          console.warn('Quick auth failed, trying full initialization:', error);
          // Fallback to full initialization
          try {
            restoredUser = await initializeAuthPersistence();
          } catch (fullError) {
            console.error('Full auth initialization failed:', fullError);
            // Last resort: try manual restoration
            restoredUser = await restoreAuthFromStorage();
          }
        }
        
        if (isMounted) {
          console.log('Auth initialization complete, user:', restoredUser ? 'found' : 'not found');
          setUser(restoredUser);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        if (isMounted) {
          setAuthInitialized(true);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    // Listen for auth state changes after initialization - but be less aggressive
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isMounted && authInitialized) {
        console.log('Auth state changed:', firebaseUser ? 'user signed in' : 'user signed out');
        
        if (firebaseUser) {
          // User signed in - persist and update state
          setUser(firebaseUser);
          await persistAuth(firebaseUser);
        } else {
          // Firebase reports no user - clear user state to show login screen
          console.log('Firebase reports no user, clearing user state');
          setUser(null);
          await clearStoredAuth();
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [authInitialized]);

  // Show splash screen first
  if (showSplash) {
    return (
      <SplashScreen 
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  if (isLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Skeleton header */}
        <View style={{ paddingTop: 60, paddingHorizontal: spacing.xl, gap: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: spacing.sm }}>
              <View style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: colors.skeleton }} />
              <View style={{ width: 180, height: 28, borderRadius: 8, backgroundColor: colors.skeleton }} />
            </View>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.skeleton }} />
          </View>
          {/* Search bar skeleton */}
          <View style={{ height: 52, borderRadius: radius.xxl, backgroundColor: colors.skeleton }} />
          {/* Hero card skeleton */}
          <View style={{ height: 160, borderRadius: radius.xxl, backgroundColor: colors.skeleton }} />
          {/* Category strip skeleton */}
          <View style={{ flexDirection: 'row', gap: spacing.lg, justifyContent: 'space-between' }}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={{ alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.skeleton }} />
                <View style={{ width: 44, height: 12, borderRadius: 6, backgroundColor: colors.skeleton }} />
              </View>
            ))}
          </View>
          {/* Cards skeleton */}
          <View style={{ height: 100, borderRadius: radius.xxl, backgroundColor: colors.skeleton }} />
          <View style={{ height: 100, borderRadius: radius.xxl, backgroundColor: colors.skeleton }} />
        </View>
        {loadingTimeout && (
          <View style={{ position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', gap: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
              Taking longer than expected?
            </Text>
            <Pressable
              onPress={handleManualContinue}
              style={{
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('common.continue', 'Continue')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  // Show onboarding for new users
  if (!isOnboardingCompleted) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  return (
    <RemindersProvider>
      <NotificationsProvider>
        <AppNavigator />
        <GlobalLoader />
      </NotificationsProvider>
    </RemindersProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LoadingProvider>
          <ToastProvider>
            <StatusBar 
              barStyle="dark-content" 
              backgroundColor={colors.bg}
              translucent={false}
            />
            <AppContent />
          </ToastProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}