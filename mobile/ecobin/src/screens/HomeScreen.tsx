import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface MenuCardProps {
  title: string;
  subtitle: string;
  iconComponent: React.ReactNode;
  onPress: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ title, subtitle, iconComponent, onPress }) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
    <View style={styles.iconWrapper}>
      {iconComponent}
    </View>
  </TouchableOpacity>
);

interface HomeScreenProps {
  onNavigateToUserManagement?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToUserManagement }) => {
  const { user, logout, hasPermission } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerActions}>
          {user?.role === 'coletor' && (
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Seja bem-vindo, {user?.name}</Text>

        <View style={styles.mapContainer}>
          <View style={styles.mapPin1}>
            <View style={styles.pinCircle} />
            <View style={styles.pinPoint} />
          </View>
          <View style={styles.mapPin2}>
            <View style={styles.pinCircle} />
            <View style={styles.pinPoint} />
          </View>
          <View style={styles.mapPin3}>
            <View style={styles.pinCircle} />
            <View style={styles.pinPoint} />
          </View>
          <View style={styles.mapPin4}>
            <View style={styles.pinCircle} />
            <View style={styles.pinPoint} />
          </View>
        </View>

        {hasPermission(['sindico', 'admin']) && (
          <MenuCard
            title="Cadastrar Novo Sensor"
            subtitle="Configurar um novo sensor"
            iconComponent={<MaterialCommunityIcons name="qrcode-scan" size={60} color={COLORS.primary} />}
            onPress={() => console.log('Cadastrar Sensor')}
          />
        )}

        {hasPermission(['admin']) && (
          <>
            <MenuCard
              title="Gerenciamento de Usuários"
              subtitle="Criar, editar ou excluir perfis"
              iconComponent={<Ionicons name="people" size={60} color={COLORS.primary} />}
              onPress={() => onNavigateToUserManagement?.()}
            />

            <MenuCard
              title="Gerenciamento de Condomínios"
              subtitle="Cadastrar ou editar condomínios"
              iconComponent={<MaterialCommunityIcons name="home-city" size={60} color={COLORS.primary} />}
              onPress={() => console.log('Gerenciar Condomínios')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.primary}10`,
  },
  logoutButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.error}10`,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  mapContainer: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  mapPin1: {
    position: 'absolute',
    top: 40,
    left: 30,
  },
  mapPin2: {
    position: 'absolute',
    top: 60,
    left: 100,
  },
  mapPin3: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
  mapPin4: {
    position: 'absolute',
    bottom: 40,
    left: 80,
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFB300',
    marginBottom: -10,
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFB300',
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    minHeight: 120,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  iconWrapper: {
    alignSelf: 'center',
    marginTop: SPACING.xs,
  },
});
