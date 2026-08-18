import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Briefcase,
  WalletCards,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  PieChart,
  ShieldCheck,
  Info,
  Building2,
  User,
  HeartPulse,
} from 'lucide-react';
import { formatRupiah } from '../lib/formatters';
import { BudgetSectionType } from '../lib/budgetTemplates';

interface WizardRowItemSummary {
  id: string;
  section: BudgetSectionType;
  custom_name: string;
  item_type: 'income' | 'expense';
  qty: string;
  unit?: string;
  unit_price: string;
  planned_amount: string;
  planned_dates?: string[];
  planned_prices?: string[];
  reminder_enabled: boolean;
  reminder_date: string;
  reminder_note: string;
  ahspBreakdown?: any;
}

interface BudgetWizardSummaryViewProps {
  budgetName: string;
  startDate: string;
  endDate: string;
  isPersonal: boolean;
  templateId: string;
  items: WizardRowItemSummary[];
  totals: {
    carryoverAmount?: number;
    isCarryoverIncluded?: boolean;
    rolloverType?: 'actual_previous' | 'predicted_ongoing' | 'manual' | 'none';
    rolloverExplanation?: string;
    rolloverStatusBadge?: string;
    totalRevenue: number;
    totalAvailableFunds?: number;
    totalCOGS: number;
    totalOPEX: number;
    totalCapexEquity: number;
    totalDebtReceivable: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingIncome: number;
    operatingMarginPercent: number;
    netEstimatedRemaining: number;
    totalPlannedExpense: number;
    accumulatedEndingCash?: number;
  };
  language: 'id' | 'en';
  activeContractInfo?: {
    projectName: string;
    contractNumber?: string;
    clientName?: string;
    contractorName?: string;
    totalValue?: number;
    summaryNote?: string;
  } | null;
  onDownloadContractCopy?: () => void;
}

