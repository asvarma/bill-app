import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Invoices: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TradeSelector: { mode: 'onboarding' | 'settings' } | undefined;
  NewInvoice: { invoiceId?: number } | undefined;
  LineItemEntry: { invoiceId?: number; itemId?: number } | undefined;
  InvoicePreview: { invoiceId: number };
  InvoiceDetail: { invoiceId: number };
  EditBusinessProfile: undefined;
  TradeTemplateSettings: undefined;
  InvoiceNumberingSettings: undefined;
  Upgrade: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
