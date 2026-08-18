import React from 'react';
import { Home, ListOrdered, WalletCards, BarChart3, Settings, Landmark, Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export type TabType = 'home' | 'transactions' | 'budget' | 'reports' | 'settings' | 'saya';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    {
      id: 'home' as TabType,
      labelKey: 'navHome',
      icon: Home,
      activeGradient: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/40',
      inactiveClass: 'text-blue-500 bg-blue-50/80 hover:bg-blue-100/80',
      activeText: 'text-blue-600 font-black',
    },
    {
      id: 'transactions' as TabType,
      labelKey: 'navTransactions',
      icon: ListOrdered,
      activeGradient: 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 text-white shadow-md shadow-emerald-500/40',
      inactiveClass: 'text-emerald-500 bg-emerald-50/80 hover:bg-emerald-100/80',
      activeText: 'text-emerald-600 font-black',
    },
    {
      id: 'budget' as TabType,
      labelKey: 'navBudget',
      icon: WalletCards,
      activeGradient: 'bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-400 text-white shadow-md shadow-purple-500/40',
      inactiveClass: 'text-purple-500 bg-purple-50/80 hover:bg-purple-100/80',
      activeText: 'text-purple-600 font-black',
    },
    {
      id: 'reports' as TabType,
      labelKey: 'navReports',
      icon: BarChart3,
      activeGradient: 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white shadow-md shadow-orange-500/40',
      inactiveClass: 'text-amber-500 bg-amber-50/80 hover:bg-amber-100/80',
      activeText: 'text-amber-600 font-black',
    },
    {
      id: 'saya' as TabType,
      labelKey: 'navProfile',
      icon: Landmark,
      activeGradient: 'bg-gradient-to-tr from-rose-500 via-pink-500 to-red-400 text-white shadow-md shadow-rose-500/40',
      inactiveClass: 'text-rose-500 bg-rose-50/80 hover:bg-rose-100/80',
      activeText: 'text-rose-600 font-black',
    },
    {
      id: 'settings' as TabType,
      labelKey: 'navSettings',
      icon: Settings,
      activeGradient: 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 text-white shadow-md shadow-indigo-500/40',
      inactiveClass: 'text-indigo-500 bg-indigo-50/80 hover:bg-indigo-100/80',
      activeText: 'text-indigo-600 font-black',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 px-1.5 py-2 z-40 shadow-2xl transition-colors">
      {/* 7 Columns Grid Layout */}
      <div className="grid grid-cols-7 items-center text-center relative">
        {/* Left 3 Tabs */}
        {NAV_ITEMS.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08 }}
              className="flex flex-col items-center justify-center py-0.5 px-0.5 cursor-pointer group"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                  isActive ? item.activeGradient : item.inactiveClass
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] ${isActive ? 'scale-110 drop-shadow-xs' : 'opacity-90'}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shadow-xs"
                  />
                )}
              </div>
              <span
                className={`text-[9px] mt-1 tracking-tight truncate max-w-full ${
                  isActive ? item.activeText : 'font-bold text-slate-500 dark:text-slate-400'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </motion.button>
          );
        })}

        {/* 4. Center Floating Action Button (FAB + Catat) */}
        <div className="flex flex-col items-center justify-center relative -top-6">
          <motion.div
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            className="relative group cursor-pointer"
          >
            {/* Multi-layer glowing ring halo */}
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 animate-pulse opacity-70 blur-xs" />

            <button
              onClick={onOpenAddModal}
              className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center transition-all duration-300 ring-4 ring-white dark:ring-slate-900 border border-white/40 cursor-pointer"
            >
              <Plus className="w-8 h-8 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </motion.div>
          <span className="text-[9px] font-black mt-1 text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400 animate-spin" /> {t('navRecord')}
          </span>
        </div>

        {/* Right 3 Tabs */}
        {NAV_ITEMS.slice(3, 6).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08 }}
              className="flex flex-col items-center justify-center py-0.5 px-0.5 cursor-pointer group"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                  isActive ? item.activeGradient : item.inactiveClass
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] ${isActive ? 'scale-110 drop-shadow-xs' : 'opacity-90'}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shadow-xs"
                  />
                )}
              </div>
              <span
                className={`text-[9px] mt-1 tracking-tight truncate max-w-full ${
                  isActive ? item.activeText : 'font-bold text-slate-500 dark:text-slate-400'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

