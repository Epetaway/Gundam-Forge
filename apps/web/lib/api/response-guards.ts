function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function readNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

export function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return readNumber(value);
}

export function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function readNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is number => isFiniteNumber(entry));
}

export function readObjectArray(value: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isRecord);
}

export function readTrendDirection(value: unknown): 'up' | 'flat' | 'down' | undefined {
  return value === 'up' || value === 'flat' || value === 'down' ? value : undefined;
}
