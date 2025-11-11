import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Loading } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

interface NotificationsScreenProps {
    onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            if (user?.id) {
                const data = await notificationService.listNotifications(user.id);
                setNotifications(data);

                const unread = data.filter(n => !n.lida).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            Alert.alert('Erro', 'Não foi possível carregar as notificações');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (notificacaoId: number) => {
        try {
            const success = await notificationService.markAsRead(notificacaoId);
            if (success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificacaoId ? { ...notif, lida: true, dataLeitura: new Date().toISOString() } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            if (user?.id) {
                const success = await notificationService.markAllAsRead(user.id);
                if (success) {
                    setNotifications(prev =>
                        prev.map(notif => ({ ...notif, lida: true, dataLeitura: new Date().toISOString() }))
                    );
                    setUnreadCount(0);
                    Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas');
                }
            }
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            Alert.alert('Erro', 'Não foi possível marcar todas como lidas');
        }
    };

    const getIconName = (dados?: string) => {
        try {
            if (dados) {
                const parsed = JSON.parse(dados);
                if (parsed.tipo === 'alerta') return 'alert-circle';
                if (parsed.tipo === 'manutencao') return 'construct';
            }
        } catch (e) { }
        return 'notifications';
    };

    const getIconColor = (dados?: string) => {
        try {
            if (dados) {
                const parsed = JSON.parse(dados);
                if (parsed.tipo === 'alerta') return COLORS.error;
                if (parsed.tipo === 'manutencao') return COLORS.warning;
            }
        } catch (e) { }
        return COLORS.primary;
    };

    const formatTimestamp = (timestamp: string) => {
        // Remove o timezone do backend e trata como horário local
        const dateStr = timestamp.replace(/\.\d+$/, '').replace('Z', '');
        const date = new Date(dateStr);
        const now = new Date();

        // Calcula a diferença em minutos
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        console.log('Formatando timestamp:', timestamp, '->', date.toString(), 'Diff:', diffInMinutes, 'minutos');

        if (diffInMinutes < 0) {
            return 'Agora mesmo';
        } else if (diffInMinutes < 1) {
            return 'Agora mesmo';
        } else if (diffInMinutes < 60) {
            return `Há ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
        } else if (diffInMinutes < 1440) { // 24 horas
            const diffInHours = Math.floor(diffInMinutes / 60);
            return `Há ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
        } else {
            const diffInDays = Math.floor(diffInMinutes / 1440);
            return `Há ${diffInDays} dia${diffInDays !== 1 ? 's' : ''}`;
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.lida && styles.notificationCardUnread,
            ]}
            onPress={() => !item.lida && handleMarkAsRead(item.id)}
            activeOpacity={0.95}
        >
            <View style={styles.notificationContent}>
                <View style={styles.notificationIcon}>
                    <Ionicons
                        name={getIconName(item.dados) as any}
                        size={24}
                        color={getIconColor(item.dados)}
                    />
                </View>

                <View style={styles.notificationText}>
                    <Text style={[
                        styles.notificationTitle,
                        !item.lida && styles.notificationTitleUnread,
                    ]}>
                        {item.titulo}
                    </Text>
                    <Text style={[
                        styles.notificationMessage,
                        !item.lida && styles.notificationMessageUnread,
                    ]}>
                        {item.mensagem}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {formatTimestamp(item.dataEnvio)}
                    </Text>
                </View>

                {!item.lida && <View style={styles.unreadIndicator} />}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <Loading />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <BackButton onPress={onBack} />
                <Text style={styles.headerTitle}>Notificações</Text>
                <View style={styles.headerRight} />
            </View>

            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <Text style={styles.unreadText}>
                        {unreadCount} notificação{unreadCount !== 1 ? 'ões' : ''} não lida{unreadCount !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={styles.markAllButton}>Marcar todas como lidas</Text>
                    </TouchableOpacity>
                </View>
            )}

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color={COLORS.text.secondary} />
                    <Text style={styles.emptyText}>Nenhuma notificação</Text>
                    <Text style={styles.emptySubtext}>
                        Você receberá notificações sobre o status das lixeiras
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                        />
                    }
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 44,
    },
    unreadBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary + '30',
    },
    unreadText: {
        fontSize: 14,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    markAllButton: {
        fontSize: 14,
        color: COLORS.primary,
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
    },
    notificationCardUnread: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08',
    },
    notificationContent: {
        flexDirection: 'row',
        padding: SPACING.md,
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    notificationText: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    notificationTitleUnread: {
        fontWeight: '600',
    },
    notificationMessage: {
        fontSize: 14,
        color: COLORS.text.secondary,
        lineHeight: 20,
        marginBottom: SPACING.xs,
    },
    notificationMessageUnread: {
        color: COLORS.text.primary,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.text.secondary,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
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
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
});
