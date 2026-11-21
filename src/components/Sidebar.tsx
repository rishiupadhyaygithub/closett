import { useState } from 'react';
import type { Category, UserProfile } from '../types';
import type { AccountStatus } from '../lib/account';

export type View = 'grid' | 'closet' | 'style';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  totalItems: number;
  counts: Map<string, number>;
  selectedCategory: string | null;
  activeView: View;
  onSelectCategory: (id: string | null) => void;
  onSelectView: (view: View) => void;
  /** Resolves true when the collection was saved. */
  onAddCategory: (name: string, parentId: string | null) => Promise<boolean>;
  onDeleteCategory: (id: string) => void;
  userProfile: UserProfile | null;
  onEditProfile: () => void;
  onOpenRules: () => void;
  onExport: () => void;
  onOpenImport: () => void;
  account: AccountStatus;
  onSaveCloset: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Sidebar(p: SidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryToAddChildTo, setCategoryToAddChildTo] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const parentId = categoryToAddChildTo;
    if (!(await p.onAddCategory(newCategoryName.trim(), parentId))) return;
    setNewCategoryName('');
    setShowAddCategory(false);
    setCategoryToAddChildTo(null);
    if (parentId) setOpenCategories(prev => new Set(prev).add(parentId));
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

  const renderCategoryTree = (parentId: string | null = null, depth: number = 0): JSX.Element[] => {
    const children = p.categories.filter(c => c.parentId === parentId);
    return children.sort((a, b) => a.order - b.order).map(cat => {
      const hasChildren = p.categories.some(c => c.parentId === cat.id);
      const isExpanded = openCategories.has(cat.id);

      return (
        <div key={cat.id} className="nav-item-tree" style={{ marginLeft: `${depth > 0 ? 0.75 : 0}rem` }}>
          <div className="nav-item-group-row">
            {hasChildren ? (
              <button className="tree-toggle" onClick={e => toggleCategory(cat.id, e)}>
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="tree-toggle-placeholder" />
            )}
            <button
              className={`nav-item tree-nav-item ${p.selectedCategory === cat.id ? 'nav-item--active' : ''}`}
              onClick={() => p.onSelectCategory(cat.id)}
            >
              <div className="nav-item-content">
                <span className="nav-item-icon">{depth === 0 ? '◇' : '↳'}</span>
                <span className="nav-item-label">{cat.name}</span>
              </div>
              <span className="nav-item-count">{p.counts.get(cat.id) ?? 0}</span>
            </button>
            <div className="nav-item-actions">
              {cat.id !== 'uncategorized' && (
                <>
                  <button onClick={() => { setCategoryToAddChildTo(cat.id); setShowAddCategory(true); }} className="tree-action-btn" title="Add sub-collection">+</button>
                  <button onClick={() => p.onDeleteCategory(cat.id)} className="tree-action-btn" title="Delete">×</button>
                </>
              )}
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div className="tree-children">{renderCategoryTree(cat.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {p.open && <div className="sidebar-backdrop" onClick={p.onClose} />}
      <aside className={`sidebar ${p.open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">Closett</span>
        </div>

        <nav
          className="sidebar-nav"
          onClick={e => { if ((e.target as HTMLElement).closest('.nav-item')) p.onClose(); }}
        >
          <p className="nav-label">Collections</p>
          <button
            onClick={() => { p.onSelectView('style'); p.onSelectCategory(null); }}
            className={`nav-item ${p.activeView === 'style' ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item-icon">◈</span>
            <span>My Style</span>
          </button>
          <button
            onClick={() => { p.onSelectView('grid'); p.onSelectCategory(null); }}
            className={`nav-item ${p.activeView === 'grid' && p.selectedCategory === null ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item-icon">◈</span>
            <span>All Pieces</span>
            <span className="nav-item-count">{p.totalItems}</span>
          </button>

          {renderCategoryTree(null)}

          <div className="add-category-section">
            {showAddCategory ? (
              <div className="add-category-form">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder={categoryToAddChildTo ? 'Sub-collection name…' : 'Collection name…'}
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

        <div className="sidebar-account">
          {p.account.kind === 'saved' ? (
            <>
              <p className="account-line" title={p.account.email}>☁ Saved as {p.account.email}</p>
              <button onClick={p.onSignOut} className="footer-btn">Sign out</button>
            </>
          ) : p.account.kind === 'pending' ? (
            <p className="account-line account-line--wrap">✉ Check {p.account.email} and click the link to finish saving</p>
          ) : (
            <>
              <button onClick={p.onSaveCloset} className="footer-btn footer-btn--save">☁ Save my closet</button>
              <button onClick={p.onSignIn} className="footer-btn">Already saved? Sign in</button>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={p.onEditProfile} className="footer-btn footer-btn--profile" title="Edit your profile">
            {p.userProfile ? (
              <>◈ {p.userProfile.skinTone.charAt(0).toUpperCase() + p.userProfile.skinTone.slice(1)} · {p.userProfile.undertone}</>
            ) : '◈ My Profile'}
          </button>
          <button onClick={p.onOpenRules} className="footer-btn" title="Color Settings">⚙️ Rules</button>
          <button onClick={p.onExport} className="footer-btn" title="Export backup">↓ Export</button>
          <button onClick={p.onOpenImport} className="footer-btn" title="Import backup">↑ Import</button>
        </div>
      </aside>
    </>
  );
}
