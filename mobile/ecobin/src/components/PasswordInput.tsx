import React, { useState, forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
    label?: string;
    error?: string;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(({
    label,
    error,
    style,
    onFocus,
    onBlur,
    ...rest
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputWrapper}>
                <TextInput
                    ref={ref}
                    style={[
                        styles.input,
                        isFocused && styles.inputFocused,
                        error && styles.inputError,
                        style,
                    ]}
                    placeholderTextColor={COLORS.text.hint}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    underlineColorAndroid="transparent"
                    secureTextEntry={!showPassword}
                    {...rest}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color={isFocused ? COLORS.primary : COLORS.text.secondary}
                    />
                </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginVertical: SPACING.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
        overflow: 'visible',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingRight: 50,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: COLORS.text.primary,
        minHeight: 52,
    },
    inputFocused: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    eyeButton: {
        position: 'absolute',
        right: SPACING.md,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 999,
        elevation: 999,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});
