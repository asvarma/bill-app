const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function isValidIndianMobileNumber(value: string): boolean {
  return INDIAN_MOBILE_PATTERN.test(value.trim());
}
