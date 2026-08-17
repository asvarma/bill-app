import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../Components/Button';
import InvoiceDocument from '../Components/InvoiceDocument';
import type { BusinessRow, InvoiceItemRow, InvoiceRow } from '../Data/types';
import type { RootStackParamList } from '../Navigation/types';
import { getBusinessById, getInvoiceById, getInvoiceItems } from '../Services/database';
import { shareInvoicePdf } from '../Services/shareInvoice';
import { colors, fontFamily, fontSize, spacing } from '../Theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoicePreview'>;

export default function InvoicePreviewScreen({ route, navigation }: Props) {
  const { invoiceId } = route.params;
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[]>([]);

  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      const invoiceRow = await getInvoiceById(db, invoiceId);
      if (cancelled) return;
      if (!invoiceRow) {
        setLoadError('Invoice not found.');
        setLoading(false);
        return;
      }

      const [businessRow, itemRows] = await Promise.all([
        getBusinessById(db, invoiceRow.business_id),
        getInvoiceItems(db, invoiceRow.id),
      ]);
      if (cancelled) return;

      setInvoice(invoiceRow);
      setBusiness(businessRow);
      setItems(itemRows);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [db, invoiceId]);

  async function handleSaveAndShare() {
    if (!business || !invoice) return;

    setShareError(null);
    setSharing(true);
    const result = await shareInvoicePdf({ business, invoice, items });
    if (!result.ok) {
      setShareError(result.message);
    }
    setSharing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError || !business || !invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError ?? 'Invoice not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <InvoiceDocument business={business} invoice={invoice} items={items} />

      {shareError ? <Text style={styles.shareError}>{shareError}</Text> : null}

      <Button
        label="Save & Share"
        onPress={handleSaveAndShare}
        loading={sharing}
        style={styles.primaryButton}
      />

      <Button label="Back to Edit" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  shareError: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
});
