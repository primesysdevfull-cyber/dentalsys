import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import LoadingScreen from '../components/LoadingScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="PatientDetail"
            component={PatientDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Detalhes do Paciente',
              headerTintColor: '#0d9488',
              headerStyle: { backgroundColor: '#f0fdfa' },
              headerTitleStyle: { color: '#0f172a', fontWeight: '600' },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
