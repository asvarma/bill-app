import { StyleSheet, Text, View } from 'react-native';
import type { InvoiceStatus } from '../Data/types';
import { colors, fontFamily, fontSize, radius, spacing } from '../Theme/theme';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isPaid = status === 'paid';
  return (
    <View style={[styles.badge, isPaid ? styles.paid : styles.unpaid]}>
      <Text style={[styles.text, isPaid ? styles.paidText : styles.unpaidText]}>
        {isPaid ? 'Paid' : 'Unpaid'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 1,
    alignSelf: 'flex-start',
  },
  paid: {
    backgroundColor: colors.successSurface,
  },
  unpaid: {
    backgroundColor: colors.amberSurface,
  },
  text: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyBold,
  },
  paidText: {
    color: colors.success,
  },
  unpaidText: {
    color: colors.amberDark,
  },
});
