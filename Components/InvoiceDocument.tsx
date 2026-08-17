import { Image, StyleSheet, Text, View } from 'react-native';
import type { BusinessRow, InvoiceItemRow, InvoiceRow } from '../Data/types';
import { formatCurrency, formatDate } from '../Services/format';
import { getGSTDisplayMode } from '../Services/gst';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../Theme/theme';

interface InvoiceDocumentProps {
  business: BusinessRow;
  invoice: InvoiceRow;
  items: InvoiceItemRow[];
}

export default function InvoiceDocument({ business, invoice, items }: InvoiceDocumentProps) {
  const gstMode = getGSTDisplayMode(business.state, invoice.party_state, invoice.is_party_gst_registered === 1);

  return (
    <View style={styles.paper}>
      <View style={styles.header}>
        <View style={styles.businessBlock}>
          {business.logo_uri ? <Image source={{ uri: business.logo_uri }} style={styles.logo} /> : null}
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.mobile_number ? <Text style={styles.muted}>Mobile: {business.mobile_number}</Text> : null}
            {business.gstin ? <Text style={styles.muted}>GSTIN: {business.gstin}</Text> : null}
            {business.address ? <Text style={styles.muted}>{business.address}</Text> : null}
            <Text style={styles.muted}>{business.state}</Text>
          </View>
        </View>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.muted}>Invoice #: {invoice.invoice_number}</Text>
          <Text style={styles.muted}>Date: {formatDate(invoice.invoice_date)}</Text>
        </View>
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.partySection}>
        <Text style={styles.sectionLabel}>Bill To</Text>
        <Text style={styles.partyName}>{invoice.party_name}</Text>
        {invoice.party_gstin ? <Text style={styles.muted}>GSTIN: {invoice.party_gstin}</Text> : null}
        <Text style={styles.muted}>{invoice.party_state}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
          <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty, styles.num]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
          <Text style={[styles.tableHeaderCell, styles.colRate, styles.num]}>Rate</Text>
          <Text style={[styles.tableHeaderCell, styles.colAmount, styles.num]}>Amount</Text>
        </View>
        {items.map((item, index) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colIndex, styles.mutedCell]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.colQty, styles.num]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
            <Text style={[styles.tableCell, styles.numericCell, styles.colRate, styles.num]}>
              {formatCurrency(item.rate)}
            </Text>
            <Text style={[styles.tableCell, styles.numericCell, styles.colAmount, styles.num]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.totalsWrapper}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {gstMode === 'unregistered' ? (
            <Text style={styles.noGstNote}>No GSTIN on file — GST not charged (bill of supply).</Text>
          ) : gstMode === 'inter' ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.igst_amount)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.cgst_amount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.sgst_amount)}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footerNote}>This is a computer-generated invoice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
  },
  dashedDivider: {
    borderTopWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    marginVertical: spacing.lg,
  },
  businessBlock: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    marginRight: spacing.sm + 2,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  muted: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingBold,
    color: colors.amberDark,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  partySection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyBold,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  partyName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderRow: {
    backgroundColor: colors.background,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: fontFamily.bodyBold,
    textTransform: 'uppercase',
    color: colors.textStrong,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm - 2,
  },
  tableCell: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm - 2,
  },
  numericCell: {
    fontFamily: fontFamily.headingMedium,
  },
  mutedCell: {
    color: colors.textTertiary,
  },
  colIndex: {
    width: 24,
    textAlign: 'center',
  },
  colDescription: {
    flex: 2.4,
  },
  colQty: {
    flex: 0.6,
  },
  colUnit: {
    flex: 0.7,
  },
  colRate: {
    flex: 1,
  },
  colAmount: {
    flex: 1.1,
  },
  num: {
    textAlign: 'right',
  },
  totalsWrapper: {
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: '60%',
    minWidth: 220,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textStrong,
  },
  totalValue: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.headingMedium,
    color: colors.textPrimary,
  },
  noGstNote: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm - 2,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodyBold,
    color: colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingBold,
    color: colors.amberDark,
  },
  footerNote: {
    marginTop: spacing.xxl,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
