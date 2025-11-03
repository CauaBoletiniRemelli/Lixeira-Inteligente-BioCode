import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { COLORS, SPACING } from '../constants';

interface SensorSetupSuccessScreenProps {
    onFinish: () => void;
}

export const SensorSetupSuccessScreen: React.FC<SensorSetupSuccessScreenProps> = ({ onFinish }) => {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={80} color={COLORS.text.white} />
                    </View>
                </View>

                <Text style={styles.title}>
                    Sensor Conectado Ao Wi-Fi{'\n'}Com Sucesso!
                </Text>

                <Button
                    title="Concluir"
                    onPress={onFinish}
                    style={styles.finishButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    iconContainer: {
        marginBottom: SPACING.xxl,
    },
    successCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
    },
    finishButton: {
        width: '100%',
        marginTop: SPACING.xl,
    },
});
