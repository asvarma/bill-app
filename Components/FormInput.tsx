import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
}

export default function FormInput({ label, error, required, optional, style, ...rest }: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
        {optional ? <Text style={styles.optionalHint}> (optional)</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.placeholder}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyBold,
    color: colors.ink,
    marginBottom: spacing.xs + 2,
  },
  asterisk: {
    color: colors.amberDark,
  },
  optionalHint: {
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  input: {
    minHeight: minTouchTarget,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
  },
});
