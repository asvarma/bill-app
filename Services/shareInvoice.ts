import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { BusinessRow, InvoiceItemRow, InvoiceRow } from '../Data/types';
import { buildInvoiceHtml } from './invoiceHtml';

interface ShareInvoiceParams {
  business: BusinessRow;
  invoice: InvoiceRow;
  items: InvoiceItemRow[];
}

export type ShareInvoiceResult = { ok: true } | { ok: false; message: string };

export async function shareInvoicePdf({ business, invoice, items }: ShareInvoiceParams): Promise<ShareInvoiceResult> {
  try {
    let logoDataUri: string | null = null;
    if (business.logo_uri) {
      try {
        const logoFile = new File(business.logo_uri);
        if (logoFile.exists) {
          const base64 = await logoFile.base64();
          const extension = business.logo_uri.split('.').pop()?.toLowerCase();
          const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
          logoDataUri = `data:${mime};base64,${base64}`;
        }
      } catch {}
    }

    const html = buildInvoiceHtml({ business, invoice, items, logoDataUri });
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { ok: false, message: 'Sharing is not available on this device.' };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Invoice ${invoice.invoice_number}`,
      UTI: 'com.adobe.pdf',
    });
    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not generate the PDF. Please try again.' };
  }
}
