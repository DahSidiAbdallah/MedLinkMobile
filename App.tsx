
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Dashboard from './src/screens/Dashboard';
import DrugInfo from './src/screens/DrugInfo';
import Reminders from './src/screens/Reminders';
import UserProfile from './src/screens/UserProfile';
import DoctorsPharmacies from './src/screens/DoctorsPharmacies';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = 'home';
            if (route.name === 'DrugInfo') iconName = 'medkit';
            if (route.name === 'Reminders') iconName = 'notifications';
            if (route.name === 'UserProfile') iconName = 'person';
            if (route.name === 'DoctorsPharmacies') iconName = 'business';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, elevation: 4 },
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="DrugInfo" component={DrugInfo} />
        <Tab.Screen name="Reminders" component={Reminders} />
        <Tab.Screen name="DoctorsPharmacies" component={DoctorsPharmacies} options={{ title: 'Clinics' }} />
        <Tab.Screen name="UserProfile" component={UserProfile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}