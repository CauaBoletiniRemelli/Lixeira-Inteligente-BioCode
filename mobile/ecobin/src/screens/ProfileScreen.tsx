import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Input, PasswordInput } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

export const ProfileScreen: React.FC = () => {
    const { user } = useAuth();

    const [name, setName] = useState(user?.name || 'João Da Silva');
    const [email, setEmail] = useState(user?.email || 'joaosilva@gmail.com');
    const [password, setPassword] = useState('***********');
    const [userType, setUserType] = useState(
        user?.role === 'admin' ? 'Administrador' :
            user?.role === 'sindico' ? 'Síndico' :
                'Coletor'
    );
    const [condominium, setCondominium] = useState('Edifício Tulipas');

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

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
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.label}>Senha</Text>
                        </View>
                        <PasswordInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Digite sua senha"
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
                        onPress={() => console.log('Alterar E-Mail')}
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
                        onPress={() => console.log('Alterar Senha')}
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
});
