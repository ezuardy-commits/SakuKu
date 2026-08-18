import React, { useState } from 'react';
import { Account, Category, Transaction, ModeType, TransactionType } from '../types';
import { formatRupiah, formatDateIndonesian, formatTime, parseTxDate } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { useLanguage, getCategoryDisplayName } from '../context/LanguageContext';
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  User,
  Store,
  Plus,
  AlertTriangle,
  X,
  CheckCircle2,
  MoreVertical,
  Eye,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  activeMode: 'all' | ModeType;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  activeMode,
  onDeleteTransaction,
  onOpenAddModal,
  onSelectTransaction,
}) => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [activeMenuTxId, setActiveMenuTxId] = useState<string | null>(null);

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    // Mode filter
    if (activeMode !== 'all' && tx.mode !== activeMode) return false;
    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const cat = categories.find((c) => c.id === tx.category_id);
      const catName = cat ? getCategoryDisplayName(cat.name, language).toLowerCase() : '';
      const accName = accounts.find((a) => a.id === tx.account_id)?.name.toLowerCase() || '';
      return matchDesc || catName.includes(q) || accName.includes(q);
    }
    return true;
  });

  // Group transactions by date string YYYY-MM-DD
  const groupedByDate: { [dateStr: string]: Transaction[] } = {};
  filteredTxs.forEach((tx) => {
    const dateKey = tx.date.split('T')[0];
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(tx);
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort(
    (a, b) => parseTxDate(b).getTime() - parseTxDate(a).getTime()
  );

  // Sort items inside each date group by creation ID / time
  sortedDateKeys.forEach((dateKey) => {
    groupedByDate[dateKey].sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  });

  const getAccountInfo = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return t('accounts');
    if (acc.scope === 'business' && acc.business_name) {
      return `${acc.name} • ${acc.business_name}`;
    }
    return acc.name;
  };
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteTxAlert'))) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3.5 pb-24">
      {/* Search & Filters */}
      <div className="flex flex-col gap-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t('filterAllTypes')}
          </button>

          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedType === 'income'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            {t('filterIncome')}
          </button>

          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedType === 'expense'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-700 border-slate-200 hover:bg-rose-50'
            }`}
          >
            {t('filterExpense')}
          </button>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {sortedDateKeys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2">
          <Filter className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-700">{t('noTxFound')}</p>
          <p className="text-[11px] text-slate-400">
            {t('noTxFoundSub')}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('addTxBtn')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedDateKeys.map((dateKey) => {
            const dateTxs = groupedByDate[dateKey];
            const dateTotalIncome = dateTxs
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const dateTotalExpense = dateTxs
              .filter((t) => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div
                key={dateKey}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDateIndonesian(dateKey, language)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {dateTotalIncome > 0 && (
                      <span className="text-emerald-600">
                        +{formatRupiah(dateTotalIncome)}
                      </span>
                    )}
                    {dateTotalExpense > 0 && (
                      <span className="text-rose-600">
                        -{formatRupiah(dateTotalExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date Transactions Items */}
                <div className="divide-y divide-slate-100">
                  {dateTxs.map((tx) => {
                    const category = getCategory(tx.category_id);
                    const accountInfo = getAccountInfo(tx.account_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onSelectTransaction?.(tx)}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Category Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                            style={{
                              backgroundColor: `${category?.color || '#94A3B8'}20`,
                            }}
                          >
                            <CategoryIcon
                              name={category?.icon || 'Tag'}
                              color={category?.color || '#475569'}
                              size={20}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {tx.description}
                              </span>
                              
                              {/* Source Badge Tag */}
                              {tx.source_type === 'receipt' && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                  📄 Struk
                                </span>
                              )}
                              {tx.source_type === 'voice' && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                  🎤 Suara
                                </span>
                              )}
                              {tx.source_type === 'statement' && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                  🏦 Bank/QRIS
                                </span>
                              )}
                              {tx.source_type === 'handwritten' && (
                                <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                  ✍️ Tangan
                                </span>
                              )}
                              {(!tx.source_type || tx.source_type === 'manual') && (
                                <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                  📝 Form
                                </span>
                              )}

                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                                  tx.mode === 'personal'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-cyan-100 text-cyan-800'
                                }`}
                              >
                                {tx.mode === 'personal' ? t('personal') : t('business')}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-slate-600">
                                {category ? getCategoryDisplayName(category.name, language) : 'Category'}
                              </span>
                              <span>•</span>
                              <span>{accountInfo}</span>
                              {tx.date.includes('T') && (
                                <>
                                  <span>•</span>
                                  <span>{formatTime(tx.date, language)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-xs font-extrabold ${
                                isIncome ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                            </div>
                          </div>

                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTxId(activeMenuTxId === tx.id ? null : tx.id);
                              }}
                              className="p-1.5 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                              title="Menu Aksi"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popup (Lapis 1) */}
                            {activeMenuTxId === tx.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuTxId(null);
                                  }}
                                />
                                <div
                                  className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 w-44 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuTxId(null);
                                      onSelectTransaction?.(tx);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Lihat Detail</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuTxId(null);
                                      setTxToDelete(tx);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus Transaksi</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setTxToDelete(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus transaksi ini? Data akan dihapus secara permanen dari daftar, saldo akun, dan semua laporan.
              </p>
            </div>

            {/* Target Tx Card Summary */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {txToDelete.description}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                <span>📅 {formatDateIndonesian(txToDelete.date)}</span>
                <span className={`font-black ${txToDelete.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {txToDelete.type === 'income' ? '+' : '-'}{formatRupiah(txToDelete.amount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

