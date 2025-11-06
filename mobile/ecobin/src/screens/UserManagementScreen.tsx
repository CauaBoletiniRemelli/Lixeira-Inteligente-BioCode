import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { userService } from '../services';
import { User } from '../types';
import { mapTipoToRole } from '../utils';

type UserRole = 'coletor' | 'sindico' | 'admin';

interface UserManagementScreenProps {
    onBack: () => void;
    onEditUser: (user: User) => void;
    onCreateUser: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
    onBack,
    onEditUser,
    onCreateUser
}) => {
    const [selectedFilter, setSelectedFilter] = useState<UserRole | 'all'>('all');
    const [emailFilter, setEmailFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUsers = async (): Promise<User[]> => {
        const response = await userService.getAll();
        if (!response.dados) return [];
        
        return response.dados.map((user) => ({
            id: Number(user.id),
            name: user.nome || 'Sem nome',
            email: user.email || '',
            role: mapTipoToRole(user.tipo),
            condominiumId: user.condominioId ? Number(user.condominioId) : undefined,
            condominiumName: user.condominio,
        }));
    }

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'coletor': return 'Coletor';
            case 'sindico': return 'Síndico';
            case 'admin': return 'Admin';
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'coletor': return '#4CAF50';
            case 'sindico': return '#2196F3';
            case 'admin': return '#FF9800';
        }
    };

    const filteredUsers = users.filter((user: User) => {
        const matchesRole = selectedFilter === 'all' || user.role === selectedFilter;
        const matchesEmail = user.email?.toLowerCase().includes(emailFilter.toLowerCase()) ?? true;
        const matchesName = user.name?.toLowerCase().includes(nameFilter.toLowerCase()) ?? true;
        return matchesRole && matchesEmail && matchesName;
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
                <Text style={styles.title}>Gerenciar Usuários</Text>

                <TouchableOpacity style={styles.createButton} onPress={onCreateUser}>
                    <Text style={styles.createButtonText}>Cadastrar Novo Usuário</Text>
                </TouchableOpacity>

                <Text style={styles.filterTitle}>Filtro</Text>

                <View style={styles.filterChips}>
                    <TouchableOpacity
                        style={[styles.chip, selectedFilter === 'coletor' && styles.chipActive]}
                        onPress={() => setSelectedFilter(selectedFilter === 'coletor' ? 'all' : 'coletor')}
                    >
                        <Text style={[styles.chipText, selectedFilter === 'coletor' && styles.chipTextActive]}>
                            Coletores
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, selectedFilter === 'sindico' && styles.chipActive]}
                        onPress={() => setSelectedFilter(selectedFilter === 'sindico' ? 'all' : 'sindico')}
                    >
                        <Text style={[styles.chipText, selectedFilter === 'sindico' && styles.chipTextActive]}>
                            Síndicos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, selectedFilter === 'admin' && styles.chipActive]}
                        onPress={() => setSelectedFilter(selectedFilter === 'admin' ? 'all' : 'admin')}
                    >
                        <Text style={[styles.chipText, selectedFilter === 'admin' && styles.chipTextActive]}>
                            Administradores
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchInputs}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Email"
                        value={emailFilter}
                        onChangeText={setEmailFilter}
                        placeholderTextColor={COLORS.text.secondary}
                    />

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nome"
                        value={nameFilter}
                        onChangeText={setNameFilter}
                        placeholderTextColor={COLORS.text.secondary}
                    />
                </View>

                <View style={styles.userList}>
                    {filteredUsers.map((user) => (
                        <View key={user.id} style={styles.userCard}>
                            <View style={styles.userAvatar}>
                                <Ionicons name="person" size={32} color={COLORS.primary} />
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                                    <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => onEditUser(user)}
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
        gap: SPACING.xs,
        marginBottom: SPACING.md,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface
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
    userList: {
        gap: SPACING.md,
    },
    userCard: {
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
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.surface,
    },
    editButton: {
        padding: SPACING.xs,
    },
});
