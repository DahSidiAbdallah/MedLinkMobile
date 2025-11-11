
import React, { useState, useEffect } from 'react';
// i18n initialization can perform async work and access storage.
// Lazy-load it during startup to avoid module-evaluation side-effects
// that may run before AppRegistry.registerComponent is called.
// This prevents runtime failures on some runtimes (Hermes) where
// certain modules or native bindings may not be ready yet.

import * as Font from 'expo-font';
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
import { View, TouchableOpacity, ActivityIndicator, Platform, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import Dashboard from './src/screens/Dashboard';
import Reminders from './src/screens/Reminders';

import UserProfile from './src/screens/UserProfile';
import Clinics from './src/screens/Clinics';
import FacilityDetail from './src/screens/FacilityDetail';
import BarcodeScanner from './src/screens/BarcodeScanner';
import Settings from './src/screens/Settings';
import { colors } from './src/theme';
import Login from './src/screens/Login';
import SplashScreen from './SplashScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/lib/firebase';
import { RemindersProvider } from './src/hooks/RemindersContext';
import { NotificationsProvider } from './src/notifications/NotificationsContext';
import { LoadingProvider, useLoading } from './src/hooks/LoadingContext';
import GlobalLoader from './src/components/GlobalLoader';
import { createTelemetryService, setTelemetryService } from './src/core/telemetryService';
import ErrorBoundary from './src/components/ErrorBoundary';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


const getTabIcon = (route: { name: string }, focused: boolean, color: string, size: number) => {
  switch (route.name) {
    case 'Dashboard':
      return <Ionicons name="home" size={size} color={color} />;
    case 'Reminders':
      return <Ionicons name="notifications" size={size} color={color} />;
    case 'Barcode':
      return (
        <MaterialCommunityIcons
          name="barcode-scan"
          size={size + 10}
          color="#fff"
        />
      );
    case 'Clinics':
      return <Ionicons name="business" size={size} color={color} />;
    case 'UserProfile':
      return <Ionicons name="person" size={size} color={color} />;
    default:
      return null;
  }
};

function CustomTabBar(props: Readonly<BottomTabBarProps>) {
  const { state, navigation, descriptors } = props;
  const insets = useSafeAreaInsets();
  const baseHeight = 64;
  const totalHeight = baseHeight + insets.bottom;
  const windowHeight = Platform.OS === 'web' && typeof window !== 'undefined'
    ? (window as any).innerHeight
    : Dimensions.get('window').height;
  const ultraCompact = windowHeight < 540;
  const compact = windowHeight < 620 && !ultraCompact;
  const fabSize = compact ? 62 : 70;
  const iconSize = compact ? 22 : 24;
  const labelFont = compact ? 11 : 12;
  const barcodeRoute = state.routes.find(r => r.name === 'Barcode');

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: totalHeight,
        paddingBottom: insets.bottom,
        backgroundColor: 'transparent',
      }}
      accessibilityElementsHidden={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          height: baseHeight,
          marginHorizontal: 16,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderWidth: Platform.OS === 'web' ? 0 : 1,
          borderColor: colors.line,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          shadowColor: 'rgba(15,23,42,0.2)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
          elevation: 12,
          position: 'relative',
          overflow: 'visible',
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(14px)',
                backgroundColor: 'rgba(255,255,255,0.92)',
                boxShadow: '0 16px 36px rgba(37, 99, 235, 0.14)',
              } as any)
            : null),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {state.routes.map((route) => {
            if (route.name === 'Barcode') {
              return <View key={`${route.key}-spacer`} style={{ width: fabSize }} />;
            }
            const isActive = state.routeNames[state.index] === route.name;
            const rawLabel =
              descriptors[route.key]?.options?.tabBarLabel ??
              descriptors[route.key]?.options?.title ??
              route.name;
            const label = typeof rawLabel === 'string' ? rawLabel : route.name;
            return (
              <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(route.name)}
                  activeOpacity={0.85}
                  style={{
                    width: '100%',
                    maxWidth: 110,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: compact ? 6 : 8,
                    paddingHorizontal: 10,
                    borderRadius: 18,
                    backgroundColor: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                    ...(Platform.OS === 'web' && !isActive
                      ? ({ transition: 'all 160ms ease' } as any)
                      : null),
                  }}
                >
                  {getTabIcon(route, isActive, isActive ? colors.primary : colors.muted, iconSize)}
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: labelFont,
                      color: isActive ? colors.primary : colors.muted,
                      fontWeight: isActive ? ('600' as const) : ('500' as const),
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {barcodeRoute ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: '50%',
              top: ultraCompact ? -12 : -Math.max(22, fabSize / 2),
              marginLeft: -(fabSize / 2),
              zIndex: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate(barcodeRoute.name)}
              accessibilityRole="button"
              accessibilityLabel="Open barcode scanner"
              activeOpacity={0.9}
              style={{
                backgroundColor: colors.primary,
                borderRadius: fabSize / 2,
                width: fabSize,
                height: fabSize,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.28,
                shadowRadius: 18,
                elevation: 16,
                borderWidth: 4,
                borderColor: colors.card,
                ...(Platform.OS === 'web'
                  ? ({ boxShadow: '0 18px 34px rgba(37,99,235,0.35)' } as any)
                  : null),
              }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={compact ? 30 : 34} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}


export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // We statically imported i18n above; assume ready. Components that need translations
  // should guard via react-i18next hooks (useSuspense:false is configured).
  const [i18nReady] = useState(true);

  // IMPORTANT: Effects below must run on every render cycle regardless of i18n readiness
  // to keep the Hooks order stable across renders.
  useEffect(() => {
    // Initialize telemetry service on app startup. This avoids module-import side effects
    const svc = createTelemetryService({ endpoint: 'https://example.com/telemetry' })
    svc.init().catch(() => {})
    setTelemetryService(svc)
    return () => {
      try { svc.shutdown() } catch (e) {}
    }
  }, [])

  useEffect(() => {
    let unsub: any = null;
    unsub = onAuthStateChanged(auth, () => {
      // auth state is handled inside AppContent
    });
    return () => unsub?.();
  }, []);

  if (!i18nReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  // App content wrapped in LoadingProvider so any screen can register loads
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LoadingProvider>
          <FontAndSplashLoader />
          {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent showSplash={showSplash} setShowSplash={setShowSplash} />}
          <GlobalLoader />
        </LoadingProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );

}
// AppContent handles authenticated app rendering; the duplicate block was removed to avoid
// rendering the app twice which could cause overlays and status-bar issues.

// Move FontAndSplashLoader and AppContent out of App to avoid nested component definition
function FontAndSplashLoader() {
  const { startLoading, finishLoading } = useLoading();
  useEffect(() => {
    const key = 'fonts';
    startLoading(key);
    let mounted = true;
    Font.loadAsync({
      ...Ionicons.font,
      ...MaterialCommunityIcons.font,
    }).then(() => {
      if (mounted) {
        // nothing here — App manages splash state
      }
    }).finally(() => finishLoading(key));
    return () => { mounted = false; };
  }, [startLoading, finishLoading]);
  return null;
}

function AppContent({ showSplash, setShowSplash }: Readonly<{ showSplash: boolean; setShowSplash: (v: boolean) => void }>) {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  return (
    <RemindersProvider>
      <NotificationsProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
                <Stack.Screen name="FacilityDetail" component={FacilityDetail} />
                <Stack.Screen name="Settings" component={Settings} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </NotificationsProvider>
    </RemindersProvider>
  );
}

// removed earlier MainTabs variant that accepted onLogout prop; using the simpler MainTabs below

function MainTabs() {
  return (
  <Tab.Navigator initialRouteName="Dashboard" tabBar={TabBarRenderer} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Reminders" component={Reminders} />
    <Tab.Screen name="Barcode" component={BarcodeScanner} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Clinics" component={Clinics} />
      <Tab.Screen name="UserProfile" component={UserProfile} />
    </Tab.Navigator>
  );
}

// Top-level wrapper so we don't create a new component inline in JSX (avoids lint/runtime issues)
function TabBarRenderer(props: Readonly<BottomTabBarProps>) {
  return <CustomTabBar {...props} />;
}