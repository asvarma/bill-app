export type InvoiceStatus = 'unpaid' | 'paid';

export interface BusinessRow {
  id: number;
  name: string;
  mobile_number: string;
  gstin: string | null;
  address: string | null;
  state: string;
  pincode: string | null;
  logo_uri: string | null;
  trade: string;
  invoice_prefix: string;
  invoice_next_number: number;
  created_at: string;
}

export interface InvoiceRow {
  id: number;
  business_id: number;
  invoice_number: string;
  invoice_date: string;
  party_name: string;
  party_gstin: string | null;
  party_address: string | null;
  party_state: string;
  is_party_gst_registered: 0 | 1;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit: string | null;
  rate: number;
  gst_rate: number;
  amount: number;
  sort_order: number;
}

export interface TradeTemplateRow {
  id: number;
  trade_key: string;
  label: string;
  description: string | null;
  default_unit: string | null;
  default_rate: number | null;
  created_at: string;
}

export interface TradeTemplatePreset {
  description: string;
  unit: string;
  defaultRate: number;
}

export interface TradeTemplate {
  key: string;
  label: string;
  presets: TradeTemplatePreset[];
}
