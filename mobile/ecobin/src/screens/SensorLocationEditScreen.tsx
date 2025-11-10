import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { BackButton, Button, Input, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { sensorService } from '../services';
import type { Sensor } from '../services/sensorService';
import Alerta from '../components/Alert';

const INITIAL_REGION = {
    latitude: -23.5013,
    longitude: -47.4526,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
};

interface SensorLocationEditScreenProps {
    sensor: Sensor;
    onBack: () => void;
    onSuccess?: () => void;
}

export const SensorLocationEditScreen: React.FC<SensorLocationEditScreenProps> = ({
    sensor,
    onBack,
    onSuccess,
}) => {
    const [latitude, setLatitude] = useState(sensor.latitude.toString());
    const [longitude, setLongitude] = useState(sensor.longitude.toString());
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempMarkerPosition, setTempMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const mapRef = useRef<MapView>(null);

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setTempMarkerPosition({ latitude, longitude });
    };

    const handleConfirmLocation = () => {
        if (tempMarkerPosition) {
            setLatitude(tempMarkerPosition.latitude.toFixed(6));
            setLongitude(tempMarkerPosition.longitude.toFixed(6));
            setShowMapModal(false);
            setTempMarkerPosition(null);
        }
    };

    const handleOpenMap = async () => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            setTempMarkerPosition({ latitude: lat, longitude: lng });
            setShowMapModal(true);
        } else {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setShowMapModal(true);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const userLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setTempMarkerPosition(userLocation);
                setShowMapModal(true);
                
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.animateToRegion({
                            ...userLocation,
                            latitudeDelta: 0.003,
                            longitudeDelta: 0.003,
                        }, 1000);
                    }
                }, 500);
            } catch (error) {
                console.error('❌ Erro ao obter localização:', error);
                setShowMapModal(true);
            }
        }
    };

    const handleSave = async () => {
        if (!latitude || !longitude) {
            showAlert('Selecione a localização no mapa', 'error');
            return;
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            showAlert('Latitude inválida (deve estar entre -90 e 90)', 'error');
            return;
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            showAlert('Longitude inválida (deve estar entre -180 e 180)', 'error');
            return;
        }

        try {
            setLoading(true);

            const updateData = {
                id: sensor.id,
                latitude: lat,
                longitude: lng,
            };

            const response = await sensorService.updateLocale(sensor.id, updateData);

            if (response.status) {
                showAlert('Localização atualizada com sucesso!', 'success');
                setTimeout(() => {
                    onSuccess?.();
                    onBack();
                }, 1500);
            } else {
                showAlert(response.mensagem || 'Erro ao atualizar localização', 'error');
            }
        } catch (error: any) {
            console.error('❌ Erro ao atualizar localização:', error);
            showAlert(
                error.response?.data?.mensagem || 'Erro ao atualizar localização. Tente novamente.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
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
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.titleContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="location-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Editar Localização</Text>
                        <Text style={styles.subtitle}>
                            Atualize a localização GPS do sensor "{sensor.nome}"
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Informações do Sensor</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Nome:</Text>
                                    <Text style={styles.infoValue}>{sensor.nome}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Device ID:</Text>
                                    <Text style={styles.infoValue}>{sensor.deviceId}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Condomínio:</Text>
                                    <Text style={styles.infoValue}>{sensor.nomeCondominio || `ID: ${sensor.condominioId}`}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="map-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Nova Localização GPS</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.coordinatesSection}>
                                    <Text style={styles.label}>Coordenadas Atuais:</Text>
                                    <View style={styles.currentCoordinates}>
                                        <Text style={styles.currentCoordinatesText}>
                                            Lat: {sensor.latitude.toFixed(6)}, Lng: {sensor.longitude.toFixed(6)}
                                        </Text>
                                    </View>

                                    <Text style={styles.label}>Novas Coordenadas GPS:</Text>
                                    
                                    <TouchableOpacity
                                        style={styles.mapButton}
                                        onPress={handleOpenMap}
                                    >
                                        <Ionicons name="map" size={20} color={COLORS.primary} />
                                        <Text style={styles.mapButtonText}>
                                            Selecionar no Mapa
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.coordinateInputs}>
                                        <View style={styles.coordinateInput}>
                                            <Text style={styles.coordinateLabel}>Latitude:</Text>
                                            <Input
                                                value={latitude}
                                                onChangeText={setLatitude}
                                                placeholder="-23.5505"
                                                keyboardType="numeric"
                                                editable={false}
                                                style={styles.disabledInput}
                                            />
                                        </View>

                                        <View style={styles.coordinateInput}>
                                            <Text style={styles.coordinateLabel}>Longitude:</Text>
                                            <Input
                                                value={longitude}
                                                onChangeText={setLongitude}
                                                placeholder="-46.6333"
                                                keyboardType="numeric"
                                                editable={false}
                                                style={styles.disabledInput}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.infoText}>
                                        Use o botão "Selecionar no Mapa" acima para definir as novas coordenadas
                                    </Text>
                                    
                                    {(latitude === sensor.latitude.toString() && longitude === sensor.longitude.toString()) && (
                                        <View style={styles.warningBox}>
                                            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                                            <Text style={styles.warningText}>
                                                As coordenadas ainda não foram alteradas. Selecione uma nova localização no mapa.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <Button
                            title="Salvar Localização"
                            onPress={handleSave}
                            style={styles.saveButton}
                            disabled={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de seleção no mapa */}
            <Modal
                visible={showMapModal}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowMapModal(false)}
            >
                <SafeAreaView style={styles.mapModalContainer} edges={['top', 'left', 'right']}>
                    <View style={styles.mapModalHeader}>
                        <TouchableOpacity
                            style={styles.mapModalCloseButton}
                            onPress={() => {
                                setShowMapModal(false);
                                setTempMarkerPosition(null);
                            }}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.mapModalTitle}>Selecione a Nova Localização</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.mapInstructionsContainer}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.mapInstructions}>
                            Toque no mapa para marcar a nova localização do sensor
                        </Text>
                    </View>

                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.fullMap}
                        initialRegion={{
                            latitude: sensor.latitude,
                            longitude: sensor.longitude,
                            latitudeDelta: 0.003,
                            longitudeDelta: 0.003,
                        }}
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {tempMarkerPosition && (
                            <Marker
                                coordinate={tempMarkerPosition}
                                pinColor={COLORS.primary}
                            />
                        )}
                    </MapView>

                    {tempMarkerPosition && (
                        <View style={styles.mapModalFooter}>
                            <View style={styles.coordinateInfo}>
                                <Text style={styles.coordinateInfoLabel}>Coordenadas selecionadas:</Text>
                                <Text style={styles.coordinateInfoValue}>
                                    Lat: {tempMarkerPosition.latitude.toFixed(6)}, Lng: {tempMarkerPosition.longitude.toFixed(6)}
                                </Text>
                            </View>
                            <Button
                                title="Confirmar Localização"
                                onPress={handleConfirmLocation}
                                style={styles.confirmButton}
                            />
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
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
    titleContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        gap: SPACING.sm,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
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
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.md,
    },
    form: {
        gap: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}10`,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    cardContent: {
        padding: SPACING.md,
        gap: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text.primary,
        flex: 1,
        textAlign: 'right',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.xs,
    },
    currentCoordinates: {
        backgroundColor: `${COLORS.text.secondary}10`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    currentCoordinatesText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    infoText: {
        fontSize: 12,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
        marginTop: SPACING.xs,
    },
    coordinatesSection: {
        gap: SPACING.md,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}10`,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    mapButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    coordinateInputs: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    coordinateInput: {
        flex: 1,
    },
    coordinateLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    disabledInput: {
        backgroundColor: `${COLORS.text.secondary}10`,
        color: COLORS.text.secondary,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.warning}15`,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.warning,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        marginTop: SPACING.xs,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.warning,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: SPACING.lg,
        minHeight: 50,
    },
    mapModalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mapModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    mapModalCloseButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    mapInstructionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}10`,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    mapInstructions: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text.primary,
    },
    fullMap: {
        flex: 1,
    },
    mapModalFooter: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: SPACING.md,
    },
    coordinateInfo: {
        alignItems: 'center',
        gap: SPACING.xs,
    },
    coordinateInfoLabel: {
        fontSize: 12,
        color: COLORS.text.secondary,
    },
    coordinateInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    confirmButton: {
        minHeight: 50,
    },
});
