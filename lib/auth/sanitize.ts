function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function sanitizeEmail(value: unknown): string {
  return typeof value === "string"
    ? stripControlChars(value).trim().toLowerCase()
    : "";
}

export function sanitizeName(value: unknown): string {
  return typeof value === "string"
    ? stripControlChars(value).trim().replace(/\s+/g, " ")
    : "";
}

export function sanitizePassword(value: unknown): string {
  return typeof value === "string" ? stripControlChars(value).trim() : "";
}
