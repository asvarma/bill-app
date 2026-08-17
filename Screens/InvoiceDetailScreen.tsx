import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../Components/Button';
import InvoiceDocument from '../Components/InvoiceDocument';
import type { BusinessRow, InvoiceItemRow, InvoiceRow } from '../Data/types';
import type { RootStackParamList } from '../Navigation/types';
import {
  deleteInvoice,
  getBusinessById,
  getInvoiceById,
  getInvoiceItems,
  updateInvoiceStatus,
} from '../Services/database';
import { shareInvoicePdf } from '../Services/shareInvoice';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceDetail'>;

export default function InvoiceDetailScreen({ route, navigation }: Props) {
  const { invoiceId } = route.params;
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[]>([]);

  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setLoadError(null);

        const invoiceRow = await getInvoiceById(db, invoiceId);
        if (cancelled) return;
        if (!invoiceRow) {
          setLoadError('Invoice not found.');
          setInvoice(null);
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
    }, [db, invoiceId])
  );

  useEffect(() => {
    navigation.setOptions({ title: invoice?.invoice_number ?? 'Invoice' });
  }, [navigation, invoice?.invoice_number]);

  async function handleShare() {
    if (!business || !invoice) return;
    setShareError(null);
    setSharing(true);
    const result = await shareInvoicePdf({ business, invoice, items });
    if (!result.ok) {
      setShareError(result.message);
    }
    setSharing(false);
  }

  async function handleToggleStatus() {
    if (!invoice) return;
    setUpdatingStatus(true);
    try {
      const nextStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
      await updateInvoiceStatus(db, invoice.id, nextStatus);
      setInvoice({ ...invoice, status: nextStatus });
    } catch {
      Alert.alert('Could not update status', 'Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  function handleEdit() {
    navigation.navigate('NewInvoice', { invoiceId });
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this invoice?',
      'This removes the invoice and all its line items. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInvoice(db, invoiceId);
      navigation.goBack();
    } catch {
      setDeleting(false);
      Alert.alert('Could not delete invoice', 'Please try again.');
    }
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

  const isPaid = invoice.status === 'paid';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <InvoiceDocument business={business} invoice={invoice} items={items} />

      {shareError ? <Text style={styles.shareError}>{shareError}</Text> : null}

      <Button label="Share" onPress={handleShare} loading={sharing} style={styles.actionSpacing} />

      <Pressable
        style={[styles.statusButton, isPaid ? styles.statusButtonPaid : null, updatingStatus ? styles.buttonDisabled : null]}
        onPress={handleToggleStatus}
        disabled={updatingStatus}
      >
        {updatingStatus ? (
          <ActivityIndicator color={isPaid ? colors.success : colors.warning} />
        ) : (
          <Text style={[styles.statusButtonText, isPaid ? styles.statusButtonTextPaid : null]}>
            {isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
          </Text>
        )}
      </Pressable>

      <View style={styles.rowActions}>
        <Button label="Edit" variant="secondary" onPress={handleEdit} style={styles.rowButton} />
        <Button
          label="Delete"
          variant="danger"
          onPress={confirmDelete}
          loading={deleting}
          style={styles.rowButton}
        />
      </View>
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
  actionSpacing: {
    marginBottom: spacing.md,
  },
  statusButton: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    backgroundColor: colors.amberSurface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusButtonPaid: {
    borderColor: colors.success,
    backgroundColor: colors.successSurface,
  },
  statusButtonText: {
    color: colors.amberDark,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
  },
  statusButtonTextPaid: {
    color: colors.success,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
