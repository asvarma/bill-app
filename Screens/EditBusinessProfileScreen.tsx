import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import BusinessProfileForm from '../Components/BusinessProfileForm';
import type { BusinessRow } from '../Data/types';
import type { RootStackParamList } from '../Navigation/types';
import { getBusiness, updateBusiness } from '../Services/database';
import { colors, fontFamily, fontSize, spacing } from '../Theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditBusinessProfile'>;

export default function EditBusinessProfileScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const businessRow = await getBusiness(db);
      if (!cancelled) {
        setBusiness(businessRow);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [db]);

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
    <BusinessProfileForm
      submitLabel="Save Changes"
      initialValues={{
        name: business.name,
        mobileNumber: business.mobile_number,
        gstin: business.gstin ?? '',
        address: business.address ?? '',
        state: business.state,
        pincode: business.pincode ?? '',
        trade: business.trade,
        logoUri: business.logo_uri,
      }}
      onSubmit={async (values) => {
        await updateBusiness(db, business.id, values);
        navigation.goBack();
      }}
    />
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
});
