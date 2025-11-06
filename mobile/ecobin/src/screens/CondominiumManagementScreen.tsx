import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { condominiumService } from '../services';

type CondominiumStatus = 'active' | 'inactive';

interface Condominium {
    id: number;
    name: string;
    address: string;
    cep: string;
    status: CondominiumStatus;
}

interface CondominiumManagementScreenProps {
    onBack: () => void;
    onEditCondominium: (condominium: Condominium) => void;
    onCreateCondominium: () => void;
}

export const CondominiumManagementScreen: React.FC<CondominiumManagementScreenProps> = ({
    onBack,
    onEditCondominium,
    onCreateCondominium
}) => {
    const [selectedFilter, setSelectedFilter] = useState<CondominiumStatus | 'all'>('all');
    const [nameFilter, setNameFilter] = useState('');
    const [cepFilter, setCepFilter] = useState('');
    const [condominiums, setCondominiums] = useState<Condominium[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCondominiums();
    }, []);

    const loadCondominiums = async () => {
        try {
            setLoading(true);
            const data = await getCondominiums();
            setCondominiums(data);
        } catch (error) {
            console.error('Erro ao carregar condomínios:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCondominiums = async (): Promise<Condominium[]> => {
        const response = await condominiumService.getAll();
        console.log('📦 Resposta de condomínios (API):', response);

        if (!response.dados) return [];

        const mappedCondominiums = response.dados.map((cond) => ({
            id: Number(cond.id),
            name: cond.nome || 'Sem nome',
            address: cond.endereco || '',
            cep: cond.cep || '',
            status: (cond.ativo === false ? 'inactive' : 'active') as CondominiumStatus,
        }));

        console.log('🏢 Condomínios mapeados:', mappedCondominiums);
        return mappedCondominiums;
    };

    const getStatusLabel = (status: CondominiumStatus) => {
        return status === 'active' ? 'Ativo' : 'Inativo';
    };

    const getStatusColor = (status: CondominiumStatus) => {
        return status === 'active' ? COLORS.primary : COLORS.text.secondary;
    };

    const filteredCondominiums = condominiums.filter(cond => {
        const matchesStatus = selectedFilter === 'all' || cond.status === selectedFilter;
        const matchesName = cond.name.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesCep = cond.cep.includes(cepFilter);
        return matchesStatus && matchesName && matchesCep;
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <Loading />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Gerenciamento de Condomínios</Text>

                <TouchableOpacity style={styles.createButton} onPress={onCreateCondominium}>
                    <Text style={styles.createButtonText}>Cadastrar Novo Condomínio</Text>
                </TouchableOpacity>

                <Text style={styles.filterTitle}>Filtro</Text>

                <View style={styles.filterChips}>
                    <TouchableOpacity
                        style={[styles.chip, selectedFilter === 'active' && styles.chipActive]}
                        onPress={() => setSelectedFilter(selectedFilter === 'active' ? 'all' : 'active')}
                    >
                        <Text style={[styles.chipText, selectedFilter === 'active' && styles.chipTextActive]}>
                            Ativos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, selectedFilter === 'inactive' && styles.chipActive]}
                        onPress={() => setSelectedFilter(selectedFilter === 'inactive' ? 'all' : 'inactive')}
                    >
                        <Text style={[styles.chipText, selectedFilter === 'inactive' && styles.chipTextActive]}>
                            Inativos
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchInputs}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nome do condomínio"
                        value={nameFilter}
                        onChangeText={setNameFilter}
                        placeholderTextColor={COLORS.text.secondary}
                    />

                    <TextInput
                        style={styles.searchInput}
                        placeholder="CEP"
                        value={cepFilter}
                        onChangeText={setCepFilter}
                        placeholderTextColor={COLORS.text.secondary}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.condominiumList}>
                    {filteredCondominiums.map((condominium) => (
                        <View key={condominium.id} style={styles.condominiumCard}>
                            <View style={styles.condominiumIcon}>
                                <Ionicons name="home" size={32} color={COLORS.primary} />
                            </View>
                            <View style={styles.condominiumInfo}>
                                <Text style={styles.condominiumName}>{condominium.name}</Text>
                                <Text style={styles.condominiumAddress}>{condominium.address}</Text>
                                <Text style={styles.condominiumCep}>{condominium.cep}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(condominium.status) }]}>
                                    <Text style={styles.statusBadgeText}>{getStatusLabel(condominium.status)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => onEditCondominium(condominium)}
                            >
                                <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    createButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    createButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    filterChips: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
        justifyContent: 'center'
    },
    chip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        color: COLORS.text.primary,
    },
    chipTextActive: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    searchInputs: {
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    searchInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: 16,
        color: COLORS.text.primary,
    },
    condominiumList: {
        gap: SPACING.md,
    },
    condominiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    condominiumIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    condominiumInfo: {
        flex: 1,
    },
    condominiumName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    condominiumAddress: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: 2,
    },
    condominiumCep: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.surface,
    },
    editButton: {
        padding: SPACING.xs,
    },
});
