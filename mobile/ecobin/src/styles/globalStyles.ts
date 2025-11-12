import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padding: {
    padding: SPACING.md,
  },
  paddingHorizontal: {
    paddingHorizontal: SPACING.md,
  },
  paddingVertical: {
    paddingVertical: SPACING.md,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
});
