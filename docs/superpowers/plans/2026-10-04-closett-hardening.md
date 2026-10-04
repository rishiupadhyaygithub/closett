# Closett Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Closett's data layer safe (no silent failures, no destructive import), config-driven, and tested, before any AI features are added.

**Architecture:** Keep the existing Vite + React + Supabase structure. Add Vitest for pure-logic and mocked-client tests. Add small testable modules (`lib/config.ts`, `lib/session.ts`, `lib/actions.ts`) instead of growing `App.tsx`. Writes become upsert-then-prune so a failure never leaves the user with an empty closet.

**Tech Stack:** React 18, TypeScript (strict), Vite 4, Supabase JS v2, Vitest, bun.

**Spec:** Audit report from this session (findings 1-17) and the user's decisions: new Supabase project (user supplies URL/key later), composite primary keys, dead code removal approved, season fixes approved, bucket choice delegated.

## Global Constraints

- Use `bun` / `bunx` only. Never `npm` / `npx`.
- TypeScript only. No Python.
- `tsc --noEmit` must stay at 0 errors (`strict`, `noUnusedLocals`, `noUnusedParameters` are on).
- Do not commit `.env` or secrets. Only `.env.example` with placeholders.
- Work on branch `audit/2026-10-04`. One commit per task.
- Do not touch `src/index.css` beyond the one `.error-banner` rule in Task 4.
- Image bucket stays **public** for now (see Deferred). Do not change image URL handling.
- Do not delete files not listed in Task 6.

## Review Focus

- Backup JSON with missing `id` or non-string `title`: must be rejected before any write.
- Backup JSON with zero items: must clear the user's items (intentional), not be treated as invalid.
- A write error halfway through import: old data must still exist; `importData` returns `false`.
- `deleteItem` on an item whose image is an external scraped URL (not in our bucket): must not try to remove a storage file.
- Storage removal failing during `deleteItem`: the row deletion must still succeed.
- Supabase unreachable at startup: UI shows an error message instead of a silent empty app.

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest` config in `vite.config.ts` | test runner config (node environment) |
| `src/test/fakeSupabase.ts` (create) | chainable thenable fake for `supabase.from(...)` calls |
| `src/seasonData.ts` (modify) | fix `dark+neutral`, remove ethnicity copy |
| `src/seasonData.test.ts` (create) | season mapping + copy tests |
| `src/db.ts` (modify) | error propagation, storage cleanup, safe import, safe rules save |
| `src/db.test.ts` (create) | data-layer tests with mocked client |
| `src/lib/config.ts` (create) | pure env reader |
| `src/lib/config.test.ts` (create) | env reader tests |
| `src/lib/supabase.ts` (modify) | read config from env, no hardcoded keys |
| `src/lib/session.ts` (create) | `ensureSession`, pure and testable |
| `src/lib/actions.ts` (create) | `runAction` error wrapper |
| `src/lib/session.test.ts`, `src/lib/actions.test.ts` (create) | tests |
| `src/vite-env.d.ts` (create) | `import.meta.env` types |
| `src/App.tsx` (modify) | use session + actions modules, error banner |
| `supabase/migrations/001_init.sql` (create) | schema, composite PKs, RLS, storage policies |
| `.env.example`, `.gitignore`, `README.md` (modify/create) | config docs, ignore `${HOME}/` |

## Order (audited)

0 setup → 1 season fix → 2 db errors → 3 safe writes → 4 session/UI errors → 5 config + migration → 6 dead code → 7 final audit.

Why this order: Task 0 comes first because every later task is test-first. Tasks 2 and 3 are pure code against a mocked client, so they do not wait on the new Supabase project. Task 5 (migration) must exist before Task 3's `onConflict: 'user_id,id'` is used against a real database, so the real-DB smoke test sits at the end of Task 5. Dead-code removal (Task 6) comes last so the audit baseline in Task 7 measures the final tree.

---

### Task 0: Branch and test runner

**Files:**
- Modify: `package.json`, `vite.config.ts`, `.gitignore`
- Create: `src/test/fakeSupabase.ts`, `src/vite-env.d.ts`

**Interfaces:**
- Produces: `makeBuilder(result: Result)` where `Result = { data?: unknown; error: { message: string } | null }`. Returns a chainable object. Every method in `select insert update upsert delete eq in not order` returns the builder and records calls (`vi.fn`). `maybeSingle()` resolves `result`. The builder is thenable, so `await builder` resolves `result`.

- [ ] **Step 1: Create the branch**

```bash
cd "/Users/rishi/Desktop/fashion sorter"
git checkout -b audit/2026-10-04
```

- [ ] **Step 2: Install Vitest**

```bash
bun add -d vitest
```

Expected: `vitest` appears in `devDependencies`.

- [ ] **Step 3: Configure Vitest**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Add env types**

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Create the fake builder**

Create `src/test/fakeSupabase.ts`:

```ts
import { vi } from 'vitest';

