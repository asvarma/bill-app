import type { BusinessRow, InvoiceItemRow, InvoiceRow } from '../Data/types';
import { formatCurrency, formatDate } from './format';
import { getGSTDisplayMode } from './gst';

interface BuildInvoiceHtmlParams {
  business: BusinessRow;
  invoice: InvoiceRow;
  items: InvoiceItemRow[];
  logoDataUri?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInvoiceHtml({ business, invoice, items, logoDataUri }: BuildInvoiceHtmlParams): string {
  const mode = getGSTDisplayMode(business.state, invoice.party_state, invoice.is_party_gst_registered === 1);

  const itemRows = items
    .map(
      (item, index) => `
        <tr>
          <td class="cell index">${index + 1}</td>
          <td class="cell description">${escapeHtml(item.description)}</td>
          <td class="cell num">${item.quantity}</td>
          <td class="cell">${escapeHtml(item.unit ?? '')}</td>
          <td class="cell num">${formatCurrency(item.rate)}</td>
          <td class="cell num">${formatCurrency(item.amount)}</td>
        </tr>`
    )
    .join('');

  const taxRowsHtml =
    mode === 'unregistered'
      ? `<div class="total-note">No GSTIN on file — GST not charged (bill of supply).</div>`
      : mode === 'inter'
        ? `<div class="total-row"><span>IGST</span><span>${formatCurrency(invoice.igst_amount)}</span></div>`
        : `<div class="total-row"><span>CGST</span><span>${formatCurrency(invoice.cgst_amount)}</span></div>
           <div class="total-row"><span>SGST</span><span>${formatCurrency(invoice.sgst_amount)}</span></div>`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, Helvetica, Arial, sans-serif;
        color: #111827;
        padding: 32px;
        font-size: 13px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #111827;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      .business-block { display: flex; align-items: flex-start; gap: 12px; }
      .logo { width: 56px; height: 56px; object-fit: contain; border-radius: 6px; }
      .business-name { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
      .muted { color: #6B7280; font-size: 12px; margin: 0 0 2px; }
      .invoice-title { text-align: right; }
      .invoice-title h1 { font-size: 20px; margin: 0 0 6px; letter-spacing: 1px; }
      .section-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6B7280;
        margin: 0 0 6px;
      }
      .party { margin-bottom: 24px; }
      .party p { margin: 0 0 2px; }
      .party .name { font-size: 14px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th {
        background: #F3F4F6;
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        color: #374151;
        padding: 8px 10px;
        border: 1px solid #E5E7EB;
      }
      .cell { padding: 8px 10px; border: 1px solid #E5E7EB; font-size: 12px; }
      .index { width: 28px; text-align: center; color: #6B7280; }
      .num { text-align: right; }
      .totals { display: flex; justify-content: flex-end; }
      .totals-box { width: 260px; }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 13px;
      }
      .total-note {
        font-size: 11px;
        color: #6B7280;
        font-style: italic;
        padding: 4px 0;
      }
      .divider { border-top: 1px solid #E5E7EB; margin: 6px 0; }
      .grand-total {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 700;
        padding-top: 4px;
      }
      .grand-total span:last-child { color: #2563EB; }
      .footer {
        margin-top: 32px;
        text-align: center;
        font-size: 11px;
        color: #9CA3AF;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="business-block">
        ${logoDataUri ? `<img class="logo" src="${logoDataUri}" />` : ''}
        <div>
          <p class="business-name">${escapeHtml(business.name)}</p>
          ${business.mobile_number ? `<p class="muted">Mobile: ${escapeHtml(business.mobile_number)}</p>` : ''}
          ${business.gstin ? `<p class="muted">GSTIN: ${escapeHtml(business.gstin)}</p>` : ''}
          ${business.address ? `<p class="muted">${escapeHtml(business.address)}</p>` : ''}
          <p class="muted">${escapeHtml(business.state)}</p>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="muted">Invoice #: ${escapeHtml(invoice.invoice_number)}</p>
        <p class="muted">Date: ${formatDate(invoice.invoice_date)}</p>
      </div>
    </div>

    <div class="party">
      <p class="section-title">Bill To</p>
      <p class="name">${escapeHtml(invoice.party_name)}</p>
      ${invoice.party_gstin ? `<p class="muted">GSTIN: ${escapeHtml(invoice.party_gstin)}</p>` : ''}
      <p class="muted">${escapeHtml(invoice.party_state)}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th class="index">#</th>
          <th>Description</th>
          <th class="num">Qty</th>
          <th>Unit</th>
          <th class="num">Rate</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
        ${taxRowsHtml}
        <div class="divider"></div>
        <div class="grand-total"><span>Grand Total</span><span>${formatCurrency(invoice.total)}</span></div>
      </div>
    </div>

    <div class="footer">This is a computer-generated invoice.</div>
  </body>
</html>`;
}
