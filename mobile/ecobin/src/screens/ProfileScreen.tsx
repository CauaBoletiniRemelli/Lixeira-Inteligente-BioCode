import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Input, PasswordInput, Button } from '../components';
import Alerta from '../components/Alert';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { authService, userService } from '../services';
import { handleApiError, showApiAlert } from '../utils';

export const ProfileScreen: React.FC = () => {
    const { user } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [userType, setUserType] = useState(user?.role === 'admin' ? 'Administrador' : user?.role === 'sindico' ? 'Síndico' : 'Coletor');
    const [condominium, setCondominium] = useState(user?.condominiumName || 'Nenhum condomínio associado');

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [currentEmail, setCurrentEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [confirmNewEmail, setConfirmNewEmail] = useState('');

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const [updatingEmail, setUpdatingEmail] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const newPasswordRef = React.useRef<any>(null);
    const confirmNewPasswordRef = React.useRef<any>(null);

    const passwordsMatch = !confirmNewPassword || newPassword === confirmNewPassword;

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const handleChangeEmail = async () => {
        if (updatingEmail) return;

        if (!currentEmail || !newEmail || !confirmNewEmail) {
            showAlert('Preencha todos os campos', 'error');
            return;
        }

        if (currentEmail !== email) {
            showAlert('E-mail atual incorreto', 'error');
            return;
        }

        if (newEmail !== confirmNewEmail) {
            showAlert('Os novos e-mails não coincidem', 'error');
            return;
        }

        if (newEmail === currentEmail) {
            showAlert('O novo e-mail deve ser diferente do atual', 'error');
            return;
        }

        if (!user?.id) {
            showAlert('Usuário não identificado', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showAlert('Digite um e-mail válido', 'error');
            return;
        }

        const dto = {
            id: user.id,
            oldEmail: currentEmail,
            newEmail: newEmail,
        }

        console.log('DTO para alteração de e-mail:', dto);
        
        try {
            setUpdatingEmail(true);
            console.log('🔄 Iniciando requisição de alteração de e-mail...');
            const response = await userService.updateEmail(dto);
            console.log('📥 Resposta da alteração de e-mail:', response);
            console.log('📊 Status da resposta:', response?.status);
            console.log('📊 Mensagem da resposta:', response?.mensagem);
            
            if (response.status) {
                showAlert(response.mensagem, 'success');
                setShowEmailModal(false);
                setCurrentEmail('');
                setNewEmail('');
                setConfirmNewEmail('');
            } else {
                showAlert(response.mensagem, 'error');
            }
        } catch (error: any) {
            console.error('❌ Erro completo:', error);
            console.error('❌ Erro response:', error.response);
            console.error('❌ Erro data:', error.response?.data);
            const errorMsg = error.response?.data?.mensagem || 'Erro ao alterar e-mail';
            showAlert(errorMsg, 'error');
        } finally {
            setUpdatingEmail(false);
            console.log('✅ Finalizou processo de alteração de e-mail');
        }
    };

    const handleChangePassword = async () => {
        if (updatingPassword) return;

        if (!user?.id) {
            showAlert('Usuário não identificado', 'error');
            return;
        }

        const dto = {
            id: user.id,
            oldPassword: currentPassword,
            newPassword: newPassword,
        }

        try {
            setUpdatingPassword(true);
            const response = await userService.updatePassword(dto);

            if (response.status) {
                showAlert(response.mensagem, 'success');
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                showAlert(response.mensagem, 'error');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.mensagem || 'Erro ao alterar senha';
            showAlert(errorMsg, 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <Alerta message={alertMessage} type={alertType} visible={alertVisible} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={48} color={COLORS.primary} />
                        </View>
                    </View>
                    <Text style={styles.userName}>{name}</Text>
                    <View style={styles.roleChip}>
                        <Ionicons
                            name={
                                user?.role === 'admin' ? 'shield-checkmark' :
                                    user?.role === 'sindico' ? 'briefcase' :
                                        'person'
                            }
                            size={16}
                            color={COLORS.primary}
                        />
                        <Text style={styles.roleText}>{userType}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Informações Pessoais</Text>

                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.label}>Nome</Text>
                        </View>
                        <Input
                            value={name}
                            onChangeText={setName}
                            placeholder="Digite seu nome"
                            editable={false}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.label}>E-mail</Text>
                        </View>
                        <Input
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Digite seu e-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Ionicons name="home-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.label}>Condomínio</Text>
                        </View>
                        <Input
                            value={condominium}
                            onChangeText={setCondominium}
                            placeholder="Digite o condomínio"
                            editable={false}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Ações</Text>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setShowEmailModal(true)}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="mail" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionTitle}>Alterar E-mail</Text>
                        <Text style={styles.actionDescription}>Atualize seu endereço de e-mail</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} style={styles.actionChevron} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setShowPasswordModal(true)}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="key" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionTitle}>Alterar Senha</Text>
                        <Text style={styles.actionDescription}>Mantenha sua conta segura</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} style={styles.actionChevron} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={showEmailModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEmailModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEmailModal(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.keyboardAvoidingView}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Alterar E-mail</Text>
                                    <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.text.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    <Text style={styles.modalLabel}>E-mail atual:</Text>
                                    <Input
                                        value={currentEmail}
                                        onChangeText={setCurrentEmail}
                                        placeholder="Digite seu e-mail atual"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    <Text style={styles.modalLabel}>Novo e-mail:</Text>
                                    <Input
                                        value={newEmail}
                                        onChangeText={setNewEmail}
                                        placeholder="Digite o novo e-mail"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    <Text style={styles.modalLabel}>Confirme o novo e-mail:</Text>
                                    <Input
                                        value={confirmNewEmail}
                                        onChangeText={setConfirmNewEmail}
                                        placeholder="Digite novamente o novo e-mail"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={styles.modalCancelButton}
                                            onPress={() => {
                                                setShowEmailModal(false);
                                                setCurrentEmail('');
                                                setNewEmail('');
                                                setConfirmNewEmail('');
                                            }}
                                            disabled={updatingEmail}
                                        >
                                            <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.modalConfirmButton, updatingEmail && { opacity: 0.5 }]}
                                            onPress={handleChangeEmail}
                                            disabled={updatingEmail}
                                        >
                                            <Text style={styles.modalConfirmButtonText}>
                                                {updatingEmail ? 'Salvando...' : 'Confirmar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPasswordModal(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.keyboardAvoidingView}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Alterar Senha</Text>
                                    <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.text.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    <Text style={styles.modalLabel}>Senha atual:</Text>
                                    <PasswordInput
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        placeholder="Digite sua senha atual"
                                        returnKeyType="next"
                                        onSubmitEditing={() => newPasswordRef.current?.focus()}
                                    />

                                    <Text style={styles.modalLabel}>Nova senha:</Text>
                                    <PasswordInput
                                        ref={newPasswordRef}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Digite a nova senha"
                                        returnKeyType="next"
                                        onSubmitEditing={() => confirmNewPasswordRef.current?.focus()}
                                    />

                                    <Text style={styles.modalLabel}>Confirme a nova senha:</Text>
                                    <PasswordInput
                                        ref={confirmNewPasswordRef}
                                        value={confirmNewPassword}
                                        onChangeText={setConfirmNewPassword}
                                        placeholder="Digite novamente a nova senha"
                                        returnKeyType="done"
                                        error={!passwordsMatch ? 'As senhas não coincidem' : ''}
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={styles.modalCancelButton}
                                            onPress={() => {
                                                setShowPasswordModal(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmNewPassword('');
                                            }}
                                            disabled={updatingPassword}
                                        >
                                            <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.modalConfirmButton, (updatingPassword || !passwordsMatch) && { opacity: 0.5 }]}
                                            onPress={handleChangePassword}
                                            disabled={updatingPassword || !passwordsMatch}
                                        >
                                            <Text style={styles.modalConfirmButtonText}>
                                                {updatingPassword ? 'Salvando...' : 'Confirmar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
        position: 'relative',
        backgroundColor: COLORS.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 40,
    },
    notificationButton: {
        padding: SPACING.xs,
        position: 'absolute',
        right: SPACING.md,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xl * 2,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.surface,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
        marginLeft: SPACING.md,
    },
    formCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputGroup: {
        marginVertical: SPACING.sm,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    actionButtons: {
        marginHorizontal: SPACING.md,
        gap: SPACING.md,
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    actionDescription: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    actionChevron: {
        position: 'absolute',
        right: SPACING.lg,
        top: '50%',
        marginTop: -10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    keyboardAvoidingView: {
        width: '100%',
        maxWidth: 400,
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
    },
    modalBody: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.md,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    modalConfirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.white,
    },
    passwordMismatchWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.error}15`,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        gap: SPACING.xs,
        marginTop: -SPACING.xs,
    },
    passwordMismatchText: {
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '600',
        flex: 1,
    },
});

