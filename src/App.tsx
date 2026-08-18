import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import { Account, Budget, BudgetItem, Category, InventoryItem, ModeType, Transaction, TransactionType } from './types';
import { DeviceFrame } from './components/DeviceFrame';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AppSettingsView } from './components/AppSettingsView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { InventoryModal } from './components/InventoryModal';
import { Toast, ToastMessage } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeMode, setActiveMode] = useState<'all' | ModeType>('all');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  // Swipe Gesture Handling across main panels
  const TABS: TabType[] = ['home', 'transactions', 'budget', 'reports', 'saya', 'settings'];
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const isSwipeDisabled = (target?: EventTarget | null): boolean => {
    if (isAddModalOpen || selectedTxDetail || document.getElementById('a4-print-section')) return true;
    
    // Check if any modal / dialog / wizard / overlay / guide is currently open in DOM
    if (document.querySelector('.fixed.inset-0, [role="dialog"], [data-no-swipe="true"]')) return true;

    // Check if touch originated inside an element that shouldn't trigger panel swipe
    if (target && target instanceof HTMLElement) {
      if (
        target.closest(
          '[data-no-swipe], .fixed, [role="dialog"], .overflow-x-auto, input, textarea, select, button, canvas, .recharts-wrapper'
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSwipeDisabled(e.target)) {
      touchStartRef.current = null;
      return;
    }
    if (e.touches && e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isSwipeDisabled(e.target)) {
      touchStartRef.current = null;
      return;
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartRef.current.x;
      const diffY = touchEndY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      // Threshold: horizontal movement > 35px and dominant over vertical scroll
      if (Math.abs(diffX) > Math.abs(diffY) * 1.1 && Math.abs(diffX) > 35 && duration < 800) {
        const currentIndex = TABS.indexOf(activeTab);
        if (diffX < 0) {
          // Slide left -> Move to next panel
          if (currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1]);
          }
        } else {
          // Slide right -> Move to previous panel
          if (currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1]);
          }
        }
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled by touch handlers
    if (isSwipeDisabled(e.target)) {
      touchStartRef.current = null;
      return;
    }
    if (e.button !== 0) return;
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled by touch handlers
    if (!touchStartRef.current || isSwipeDisabled(e.target)) {
      touchStartRef.current = null;
      return;
    }
    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    if (Math.abs(diffX) > Math.abs(diffY) * 1.1 && Math.abs(diffX) > 35 && duration < 800) {
      const currentIndex = TABS.indexOf(activeTab);
      if (diffX < 0) {
        // Slide left -> Move to next panel
        if (currentIndex < TABS.length - 1) {
          setActiveTab(TABS[currentIndex + 1]);
        }
      } else {
        // Slide right -> Move to previous panel
        if (currentIndex > 0) {
          setActiveTab(TABS[currentIndex - 1]);
        }
      }
    }
  };

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [dataEnvironment, setDataEnvironment] = useState<'real' | 'sample'>(() => db.getDataEnvironment());

  // Toast Notification State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: `toast_${Date.now()}`,
      message,
      type,
    });
  };

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSourceType, setAddSourceType] = useState<'manual' | 'receipt' | 'statement' | 'handwritten'>('manual');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // Load data on start
  const refreshData = () => {
    setAccounts(db.getAccounts());
    setCategories(db.getCategories());
    setTransactions(db.getTransactions());
    setBudgets(db.getBudgets());
    setBudgetItems(db.getBudgetItems());
    setInventoryItems(db.getInventoryItems());
  };

  useEffect(() => {
    db.initDatabase();
    refreshData();
  }, []);

  const handleToggleDataEnvironment = (env: 'real' | 'sample') => {
    db.setDataEnvironment(env);
    setDataEnvironment(env);
    refreshData();
    if (env === 'real') {
      showToast(
        language === 'id'
          ? '🟢 Mode Asli Aktif: Menampilkan data & catatan transaksi asli Anda.'
          : '🟢 Real Mode Active: Displaying your real transactions and financial data.',
        'success'
      );
    } else {
      showToast(
        language === 'id'
          ? '🟡 Mode Simulasi Aktif: Menampilkan simulasi contoh rencana anggaran & data transaksi pembelajaran.'
          : '🟡 Simulation Mode Active: Displaying simulated sample budgets & learning transactions.',
        'info'
      );
    }
  };

  const handleOpenAddModal = (sourceType: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice' = 'manual') => {
    setAddSourceType(sourceType);
    setIsAddModalOpen(true);
  };

  const handleSaveSingleTransaction = (tx: {
    amount: number;
    description: string;
    date: string;
    account_id: string;
    category_id: string;
    mode: ModeType;
    type: TransactionType;
    source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
    voice_transcript?: string;
    attachment_path?: string;
  }) => {
    db.addTransaction(tx);
    refreshData();
    showToast(`Transaksi "${tx.description.split('\n')[0]}" berhasil disimpan!`);
  };

  const handleSaveMultipleTransactions = (
    txs: {
      amount: number;
      description: string;
      date: string;
      account_id: string;
      category_id: string;
      mode: ModeType;
      type: TransactionType;
      source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
      voice_transcript?: string;
      attachment_path?: string;
    }[]
  ) => {
    db.addMultipleTransactions(txs);
    refreshData();
    showToast(`${txs.length} item transaksi berhasil disimpan!`);
  };

  const handleDeleteTransaction = (id: string) => {
    db.deleteTransaction(id);
    refreshData();
    showToast('Transaksi telah dihapus', 'info');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    db.updateTransaction(updatedTx);
    refreshData();
    setSelectedTxDetail(updatedTx);
    showToast(`Data transaksi "${updatedTx.description.split('\n')[0]}" berhasil diperbarui!`, 'success');
  };

  const handleSaveAccount = (acc: Account) => {
    db.saveAccount(acc);
    refreshData();
    showToast(`Akun "${acc.name}" berhasil disimpan!`);
  };

  const handleDeleteAccount = (id: string) => {
    db.deleteAccount(id);
    refreshData();
    showToast('Akun telah dihapus', 'info');
  };

  const handleSaveCategory = (cat: Category) => {
    db.saveCategory(cat);
    refreshData();
  };

  const handleCreateBudget = (
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => {
    db.createBudget(budget, items);
    refreshData();
    showToast(`Anggaran "${budget.name}" berhasil dibuat!`);
  };

  const handleUpdateBudget = (
    id: string,
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => {
    db.updateBudget(id, budget, items);
    refreshData();
    showToast(`Anggaran "${budget.name}" berhasil diperbarui!`, 'success');
  };

  const handleUpdateBudgetItem = (item: BudgetItem) => {
    db.updateBudgetItem(item);
    refreshData();
    showToast(`Pengingat item anggaran berhasil diperbarui!`, 'success');
  };

  const handleDeleteBudget = (id: string) => {
    db.deleteBudget(id);
    refreshData();
    showToast('Anggaran telah dihapus', 'info');
  };

  const handleResetData = () => {
    db.initDatabase(true);
    refreshData();
    showToast('Data sampel berhasil direset', 'info');
  };

  return (
    <DeviceFrame activeMode={activeMode}>
      {/* Toast Notification Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* App Top Header Bar */}
      <Header
        activeMode={activeMode}
        onModeChange={(mode) => setActiveMode(mode)}
        dataEnvironment={dataEnvironment}
        onDataEnvironmentChange={handleToggleDataEnvironment}
      />

      {/* Main View Router with Horizontal Swipe Gesture Support */}
      <div
        className="flex-1 overflow-y-auto touch-pan-y transition-all duration-300 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div key={activeTab} className="animate-in fade-in duration-200 min-h-full">
          {activeTab === 'home' && (
            <DashboardView
              accounts={accounts}
              categories={categories}
              transactions={transactions}
              activeMode={activeMode}
              onOpenAddModal={handleOpenAddModal}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToBudget={() => setActiveTab('budget')}
              onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              activeMode={activeMode}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAddModal={() => handleOpenAddModal('manual')}
              onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
            />
          )}

          {activeTab === 'budget' && (
            <ErrorBoundary>
              <BudgetView
                budgets={budgets}
                budgetItems={budgetItems}
                categories={categories}
                transactions={transactions}
                activeMode={activeMode}
                onCreateBudget={handleCreateBudget}
                onUpdateBudget={handleUpdateBudget}
                onSaveCategory={handleSaveCategory}
                onUpdateBudgetItem={handleUpdateBudgetItem}
                onDeleteBudget={handleDeleteBudget}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              budgetItems={budgetItems}
              activeMode={activeMode}
              accounts={accounts}
              inventoryItems={inventoryItems}
              onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'settings' && (
            <AppSettingsView
              onResetData={handleResetData}
              showToast={showToast}
              onNavigateToAccounts={() => setActiveTab('saya')}
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              budgets={budgets}
              budgetItems={budgetItems}
            />
          )}

          {activeTab === 'saya' && (
            <SettingsView
              accounts={accounts}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onResetData={handleResetData}
            />
          )}
        </div>
      </div>

      {/* App Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => handleOpenAddModal('manual')}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        categories={categories}
        budgets={budgets}
        initialSourceType={addSourceType}
        activeMode={activeMode}
        onSaveSingle={handleSaveSingleTransaction}
        onSaveMultiple={handleSaveMultipleTransactions}
        onSaveAccount={handleSaveAccount}
      />

      {/* Transaction Detail Modal */}
      <ErrorBoundary>
        <TransactionDetailModal
          transaction={selectedTxDetail}
          onClose={() => setSelectedTxDetail(null)}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          accounts={accounts}
          categories={categories}
        />
      </ErrorBoundary>
    </DeviceFrame>
  );
}
