export function normalizeIconName(rawValue: string): string {
  const trimmed = String(rawValue ?? '').trim();

  if (!trimmed) {
    return '';
  }

  const withKebabBoundaries = trimmed
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2');

  return withKebabBoundaries
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
