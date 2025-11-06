import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Input, Button, PasswordInput, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { showApiAlert, handleApiError, showConfirmAlert } from '../utils';
import { userService, condominiumService } from '../services';
import Alerta from '../components/Alert';
import { User } from '../types';

type UserRole = 'coletor' | 'sindico' | 'admin';

interface UserFormScreenProps {
    onBack: () => void;
    user?: User;
}

interface CondominiumOption {
    id: string | number | null;
    name: string;
}

const ROLES = [
    { value: 'coletor' as UserRole, label: 'Coletor', icon: 'trash-outline' },
    { value: 'sindico' as UserRole, label: 'Síndico', icon: 'business-outline' },
    { value: 'admin' as UserRole, label: 'Administrador', icon: 'shield-checkmark-outline' },
];

export const UserFormScreen: React.FC<UserFormScreenProps> = ({ onBack, user }) => {
    const isEditing = !!user;

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'coletor');
    const [selectedCondominium, setSelectedCondominium] = useState<string | number | null>(null);
    const [condominiums, setCondominiums] = useState<CondominiumOption[]>([]);
    const [loadingCondominiums, setLoadingCondominiums] = useState(false);
    const [saving, setSaving] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showCondominiumModal, setShowCondominiumModal] = useState(false);
    const [condominiumSearch, setCondominiumSearch] = useState('');

    useEffect(() => {
        loadCondominiums();
    }, []);

    useEffect(() => {
        if (user?.condominiumId && condominiums.length > 0) {
            const userCondominiumId = user.condominiumId;
            
            const condominiumExists = condominiums.some(c => c.id === userCondominiumId);
            
            if (condominiumExists) {
                setSelectedCondominium(userCondominiumId);
            } else {
                console.log('❌ Condomínio não encontrado na lista');
            }
        }
    }, [user?.condominiumId, condominiums]);

    const loadCondominiums = async () => {
        try {
            setLoadingCondominiums(true);
            const response = await condominiumService.getAll();

            if (!response.dados) {
                setCondominiums([{ id: null, name: 'Nenhum' }]);
                return;
            }

            const condominiumsWithNone: CondominiumOption[] = [
                { id: null, name: 'Nenhum' },
                ...response.dados.map(cond => {
                    return { id: cond.id, name: cond.nome };
                })
            ];

            setCondominiums(condominiumsWithNone);
        } catch (error) {
            console.error('Erro ao carregar condomínios:', error);
            setCondominiums([{ id: null, name: 'Nenhum' }]);
        } finally {
            setLoadingCondominiums(false);
        }
    };

    const filteredCondominiums = condominiums.filter((cond: CondominiumOption) =>
        cond.name.toLowerCase().includes(condominiumSearch.toLowerCase())
    );

    const getRoleLabel = (role: UserRole) => {
        return ROLES.find(r => r.value === role)?.label || 'Coletor';
    };

    const getSelectedCondominiumName = () => {
        const cond = condominiums.find(c => c.id === selectedCondominium);
        return cond?.name || 'Selecione um condomínio';
    };

    const handleSave = async () => {
        if (!name || !email || (!isEditing && !password)) {
            showAlert('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (saving) return;

        try {
            setSaving(true);
            
            if (isEditing) {
                const updateData: any = {
                    Id: Number(user!.id),
                    Nome: name,
                    Email: email,
                    Tipo: selectedRole === 'admin' ? 1 : selectedRole === 'sindico' ? 2 : 3,
                    CondominioId: selectedCondominium ? Number(selectedCondominium) : undefined,
                };

                if (password) {
                    updateData.SenhaHash = password;
                }

                const response = await userService.update(String(user!.id), updateData);
                showApiAlert(response);
            } else {
                const createData = {
                    Nome: name,
                    Email: email,
                    SenhaHash: password,
                    Tipo: selectedRole === 'admin' ? 1 : selectedRole === 'sindico' ? 2 : 3,
                    CondominioId: selectedCondominium ? Number(selectedCondominium) : undefined,
                };
                
                const response = await userService.create(createData);
                showApiAlert(response);
            }

            onBack();
        } catch (error) {
            handleApiError(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirmAlert(
            'Confirmar Exclusão',
            `Tem certeza que deseja remover o usuário ${user?.name}? Esta ação não pode ser desfeita.`,
            'Remover',
            'Cancelar'
        );

        if (!confirmed) return;

        try {
            const response = await userService.delete(String(user!.id));
            showApiAlert(response);
            onBack();
        } catch (error) {
            handleApiError(error);
        }
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

                        <Text style={styles.title}>
                            {isEditing ? 'Editar Usuário' : 'Cadastrar Usuário'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isEditing ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Informações Pessoais</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.label}>Nome:</Text>
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="João Da Silva"
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />

                                <Text style={styles.label}>E-Mail:</Text>
                                <Input
                                    ref={emailInputRef}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="joaosilva@gmail.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />

                                <PasswordInput
                                    ref={passwordInputRef}
                                    value={password}
                                    onChangeText={setPassword}
                                    label="Senha"
                                    placeholder={isEditing ? "Deixe em branco para manter" : "**********"}
                                    returnKeyType="done"
                                />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Permissões e Localização</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.label}>Tipo</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => setShowRoleModal(true)}
                                >
                                    <View style={styles.selectContent}>
                                        <Ionicons
                                            name={ROLES.find(r => r.value === selectedRole)?.icon as any || 'person-outline'}
                                            size={20}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.selectText}>{getRoleLabel(selectedRole)}</Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>

                                <Text style={styles.label}>Condomínio</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => setShowCondominiumModal(true)}
                                >
                                    <View style={styles.selectContent}>
                                        <Ionicons
                                            name={selectedCondominium === null ? "close-circle-outline" : "home-outline"}
                                            size={20}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.selectText}>{getSelectedCondominiumName()}</Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={isEditing ? "Atualizar Usuário" : "Cadastrar Usuário"}
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving}
                            />

                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={handleDelete}
                                >
                                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                    <Text style={styles.deleteButtonText}>Remover Usuário</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showRoleModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRoleModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Tipo</Text>
                            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalList}>
                            {ROLES.map((role) => (
                                <TouchableOpacity
                                    key={role.value}
                                    style={[
                                        styles.roleOption,
                                        selectedRole === role.value && styles.roleOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedRole(role.value);
                                        setShowRoleModal(false);
                                    }}
                                >
                                    <View style={styles.roleInfo}>
                                        <Ionicons
                                            name={role.icon as any}
                                            size={24}
                                            color={selectedRole === role.value ? COLORS.primary : COLORS.text.secondary}
                                        />
                                        <Text style={[
                                            styles.roleLabel,
                                            selectedRole === role.value && styles.roleLabelSelected,
                                        ]}>
                                            {role.label}
                                        </Text>
                                    </View>
                                    {selectedRole === role.value && (
                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

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
                            keyExtractor={(item) => String(item.id || 'none')}
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
                                            name={item.id === null ? "close-circle-outline" : "home"}
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
    buttonContainer: {
        marginTop: SPACING.lg,
        gap: SPACING.md,
    },
    saveButton: {
        minHeight: 50,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.error}10`,
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 50,
    },
    deleteButtonText: {
        fontSize: 16,
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
    roleOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    roleOptionSelected: {
        backgroundColor: `${COLORS.primary}10`,
    },
    roleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roleLabel: {
        fontSize: 16,
        color: COLORS.text.primary,
    },
    roleLabelSelected: {
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
