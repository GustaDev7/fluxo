import { describe, expect, it, vi } from 'vitest';
import { FinanceConflictError, loadFinanceData, saveFinanceData } from './supabaseStore';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { from } }));

describe('finance store', () => {
  it('keeps reading the account history beyond the API page limit', async () => {
    const rows = Array.from({ length: 1101 }, (_, index) => ({
      id: String(index).padStart(4, '0'), type: 'expense', amount: '2.00',
      occurred_on: '2026-09-01', description: 'Teste', master_category: 'custos_fixos',
    }));
    const offsets: (string | undefined)[] = [];
    from.mockImplementation((table: string) => {
      let after: string | undefined;
      const query = {
        select: () => query,
        eq: (column: string, user: string) => {
          expect([column, user]).toEqual(['user_id', 'owner']);
          return query;
        },
        order: () => query,
        gt: (_column: string, id: string) => { after = id; return query; },
        limit: (size: number) => {
          if (table !== 'finance_transactions') return { data: [], error: null };
          offsets.push(after);
          return { data: rows.filter((row) => !after || row.id > after).slice(0, size), error: null };
        },
      };
      return query;
    });

    const history = await loadFinanceData('owner');
    expect(history.transactions.map((transaction) => transaction.id)).toEqual(rows.map((row) => row.id));
    expect(offsets).toEqual([undefined, '0499', '0999']);
  });

  it('rejects a stale save before writing when another session created the first revision', async () => {
    from.mockClear();
    from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => ({ data: { updated_at: 'new-revision' }, error: null }) }) }),
    });

    await expect(saveFinanceData('owner', {}, null)).rejects.toBeInstanceOf(FinanceConflictError);
    expect(from.mock.calls).toEqual([['finance_preferences']]);
  });
});
