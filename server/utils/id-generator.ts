/**
 * ID Generator - Creates unique IDs for database entities
 */

/**
 * Generate unique ID with prefix
 * Format: prefix_timestamp_random
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