export const BudgetWizardSummaryView: React.FC<BudgetWizardSummaryViewProps> = ({
  budgetName,
  startDate,
  endDate,
  isPersonal,
  templateId,
  items,
  totals,
  language,
  activeContractInfo,
  onDownloadContractCopy,
}) => {
  const isId = language === 'id';
  const [copied, setCopied] = useState(false);

  // Allocation percentages against total revenue
  const rev = totals.totalRevenue || 1; // avoid divide by zero
  const cogsPct = Math.min(100, Math.round((totals.totalCOGS / rev) * 100));
  const opexPct = Math.min(100, Math.round((totals.totalOPEX / rev) * 100));
  const capexPct = Math.min(100, Math.round((totals.totalCapexEquity / rev) * 100));
  const debtPct = Math.min(100, Math.round((totals.totalDebtReceivable / rev) * 100));
  const netMarginPct = totals.totalRevenue > 0
    ? Math.round((totals.netEstimatedRemaining / totals.totalRevenue) * 100)
    : 0;

  // Personal 50/30/20 Rule Metrics
  const needsRatio = totals.totalRevenue > 0 ? (totals.totalCOGS / totals.totalRevenue) * 100 : 0;
  const wantsRatio = totals.totalRevenue > 0 ? (totals.totalOPEX / totals.totalRevenue) * 100 : 0;
  const debtRatio = totals.totalRevenue > 0 ? (totals.totalDebtReceivable / totals.totalRevenue) * 100 : 0;
  const savingsRatio = totals.totalRevenue > 0 ? (totals.totalCapexEquity / totals.totalRevenue) * 100 : 0;

  const isHealthy = totals.netEstimatedRemaining >= 0;
  const hasCarryover = (totals.carryoverAmount || 0) > 0 && totals.isCarryoverIncluded;

  const handleCopySummary = () => {
    let reportText = `=======================================================
RINGKASAN ANGGARAN & PROFORMA KEUANGAN BERKELANJUTAN
Judul: ${budgetName || (isPersonal ? 'Anggaran Pribadi' : 'Anggaran Usaha')}
Periode: ${startDate} s/d ${endDate}
=======================================================
${hasCarryover ? `0. Saldo Awal / Sisa Kas Lalu: ${formatRupiah(totals.carryoverAmount || 0)} (${totals.rolloverStatusBadge || 'Sisa Kas Berkelanjutan'})\n` : ''}1. Target Pemasukan / Omzet : ${formatRupiah(totals.totalRevenue)}
${hasCarryover ? `   >> TOTAL KAS TERSEDIA    : ${formatRupiah(totals.totalAvailableFunds || totals.totalRevenue)}\n` : ''}2. Beban Pokok (HPP/Kebutuhan): ${formatRupiah(totals.totalCOGS)} (${cogsPct}%)
   >> Laba Kotor / Sisa Kebutuhan: ${formatRupiah(totals.grossProfit)} (${totals.grossMarginPercent.toFixed(1)}%)
3. Beban Operasional (OPEX): ${formatRupiah(totals.totalOPEX)} (${opexPct}%)
   >> Laba Operasional (EBIT) : ${formatRupiah(totals.operatingIncome)} (${totals.operatingMarginPercent.toFixed(1)}%)
4. Alokasi Tabungan/Aset/Pajak: ${formatRupiah(totals.totalCapexEquity)} (${capexPct}%)
5. Cicilan Utang/Kewajiban   : ${formatRupiah(totals.totalDebtReceivable)} (${debtPct}%)
=======================================================
SISA KAS BERSIH PERIODE INI : ${formatRupiah(totals.netEstimatedRemaining)} (Net Margin: ${netMarginPct}%)
${hasCarryover ? `ESTIMASI SALDO AKHIR KAS    : ${formatRupiah(totals.accumulatedEndingCash || totals.netEstimatedRemaining)} (Kas Terakumulasi)\n` : ''}Status: ${isHealthy ? 'SURPLUS (Sehat & Berkelanjutan)' : 'DEFISIT (Perlu Penyesuaian Anggaran)'}
=======================================================`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 0. CONTINUOUS BUDGET CARRYOVER BANNER */}
      {hasCarryover && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/30 border border-amber-300 dark:border-amber-700/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  {isId ? 'Kas Anggaran Berkelanjutan Terhubung' : 'Continuous Budget Carryover Connected'}
                </h4>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                  {totals.rolloverStatusBadge || (totals.rolloverType === 'actual_previous' ? 'Realisasi 100%' : 'Prediksi AI Cerdas')}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                {totals.rolloverExplanation || (isId ? 'Sisa saldo kas periode sebelumnya otomatis terakumulasi ke dalam total kas tersedia periode ini.' : 'Previous remaining cash balance automatically rolled over.')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/80 shadow-2xs text-right shrink-0">
            <span className="text-[9.5px] font-bold text-slate-500 uppercase block">
              {isId ? 'Saldo Kas Awal Bawaan' : 'Starting Carryover'}
            </span>
            <span className="text-sm font-black text-amber-700 dark:text-amber-300">
              +{formatRupiah(totals.carryoverAmount || 0)}
            </span>
          </div>
        </div>
      )}

      {/* 1. EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Revenue / Income */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10.5px] font-black uppercase text-emerald-800 dark:text-emerald-300">
              {isPersonal ? (isId ? 'Target Pemasukan' : 'Total Inflow') : (isId ? 'Target Omzet Usaha' : 'Gross Revenue')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totals.totalRevenue)}
          </span>
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1">
            {hasCarryover
              ? (isId ? `Total Kas Tersedia: ${formatRupiah(totals.totalAvailableFunds || totals.totalRevenue)}` : `Available: ${formatRupiah(totals.totalAvailableFunds || totals.totalRevenue)}`)
              : (isPersonal ? (isId ? 'Gaji, freelance & pasif' : 'Salary & side-income') : (isId ? 'Proyeksi total penjualan' : 'Planned sales volume'))}
          </span>
        </div>

        {/* Card 2: Total Planned Expense */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10.5px] font-black uppercase text-rose-800 dark:text-rose-300">
              {isPersonal ? (isId ? 'Total Pengeluaran' : 'Total Expenses') : (isId ? 'Total Beban Rencana' : 'Total Planned Cost')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
            {formatRupiah(totals.totalPlannedExpense)}
          </span>
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1">
            {isPersonal ? (isId ? 'Kebutuhan, hidup, cicilan' : 'Needs, lifestyle, debt') : (isId ? 'HPP + OPEX + Pajak' : 'COGS + OPEX + Tax')}
          </span>
        </div>

        {/* Card 3: Operating Profit / Cash Surplus */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10.5px] font-black uppercase text-blue-800 dark:text-blue-300">
              {isPersonal ? (isId ? 'Sisa Dana Bebas' : 'Cash Surplus') : (isId ? 'Laba Operasional (EBIT)' : 'Operating EBIT')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">
            {formatRupiah(totals.operatingIncome)}
          </span>
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1">
            {totals.operatingMarginPercent.toFixed(1)}% {isId ? 'dari pemasukan' : 'of revenue'}
          </span>
        </div>

        {/* Card 4: Net Balance / Net Margin */}
        <div className={`p-3.5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isHealthy
            ? 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-teal-300 dark:border-teal-800'
            : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`text-[10.5px] font-black uppercase ${isHealthy ? 'text-teal-900 dark:text-teal-200' : 'text-rose-900 dark:text-rose-200'}`}>
              {isPersonal ? (isId ? 'Estimasi Tabungan Bersih' : 'Net Monthly Savings') : (isId ? 'Estimasi Arus Kas Bersih' : 'Net Profit Remaining')}
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isHealthy ? 'bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200' : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
            }`}>
              {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
          </div>
          <span className={`text-sm sm:text-base font-black ${isHealthy ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {formatRupiah(totals.netEstimatedRemaining)}
          </span>
          <span className="text-[9.5px] font-bold mt-1">
            {isHealthy
              ? (isId ? `✅ Surplus (${netMarginPct}% Margin)` : `✅ Surplus (${netMarginPct}%)`)
              : (isId ? '⚠️ Defisit (Perlu Penyesuaian)' : '⚠️ Deficit warning')}
          </span>
        </div>
      </div>

      {/* 2. VISUAL ALLOCATION PROGRESS BAR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-600" />
            {isPersonal
              ? (isId ? 'Komposisi Alokasi Anggaran Keluarga' : 'Household Budget Allocation')
              : (isId ? 'Struktur Alokasi Beban Usaha' : 'Business Cost Allocation Structure')}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {isId ? 'Total Target:' : 'Target:'} {formatRupiah(totals.totalRevenue)}
          </span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200 dark:border-slate-600 mb-3">
          {cogsPct > 0 && (
            <div
              style={{ width: `${Math.min(cogsPct, 100)}%` }}
              className="bg-rose-500 h-full rounded-full transition-all"
              title={`${isPersonal ? 'Kebutuhan Pokok' : 'HPP / Beban Pokok'}: ${cogsPct}%`}
            />
          )}
          {opexPct > 0 && (
            <div
              style={{ width: `${Math.min(opexPct, 100)}%` }}
              className="bg-indigo-500 h-full rounded-full transition-all"
              title={`${isPersonal ? 'Biaya Hidup & Tagihan' : 'Beban Operasional'}: ${opexPct}%`}
            />
          )}
          {capexPct > 0 && (
            <div
              style={{ width: `${Math.min(capexPct, 100)}%` }}
              className="bg-purple-500 h-full rounded-full transition-all"
              title={`${isPersonal ? 'Tabungan & Investasi' : 'Aset & Pajak'}: ${capexPct}%`}
            />
          )}
          {debtPct > 0 && (
            <div
              style={{ width: `${Math.min(debtPct, 100)}%` }}
              className="bg-amber-500 h-full rounded-full transition-all"
              title={`${isPersonal ? 'Cicilan Utang & KPR' : 'Cicilan Pinjaman / Tempo'}: ${debtPct}%`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {isPersonal ? (isId ? 'Kebutuhan Pokok' : 'Needs') : (isId ? 'Beban Pokok (HPP)' : 'COGS')}: <strong>{cogsPct}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {isPersonal ? (isId ? 'Biaya Hidup/Wants' : 'Lifestyle') : (isId ? 'Operasional (OPEX)' : 'OPEX')}: <strong>{opexPct}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {isPersonal ? (isId ? 'Tabungan/Investasi' : 'Savings') : (isId ? 'Aset & Pajak' : 'Capex & Tax')}: <strong>{capexPct}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {isPersonal ? (isId ? 'Cicilan Utang' : 'Debt') : (isId ? 'Cicilan Modal / Tempo' : 'Debt/Credit')}: <strong>{debtPct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. PROFORMA FINANCIAL STATEMENT (SAK EMKM / PERSONAL CASH FLOW FORMAT) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-black tracking-wide uppercase">
              {isPersonal
                ? (isId ? 'Laporan Proforma Arus Kas Pribadi (50/30/20 Rule)' : 'Personal Proforma Cash Flow Statement')
                : (isId ? 'Laporan Laba Rugi Proforma Resmi (Standar SAK EMKM / IFRS)' : 'Proforma Income Statement (SAK EMKM)')}
            </h4>
          </div>
          <span className="text-[10.5px] text-slate-400 font-mono">
            {startDate} s/d {endDate}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-2 text-xs">
          {/* 0. Starting Carryover if applicable */}
          {hasCarryover && (
            <div className="flex items-center justify-between py-1.5 px-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/60">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isId ? '0. SALDO KAS AWAL / SISA ANGGARAN LALU' : '0. STARTING ROLLOVER BALANCE'}
                <span className="text-[9.5px] font-normal text-amber-700 dark:text-amber-300">
                  ({totals.rolloverStatusBadge || 'Sisa Kas Berkelanjutan'})
                </span>
              </span>
              <span className="font-black text-amber-700 dark:text-amber-300 text-xs">
                +{formatRupiah(totals.carryoverAmount || 0)}
              </span>
            </div>
          )}

          {/* 1. Revenue */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isPersonal
                ? (isId ? '1. TOTAL TARGET PEMASUKAN & GAJI' : '1. TOTAL INFLOW & INCOME')
                : (isId ? '1. TARGET PENDAPATAN USAHA (OMZET)' : '1. GROSS REVENUE (SALES)')}
            </span>
            <span className="font-black text-emerald-600 text-sm">
              {formatRupiah(totals.totalRevenue)}
            </span>
          </div>

          {/* 1b. Total Available Funds if carryover */}
          {hasCarryover && (
            <div className="flex items-center justify-between py-1.5 pl-4 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50/40 dark:bg-emerald-950/20 rounded-md">
              <span>
                (=) {isId ? 'TOTAL KAS TERSEDIA (SALDO AWAL + PEMASUKAN)' : 'TOTAL AVAILABLE FUNDS'}
              </span>
              <span className="font-black">
                {formatRupiah(totals.totalAvailableFunds || totals.totalRevenue)}
              </span>
            </div>
          )}

          {/* 2. COGS / Needs */}
          <div className="flex items-center justify-between py-1.5 pl-4 text-slate-700 dark:text-slate-300">
            <span>
              (-) {isPersonal
                ? (isId ? 'Kebutuhan Pokok Hidup (Dapur, Sembako, Utilitas)' : 'Essential Living Needs')
                : (isId ? 'Beban Pokok Pendapatan (HPP / Biaya Bahan / Kulakan)' : 'Cost of Goods Sold (COGS)')}
            </span>
            <span className="font-bold text-rose-600">
              ({formatRupiah(totals.totalCOGS)})
            </span>
          </div>

          {/* 3. Gross Profit */}
          <div className="flex items-center justify-between py-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="font-black text-emerald-950 dark:text-emerald-200">
              (=) {isPersonal
                ? (isId ? 'SISA KAS SETELAH KEBUTUHAN POKOK' : 'BALANCE AFTER ESSENTIAL NEEDS')
                : (isId ? 'PROYEKSI LABA KOTOR (GROSS PROFIT)' : 'GROSS PROFIT')}
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
              {formatRupiah(totals.grossProfit)}{' '}
              <span className="text-[10px] font-bold">
                ({totals.grossMarginPercent.toFixed(1)}%)
              </span>
            </span>
          </div>

          {/* 4. OPEX / Lifestyle */}
          <div className="flex items-center justify-between py-1.5 pl-4 text-slate-700 dark:text-slate-300">
            <span>
              (-) {isPersonal
                ? (isId ? 'Biaya Hidup, Tagihan, Transport & Gaya Hidup' : 'Lifestyle Overhead & Bills')
                : (isId ? 'Total Beban Operasional Usaha (OPEX & Administrasi)' : 'Operating Expenses (OPEX)')}
            </span>
            <span className="font-bold text-indigo-600">
              ({formatRupiah(totals.totalOPEX)})
            </span>
          </div>

          {/* 5. Operating Profit EBIT */}
          <div className="flex items-center justify-between py-2 bg-blue-50 dark:bg-blue-950/40 px-3 rounded-xl border border-blue-200 dark:border-blue-800">
            <span className="font-black text-blue-950 dark:text-blue-200">
              (=) {isPersonal
                ? (isId ? 'SISA DANA BEBAS (SURPLUS OPERASIONAL)' : 'NET OPERATING CASH SURPLUS')
                : (isId ? 'PROYEKSI LABA OPERASIONAL (EBIT)' : 'OPERATING PROFIT (EBIT)')}
            </span>
            <span className="font-black text-blue-700 dark:text-blue-300 text-sm">
              {formatRupiah(totals.operatingIncome)}{' '}
              <span className="text-[10px] font-bold">
                ({totals.operatingMarginPercent.toFixed(1)}%)
              </span>
            </span>
          </div>

          {/* 6. Capex & Taxes / Savings */}
          {totals.totalCapexEquity > 0 && (
            <div className="flex items-center justify-between py-1.5 pl-4 text-slate-700 dark:text-slate-300">
              <span>
                (-) {isPersonal
                  ? (isId ? 'Alokasi Tabungan, Investasi, Dana Darurat & Sedekah' : 'Savings & Investments')
                  : (isId ? 'Belanja Modal (Aset Mesin), Prive Pemilik & Pajak' : 'Capex, Drawings & Taxes')}
              </span>
              <span className="font-bold text-purple-600">
                ({formatRupiah(totals.totalCapexEquity)})
              </span>
            </div>
          )}

          {/* 7. Debt & Receivables */}
          {totals.totalDebtReceivable > 0 && (
            <div className="flex items-center justify-between py-1.5 pl-4 text-slate-700 dark:text-slate-300">
              <span>
                (-) {isPersonal
                  ? (isId ? 'Cicilan Utang, KPR Rumah, Kendaraan & Paylater' : 'Debt Repayments & Installments')
                  : (isId ? 'Cicilan Pinjaman Usaha, Pelunasan & Tempo Supplier' : 'Loan Installments & Credit Terms')}
              </span>
              <span className="font-bold text-amber-600">
                ({formatRupiah(totals.totalDebtReceivable)})
              </span>
            </div>
          )}

          {/* 8. Net Final Cash Surplus */}
          <div className={`mt-2 flex items-center justify-between py-3 px-4 rounded-xl border ${
            isHealthy
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md'
              : 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-600 shadow-md'
          }`}>
            <div>
              <span className="font-black text-xs block uppercase tracking-wide">
                {isPersonal
                  ? (isId ? 'ESTIMASI SISA KAS BERSIH PERIODE INI' : 'ESTIMATED NET MONTHLY CASHFLOW')
                  : (isId ? 'ESTIMASI ARUS KAS BERSIH PERIODE INI' : 'ESTIMATED NET CASHFLOW SURPLUS')}
              </span>
              <span className="text-[10.5px] text-white/90 font-medium">
                {isHealthy
                  ? (isId ? '✅ Perencanaan Anggaran Surplus & Siap Diterapkan' : '✅ Healthy surplus budget plan')
                  : (isId ? '⚠️ Perhatian: Total Pengeluaran Melebihi Pemasukan (Defisit)' : '⚠️ Warning: Deficit plan')}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight font-mono">
              {formatRupiah(totals.netEstimatedRemaining)}
            </span>
          </div>

          {/* 9. Accumulated Ending Cash if carryover */}
          {hasCarryover && (
            <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-sm mt-1">
              <div>
                <span className="font-black text-xs block uppercase tracking-wide text-amber-400">
                  {isId ? 'ESTIMASI SALDO AKHIR KAS TERAKUMULASI' : 'ESTIMATED ACCUMULATED ENDING CASH'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {isId ? '(Saldo Awal Bawaan + Target Pemasukan - Seluruh Beban)' : '(Starting Carryover + Revenue - All Expenses)'}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatRupiah(totals.accumulatedEndingCash || (totals.netEstimatedRemaining + (totals.carryoverAmount || 0)))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. SMART FINANCIAL HEALTH CHECK & AI RECOMMENDATIONS */}
      <div className="bg-slate-50 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            {isId ? 'Evaluasi Kesehatan Finansial & Rekomendasi' : 'Financial Health Evaluation & Insights'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          {isPersonal ? (
            <>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200">
                    {isId ? 'Kebutuhan Pokok:' : 'Needs Ratio:'} {needsRatio.toFixed(1)}% (Ideal: ~50%)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {needsRatio <= 55
                      ? (isId ? 'Porsi kebutuhan pokok sangat proporsional dan terjaga.' : 'Essential needs are within healthy boundary.')
                      : (isId ? 'Porsi kebutuhan pokok cukup tinggi. Cek pos dapur dan utilitas.' : 'Needs are elevated. Check grocery/utilities.')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200">
                    {isId ? 'Beban Cicilan Utang:' : 'Debt Ratio:'} {debtRatio.toFixed(1)}% (Batas Aman: ≤30%)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {debtRatio <= 30
                      ? (isId ? 'Rasio utang sehat di bawah batas maksimal 30% pendapatan.' : 'Debt burden is well under 30% safe threshold.')
                      : (isId ? 'Peringatan: Beban cicilan >30% pendapatan. Prioritaskan pelunasan.' : 'Warning: Debt exceeds 30%. Prioritize debt reduction.')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200">
                    {isId ? 'Margin Laba Kotor (Gross Margin):' : 'Gross Margin:'} {totals.grossMarginPercent.toFixed(1)}%
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {totals.grossMarginPercent >= 35
                      ? (isId ? 'Margin kotor sangat sehat untuk menopang beban operasional.' : 'Healthy gross margin to sustain overhead.')
                      : (isId ? 'Margin tipis. Perhatikan efisiensi kulakan bahan baku.' : 'Low gross margin. Optimize procurement costs.')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200">
                    {isId ? 'Operating Margin (EBIT):' : 'Operating Margin:'} {totals.operatingMarginPercent.toFixed(1)}%
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {totals.operatingMarginPercent >= 15
                      ? (isId ? 'Operasional sangat efisien dengan rasio laba yang solid.' : 'Highly efficient operations with strong EBIT.')
                      : (isId ? 'Evaluasi pos operasional rutin seperti sewa dan listrik.' : 'Evaluate recurring overhead.')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 5. EXPORT & COPY ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {isId
              ? 'Salin laporan ringkasan atau unduh salinan kontrak untuk dokumentasi.'
              : 'Copy report summary or download contract copy.'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-none py-2 px-3.5 bg-white dark:bg-slate-700 hover:bg-slate-50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? (isId ? 'Tersalin!' : 'Copied!') : (isId ? 'Salin Ringkasan' : 'Copy Summary')}</span>
          </button>

          {!isPersonal && onDownloadContractCopy && (
            <button
              type="button"
              onClick={onDownloadContractCopy}
              className="flex-1 sm:flex-none py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isId ? 'Download Salinan (.txt)' : 'Download Copy'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
