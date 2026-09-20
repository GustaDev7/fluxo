// Some mobile/private browsers expose localStorage but reject access to it.
const memory = new Map<string, string>();
export const safeStorage = {
  getItem(key: string): string | null {
    try { return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
    try { globalThis.localStorage?.setItem(key, value); } catch { /* Session-only fallback. */ }
  },
  removeItem(key: string): void {
    memory.delete(key);
    try { globalThis.localStorage?.removeItem(key); } catch { /* Session-only fallback. */ }
  },
};
