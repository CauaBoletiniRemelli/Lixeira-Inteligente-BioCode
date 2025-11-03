import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

type SensorStatus = 'empty' | 'medium' | 'full';

interface Sensor {
    id: string;
    name: string;
    level: number;
    status: SensorStatus;
    coordinate: { latitude: number; longitude: number };
    condominiumId: string;
}

const INITIAL_REGION = {
    latitude: -23.5013,
    longitude: -47.4526,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
};

const CONDOMINIUMS = [
    { id: '1', name: 'Edifício Tulipas' },
    { id: '2', name: 'Residencial Girassol' },
    { id: '3', name: 'Condomínio Primavera' },
    { id: '4', name: 'Edifício Alameda' },
    { id: '5', name: 'Residencial Jardins' },
    { id: '6', name: 'Condomínio Vila Verde' },
    { id: '7', name: 'Edifício Horizonte' },
    { id: '8', name: 'Residencial Solar' },
];

const MOCK_SENSORS: Sensor[] = [
    { id: '1', name: 'Lixeira Portaria Principal', level: 95, status: 'full', coordinate: { latitude: -23.5010, longitude: -47.4520 }, condominiumId: '1' },
    { id: '2', name: 'Lixeira Portaria dos Fundos', level: 25, status: 'empty', coordinate: { latitude: -23.5020, longitude: -47.4530 }, condominiumId: '1' },
    { id: '3', name: 'Lixeira Salão de Festas', level: 60, status: 'medium', coordinate: { latitude: -23.5008, longitude: -47.4528 }, condominiumId: '2' },
    { id: '4', name: 'Lixeira Área da Piscina', level: 85, status: 'full', coordinate: { latitude: -23.5012, longitude: -47.4522 }, condominiumId: '2' },
    { id: '5', name: 'Lixeira Playground', level: 40, status: 'medium', coordinate: { latitude: -23.5015, longitude: -47.4532 }, condominiumId: '3' },
    { id: '6', name: 'Lixeira Estacionamento A', level: 15, status: 'empty', coordinate: { latitude: -23.5018, longitude: -47.4524 }, condominiumId: '3' },
    { id: '7', name: 'Lixeira Estacionamento B', level: 70, status: 'medium', coordinate: { latitude: -23.5022, longitude: -47.4528 }, condominiumId: '1' },
    { id: '8', name: 'Lixeira Quadra', level: 90, status: 'full', coordinate: { latitude: -23.5005, longitude: -47.4525 }, condominiumId: '2' },
];

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
    const mapRef = React.useRef<MapView>(null);

    const isAdmin = hasPermission(['admin']);
    const isSindico = hasPermission(['sindico']);
    const canRegisterSensor = hasPermission(['sindico', 'admin']);

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
        return CONDOMINIUMS.filter(cond =>
            cond.name.toLowerCase().includes(condominiumSearch.toLowerCase())
        );
    }, [condominiumSearch]);

    const filteredSensors = useMemo(() => {
        let sensors = MOCK_SENSORS;

        // Filtrar por condomínio baseado no tipo de usuário
        if (isAdmin) {
            // Admins veem todos os sensores ou podem filtrar por condomínio
            if (selectedCondominium !== 'Todos') {
                const selectedCondoId = CONDOMINIUMS.find(c => c.name === selectedCondominium)?.id;
                if (selectedCondoId) {
                    sensors = sensors.filter(s => s.condominiumId === selectedCondoId);
                }
            }
            // Se selectedCondominium === 'Todos', mostra todos os sensores
        } else {
            // Síndicos e coletores veem apenas sensores do seu condomínio
            // Para demo, vamos usar o condomínio '1' (Edifício Tulipas)
            sensors = sensors.filter(s => s.condominiumId === '1');
        }

        // Filtrar por status
        if (selectedFilter !== 'all') {
            sensors = sensors.filter(s => s.status === selectedFilter);
        }

        return sensors;
    }, [selectedFilter, selectedCondominium, isAdmin]);

    const handleSensorPress = React.useCallback((sensor: Sensor) => {
        // Centralizar o sensor no mapa
        mapRef.current?.animateToRegion({
            latitude: sensor.coordinate.latitude,
            longitude: sensor.coordinate.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
        }, 500);

        // Todos os usuários podem ver detalhes do sensor
        setSelectedSensor(sensor);
        setShowSensorModal(true);
    }, []);

    const markers = useMemo(() => {
        return filteredSensors.map((sensor) => (
            <Marker
                key={sensor.id}
                coordinate={sensor.coordinate}
                onPress={() => handleSensorPress(sensor)}
                pinColor={getStatusColor(sensor.status)}
            />
        ));
    }, [filteredSensors, handleSensorPress]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack || (() => {})} />
            </View>
            
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={INITIAL_REGION}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {markers}
                    </MapView>
                </View>

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
                                    { id: 'all', name: 'Todos' },
                                    ...filteredCondominiums
                                ]}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.condominiumOption,
                                            selectedCondominium === item.name && styles.condominiumOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedCondominium(item.name);
                                            setShowCondominiumModal(false);
                                            setCondominiumSearch('');
                                        }}
                                    >
                                        <View style={styles.condominiumInfo}>
                                            <Ionicons
                                                name={item.id === 'all' ? 'apps' : 'home'}
                                                size={22}
                                                color={selectedCondominium === item.name ? COLORS.primary : COLORS.text.secondary}
                                            />
                                            <Text style={[
                                                styles.condominiumLabel,
                                                selectedCondominium === item.name && styles.condominiumLabelSelected,
                                            ]}>
                                                {item.id === 'all' ? 'Todos os Condomínios' : item.name}
                                            </Text>
                                        </View>
                                        {selectedCondominium === item.name && (
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
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    mapContainer: {
        height: 250,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
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
    // Modal styles
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
    // Condominium filter styles
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

