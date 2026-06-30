export function createReferenceNumber(prefix: string, id: number): string {
  return `${prefix}${String(id).padStart(8, '0')}`;
}
