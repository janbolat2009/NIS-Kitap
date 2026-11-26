export function normalizeBookSearch(text) {
  return String(text ?? '').normalize('NFC').toLowerCase().replaceAll('ё', 'е');
}
