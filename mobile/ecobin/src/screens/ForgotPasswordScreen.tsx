import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, HeaderWithLogo, Input } from '../components';
import { COLORS, SPACING } from '../constants';
import { isValidEmail } from '../utils';

interface ForgotPasswordScreenProps {
    onBackToLogin?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRecoverPassword = async () => {
        setEmailError('');

        if (!email) {
            setEmailError('Email é obrigatório');
            return;
        } else if (!isValidEmail(email)) {
            setEmailError('Email inválido');
            return;
        }

        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                'Email Enviado!',
                'Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada.',
                [
                    {
                        text: 'OK',
                        onPress: onBackToLogin,
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Erro', 'Falha ao enviar email de recuperação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="never"
                >
                    <HeaderWithLogo onBackPress={onBackToLogin} />

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
                            title="Solicitar Recuperação"
                            onPress={handleRecoverPassword}
                            loading={loading}
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
        paddingBottom: SPACING.lg,
    },
            logoContainer: {
                alignItems: 'center',
            justifyContent: 'center',
            paddingTop: SPACING.xl,
            paddingBottom: SPACING.xxl,
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