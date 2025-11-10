import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker, type MapPressEvent, type Region, type MapViewRef } from '../components';
import * as Location from 'expo-location';
import { BackButton, Input, Button, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { condominiumService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import Alerta from '../components/Alert';

interface SensorFormScreenProps {
    onBack: () => void;
    onNext: (sensorData: SensorFormData) => void;
}

export interface SensorFormData {
    nomeSensor: string;
    latitude: number;
    longitude: number;
    condominioId: number;
    condominioNome: string;
}

interface CondominiumOption {
    id: number;
    name: string;
}

const INITIAL_REGION = {
    latitude: -23.5013,
    longitude: -47.4526,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
};

export const SensorFormScreen: React.FC<SensorFormScreenProps> = ({ onBack, onNext }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isSindico = user?.role === 'sindico';

    const [nomeSensor, setNomeSensor] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [selectedCondominium, setSelectedCondominium] = useState<number | null>(null);
    const [condominiums, setCondominiums] = useState<CondominiumOption[]>([]);
    const [loadingCondominiums, setLoadingCondominiums] = useState(false);

    const [showCondominiumModal, setShowCondominiumModal] = useState(false);
    const [condominiumSearch, setCondominiumSearch] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempMarkerPosition, setTempMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const latitudeInputRef = useRef<TextInput>(null);
    const longitudeInputRef = useRef<TextInput>(null);
    const mapRef = useRef<MapViewRef>(null);

    useEffect(() => {
        const initializeScreen = async () => {

            const userToken = await storage.getAccessToken();

            if (isAdmin) {
                if (!userToken) {
                    console.warn('⚠️ Admin sem token válido - aguardando renovação...');
                    setTimeout(() => loadCondominiums(), 2000);
                } else {
                    loadCondominiums();
                }
            } else if (isSindico && user?.condominiumId) {
                setSelectedCondominium(user.condominiumId);
                setCondominiums([{ id: user.condominiumId, name: user.condominiumName || 'Meu Condomínio' }]);
            }
        };

        initializeScreen();
    }, [user]);

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const loadCondominiums = async (retryCount = 0) => {
        try {
            setLoadingCondominiums(true);
            
            const userToken = await storage.getAccessToken();
            
            if (!userToken) {
                if (retryCount < 3) {
                    setTimeout(() => loadCondominiums(retryCount + 1), 2000);
                } else {
                    showAlert('Você precisa estar logado para cadastrar sensores', 'error');
                }
                return;
            }
            
            const response = await condominiumService.getAll();

            if (!response.dados) {
                setCondominiums([]);
                return;
            }

            const condominiumsList: CondominiumOption[] = response.dados.map(cond => ({
                id: cond.id,
                name: cond.nome
            }));

            setCondominiums(condominiumsList);
        } catch (error: any) {
            console.error('❌ Erro ao carregar condomínios:', error);
            
            if ((error.response?.status === 401 || error.response?.status === 403) && retryCount < 2) {
                setTimeout(() => loadCondominiums(retryCount + 1), 2000);
                return;
            }
            
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showAlert('Erro ao carregar condomínios. Tente novamente.', 'error');
            } else if (retryCount >= 2) {
                showAlert('Erro de autenticação. Faça logout e login novamente.', 'error');
            }
            setCondominiums([]);
        } finally {
            setLoadingCondominiums(false);
        }
    };

    const filteredCondominiums = condominiums.filter((cond: CondominiumOption) =>
        cond.name.toLowerCase().includes(condominiumSearch.toLowerCase())
    );

    const getSelectedCondominiumName = () => {
        const cond = condominiums.find(c => c.id === selectedCondominium);
        return cond?.name || 'Selecione um condomínio';
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

    const handleNext = () => {
        if (!nomeSensor.trim()) {
            showAlert('Digite o nome do sensor', 'error');
            return;
        }

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

        if (!selectedCondominium) {
            showAlert('Selecione um condomínio', 'error');
            return;
        }

        const sensorData: SensorFormData = {
            nomeSensor: nomeSensor.trim(),
            latitude: lat,
            longitude: lng,
            condominioId: selectedCondominium,
            condominioNome: getSelectedCondominiumName(),
        };

        onNext(sensorData);
    };

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
                            <Ionicons name="hardware-chip-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Cadastrar Sensor</Text>
                        <Text style={styles.subtitle}>
                            Preencha os dados do novo sensor para começar o provisionamento
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Informações do Sensor</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.label}>Nome do Sensor:</Text>
                                <Input
                                    value={nomeSensor}
                                    onChangeText={setNomeSensor}
                                    placeholder="Ex: Lixeira Bloco A"
                                    returnKeyType="next"
                                    onSubmitEditing={() => latitudeInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />

                                <View style={styles.coordinatesSection}>
                                    <Text style={styles.label}>Coordenadas GPS:</Text>
                                    
                                    <TouchableOpacity
                                        style={styles.mapButton}
                                        onPress={handleOpenMap}
                                    >
                                        <Ionicons name="map" size={20} color={COLORS.primary} />
                                        <Text style={styles.mapButtonText}>
                                            {tempMarkerPosition || (latitude && longitude) ? 'Ajustar no Mapa' : 'Selecionar no Mapa'}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.coordinateInputs}>
                                        <View style={styles.coordinateInput}>
                                            <Text style={styles.coordinateLabel}>Latitude:</Text>
                                            <Input
                                                ref={latitudeInputRef}
                                                value={latitude}
                                                onChangeText={setLatitude}
                                                placeholder="-23.5505"
                                                keyboardType="numeric"
                                                returnKeyType="next"
                                                onSubmitEditing={() => longitudeInputRef.current?.focus()}
                                                blurOnSubmit={false}
                                                editable={false}
                                                style={styles.disabledInput}
                                            />
                                        </View>

                                        <View style={styles.coordinateInput}>
                                            <Text style={styles.coordinateLabel}>Longitude:</Text>
                                            <Input
                                                ref={longitudeInputRef}
                                                value={longitude}
                                                onChangeText={setLongitude}
                                                placeholder="-46.6333"
                                                keyboardType="numeric"
                                                returnKeyType="done"
                                                editable={false}
                                                style={styles.disabledInput}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.infoText}>
                                        Use o botão "Selecionar no Mapa" acima para definir as coordenadas
                                    </Text>
                                    
                                    {!latitude && !longitude && (
                                        <View style={styles.warningBox}>
                                            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                                            <Text style={styles.warningText}>
                                                É obrigatório selecionar a localização no mapa
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Localização</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.label}>Condomínio:</Text>
                                {isSindico ? (
                                    <View style={styles.fixedCondominiumContainer}>
                                        <Ionicons name="home" size={20} color={COLORS.primary} />
                                        <Text style={styles.fixedCondominiumText}>
                                            {user?.condominiumName || 'Meu Condomínio'}
                                        </Text>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>Fixo</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.selectInput}
                                        onPress={() => setShowCondominiumModal(true)}
                                        disabled={loadingCondominiums}
                                    >
                                        <View style={styles.selectContent}>
                                            <Ionicons
                                                name="home-outline"
                                                size={20}
                                                color={COLORS.primary}
                                            />
                                            <Text style={styles.selectText}>
                                                {loadingCondominiums ? 'Carregando...' : getSelectedCondominiumName()}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <Button
                            title="Próximo: Conectar ao Wi-Fi"
                            onPress={handleNext}
                            style={styles.nextButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de seleção de condomínio */}
            <Modal
                visible={showCondominiumModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCondominiumModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCondominiumModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Condomínio</Text>
                            <TouchableOpacity onPress={() => {
                                setShowCondominiumModal(false);
                                setCondominiumSearch('');
                            }}>
                                <Ionicons name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={COLORS.text.secondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar condomínio..."
                                placeholderTextColor={COLORS.text.secondary}
                                value={condominiumSearch}
                                onChangeText={setCondominiumSearch}
                            />
                            {condominiumSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCondominiumSearch('')}>
                                    <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filteredCondominiums}
                            keyExtractor={(item) => String(item.id)}
                            style={styles.modalList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.condominiumOption,
                                        selectedCondominium === item.id && styles.condominiumOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedCondominium(item.id);
                                        setShowCondominiumModal(false);
                                        setCondominiumSearch('');
                                    }}
                                >
                                    <View style={styles.condominiumInfo}>
                                        <Ionicons
                                            name="home"
                                            size={22}
                                            color={selectedCondominium === item.id ? COLORS.primary : COLORS.text.secondary}
                                        />
                                        <Text style={[
                                            styles.condominiumLabel,
                                            selectedCondominium === item.id && styles.condominiumLabelSelected,
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </View>
                                    {selectedCondominium === item.id && (
                                        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="search-outline" size={48} color={COLORS.text.secondary} />
                                    <Text style={styles.emptyText}>Nenhum condomínio encontrado</Text>
                                </View>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

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
                        <Text style={styles.mapModalTitle}>Selecione a Localização</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.mapInstructionsContainer}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.mapInstructions}>
                            Toque no mapa para marcar a localização do sensor
                        </Text>
                    </View>

                    <MapView
                        ref={mapRef}
                        style={styles.fullMap}
                        initialRegion={INITIAL_REGION}
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {tempMarkerPosition && (
                            <Marker
                                coordinate={tempMarkerPosition}
                                pinColor={COLORS.primary}
                                title="Localização do Sensor"
                                description={`Lat: ${tempMarkerPosition.latitude.toFixed(6)}, Lng: ${tempMarkerPosition.longitude.toFixed(6)}`}
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.xs,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
        marginTop: SPACING.xs,
    },
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    selectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    selectText: {
        fontSize: 16,
        color: COLORS.text.primary,
    },
    fixedCondominiumContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}10`,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    fixedCondominiumText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.surface,
    },
    nextButton: {
        marginTop: SPACING.lg,
        minHeight: 50,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        width: '100%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        margin: SPACING.md,
        gap: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text.primary,
        padding: 0,
    },
    modalList: {
        maxHeight: 400,
    },
    condominiumOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    condominiumOptionSelected: {
        backgroundColor: `${COLORS.primary}10`,
    },
    condominiumInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    condominiumLabel: {
        fontSize: 16,
        color: COLORS.text.primary,
    },
    condominiumLabelSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: SPACING.md,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.text.secondary,
        textAlign: 'center',
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
});
