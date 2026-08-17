import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { RootStackParamList } from './types';
import MainTabNavigator from './MainTabNavigator';
import BusinessProfileSetupScreen from '../Screens/BusinessProfileSetupScreen';
import TradeSelectorScreen from '../Screens/TradeSelectorScreen';
import NewInvoiceScreen from '../Screens/NewInvoiceScreen';
import LineItemEntryScreen from '../Screens/LineItemEntryScreen';
import InvoicePreviewScreen from '../Screens/InvoicePreviewScreen';
import InvoiceDetailScreen from '../Screens/InvoiceDetailScreen';
import EditBusinessProfileScreen from '../Screens/EditBusinessProfileScreen';
import TradeTemplateSettingsScreen from '../Screens/TradeTemplateSettingsScreen';
import InvoiceNumberingSettingsScreen from '../Screens/InvoiceNumberingSettingsScreen';
import UpgradeScreen from '../Screens/UpgradeScreen';
import { getBusiness } from '../Services/database';
import { colors, fontFamily } from '../Theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const db = useSQLiteContext();
  const [checking, setChecking] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarded() {
      const business = await getBusiness(db);
      if (!cancelled) {
        setHasBusiness(business !== null);
        setChecking(false);
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    checkOnboarded();

    return () => {
      cancelled = true;
    };
  }, [db]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={hasBusiness ? 'MainTabs' : 'Onboarding'}
      screenOptions={{
        headerTintColor: colors.amberDark,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={BusinessProfileSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="TradeSelector" component={TradeSelectorScreen} options={{ title: 'Select Trade' }} />
      <Stack.Screen name="NewInvoice" component={NewInvoiceScreen} />
      <Stack.Screen
        name="LineItemEntry"
        component={LineItemEntryScreen}
        options={{ title: 'Add Line Item' }}
      />
      <Stack.Screen
        name="InvoicePreview"
        component={InvoicePreviewScreen}
        options={{ title: 'Invoice Preview' }}
      />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen
        name="EditBusinessProfile"
        component={EditBusinessProfileScreen}
        options={{ title: 'Edit Business Profile' }}
      />
      <Stack.Screen
        name="TradeTemplateSettings"
        component={TradeTemplateSettingsScreen}
        options={{ title: 'Trade Templates' }}
      />
      <Stack.Screen
        name="InvoiceNumberingSettings"
        component={InvoiceNumberingSettingsScreen}
        options={{ title: 'Invoice Numbering' }}
      />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
