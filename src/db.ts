import { Category, Item, ColorRule, UserProfile } from './types';
import { DEFAULT_COLOR_RULES } from './colorData';
import { supabase, uploadImage } from './lib/supabase';

// ── helpers ───────────────────────────────────────────────────────────────

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

export function must<T extends { error: { message: string } | null }>(res: T, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res;
}

export function storagePathFromUrl(url: string): string | null {
  const marker = '/item-images/';
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

function rowToCategory(row: any): Category {
  return { id: row.id, name: row.name, order: row.sort_order, parentId: row.parent_id };
}

function rowToItem(row: any): Item {
  return {
    id: row.id, image: row.image, title: row.title,
    price: row.price, currency: row.currency, link: row.link,
    notes: row.notes, categoryId: row.category_id,
    createdAt: row.created_at, color: row.color, garmentType: row.garment_type,
  };
}

function rowToColorRule(row: any): ColorRule {
  return { id: row.id, topColor: row.top_color, bottomColors: row.bottom_colors };
}

// ── Categories ────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from('categories').select('*').eq('user_id', uid).order('sort_order');
  if (error) throw error;
  const cats = (data || []).map(rowToCategory);
  if (!cats.find(c => c.id === 'uncategorized')) {
    await addCategory({ id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null });
    cats.unshift({ id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null });
  }
  return cats;
}

export async function addCategory(category: Category): Promise<void> {
  const uid = await currentUserId();
  must(await supabase.from('categories').upsert({
    id: category.id, user_id: uid,
    name: category.name, sort_order: category.order, parent_id: category.parentId,
  }, { onConflict: 'user_id,id' }), 'save category');
}

export async function updateCategory(category: Category): Promise<void> {
  await addCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  const uid = await currentUserId();
  const { data: cats } = await supabase.from('categories').select('*').eq('user_id', uid);
  const allCats = (cats || []).map(rowToCategory);

  const toDelete = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const c of allCats) {
      if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
        toDelete.add(c.id); added = true;
      }
    }
  }

  // Move items to uncategorized
  must(await supabase.from('items')
    .update({ category_id: 'uncategorized' })
    .eq('user_id', uid)
    .in('category_id', Array.from(toDelete)), 'move items to uncategorized');

  must(await supabase.from('categories').delete().eq('user_id', uid).in('id', Array.from(toDelete)), 'delete category');
}

// ── Items ─────────────────────────────────────────────────────────────────

export async function getAllItems(): Promise<Item[]> {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from('items').select('*').eq('user_id', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToItem);
}

export async function addItem(item: Item): Promise<void> {
  const uid = await currentUserId();
  let imageUrl = item.image;
  if (imageUrl.startsWith('data:')) {
    imageUrl = await uploadImage(uid, item.id, imageUrl);
  }
  must(await supabase.from('items').insert({
    id: item.id, user_id: uid, image: imageUrl,
    title: item.title, price: item.price, currency: item.currency,
    link: item.link, notes: item.notes, category_id: item.categoryId,
    created_at: item.createdAt, color: item.color, garment_type: item.garmentType,
  }), 'insert item');
}

export async function updateItem(item: Item): Promise<void> {
  const uid = await currentUserId();
  let imageUrl = item.image;
  if (imageUrl.startsWith('data:')) {
    imageUrl = await uploadImage(uid, item.id, imageUrl);
  }
  must(await supabase.from('items').update({
    image: imageUrl, title: item.title, price: item.price, currency: item.currency,
    link: item.link, notes: item.notes, category_id: item.categoryId,
    color: item.color, garment_type: item.garmentType,
  }).eq('id', item.id).eq('user_id', uid), 'update item');
}

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

export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const items = await getAllItems();
  return items.filter(i => i.categoryId === categoryId);
}

// ── Color Rules ───────────────────────────────────────────────────────────

export async function getColorRules(): Promise<ColorRule[]> {
  const uid = await currentUserId();
  const { data } = await supabase.from('color_rules').select('*').eq('user_id', uid);
  if (!data || data.length === 0) {
    await saveColorRules(DEFAULT_COLOR_RULES);
    return DEFAULT_COLOR_RULES;
  }
  return data.map(rowToColorRule);
}

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

// ── User Profile ──────────────────────────────────────────────────────────

export async function getUserProfileRemote(): Promise<UserProfile | null> {
  const uid = await currentUserId().catch(() => null);
  if (!uid) return null;
  const { data } = await supabase.from('user_profiles').select('*').eq('id', uid).maybeSingle();
  if (!data) return null;
  if (!data.gender || !data.skin_tone || !data.body_type || !data.undertone) return null;
  return {
    gender: data.gender,
    skinTone: data.skin_tone,
    undertone: data.undertone,
    bodyType: data.body_type,
  };
}

export async function saveUserProfileRemote(profile: UserProfile): Promise<void> {
  const uid = await currentUserId();
  must(await supabase.from('user_profiles').upsert({
    id: uid,
    gender: profile.gender,
    skin_tone: profile.skinTone,
    undertone: profile.undertone,
    body_type: profile.bodyType,
    updated_at: new Date().toISOString(),
  }), 'save profile');
}

// Keep local fallback for profile (fast reads)
const PROFILE_KEY = 'closett-user-profile';

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<UserProfile>;
    // Require all fields including undertone — missing undertone forces re-onboarding
    if (!p.gender || !p.skinTone || !p.undertone || !p.bodyType) return null;
    return p as UserProfile;
  } catch { return null; }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  saveUserProfileRemote(profile).catch(console.error);
}

// ── Export / Import ───────────────────────────────────────────────────────

export async function exportData(): Promise<string> {
  const [categories, items, colorRules] = await Promise.all([
    getAllCategories(), getAllItems(), getColorRules(),
  ]);
  return JSON.stringify({ categories, items, colorRules }, null, 2);
}

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
