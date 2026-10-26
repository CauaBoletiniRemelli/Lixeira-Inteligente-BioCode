import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { COLORS } from './src/constants';
import Constants from 'expo-constants';
import { notificationService } from './src/services/notificationService';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
let OneSignal: any = null;
let LogLevel: any = null;
if (!isExpoGo) {
  try {
    const os = require('react-native-onesignal');
    OneSignal = os.OneSignal;
    LogLevel = os.LogLevel;
  } catch {
  }
}


function AppContent() {
  const { isAuthenticated, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        if (!OneSignal) return;

        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        
        OneSignal.initialize('72d3902a-cb02-48c9-b1f4-fd4faea52430');
        
        await notificationService.initialize();
        
        setTimeout(async () => {
          const hasPermission = await OneSignal.Notifications.requestPermission(true);
          console.log('[OneSignal] Permissão concedida:', hasPermission);
        }, 1000);
      } catch (error) {
        console.error('[OneSignal] Erro ao inicializar:', error);
      }
    };

    initializeOneSignal();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
