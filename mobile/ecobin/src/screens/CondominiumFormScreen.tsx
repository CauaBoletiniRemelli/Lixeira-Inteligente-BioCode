import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Input, Button } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { condominiumService } from '../services';
import { showApiAlert, handleApiError, showConfirmAlert } from '../utils';
import Alerta from '../components/Alert';
import axios from 'axios';

type CondominiumStatus = 'active' | 'inactive';

interface Condominium {
    id: number;
    name: string;
    address: string;
    cep: string;
    status: CondominiumStatus;
}

interface CondominiumFormScreenProps {
    onBack: () => void;
    condominium?: Condominium;
}

export const CondominiumFormScreen: React.FC<CondominiumFormScreenProps> = ({
    onBack,
    condominium
}) => {
    const isEditing = !!condominium;

    const [name, setName] = useState(condominium?.name || '');
    const [street, setStreet] = useState(
        condominium?.address ? condominium.address.split(',')[0]?.trim() : ''
    );
    const [number, setNumber] = useState(
        condominium?.address ? condominium.address.split(',')[1]?.trim() : ''
    );
    const [cep, setCep] = useState(condominium?.cep || '');
    const [status, setStatus] = useState<CondominiumStatus>(condominium?.status || 'active');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepValidated, setCepValidated] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
    };

    const nameInputRef = useRef<TextInput>(null);
    const numberInputRef = useRef<TextInput>(null);
    const cepInputRef = useRef<TextInput>(null);

    const formatCep = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const limited = cleaned.slice(0, 8);

        if (limited.length <= 5) {
            return limited;
        }

        return `${limited.slice(0, 5)}-${limited.slice(5)}`;
    };

    const handleCepChange = (text: string) => {
        const formatted = formatCep(text);
        setCep(formatted);
        setCepValidated(false);
        setStreet('');
    };

    // Buscar CEP no ViaCEP
    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '');
        
        if (cleanCep.length !== 8) {
            if (cleanCep.length > 0) {
                showAlert('CEP deve ter 8 dígitos', 'error');
            }
            return;
        }

        try {
            setLoadingCep(true);
            const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
            
            if (response.data.erro) {
                showAlert('CEP não encontrado', 'error');
                setCep('');
                setStreet('');
                setCepValidated(false);
                return;
            }

            setStreet(response.data.logradouro);
            setCepValidated(true);
            showAlert('CEP validado com sucesso!', 'success');
            
            // Focar no campo de nome após validar CEP
            setTimeout(() => nameInputRef.current?.focus(), 100);
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            showAlert('Erro ao buscar CEP. Tente novamente.', 'error');
            setCepValidated(false);
        } finally {
            setLoadingCep(false);
        }
    };

    const handleNumberChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const limited = cleaned.slice(0, 6);
        setNumber(limited);
    };

    const handleSave = async () => {
        if (saving) return;

        if (!name || !cep || !number) {
            showAlert('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (!cepValidated) {
            showAlert('Valide o CEP antes de salvar', 'error');
            return;
        }

        try {
            setSaving(true);

            const fullAddress = `${street}, ${number}`;

            if (isEditing) {
                const updateData = {
                    Id: condominium!.id,
                    Nome: name,
                    Endereco: fullAddress,
                    CEP: cep,
                    Ativo: status === 'active',
                };

                const response = await condominiumService.update(condominium!.id, updateData);
                showApiAlert(response);
            } else {
                const createData = {
                    Nome: name,
                    Endereco: fullAddress,
                    CEP: cep, 
                    Ativo: status === 'active',
                };
                const response = await condominiumService.create(createData);
                showApiAlert(response);
            }

            onBack();
        } catch (error: any) {
            console.error('❌ Erro completo:', error);
            console.error('❌ Erro response:', error.response);
            console.error('❌ Erro data:', error.response?.data);
            console.error('❌ Erro status:', error.response?.status);
            console.error('❌ Erro message:', error.message);
            handleApiError(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleting) return;

        const confirmed = await showConfirmAlert(
            'Confirmar Exclusão',
            `Tem certeza que deseja remover o condomínio ${condominium?.name}? Esta ação não pode ser desfeita.`,
            'Remover',
            'Cancelar'
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            const response = await condominiumService.delete(condominium!.id);
            showApiAlert(response);
            onBack();
        } catch (error: any) {
            handleApiError(error);
        } finally {
            setDeleting(false);
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
                            {isEditing ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isEditing
                                ? 'Atualize as informações do condomínio'
                                : 'Preencha os dados do novo condomínio'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Card de Informações do Condomínio */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Informações do Condomínio</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.label}>CEP</Text>
                                <View style={styles.inputWrapper}>
                                    <Input
                                        ref={cepInputRef}
                                        value={cep}
                                        onChangeText={handleCepChange}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        keyboardType="numeric"
                                        returnKeyType="done"
                                        maxLength={9}
                                        editable={!loadingCep}
                                    />
                                    {loadingCep && (
                                        <ActivityIndicator 
                                            size="small" 
                                            color={COLORS.primary} 
                                            style={styles.cepIcon}
                                        />
                                    )}
                                    {cepValidated && !loadingCep && (
                                        <Ionicons 
                                            name="checkmark-circle" 
                                            size={24} 
                                            color={COLORS.success} 
                                            style={styles.cepIcon}
                                        />
                                    )}
                                </View>

                                <Text style={styles.label}>Rua</Text>
                                <Input
                                    value={street}
                                    placeholder="Aguardando CEP..."
                                    editable={false}
                                    style={styles.disabledInput}
                                />

                                <Text style={styles.label}>Nome do Condomínio</Text>
                                <Input
                                    ref={nameInputRef}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Edifício Tulipas"
                                    returnKeyType="next"
                                    onSubmitEditing={() => numberInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                    editable={cepValidated}
                                />

                                <Text style={styles.label}>Número</Text>
                                <Input
                                    ref={numberInputRef}
                                    value={number}
                                    onChangeText={handleNumberChange}
                                    placeholder="118"
                                    keyboardType="numeric"
                                    returnKeyType="done"
                                    maxLength={6}
                                    editable={cepValidated}
                                />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="toggle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Status</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.statusOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            status === 'active' && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setStatus('active')}
                                    >
                                        <Ionicons
                                            name={status === 'active' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                            size={24}
                                            color={status === 'active' ? COLORS.primary : COLORS.text.secondary}
                                        />
                                        <Text style={[
                                            styles.statusOptionText,
                                            status === 'active' && styles.statusOptionTextActive,
                                        ]}>
                                            Ativo
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            status === 'inactive' && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setStatus('inactive')}
                                    >
                                        <Ionicons
                                            name={status === 'inactive' ? 'close-circle' : 'close-circle-outline'}
                                            size={24}
                                            color={status === 'inactive' ? COLORS.text.secondary : COLORS.text.secondary}
                                        />
                                        <Text style={[
                                            styles.statusOptionText,
                                            status === 'inactive' && styles.statusOptionTextActive,
                                        ]}>
                                            Inativo
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Condomínio"}
                                onPress={handleSave}
                                loading={saving}
                                disabled={saving || deleting}
                                style={styles.saveButton}
                            />

                            {isEditing && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                                    onPress={handleDelete}
                                    disabled={deleting || saving}
                                >
                                    <Ionicons name="trash-outline" size={20} color={deleting || saving ? COLORS.text.secondary : COLORS.error} />
                                    <Text style={[styles.deleteButtonText, (deleting || saving) && styles.deleteButtonTextDisabled]}>
                                        {deleting ? "Removendo..." : "Remover Condomínio"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    statusOptions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    statusOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.background,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
    },
    statusOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}10`,
    },
    statusOptionText: {
        fontSize: 16,
        color: COLORS.text.secondary,
    },
    statusOptionTextActive: {
        fontWeight: '600',
        color: COLORS.primary,
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
    deleteButtonDisabled: {
        opacity: 0.5,
    },
    deleteButtonTextDisabled: {
        color: COLORS.text.secondary,
    },
    inputWrapper: {
        position: 'relative',
    },
    cepIcon: {
        position: 'absolute',
        right: SPACING.md,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    cepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cepLoader: {
        position: 'absolute',
        right: SPACING.md,
    },
    cepCheck: {
        position: 'absolute',
        right: SPACING.md,
    },
    disabledInput: {
        backgroundColor: COLORS.background,
        opacity: 0.7,
    },
});
