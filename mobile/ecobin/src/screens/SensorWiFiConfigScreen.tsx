import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, PasswordInput, BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { provisionamentoService, deviceService } from '../services';
import { QRCodeData } from './QRCodeScannerScreen';
import { SensorFormData } from './SensorFormScreen';
import Alerta from '../components/Alert';

interface SensorWiFiConfigScreenProps {
    onBack: () => void;
    onSuccess: () => void;
    sensorData: SensorFormData;
    qrData: QRCodeData;
}

export const SensorWiFiConfigScreen: React.FC<SensorWiFiConfigScreenProps> = ({ 
    onBack, 
    onSuccess,
    sensorData,
    qrData
}) => {
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'wifi' | 'connecting' | 'success'>('wifi');
    
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const passwordInputRef = useRef<TextInput>(null);

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const handleConnect = async () => {
        if (!ssid.trim()) {
            showAlert('Digite o nome da rede Wi-Fi', 'error');
            return;
        }

        if (!password.trim()) {
            showAlert('Digite a senha da rede Wi-Fi', 'error');
            return;
        }

        try {
            setLoading(true);
            setStep('connecting');

            console.log('🔄 Ativando provisionamento...');
            
            // Passo 1: Ativar o provisionamento
            const ativarResponse = await provisionamentoService.ativarQR({
                provisionId: qrData.provisionId,
                deviceId: qrData.deviceId,
                token: qrData.token,
                condominioId: sensorData.condominioId,
                nomeSensor: sensorData.nomeSensor,
                latitude: sensorData.latitude,
                longitude: sensorData.longitude,
                wifiSSID: ssid.trim(),
                wifiPassword: password.trim(),
            });

            if (!ativarResponse.status || !ativarResponse.dados) {
                throw new Error(ativarResponse.mensagem || 'Erro ao ativar provisionamento');
            }

            const { sessionToken, deviceId } = ativarResponse.dados;
            
            console.log('✅ Provisionamento ativado!');
            console.log('🔑 Session Token:', sessionToken);

            // Passo 2: Simular que o dispositivo busca as credenciais WiFi
            // (Na prática, o dispositivo faz isso automaticamente via AP)
            console.log('📡 Dispositivo buscando credenciais WiFi...');
            
            // Aguardar um pouco para simular o processo
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Passo 3: Confirmar configuração
            console.log('✅ Confirmando configuração do dispositivo...');
            
            const confirmResponse = await deviceService.confirmConfig(deviceId, {
                deviceId: deviceId,
                sessionToken: sessionToken,
                success: true,
            });

            if (!confirmResponse.status) {
                throw new Error(confirmResponse.mensagem || 'Erro ao confirmar configuração');
            }

            console.log('🎉 Sensor configurado com sucesso!');
            
            setStep('success');
            
            // Aguardar um pouco e ir para a tela de sucesso
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (error: any) {
            console.error('❌ Erro ao configurar sensor:', error);
            let errorMessage = 'Erro ao configurar sensor. Tente novamente.';
            
            if (error.response?.data?.mensagem) {
                errorMessage = error.response.data.mensagem;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showAlert(errorMessage, 'error');
            setStep('wifi');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'connecting') {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <View style={styles.centerContainer}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingTitle}>Configurando Sensor</Text>
                        <Text style={styles.loadingSubtitle}>
                            Estamos conectando o sensor à rede WiFi...
                        </Text>
                        <View style={styles.stepsContainer}>
                            <View style={styles.stepItem}>
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                <Text style={styles.stepText}>QR Code escaneado</Text>
                            </View>
                            <View style={styles.stepItem}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.stepText}>Conectando ao WiFi</Text>
                            </View>
                            <View style={styles.stepItem}>
                                <Ionicons name="ellipse-outline" size={24} color={COLORS.text.secondary} />
                                <Text style={[styles.stepText, { color: COLORS.text.secondary }]}>
                                    Finalizando configuração
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'success') {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <View style={styles.centerContainer}>
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
                        </View>
                        <Text style={styles.successTitle}>Sensor Configurado!</Text>
                        <Text style={styles.successSubtitle}>
                            O sensor foi conectado com sucesso à rede WiFi e está pronto para uso.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <Alerta message={alertMessage} type={alertType} visible={alertVisible} />

            <View style={styles.header}>
                <BackButton onPress={onBack} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="wifi" size={80} color={COLORS.primary} />
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Configurar Rede WiFi</Text>
                        <Text style={styles.subtitle}>
                            Configure a rede WiFi que o sensor irá utilizar
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="hardware-chip" size={20} color={COLORS.primary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Sensor:</Text>
                                <Text style={styles.infoValue}>{sensorData.nomeSensor}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="home" size={20} color={COLORS.primary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Condomínio:</Text>
                                <Text style={styles.infoValue}>{sensorData.condominioNome}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Coordenadas:</Text>
                                <Text style={styles.infoValue}>
                                    {sensorData.latitude.toFixed(6)}, {sensorData.longitude.toFixed(6)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Nome da Rede (SSID):</Text>
                        <Input
                            value={ssid}
                            onChangeText={setSsid}
                            placeholder="MinhaRedeWiFi"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            blurOnSubmit={false}
                        />

                        <PasswordInput
                            ref={passwordInputRef}
                            value={password}
                            onChangeText={setPassword}
                            label="Senha da Rede:"
                            placeholder="********"
                            returnKeyType="done"
                            onSubmitEditing={handleConnect}
                        />

                        <View style={styles.warningCard}>
                            <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                            <Text style={styles.warningText}>
                                Certifique-se de que a rede WiFi está disponível e as credenciais estão corretas.
                            </Text>
                        </View>

                        <Button
                            title="Conectar Sensor"
                            onPress={handleConnect}
                            loading={loading}
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
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xs,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        gap: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.text.secondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
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
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.warning}15`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.warning,
        marginTop: SPACING.sm,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text.primary,
    },
    connectButton: {
        marginTop: SPACING.lg,
        minHeight: 50,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: SPACING.lg,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginTop: SPACING.md,
    },
    loadingSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
    stepsContainer: {
        marginTop: SPACING.xl,
        gap: SPACING.md,
        width: '100%',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    stepText: {
        fontSize: 14,
        color: COLORS.text.primary,
    },
    successContainer: {
        alignItems: 'center',
        gap: SPACING.lg,
    },
    successIcon: {
        marginBottom: SPACING.md,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    successSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.md,
    },
});
