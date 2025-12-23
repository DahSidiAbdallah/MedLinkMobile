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
import { View, TouchableOpacity, ActivityIndicator, Platform, Text, Dimensions, StatusBar, Pressable } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import Dashboard from './src/screens/Dashboard';
import Reminders from './src/screens/Reminders';
import UserProfile from './src/screens/UserProfile';
import Clinics from './src/screens/Clinics';
import FacilityDetail from './src/screens/FacilityDetail';
import BarcodeScanner from './src/screens/BarcodeScanner';
import Settings from './src/screens/Settings';
import { colors, shadow, radius, spacing } from './src/theme';
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
  const { state, navigation, descriptors } = props;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const baseHeight = 72;
  const windowHeight = Platform.OS === 'web' && typeof window !== 'undefined'
    ? (window as any).innerHeight
    : Dimensions.get('window').height;
  const ultraCompact = windowHeight < 540;
  const compact = windowHeight < 620 && !ultraCompact;
  const fabSize = compact ? 68 : 76;
  const iconSize = compact ? 22 : 24;
  const labelFont = compact ? 11 : 12;

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
        paddingBottom: insets.bottom,
        paddingTop: spacing.md,
        // Modern flat design
        ...(Platform.OS === 'ios' && {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }),
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        height: baseHeight - spacing.md,
      }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Get translated label
          let label = '';
          switch (route.name) {
            case 'Dashboard':
              label = t('navigation.dashboard', 'Dashboard');
              break;
            case 'Reminders':
              label = t('navigation.reminders', 'Reminders');
              break;
            case 'Barcode':
              label = t('navigation.scanner', 'Scanner');
              break;
            case 'Clinics':
              label = t('navigation.clinics', 'Clinics');
              break;
            case 'UserProfile':
              label = t('navigation.profile', 'Profile');
              break;
            default:
              label = route.name;
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
                  style={{
                    width: fabSize,
                    height: fabSize,
                    borderRadius: fabSize / 2,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: -spacing.lg - 4,
                    // Modern flat design
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
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
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.sm,
                gap: 6,
                borderRadius: radius.md,
                // Modern active state
                backgroundColor: isFocused ? `${colors.primary}15` : 'transparent',
                marginHorizontal: 4,
              }}
            >
              {getTabIcon(route, isFocused, isFocused ? colors.primary : colors.muted, iconSize)}
              <Text
                style={{
                  fontSize: labelFont,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? colors.primary : colors.muted,
                  letterSpacing: 0.2,
                }}
              >
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
          // Firebase reports no user, but don't immediately clear our stored auth
          // Only clear if we're sure the user actually signed out
          console.log('Firebase reports no user, but keeping stored auth for now');
          // Don't automatically clear stored auth or set user to null
          // Let the user try to use the app with stored auth
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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.bg,
        padding: spacing.xl,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: spacing.lg, 
          color: colors.text, 
          fontSize: 16,
          textAlign: 'center',
        }}>
          {isLoading ? 'Initializing app...' : 'Loading...'}
        </Text>
        {loadingTimeout && (
          <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <Text style={{ 
              color: colors.muted, 
              fontSize: 14,
              textAlign: 'center',
              marginBottom: spacing.md,
            }}>
              Taking longer than expected?
            </Text>
            <Pressable
              onPress={handleManualContinue}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                backgroundColor: colors.primary,
                borderRadius: radius.md,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Continue
              </Text>
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