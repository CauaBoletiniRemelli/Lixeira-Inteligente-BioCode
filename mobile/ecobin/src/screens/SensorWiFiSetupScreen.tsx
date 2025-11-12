import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, PasswordInput, BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

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
    const { hasPermission, user } = useAuth();
    const isAdmin = hasPermission(['admin']);
    
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [selectedCondominium, setSelectedCondominium] = useState('Edifício Tulipas');
    const [showCondominiumModal, setShowCondominiumModal] = useState(false);
    const [condominiumSearch, setCondominiumSearch] = useState('');
    const passwordInputRef = useRef<TextInput>(null);

    const filteredCondominiums = useMemo(() => {
        return CONDOMINIUMS.filter(cond =>
            cond.name.toLowerCase().includes(condominiumSearch.toLowerCase())
        );
    }, [condominiumSearch]);

    const handleConnect = async () => {
        if (connecting) return;

        if (!ssid.trim()) {
            alert('Por favor, digite o nome da rede Wi-Fi');
            return;
        }

        if (!password.trim()) {
            alert('Por favor, digite a senha');
            return;
        }

        if (isAdmin && !selectedCondominium) {
            alert('Por favor, selecione um condomínio');
            return;
        }

        try {
            setConnecting(true);
            setLoading(true);
            
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 2000);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack} />
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
                        {isAdmin && (
                            <>
                                <Text style={styles.label}>Condomínio</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => setShowCondominiumModal(true)}
                                >
                                    <View style={styles.selectContent}>
                                        <Ionicons name="home" size={20} color={COLORS.primary} />
                                        <Text style={styles.selectText}>{selectedCondominium}</Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>
                            </>
                        )}

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
                            title={connecting ? "Conectando..." : "Conectar e Salvar"}
                            onPress={handleConnect}
                            loading={connecting}
                            disabled={connecting}
                            style={styles.connectButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
                                data={filteredCondominiums}
                                keyExtractor={(item) => item.id}
                                style={styles.modalList}
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
                                                name="home"
                                                size={22}
                                                color={selectedCondominium === item.name ? COLORS.primary : COLORS.text.secondary}
                                            />
                                            <Text style={[
                                                styles.condominiumLabel,
                                                selectedCondominium === item.name && styles.condominiumLabelSelected,
                                            ]}>
                                                {item.name}
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
        paddingVertical: SPACING.sm,
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
    connectButton: {
        marginTop: SPACING.lg,
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
    modalList: {
        maxHeight: 400,
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
});
