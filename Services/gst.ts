export interface GSTBreakdown {
  isInterState: boolean;
  taxable: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
}

export interface GSTOptions {
  gstRate?: number;
  isGstRegistered?: boolean;
}

export function calculateGST(
  amount: number,
  businessState: string,
  partyState: string,
  options: GSTOptions = {}
): GSTBreakdown {
  const { gstRate = 18, isGstRegistered = true } = options;

  if (!isGstRegistered) {
    return {
      isInterState: businessState.trim().toLowerCase() !== partyState.trim().toLowerCase(),
      taxable: false,
      cgst: 0,
      sgst: 0,
      igst: 0,
      taxTotal: 0,
      total: amount,
    };
  }

  const isInterState = businessState.trim().toLowerCase() !== partyState.trim().toLowerCase();
  const taxTotal = (amount * gstRate) / 100;

  const cgst = isInterState ? 0 : taxTotal / 2;
  const sgst = isInterState ? 0 : taxTotal / 2;
  const igst = isInterState ? taxTotal : 0;

  return {
    isInterState,
    taxable: true,
    cgst,
    sgst,
    igst,
    taxTotal,
    total: amount + taxTotal,
  };
}

export type GSTDisplayMode = 'unregistered' | 'intra' | 'inter';

export function getGSTDisplayMode(
  businessState: string,
  partyState: string,
  isPartyGstRegistered: boolean
): GSTDisplayMode {
  if (!isPartyGstRegistered) {
    return 'unregistered';
  }
  return businessState.trim().toLowerCase() === partyState.trim().toLowerCase() ? 'intra' : 'inter';
}

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGSTIN(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin.trim().toUpperCase());
}
