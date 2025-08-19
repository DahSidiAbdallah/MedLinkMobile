
import React, { useState, useEffect, useCallback } from 'react';

import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Dashboard from './src/screens/Dashboard';
import DrugInfo from './src/screens/DrugInfo';
import Reminders from './src/screens/Reminders';

import UserProfile from './src/screens/UserProfile';
import Clinics from './src/screens/Clinics';
import FacilityDetail from './src/screens/FacilityDetail';
import BarcodeScanner from './src/screens/BarcodeScanner';
import { colors } from './src/theme';
import Login from './src/screens/Login';
import SplashScreen from './SplashScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/lib/firebase';
import { RemindersProvider } from './src/hooks/RemindersContext';
import { NotificationsProvider } from './src/notifications/NotificationsContext';


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

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent' }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 64,
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
              <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', top: -24 }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(route.name)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 40,
                    width: 64,
                    height: 64,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  {getTabIcon(route, state.index === index, '#fff', 32)}
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
    </SafeAreaView>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function prepare() {
      await Font.loadAsync({
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
      });
      setShowSplash(false);
    }
    prepare();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
  <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
              {() => (
                <Tab.Navigator
                  initialRouteName="Dashboard"
                  tabBar={props => <CustomTabBar {...props} />}
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Tab.Screen name="Dashboard" component={Dashboard} />
                  <Tab.Screen name="Reminders" component={Reminders} />
                  <Tab.Screen name="Barcode" component={BarcodeScanner} options={{ tabBarLabel: '' }} />
                  <Tab.Screen name="Clinics" component={Clinics} />
                  <Tab.Screen name="UserProfile">
                    {props => <UserProfile {...props} onLogout={() => setUser(null)} />}
                  </Tab.Screen>
                </Tab.Navigator>
              )}
            </Stack.Screen>
            <Stack.Screen name="FacilityDetail" component={FacilityDetail} />
          </Stack.Navigator>
        </NavigationContainer>
      </NotificationsProvider>
    </RemindersProvider>
  );
}