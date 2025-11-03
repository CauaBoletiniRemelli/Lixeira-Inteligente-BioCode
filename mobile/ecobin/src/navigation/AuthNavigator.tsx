import React, { useState } from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'forgotPassword'>('login');

  if (currentScreen === 'forgotPassword') {
    return <ForgotPasswordScreen onBackToLogin={() => setCurrentScreen('login')} />;
  }

  return (
    <LoginScreen
      onNavigateToSignUp={() => setCurrentScreen('signup')}
      onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
    />
  );
};
