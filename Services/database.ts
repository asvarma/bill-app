import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_NAME, SCHEMA_SQL } from '../Data/schema';
import type { BusinessRow, InvoiceItemRow, InvoiceRow, TradeTemplatePreset, TradeTemplateRow } from '../Data/types';
import { getTradeTemplate } from '../Data/tradeTemplates';
import { formatInvoiceNumber } from './format';

export { DATABASE_NAME };

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const itemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(invoice_items)');
  if (!itemColumns.some((column) => column.name === 'gst_rate')) {
    await db.execAsync('ALTER TABLE invoice_items ADD COLUMN gst_rate REAL NOT NULL DEFAULT 18');
  }

  const businessColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(businesses)');
  const businessColumnNames = businessColumns.map((column) => column.name);
  if (!businessColumnNames.includes('invoice_prefix')) {
    await db.execAsync("ALTER TABLE businesses ADD COLUMN invoice_prefix TEXT NOT NULL DEFAULT 'INV-'");
  }
  if (!businessColumnNames.includes('invoice_next_number')) {
    await db.execAsync('ALTER TABLE businesses ADD COLUMN invoice_next_number INTEGER NOT NULL DEFAULT 1');
  }
  if (!businessColumnNames.includes('mobile_number')) {
    await db.execAsync("ALTER TABLE businesses ADD COLUMN mobile_number TEXT NOT NULL DEFAULT ''");
  }
  if (!businessColumnNames.includes('pincode')) {
    await db.execAsync('ALTER TABLE businesses ADD COLUMN pincode TEXT');
  }
}

export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM invoice_items;
    DELETE FROM invoices;
    DELETE FROM trade_templates;
    DELETE FROM businesses;
    DELETE FROM sqlite_sequence;
  `);
}

export interface NewBusiness {
  name: string;
  mobileNumber: string;
  gstin: string | null;
  address: string | null;
  state: string;
  pincode: string | null;
  logoUri: string | null;
  trade: string;
}

export async function insertBusiness(db: SQLiteDatabase, business: NewBusiness): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO businesses (name, mobile_number, gstin, address, state, pincode, logo_uri, trade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    business.name,
    business.mobileNumber,
    business.gstin,
    business.address,
    business.state,
    business.pincode,
    business.logoUri,
    business.trade
  );
  return result.lastInsertRowId;
}

export async function updateBusiness(db: SQLiteDatabase, businessId: number, business: NewBusiness): Promise<void> {
  await db.runAsync(
    `UPDATE businesses SET name = ?, mobile_number = ?, gstin = ?, address = ?, state = ?, pincode = ?, logo_uri = ?, trade = ? WHERE id = ?`,
    business.name,
    business.mobileNumber,
    business.gstin,
    business.address,
    business.state,
    business.pincode,
    business.logoUri,
    business.trade,
    businessId
  );
}

export async function updateInvoiceNumbering(
  db: SQLiteDatabase,
  businessId: number,
  prefix: string,
  nextNumber: number
): Promise<void> {
  await db.runAsync(
    'UPDATE businesses SET invoice_prefix = ?, invoice_next_number = ? WHERE id = ?',
    prefix,
    nextNumber,
    businessId
  );
}

export async function getBusiness(db: SQLiteDatabase): Promise<BusinessRow | null> {
  return db.getFirstAsync<BusinessRow>('SELECT * FROM businesses ORDER BY id DESC LIMIT 1');
}

export interface MonthlySummary {
  total: number;
  count: number;
}

export async function getMonthlySummary(db: SQLiteDatabase, businessId: number): Promise<MonthlySummary> {
  const row = await db.getFirstAsync<MonthlySummary>(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM invoices
     WHERE business_id = ? AND strftime('%Y-%m', invoice_date) = strftime('%Y-%m', 'now', 'localtime')`,
    businessId
  );
  return row ?? { total: 0, count: 0 };
}

