import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BackButton } from './BackButton';
import { SPACING } from '../constants';

interface HeaderWithLogoProps extends ViewProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export const HeaderWithLogo: React.FC<HeaderWithLogoProps> = ({
  onBackPress,
  showBackButton = true,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.header, style]} {...rest}>
      {showBackButton && onBackPress ? (
        <BackButton onPress={onBackPress} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  logoSmall: {
    width: 32,
    height: 32,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});
