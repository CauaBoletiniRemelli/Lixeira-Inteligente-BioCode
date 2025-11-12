import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, TextStyle } from 'react-native';
import { COLORS } from '../constants';

interface BackButtonProps extends TouchableOpacityProps {
  onPress: () => void;
  color?: string;
  textStyle?: TextStyle;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style, color, textStyle, ...rest }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.backButton, style]} {...rest}>
      <Text style={[styles.backButtonText, { color: color || COLORS.text.primary }, textStyle]}>‹</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 40,
    fontWeight: '300',
    color: COLORS.text.primary,
    lineHeight: 40,
  },
});
