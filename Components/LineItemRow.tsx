import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatCurrency } from '../Services/format';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../Theme/theme';

export interface LineItemDraft {
  id: number;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  gstRate: string;
}

interface LineItemRowProps {
  item: LineItemDraft;
  amount: number;
  error?: string;
  onChange: (id: number, patch: Partial<LineItemDraft>) => void;
  onRemove: (id: number) => void;
}

export default function LineItemRow({ item, amount, error, onChange, onRemove }: LineItemRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.descriptionInput}
          value={item.description}
          onChangeText={(text) => onChange(item.id, { description: text })}
          placeholder="Item description"
          placeholderTextColor={colors.placeholder}
        />
        <Pressable onPress={() => onRemove(item.id)} hitSlop={8} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.fieldsRow}>
        <View style={[styles.field, styles.qtyField]}>
          <Text style={styles.fieldLabel}>Qty</Text>
          <TextInput
            style={styles.fieldInput}
            value={item.quantity}
            onChangeText={(text) => onChange(item.id, { quantity: text })}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={[styles.field, styles.unitField]}>
          <Text style={styles.fieldLabel}>Unit</Text>
          <TextInput
            style={styles.fieldInput}
            value={item.unit}
            onChangeText={(text) => onChange(item.id, { unit: text })}
            placeholder="nos"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={[styles.field, styles.rateField]}>
          <Text style={styles.fieldLabel}>Rate</Text>
          <TextInput
            style={styles.fieldInput}
            value={item.rate}
            onChangeText={(text) => onChange(item.id, { rate: text })}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={[styles.field, styles.gstField]}>
          <Text style={styles.fieldLabel}>GST %</Text>
          <TextInput
            style={styles.fieldInput}
            value={item.gstRate}
            onChangeText={(text) => onChange(item.id, { gstRate: text })}
            keyboardType="decimal-pad"
            placeholder="18"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.amountText}>Amount: {formatCurrency(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  descriptionInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  removeButton: {
    marginLeft: spacing.sm + 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bodyBold,
    lineHeight: 20,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
  },
  qtyField: {
    flex: 0.8,
  },
  unitField: {
    flex: 0.9,
  },
  rateField: {
    flex: 1,
  },
  gstField: {
    flex: 0.8,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
  },
  amountText: {
    marginTop: spacing.sm + 2,
    fontSize: fontSize.md,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
});
