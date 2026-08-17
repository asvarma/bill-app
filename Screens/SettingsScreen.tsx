import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../Components/Button';
import Card from '../Components/Card';
import type { MainTabParamList, RootStackParamList } from '../Navigation/types';
import { resetDatabase } from '../Services/database';
import { colors, fontFamily, fontSize, minTouchTarget, spacing } from '../Theme/theme';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface MenuRowProps {
  label: string;
  hint?: string;
  onPress: () => void;
  emphasize?: boolean;
}

function MenuRow({ label, hint, onPress, emphasize }: MenuRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, emphasize ? styles.rowLabelEmphasis : null]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={[styles.chevron, emphasize ? styles.rowLabelEmphasis : null]}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const db = useSQLiteContext();
  const [resetting, setResetting] = useState(false);

  function confirmReset() {
    Alert.alert(
      'Reset all app data?',
      'This deletes the business profile and every invoice from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: handleReset },
      ]
    );
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetDatabase(db);
      const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
      rootNavigation?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } catch {
      Alert.alert('Could not reset data', 'Please try again.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Business</Text>
      <Card padded={false}>
        <MenuRow
          label="Edit Business Profile"
          hint="Name, GSTIN, address, state, logo, trade"
          onPress={() => navigation.navigate('EditBusinessProfile')}
        />
        <View style={styles.divider} />
        <MenuRow
          label="Trade Templates"
          hint="Quick-add presets for your invoices"
          onPress={() => navigation.navigate('TradeTemplateSettings')}
        />
        <View style={styles.divider} />
        <MenuRow
          label="Invoice Numbering"
          hint="Custom prefix and starting number"
          onPress={() => navigation.navigate('InvoiceNumberingSettings')}
        />
      </Card>

      <Text style={styles.sectionTitle}>Account</Text>
      <Card padded={false}>
        <MenuRow label="Upgrade to Pro" onPress={() => navigation.navigate('Upgrade')} emphasize />
      </Card>

      <Text style={styles.sectionTitle}>Data Management</Text>
      <Card>
        <Button label="Reset App Data" variant="danger" onPress={confirmReset} loading={resetting} />
        <Text style={styles.hint}>
          Clears the business profile and all invoices, then returns you to onboarding.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  title: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyBold,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  row: {
    minHeight: minTouchTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textPrimary,
  },
  rowLabelEmphasis: {
    color: colors.amberDark,
  },
  rowHint: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: fontSize.xxl + 2,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginLeft: spacing.lg,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
});