export type Result = { data?: unknown; error: { message: string } | null };

const CHAIN = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'in', 'not', 'order'] as const;

export function makeBuilder(result: Result) {
  const b: Record<string, any> = {};
  for (const m of CHAIN) b[m] = vi.fn(() => b);
  b.maybeSingle = vi.fn(() => Promise.resolve(result));
  b.then = (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return b;
}

export const OK: Result = { data: null, error: null };
export const FAIL: Result = { data: null, error: { message: 'boom' } };
```

- [ ] **Step 6: Ignore the stray folder**

Append to `.gitignore`:

```
${HOME}/
.env.local
.serena/
```

- [ ] **Step 7: Verify and commit**

```bash
bun run test -- --passWithNoTests
bunx tsc --noEmit
git add package.json bun.lock vite.config.ts src/test src/vite-env.d.ts .gitignore
git commit -m "chore: add vitest, fake supabase builder, ignore stray dirs"
```

Expected: no tests found but exit 0; `tsc` 0 errors.

---

### Task 1: Season mapping fix

**Files:**
- Modify: `src/seasonData.ts` (map near the end of the file; `deep_winter.description`)
- Test: `src/seasonData.test.ts`

**Interfaces:**
- Consumes: `deriveColorSeason(skinTone, undertone)`, `SEASON_INFO` (existing).

- [ ] **Step 1: Write the failing tests**

Create `src/seasonData.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deriveColorSeason, SEASON_INFO } from './seasonData';
import type { SkinTone, Undertone } from './types';

const TONES: SkinTone[] = ['fair', 'wheatish', 'dusky', 'dark'];
const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral', 'olive'];

describe('deriveColorSeason', () => {
  it('maps dark+neutral the same as dusky+neutral', () => {
    expect(deriveColorSeason('dark', 'neutral')).toBe(deriveColorSeason('dusky', 'neutral'));
  });

  it('returns a known season for every tone/undertone pair', () => {
    for (const t of TONES) for (const u of UNDERTONES) {
      expect(SEASON_INFO[deriveColorSeason(t, u)]).toBeDefined();
    }
  });
});

