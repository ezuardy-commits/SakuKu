import React, { useState } from 'react';
import { Account, AccountType, AccountScope } from '../types';
import { formatRupiah } from '../lib/formatters';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/db';
import { InventoryModal } from './InventoryModal';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Building2,
  Smartphone,
  Banknote,
  ShieldCheck,
  User,
  Store,
  Layers,
  Sparkles,
  Package,
  ChevronRight,
} from 'lucide-react';

interface SettingsViewProps {
  accounts: Account[];
  onSaveAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts,
  onSaveAccount,
  onDeleteAccount,
  onResetData,
}) => {
  const { language, t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [scope, setScope] = useState<AccountScope>('personal');
  const [businessName, setBusinessName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [filterScope, setFilterScope] = useState<'all' | AccountScope>('all');

  // Extract unique existing business names across accounts for easy quick selection
  const existingBusinessNames = Array.from(
    new Set(accounts.map((a) => a.business_name).filter((b): b is string => !!b && b.trim() !== ''))
  );

  const openAddModal = () => {
    setEditingAccount(null);
    setName('');
    setType('cash');
    setScope('personal');
    setBusinessName('');
    setOpeningBalance('0');
    setCurrentBalance('0');
    setAccountNumber('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setScope(acc.scope || 'personal');
    setBusinessName(acc.business_name || '');
    setOpeningBalance(acc.opening_balance.toString());
    setCurrentBalance(acc.current_balance.toString());
    setAccountNumber(acc.account_number || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'id' ? 'Masukkan nama akun.' : 'Please enter account name.');
      return;
    }

    if (scope === 'business' && !businessName.trim()) {
      alert(language === 'id' ? 'Masukkan nama bisnis atau unit usaha untuk akun bisnis ini.' : 'Please enter business name for this account.');
      return;
    }

    let initialVal = parseFloat(openingBalance) || 0;
    let currentVal = parseFloat(currentBalance) || initialVal;

    // Adjust opening_balance if current_balance was edited for an existing account
    if (editingAccount) {
      const txs = db.getTransactions();
      const txSum = txs.reduce((sum, tx) => {
        if (tx.account_id === editingAccount.id) {
          return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
        }
        return sum;
      }, 0);

      // Recalculate opening balance so that current_balance = currentVal
      initialVal = currentVal - txSum;
    } else {
      currentVal = initialVal;
    }

    const accToSave: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      name,
      type,
      scope,
      business_name: scope === 'business' ? businessName.trim() : undefined,
      opening_balance: initialVal,
      current_balance: currentVal,
      is_active: true,
      account_number: accountNumber || undefined,
    };

    onSaveAccount(accToSave);
    setIsModalOpen(false);
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-cyan-600" />;
      default:
        return <Banknote className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getScopeBadge = (acc: Account) => {
    switch (acc.scope) {
      case 'business':
        return (
          <span className="text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Store className="w-3 h-3 text-cyan-700" />
            {t('business')}: {acc.business_name || 'General'}
          </span>
        );
      case 'combined':
        return (
          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-700" />
            {t('combinedScopeBadge')}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <User className="w-3 h-3 text-purple-700" />
            {t('personal')}
          </span>
        );
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filterScope === 'all') return true;
    return acc.scope === filterScope;
  });

  return (
    <div className="p-4 flex flex-col gap-4 pb-24">
      {/* Account Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('manageAccountsTitle')}</h2>
          <p className="text-[11px] text-slate-500">{t('manageAccountsSub')}</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('addAccountBtn')}
        </button>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setFilterScope('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterScope === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('allAccountsFilter')} ({accounts.length})
        </button>
        <button
          onClick={() => setFilterScope('personal')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
            filterScope === 'personal'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" /> {t('personal')} ({accounts.filter((a) => a.scope === 'personal').length})
        </button>
        <button
          onClick={() => setFilterScope('business')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
            filterScope === 'business'
              ? 'bg-cyan-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-3.5 h-3.5" /> {t('business')} ({accounts.filter((a) => a.scope === 'business').length})
        </button>
        <button
          onClick={() => setFilterScope('combined')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
            filterScope === 'combined'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> {t('combined')} ({accounts.filter((a) => a.scope === 'combined').length})
        </button>
      </div>

      {/* Account Cards */}
      <div className="flex flex-col gap-3">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-400">
            {t('noAccountsMsg')}
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getAccountIcon(acc.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{acc.name}</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                      {acc.type}
                    </span>
                  </div>

                  <div className="mt-1">
                    {getScopeBadge(acc)}
                  </div>

                  {acc.account_number && (
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      {t('accountNumberLabel')}: {acc.account_number}
                    </p>
                  )}

                  <p className="text-xs font-extrabold text-blue-700 mt-1">
                    {t('balance')}: {formatRupiah(acc.current_balance)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(acc)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Edit Account"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {accounts.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(t('confirmDeleteAccAlert').replace('{name}', acc.name))) onDeleteAccount(acc.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Database Reset / Realtime Sample Data (Januari s/d Hari Ini) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-col gap-3 shadow-xs mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Data Contoh Realistis (Januari s/d Hari Ini)
          </span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Realtime Hari Ini
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Muat data simulasi keuangan dari 1 Januari hingga <strong>HARI INI</strong> untuk Pribadi dan seluruh sektor bisnis (Kuliner F&B, Toko Retail, Bengkel, dll) lengkap dengan bukti input (struk, mutasi bank, rekaman suara, catatan tangan & formulir manual).
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (confirm('Muat contoh laporan dari 1 Januari sampai HARI INI untuk Pribadi & semua jenis bisnis lengkap dengan bukti input?')) {
                db.seedAnnualSampleData(new Date().getFullYear(), new Date());
                window.location.reload();
              }
            }}
            className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-100" />
            <span>✨ Muat Data Contoh (Jan - Hari Ini)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t('confirmResetAlert'))) {
                onResetData();
              }
            }}
            className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {t('resetSampleDataBtn')}
          </button>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="bg-slate-100 rounded-2xl p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <span className="font-bold text-slate-800">{t('footerTitle')}</span>
        <span className="text-[10px]">{t('footerSub')}</span>
      </div>

      {/* CREATE / EDIT ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold">
                {editingAccount ? t('editAccountModalTitle') : t('addAccountModalTitle')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-blue-100 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5 overflow-y-auto">
              {/* Account Scope (Pribadi / Bisnis / Gabungan) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">{t('accountScopeLabel')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScope('personal')}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      scope === 'personal'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-purple-600" />
                    <span>{t('personal')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('business')}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      scope === 'business'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-cyan-600" />
                    <span>{t('business')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('combined')}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      scope === 'combined'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>{t('combined')}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  {scope === 'personal' && t('scopeHelpPersonal')}
                  {scope === 'business' && t('scopeHelpBusiness')}
                  {scope === 'combined' && t('scopeHelpCombined')}
                </p>
              </div>

              {/* If Scope is Business -> Specify Business Name */}
              {scope === 'business' && (
                <div className="flex flex-col gap-1.5 bg-cyan-50/60 p-3 rounded-2xl border border-cyan-200">
                  <label className="text-xs font-bold text-cyan-950 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-cyan-700" /> {t('businessNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t('businessNamePlaceholder')}
                    required
                    className="w-full p-2.5 border border-cyan-300 rounded-xl text-xs font-semibold bg-white"
                  />

                  {/* Existing Business Names quick-picker */}
                  {existingBusinessNames.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[10px] font-bold text-cyan-800">{t('pickFromRegisteredBusiness')}</span>
                      <div className="flex flex-wrap gap-1">
                        {existingBusinessNames.map((bName) => (
                          <button
                            key={bName}
                            type="button"
                            onClick={() => setBusinessName(bName)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-cyan-300 text-[10px] font-bold text-cyan-900 hover:bg-cyan-100 cursor-pointer"
                          >
                            + {bName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('accountNameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('accountNamePlaceholder')}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('accountTypeLabel')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-white"
                >
                  <option value="cash">{t('cashType')}</option>
                  <option value="bank">{t('bankType')}</option>
                  <option value="ewallet">{t('ewalletType')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('accountNumberInputLabel')}</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Saldo Kas Saat Ini */}
              <div className="flex flex-col gap-1 bg-blue-50/70 p-2.5 rounded-2xl border border-blue-200">
                <label className="text-xs font-black text-blue-950 flex items-center justify-between">
                  <span>{language === 'id' ? 'Saldo Kas Saat Ini (Sekarang):' : 'Current Cash Balance:'}</span>
                  <span className="text-[10px] text-blue-700 font-bold">Dapat Diubah</span>
                </label>
                <input
                  type="number"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full p-2.5 border border-blue-300 rounded-xl text-xs font-extrabold text-blue-900 bg-white"
                />
                <p className="text-[10px] text-blue-800">
                  {language === 'id'
                    ? 'Ketik nominal baru di sini jika ingin mengubah / menyesuaikan isi kas fisik Anda saat ini.'
                    : 'Type new amount here to directly adjust your physical cash balance.'}
                </p>
              </div>

              {/* Saldo Awal */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('openingBalanceLabel')}</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => {
                    setOpeningBalance(e.target.value);
                    if (!editingAccount) {
                      setCurrentBalance(e.target.value);
                    }
                  }}
                  placeholder="0"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  {t('saveAccountBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY & RUNNING CAPITAL MODAL */}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          mode={filterScope === 'personal' ? 'personal' : 'business'}
        />
      )}
    </div>
  );
};

