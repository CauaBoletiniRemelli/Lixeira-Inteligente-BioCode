import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Input, Button } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

type CondominiumStatus = 'active' | 'inactive';

interface Condominium {
  id: string;
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
    condominium?.address ? condominium.address.split(',')[0] : ''
  );
  const [number, setNumber] = useState(
    condominium?.address ? condominium.address.split(',')[1]?.trim() : ''
  );
  const [cep, setCep] = useState(condominium?.cep || '');
  const [status, setStatus] = useState<CondominiumStatus>(condominium?.status || 'active');

  const handleSave = () => {
    if (!name || !street || !number || !cep) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const action = isEditing ? 'atualizado' : 'cadastrado';
    Alert.alert('Sucesso', `Condomínio ${action} com sucesso!`);
    onBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja remover o condomínio ${condominium?.name}? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Sucesso', 'Condomínio removido com sucesso!');
            onBack();
          },
        },
      ]
    );
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
                <Text style={styles.label}>Nome</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Edifício Tulipas"
                />

                <Text style={styles.label}>Rua</Text>
                <Input
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Rua Arnaldo Costa"
                />

                <Text style={styles.label}>Número</Text>
                <Input
                  value={number}
                  onChangeText={setNumber}
                  placeholder="118"
                  keyboardType="numeric"
                />

                <Text style={styles.label}>CEP</Text>
                <Input
                  value={cep}
                  onChangeText={setCep}
                  placeholder="00000-000"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Card de Status */}
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
                title={isEditing ? "Salvar Alterações" : "Cadastrar Condomínio"}
                onPress={handleSave}
                style={styles.saveButton}
              />
              
              {isEditing && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  <Text style={styles.deleteButtonText}>Remover Condomínio</Text>
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
});