export async function getRecentInvoices(
  db: SQLiteDatabase,
  businessId: number,
  limit: number = 5
): Promise<InvoiceRow[]> {
  return db.getAllAsync<InvoiceRow>(
    `SELECT * FROM invoices WHERE business_id = ? ORDER BY invoice_date DESC, id DESC LIMIT ?`,
    businessId,
    limit
  );
}

export interface InvoiceFilters {
  search?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getInvoices(
  db: SQLiteDatabase,
  businessId: number,
  filters: InvoiceFilters = {}
): Promise<InvoiceRow[]> {
  const conditions = ['business_id = ?'];
  const params: (string | number)[] = [businessId];

  const search = filters.search?.trim();
  if (search) {
    conditions.push('(party_name LIKE ? OR invoice_number LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (filters.dateFrom) {
    conditions.push('invoice_date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push('invoice_date <= ?');
    params.push(filters.dateTo);
  }

  return db.getAllAsync<InvoiceRow>(
    `SELECT * FROM invoices WHERE ${conditions.join(' AND ')} ORDER BY invoice_date DESC, id DESC`,
    ...params
  );
}

export interface NewInvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: number;
  amount: number;
  sortOrder: number;
}

export interface NewInvoice {
  businessId: number;
  invoiceDate: string;
  partyName: string;
  partyGstin: string | null;
  partyState: string;
  isPartyGstRegistered: boolean;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  items: NewInvoiceItem[];
}

export interface InsertedInvoice {
  id: number;
  invoiceNumber: string;
}

export async function insertInvoiceWithItems(db: SQLiteDatabase, invoice: NewInvoice): Promise<InsertedInvoice> {
  let invoiceId = 0;
  let invoiceNumber = '';

  await db.withExclusiveTransactionAsync(async (txn) => {
    const business = await txn.getFirstAsync<{ invoice_prefix: string; invoice_next_number: number }>(
      'SELECT invoice_prefix, invoice_next_number FROM businesses WHERE id = ?',
      invoice.businessId
    );
    invoiceNumber = formatInvoiceNumber(business?.invoice_prefix ?? 'INV-', business?.invoice_next_number ?? 1);

    const result = await txn.runAsync(
      `INSERT INTO invoices (
        business_id, invoice_number, invoice_date, party_name, party_gstin, party_state,
        is_party_gst_registered, subtotal, cgst_amount, sgst_amount, igst_amount, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      invoice.businessId,
      invoiceNumber,
      invoice.invoiceDate,
      invoice.partyName,
      invoice.partyGstin,
      invoice.partyState,
      invoice.isPartyGstRegistered ? 1 : 0,
      invoice.subtotal,
      invoice.cgstAmount,
      invoice.sgstAmount,
      invoice.igstAmount,
      invoice.total
    );
    invoiceId = result.lastInsertRowId;

    await txn.runAsync(
      'UPDATE businesses SET invoice_next_number = invoice_next_number + 1 WHERE id = ?',
      invoice.businessId
    );

    for (const item of invoice.items) {
      await txn.runAsync(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit, rate, gst_rate, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        invoiceId,
        item.description,
        item.quantity,
        item.unit,
        item.rate,
        item.gstRate,
        item.amount,
        item.sortOrder
      );
    }
  });

  return { id: invoiceId, invoiceNumber };
}

export interface UpdateInvoice {
  partyName: string;
  partyGstin: string | null;
  partyState: string;
  isPartyGstRegistered: boolean;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  items: NewInvoiceItem[];
}

export async function updateInvoiceWithItems(
  db: SQLiteDatabase,
  invoiceId: number,
  invoice: UpdateInvoice
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `UPDATE invoices SET
        party_name = ?, party_gstin = ?, party_state = ?, is_party_gst_registered = ?,
        subtotal = ?, cgst_amount = ?, sgst_amount = ?, igst_amount = ?, total = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      invoice.partyName,
      invoice.partyGstin,
      invoice.partyState,
      invoice.isPartyGstRegistered ? 1 : 0,
      invoice.subtotal,
      invoice.cgstAmount,
      invoice.sgstAmount,
      invoice.igstAmount,
      invoice.total,
      invoiceId
    );

    await txn.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', invoiceId);

    for (const item of invoice.items) {
      await txn.runAsync(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit, rate, gst_rate, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        invoiceId,
        item.description,
        item.quantity,
        item.unit,
        item.rate,
        item.gstRate,
        item.amount,
        item.sortOrder
      );
    }
  });
}

export async function updateInvoiceStatus(
  db: SQLiteDatabase,
  invoiceId: number,
  status: 'paid' | 'unpaid'
): Promise<void> {
  await db.runAsync(
    `UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    status,
    invoiceId
  );
}

export async function deleteInvoice(db: SQLiteDatabase, invoiceId: number): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', invoiceId);
    await txn.runAsync('DELETE FROM invoices WHERE id = ?', invoiceId);
  });
}

export async function getBusinessById(db: SQLiteDatabase, businessId: number): Promise<BusinessRow | null> {
  return db.getFirstAsync<BusinessRow>('SELECT * FROM businesses WHERE id = ?', businessId);
}

export async function getInvoiceById(db: SQLiteDatabase, invoiceId: number): Promise<InvoiceRow | null> {
  return db.getFirstAsync<InvoiceRow>('SELECT * FROM invoices WHERE id = ?', invoiceId);
}

export async function getInvoiceItems(db: SQLiteDatabase, invoiceId: number): Promise<InvoiceItemRow[]> {
  return db.getAllAsync<InvoiceItemRow>(
    'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC',
    invoiceId
  );
}

export async function getTradeTemplateRows(db: SQLiteDatabase, tradeKey: string): Promise<TradeTemplateRow[]> {
  return db.getAllAsync<TradeTemplateRow>(
    'SELECT * FROM trade_templates WHERE trade_key = ? ORDER BY id ASC',
    tradeKey
  );
}

export async function ensureTradeTemplateSeeded(
  db: SQLiteDatabase,
  tradeKey: string
): Promise<TradeTemplateRow[]> {
  const existing = await getTradeTemplateRows(db, tradeKey);
  if (existing.length > 0) {
    return existing;
  }

  const staticTemplate = getTradeTemplate(tradeKey);
  if (!staticTemplate || staticTemplate.presets.length === 0) {
    return [];
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const preset of staticTemplate.presets) {
      await txn.runAsync(
        'INSERT INTO trade_templates (trade_key, label, default_unit, default_rate) VALUES (?, ?, ?, ?)',
        tradeKey,
        preset.description,
        preset.unit,
        preset.defaultRate
      );
    }
  });

  return getTradeTemplateRows(db, tradeKey);
}

export interface TradeTemplatePresetInput {
  label: string;
  defaultUnit: string;
  defaultRate: number;
}

export async function addTradeTemplatePreset(
  db: SQLiteDatabase,
  tradeKey: string,
  preset: TradeTemplatePresetInput
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO trade_templates (trade_key, label, default_unit, default_rate) VALUES (?, ?, ?, ?)',
    tradeKey,
    preset.label,
    preset.defaultUnit,
    preset.defaultRate
  );
  return result.lastInsertRowId;
}

export async function updateTradeTemplatePreset(
  db: SQLiteDatabase,
  id: number,
  preset: TradeTemplatePresetInput
): Promise<void> {
  await db.runAsync(
    'UPDATE trade_templates SET label = ?, default_unit = ?, default_rate = ? WHERE id = ?',
    preset.label,
    preset.defaultUnit,
    preset.defaultRate,
    id
  );
}

export async function deleteTradeTemplatePreset(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM trade_templates WHERE id = ?', id);
}

function presetFromRow(row: TradeTemplateRow): TradeTemplatePreset {
  return {
    description: row.label,
    unit: row.default_unit ?? '',
    defaultRate: row.default_rate ?? 0,
  };
}

export async function getEffectiveTradePresets(db: SQLiteDatabase, tradeKey: string): Promise<TradeTemplatePreset[]> {
  const rows = await getTradeTemplateRows(db, tradeKey);
  if (rows.length > 0) {
    return rows.map(presetFromRow);
  }
  return getTradeTemplate(tradeKey)?.presets ?? [];
}
