import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, PasswordInput } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface SensorWiFiSetupScreenProps {
    onBack: () => void;
    onSuccess: () => void;
    sensorId: string;
}

export const SensorWiFiSetupScreen: React.FC<SensorWiFiSetupScreenProps> = ({ 
    onBack, 
    onSuccess,
    sensorId 
}) => {
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const passwordInputRef = useRef<TextInput>(null);

    const handleConnect = async () => {
        if (!ssid.trim()) {
            alert('Por favor, digite o nome da rede Wi-Fi');
            return;
        }

        if (!password.trim()) {
            alert('Por favor, digite a senha');
            return;
        }

        setLoading(true);
        
        // Simular conexão
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="wifi" size={80} color={COLORS.success} />
                    </View>

                    <Text style={styles.title}>Conectar Sensor ao Wi-Fi</Text>
                    <Text style={styles.subtitle}>
                        Sensor ID: {sensorId}
                    </Text>

                    <View style={styles.form}>
                        <Text style={styles.label}>Rede Wi-Fi (SSID)</Text>
                        <Input
                            placeholder="Nome do Wi-Fi"
                            value={ssid}
                            onChangeText={setSsid}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            blurOnSubmit={false}
                        />

                        <Text style={styles.label}>Senha</Text>
                        <PasswordInput
                            ref={passwordInputRef}
                            placeholder="Senha"
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="done"
                        />

                        <Button
                            title={loading ? "Conectando..." : "Conectar e Salvar"}
                            onPress={handleConnect}
                            disabled={loading}
                            style={styles.connectButton}
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
    header: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    backButton: {
        padding: SPACING.xs,
        alignSelf: 'flex-start',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    form: {
        gap: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    connectButton: {
        marginTop: SPACING.lg,
    },
});
