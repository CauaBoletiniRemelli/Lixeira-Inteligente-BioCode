import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Input, PasswordInput } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING } from '../constants';
import { isValidEmail } from '../utils';
import { handleApiError, showApiAlert } from '../utils';
import Alerta from '../components/Alert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LOGO_SIZE = Math.min(180, SCREEN_WIDTH * 0.45);

interface LoginScreenProps {
    onNavigateToSignUp?: () => void;
    onNavigateToForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp, onNavigateToForgotPassword }) => {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const passwordInputRef = useRef<TextInput>(null);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');

        let hasError = false;

        if (!email) {
            setEmailError('E-mail é obrigatório');
            hasError = true;
        } else if (!isValidEmail(email)) {
            setEmailError('Email inválido');
            hasError = true;
        }

        if (!password) {
            setPasswordError('Senha é obrigatória');
            hasError = true;
        } 

        if (hasError) return;

        try {
            await login(email, password);
        } catch (error: any) {
            showAlert(error.message || 'Falha ao fazer login. Verifique suas credenciais e tente novamente.', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar style="dark" />
            <Alerta message={alertMessage} type={alertType} visible={alertVisible} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/EcoBinLogoVerdeCompleta.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.welcomeText}>Fazer Login</Text>
                            <Text style={styles.subtitleText}>
                                Insira seu e-mail e senha para realizar o login.
                            </Text>
                        </View>

                        <View style={styles.inputsContainer}>
                            <Input
                                label="Email"
                                placeholder="seu@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={emailError}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                blurOnSubmit={false}
                            />

                            <PasswordInput
                                ref={passwordInputRef}
                                label="Senha"
                                placeholder="Digite sua senha"
                                value={password}
                                onChangeText={setPassword}
                                error={passwordError}
                                returnKeyType="done"
                            />

                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={onNavigateToForgotPassword}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    Esqueceu sua senha?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title="Login"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.lg,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SCREEN_HEIGHT * 0.04,
        paddingBottom: SPACING.xs,
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    headerTextContainer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    subtitleText: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    inputsContainer: {
        marginBottom: SPACING.md,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginTop: SPACING.xs,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: "#00000",
        fontWeight: '600',
    },
    loginButton: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    registerText: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    registerLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
});
