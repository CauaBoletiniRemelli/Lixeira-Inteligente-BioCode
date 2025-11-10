import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MapView, Marker, type Region, type MapViewRef } from '../components';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { BackButton, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { sensorService, condominiumService } from '../services';
import type { Sensor as APISensor } from '../services/sensorService';
import { SensorLocationEditScreen } from './SensorLocationEditScreen';

type SensorStatus = 'empty' | 'medium' | 'full';

interface Sensor {
    id: string;
    name: string;
    level: number;
    status: SensorStatus;
    coordinate: { latitude: number; longitude: number };
    condominiumId: string;
    deviceId?: string;
    ultimaAtualizacao?: string;
}

const INITIAL_REGION = {
    latitude: -23.5013,
    longitude: -47.4526,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
};

interface Condominium {
    id: string;
    nome: string;
}

interface MapScreenProps {
    onNavigateToSensorSetup?: () => void;
    onBack?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onNavigateToSensorSetup, onBack }) => {
    const { hasPermission, user } = useAuth();
    const [selectedFilter, setSelectedFilter] = useState<SensorStatus | 'all'>('all');
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
    const [showSensorModal, setShowSensorModal] = useState(false);
    const [showCondominiumModal, setShowCondominiumModal] = useState(false);
    const [selectedCondominium, setSelectedCondominium] = useState('Todos');
    const [condominiumSearch, setCondominiumSearch] = useState('');
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [condominiums, setCondominiums] = useState<Condominium[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialRegion, setInitialRegion] = useState<Region>(INITIAL_REGION);
    const [showEditLocationScreen, setShowEditLocationScreen] = useState(false);
    const [sensorToEdit, setSensorToEdit] = useState<APISensor | null>(null);
    const mapRef = React.useRef<MapViewRef>(null);

    const isAdmin = hasPermission(['admin']);
    const isSindico = hasPermission(['sindico']);
    const canRegisterSensor = hasPermission(['sindico', 'admin']);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const userRegion: Region = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                };

                setInitialRegion(userRegion);
                
                if (mapRef.current) {
                    mapRef.current.animateToRegion(userRegion, 1000);
                }
            } catch (error) {
                console.error('❌ Erro ao obter localização:', error);
            }
        })();
    }, []);

    const convertSensor = (apiSensor: APISensor): Sensor | null => {
        const lat = apiSensor.latitude;
        const lng = apiSensor.longitude;
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.warn(`Sensor ${apiSensor.id} tem coordenadas inválidas:`, { lat, lng });
            return null;
        }

        const level = apiSensor.nivelAtual || 0;
        let status: SensorStatus = 'empty';
        
        if (level >= 80) {
            status = 'full';
        } else if (level >= 40) {
            status = 'medium';
        }

        return {
            id: apiSensor.id.toString(),
            name: apiSensor.nome,
            level,
            status,
            coordinate: {
                latitude: lat,
                longitude: lng,
            },
            condominiumId: apiSensor.condominioId.toString(),
            deviceId: apiSensor.deviceId,
            ultimaAtualizacao: apiSensor.ultimaAtualizacao,
        };
    };

    const loadSensors = async () => {
        try {
            setLoading(true);
            let response;

            if (isAdmin) {
                if (selectedCondominium === 'Todos') {
                    response = await sensorService.getAll();
                } else {
                    const selectedCondoId = condominiums.find(c => c.nome === selectedCondominium)?.id;
                    if (selectedCondoId) {
                        response = await sensorService.getByCondominio(parseInt(selectedCondoId));
                    } else {
                        response = await sensorService.getAll();
                    }
                }
            } else {
                if (user?.condominiumId) {
                    response = await sensorService.getByCondominio(user.condominiumId);
                }
            }

            if (response?.dados) {
                const convertedSensors = response.dados
                    .map(convertSensor)
                    .filter((sensor): sensor is Sensor => sensor !== null);
                setSensors(convertedSensors);
            }
        } catch (error: any) {
            console.error('Erro ao carregar sensores:', error);
            Alert.alert(
                'Erro',
                error.response?.data?.mensagem || 'Não foi possível carregar os sensores'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadCondominiums = async () => {
            if (!isAdmin) return;
            
            try {
                const response = await condominiumService.getAll();
                
                if (response?.dados) {
                    const condoList: Condominium[] = response.dados.map(cond => ({
                        id: cond.id.toString(),
                        nome: cond.nome,
                    }));
                    setCondominiums(condoList);
                }
            } catch (error) {
                console.error('❌ Erro ao carregar condomínios:', error);
                const uniqueCondos: Condominium[] = [];
                sensors.forEach(sensor => {
                    if (!uniqueCondos.find(c => c.id === sensor.condominiumId)) {
                        uniqueCondos.push({
                            id: sensor.condominiumId,
                            nome: `Condomínio ${sensor.condominiumId}`,
                        });
                    }
                });
                setCondominiums(uniqueCondos);
            }
        };

        loadCondominiums();
    }, [isAdmin]);

    useEffect(() => {
        loadSensors();
    }, [selectedCondominium]);

    const getStatusColor = (status: SensorStatus) => {
        switch (status) {
            case 'full':
                return COLORS.error;
            case 'medium':
                return COLORS.warning;
            case 'empty':
                return COLORS.success;
        }
    };

    const getStatusText = (status: SensorStatus) => {
        switch (status) {
            case 'full':
                return 'Cheia';
            case 'medium':
                return 'Média';
            case 'empty':
                return 'Vazia/Baixa';
        }
    };

    const filteredCondominiums = useMemo(() => {
        return condominiums.filter(cond =>
            cond.nome.toLowerCase().includes(condominiumSearch.toLowerCase())
        );
    }, [condominiumSearch, condominiums]);

    const filteredSensors = useMemo(() => {
        let filtered = sensors;

        if (selectedFilter !== 'all') {
            filtered = filtered.filter(s => s.status === selectedFilter);
        }

        return filtered;
    }, [selectedFilter, sensors]);

    const handleSensorPress = React.useCallback((sensor: Sensor) => {
        mapRef.current?.animateToRegion({
            latitude: sensor.coordinate.latitude,
            longitude: sensor.coordinate.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
        }, 500);

        setSelectedSensor(sensor);
        setShowSensorModal(true);
    }, []);

    const handleEditLocation = async (sensor: Sensor) => {
        try {
            const response = await sensorService.getAll();
            if (response?.dados) {
                const fullSensor = response.dados.find(s => s.id.toString() === sensor.id);
                if (fullSensor) {
                    setSensorToEdit(fullSensor);
                    setShowSensorModal(false);
                    setShowEditLocationScreen(true);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao buscar sensor:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do sensor');
        }
    };

    const handleEditLocationSuccess = () => {
        setShowEditLocationScreen(false);
        setSensorToEdit(null);
        loadSensors(); 
    };

    const markers = useMemo(() => {
        return filteredSensors
            .filter(sensor => {
                const lat = sensor.coordinate?.latitude;
                const lng = sensor.coordinate?.longitude;
                return lat && lng && !isNaN(lat) && !isNaN(lng) && 
                       lat >= -90 && lat <= 90 && 
                       lng >= -180 && lng <= 180;
            })
            .map((sensor) => (
                <Marker
                    key={sensor.id}
                    coordinate={sensor.coordinate}
                    onPress={() => handleSensorPress(sensor)}
                    pinColor={getStatusColor(sensor.status)}
                    title={sensor.name}
                    description={`${getStatusText(sensor.status)} - ${sensor.level}%`}
                    identifier={sensor.id}
                />
            ));
    }, [filteredSensors, handleSensorPress]);

    if (showEditLocationScreen && sensorToEdit) {
        return (
            <SensorLocationEditScreen
                sensor={sensorToEdit}
                onBack={() => {
                    setShowEditLocationScreen(false);
                    setSensorToEdit(null);
                }}
                onSuccess={handleEditLocationSuccess}
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack || (() => {})} />
            </View>

            {loading ? (
                <Loading />
            ) : (
            <View style={styles.container}>
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {markers}
                    </MapView>
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    nestedScrollEnabled={true}
                >
                {/* Filtro de Condomínio (apenas para admins) */}
                {isAdmin && (
                    <View style={styles.condominiumFilterContainer}>
                        <Text style={styles.filterTitle}>Condomínio</Text>
                        <TouchableOpacity
                            style={styles.condominiumSelect}
                            onPress={() => setShowCondominiumModal(true)}
                        >
                            <View style={styles.selectContent}>
                                <Ionicons name="home" size={20} color={COLORS.primary} />
                                <Text style={styles.selectText}>{selectedCondominium}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.filterContainer}>
                        <Text style={styles.filterTitle}>Filtro por Status</Text>
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    selectedFilter === 'empty' && styles.filterButtonActive,
                                ]}
                                onPress={() => setSelectedFilter(selectedFilter === 'empty' ? 'all' : 'empty')}
                            >
                                <Ionicons name="location" size={20} color={COLORS.success} />
                                <Text style={styles.filterButtonText}>Vazias/Baixo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    selectedFilter === 'medium' && styles.filterButtonActive,
                                ]}
                                onPress={() => setSelectedFilter(selectedFilter === 'medium' ? 'all' : 'medium')}
                            >
                                <Ionicons name="location" size={20} color={COLORS.warning} />
                                <Text style={styles.filterButtonText}>Médias</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    selectedFilter === 'full' && styles.filterButtonActive,
                                ]}
                                onPress={() => setSelectedFilter(selectedFilter === 'full' ? 'all' : 'full')}
                            >
                                <Ionicons name="location" size={20} color={COLORS.error} />
                                <Text style={styles.filterButtonText}>Cheias</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                {/* Botão de Cadastrar (síndicos e admins) */}
                {canRegisterSensor && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={onNavigateToSensorSetup}
                    >
                        <Text style={styles.addButtonText}>Cadastrar Novo Sensor</Text>
                    </TouchableOpacity>
                )}

                {/* Lista de Sensores (todos os usuários) */}
                <View style={styles.sensorListContainer}>
                    <View style={styles.sensorListHeader}>
                        <Text style={styles.sensorListTitle}>
                            {isAdmin ? 'Sensores' : 'Meus Sensores'} ({filteredSensors.length})
                        </Text>
                    </View>

                    <View style={styles.sensorList}>
                            {filteredSensors.map((sensor) => (
                                <TouchableOpacity
                                    key={sensor.id}
                                    style={styles.sensorCard}
                                    onPress={() => handleSensorPress(sensor)}
                                >
                                    <View style={styles.sensorCardLeft}>
                                        <View
                                            style={[
                                                styles.levelCircle,
                                                { borderColor: getStatusColor(sensor.status) },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.levelText,
                                                    { color: getStatusColor(sensor.status) },
                                                ]}
                                            >
                                                {sensor.level}%
                                            </Text>
                                        </View>
                                        <View style={styles.sensorInfo}>
                                            <Text style={styles.sensorName}>{sensor.name}</Text>
                                            <Text
                                                style={[
                                                    styles.sensorStatus,
                                                    { color: getStatusColor(sensor.status) },
                                                ]}
                                            >
                                                {getStatusText(sensor.status).toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    {sensor.status === 'full' && canRegisterSensor && (
                                        <TouchableOpacity style={styles.alertButton}>
                                            <Text style={styles.alertButtonText}>
                                                Clique para enviar um alerta 🔔
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>
                </ScrollView>
            </View>
            )}

            {/* Modal de Detalhes do Sensor */}
            <Modal
                visible={showSensorModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSensorModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSensorModal(false)}
                >
                    <View style={styles.modalContent}>
                        {selectedSensor && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{selectedSensor.name}</Text>
                                    <TouchableOpacity onPress={() => setShowSensorModal(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.text.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    <View
                                        style={[
                                            styles.modalLevelCircle,
                                            { borderColor: getStatusColor(selectedSensor.status) },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.modalLevelText,
                                                { color: getStatusColor(selectedSensor.status) },
                                            ]}
                                        >
                                            {selectedSensor.level}%
                                        </Text>
                                    </View>

                                    <Text style={styles.modalStatusLabel}>Status:</Text>
                                    <Text
                                        style={[
                                            styles.modalStatusValue,
                                            { color: getStatusColor(selectedSensor.status) },
                                        ]}
                                    >
                                        {getStatusText(selectedSensor.status)}
                                    </Text>

                                    {canRegisterSensor && (
                                        <TouchableOpacity 
                                            style={styles.modalEditLocationButton}
                                            onPress={() => handleEditLocation(selectedSensor)}
                                        >
                                            <Ionicons name="location" size={20} color={COLORS.primary} />
                                            <Text style={styles.modalEditLocationButtonText}>
                                                Editar Localização
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {selectedSensor.status === 'full' && canRegisterSensor && (
                                        <TouchableOpacity style={styles.modalAlertButton}>
                                            <Ionicons name="notifications" size={20} color={COLORS.text.white} />
                                            <Text style={styles.modalAlertButtonText}>
                                                Enviar Alerta para Coletores
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de Seleção de Condomínio (apenas para admins) */}
            {isAdmin && (
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
                                style={styles.modalList}
                                data={[
                                    { id: 'all', nome: 'Todos' },
                                    ...filteredCondominiums
                                ]}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.condominiumOption,
                                            selectedCondominium === item.nome && styles.condominiumOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedCondominium(item.nome);
                                            setShowCondominiumModal(false);
                                            setCondominiumSearch('');
                                        }}
                                    >
                                        <View style={styles.condominiumInfo}>
                                            <Ionicons
                                                name={item.id === 'all' ? 'apps' : 'home'}
                                                size={22}
                                                color={selectedCondominium === item.nome ? COLORS.primary : COLORS.text.secondary}
                                            />
                                            <Text style={[
                                                styles.condominiumLabel,
                                                selectedCondominium === item.nome && styles.condominiumLabelSelected,
                                            ]}>
                                                {item.id === 'all' ? 'Todos os Condomínios' : item.nome}
                                            </Text>
                                        </View>
                                        {selectedCondominium === item.nome && (
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
            )}
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
    container: {
        flex: 1,
    },
    mapContainer: {
        height: 300,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    scrollView: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.xs,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
    },
    filterButtonActive: {
        backgroundColor: `${COLORS.primary}10`,
        borderColor: COLORS.primary,
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.text.primary,
    },
    addButton: {
        backgroundColor: COLORS.success,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.md,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.white,
    },
    sensorListContainer: {
        backgroundColor: COLORS.surface,
        minHeight: 200,
    },
    sensorListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sensorListTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    sensorList: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    sensorCard: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sensorCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    levelCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sensorInfo: {
        flex: 1,
    },
    sensorName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    sensorStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    alertButton: {
        backgroundColor: `${COLORS.error}10`,
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
    },
    alertButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.error,
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
        maxWidth: 400,
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
        flex: 1,
    },
    modalBody: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    modalLevelCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalLevelText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    modalStatusLabel: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    modalStatusValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.lg,
    },
    modalEditLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}10`,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.md,
    },
    modalEditLocationButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    modalAlertButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.error,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.md,
    },
    modalAlertButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.white,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.background,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.xs,
    },
    condominiumFilterContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    condominiumSelect: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.background,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text.primary,
        padding: 0,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xl * 2,
        paddingHorizontal: SPACING.lg,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.text.secondary,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
});

