import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, PermissionsAndroid, ScrollView, TextInput, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, PasswordInput, BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { provisionamentoService } from '../services';
import { QRCodeData } from './QRCodeScannerScreen';
import { SensorFormData } from './SensorFormScreen';
import Alerta from '../components/Alert';
import { NetworkInfo } from 'react-native-network-info';

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
    const [step, setStep] = useState<'connect_to_sensor' | 'wifi_form' | 'sending' | 'connecting' | 'success'>('connect_to_sensor');
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isConnectedToSensor, setIsConnectedToSensor] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const passwordInputRef = useRef<TextInput>(null);

    const expectedSsid = qrData.deviceId ? `EcoBin-${qrData.deviceId}` : 'EcoBin-XXXX';

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const fetchWithTimeout = async (url: string, options: any = {}, timeout = 8000) => {
        return await Promise.race([
            fetch(url, options),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))
        ]);
    };

    const openWifiSettings = async () => {
        try {
            await Linking.openURL('intent://#Intent;action=android.settings.WIFI_SETTINGS;end');
        } catch {
            try {
                await Linking.openURL('android.settings.WIFI_SETTINGS://');
            } catch {
                try {
                    await Linking.openURL('package:com.android.settings/.wifi.WifiSettings');
                } catch {
                    console.log('Não foi possível abrir configurações de Wi-Fi por nenhum método');
                    showAlert('Não foi possível abrir as configurações de Wi-Fi', 'error');
                }
            }
        }
    };

    const testSensorConnection = async () => {
        setLoading(true);
        try {
            const resp = await fetchWithTimeout('http://192.168.4.1/ping', {
                method: 'GET',
            }, 5000);

            if (resp && (resp as Response).ok) {
                setIsConnectedToSensor(true);
                showAlert('Conectado ao sensor com sucesso!', 'success');
                
                await activateSession();
                
                setStep('wifi_form');
            } else {
                throw new Error('Sem resposta do sensor');
            }
        } catch (error) {
            showAlert('Não foi possível conectar ao sensor. Verifique se está conectado à rede ' + expectedSsid, 'error');
            setIsConnectedToSensor(false);
        } finally {
            setLoading(false);
        }
    };

    const activateSession = async () => {
        try {
            const activatePayload = {
                provisionId: qrData.provisionId,
                deviceId: qrData.deviceId,
                token: qrData.token,
                condominioId: sensorData.condominioId,
                nomeSensor: sensorData.nomeSensor,
                latitude: sensorData.latitude,
                longitude: sensorData.longitude,
            };

            const response = await provisionamentoService.ativarQR(activatePayload);

            if (!response.status || !response.dados) {
                throw new Error(response.mensagem || 'Erro ao ativar sessão');
            }

            setSessionToken(response.dados.sessionToken);
            setDeviceId(response.dados.deviceId);
        } catch (error: any) {
            console.error('Erro ao ativar sessão:', error);
            throw error;
        }
    };

    const handleSendCredentials = async () => {
        if (!ssid.trim()) {
            showAlert('Digite o nome da rede Wi-Fi', 'error');
            return;
        }
        if (!password.trim()) {
            showAlert('Digite a senha da rede Wi-Fi', 'error');
            return;
        }

        if (!sessionToken || !deviceId) {
            showAlert('Sessão inválida. Reinicie o processo', 'error');
            return;
        }

        setLoading(true);
        setStep('sending');

        try {
            const url = 'http://192.168.4.1/config';
            const body = {
                wifiSSID: ssid.trim(),
                wifiPassword: password.trim(),
                sessionToken,
                deviceId
            };

            const resp = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }, 10000);

            if (!resp || !(resp as Response).ok) {
                throw new Error('Falha ao enviar credenciais ao sensor');
            }

            const json = await (resp as Response).json();
            if (!json?.status) {
                throw new Error(json?.mensagem || 'Sensor rejeitou as credenciais');
            }

            setStep('connecting');
            showAlert('Credenciais enviadas! Aguardando conexão...', 'success');

            await pollConnectionStatus();

        } catch (error: any) {
            console.error('Erro ao enviar credenciais:', error);
            const msg = error?.message || 'Erro ao configurar sensor';
            showAlert(msg, 'error');
            setStep('wifi_form');
        } finally {
            setLoading(false);
        }
    };

    const pollConnectionStatus = async () => {
        const pollInterval = 3000;
        const timeoutMs = 60000;
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            await new Promise(r => setTimeout(r, pollInterval));
            
            try {
                const statusResp = await provisionamentoService.getProvisionStatus(sessionToken!);
                
                if (statusResp?.status) {
                    const provStatus = statusResp.dados?.status ?? statusResp.dados;
                    
                    if (provStatus === 'CONFIRMED' || provStatus === 'ATIVADO') {
                        setStep('success');
                        showAlert('Sensor configurado com sucesso!', 'success');
                        setTimeout(onSuccess, 2000);
                        return;
                    } else if (provStatus === 'EXPIRED' || provStatus === 'FAILED') {
                        throw new Error('Configuração falhou ou expirou');
                    }
                }
            } catch (err) {
                console.warn('Erro no polling:', err);
            }
        }

        throw new Error('Tempo esgotado. Sensor não confirmou a conexão');
    };

    const renderConnectToSensor = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <View style={styles.pulseCircle}>
                    <View style={styles.innerPulseCircle}>
                        <Ionicons name="wifi" size={64} color={COLORS.primary} />
                    </View>
                </View>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Conecte-se ao Sensor</Text>
                <Text style={styles.subtitle}>
                    Primeiro, vamos conectar seu celular ao sensor para configurá-lo
                </Text>
            </View>

            <View style={styles.instructionsCard}>
                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Abra as Configurações de Wi-Fi</Text>
                        <Text style={styles.stepDescription}>
                            Toque no botão abaixo para ir às configurações
                        </Text>
                    </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Conecte à Rede do Sensor</Text>
                        <View style={styles.networkInfoBox}>
                            <Ionicons name="wifi" size={20} color={COLORS.primary} />
                            <View style={styles.networkDetails}>
                                <Text style={styles.networkLabel}>Nome da Rede:</Text>
                                <Text style={styles.networkValue}>{expectedSsid}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Volte ao App</Text>
                        <Text style={styles.stepDescription}>
                            Após conectar, retorne e confirme a conexão
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.tipTitle}>Importante</Text>
                </View>
                <Text style={styles.tipText}>
                    Seu celular irá perder acesso à internet temporariamente enquanto estiver conectado ao sensor. Isso é normal!
                </Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={openWifiSettings}
                    activeOpacity={0.8}
                >
                    <Ionicons name="settings-outline" size={20} color={COLORS.text.white} />
                    <Text style={styles.primaryButtonText}>Abrir Configurações Wi-Fi</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={testSensorConnection}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                    )}
                    <Text style={styles.secondaryButtonText}>
                        {loading ? 'Verificando...' : 'Já Conectei, Continuar'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderWiFiForm = () => (
        <View style={styles.stepContainer}>
            <View style={styles.successCheckContainer}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                <Text style={styles.connectedText}>Conectado ao Sensor!</Text>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Configure o Wi-Fi</Text>
                <Text style={styles.subtitle}>
                    Agora informe os dados da rede Wi-Fi que o sensor irá utilizar
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
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Nome da Rede (SSID):</Text>
                <Input
                    value={ssid}
                    onChangeText={setSsid}
                    placeholder="Ex: MinhaRedeWiFi"
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
                    onSubmitEditing={handleSendCredentials}
                />

                <View style={styles.warningCard}>
                    <Ionicons name="wifi" size={24} color={COLORS.primary} />
                    <Text style={styles.warningText}>
                        Esta será a rede que o sensor usará para enviar os dados. Certifique-se de que o sensor terá alcance desta rede.
                    </Text>
                </View>

                <Button
                    title="Configurar Sensor"
                    onPress={handleSendCredentials}
                    loading={loading}
                    disabled={loading}
                    style={styles.configButton}
                />
            </View>
        </View>
    );

    const renderSending = () => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTitle}>Enviando Configurações</Text>
            <Text style={styles.loadingSubtitle}>
                Aguarde enquanto enviamos as credenciais para o sensor...
            </Text>
        </View>
    );

    const renderConnecting = () => (
        <View style={styles.centerContainer}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingTitle}>Conectando à Rede Wi-Fi</Text>
                <Text style={styles.loadingSubtitle}>
                    O sensor está tentando se conectar à rede...
                </Text>
                <View style={styles.stepsContainer}>
                    <View style={styles.stepItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        <Text style={styles.stepText}>Conectado ao sensor</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        <Text style={styles.stepText}>Credenciais enviadas</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.stepText}>Conectando ao Wi-Fi...</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.centerContainer}>
            <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                    <Ionicons name="checkmark" size={80} color={COLORS.text.white} />
                </View>
                <Text style={styles.successTitle}>Sensor Configurado!</Text>
                <Text style={styles.successSubtitle}>
                    O sensor está conectado e pronto para monitorar o nível de lixo
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <Alerta message={alertMessage} type={alertType} visible={alertVisible} />

            {(step === 'connect_to_sensor' || step === 'wifi_form') && (
                <View style={styles.header}>
                    <BackButton onPress={step === 'wifi_form' ? () => setStep('connect_to_sensor') : onBack} />
                </View>
            )}

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {step === 'connect_to_sensor' && renderConnectToSensor()}
                    {step === 'wifi_form' && renderWiFiForm()}
                    {step === 'sending' && renderSending()}
                    {step === 'connecting' && renderConnecting()}
                    {step === 'success' && renderSuccess()}
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
        flexGrow: 1,
    },
    stepContainer: {
        flex: 1,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    pulseCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerPulseCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: `${COLORS.primary}25`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: SPACING.sm,
    },
    instructionsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionStep: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text.white,
    },
    stepContent: {
        flex: 1,
        gap: SPACING.xs,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    stepDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
        marginLeft: 16,
    },
    networkInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.primary}10`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        gap: SPACING.sm,
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
    },
    networkDetails: {
        flex: 1,
    },
    networkLabel: {
        fontSize: 12,
        color: COLORS.text.secondary,
        marginBottom: 2,
    },
    networkValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    tipCard: {
        backgroundColor: `${COLORS.primary}10`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    tipText: {
        fontSize: 13,
        color: COLORS.text.primary,
        lineHeight: 19,
    },
    actionButtons: {
        gap: SPACING.md,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text.white,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.secondary,
        textDecorationLine: 'underline',
    },
    successCheckContainer: {
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    connectedText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.success,
        marginTop: SPACING.sm,
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
        backgroundColor: `${COLORS.primary}10`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
        marginTop: SPACING.sm,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text.primary,
        lineHeight: 19,
    },
    configButton: {
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
        textAlign: 'center',
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
    successCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.success,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.lg,
    },
});