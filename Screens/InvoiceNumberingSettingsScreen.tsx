import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../Components/Button';
import type { BusinessRow } from '../Data/types';
import { getBusiness, updateInvoiceNumbering } from '../Services/database';
import { formatInvoiceNumber } from '../Services/format';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

export default function InvoiceNumberingSettingsScreen() {
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);

  const [prefix, setPrefix] = useState('');
  const [nextNumber, setNextNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const businessRow = await getBusiness(db);
      if (!cancelled) {
        setBusiness(businessRow);
        if (businessRow) {
          setPrefix(businessRow.invoice_prefix);
          setNextNumber(String(businessRow.invoice_next_number));
        }
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [db]);

  const parsedNextNumber = parseInt(nextNumber, 10);
  const previewNumber = formatInvoiceNumber(prefix, Number.isFinite(parsedNextNumber) ? parsedNextNumber : 0);

  async function handleSave() {
    if (!business) return;

    if (!Number.isFinite(parsedNextNumber) || parsedNextNumber < 1) {
      setError('Enter a valid starting number (1 or higher).');
      return;
    }

    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateInvoiceNumbering(db, business.id, prefix, parsedNextNumber);
      setSaved(true);
    } catch {
      setError('Could not save invoice numbering. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No business profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Controls the numbering for invoices you create from now on. Existing invoices keep their numbers.
      </Text>

      <Text style={styles.fieldLabel}>Invoice Prefix</Text>
      <TextInput
        style={styles.input}
        value={prefix}
        onChangeText={setPrefix}
        placeholder="e.g. INV-"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="characters"
      />

      <Text style={styles.fieldLabel}>Next Invoice Number</Text>
      <TextInput
        style={styles.input}
        value={nextNumber}
        onChangeText={setNextNumber}
        placeholder="1"
        placeholderTextColor={colors.placeholder}
        keyboardType="number-pad"
      />

      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Next invoice will be numbered</Text>
        <Text style={styles.previewValue}>{previewNumber}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>Saved.</Text> : null}

      <Button label="Save" onPress={handleSave} loading={saving} style={styles.saveButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  previewBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.amberSurface,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.amberDark,
    marginBottom: spacing.xs,
  },
  previewValue: {
    fontSize: fontSize.xxl + 2,
    fontFamily: fontFamily.headingBold,
    color: colors.amberDark,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  saved: {
    color: colors.success,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.xxl,
  },
});
