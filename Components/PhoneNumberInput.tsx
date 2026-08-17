import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

interface PhoneNumberInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
}

export default function PhoneNumberInput({ label, value, onChangeText, error, required }: PhoneNumberInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <View style={styles.prefixChip}>
          <Text style={styles.prefixText}>🇮🇳 +91</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, '').slice(0, 10))}
          placeholder="9876543210"
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
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
  field: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  prefixChip: {
    backgroundColor: colors.steelSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 2,
    marginRight: spacing.sm,
  },
  prefixText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.steelBlue,
  },
  input: {
    flex: 1,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.ink,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
  },
});
