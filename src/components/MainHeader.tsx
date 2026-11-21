import type { SortOption } from '../types';
import type { View } from './Sidebar';

interface MainHeaderProps {
  title: string;
  activeView: View;
  itemCount: number;
  searchQuery: string;
  sortBy: SortOption;
  onOpenMenu: () => void;
  onSelectView: (view: View) => void;
  onSearch: (q: string) => void;
  onSort: (s: SortOption) => void;
  onAddPiece: () => void;
}

export default function MainHeader(p: MainHeaderProps) {
  return (
    <header className="main-header">
      <div className="header-left">
        <button className="menu-btn" onClick={p.onOpenMenu} aria-label="Open menu">☰</button>
        <h1 className="page-title">{p.title}</h1>
        {p.activeView === 'grid' && (
          <span className="page-subtitle">{p.itemCount} item{p.itemCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="header-right">
        {p.activeView !== 'style' && (
          <div className="view-toggle">
            <button className={`view-btn ${p.activeView === 'grid' ? 'active' : ''}`} onClick={() => p.onSelectView('grid')}>
              ⊞ Grid
            </button>
            <button className={`view-btn ${p.activeView === 'closet' ? 'active' : ''}`} onClick={() => p.onSelectView('closet')}>
              ✦ Closet
            </button>
          </div>
        )}
        {p.activeView === 'grid' && (
          <>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                value={p.searchQuery}
                onChange={e => p.onSearch(e.target.value)}
                placeholder="Search pieces…"
                className="search-input"
              />
            </div>
            <select value={p.sortBy} onChange={e => p.onSort(e.target.value as SortOption)} className="sort-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </>
        )}
        <button onClick={p.onAddPiece} className="btn-add-item">+ Add Piece</button>
      </div>
    </header>
  );
}
