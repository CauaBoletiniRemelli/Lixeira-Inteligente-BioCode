import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewProps,
} from 'react-native';
import { COLORS, SPACING } from '../constants';

interface LoadingProps extends ViewProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  color = COLORS.primary,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.container, style]} {...rest}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
