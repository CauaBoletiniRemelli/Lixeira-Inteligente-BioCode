import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Input, PasswordInput } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING } from '../constants';
import { isValidEmail } from '../utils';

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

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');

        let hasError = false;

        if (!email) {
            setEmailError('Email é obrigatório');
            hasError = true;
        } else if (!isValidEmail(email)) {
            setEmailError('Email inválido');
            hasError = true;
        }

        if (!password) {
            setPasswordError('Senha é obrigatória');
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError('Senha deve ter no mínimo 6 caracteres');
            hasError = true;
        }

        if (hasError) return;

        try {
            await login(email, password);
        } catch (error) {
            Alert.alert('Erro', 'Falha ao fazer login. Verifique suas credenciais.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                                onSubmitEditing={handleLogin}
                            />

                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={onNavigateToForgotPassword || (() => Alert.alert('Recuperar Senha', 'Funcionalidade em desenvolvimento'))}
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
        paddingTop: SPACING.md * 1.5,
    },
    logo: {
        width: 200,
        height: 200,
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