describe('SEASON_INFO copy', () => {
  it('does not tie a season to an ethnic group', () => {
    for (const s of Object.values(SEASON_INFO)) {
      expect(s.description).not.toMatch(/Tamil|Malayalee|Sri Lankan|heritage/i);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test src/seasonData.test.ts`
Expected: FAIL on the first and third tests (dark+neutral is `deep_winter`; Deep Winter description contains "Tamil").

- [ ] **Step 3: Fix the map and the copy**

In `src/seasonData.ts`, change the `dark` row to `dark: { warm: 'deep_autumn', cool: 'deep_winter', neutral: 'deep_autumn', olive: 'deep_autumn' },`.

In `deep_winter.description`, replace the text `— common in Tamil, Malayalee, and Sri Lankan heritage. This is the season Indians are most often mis-typed out of.` with `— a season often mistaken for warm.`

- [ ] **Step 4: Run to verify pass**

Run: `bun run test src/seasonData.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/seasonData.ts src/seasonData.test.ts
git commit -m "fix: consistent dark/dusky neutral season, remove ethnicity copy"
```

---

### Task 2: Data-layer error propagation and image cleanup

**Files:**
- Modify: `src/db.ts` (`addCategory`, `addItem`, `updateItem`, `deleteItem`; new `must`, `storagePathFromUrl`)
- Test: `src/db.test.ts`

**Interfaces:**
- Consumes: `makeBuilder`, `OK`, `FAIL` from Task 0.
- Produces: `must(res, what)` throws `Error("<what>: <message>")` when `res.error` is set, else returns `res`. `storagePathFromUrl(url): string | null` returns the object path inside the `item-images` bucket or `null` for external URLs. Both exported from `src/db.ts`.

- [ ] **Step 1: Write the failing tests**

Create `src/db.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeBuilder, OK, FAIL } from './test/fakeSupabase';

const h = vi.hoisted(() => ({
  from: vi.fn(),
  remove: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({
  supabase: {
    from: h.from,
    auth: { getSession: h.getSession },
    storage: { from: () => ({ remove: h.remove }) },
  },
  uploadImage: vi.fn(),
}));

import { addItem, deleteItem, must, storagePathFromUrl } from './db';
import type { Item } from './types';

const ITEM: Item = {
  id: 'i1', image: '', title: 'Shirt', price: 0, currency: 'INR', link: '', notes: '',
  categoryId: 'uncategorized', createdAt: 1, color: 'white', garmentType: 'top',
};

beforeEach(() => {
  h.from.mockReset();
  h.remove.mockReset();
  h.remove.mockResolvedValue({ error: null });
  h.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
});

describe('must', () => {
  it('throws with context when the response has an error', () => {
    expect(() => must({ error: { message: 'boom' } }, 'insert item')).toThrow('insert item: boom');
  });
  it('returns the response when there is no error', () => {
    const res = { error: null, data: 1 };
    expect(must(res, 'x')).toBe(res);
  });
});

describe('storagePathFromUrl', () => {
  it('extracts the path from a public bucket URL', () => {
    expect(storagePathFromUrl('https://x.supabase.co/storage/v1/object/public/item-images/u1/i1.png'))
      .toBe('u1/i1.png');
  });
  it('returns null for an external URL', () => {
    expect(storagePathFromUrl('https://cdn.zara.com/a.jpg')).toBeNull();
  });
});

describe('addItem', () => {
  it('rejects when the insert fails', async () => {
    h.from.mockReturnValue(makeBuilder(FAIL));
    await expect(addItem(ITEM)).rejects.toThrow('insert item: boom');
  });
});

describe('deleteItem', () => {
  it('removes the stored image after deleting the row', async () => {
    const lookup = makeBuilder({ data: { image: 'https://x.supabase.co/storage/v1/object/public/item-images/u1/i1.png' }, error: null });
    const del = makeBuilder(OK);
    h.from.mockReturnValueOnce(lookup).mockReturnValueOnce(del);
    await deleteItem('i1');
    expect(h.remove).toHaveBeenCalledWith(['u1/i1.png']);
  });

  it('does not touch storage for an external image URL', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: { image: 'https://cdn.zara.com/a.jpg' }, error: null }))
      .mockReturnValueOnce(makeBuilder(OK));
    await deleteItem('i1');
    expect(h.remove).not.toHaveBeenCalled();
  });

  it('still succeeds when storage removal fails', async () => {
    h.remove.mockResolvedValue({ error: { message: 'storage down' } });
    h.from
      .mockReturnValueOnce(makeBuilder({ data: { image: 'https://x.supabase.co/storage/v1/object/public/item-images/u1/i1.png' }, error: null }))
      .mockReturnValueOnce(makeBuilder(OK));
    await expect(deleteItem('i1')).resolves.toBeUndefined();
  });

  it('rejects when the row delete fails', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: null, error: null }))
      .mockReturnValueOnce(makeBuilder(FAIL));
    await expect(deleteItem('i1')).rejects.toThrow('delete item: boom');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test src/db.test.ts`
Expected: FAIL. `must` and `storagePathFromUrl` are not exported yet.

- [ ] **Step 3: Implement**

In `src/db.ts`, add below the `currentUserId` helper:

```ts
export function must<T extends { error: { message: string } | null }>(res: T, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res;
}

export function storagePathFromUrl(url: string): string | null {
  const marker = '/item-images/';
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}
```

Replace `addCategory` body:

```ts
export async function addCategory(category: Category): Promise<void> {
  const uid = await currentUserId();
  must(await supabase.from('categories').upsert({
    id: category.id, user_id: uid,
    name: category.name, sort_order: category.order, parent_id: category.parentId,
  }, { onConflict: 'user_id,id' }), 'save category');
}
```

In `addItem`, wrap the insert: `must(await supabase.from('items').insert({ ...same fields... }), 'insert item');`

In `updateItem`, wrap the update: `must(await supabase.from('items').update({ ...same fields... }).eq('id', item.id).eq('user_id', uid), 'update item');`

Replace `deleteItem`:

```ts
export async function deleteItem(id: string): Promise<void> {
  const uid = await currentUserId();
  const { data } = await supabase.from('items').select('image').eq('id', id).eq('user_id', uid).maybeSingle();
  must(await supabase.from('items').delete().eq('id', id).eq('user_id', uid), 'delete item');

  const path = data?.image ? storagePathFromUrl(String(data.image)) : null;
  if (path) {
    const { error } = await supabase.storage.from('item-images').remove([path]);
    if (error) console.warn('image cleanup failed:', error.message);
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test src/db.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
bunx tsc --noEmit
git add src/db.ts src/db.test.ts
git commit -m "fix: surface db write errors, delete stored image with item"
```

---

### Task 3: Safe import and safe rules save

**Files:**
- Modify: `src/db.ts` (`saveColorRules`, `importData`; new `validateBackup`, `pruneMissing`)
- Test: `src/db.test.ts` (append)

**Interfaces:**
- Consumes: `must`, mocked `supabase` from Task 2's test setup.
- Produces: `validateBackup(raw: unknown): { categories: any[]; items: any[]; colorRules: any[] }` throws `Error` on bad shape. `importData(json: string): Promise<boolean>` (signature unchanged). `saveColorRules(rules)` (signature unchanged).

Design note: upsert first, prune second. If any write fails, nothing has been deleted yet, so old data survives. This is not a single transaction; a failure after the upsert leaves the old rows plus some new ones, which is recoverable, never empty.

- [ ] **Step 1: Write the failing tests**

Append to `src/db.test.ts`:

```ts
import { importData, saveColorRules, validateBackup } from './db';

const GOOD = JSON.stringify({
  categories: [{ id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null }],
  items: [{ id: 'i1', title: 'Shirt' }],
  colorRules: [{ id: 'rule_white', topColor: 'white', bottomColors: ['black'] }],
});

describe('validateBackup', () => {
  it('rejects an item without an id', () => {
    expect(() => validateBackup({ categories: [], items: [{ title: 'x' }] })).toThrow('item 0');
  });
  it('rejects an item with a non-string title', () => {
    expect(() => validateBackup({ categories: [], items: [{ id: 'a', title: 5 }] })).toThrow('item 0');
  });
  it('accepts zero items', () => {
    expect(validateBackup({ categories: [], items: [] }).items).toEqual([]);
  });
});

describe('importData', () => {
  it('returns false and writes nothing for invalid JSON', async () => {
    expect(await importData('not json')).toBe(false);
    expect(h.from).not.toHaveBeenCalled();
  });

  it('returns false and deletes nothing when an upsert fails', async () => {
    const builders = [makeBuilder(FAIL)];
    h.from.mockImplementation(() => builders[0]);
    expect(await importData(GOOD)).toBe(false);
    expect(builders[0].delete).not.toHaveBeenCalled();
  });

  it('upserts everything, then prunes rows not in the backup', async () => {
    const b = makeBuilder(OK);
    h.from.mockReturnValue(b);
    expect(await importData(GOOD)).toBe(true);
    expect(b.upsert).toHaveBeenCalledTimes(3);
    expect(b.delete).toHaveBeenCalledTimes(3);
    expect(b.not).toHaveBeenCalled();
  });

  it('clears a table when the backup has zero rows for it', async () => {
    const b = makeBuilder(OK);
    h.from.mockReturnValue(b);
    const empty = JSON.stringify({ categories: [], items: [], colorRules: [] });
    expect(await importData(empty)).toBe(true);
    expect(b.upsert).not.toHaveBeenCalled();
    expect(b.delete).toHaveBeenCalled();
  });
});

describe('saveColorRules', () => {
  it('throws and deletes nothing when the upsert fails', async () => {
    const b = makeBuilder(FAIL);
    h.from.mockReturnValue(b);
    await expect(saveColorRules([{ id: 'r', topColor: 'white', bottomColors: [] }])).rejects.toThrow('save color rules');
    expect(b.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test src/db.test.ts`
Expected: FAIL. `validateBackup` is not exported; `importData` still deletes first.

- [ ] **Step 3: Implement**

In `src/db.ts`, add:

```ts
export function validateBackup(raw: unknown): { categories: any[]; items: any[]; colorRules: any[] } {
  const d = raw as any;
  if (!d || !Array.isArray(d.categories) || !Array.isArray(d.items)) {
    throw new Error('backup must contain categories and items arrays');
  }
  d.categories.forEach((c: any, i: number) => {
    if (typeof c?.id !== 'string' || typeof c?.name !== 'string') throw new Error(`category ${i} is missing id or name`);
  });
  d.items.forEach((it: any, i: number) => {
    if (typeof it?.id !== 'string' || typeof it?.title !== 'string') throw new Error(`item ${i} is missing id or title`);
  });
  const colorRules = Array.isArray(d.colorRules) && d.colorRules.length ? d.colorRules : [...DEFAULT_COLOR_RULES];
  return { categories: d.categories, items: d.items, colorRules };
}

async function pruneMissing(table: string, uid: string, keepIds: string[]): Promise<void> {
  const q = supabase.from(table).delete().eq('user_id', uid);
  must(await (keepIds.length ? q.not('id', 'in', `(${keepIds.join(',')})`) : q), `prune ${table}`);
}
```

Replace `saveColorRules`:

```ts
export async function saveColorRules(rules: ColorRule[]): Promise<void> {
  const uid = await currentUserId();
  if (rules.length > 0) {
    must(await supabase.from('color_rules').upsert(
      rules.map(r => ({ id: r.id, user_id: uid, top_color: r.topColor, bottom_colors: r.bottomColors })),
      { onConflict: 'user_id,id' },
    ), 'save color rules');
  }
  await pruneMissing('color_rules', uid, rules.map(r => r.id));
}
```

Replace `importData`:

```ts
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = validateBackup(JSON.parse(jsonString));
    const uid = await currentUserId();

    const cats = data.categories.map((c: any) => ({
      id: c.id, user_id: uid, name: c.name,
      sort_order: c.order ?? 0, parent_id: c.parentId ?? null,
    }));
    const its = data.items.map((i: any) => ({
      id: i.id, user_id: uid, image: i.image ?? '', title: i.title,
      price: i.price ?? 0, currency: i.currency ?? 'INR',
      link: i.link ?? '', notes: i.notes ?? '',
      category_id: i.categoryId ?? 'uncategorized',
      created_at: i.createdAt ?? Date.now(),
      color: i.color ?? '', garment_type: i.garmentType ?? 'other',
    }));
    const rules = data.colorRules.map((r: any) => ({
      id: r.id, user_id: uid, top_color: r.topColor, bottom_colors: r.bottomColors,
    }));

    const opts = { onConflict: 'user_id,id' };
    if (cats.length)  must(await supabase.from('categories').upsert(cats, opts), 'import categories');
    if (its.length)   must(await supabase.from('items').upsert(its, opts), 'import items');
    if (rules.length) must(await supabase.from('color_rules').upsert(rules, opts), 'import color rules');

    await pruneMissing('categories', uid, cats.map((c: any) => c.id));
    await pruneMissing('items', uid, its.map((i: any) => i.id));
    await pruneMissing('color_rules', uid, rules.map((r: any) => r.id));
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test src/db.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Typecheck and commit**

```bash
bunx tsc --noEmit
git add src/db.ts src/db.test.ts
git commit -m "fix: import and rule saves upsert-then-prune, never wipe on failure"
```

---

### Task 4: Session failure and action errors in the UI

**Files:**
- Create: `src/lib/session.ts`, `src/lib/actions.ts`
- Test: `src/lib/session.test.ts`, `src/lib/actions.test.ts`
- Modify: `src/App.tsx` (imports; auth effect at lines ~60-91; handlers at ~138-153 and the rules `onSave` at ~526; render root at ~318), `src/index.css` (append one rule)

**Interfaces:**
- Produces:
  - `ensureSession<U>(client): Promise<{ user: U | null; error: string | null }>` where `client.auth` has `getSession()` and `signInAnonymously()`.
  - `runAction<T>(fn: () => Promise<T>, onError: (msg: string) => void): Promise<T | undefined>`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/session.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ensureSession } from './session';

const auth = (over: Partial<Record<'getSession' | 'signInAnonymously', any>>) => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'anon' } }, error: null }),
    ...over,
  },
});

describe('ensureSession', () => {
  it('reuses an existing session without signing in again', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) });
    expect(await ensureSession(c)).toEqual({ user: { id: 'u1' }, error: null });
    expect(c.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session', async () => {
    expect(await ensureSession(auth({}))).toEqual({ user: { id: 'anon' }, error: null });
  });

  it('returns an error message when sign-in fails', async () => {
    const c = auth({ signInAnonymously: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Failed to fetch' } }) });
    const r = await ensureSession(c);
    expect(r.user).toBeNull();
    expect(r.error).toContain('Failed to fetch');
  });

  it('returns an error message when the network call throws', async () => {
    const c = auth({ getSession: vi.fn().mockRejectedValue(new Error('offline')) });
    expect((await ensureSession(c)).error).toContain('offline');
  });
});
```

Create `src/lib/actions.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { runAction } from './actions';

