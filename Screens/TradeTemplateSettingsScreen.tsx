import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../Components/Button';
import Card from '../Components/Card';
import type { BusinessRow, TradeTemplateRow } from '../Data/types';
import {
  addTradeTemplatePreset,
  deleteTradeTemplatePreset,
  ensureTradeTemplateSeeded,
  getBusiness,
  updateTradeTemplatePreset,
} from '../Services/database';
import { formatCurrency } from '../Services/format';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PresetFormState {
  label: string;
  unit: string;
  rate: string;
}

const EMPTY_FORM: PresetFormState = { label: '', unit: '', rate: '' };

export default function TradeTemplateSettingsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [presets, setPresets] = useState<TradeTemplateRow[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PresetFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const businessRow = await getBusiness(db);
        if (cancelled) return;
        setBusiness(businessRow);

        if (businessRow) {
          const rows = await ensureTradeTemplateSeeded(db, businessRow.trade);
          if (cancelled) return;
          setPresets(rows);
        }

        if (!cancelled) setLoading(false);
      }

      load();

      return () => {
        cancelled = true;
      };
    }, [db])
  );

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(preset: TradeTemplateRow) {
    setEditingId(preset.id);
    setForm({
      label: preset.label,
      unit: preset.default_unit ?? '',
      rate: preset.default_rate !== null ? String(preset.default_rate) : '',
    });
    setFormError(null);
    setModalVisible(true);
  }

  async function handleSavePreset() {
    if (!business) return;
    if (!form.label.trim()) {
      setFormError('Description is required.');
      return;
    }
    const rate = parseFloat(form.rate);
    if (form.rate.trim() && (Number.isNaN(rate) || rate < 0)) {
      setFormError('Enter a valid rate.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        defaultUnit: form.unit.trim(),
        defaultRate: form.rate.trim() ? rate : 0,
      };

      if (editingId !== null) {
        await updateTradeTemplatePreset(db, editingId, payload);
      } else {
        await addTradeTemplatePreset(db, business.trade, payload);
      }

      const rows = await ensureTradeTemplateSeeded(db, business.trade);
      setPresets(rows);
      setModalVisible(false);
    } catch {
      setFormError('Could not save this preset. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(preset: TradeTemplateRow) {
    Alert.alert('Delete preset?', `Remove "${preset.label}" from your quick-add presets.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTradeTemplatePreset(db, preset.id);
          setPresets((prev) => prev.filter((row) => row.id !== preset.id));
        },
      },
    ]);
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
    <View style={styles.flex}>
      <FlatList
        data={presets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xxl + minTouchTarget + insets.bottom }]}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            Quick-add presets shown on the New Invoice screen for your trade.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowMeta}>
                {item.default_unit || 'nos'} · {formatCurrency(item.default_rate ?? 0)}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable onPress={() => openEditModal(item)} hitSlop={8} style={styles.rowActionButton}>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.rowActionButton}>
                <Text style={styles.deleteLink}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No presets yet. Add one below.</Text>
          </View>
        }
      />

      <Button
        label="+ Add Preset"
        onPress={openAddModal}
        style={[styles.addButton, { bottom: spacing.xl + insets.bottom }]}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: spacing.xxl + spacing.xs + insets.bottom }]}>
            <Text style={styles.modalTitle}>{editingId !== null ? 'Edit Preset' : 'Add Preset'}</Text>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={form.label}
              onChangeText={(text) => setForm((prev) => ({ ...prev, label: text }))}
              placeholder="e.g. MS Pipe Fabrication"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.fieldLabel}>Unit</Text>
            <TextInput
              style={styles.input}
              value={form.unit}
              onChangeText={(text) => setForm((prev) => ({ ...prev, unit: text }))}
              placeholder="e.g. kg, nos, day"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.fieldLabel}>Default Rate</Text>
            <TextInput
              style={styles.input}
              value={form.rate}
              onChangeText={(text) => setForm((prev) => ({ ...prev, rate: text }))}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button label="Save" onPress={handleSavePreset} loading={saving} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + minTouchTarget,
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowActionButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  editLink: {
    color: colors.primaryDark,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodySemiBold,
  },
  deleteLink: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodySemiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  addButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.xs,
  },
  modalTitle: {
    fontSize: fontSize.xxl - 1,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  formError: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginTop: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  modalButton: {
    flex: 1,
  },
});
