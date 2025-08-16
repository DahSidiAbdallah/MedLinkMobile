
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Dashboard } from './src/components/Dashboard';
import { DrugInfo } from './src/components/DrugInfo';
import { ReminderList } from './src/components/ReminderList';
import { UserProfile } from './src/components/UserProfile';
import { DoctorsPharmacies } from './src/components/DoctorsPharmacies';

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
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#888',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="DrugInfo" component={DrugInfo} />
        <Tab.Screen name="Reminders" component={ReminderList} />
        <Tab.Screen name="DoctorsPharmacies" component={DoctorsPharmacies} options={{ title: 'Clinics' }} />
        <Tab.Screen name="UserProfile" component={UserProfile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}