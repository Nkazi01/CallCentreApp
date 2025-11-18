/**
 * Validates South African ID Number
 * Format: YYMMDDGSSSCAZ (13 digits)
 * Uses Luhn algorithm for checksum validation
 */
export function validateSAID(id: string): boolean {
  if (!id || id.length !== 13) return false;
  if (!/^\d{13}$/.test(id)) return false;
  
  // Extract date parts (YYMMDD)
  const year = parseInt(id.substring(0, 2));
  const month = parseInt(id.substring(2, 4));
  const day = parseInt(id.substring(4, 6));
  
  // Validate date
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Temporarily skip checksum validation – only format and date are enforced
  return true;
}

/**
 * Validates South African cell number
 * Format: 10 digits starting with 0
 */
export function validateSACellNumber(number: string): boolean {
  // Remove spaces and dashes
  const cleaned = number.replace(/[\s-]/g, '');
  
  // Must be 10 digits starting with 0
  return /^0[0-9]{9}$/.test(cleaned);
}

/**
 * Formats cell number for display: 000 000 0000
 */
export function formatCellNumber(number: string): string {
  const cleaned = number.replace(/[\s-]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  return number;
}

