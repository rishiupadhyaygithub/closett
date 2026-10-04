import { useState, useEffect, useCallback } from 'react';
import { Category, Item, SortOption, ColorRule, UserProfile } from './types';
import {
  getAllCategories,
  getAllItems,
  addCategory,
  deleteCategory,
  addItem,
  updateItem,
  deleteItem,
  exportData,
  importData,
  getColorRules,
  saveColorRules,
  getUserProfile,
  saveUserProfile,
  getUserProfileRemote,
} from './db';
import { supabase } from './lib/supabase';
import { ensureSession } from './lib/session';
import { runAction } from './lib/actions';
import type { User } from '@supabase/supabase-js';
import ItemCard from './components/ItemCard';
import AddItemModal from './components/AddItemModal';
import ClosetView from './components/ClosetView';
import ColorRulesSettings from './components/ColorRulesSettings';
import OnboardingModal from './components/OnboardingModal';
import StyleProfileView from './components/StyleProfileView';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryToAddChildTo, setCategoryToAddChildTo] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeView, setActiveView] = useState<'grid' | 'closet' | 'style'>('grid');
  const [showColorRulesSettings, setShowColorRulesSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  // Shows if profile is missing OR missing undertone (added later — forces re-onboarding for existing users)
  const [showOnboarding, setShowOnboarding] = useState(() => !getUserProfile());

  const handleOnboardingComplete = (profile: UserProfile) => {
    saveUserProfile(profile);
    setUserProfile(profile);
    setShowOnboarding(false);
  };

  // Auth listener — no login screen; auto sign-in anonymously
  useEffect(() => {
    const start = async () => {
      const { user: u, error } = await ensureSession(supabase);
      setUser(u);
      if (error) setErrorMsg(error);
      setAuthLoading(false);
    };
    start();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setCategories([]); setItems([]); setColorRules([]);
      }
      // loadData + profile sync handled by useEffect([user]) below
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [cats, its, rules] = await Promise.all([getAllCategories(), getAllItems(), getColorRules()]);
      setCategories(cats);
      setItems(its);
      setColorRules(rules);
    } catch (err) {
      console.error('loadData failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Could not load your closet.');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
    getUserProfileRemote().then(p => {
      if (p) { saveUserProfile(p); setUserProfile(p); setShowOnboarding(false); }
    }).catch(() => {});
  }, [user, loadData]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      order: categories.length,
      parentId: categoryToAddChildTo,
    };
    await addCategory(newCategory);
    setNewCategoryName('');
    setShowAddCategory(false);
    setCategoryToAddChildTo(null);
    if (categoryToAddChildTo) {
      setOpenCategories(prev => new Set(prev).add(categoryToAddChildTo));
    }
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items will be moved to Uncategorized.')) return;
    await deleteCategory(id); // db.ts already migrates items internally
    if (selectedCategory === id) setSelectedCategory(null);
    await loadData();
  };

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

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await runAction(async () => { await deleteItem(id); await loadData(); }, setErrorMsg);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    const success = await importData(importText.trim());
    if (success) {
      setShowImportModal(false);
      setImportText('');
      loadData();
    } else {
      alert('Failed to import. Please check the file format.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Read the file but skip putting the raw GIANT text into the screen/textarea 
    // to prevent the browser from freezing.
    try {
      const text = await file.text();
      const success = await importData(text);
      if (success) {
        setShowImportModal(false);
        setImportText('');
        loadData();
        alert('Backup imported successfully!');
      } else {
        alert('Failed to import. Please check if the file is correctly formatted.');
      }
    } catch(err) {
      console.error(err);
      alert('Error reading file.');
    }
  };

  const getDescendantIds = (catId: string): string[] => {
    const children = categories.filter(c => c.parentId === catId);
    let ids = children.map(c => c.id);
    children.forEach(c => {
      ids = ids.concat(getDescendantIds(c.id));
    });
    return ids;
  };

  const toggleCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCategoryItemCount = (catId: string) => {
    const allIds = [catId, ...getDescendantIds(catId)];
    return items.filter(i => allIds.includes(i.categoryId)).length;
  };

  const renderCategoryTree = (parentId: string | null = null, depth: number = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    return children.sort((a,b) => a.order - b.order).map(cat => {
      const hasChildren = categories.some(c => c.parentId === cat.id);
      const isExpanded = openCategories.has(cat.id);
      
      return (
        <div key={cat.id} className="nav-item-tree" style={{ marginLeft: `${depth > 0 ? 0.75 : 0}rem` }}>
          <div className="nav-item-group-row">
             {hasChildren ? (
                <button 
                  className="tree-toggle" 
                  onClick={(e) => toggleCategory(cat.id, e)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
             ) : (
                <span className="tree-toggle-placeholder" />
             )}
             <button
               className={`nav-item tree-nav-item ${selectedCategory === cat.id ? 'nav-item--active' : ''}`}
               onClick={() => setSelectedCategory(cat.id)}
             >
                <div className="nav-item-content">
                  <span className="nav-item-icon">{depth === 0 ? '◇' : '↳'}</span>
                  <span className="nav-item-label">{cat.name}</span>
                </div>
                <span className="nav-item-count">{getCategoryItemCount(cat.id)}</span>
             </button>
             <div className="nav-item-actions">
               {cat.id !== 'uncategorized' && (
                 <>
                   <button onClick={() => { setCategoryToAddChildTo(cat.id); setShowAddCategory(true); }} className="tree-action-btn" title="Add sub-collection">+</button>
                   <button onClick={() => handleDeleteCategory(cat.id)} className="tree-action-btn" title="Delete">×</button>
                 </>
               )}
             </div>
          </div>
          {isExpanded && hasChildren && (
             <div className="tree-children">
               {renderCategoryTree(cat.id, depth + 1)}
             </div>
          )}
        </div>
      );
    });
  };

  const filteredAndSortedItems = () => {
    let result = [...items];

    if (selectedCategory) {
      if (selectedCategory === 'uncategorized') {
        result = result.filter(item => item.categoryId === 'uncategorized');
      } else {
        const allIds = [selectedCategory, ...getDescendantIds(selectedCategory)];
        result = result.filter(item => allIds.includes(item.categoryId));
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest': result.sort((a, b) => b.createdAt - a.createdAt); break;
      case 'oldest': result.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'priceAsc': result.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': result.sort((a, b) => b.price - a.price); break;
      case 'nameAsc': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'nameDesc': result.sort((a, b) => b.title.localeCompare(a.title)); break;
    }

    return result;
  };

  const displayItems = filteredAndSortedItems();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-muted)', fontFamily: 'Playfair Display, serif', fontSize: 20 }}>
        ✦ Closett
      </div>
    );
  }

  return (
    <div className="app-shell">
      {errorMsg && (
        <div className="error-banner" role="alert">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">Closett</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">Collections</p>
          <button
            onClick={() => { setActiveView('style'); setSelectedCategory(null); }}
            className={`nav-item ${activeView === 'style' ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item-icon">◈</span>
            <span>My Style</span>
          </button>
          <button
            onClick={() => { setActiveView('grid'); setSelectedCategory(null); }}
            className={`nav-item ${activeView === 'grid' && selectedCategory === null ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item-icon">◈</span>
            <span>All Pieces</span>
            <span className="nav-item-count">{items.length}</span>
          </button>

          {renderCategoryTree(null)}

          {/* Add root category inline */}
          <div className="add-category-section">
            {showAddCategory ? (
              <div className="add-category-form">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder={categoryToAddChildTo ? "Sub-collection name…" : "Collection name…"}
                  className="add-category-input"
                  autoFocus
                />
                <div className="add-category-actions">
                  <button onClick={handleAddCategory} className="btn-confirm">✓</button>
                  <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setCategoryToAddChildTo(null); }} className="btn-cancel">✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setCategoryToAddChildTo(null); setShowAddCategory(true); }} className="btn-add-category">
                + Root Collection
              </button>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => setShowOnboarding(true)} className="footer-btn footer-btn--profile" title="Edit your profile">
            {userProfile ? (
              <>◈ {userProfile.skinTone.charAt(0).toUpperCase() + userProfile.skinTone.slice(1)} · {userProfile.undertone}</>
            ) : '◈ My Profile'}
          </button>
          <button onClick={() => setShowColorRulesSettings(true)} className="footer-btn" title="Color Settings">
            ⚙️ Rules
          </button>
          <button onClick={handleExport} className="footer-btn" title="Export backup">
            ↓ Export
          </button>
          <button onClick={() => setShowImportModal(true)} className="footer-btn" title="Import backup">
            ↑ Import
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeView === 'style'
                ? 'My Style'
                : activeView === 'closet'
                ? 'Closet Matcher'
                : selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name ?? 'Collection'
                : 'All Pieces'}
            </h1>
            {activeView === 'grid' && (
              <span className="page-subtitle">{displayItems.length} item{displayItems.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="header-right">
            {activeView !== 'style' && (
              <div className="view-toggle">
                <button
                  className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveView('grid')}
                >
                  ⊞ Grid
                </button>
                <button
                  className={`view-btn ${activeView === 'closet' ? 'active' : ''}`}
                  onClick={() => setActiveView('closet')}
                >
                  ✦ Closet
                </button>
              </div>
            )}
            {activeView === 'grid' && (
              <>
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search pieces…"
                    className="search-input"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="sort-select"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="priceAsc">Price ↑</option>
                  <option value="priceDesc">Price ↓</option>
                  <option value="nameAsc">Name A–Z</option>
                  <option value="nameDesc">Name Z–A</option>
                </select>
              </>
            )}
            <button
              onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }}
              className="btn-add-item"
            >
              + Add Piece
            </button>
          </div>
        </header>

        {/* Content Area */}
        {activeView === 'style' ? (
          <div className="items-grid" style={{ display: 'block', padding: '28px 32px' }}>
            <StyleProfileView
              userProfile={userProfile}
              onEditProfile={() => setShowOnboarding(true)}
            />
          </div>
        ) : activeView === 'closet' ? (
          <ClosetView
            items={displayItems}
            colorRules={colorRules}
            getCategoryName={(id) => categories.find(c => c.id === id)?.name || 'Uncategorized'}
            onEditItem={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
            onDeleteItem={handleDeleteItem}
            userProfile={userProfile}
          />
        ) : displayItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <p className="empty-title">
              {searchQuery ? 'No pieces match your search.' : 'Your wardrobe is empty.'}
            </p>
            <p className="empty-sub">
              {searchQuery ? 'Try a different search term.' : 'Click "+ Add Piece" to start building your collection.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                className="btn-add-item mt-4"
              >
                + Add First Piece
              </button>
            )}
          </div>
        ) : (
          <div className="items-grid">
            {displayItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                categoryName={categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                onEdit={() => { setEditingItem(item); setIsAddModalOpen(true); }}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        categories={categories}
        editingItem={editingItem}
        colorRules={colorRules}
        userProfile={userProfile}
      />

      <ColorRulesSettings
        isOpen={showColorRulesSettings}
        onClose={() => setShowColorRulesSettings(false)}
        rules={colorRules}
        onSave={async (rules) => {
          await runAction(async () => { await saveColorRules(rules); await loadData(); }, setErrorMsg);
        }}
      />

      {/* ── Onboarding ── */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => { setShowImportModal(false); setImportText(''); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Import Backup</h2>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setImportText(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <label className="field-label">Upload .json file</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="file-input"
              />
              <label className="field-label mt">Or paste JSON directly</label>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='{"categories": [...], "items": [...]}'
                rows={6}
                className="text-area"
              />
              <p className="warning-text">⚠️ This will replace all current data. Export first if needed.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="btn-ghost">Cancel</button>
              <button onClick={handleImport} disabled={!importText.trim()} className="btn-primary">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
