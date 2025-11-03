import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Input, Button, PasswordInput } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

type UserRole = 'coletor' | 'sindico' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserFormScreenProps {
  onBack: () => void;
  user?: User; 
}

// Mock data de condomínios
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
  const [selectedCondominium, setSelectedCondominium] = useState('Edifício Tulipas');
  
  // Estados dos modais
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCondominiumModal, setShowCondominiumModal] = useState(false);
  const [condominiumSearch, setCondominiumSearch] = useState('');

  const filteredCondominiums = CONDOMINIUMS.filter(cond =>
    cond.name.toLowerCase().includes(condominiumSearch.toLowerCase())
  );

  const getRoleLabel = (role: UserRole) => {
    return ROLES.find(r => r.value === role)?.label || 'Coletor';
  };

  const handleSave = () => {
    if (!name || !email || (!isEditing && !password)) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const action = isEditing ? 'atualizado' : 'cadastrado';
    Alert.alert('Sucesso', `Usuário ${action} com sucesso!`);
    onBack();
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
          <Ionicons 
            name={isEditing ? "person-circle-outline" : "person-add-outline"} 
            size={48} 
            color={COLORS.primary} 
          />
          <Text style={styles.title}>
            {isEditing ? 'Editar Usuário' : 'Cadastrar Usuário'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Card de Informações Pessoais */}
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
              />

              <Text style={styles.label}>E-Mail:</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="joaosilva@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <PasswordInput
                value={password}
                onChangeText={setPassword}
                label="Senha"
                placeholder={isEditing ? "Deixe em branco para manter" : "**********"}
              />
            </View>
          </View>

          {/* Card de Permissões e Localização */}
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
                  <Ionicons name="home-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.selectText}>{selectedCondominium}</Text>
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
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Tipo */}
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

      {/* Modal de Seleção de Condomínio */}
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
  // Role selection styles
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
  // Condominium selection styles
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