describe('runAction', () => {
  it('returns the value and does not call onError on success', async () => {
    const onError = vi.fn();
    expect(await runAction(async () => 42, onError)).toBe(42);
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports the message and returns undefined on failure', async () => {
    const onError = vi.fn();
    expect(await runAction(async () => { throw new Error('nope'); }, onError)).toBeUndefined();
    expect(onError).toHaveBeenCalledWith('nope');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test src/lib`
Expected: FAIL. The modules do not exist.

- [ ] **Step 3: Implement the modules**

Create `src/lib/session.ts`:

```ts
interface AuthLike<U> {
  auth: {
    getSession(): Promise<{ data: { session: { user: U } | null } }>;
    signInAnonymously(): Promise<{ data: { user: U | null }; error: { message: string } | null }>;
  };
}

export async function ensureSession<U>(client: AuthLike<U>): Promise<{ user: U | null; error: string | null }> {
  try {
    const { data } = await client.auth.getSession();
    if (data.session?.user) return { user: data.session.user, error: null };
    const { data: anon, error } = await client.auth.signInAnonymously();
    if (error) return { user: null, error: `Could not start a session: ${error.message}` };
    return { user: anon.user, error: null };
  } catch (e) {
    return { user: null, error: `Could not reach the server: ${e instanceof Error ? e.message : String(e)}` };
  }
}
```

Create `src/lib/actions.ts`:

```ts
export async function runAction<T>(
  fn: () => Promise<T>,
  onError: (message: string) => void,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    onError(e instanceof Error ? e.message : String(e));
    return undefined;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test src/lib`
Expected: PASS (6 tests).

- [ ] **Step 5: Wire into `App.tsx`**

1. Add imports: `import { ensureSession } from './lib/session';` and `import { runAction } from './lib/actions';`.
2. Add state next to the other `useState` calls: `const [errorMsg, setErrorMsg] = useState<string | null>(null);`
3. Replace the body of the `ensureSession` const inside the auth `useEffect` (lines ~61-79) with:

```ts
    const start = async () => {
      const { user: u, error } = await ensureSession(supabase);
      setUser(u);
      if (error) setErrorMsg(error);
      setAuthLoading(false);
    };
    start();
```

and delete the old `ensureSession();` call below it. Keep the `onAuthStateChange` block unchanged.
4. Replace `handleSaveItem`:

```ts
  const handleSaveItem = async (item: Item) => {
    const ok = await runAction(async () => {
      if (editingItem) await updateItem(item); else await addItem(item);
      await loadData();
      return true;
    }, setErrorMsg);
    if (!ok) return;
    setEditingItem(null);
    setIsAddModalOpen(false);
  };
```

5. Replace `handleDeleteItem`:

```ts
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await runAction(async () => { await deleteItem(id); await loadData(); }, setErrorMsg);
  };
```

6. Change the rules `onSave` prop (line ~526) to: `onSave={(rules) => runAction(async () => { await saveColorRules(rules); await loadData(); }, setErrorMsg).then(() => undefined)}`
7. Make the first child of the `app-shell` div (line ~318) the banner:

```tsx
      {errorMsg && (
        <div className="error-banner" role="alert">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
```

8. Append to `src/index.css`:

```css
.error-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 16px; background: #b3261e; color: #fff; font-size: 14px; }
.error-banner button { background: none; border: 0; color: inherit; cursor: pointer; font-size: 16px; }
```

- [ ] **Step 6: Verify**

```bash
bunx tsc --noEmit
bun run test
```

Then run `bun run dev`, open the app with the dead Supabase URL still in place, and confirm a red banner reads "Could not reach the server: Failed to fetch" (or similar). This reproduces the original silent failure and shows the fix.

- [ ] **Step 7: Commit**

```bash
git add src/lib/session.ts src/lib/actions.ts src/lib/session.test.ts src/lib/actions.test.ts src/App.tsx src/index.css
git commit -m "fix: show an error banner on session and save failures"
```

---

### Task 5: Env-driven config and SQL migration

**Files:**
- Create: `src/lib/config.ts`, `src/lib/config.test.ts`, `supabase/migrations/001_init.sql`, `.env.example`
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `readSupabaseConfig(env: Record<string, string | undefined>): { url: string; anonKey: string }` throws if either value is missing.

- [ ] **Step 1: Write the failing test**

Create `src/lib/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readSupabaseConfig } from './config';

describe('readSupabaseConfig', () => {
  it('returns url and key when both are set', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://a.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' }))
      .toEqual({ url: 'https://a.supabase.co', anonKey: 'k' });
  });
  it('throws a helpful message when the url is missing', () => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_ANON_KEY: 'k' })).toThrow('.env.example');
  });
  it('throws when the key is missing', () => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_URL: 'https://a.supabase.co' })).toThrow('VITE_SUPABASE_ANON_KEY');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test src/lib/config.test.ts`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement config and use it**

Create `src/lib/config.ts`:

```ts
export function readSupabaseConfig(env: Record<string, string | undefined>): { url: string; anonKey: string } {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.');
  }
  return { url, anonKey };
}
```

In `src/lib/supabase.ts`, replace lines 1-6 (the import, both constants and `createClient`) with:

```ts
import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './config';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = readSupabaseConfig(import.meta.env);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Leave `uploadImage` unchanged.

