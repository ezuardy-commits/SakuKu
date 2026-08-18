import React from 'react';
import { ModeType } from '../types';
import { User, Store, Layers, Globe, Coins, Sun, Moon, Laptop, GraduationCap, Database, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { WORLD_CURRENCIES } from '../lib/formatters';

interface HeaderProps {
  activeMode: 'all' | ModeType;
  onModeChange: (mode: 'all' | ModeType) => void;
  dataEnvironment?: 'real' | 'sample';
  onDataEnvironmentChange?: (env: 'real' | 'sample') => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onModeChange,
  dataEnvironment = 'sample',
  onDataEnvironmentChange,
  title = 'SakuKu',
}) => {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="bg-blue-600 dark:bg-slate-900 text-white px-4 pt-3 pb-3.5 shadow-md flex flex-col gap-2.5 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg text-white">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">{title}</h1>
            <p className="text-[11px] text-blue-100 dark:text-slate-300 font-medium mt-0.5">
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Top Control Bar: Theme, Currency, Language */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur flex items-center justify-center transition-all border border-white/20 shadow-xs cursor-pointer shrink-0"
            title={`Theme: ${theme.toUpperCase()} (${resolvedTheme === 'dark' ? 'Dark' : 'Light'} Active). Click to toggle.`}
          >
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-300" />}
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-200" />}
            {theme === 'system' && <Laptop className="w-3.5 h-3.5 text-cyan-200" />}
          </button>

          {/* World Currency Dropdown Selector */}
          <div className="flex items-center bg-white/20 hover:bg-white/30 text-white backdrop-blur rounded-full px-2 py-0.5 border border-white/20 text-[11px] font-extrabold shadow-xs transition-all">
            <Coins className="w-3 h-3 text-amber-300 mr-1 shrink-0" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-white font-black focus:outline-hidden cursor-pointer text-[11px] py-0.5"
              title="Select Currency / Pilih Mata Uang"
            >
              {WORLD_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white font-bold">
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur flex items-center gap-1 transition-all border border-white/20 shadow-xs cursor-pointer shrink-0"
            title="Switch Language / Ganti Bahasa"
          >
            <Globe className="w-3 h-3 text-amber-300" />
            <span>{language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
          </button>
        </div>
      </div>

      {/* Data Environment Dropdown: Mode Data Asli / Simulasi (Real / Simulation) */}
      <div className="flex items-center justify-between bg-black/25 dark:bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-white/15 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-black text-white">
          <Database className="w-3.5 h-3.5 text-cyan-300" />
          <span>{language === 'id' ? 'Mode Data:' : 'Data Mode:'}</span>
        </div>

        <div className="relative flex items-center">
          <select
            value={dataEnvironment}
            onChange={(e) => onDataEnvironmentChange?.(e.target.value as 'real' | 'sample')}
            className={`py-1 pl-2.5 pr-7 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-xs appearance-none ${
              dataEnvironment === 'real'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-amber-300 font-black'
            }`}
          >
            <option value="real" className="bg-slate-900 text-emerald-400 font-bold">
              {language === 'id' ? '🟢 Asli' : '🟢 Real'}
            </option>
            <option value="sample" className="bg-slate-900 text-amber-400 font-bold">
              {language === 'id' ? '🟡 Simulasi' : '🟡 Simulation'}
            </option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-950 absolute right-2 pointer-events-none stroke-[2.5]" />
        </div>
      </div>

      {/* Mode Filter Selector Chips */}
      <div className="grid grid-cols-3 gap-1.5 bg-blue-900/40 dark:bg-slate-800/80 p-1.5 rounded-2xl backdrop-blur-md text-xs font-semibold border border-white/10">
        <button
          onClick={() => onModeChange('all')}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeMode === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black shadow-md shadow-blue-500/30 ring-1 ring-white/30'
              : 'text-blue-100 hover:bg-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="truncate">{t('all')}</span>
        </button>

        <button
          onClick={() => onModeChange('personal')}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeMode === 'personal'
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black shadow-md shadow-purple-500/30 ring-1 ring-white/30'
              : 'text-blue-100 hover:bg-white/10'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="truncate">{t('personal')}</span>
        </button>

        <button
          onClick={() => onModeChange('business')}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeMode === 'business'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/30 ring-1 ring-white/30'
              : 'text-blue-100 hover:bg-white/10'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span className="truncate">{t('business')}</span>
        </button>
      </div>
    </div>
  );
};
