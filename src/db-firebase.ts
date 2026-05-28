import { Category, Item } from './types';
import { db, collection, doc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot } from './firebase';

const CATEGORIES_COLLECTION = 'categories';
const ITEMS_COLLECTION = 'items';

// Local cache for faster reads
let categoriesCache: Category[] | null = null;
let itemsCache: Item[] | null = null;

// Initialize - add default category if none exist
export async function initDB(): Promise<void> {
  if (categoriesCache && itemsCache) return;
  
  const cats = await getAllCategories();
  if (cats.length === 0) {
    const defaultCategory: Category = {
      id: 'uncategorized',
      name: 'Uncategorized',
      order: 0,
      parentId: null,
    };
    await addCategory(defaultCategory);
  }
}

export async function getAllCategories(): Promise<Category[]> {
  if (categoriesCache) return [...categoriesCache];
  
  const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
  const categories: Category[] = [];
  snapshot.forEach((doc) => {
    categories.push(doc.data() as Category);
  });
  categoriesCache = categories.sort((a, b) => a.order - b.order);
  return [...categoriesCache];
}

export async function addCategory(category: Category): Promise<void> {
  await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), category);
  categoriesCache = null; // Invalidate cache
}

export async function updateCategory(category: Category): Promise<void> {
  const { id, ...data } = category;
  await updateDoc(doc(db, CATEGORIES_COLLECTION, id), data as any);
  categoriesCache = null;
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  
  // Move items to uncategorized
  const items = await getAllItems();
  const uncategorizedId = 'uncategorized';
  for (const item of items) {
    if (item.categoryId === id) {
      await updateItem({ ...item, categoryId: uncategorizedId });
    }
  }
  categoriesCache = null;
}

export async function getAllItems(): Promise<Item[]> {
  if (itemsCache) return [...itemsCache];
  
  const snapshot = await getDocs(collection(db, ITEMS_COLLECTION));
  const items: Item[] = [];
  snapshot.forEach((doc) => {
    items.push(doc.data() as Item);
  });
  itemsCache = items;
  return [...itemsCache];
}

export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const items = await getAllItems();
  return items.filter(item => item.categoryId === categoryId);
}

export async function addItem(item: Item): Promise<void> {
  await setDoc(doc(db, ITEMS_COLLECTION, item.id), item);
  itemsCache = null;
}

export async function updateItem(item: Item): Promise<void> {
  const { id, ...data } = item;
  await updateDoc(doc(db, ITEMS_COLLECTION, id), data as any);
  itemsCache = null;
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, ITEMS_COLLECTION, id));
  itemsCache = null;
}

// Real-time listeners
export function subscribeToCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(collection(db, CATEGORIES_COLLECTION), (snapshot) => {
    const categories: Category[] = [];
    snapshot.forEach((doc) => {
      categories.push(doc.data() as Category);
    });
    categoriesCache = categories.sort((a, b) => a.order - b.order);
    callback([...categoriesCache]);
  });
}

export function subscribeToItems(callback: (items: Item[]) => void) {
  return onSnapshot(collection(db, ITEMS_COLLECTION), (snapshot) => {
    const items: Item[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as Item);
    });
    itemsCache = items;
    callback([...itemsCache]);
  });
}

// Export/Import for backup (uses JSON files)
export async function exportData(): Promise<string> {
  const categories = await getAllCategories();
  const items = await getAllItems();
  return JSON.stringify({ categories, items }, null, 2);
}

export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (data.categories && data.items) {
      // Clear existing
      const existingCats = await getAllCategories();
      const existingItems = await getAllItems();
      for (const cat of existingCats) {
        await deleteDoc(doc(db, CATEGORIES_COLLECTION, cat.id));
      }
      for (const item of existingItems) {
        await deleteDoc(doc(db, ITEMS_COLLECTION, item.id));
      }
      
      // Import new
      for (const cat of data.categories) {
        await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat);
      }
      for (const item of data.items) {
        await setDoc(doc(db, ITEMS_COLLECTION, item.id), item);
      }
      
      categoriesCache = null;
      itemsCache = null;
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}
