import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  saveUserProfileRemote,
} from './db';
import { supabase } from './lib/supabase';
import { ensureSession } from './lib/session';
import { runAction } from './lib/actions';
import { parsePrefill, type Prefill } from './lib/bookmarklet';
import { filterAndSortItems, categoryCounts, descendantIds } from './lib/items';
import { decideProfileSync } from './lib/profileSync';
import type { User } from '@supabase/supabase-js';
import ItemCard from './components/ItemCard';
import AddItemModal from './components/AddItemModal';
import ClosetView from './components/ClosetView';
import ColorRulesSettings from './components/ColorRulesSettings';
import OnboardingModal from './components/OnboardingModal';
import ImportModal from './components/ImportModal';
import { saveLastBackup, loadLastBackup } from './lib/backup';
import StyleProfileView from './components/StyleProfileView';
import RecoveryScreen from './components/RecoveryScreen';
import { keepSameUser } from './lib/authUser';
import { saveAutoBackup, loadAutoBackup, clearAutoBackup } from './lib/autoBackup';
import Sidebar, { type View } from './components/Sidebar';
import MainHeader from './components/MainHeader';
import MergeOfferModal from './components/MergeOfferModal';
import AccountModal, { type AccountMode } from './components/AccountModal';
import { accountStatus, saveClosetWithEmail, sendSignInLink } from './lib/account';
import { savePendingMerge, takePendingMerge, type PendingMerge } from './lib/pendingMerge';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // This browser's sign-in points at a closet that no longer exists: ask before starting over
  const [lostSession, setLostSession] = useState(false);
  const [recovering, setRecovering] = useState(false);
  // True after the user deliberately signed out of a saved closet (the recovery screen then says "Signed out")
  const signedOutOnPurpose = useRef(false);
  const [accountMode, setAccountMode] = useState<AccountMode | null>(null);
  // Pieces from this browser waiting to be added to the saved closet the user just signed in to
  const [mergeOffer, setMergeOffer] = useState<PendingMerge | null>(null);
  // Auth events are ignored until the stored sign-in has been checked with the server, so a dead account never loads or writes data
  const sessionChecked = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const flash = useCallback((msg: string) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Product data from the "Add to Closett" bookmarklet arrives in the URL query
  const [prefill, setPrefill] = useState<Prefill | null>(() => parsePrefill(window.location.search));
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeView, setActiveView] = useState<View>('grid');
  const [showColorRulesSettings, setShowColorRulesSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  // Shows if profile is missing OR missing undertone (added later — forces re-onboarding for existing users)
  const [showOnboarding, setShowOnboarding] = useState(() => !getUserProfile());

  const handleOnboardingComplete = (profile: UserProfile) => {
    saveUserProfile(profile);
    setUserProfile(profile);
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (!prefill) return;
    setIsAddModalOpen(true);
    window.history.replaceState(null, '', window.location.pathname); // keep the product link out of the address bar
  }, []);

  // Auth listener — no login screen; auto sign-in anonymously
  useEffect(() => {
    const start = async () => {
      const { user: u, error, lostSession: lost } = await ensureSession(supabase);
      setUser(prev => keepSameUser(prev, u));
      if (lost) setLostSession(true);
      if (error) setErrorMsg(error);
      sessionChecked.current = true;
      setAuthLoading(false);
    };
    start();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!sessionChecked.current) return;
      const u = session?.user ?? null;
      // The same sign-in is re-announced every time the tab becomes visible; only a different account should reload data
      setUser(prev => keepSameUser(prev, u));
      setAuthLoading(false);
      if (!u) {
        setCategories([]); setItems([]); setColorRules([]);
        if (event === 'SIGNED_OUT') setLostSession(true);
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
      saveAutoBackup({ categories: cats, items: its, colorRules: rules });
    } catch (err) {
      console.error('loadData failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Could not load your closet.');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
    const offer = takePendingMerge(user.id);
    if (offer) setMergeOffer(offer);
    getUserProfileRemote().then(remote => {
      const local = getUserProfile();
      const action = decideProfileSync(local, remote);
      if (action === 'use-remote' && remote) { saveUserProfile(remote); setUserProfile(remote); setShowOnboarding(false); }
      else if (action === 'push-local' && local) saveUserProfileRemote(local).catch(err => console.error('profile sync failed:', err));
    }).catch(() => {});
  }, [user, loadData]);

  const handleAddCategory = async (name: string, parentId: string | null): Promise<boolean> => {
    const newCategory: Category = { id: crypto.randomUUID(), name, order: categories.length, parentId };
    const ok = await runAction(async () => {
      await addCategory(newCategory);
      await loadData();
      return true;
    }, setErrorMsg);
    return ok === true;
  };

  const handleAccountSubmit = async (email: string) => {
    const redirect = window.location.origin;
    if (accountMode === 'save') {
      const r = await saveClosetWithEmail(supabase, email, redirect);
      if (r.ok) {
        const { data } = await supabase.auth.getUser();
        if (data.user) setUser(prev => keepSameUser(prev, data.user));
      }
      return r;
    }
    // Signing in from a closet that has its own pieces: remember them so they can be merged afterwards
    if (user && user.is_anonymous && items.length > 0) {
      savePendingMerge({ fromUserId: user.id, json: JSON.stringify({ categories, items, colorRules }), itemCount: items.length });
    }
    return sendSignInLink(supabase, email, redirect);
  };

  const handleSignOut = async () => {
    if (!confirm('Sign out on this browser? Your saved closet stays safe; sign in again with your email any time.')) return;
    signedOutOnPurpose.current = true;
    clearAutoBackup();
    await supabase.auth.signOut({ scope: 'local' });
  };

  const handleMerge = async (offer: PendingMerge) => {
    setMergeOffer(null);
    const ok = await importData(offer.json, { mode: 'merge' });
    if (ok) { await loadData(); flash(`Added ${offer.itemCount} piece${offer.itemCount !== 1 ? 's' : ''} from this browser`); }
    else setErrorMsg('Could not add the pieces from this browser. They are still in the backup file you can export from the old closet.');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items will be moved to Uncategorized.')) return;
    const ok = await runAction(async () => {
      await deleteCategory(id); // db.ts already migrates items internally
      await loadData();
      return true;
    }, setErrorMsg);
    if (ok && selectedCategory === id) setSelectedCategory(null);
  };

  const handleSaveItem = async (item: Item) => {
    const ok = await runAction(async () => {
      if (editingItem) await updateItem(item); else await addItem(item);
      await loadData();
      return true;
    }, setErrorMsg);
    if (!ok) return false;
    setEditingItem(null);
    setIsAddModalOpen(false);
    flash('Saved');
    return true;
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const ok = await runAction(async () => { await deleteItem(id); await loadData(); return true; }, setErrorMsg);
    if (ok) flash('Deleted');
  };

  const handleExport = async () => {
    const data = await runAction(exportData, setErrorMsg);
    if (data === undefined) return;
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

  // Importing replaces the closet, so keep a copy of the current one first
  const backupBeforeImport = async () => {
    try { saveLastBackup(await exportData()); } catch { /* offline: the import itself will fail too */ }
  };

  const finishImport = async (text: string) => {
    await backupBeforeImport();
    const success = await importData(text);
    if (success) {
      setShowImportModal(false);
      setImportText('');
      await loadData();
      flash('Backup imported');
    } else {
      setErrorMsg('That backup could not be imported. Your closet was not changed. Check that it is a Closett export.');
    }
  };

  const handleImport = () => { if (importText.trim()) void finishImport(importText.trim()); };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await finishImport(await file.text());
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not read that file.');
    }
  };

  const handleRestoreBackup = async () => {
    const backup = loadLastBackup();
    if (!backup) return;
    if (!confirm('Replace your current closet with the copy saved before the last import?')) return;
    const ok = await importData(backup);
    if (ok) { setShowImportModal(false); await loadData(); flash('Previous closet restored'); }
    else setErrorMsg('Could not restore the backup.');
  };

  // Lost session: start a new anonymous closet, then optionally fill it from a backup
  const recoverInto = async (backupJson: string | null) => {
    setRecovering(true);
    try {
      const { user: u, error } = await ensureSession(supabase);
      if (!u) { setErrorMsg(error ?? 'Could not start a new closet.'); return; }
      setUser(u);
      setLostSession(false);
      if (backupJson) {
        if (await importData(backupJson)) { await loadData(); flash('Closet restored'); }
        else setErrorMsg('That backup could not be restored. Your new closet is empty; try another backup file.');
      }
    } finally {
      setRecovering(false);
    }
  };

  const handleRecoveryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await recoverInto(await file.text()); }
    catch { setErrorMsg('Could not read that file.'); }
  };


  const counts = useMemo(() => categoryCounts(categories, items), [categories, items]);

  const categoryIds = useMemo(
    () => (selectedCategory ? [selectedCategory, ...descendantIds(categories, selectedCategory)] : null),
    [selectedCategory, categories],
  );
  const displayItems = useMemo(
    () => filterAndSortItems(items, { categoryIds, query: searchQuery, sortBy }),
    [items, categoryIds, searchQuery, sortBy],
  );

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-muted)', fontFamily: 'Playfair Display, serif', fontSize: 20 }}>
        ✦ Closett
      </div>
    );
  }

  if (lostSession && !user) {
    const autoBackup = loadAutoBackup();
    return (
      <div className="app-shell">
        {errorMsg && (
          <div className="error-banner" role="alert">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} aria-label="Dismiss">✕</button>
          </div>
        )}
        <RecoveryScreen
          variant={signedOutOnPurpose.current ? 'signedOut' : 'lost'}
          onSignIn={() => setAccountMode('signin')}
          backup={autoBackup}
          busy={recovering}
          onRestoreBackup={() => autoBackup && recoverInto(autoBackup.json)}
          onRestoreFile={handleRecoveryFile}
          onStartFresh={() => { signedOutOnPurpose.current = false; recoverInto(null); }}
        />
        {accountMode && (
          <AccountModal mode="signin" localItemCount={0} onSubmit={email => sendSignInLink(supabase, email, window.location.origin)} onClose={() => setAccountMode(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {notice && <div className="notice-banner" role="status">{notice}</div>}
      {errorMsg && (
        <div className="error-banner" role="alert">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
        totalItems={items.length}
        counts={counts}
        selectedCategory={selectedCategory}
        activeView={activeView}
        onSelectCategory={setSelectedCategory}
        onSelectView={setActiveView}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        userProfile={userProfile}
        onEditProfile={() => setShowOnboarding(true)}
        onOpenRules={() => setShowColorRulesSettings(true)}
        onExport={handleExport}
        onOpenImport={() => setShowImportModal(true)}
        account={accountStatus(user)}
        onSaveCloset={() => setAccountMode('save')}
        onSignIn={() => setAccountMode('signin')}
        onSignOut={handleSignOut}
      />

      {/* ── Main Content ── */}
      <main className="main-content">
        <MainHeader
          title={activeView === 'style' ? 'My Style'
            : activeView === 'closet' ? 'Closet Matcher'
            : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name ?? 'Collection'
            : 'All Pieces'}
          activeView={activeView}
          itemCount={displayItems.length}
          searchQuery={searchQuery}
          sortBy={sortBy}
          onOpenMenu={() => setSidebarOpen(true)}
          onSelectView={setActiveView}
          onSearch={setSearchQuery}
          onSort={setSortBy}
          onAddPiece={() => { setEditingItem(null); setIsAddModalOpen(true); }}
        />

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
                key={item.id} item={item} userProfile={userProfile}
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
        prefill={prefill}
        onPrefillUsed={() => setPrefill(null)}
      />

      <ColorRulesSettings
        isOpen={showColorRulesSettings}
        onClose={() => setShowColorRulesSettings(false)}
        rules={colorRules}
        onSave={async (rules) => {
          await runAction(async () => { await saveColorRules(rules); await loadData(); }, setErrorMsg);
        }}
      />

      {accountMode && (
        <AccountModal mode={accountMode} localItemCount={items.length} onSubmit={handleAccountSubmit} onClose={() => setAccountMode(null)} />
      )}

      {mergeOffer && (
        <MergeOfferModal itemCount={mergeOffer.itemCount} onMerge={() => handleMerge(mergeOffer)} onDiscard={() => setMergeOffer(null)} />
      )}

      {/* ── Onboarding ── */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          initial={userProfile ?? undefined}
          onCancel={userProfile ? () => setShowOnboarding(false) : undefined}
        />
      )}

      {showImportModal && (
        <ImportModal
          text={importText}
          onTextChange={setImportText}
          onClose={() => { setShowImportModal(false); setImportText(''); }}
          onFile={handleImportFile}
          onImport={handleImport}
          canRestore={loadLastBackup() !== null}
          onRestore={handleRestoreBackup}
        />
      )}
    </div>
  );
}

export default App;
