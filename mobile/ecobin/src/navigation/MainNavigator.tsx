import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
    HomeScreen, 
    MapScreen, 
    ProfileScreen, 
    UserManagementScreen, 
    UserFormScreen, 
    CondominiumManagementScreen, 
    CondominiumFormScreen,
    QRCodeScannerScreen,
    SensorWiFiSetupScreen,
    SensorSetupSuccessScreen,
    NotificationsScreen
} from '../screens';
import { COLORS, SPACING } from '../constants';
import { User } from '../types';

type TabScreen = 'home' | 'map' | 'profile';
type ManagementScreen = 'userManagement' | 'userForm' | 'condominiumManagement' | 'condominiumForm' | 'qrScanner' | 'sensorWiFiSetup' | 'sensorSuccess' | 'notifications';

interface Condominium {
    id: string;
    name: string;
    address: string;
    cep: string;
    status: 'active' | 'inactive';
}

export const MainNavigator: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<TabScreen>('home');
    const [managementScreen, setManagementScreen] = React.useState<ManagementScreen | null>(null);
    const [editingUser, setEditingUser] = React.useState<User | undefined>(undefined);
    const [editingCondominium, setEditingCondominium] = React.useState<Condominium | undefined>(undefined);
    const [scannedSensorId, setScannedSensorId] = React.useState<string>('');

    const handleNavigateToUserManagement = () => {
        setManagementScreen('userManagement');
    };

    const handleNavigateToUserForm = (user?: User) => {
        setEditingUser(user);
        setManagementScreen('userForm');
    };

    const handleNavigateToCondominiumManagement = () => {
        setManagementScreen('condominiumManagement');
    };

    const handleNavigateToCondominiumForm = (condominium?: Condominium) => {
        setEditingCondominium(condominium);
        setManagementScreen('condominiumForm');
    };

    const handleNavigateToSensorSetup = () => {
        setManagementScreen('qrScanner');
    };

    const handleNavigateToNotifications = () => {
        setManagementScreen('notifications');
    };

    const handleQRScanSuccess = (sensorId: string) => {
        setScannedSensorId(sensorId);
        setManagementScreen('sensorWiFiSetup');
    };

    const handleSensorWiFiSuccess = () => {
        setManagementScreen('sensorSuccess');
    };

    const handleBackToHome = () => {
        setManagementScreen(null);
        setEditingUser(undefined);
        setEditingCondominium(undefined);
        setScannedSensorId('');
    };

    const handleBackToUserManagement = () => {
        setManagementScreen('userManagement');
        setEditingUser(undefined);
    };

    const handleBackToCondominiumManagement = () => {
        setManagementScreen('condominiumManagement');
        setEditingCondominium(undefined);
    };

    const renderManagementScreen = () => {
        if (managementScreen === 'userManagement') {
            return (
                <UserManagementScreen
                    onBack={handleBackToHome}
                    onEditUser={handleNavigateToUserForm}
                    onCreateUser={() => handleNavigateToUserForm()}
                />
            );
        }

        if (managementScreen === 'userForm') {
            return (
                <UserFormScreen
                    onBack={handleBackToUserManagement}
                    user={editingUser}
                />
            );
        }

        if (managementScreen === 'condominiumManagement') {
            return (
                <CondominiumManagementScreen
                    onBack={handleBackToHome}
                    onEditCondominium={handleNavigateToCondominiumForm}
                    onCreateCondominium={() => handleNavigateToCondominiumForm()}
                />
            );
        }

        if (managementScreen === 'condominiumForm') {
            return (
                <CondominiumFormScreen
                    onBack={handleBackToCondominiumManagement}
                    condominium={editingCondominium}
                />
            );
        }

        if (managementScreen === 'qrScanner') {
            return (
                <QRCodeScannerScreen
                    onBack={handleBackToHome}
                    onScanSuccess={handleQRScanSuccess}
                />
            );
        }

        if (managementScreen === 'sensorWiFiSetup') {
            return (
                <SensorWiFiSetupScreen
                    onBack={() => setManagementScreen('qrScanner')}
                    onSuccess={handleSensorWiFiSuccess}
                    sensorId={scannedSensorId}
                />
            );
        }

        if (managementScreen === 'sensorSuccess') {
            return (
                <SensorSetupSuccessScreen
                    onFinish={handleBackToHome}
                />
            );
        }

        if (managementScreen === 'notifications') {
            return (
                <NotificationsScreen
                    onBack={handleBackToHome}
                />
            );
        }

        return null;
    };

    const handleNavigateToMap = () => {
        setActiveTab('map');
    };

    const handleBackFromMap = () => {
        setActiveTab('home');
    };

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <HomeScreen
                        onNavigateToUserManagement={handleNavigateToUserManagement}
                        onNavigateToCondominiumManagement={handleNavigateToCondominiumManagement}
                        onNavigateToSensorSetup={handleNavigateToSensorSetup}
                        onNavigateToMap={handleNavigateToMap}
                        onNavigateToNotifications={handleNavigateToNotifications}
                    />
                );
            case 'map':
                return (
                    <MapScreen 
                        onNavigateToSensorSetup={handleNavigateToSensorSetup}
                        onBack={handleBackFromMap}
                    />
                );
            case 'profile':
                return <ProfileScreen />;
            default:
                return (
                    <HomeScreen
                        onNavigateToUserManagement={handleNavigateToUserManagement}
                        onNavigateToCondominiumManagement={handleNavigateToCondominiumManagement}
                        onNavigateToSensorSetup={handleNavigateToSensorSetup}
                        onNavigateToMap={handleNavigateToMap}
                    />
                );
        }
    };

    if (managementScreen) {
        return <View style={styles.container}>{renderManagementScreen()}</View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>{renderScreen()}</View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab('home')}
                >
                    <Ionicons
                        name={activeTab === 'home' ? 'home' : 'home-outline'}
                        size={28}
                        color={activeTab === 'home' ? COLORS.primary : COLORS.text.secondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab('profile')}
                >
                    <Ionicons
                        name={activeTab === 'profile' ? 'person' : 'person-outline'}
                        size={28}
                        color={activeTab === 'profile' ? COLORS.primary : COLORS.text.secondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: SPACING.sm,
        paddingTop: SPACING.xs,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
    },
});
