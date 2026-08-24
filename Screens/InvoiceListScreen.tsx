import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../Components/Button';
import Card from '../Components/Card';
import DatePickerField from '../Components/DatePickerField';
import StatusBadge from '../Components/StatusBadge';
import type { BusinessRow, InvoiceRow } from '../Data/types';
import type { MainTabParamList, RootStackParamList } from '../Navigation/types';
import { getBusiness, getInvoices } from '../Services/database';
import { formatCurrency, formatDate, toLocalISODate } from '../Services/format';
import { colors, fontFamily, fontSize, minTouchTarget, radius, shadow, spacing } from '../Theme/theme';

type InvoiceListNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Invoices'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function daysAgo(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export default function InvoiceListScreen() {
  const navigation = useNavigation<InvoiceListNavigationProp>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const hasDateFilter = dateFrom !== null || dateTo !== null;
  const hasAnyFilter = hasDateFilter || search.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const businessRow = await getBusiness(db);
        if (cancelled) return;
        setBusiness(businessRow);

        if (businessRow) {
          const rows = await getInvoices(db, businessRow.id, {
            search,
            dateFrom: dateFrom ? toLocalISODate(dateFrom) : null,
            dateTo: dateTo ? toLocalISODate(dateTo) : null,
          });
          if (cancelled) return;
          setInvoices(rows);
        } else {
          setInvoices([]);
        }

        if (!cancelled) setLoading(false);
      }

      load();

      return () => {
        cancelled = true;
      };
    }, [db, search, dateFrom, dateTo])
  );

  const dateRangeLabel = useMemo(() => {
    if (!hasDateFilter) return null;
    const fromLabel = dateFrom ? formatDate(toLocalISODate(dateFrom)) : 'Start';
    const toLabel = dateTo ? formatDate(toLocalISODate(dateTo)) : 'Today';
    return `${fromLabel} – ${toLabel}`;
  }, [dateFrom, dateTo, hasDateFilter]);

  function applyPreset(preset: 'all' | 'month' | '30days' | 'year') {
    const today = new Date();
    if (preset === 'all') {
      setDateFrom(null);
      setDateTo(null);
    } else if (preset === 'month') {
      setDateFrom(startOfMonth(today));
      setDateTo(today);
    } else if (preset === '30days') {
      setDateFrom(daysAgo(today, 30));
      setDateTo(today);
    } else {
      setDateFrom(startOfYear(today));
      setDateTo(today);
    }
    setFilterVisible(false);
  }

  function clearDateFilter() {
    setDateFrom(null);
    setDateTo(null);
  }

  if (loading && invoices.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by party or invoice #"
          placeholderTextColor={colors.placeholder}
        />
        <Pressable
          style={[styles.filterButton, hasDateFilter ? styles.filterButtonActive : null]}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={[styles.filterButtonText, hasDateFilter ? styles.filterButtonTextActive : null]}>
            Filter
          </Text>
        </Pressable>
      </View>

      {hasDateFilter ? (
        <View style={styles.activeFilterRow}>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>{dateRangeLabel}</Text>
            <Pressable onPress={clearDateFilter} hitSlop={8}>
              <Text style={styles.activeFilterClear}>×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={invoices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xxl + spacing.lg + insets.bottom }]}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.partyName} numberOfLines={1}>
                {item.party_name}
              </Text>
              <Text style={styles.rowMeta}>
                {item.invoice_number} · {formatDate(item.invoice_date)}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
              <StatusBadge status={item.status} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {hasAnyFilter ? 'No invoices match your search.' : 'No invoices yet — create your first one.'}
            </Text>
          </View>
        }
      />

      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: spacing.xxl + spacing.xs + insets.bottom }]}>
            <Text style={styles.modalTitle}>Filter by Date</Text>

            <View style={styles.presetRow}>
              <Pressable style={styles.presetChip} onPress={() => applyPreset('all')}>
                <Text style={styles.presetChipText}>All Time</Text>
              </Pressable>
              <Pressable style={styles.presetChip} onPress={() => applyPreset('month')}>
                <Text style={styles.presetChipText}>This Month</Text>
              </Pressable>
              <Pressable style={styles.presetChip} onPress={() => applyPreset('30days')}>
                <Text style={styles.presetChipText}>Last 30 Days</Text>
              </Pressable>
              <Pressable style={styles.presetChip} onPress={() => applyPreset('year')}>
                <Text style={styles.presetChipText}>This Year</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Or choose a custom range</Text>
            <View style={styles.customRangeRow}>
              <DatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
              <DatePickerField label="To" value={dateTo} onChange={setDateTo} />
            </View>

            <View style={styles.modalActions}>
              <Button label="Clear" variant="secondary" onPress={clearDateFilter} style={styles.modalButton} />
              <Button label="Done" onPress={() => setFilterVisible(false)} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm + 2,
  },
  searchInput: {
    flex: 1,
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
  filterButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  filterButtonText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textStrong,
  },
  filterButtonTextActive: {
    color: colors.primaryDark,
  },
  activeFilterRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm - 2,
  },
  activeFilterText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontFamily: fontFamily.bodySemiBold,
    marginRight: spacing.sm - 2,
  },
  activeFilterClear: {
    fontSize: fontSize.xl,
    color: colors.primaryDark,
    fontFamily: fontFamily.bodyBold,
    paddingHorizontal: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2,
    ...shadow.card,
  },
  rowLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  partyName: {
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
  rowRight: {
    alignItems: 'flex-end',
    gap: spacing.sm - 2,
  },
  amount: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  presetChip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
  },
  presetChipText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textStrong,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 2,
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
