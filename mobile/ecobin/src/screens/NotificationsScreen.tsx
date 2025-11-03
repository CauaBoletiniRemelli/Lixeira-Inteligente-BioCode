import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface Notification {
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'alert' | 'info' | 'warning';
}

interface NotificationsScreenProps {
    onBack: () => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        message: 'A lixeira da portaria principal está cheia!',
        timestamp: '2024-11-03T10:30:00',
        read: false,
        type: 'alert',
    },
    {
        id: '2',
        message: 'Lixeira do salão de festas está com 70% da capacidade',
        timestamp: '2024-11-03T09:15:00',
        read: false,
        type: 'warning',
    },
    {
        id: '3',
        message: 'Novo sensor cadastrado no condomínio Edifício Tulipas',
        timestamp: '2024-11-02T16:45:00',
        read: true,
        type: 'info',
    },
    {
        id: '4',
        message: 'A lixeira da área da piscina está cheia!',
        timestamp: '2024-11-02T14:20:00',
        read: true,
        type: 'alert',
    },
    {
        id: '5',
        message: 'Manutenção programada para o sensor do playground',
        timestamp: '2024-11-02T11:30:00',
        read: true,
        type: 'info',
    },
];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const handleDeleteNotification = (id: string) => {
        Alert.alert(
            'Excluir Notificação',
            'Tem certeza que deseja excluir esta notificação?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                        setNotifications(prev => prev.filter(notif => notif.id !== id));
                    },
                },
            ]
        );
    };

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    };

    const getIconName = (type: Notification['type']) => {
        switch (type) {
            case 'alert':
                return 'alert-circle';
            case 'warning':
                return 'warning';
            case 'info':
                return 'information-circle';
        }
    };

    const getIconColor = (type: Notification['type']) => {
        switch (type) {
            case 'alert':
                return COLORS.error;
            case 'warning':
                return COLORS.warning;
            case 'info':
                return COLORS.primary;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
            return `Há ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
        } else if (diffInHours < 24) {
            return `Há ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `Há ${diffInDays} dia${diffInDays !== 1 ? 's' : ''}`;
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.read && styles.notificationCardUnread,
            ]}
            onPress={() => handleMarkAsRead(item.id)}
            activeOpacity={0.95}
        >
            <View style={styles.notificationContent}>
                <View style={styles.notificationIcon}>
                    <Ionicons
                        name={getIconName(item.type)}
                        size={24}
                        color={getIconColor(item.type)}
                    />
                </View>

                <View style={styles.notificationText}>
                    <Text style={[
                        styles.notificationMessage,
                        !item.read && styles.notificationMessageUnread,
                    ]}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {formatTimestamp(item.timestamp)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>

            {!item.read && <View style={styles.unreadIndicator} />}
        </TouchableOpacity>
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack} />
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notificações</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-off-outline" size={64} color={COLORS.text.secondary} />
                    <Text style={styles.emptyText}>Nenhuma notificação</Text>
                    <Text style={styles.emptySubtext}>
                        Você não tem notificações no momento
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    headerSpacer: {
        width: 44,
    },
    badge: {
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xs,
    },
    badgeText: {
        color: COLORS.text.white,
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: SPACING.md,
    },
    notificationCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },
    notificationCardUnread: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        backgroundColor: COLORS.surface,
        shadowColor: COLORS.primary,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: SPACING.md,
        gap: SPACING.md,
    },
    notificationIcon: {
        marginTop: 2,
    },
    notificationText: {
        flex: 1,
        gap: SPACING.xs,
    },
    notificationMessage: {
        fontSize: 14,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    notificationMessageUnread: {
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.text.secondary,
    },
    deleteButton: {
        padding: SPACING.xs,
    },
    unreadIndicator: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginTop: SPACING.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
});
