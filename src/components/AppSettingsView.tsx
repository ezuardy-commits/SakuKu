import React, { useState, useEffect } from 'react';
import {
  Settings,
  Crown,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Bell,
  Lock,
  Download,
  Upload,
  RefreshCw,
  HelpCircle,
  MessageCircle,
  Info,
  ChevronRight,
  Smartphone,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  Share2,
  Database,
  Languages,
  Wallet,
  Sun,
  Moon,
  Laptop,
  Palette,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { WORLD_CURRENCIES } from '../lib/formatters';
import { AndroidInstallModal } from './AndroidInstallModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { Transaction, Category, Account, Budget, BudgetItem } from '../types';
import { Folder, HardDrive, FileText, Image as ImageIcon } from 'lucide-react';
import { sakukuStorage } from '../lib/sakukuStorage';

interface AppSettingsViewProps {
  onResetData: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToAccounts?: () => void;
  transactions?: Transaction[];
  categories?: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  budgetItems?: BudgetItem[];
}

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({
  onResetData,
  showToast,
  onNavigateToAccounts,
  transactions = [],
  categories = [],
  accounts = [],
  budgets = [],
  budgetItems = [],
}) => {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // App settings state
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isPinLockEnabled, setIsPinLockEnabled] = useState(false);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);
  const [activeTabSetting, setActiveTabSetting] = useState<'subscription' | 'general' | 'data' | 'about'>('subscription');

  // Modals
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Subscription plan selection modal state
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro_monthly' | 'pro_yearly'>('pro_yearly');

  const handleExportData = () => {
    showToast(t('dataExported'), 'success');
  };

  const handleBackupCloud = () => {
    showToast(t('backupCompleted'), 'success');
  };

  return (
    <div className="p-4 flex flex-col gap-4 pb-28 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight">{t('settingsHeaderTitle')}</h2>
                <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Crown className="w-3 h-3 fill-amber-950" /> VIP PRO
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">
                {t('settingsHeaderSub')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTabSetting('subscription')}
          className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTabSetting === 'subscription'
              ? 'bg-amber-500 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Crown className="w-3.5 h-3.5" /> {t('subTabSubscription')}
        </button>

        <button
          onClick={() => setActiveTabSetting('general')}
          className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTabSetting === 'general'
              ? 'bg-blue-600 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> {t('subTabApp')}
        </button>

        <button
          onClick={() => setActiveTabSetting('data')}
          className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTabSetting === 'data'
              ? 'bg-indigo-600 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> {t('subTabBackup')}
        </button>

        <button
          onClick={() => setActiveTabSetting('about')}
          className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTabSetting === 'about'
              ? 'bg-slate-800 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" /> {t('subTabInfo')}
        </button>
      </div>

      {/* 1. SUBSCRIPTION SECTION */}
      {activeTabSetting === 'subscription' && (
        <div className="flex flex-col gap-4">
          {/* Active Plan Card */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border border-amber-300">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-lg" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {t('activePlan')}
                </span>
                <h3 className="text-xl font-black mt-2 flex items-center gap-2">
                  <Crown className="w-6 h-6 fill-amber-200 text-amber-200" /> {t('vipUnlimited')}
                </h3>
                <p className="text-xs text-amber-100 font-medium mt-1">
                  {t('vipActiveDuration')}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-amber-200 animate-bounce" />
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-black/10 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>AI Vision Unlimited</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/10 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Multi-Bisnis UMKM A,B,C</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/10 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Excel & PDF Reports</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/10 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Auto Cloud Backup</span>
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> {t('subscriptionTiers')}
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <div
                onClick={() => setSelectedPlan('free')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedPlan === 'free'
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{t('freePlan')}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t('freePlanDesc')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">{t('freePlanPrice')}</span>
                </div>
              </div>

              <div
                onClick={() => setSelectedPlan('pro_yearly')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedPlan === 'pro_yearly'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> {t('yearlyPlan')}
                    </span>
                    <span className="text-[9px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-md">
                      Save 50%
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {t('yearlyPlanDesc')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-900">{t('yearlyPlanPrice')}</span>
                  <span className="text-[9px] text-amber-700 block">{t('yearlyPlanUnit')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast(t('statusVipActive'), 'success')}
              className="mt-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs rounded-xl shadow-md hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 fill-white" />
              <span>{t('statusVipActive')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. GENERAL APP SETTINGS */}
      {activeTabSetting === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-blue-600" /> {t('appPreferences')}
          </h3>

          {/* Account & Kas Management Shortcut */}
          {onNavigateToAccounts && (
            <button
              onClick={onNavigateToAccounts}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 p-3.5 rounded-2xl flex items-center justify-between text-left group transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-blue-950 block">
                    {language === 'id' ? 'Kelola Kas & Rekening Keuangan' : 'Manage Cash & Bank Accounts'}
                  </span>
                  <span className="text-[10px] text-blue-700">
                    {language === 'id'
                      ? 'Edit nama kas, atur saldo kas saat ini, & tambah rekening bank'
                      : 'Edit cash names, adjust current balances, & add bank accounts'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* UI Theme Toggle */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('appTheme')}</span>
                <span className="text-[10px] text-slate-500">{t('appThemeSub')}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold mt-1">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  showToast(language === 'id' ? 'Mode terang diaktifkan' : 'Light mode activated', 'info');
                }}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-blue-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('themeLight')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  showToast(language === 'id' ? 'Mode gelap diaktifkan' : 'Dark mode activated', 'info');
                }}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-amber-300 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('themeDark')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  showToast(language === 'id' ? 'Tema menyesuaikan sistem' : 'Theme set to system default', 'info');
                }}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t('themeSystem')}</span>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('appLanguage')}</span>
                <span className="text-[10px] text-slate-500">
                  {language === 'id' ? 'Bahasa Indonesia' : 'English Language'}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLanguage('id');
                  showToast('Bahasa diubah ke Bahasa Indonesia', 'info');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'id' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-600'
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  showToast('Language set to English', 'info');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'en' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-600'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('mainCurrency')}</span>
                <span className="text-[10px] text-slate-500">{t('currencyFormat')}</span>
              </div>
            </div>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                showToast(`Currency changed to ${e.target.value}`, 'info');
              }}
              className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 cursor-pointer"
            >
              {WORLD_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Daily Notifications Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('dailyReminder')}</span>
                <span className="text-[10px] text-slate-500">{t('dailyReminderSub')}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsNotificationsEnabled(!isNotificationsEnabled);
                showToast(
                  !isNotificationsEnabled ? 'Notifications enabled' : 'Notifications disabled',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                isNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isNotificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* PIN Lock Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('pinLock')}</span>
                <span className="text-[10px] text-slate-500">{t('pinLockSub')}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPinLockEnabled(!isPinLockEnabled);
                showToast(
                  !isPinLockEnabled ? 'PIN Lock Enabled' : 'PIN Lock Disabled',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                isPinLockEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isPinLockEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound & Animation Effects */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('soundEffects')}</span>
                <span className="text-[10px] text-slate-500">{t('soundEffectsSub')}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSoundEffectsEnabled(!isSoundEffectsEnabled);
                showToast(
                  !isSoundEffectsEnabled ? 'Sound effects enabled' : 'Sound effects disabled',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                isSoundEffectsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isSoundEffectsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 3. DATA BACKUP & EXPORT */}
      {activeTabSetting === 'data' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3.5">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="w-4 h-4 text-indigo-600" /> {t('backupExport')}
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {/* SakuKu Internal Storage & Auto-Folder Hub */}
            <div className="p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 text-left flex flex-col gap-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 block">Penyimpanan & Folder Internal SakuKu</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                        Otomatis
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 leading-tight">
                      Foto struk & laporan otomatis terarsip rapi di subfolder <code className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1 rounded">SakuKu/</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center bg-white/80 p-2 rounded-xl border border-amber-200 text-[10px]">
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600 mb-0.5" />
                  <span className="font-bold text-slate-800">Foto_Struk/</span>
                  <span className="text-[9px] text-slate-500">Tahun/Bulan</span>
                </div>
                <div className="flex flex-col items-center border-x border-amber-100">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                  <span className="font-bold text-slate-800">Laporan_PDF/</span>
                  <span className="text-[9px] text-slate-500">Format A4</span>
                </div>
                <div className="flex flex-col items-center">
                  <Database className="w-3.5 h-3.5 text-indigo-600 mb-0.5" />
                  <span className="font-bold text-slate-800">Excel_CSV/</span>
                  <span className="text-[9px] text-slate-500">Spreadsheet</span>
                </div>
              </div>

              {/* Direct Folder Permission Button */}
              {sakukuStorage.isNativeSupported() && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await sakukuStorage.requestNativeFolderPermission();
                    if (res.success && res.folderName) {
                      showToast(`📁 Izin diberikan! Folder "${res.folderName}" terhubung langsung ke memori internal HP.`, 'success');
                    } else if (res.error) {
                      showToast(res.error, 'info');
                    }
                  }}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-200" />
                  <span>Izinkan Akses Folder Internal SakuKu di HP</span>
                </button>
              )}
            </div>

            <button
              onClick={handleExportData}
              className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-left flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-indigo-950 block">{t('exportExcel')}</span>
                  <span className="text-[10px] text-indigo-700">{t('exportExcelSub')}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleBackupCloud}
              className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-blue-950 block">{t('cloudBackup')}</span>
                  <span className="text-[10px] text-blue-700">{t('cloudBackupSub')}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Reset Option */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-rose-600" /> {t('resetData')}
            </span>
            <p className="text-[11px] text-slate-500">
              {t('resetDataSub')}
            </p>
            <button
              onClick={() => {
                if (confirm('Reset to initial sample data?')) {
                  onResetData();
                }
              }}
              className="py-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold self-start cursor-pointer"
            >
              {t('resetButton')}
            </button>
          </div>
        </div>
      )}

      {/* 4. ABOUT APP & SUPPORT */}
      {activeTabSetting === 'about' && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{t('appVersion')}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mt-1">
              {t('appAboutText')}
            </p>
          </div>

          {/* Android App APK Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-4 rounded-3xl shadow-md border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  {t('androidAppTitle')}
                  <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.5 rounded">APK</span>
                </h4>
                <p className="text-[10px] text-emerald-200 mt-0.5">
                  {t('androidAppSub')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-all"
            >
              {t('androidDownloadApk')}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col gap-2">
            <h4 className="text-xs font-black text-slate-900">{t('helpAndCommunity')}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-2xl flex items-center gap-2 hover:bg-blue-100 cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Privacy & Play Policy</span>
              </button>

              <button
                onClick={() => setIsAndroidModalOpen(true)}
                className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 cursor-pointer text-left"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android APK Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Install Guide Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Privacy Policy & Play Store Terms Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
