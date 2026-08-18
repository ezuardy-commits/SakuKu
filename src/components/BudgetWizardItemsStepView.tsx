import React from 'react';
import { BudgetSectionType } from '../lib/budgetTemplates';
import { WizardStepDefinition } from '../lib/wizardStepDefinitions';
import { formatRupiah, formatAmountInput, parseAmountNumber } from '../lib/formatters';
import {
  TrendingUp,
  Package,
  Briefcase,
  Layers,
  Scale,
  Plus,
  Trash2,
  Bell,
  BellRing,
  Calculator,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';

export interface WizardRowItem {
  id: string;
  section: BudgetSectionType;
  category_id: string;
  custom_name: string;
  item_type: 'income' | 'expense';
  qty: string;
  unit?: string;
  unit_price: string;
  planned_amount: string;
  planned_dates?: string[];
  planned_prices?: string[];
  reminder_enabled?: boolean;
  reminder_date?: string;
  reminder_note?: string;
}

interface BudgetWizardItemsStepViewProps {
  stepDef: WizardStepDefinition;
  items: WizardRowItem[];
  language: 'id' | 'en';
  isPersonal: boolean;
  sectionTotal: number;
  onAddItem: (section: BudgetSectionType, defaultName?: string, defaultUnit?: string) => void;
  onUpdateItem: (id: string, updates: Partial<WizardRowItem>) => void;
  onRemoveItem: (id: string) => void;
  onOpenAhsp: (id: string) => void;
  renderPlannedDates: (item: WizardRowItem) => React.ReactNode;
}

export const BudgetWizardItemsStepView: React.FC<BudgetWizardItemsStepViewProps> = ({
  stepDef,
  items,
  language,
  isPersonal,
  sectionTotal,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onOpenAhsp,
  renderPlannedDates,
}) => {
  const targetSection = stepDef.sectionTarget || 'opex';

  // Filter items that belong to this section
  const sectionItems = items.filter((it) => it.section === targetSection);

  // Icon & Theme Styling by stepDef.colorScheme
  const colorScheme = stepDef.colorScheme || 'indigo';

  const getHeaderTheme = () => {
    switch (colorScheme) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-600 text-white',
          title: 'text-emerald-950 dark:text-emerald-200',
          desc: 'text-emerald-700 dark:text-emerald-400',
          badge: 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700',
          totalText: 'text-emerald-600 dark:text-emerald-400',
          tag: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
          inputBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          iconBg: 'bg-rose-600 text-white',
          title: 'text-rose-950 dark:text-rose-200',
          desc: 'text-rose-700 dark:text-rose-400',
          badge: 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-700',
          totalText: 'text-rose-600 dark:text-rose-400',
          tag: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
          inputBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-600 text-white',
          title: 'text-purple-950 dark:text-purple-200',
          desc: 'text-purple-700 dark:text-purple-400',
          badge: 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700',
          totalText: 'text-purple-600 dark:text-purple-400',
          tag: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
          inputBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-600 text-white',
          title: 'text-amber-950 dark:text-amber-200',
          desc: 'text-amber-700 dark:text-amber-400',
          badge: 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700',
          totalText: 'text-amber-600 dark:text-amber-400',
          tag: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
          inputBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-600 text-white',
          title: 'text-blue-950 dark:text-blue-200',
          desc: 'text-blue-700 dark:text-blue-400',
          badge: 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700',
          totalText: 'text-blue-600 dark:text-blue-400',
          tag: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
          inputBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const theme = getHeaderTheme();
  const Icon = stepDef.icon || Briefcase;

  return (
    <motion.div
      key={`step-${stepDef.stepIndex}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex flex-col gap-4"
    >
      {/* SECTION HEADER CARD */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${theme.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-black ${theme.title}`}>
              {stepDef.title}
            </h3>
            <p className={`text-xs ${theme.desc}`}>
              {stepDef.desc}
            </p>
          </div>
        </div>

        <div className={`text-right px-3.5 py-2 rounded-xl border shadow-2xs shrink-0 ${theme.badge}`}>
          <span className="text-[10px] font-bold text-slate-500 block uppercase">
            {language === 'id' ? 'Subtotal Pos Bagian Ini' : 'Section Subtotal'}
          </span>
          <span className={`text-sm sm:text-base font-black ${theme.totalText}`}>
            {formatRupiah(sectionTotal)}
          </span>
        </div>
      </div>

      {/* OPTIONAL HINT BANNER */}
      {stepDef.hintText && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{stepDef.hintText}</span>
        </div>
      )}

      {/* ITEMS LIST */}
      <div className="flex flex-col gap-3">
        {sectionItems.map((it, idx) => {
          const isIncome = it.item_type === 'income' || it.section === 'revenue';

          return (
            <div
              key={it.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* TOP ROW: ITEM NAME, AHSP BUTTON, REMINDER, TRASH */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${theme.tag}`}>
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={it.custom_name}
                    onChange={(e) => onUpdateItem(it.id, { custom_name: e.target.value })}
                    placeholder={
                      isIncome
                        ? language === 'id'
                          ? 'Nama pos penerimaan / omzet...'
                          : 'Income item name...'
                        : language === 'id'
                        ? 'Nama pos belanja / beban usaha...'
                        : 'Expense item name...'
                    }
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* AHSP / UNIT COST BUTTON */}
                  <button
                    type="button"
                    onClick={() => onOpenAhsp(it.id)}
                    title={
                      language === 'id'
                        ? 'Hitung Analisa Harga Satuan (AHSP) / Komposisi Biaya'
                        : 'Unit Cost Analysis (AHSP)'
                    }
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">
                      {language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}
                    </span>
                  </button>

                  {/* REMINDER TOGGLE BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateItem(it.id, { reminder_enabled: !it.reminder_enabled })
                    }
                    title={it.reminder_enabled ? 'Pengingat Aktif' : 'Aktifkan Pengingat'}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                      it.reminder_enabled
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-2xs'
                        : 'text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {it.reminder_enabled ? (
                      <BellRing className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </button>

                  {/* TRASH DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(it.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* REMINDER EXPANDABLE CONFIG */}
              {it.reminder_enabled && (
                <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                      {language === 'id' ? 'Tanggal Pengingat / Jatuh Tempo:' : 'Reminder Date:'}
                    </label>
                    <input
                      type="date"
                      value={it.reminder_date || ''}
                      onChange={(e) => onUpdateItem(it.id, { reminder_date: e.target.value })}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                      {language === 'id' ? 'Catatan Pengingat:' : 'Reminder Note:'}
                    </label>
                    <input
                      type="text"
                      value={it.reminder_note || ''}
                      onChange={(e) => onUpdateItem(it.id, { reminder_note: e.target.value })}
                      placeholder={
                        language === 'id'
                          ? 'Misal: Bayar tagihan sebelum tgl 10...'
                          : 'e.g. Pay invoice before the 10th...'
                      }
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM ROW: QTY, UNIT, PLANNED TOTAL */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div className="w-20 sm:w-24 shrink-0">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'id' ? 'Qty / Vol' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e) => onUpdateItem(it.id, { qty: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                  />
                </div>

                <div className="w-20 sm:w-28 shrink-0">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'id' ? 'Satuan' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={it.unit || ''}
                    onChange={(e) => onUpdateItem(it.id, { unit: e.target.value })}
                    placeholder={isPersonal ? 'Bln/Pcs' : 'Unit/Bln'}
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5 truncate">
                    {isIncome
                      ? language === 'id'
                        ? 'Total Rencana Penerimaan (Rp)'
                        : 'Total Planned Inflow (Rp)'
                      : language === 'id'
                      ? 'Total Rencana Anggaran (Rp)'
                      : 'Total Planned Budget (Rp)'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={it.planned_amount}
                    onChange={(e) =>
                      onUpdateItem(it.id, {
                        planned_amount: formatAmountInput(parseAmountNumber(e.target.value)),
                      })
                    }
                    placeholder="Rp 0"
                    className={`w-full p-1.5 rounded-lg text-xs font-black text-right focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${theme.inputBg}`}
                  />
                </div>
              </div>

              {/* SCHEDULED DATES & INDIVIDUAL PRICES */}
              {renderPlannedDates(it)}
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {sectionItems.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
            <Icon className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'id'
                ? 'Belum ada pos terdaftar di bagian ini'
                : 'No items registered in this section yet'}
            </p>
            <p className="text-[11px] text-slate-400 mb-4 max-w-sm">
              {language === 'id'
                ? 'Tambahkan pos baru untuk melengkapi rincian perencanaan pos keuangan ini.'
                : 'Add a new item to complete the details for this financial section.'}
            </p>
            <button
              type="button"
              onClick={() =>
                onAddItem(
                  targetSection,
                  stepDef.newItemDefaultName,
                  stepDef.newItemDefaultUnit
                )
              }
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 ${theme.btnBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>{stepDef.addButtonLabel || (language === 'id' ? 'Tambah Pos' : 'Add Item')}</span>
            </button>
          </div>
        )}
      </div>

      {/* ADD ITEM BOTTOM BUTTON */}
      {sectionItems.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() =>
              onAddItem(
                targetSection,
                stepDef.newItemDefaultName,
                stepDef.newItemDefaultUnit
              )
            }
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 ${theme.btnBg}`}
          >
            <Plus className="w-4 h-4" />
            <span>{stepDef.addButtonLabel || (language === 'id' ? 'Tambah Pos Baru' : 'Add New Item')}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