Create `.env.example`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/001_init.sql`:

```sql
-- Closett schema. Composite primary keys so ids like 'uncategorized' and 'rule_white'
-- can exist once per user.

create table public.categories (
  user_id    uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  id         text    not null,
  name       text    not null,
  sort_order integer not null default 0,
  parent_id  text,
  primary key (user_id, id)
);

create table public.items (
  user_id      uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  id           text    not null,
  image        text    not null default '',
  title        text    not null,
  price        numeric not null default 0,
  currency     text    not null default 'INR',
  link         text    not null default '',
  notes        text    not null default '',
  category_id  text    not null default 'uncategorized',
  created_at   bigint  not null,
  color        text    not null default '',
  garment_type text    not null default 'other'
               check (garment_type in ('top','bottom','layer','accessory','other')),
  primary key (user_id, id)
);

create table public.color_rules (
  user_id       uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  id            text   not null,
  top_color     text   not null,
  bottom_colors text[] not null default '{}',
  primary key (user_id, id)
);

create table public.user_profiles (
  id         uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  gender     text,
  skin_tone  text,
  undertone  text,
  body_type  text,
  updated_at timestamptz not null default now()
);

alter table public.categories    enable row level security;
alter table public.items         enable row level security;
alter table public.color_rules   enable row level security;
alter table public.user_profiles enable row level security;

