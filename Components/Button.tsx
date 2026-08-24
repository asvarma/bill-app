import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dashed';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[styles.base, variantStyles[variant].container, isDisabled ? styles.disabled : null, style]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].spinnerColor} />
      ) : (
        <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: fontSize.xl,
  },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; label: { color: string; fontFamily: string }; spinnerColor: string }
> = {
  primary: {
    container: { backgroundColor: colors.amber },
    label: { color: colors.white, fontFamily: fontFamily.bodyBold },
    spinnerColor: colors.white,
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.ink },
    label: { color: colors.ink, fontFamily: fontFamily.bodySemiBold },
    spinnerColor: colors.ink,
  },
  danger: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.danger },
    label: { color: colors.danger, fontFamily: fontFamily.bodySemiBold },
    spinnerColor: colors.danger,
  },
  dashed: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.amber,
      borderStyle: 'dashed',
    },
    label: { color: colors.amberDark, fontFamily: fontFamily.bodySemiBold },
    spinnerColor: colors.amber,
  },
};
