
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
    onNavigateToCondominiumManagement?: () => void;
    onNavigateToSensorSetup?: () => void;
    onNavigateToMap?: () => void;
    onNavigateToNotifications?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToUserManagement, onNavigateToCondominiumManagement, onNavigateToSensorSetup, onNavigateToMap, onNavigateToNotifications }) => {
    const { user, logout, hasPermission } = useAuth();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => onNavigateToNotifications?.()}
                >
                    <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.greeting}>Seja bem-vindo, {user?.name}</Text>

                <TouchableOpacity 
                    style={styles.mapContainer}
                    onPress={() => onNavigateToMap?.()}
                    activeOpacity={0.7}
                >
                    {/* Imagem do mapa */}
                    <Image 
                        source={require('../../assets/map-preview.png')}
                        style={styles.mapImage}
                        resizeMode="cover"
                    />
                    
                    {/* Overlay semi-transparente */}
                    <View style={styles.mapOverlay} />
                    
                    {/* Ícone de mapa no canto */}
                    <View style={styles.mapIconContainer}>
                        <Ionicons name="map" size={20} color={COLORS.primary} />
                        <Text style={styles.mapLabel}>Ver Mapa Completo</Text>
                    </View>

                    {/* Pins coloridos por status */}
                    <View style={styles.mapPin1}>
                        <Ionicons name="location" size={36} color={COLORS.error} />
                    </View>
                    <View style={styles.mapPin2}>
                        <Ionicons name="location" size={36} color={COLORS.success} />
                    </View>
                    <View style={styles.mapPin3}>
                        <Ionicons name="location" size={36} color={COLORS.warning} />
                    </View>
                    <View style={styles.mapPin4}>
                        <Ionicons name="location" size={36} color={COLORS.error} />
                    </View>
                    <View style={styles.mapPin5}>
                        <Ionicons name="location" size={36} color={COLORS.warning} />
                    </View>
                    <View style={styles.mapPin6}>
                        <Ionicons name="location" size={36} color={COLORS.success} />
                    </View>
                    <View style={styles.mapPin7}>
                        <Ionicons name="location" size={36} color={COLORS.error} />
                    </View>
                </TouchableOpacity>

                {hasPermission(['sindico', 'admin']) && (
                    <MenuCard
                        title="Cadastrar Novo Sensor"
                        subtitle="Configurar um novo sensor"
                        iconComponent={<MaterialCommunityIcons name="qrcode-scan" size={60} color={COLORS.primary} />}
                        onPress={() => onNavigateToSensorSetup?.()}
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
                            onPress={() => onNavigateToCondominiumManagement?.()}
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
        height: 200,
        backgroundColor: '#E0E0E0',
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    mapImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    mapIconContainer: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    mapLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
    },
    mapPin1: {
        position: 'absolute',
        top: 30,
        left: '25%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin2: {
        position: 'absolute',
        top: 95,
        left: '15%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin3: {
        position: 'absolute',
        top: 45,
        right: '20%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin4: {
        position: 'absolute',
        bottom: 55,
        left: '55%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin5: {
        position: 'absolute',
        bottom: 40,
        right: '15%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin6: {
        position: 'absolute',
        top: 70,
        left: '65%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    mapPin7: {
        position: 'absolute',
        top: 120,
        right: '35%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
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
