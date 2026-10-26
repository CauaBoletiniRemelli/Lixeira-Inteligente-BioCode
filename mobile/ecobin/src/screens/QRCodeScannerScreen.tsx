import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface QRCodeScannerScreenProps {
    onBack: () => void;
    onScanSuccess: (qrData: QRCodeData) => void;
}

export interface QRCodeData {
    provisionId: string;
    deviceId: string;
    token: string;
}

export const QRCodeScannerScreen: React.FC<QRCodeScannerScreenProps> = ({ onBack, onScanSuccess }) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');
    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const parseQRCode = (data: string): QRCodeData | null => {
        try {
            const parts = data.split('|');

            if (parts.length !== 3) {
                console.error('QR Code inválido: formato incorreto');
                return null;
            }

            return {
                provisionId: parts[0].trim(),
                deviceId: parts[1].trim(),
                token: parts[2].trim(),
            };
        } catch (error) {
            console.error('Erro ao parsear QR Code:', error);
            return null;
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;

        setScanned(true);

        const qrData = parseQRCode(data);

        if (!qrData) {
            Alert.alert(
                'QR Code Inválido',
                'O QR Code escaneado não está no formato correto. Por favor, tente novamente.',
                [
                    {
                        text: 'Tentar Novamente',
                        onPress: () => setScanned(false)
                    }
                ]
            );
            return;
        }

        Alert.alert(
            'QR Code Escaneado com Sucesso',
            `Sensor encontrado!\n\nDevice ID: ${qrData.deviceId}`,
            [
                {
                    text: 'Continuar',
                    onPress: () => onScanSuccess(qrData)
                }
            ]
        );
    };

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.message}>Solicitando permissão da câmera...</Text>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.message}>Sem acesso à câmera</Text>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <BackButton onPress={onBack} color={COLORS.text.white} />
                <Text style={styles.headerTitle}>Escanear QR Code</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>
                </CameraView>

                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionTitle}>
                        Posicione o QR Code na área destacada
                    </Text>
                    <Text style={styles.instructionSubtitle}>
                        O código será lido automaticamente
                    </Text>

                    {scanned && (
                        <TouchableOpacity
                            style={styles.scanAgainButton}
                            onPress={() => setScanned(false)}
                        >
                            <Text style={styles.scanAgainButtonText}>Escanear Novamente</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.white,
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.success,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: BORDER_RADIUS.md,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: BORDER_RADIUS.md,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: BORDER_RADIUS.md,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: BORDER_RADIUS.md,
    },
    instructionsContainer: {
        padding: SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.white,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    instructionSubtitle: {
        fontSize: 14,
        color: COLORS.text.hint,
        textAlign: 'center',
    },
    scanAgainButton: {
        backgroundColor: COLORS.success,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.lg,
    },
    scanAgainButtonText: {
        color: COLORS.text.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginTop: SPACING.xl,
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.md,
        margin: SPACING.xl,
        alignSelf: 'center',
    },
    backButtonText: {
        color: COLORS.text.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
