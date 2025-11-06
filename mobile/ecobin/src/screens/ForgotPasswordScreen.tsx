import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, HeaderWithLogo, Input } from '../components';
import { COLORS, SPACING } from '../constants';
import { isValidEmail } from '../utils';
import Alerta from '../components/Alert';
import { authService } from '../services';

interface ForgotPasswordScreenProps {
    onBackToLogin?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recovering, setRecovering] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const handleRecoverPassword = async () => {
        if (recovering) return;

        setEmailError('');

        if (!email) {
            setEmailError('Email é obrigatório');
            return;
        } else if (!isValidEmail(email)) {
            setEmailError('Email inválido');
            return;
        }

        try {
            setRecovering(true);
            setLoading(true);
            await authService.forgotPassword({ usuEmail: email });
            showAlert('Caso o e-mail esteja cadastrado, você receberá instruções para recuperar sua senha.', 'success');
        } catch (error) {
            showAlert('Falha ao enviar email de recuperação. Tente novamente.', 'error');
        } finally {
            setLoading(false);
            setRecovering(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <Alerta message={alertMessage} type={alertType} visible={alertVisible} />
            <HeaderWithLogo onBackPress={onBackToLogin} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="never"
                >
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/EcoBinLogoVerdeCompleta.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>Recuperar Senha</Text>
                        <Text style={styles.subtitle}>
                            Insira seu e-mail para iniciar a recuperação de senha
                        </Text>

                        <View style={styles.inputContainer}>
                            <Input
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={emailError}
                            />
                        </View>

                        <Button
                            title={recovering ? "Enviando..." : "Solicitar Recuperação"}
                            onPress={handleRecoverPassword}
                            loading={recovering}
                            disabled={recovering}
                            style={styles.recoverButton}
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
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SPACING.md,
    },
    logo: {
        width: 200,
        height: 200,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
        paddingHorizontal: SPACING.sm,
    },
    inputContainer: {
        marginBottom: SPACING.md,
    },
    recoverButton: {
        marginTop: SPACING.md,
    },
});