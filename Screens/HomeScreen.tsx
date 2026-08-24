import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../Components/Button';
import Card from '../Components/Card';
import StatusBadge from '../Components/StatusBadge';
import type { BusinessRow, InvoiceRow } from '../Data/types';
import type { MainTabParamList, RootStackParamList } from '../Navigation/types';
import { getBusiness, getMonthlySummary, getRecentInvoices, MonthlySummary } from '../Services/database';
import { formatCurrency, formatDate } from '../Services/format';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../Theme/theme';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [summary, setSummary] = useState<MonthlySummary>({ total: 0, count: 0 });
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const businessRow = await getBusiness(db);
        if (cancelled) return;
        setBusiness(businessRow);

        if (businessRow) {
          const [summaryResult, recentResult] = await Promise.all([
            getMonthlySummary(db, businessRow.id),
            getRecentInvoices(db, businessRow.id, 5),
          ]);
          if (cancelled) return;
          setSummary(summaryResult);
          setRecentInvoices(recentResult);
        } else {
          setSummary({ total: 0, count: 0 });
          setRecentInvoices([]);
        }

        if (!cancelled) setLoading(false);
      }

      load();

      return () => {
        cancelled = true;
      };
    }, [db])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + spacing.lg + insets.bottom }]}>
        <View style={styles.header}>
          {business?.logo_uri ? <Image source={{ uri: business.logo_uri }} style={styles.logo} /> : null}
          <View>
            <Text style={styles.welcome}>Welcome,</Text>
            <Text style={styles.businessName}>{business?.name ?? 'Your Business'}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>THIS MONTH</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(summary.total)}</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryCount}>
            {summary.count} {summary.count === 1 ? 'invoice' : 'invoices'}
          </Text>
        </View>

        <Button
          label="+ New Invoice"
          onPress={() => navigation.navigate('NewInvoice')}
          style={styles.newInvoiceButton}
        />

        <Text style={styles.sectionTitle}>Recent Invoices</Text>

        {recentInvoices.length === 0 ? (
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No invoices yet — create your first one.</Text>
          </Card>
        ) : (
          <Card padded={false}>
            {recentInvoices.map((invoice, index) => (
              <Pressable
                key={invoice.id}
                style={[styles.invoiceRow, index === recentInvoices.length - 1 ? styles.invoiceRowLast : null]}
                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
              >
                <View style={styles.invoiceRowLeft}>
                  <Text style={styles.invoicePartyName} numberOfLines={1}>
                    {invoice.party_name}
                  </Text>
                  <Text style={styles.invoiceDate}>{formatDate(invoice.invoice_date)}</Text>
                </View>
                <View style={styles.invoiceRowRight}>
                  <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                  <StatusBadge status={invoice.status} />
                </View>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
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
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  welcome: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  businessName: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadow.ticket,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyBold,
    color: colors.amber,
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: fontSize.hero,
    fontFamily: fontFamily.headingBold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    borderTopWidth: 1.5,
    borderColor: 'rgba(247, 243, 239, 0.2)',
    borderStyle: 'dashed',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCount: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    color: 'rgba(247, 243, 239, 0.7)',
  },
  newInvoiceButton: {
    marginBottom: spacing.xxl + spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  invoiceRowLast: {
    borderBottomWidth: 0,
  },
  invoiceRowLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  invoicePartyName: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textPrimary,
  },
  invoiceDate: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
  },
  invoiceRowRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
