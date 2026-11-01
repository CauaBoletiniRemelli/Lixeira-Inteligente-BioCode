import React from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, StyleSheet } from 'react-native';

/**
 * KeyboardAvoidingView com comportamento consistente nas duas plataformas.
 *
 * No Android com edge-to-edge (padrão do Expo SDK 54) o `adjustResize` não redimensiona mais a janela,
 * nem a da Activity nem a dos Modals, então o conteúdo precisa ganhar o padding do teclado por conta própria.
 * `padding` também é seguro se a janela for redimensionada: o KAV calcula só a sobreposição real.
 */
export const KeyboardAvoider: React.FC<KeyboardAvoidingViewProps> = ({ style, behavior = 'padding', ...props }) => (
  <KeyboardAvoidingView behavior={behavior} style={[styles.flex, style]} {...props} />
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
