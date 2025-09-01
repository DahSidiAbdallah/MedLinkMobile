
import React, { useState, useEffect } from 'react';
import './src/i18n';

import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();
  const height = 64;
  const totalHeight = height + insets.bottom;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: totalHeight, paddingBottom: insets.bottom, backgroundColor: 'transparent' }} accessibilityElementsHidden={false} importantForAccessibility="no-hide-descendants">
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          if (route.name === 'Barcode') {
            return (
              <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', top: -20 }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(route.name)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 36,
                    width: 72,
                    height: 72,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    elevation: 8,
                    transform: [{ translateY: -6 }],
                  }}
                >
                  {getTabIcon(route, state.index === index, '#fff', 28)}
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
                style={{ paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                {getTabIcon(route, state.index === index, state.index === index ? colors.primary : colors.muted, 28)}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}


export default function App() {
  const [showSplash, setShowSplash] = useState(true);

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

  // App content wrapped in LoadingProvider so any screen can register loads
  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <FontAndSplashLoader />
        {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent showSplash={showSplash} setShowSplash={setShowSplash} />}
        <GlobalLoader />
      </LoadingProvider>
    </SafeAreaProvider>
  );


// Move FontAndSplashLoader out of App to avoid nested component definition
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
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </NotificationsProvider>
    </RemindersProvider>
  );
}
  // AppContent handles authenticated app rendering; the duplicate block was removed to avoid
  // rendering the app twice which could cause overlays and status-bar issues.
}

// removed earlier MainTabs variant that accepted onLogout prop; using the simpler MainTabs below

function MainTabs() {
  return (
  <Tab.Navigator initialRouteName="Dashboard" tabBar={TabBarRenderer} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Reminders" component={Reminders} />
      <Tab.Screen name="Barcode" component={BarcodeScanner} options={{ tabBarLabel: '' }} />
  <Tab.Screen name="Settings" component={Settings} />
      <Tab.Screen name="Clinics" component={Clinics} />
      <Tab.Screen name="UserProfile" component={UserProfile} />
    </Tab.Navigator>
  );
}

// Top-level wrapper so we don't create a new component inline in JSX (avoids lint/runtime issues)
function TabBarRenderer(props: Readonly<BottomTabBarProps>) {
  return <CustomTabBar {...props} />;
}