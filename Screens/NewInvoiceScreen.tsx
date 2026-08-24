import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../Components/Button';
import Card from '../Components/Card';
import FormInput from '../Components/FormInput';
import LineItemRow, { LineItemDraft } from '../Components/LineItemRow';
import PresetChips from '../Components/PresetChips';
import SelectField from '../Components/SelectField';
import type { BusinessRow, TradeTemplatePreset } from '../Data/types';
import { INDIAN_STATE_OPTIONS } from '../Data/indianStates';
import type { RootStackParamList } from '../Navigation/types';
import {
  getBusiness,
  getEffectiveTradePresets,
  getInvoiceById,
  getInvoiceItems,
  insertInvoiceWithItems,
  updateInvoiceWithItems,
} from '../Services/database';
import { calculateGST, isValidGSTIN } from '../Services/gst';
import { formatCurrency, toLocalISODate } from '../Services/format';
import { colors, fontFamily, fontSize, spacing } from '../Theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'NewInvoice'>;

interface PartyErrors {
  name?: string;
  gstin?: string;
  state?: string;
}

export default function NewInvoiceScreen({ route, navigation }: Props) {
  const invoiceId = route.params?.invoiceId;
  const isEditMode = invoiceId !== undefined;
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);

  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyState, setPartyState] = useState('');

  const [items, setItems] = useState<LineItemDraft[]>([]);
  const nextItemId = useRef(1);

  const [partyErrors, setPartyErrors] = useState<PartyErrors>({});
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? 'Edit Invoice' : 'New Invoice' });
  }, [navigation, isEditMode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const businessRow = await getBusiness(db);
      if (cancelled) return;
      setBusiness(businessRow);

      if (invoiceId !== undefined) {
        const [invoiceRow, itemRows] = await Promise.all([
          getInvoiceById(db, invoiceId),
          getInvoiceItems(db, invoiceId),
        ]);
        if (cancelled) return;

        if (invoiceRow) {
          setPartyName(invoiceRow.party_name);
          setPartyGstin(invoiceRow.party_gstin ?? '');
          setPartyState(invoiceRow.party_state);
          setItems(
            itemRows.map((item) => ({
              id: nextItemId.current++,
              description: item.description,
              quantity: String(item.quantity),
              unit: item.unit ?? '',
              rate: String(item.rate),
              gstRate: String(item.gst_rate),
            }))
          );
        } else {
          setFormError('Invoice not found.');
        }
      }

      if (!cancelled) setLoadingBusiness(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [db, invoiceId]);

  const [tradePresets, setTradePresets] = useState<TradeTemplatePreset[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPresets() {
      if (!business) {
        setTradePresets([]);
        return;
      }
      const presets = await getEffectiveTradePresets(db, business.trade);
      if (!cancelled) setTradePresets(presets);
    }

    loadPresets();

    return () => {
      cancelled = true;
    };
  }, [db, business]);

  function addItem(preset?: TradeTemplatePreset) {
    const id = nextItemId.current++;
    setItems((prev) => [
      ...prev,
      {
        id,
        description: preset?.description ?? '',
        quantity: '1',
        unit: preset?.unit ?? '',
        rate: preset ? String(preset.defaultRate) : '',
        gstRate: '18',
      },
    ]);
  }

  function updateItem(id: number, patch: Partial<LineItemDraft>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const computedItems = useMemo(
    () =>
      items.map((item) => {
        const quantityNum = parseFloat(item.quantity) || 0;
        const rateNum = parseFloat(item.rate) || 0;
        const gstRateNum = parseFloat(item.gstRate) || 0;
        return { ...item, quantityNum, rateNum, gstRateNum, amount: quantityNum * rateNum };
      }),
    [items]
  );

  const subtotal = useMemo(
    () => computedItems.reduce((sum, item) => sum + item.amount, 0),
    [computedItems]
  );

  const isPartyGstRegistered = partyGstin.trim().length > 0;

  const gstSummary = useMemo(() => {
    if (!business) {
      return { cgst: 0, sgst: 0, igst: 0, taxTotal: 0, isInterState: false };
    }

    const effectivePartyState = partyState || business.state;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const item of computedItems) {
      const breakdown = calculateGST(item.amount, business.state, effectivePartyState, {
        gstRate: item.gstRateNum,
        isGstRegistered: isPartyGstRegistered,
      });
      cgst += breakdown.cgst;
      sgst += breakdown.sgst;
      igst += breakdown.igst;
    }

    return {
      cgst,
      sgst,
      igst,
      taxTotal: cgst + sgst + igst,
      isInterState: business.state.trim().toLowerCase() !== effectivePartyState.trim().toLowerCase(),
    };
  }, [business, computedItems, partyState, isPartyGstRegistered]);

  const grandTotal = subtotal + gstSummary.taxTotal;

  function validate(): boolean {
    const nextPartyErrors: PartyErrors = {};
    if (!partyName.trim()) {
      nextPartyErrors.name = 'Party name is required.';
    }
    if (!partyState) {
      nextPartyErrors.state = 'Select the party state.';
    }
    if (partyGstin.trim() && !isValidGSTIN(partyGstin)) {
      nextPartyErrors.gstin = 'Enter a valid 15-character GSTIN.';
    }
    setPartyErrors(nextPartyErrors);

    const nextItemErrors: Record<number, string> = {};
    computedItems.forEach((item) => {
      if (!item.description.trim()) {
        nextItemErrors[item.id] = 'Description is required.';
      } else if (!item.quantityNum || item.quantityNum <= 0) {
        nextItemErrors[item.id] = 'Enter a valid quantity.';
      } else if (Number.isNaN(item.rateNum) || item.rateNum < 0) {
        nextItemErrors[item.id] = 'Enter a valid rate.';
      }
    });
    setItemErrors(nextItemErrors);

    if (Object.keys(nextPartyErrors).length > 0) {
      setFormError(null);
      return false;
    }
    if (items.length === 0) {
      setFormError('Add at least one line item.');
      return false;
    }
    if (Object.keys(nextItemErrors).length > 0) {
      setFormError('Fix the errors in your line items.');
      return false;
    }
    setFormError(null);
    return true;
  }

  async function handleSubmit() {
    if (!business) {
      return;
    }
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const lineItems = computedItems.map((item, index) => ({
        description: item.description.trim(),
        quantity: item.quantityNum,
        unit: item.unit.trim(),
        rate: item.rateNum,
        gstRate: item.gstRateNum,
        amount: item.amount,
        sortOrder: index,
      }));

      let savedInvoiceId: number;

      if (isEditMode && invoiceId !== undefined) {
        await updateInvoiceWithItems(db, invoiceId, {
          partyName: partyName.trim(),
          partyGstin: partyGstin.trim() ? partyGstin.trim().toUpperCase() : null,
          partyState,
          isPartyGstRegistered,
          subtotal,
          cgstAmount: gstSummary.cgst,
          sgstAmount: gstSummary.sgst,
          igstAmount: gstSummary.igst,
          total: grandTotal,
          items: lineItems,
        });
        savedInvoiceId = invoiceId;
      } else {
        const inserted = await insertInvoiceWithItems(db, {
          businessId: business.id,
          invoiceDate: toLocalISODate(new Date()),
          partyName: partyName.trim(),
          partyGstin: partyGstin.trim() ? partyGstin.trim().toUpperCase() : null,
          partyState,
          isPartyGstRegistered,
          subtotal,
          cgstAmount: gstSummary.cgst,
          sgstAmount: gstSummary.sgst,
          igstAmount: gstSummary.igst,
          total: grandTotal,
          items: lineItems,
        });
        savedInvoiceId = inserted.id;
      }

      navigation.navigate('InvoicePreview', { invoiceId: savedInvoiceId });
    } catch {
      setFormError('Could not save the invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingBusiness) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + spacing.lg + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Party Details</Text>
        <FormInput
          label="Party Name"
          required
          value={partyName}
          onChangeText={setPartyName}
          error={partyErrors.name}
          placeholder="e.g. SM Enterprises"
        />
        <FormInput
          label="GSTIN"
          value={partyGstin}
          onChangeText={(text) => setPartyGstin(text.toUpperCase())}
          error={partyErrors.gstin}
          placeholder="e.g. 27ABCDE1234F1Z5"
          autoCapitalize="characters"
          maxLength={15}
        />
        <SelectField
          label="State"
          required
          value={partyState}
          onValueChange={setPartyState}
          options={INDIAN_STATE_OPTIONS}
          placeholder="Select state"
          error={partyErrors.state}
        />

        <Text style={styles.sectionTitle}>Line Items</Text>

        <PresetChips presets={tradePresets} onSelect={addItem} />

        {items.map((item, index) => (
          <LineItemRow
            key={item.id}
            item={item}
            amount={computedItems[index].amount}
            error={itemErrors[item.id]}
            onChange={updateItem}
            onRemove={removeItem}
          />
        ))}

        <Button
          label="+ Add Line Item"
          variant="dashed"
          onPress={() => addItem()}
          style={styles.addItemButton}
        />

        <Card style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {isPartyGstRegistered ? (
            gstSummary.isInterState ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST</Text>
                <Text style={styles.totalValue}>{formatCurrency(gstSummary.igst)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST</Text>
                  <Text style={styles.totalValue}>{formatCurrency(gstSummary.cgst)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST</Text>
                  <Text style={styles.totalValue}>{formatCurrency(gstSummary.sgst)}</Text>
                </View>
              </>
            )
          ) : (
            <Text style={styles.noGstNote}>No GSTIN entered — GST not charged (bill of supply).</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </Card>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Button
          label={isEditMode ? 'Update Invoice' : 'Save Invoice'}
          onPress={handleSubmit}
          loading={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  addItemButton: {
    marginBottom: spacing.xl,
  },
  totalsCard: {
    marginBottom: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textStrong,
  },
  totalValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontFamily: fontFamily.headingMedium,
  },
  noGstNote: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyBold,
    color: colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.headingBold,
    color: colors.amberDark,
  },
  formError: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
