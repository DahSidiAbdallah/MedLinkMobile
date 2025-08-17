
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Dashboard from './src/screens/Dashboard';
import DrugInfo from './src/screens/DrugInfo';
import Reminders from './src/screens/Reminders';
import UserProfile from './src/screens/UserProfile';
import Clinics from './src/screens/Clinics';
import FacilityDetail from './src/screens/FacilityDetail';
import { colors } from './src/theme';
import Login from './src/screens/Login';
import SplashScreen from './SplashScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/lib/firebase';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


type TabIconName =
  | 'home'
  | 'medkit'
  | 'notifications'
  | 'person'
  | 'business';

function getTabIconName(routeName: string): TabIconName {
  switch (routeName) {
    case 'DrugInfo':
      return 'medkit';
    case 'Reminders':
      return 'notifications';
    case 'UserProfile':
      return 'person';
    case 'Clinics':
      return 'business';
    default:
      return 'home';
  }
}


interface TabBarIconProps {
  readonly route: { name: string };
  readonly color: string;
  readonly size: number;
}

function TabBarIcon({ route, color, size }: TabBarIconProps) {
  const iconName = getTabIconName(route.name);
  return <Ionicons name={iconName} size={size} color={color} />;
}

function tabBarIconFactory(route: { name: string }) {
  return ({ color, size }: { color: string; size: number }) => (
    <TabBarIcon route={route} color={color} size={size} />
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
    return null; // or a loading spinner
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
          {() => (
            <Tab.Navigator
              initialRouteName="Dashboard"
              screenOptions={({ route }) => ({
                tabBarIcon: tabBarIconFactory(route),
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                headerShown: false,
                tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, elevation: 4 },
              })}
            >
              <Tab.Screen name="Dashboard" component={Dashboard} />
              <Tab.Screen name="DrugInfo" component={DrugInfo} />
              <Tab.Screen name="Reminders" component={Reminders} />
              <Tab.Screen name="Clinics" component={Clinics} />
              <Tab.Screen name="UserProfile" component={UserProfile} />
            </Tab.Navigator>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacilityDetail" component={FacilityDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}