create policy "own categories"  on public.categories  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own items"       on public.items       for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own color rules" on public.color_rules for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own profile"     on public.user_profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Storage: public-read bucket, owner-only writes inside {user_id}/ folder.
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

create policy "own images insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images select" on storage.objects for select to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images update" on storage.objects for update to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images delete" on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 5: Run unit tests and typecheck**

```bash
bun run test
bunx tsc --noEmit
```

Expected: all pass, 0 type errors. (The app will now throw "Missing VITE_SUPABASE_URL" until `.env` exists; that is intended.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts src/lib/supabase.ts supabase .env.example
git commit -m "feat: env-driven supabase config and initial migration"
```

- [ ] **Step 7: Real-database smoke test (needs the user)**

User actions: create the Supabase project, run `001_init.sql` in the SQL editor, enable **Anonymous sign-ins** (Authentication → Providers), create `.env` with the project URL and anon key, and set the same two variables in Vercel.

Then run `bun run dev` and check, in order: no error banner; add an item with an uploaded photo; reload and confirm the item and photo persist; delete the item and confirm the file disappears from the `item-images` bucket; export, then import the export and confirm nothing is lost.

---

### Task 6: Dead code and docs

**Files:**
- Delete (approved): `src/firebase.ts`, `src/db-firebase.ts`, `src/components/AuthModal.tsx`, `FIREBASE_SETUP.md`, `STEPS.md`
- Modify: `README.md`, `package.json`

- [ ] **Step 1: Confirm nothing imports the dead files**

```bash
cd "/Users/rishi/Desktop/fashion sorter"
grep -rn "firebase\|AuthModal" src | grep -v "^src/firebase.ts\|^src/db-firebase.ts\|^src/components/AuthModal.tsx"
```

Expected: no output.

- [ ] **Step 2: Delete the files and the dependency**

```bash
git rm src/firebase.ts src/db-firebase.ts src/components/AuthModal.tsx FIREBASE_SETUP.md STEPS.md
bun remove firebase
```

Lockfile note: the repo has `package-lock.json`. `bun remove` creates `bun.lock`. Pick one tool: this plan switches to `bun.lock` and deletes `package-lock.json` (`git rm package-lock.json`). Vercel detects `bun.lock` automatically. This needs the user's confirmation (see Open items).

- [ ] **Step 3: Fix the README**

In `README.md`: change the Auth row to "Supabase Auth (anonymous sessions)"; delete the "Auth — email/password signup + login" bullet; change "Running locally" to `bun install`, copy `.env.example` to `.env`, run `001_init.sql`, then `bun run dev`; add the new files (`lib/config.ts`, `lib/session.ts`, `lib/actions.ts`, `supabase/migrations/001_init.sql`) to the Architecture tree; update the schema block to the composite primary keys.

- [ ] **Step 4: Verify and commit**

```bash
bunx tsc --noEmit
bun run test
bun run build
git add -A
git commit -m "chore: remove firebase, dead auth modal, stale docs"
```

Expected: 0 type errors, tests pass, build succeeds.

---

### Task 7: Final audit (bullet-train-audit)

**Files:** none modified; produces the report.

- [ ] **Step 1: Re-run all checks**

```bash
bunx tsc --noEmit
bun run test
bun run build
bun audit 2>&1 | tail -10
git status --short
```

- [ ] **Step 2: Compare to the baseline**

| Check | Baseline | Target |
|---|---|---|
| `tsc` errors | 0 | 0 |
| tests | none | all pass (≈25 tests) |
| build | pass | pass |
| audit critical/high | 1 critical, 3 high | 0 critical, 0 high (Firebase removed) |
| silent DB writes | 5 unchecked sites | 0 |

- [ ] **Step 3: Re-read edited files for side effects**

Check `src/App.tsx` for any remaining unwrapped `await` on `db.ts` functions (`handleAddCategory`, `handleDeleteCategory`, `handleImport`, `handleImportFile`) and list them in the report. These were out of scope for Task 4 and are noted below.

- [ ] **Step 4: Write the report in the bullet-train-audit format**

Top line `Found N | Fixed N | Open N | Not verifiable N`, then the before/after table, the findings table, "Could not verify", and "Needs your decision".

---

## Deferred (explicitly out of scope)

| Finding | Why deferred |
|---|---|
| 9. Public CORS proxies for URL scraping | Needs a Supabase Edge Function and an API key. Belongs with the AI auto-tagging phase. |
| 11. Private image bucket | Needs signed URLs and touches `ItemCard`, `AddItemModal` and export format. Paths are UUID-based, so risk is low. Revisit after launch. |
| 14-16. Minor ClosetView / scraper helper issues | Behavior-neutral cleanups. Do after tests exist. |
| `handleAddCategory`, `handleDeleteCategory`, `handleImport*` still unwrapped | Same fix as Task 4. Add as a follow-up task once Task 4 is reviewed. |
| Anonymous-to-email account upgrade | Product decision. `AuthModal` is deleted; rebuild it when this is designed. |

## Open items for the user

1. Create the Supabase project and share the URL and anon key when Task 5 Step 7 is reached.
2. Lockfile: switch to `bun.lock` and delete `package-lock.json`? Recommended: yes.
3. Confirm "dark + neutral → Deep Autumn" is acceptable. It makes `dusky` and `dark` consistent. It has not been validated by a color-analysis source.

## Self-Review

- **Spec coverage:** findings 2, 3, 4 (Tasks 2-3), 5 (Task 5 migration + `onConflict` in Tasks 2-3), 6 and 7 (Task 4), 8 and 17 (Task 6), 10 (Task 2), 12 and 13 (Task 1), 1 (Task 5). Findings 9, 11, 14-16 are in Deferred with reasons.
- **Placeholders:** none. Every code step has code. The README step lists exact edits.
- **Type consistency:** `must`, `storagePathFromUrl`, `validateBackup`, `pruneMissing`, `ensureSession`, `runAction`, `readSupabaseConfig` are defined once and used with the same names and signatures later. `onConflict: 'user_id,id'` is identical in Tasks 2, 3 and the migration's primary keys.
- **Review Focus:** each of the six lines has a test: missing id and non-string title (`validateBackup`), zero items (`accepts zero items`, `clears a table`), mid-import write error (`deletes nothing when an upsert fails`), external image URL (`does not touch storage`), storage failure (`still succeeds`), unreachable server (`session.test.ts` plus the Task 4 Step 6 manual check).
