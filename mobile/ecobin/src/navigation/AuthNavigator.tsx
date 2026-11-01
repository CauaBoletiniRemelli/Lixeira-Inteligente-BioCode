import React, { useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

export const AuthNavigator: React.FC = () => {
    const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'forgotPassword'>('login');

    useEffect(() => {
        const backAction = () => {
            if (currentScreen === 'forgotPassword') {
                setCurrentScreen('login');
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [currentScreen]);

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
