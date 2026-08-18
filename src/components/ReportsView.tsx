import React, { useState, useMemo, useEffect } from 'react';
import { Category, Transaction, ModeType, Budget, BudgetItem, Account, InventoryItem } from '../types';
import { formatRupiah, parseTxDate, formatDateIndonesian } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { MonthlyReportPrintModal } from './MonthlyReportPrintModal';
import { useLanguage } from '../context/LanguageContext';
import { computeBusinessAccountingReport } from '../lib/accountingEngine';
import { generateSakuKuMonthlyPdf } from '../lib/pdfGenerator';
import { sakukuStorage } from '../lib/sakukuStorage';
import { db } from '../lib/db';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  User,
  Store,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Printer,
  FileSpreadsheet,
  BookOpen,
  Target,
  AlertTriangle,
  Receipt,
  Sparkles,
  ChevronDown,
  Download,
  Search,
  X,
  Building2,
  CheckCircle2,
  Info,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  ArrowRight,
  Scale,
  DollarSign,
  Activity,
  FileText,
  BadgePercent,
  Check,
  Utensils,
  Wrench,
  HardHat,
  Briefcase,
  ShoppingBag,
  RefreshCw,
  Sliders,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  budgets?: Budget[];
  budgetItems?: BudgetItem[];
  activeMode: 'all' | ModeType;
  accounts?: Account[];
  inventoryItems?: InventoryItem[];
  onSelectTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

type PeriodType = 'monthly' | 'yearly';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const BUSINESS_UNIT_OPTIONS = [
  { id: 'all', label: 'Semua Bisnis (Konsolidasi)', tag: 'Konsolidasi', icon: '🌟', color: 'bg-cyan-600', sector: 'Semua Sektor' },
  { id: 'fnb_culinary', label: 'Kopi Senja Nusantara & Eatery', tag: 'Kuliner & Kafe', icon: '☕', color: 'bg-amber-600', sector: 'Food & Beverage' },
  { id: 'retail_store', label: 'Minimarket & Toko Sembako Berkah Jaya', tag: 'Retail & Sembako', icon: '🏪', color: 'bg-emerald-600', sector: 'Perdagangan & Ritel' },
  { id: 'workshop_service', label: 'Bengkel Mobil & Motor AutoCare', tag: 'Jasa & Bengkel', icon: '🔧', color: 'bg-blue-600', sector: 'Otomotif & Servis' },
  { id: 'laundry_service', label: 'Laundry Kilat Bersih Wangi', tag: 'Jasa Laundry', icon: '👕', color: 'bg-sky-600', sector: 'Jasa & Kebersihan' },
  { id: 'fashion_clothing', label: 'Konveksi & Butik Busana Harmoni', tag: 'Fashion & Butik', icon: '👗', color: 'bg-pink-600', sector: 'Tekstil & Busana' },
  { id: 'project_contract', label: 'PT Cipta Sarana Bangun Persada', tag: 'Kontraktor & Proyek', icon: '🏗️', color: 'bg-orange-600', sector: 'Konstruksi & Proyek' },
  { id: 'custom', label: 'Nusantara Creative & Digital Labs', tag: 'Agensi & IT', icon: '💻', color: 'bg-indigo-600', sector: 'Teknologi Informasi' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  budgets = [],
  budgetItems = [],
  activeMode,
  accounts = [],
  inventoryItems = [],
  onSelectTransaction,
  onDeleteTransaction,
}) => {
  const { t, language, getCategoryDisplayName } = useLanguage();
  const now = new Date();

  // Entity Mode: 'personal' (Pribadi) vs 'business' (Bisnis)
  const [entityMode, setEntityMode] = useState<ModeType>(
    activeMode === 'business' ? 'business' : 'personal'
  );

  // Sync entityMode with parent activeMode changes
  useEffect(() => {
    if (activeMode === 'personal' || activeMode === 'business') {
      setEntityMode(activeMode);
    }
  }, [activeMode]);

  // Business Sub-entity Account Selector
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');

  // 3. Period Selector State
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // 4. Budget Mode Toggle: 'dengan-penganggaran' vs 'tanpa-penganggaran'
  const [withBudget, setWithBudget] = useState<boolean>(true);

  // 5. Transaction Detail List Modal State (Income list or Expense list)
  const [transactionListModal, setTransactionListModal] = useState<'income' | 'expense' | null>(null);
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // 6. Print & Save Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);

  // 7. Business Accounting Sub-Tab State
  const [businessTab, setBusinessTab] = useState<
    'laba_rugi' | 'neraca' | 'arus_kas' | 'modal_rasio' | 'anggaran_kas' | 'stok_persediaan'
  >('laba_rugi');

  // Get list of available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2025, now.getFullYear()]);
    transactions.forEach((tx) => {
      const y = parseTxDate(tx.date).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  // Business accounts list for sub-grouping (Bisnis 1, Bisnis 2, etc.)
  const businessAccounts = useMemo(() => {
    return accounts.filter((a) => a.scope === 'business' || (a.business_name && a.business_name.trim() !== ''));
  }, [accounts]);

  // Filter transactions according to selected Entity Mode, Business Type, & Sub-account
  const entityFilteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (entityMode === 'personal') {
        return tx.mode === 'personal';
      } else {
        // Business mode
        if (tx.mode !== 'business') return false;

        // Filter by business unit / type if selected
        if (selectedBusinessType !== 'all') {
          const type = tx.business_type || '';
          const name = (tx.business_name || '').toLowerCase();

          let isMatch = false;
          if (selectedBusinessType === 'fnb_culinary') {
            isMatch = type === 'fnb_culinary' || name.includes('kopi') || name.includes('senja') || name.includes('culinary') || name.includes('eatery');
          } else if (selectedBusinessType === 'retail_store' || selectedBusinessType === 'retail_shop') {
            isMatch = type === 'retail_shop' || type === 'retail_store' || name.includes('berkah') || name.includes('sembako') || name.includes('minimarket') || name.includes('retail');
          } else if (selectedBusinessType === 'workshop_service') {
            isMatch = type === 'workshop_service' || name.includes('bengkel') || name.includes('autocare') || name.includes('motor') || name.includes('mobil');
          } else if (selectedBusinessType === 'laundry_service') {
            isMatch = type === 'laundry_service' || name.includes('laundry') || name.includes('cuci') || name.includes('bersih wangi');
          } else if (selectedBusinessType === 'fashion_clothing') {
            isMatch = type === 'fashion_clothing' || name.includes('konveksi') || name.includes('butik') || name.includes('harmoni') || name.includes('busana') || name.includes('fashion');
          } else if (selectedBusinessType === 'project_contract' || selectedBusinessType === 'construction') {
            isMatch = type === 'project_contract' || type === 'construction' || name.includes('cipta') || name.includes('kontraktor') || name.includes('bangun') || name.includes('proyek');
          } else if (selectedBusinessType === 'custom' || selectedBusinessType === 'it_consulting' || selectedBusinessType === 'consultant_it') {
            isMatch = type === 'custom' || type === 'it_consulting' || type === 'consultant_it' || name.includes('digital') || name.includes('nusantara') || name.includes('creative') || name.includes('agensi') || name.includes('software');
          }

          if (!isMatch) return false;
        }

        if (selectedAccountId !== 'all') {
          return tx.account_id === selectedAccountId;
        }
        return true;
      }
    });
  }, [transactions, entityMode, selectedBusinessType, selectedAccountId]);

  // Filter transactions according to chosen Period (Monthly vs Yearly)
  const periodTxs = useMemo(() => {
    return entityFilteredTxs.filter((tx) => {
      const d = parseTxDate(tx.date);
      const isYearMatch = d.getFullYear() === selectedYear;
      if (periodType === 'yearly') {
        return isYearMatch;
      }
      return isYearMatch && d.getMonth() === selectedMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entityFilteredTxs, periodType, selectedYear, selectedMonth]);

  // 12-Month Performance Matrix for Annual View (Jan - Des)
  const annualMonthlyMatrix = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, idx) => {
      const monthTxs = entityFilteredTxs.filter((tx) => {
        const d = parseTxDate(tx.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const cogs = monthTxs
        .filter((t) => t.type === 'expense' && (t.category_id === 'cat_exp_8' || t.category_id === 'cat_exp_1'))
        .reduce((s, t) => s + t.amount, 0);
      const opex = expense - cogs;
      const netProfit = income - expense;
      const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

      // Matching budget
      const matchingBudget = (budgets || []).find((b) => {
        const isModeMatch = b.mode === entityMode || b.mode === 'all';
        if (!isModeMatch) return false;
        if (entityMode === 'business' && selectedBusinessType !== 'all') {
          if (b.business_type !== selectedBusinessType && b.template_id !== selectedBusinessType) {
            return false;
          }
        }
        const bStart = new Date(b.start_date);
        const bEnd = new Date(b.end_date);
        bEnd.setHours(23, 59, 59, 999);
        const pStart = new Date(selectedYear, idx, 1);
        const pEnd = new Date(selectedYear, idx + 1, 0, 23, 59, 59, 999);
        return bStart <= pEnd && bEnd >= pStart;
      });

      const targetIncome = matchingBudget?.total_income_target || 0;
      const plannedExpense = matchingBudget?.total_planned_amount || 0;
      const budgetAchievement = plannedExpense > 0 ? Math.min(100, Math.round((expense / plannedExpense) * 100)) : 0;

      return {
        monthIndex: idx,
        monthName: MONTH_NAMES_ID[idx],
        income,
        cogs,
        opex,
        expense,
        netProfit,
        profitMargin,
        targetIncome,
        plannedExpense,
        budgetAchievement,
        txCount: monthTxs.length,
      };
    });

    const totalYearIncome = months.reduce((s, m) => s + m.income, 0);
    const totalYearExpense = months.reduce((s, m) => s + m.expense, 0);
    const totalYearCogs = months.reduce((s, m) => s + m.cogs, 0);
    const totalYearOpex = months.reduce((s, m) => s + m.opex, 0);
    const totalYearNet = totalYearIncome - totalYearExpense;
    const yearNetMargin = totalYearIncome > 0 ? (totalYearNet / totalYearIncome) * 100 : 0;
    const totalYearBudget = months.reduce((s, m) => s + m.plannedExpense, 0);

    return {
      months,
      totalYearIncome,
      totalYearExpense,
      totalYearCogs,
      totalYearOpex,
      totalYearNet,
      yearNetMargin,
      totalYearBudget,
    };
  }, [entityFilteredTxs, selectedYear, budgets, entityMode, selectedBusinessType]);

  // Filtered Inventory Items per selected business unit
  const filteredInventoryItems = useMemo(() => {
    if (entityMode !== 'business') return [];
    return inventoryItems.filter((it) => {
      if (selectedBusinessType === 'all') return it.mode === 'business';
      return it.business_type === selectedBusinessType || it.template_id === selectedBusinessType;
    });
  }, [inventoryItems, entityMode, selectedBusinessType]);

  // Inventory Summary Computations
  const inventorySummary = useMemo(() => {
    const rawMatAndStock = filteredInventoryItems.filter(
      (it) => it.item_type === 'product_stock' || it.item_type === 'raw_material'
    );
    const assets = filteredInventoryItems.filter((it) => it.item_type === 'equipment_asset');

    const totalStockValue = rawMatAndStock.reduce((s, it) => s + it.qty * it.cost_price, 0);
    const totalAssetValue = assets.reduce((s, it) => s + it.qty * it.cost_price, 0);
    const totalInventoryValue = totalStockValue + totalAssetValue;

    // Pemakaian = stok bulan lalu - stok sekarang (jika positif)
    const usageItems = rawMatAndStock.map((it) => {
      const lastQty = it.last_month_qty !== undefined ? it.last_month_qty : it.qty;
      const usage = Math.max(0, lastQty - it.qty);
      const usageValue = usage * it.cost_price;
      const isLowStock = it.min_stock_alert !== undefined && it.qty <= it.min_stock_alert;
      return { ...it, lastQty, usage, usageValue, isLowStock };
    });

    const totalUsageValue = usageItems.reduce((s, it) => s + it.usageValue, 0);
    const lowStockCount = usageItems.filter((it) => it.isLowStock).length;

    return {
      rawMatAndStock,
      assets,
      usageItems,
      totalStockValue,
      totalAssetValue,
      totalInventoryValue,
      totalUsageValue,
      lowStockCount,
    };
  }, [filteredInventoryItems]);

  // Selected Business Name for Accounting Engine
  const selectedBusinessName = useMemo(() => {
    if (selectedBusinessType === 'all') {
      if (selectedAccountId !== 'all') {
        const acc = accounts.find((a) => a.id === selectedAccountId);
        return acc?.business_name || acc?.name || 'Semua Unit Bisnis';
      }
      return 'Semua Unit Bisnis (Konsolidasi)';
    }
    const option = BUSINESS_UNIT_OPTIONS.find((o) => o.id === selectedBusinessType);
    return option ? option.label : 'Unit Bisnis';
  }, [selectedBusinessType, selectedAccountId, accounts]);

  // Compute Full Accounting Report (SAK EMKM / IFRS for SMEs) — dengan data inventory aktual
  const businessAcctReport = useMemo(() => {
    return computeBusinessAccountingReport({
      transactions: periodTxs,
      categories,
      accounts: selectedAccountId === 'all' ? accounts : accounts.filter((a) => a.id === selectedAccountId),
      selectedYear,
      selectedMonth,
      businessName: selectedBusinessName,
      inventoryItems: filteredInventoryItems,
    });
  }, [periodTxs, categories, accounts, selectedAccountId, selectedYear, selectedMonth, selectedBusinessName, filteredInventoryItems]);

  // Compute Income & Expense Totals
  const currentIncome = useMemo(() => {
    return periodTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [periodTxs]);

  const currentExpense = useMemo(() => {
    return periodTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [periodTxs]);

  const currentNet = currentIncome - currentExpense;

  // Breakdown expenses by category
  const expenseByCatMap = useMemo(() => {
    const map: { [catId: string]: number } = {};
    periodTxs
      .filter((t) => t.type === 'expense')
      .forEach((tx) => {
        map[tx.category_id] = (map[tx.category_id] || 0) + tx.amount;
      });
    return map;
  }, [periodTxs]);

  // Breakdown income by category
  const incomeByCatMap = useMemo(() => {
    const map: { [catId: string]: number } = {};
    periodTxs
      .filter((t) => t.type === 'income')
      .forEach((tx) => {
        map[tx.category_id] = (map[tx.category_id] || 0) + tx.amount;
      });
    return map;
  }, [periodTxs]);

  // Budget Calculations for "Dengan Penganggaran"
  const budgetData = useMemo(() => {
    if (!withBudget) {
      return { totalPlannedAmount: 0, plannedCategoryComparisons: [], unplannedCategoryComparisons: [] };
    }

    const matchingBudgets = (budgets || []).filter((b) => {
      const isModeMatch = b.mode === entityMode || b.mode === 'all';
      if (!isModeMatch) return false;

      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      bEnd.setHours(23, 59, 59, 999);

      if (periodType === 'monthly') {
        const pStart = new Date(selectedYear, selectedMonth, 1);
        const pEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
        return bStart <= pEnd && bEnd >= pStart;
      } else {
        const pStart = new Date(selectedYear, 0, 1);
        const pEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        return bStart <= pEnd && bEnd >= pStart;
      }
    });

    const matchingBudgetIds = matchingBudgets.map((b) => b.id);
    const relevantItems = (budgetItems || []).filter((item) => matchingBudgetIds.includes(item.budget_id));

    const plannedPerCatMap: { [catId: string]: number } = {};
    relevantItems.forEach((item) => {
      plannedPerCatMap[item.category_id] = (plannedPerCatMap[item.category_id] || 0) + item.planned_amount;
    });

    const totalPlannedAmount = Object.values(plannedPerCatMap).reduce((s, v) => s + v, 0);

    const plannedCategoryComparisons = categories
      .filter((c) => c.type === 'expense' && (plannedPerCatMap[c.id] || 0) > 0)
      .map((cat) => {
        const planned = plannedPerCatMap[cat.id] || 0;
        const actual = expenseByCatMap[cat.id] || 0;
        const selisih = planned - actual;
        const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;
        return {
          category: cat,
          planned,
          actual,
          selisih,
          percentage,
        };
      })
      .sort((a, b) => b.planned - a.planned);

    const unplannedCategoryComparisons = categories
      .filter((c) => c.type === 'expense' && (plannedPerCatMap[c.id] || 0) === 0 && (expenseByCatMap[c.id] || 0) > 0)
      .map((cat) => ({
        category: cat,
        actual: expenseByCatMap[cat.id] || 0,
      }))
      .sort((a, b) => b.actual - a.actual);

    return {
      totalPlannedAmount,
      plannedCategoryComparisons,
      unplannedCategoryComparisons,
    };
  }, [budgets, budgetItems, categories, entityMode, periodType, selectedYear, selectedMonth, expenseByCatMap, withBudget]);

  // Export CSV / Excel file
  const handleExportExcel = () => {
    const isMonthly = periodType === 'monthly';
    const periodLabel = isMonthly
      ? `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`
      : `Tahun ${selectedYear}`;

    let entityLabel = entityMode === 'personal' ? 'Pribadi' : 'Bisnis';
    if (entityMode === 'business' && selectedAccountId !== 'all') {
      const acc = accounts.find((a) => a.id === selectedAccountId);
      if (acc) entityLabel = `Bisnis - ${acc.name}${acc.business_name ? ` (${acc.business_name})` : ''}`;
    }

    let csv = `LAPORAN KEUANGAN SAKUKU - ${entityLabel.toUpperCase()}\n`;
    csv += `Periode: ${periodLabel}\n`;
    csv += `Mode Laporan: ${withBudget ? 'Dengan Penganggaran' : 'Tanpa Penganggaran'}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;

    csv += `RINGKASAN ARUS KAS\n`;
    csv += `Total Pemasukan,${currentIncome}\n`;
    csv += `Total Pengeluaran,${currentExpense}\n`;
    csv += `Saldo Bersih / Selisih,${currentNet}\n\n`;

    if (withBudget && budgetData.plannedCategoryComparisons.length > 0) {
      csv += `PERBANDINGAN ANGGARAN VS REALISASI\n`;
      csv += `Kategori,Rencana Anggaran (Rp),Realisasi Pengeluaran (Rp),Selisih / Sisa (Rp),Pencapaian (%),Status\n`;
      budgetData.plannedCategoryComparisons.forEach((item) => {
        const catName = getCategoryDisplayName(item.category.name, language);
        const status = item.selisih >= 0 ? 'Sesuai Rencana' : 'Over Budget';
        csv += `"${catName}",${item.planned},${item.actual},${item.selisih},${item.percentage}%,${status}\n`;
      });
      csv += `\n`;
    }

    csv += `DETAIL LIST TRANSAKSI PERIODE INI (${periodTxs.length} Transaksi)\n`;
    csv += `Tanggal,Jenis,Kategori,Akun Pembayaran,Nominal (Rp),Deskripsi,Ada Bukti Struk\n`;
    periodTxs.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.category_id);
      const acc = accounts.find((a) => a.id === tx.account_id);
      const catName = cat ? getCategoryDisplayName(cat.name, language) : 'Lainnya';
      const accName = acc ? acc.name : 'Kas';
      const hasProof = tx.attachment_path ? 'Ya' : 'Tidak';
      const desc = (tx.description || '').replace(/"/g, '""');
      csv += `"${tx.date}","${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}","${catName}","${accName}",${tx.amount},"${desc}","${hasProof}"\n`;
    });

    const monthPadded = String(selectedMonth + 1).padStart(2, '0');
    const monthName = MONTH_NAMES_ID[selectedMonth];
    const modeClean = entityLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const folderPathStr = `Sakuku/Tahun_${selectedYear}/${monthPadded}_${monthName}`;
    const structuredCsvFileName = `${folderPathStr}/Laporan_Keuangan_${selectedYear}_${monthPadded}_${monthName}_${modeClean}.csv`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = structuredCsvFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isDirectDownloadingPdf, setIsDirectDownloadingPdf] = useState(false);

  // Direct PDF Download (Instantly triggers SAK EMKM PDF download without opening full modal)
  const handleDirectDownloadPdf = async () => {
    setIsDirectDownloadingPdf(true);
    try {
      const monthPadded = String(selectedMonth + 1).padStart(2, '0');
      const monthName = MONTH_NAMES_ID[selectedMonth];
      const isBusiness = entityMode === 'business';
      const activeAccount = accounts.find((a) => a.id === selectedAccountId);
      const entityLabel = isBusiness
        ? (activeAccount ? `${activeAccount.name}${activeAccount.business_name ? `_${activeAccount.business_name}` : ''}` : 'Bisnis')
        : 'Pribadi';
      const modeClean = entityLabel.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `SakuKu_Laporan_A4_${selectedYear}_${monthPadded}_${monthName}_${modeClean}.pdf`;

      const pdfBlob = generateSakuKuMonthlyPdf({
        transactions,
        categories,
        accounts,
        budgets,
        budgetItems,
        inventoryItems,
        selectedYear,
        selectedMonth,
        filterMode: entityMode,
        filterCategory: 'all',
        filterAccount: selectedAccountId,
      });

      sakukuStorage.downloadFileDirectly(fileName, pdfBlob, 'application/pdf');

      // Auto-save to internal directory
      await sakukuStorage.saveReport(
        fileName,
        pdfBlob,
        'report_pdf',
        selectedYear,
        selectedMonth,
        'application/pdf',
        false
      );
    } catch (err: any) {
      console.warn('Direct PDF download error:', err);
      alert('Terjadi kendala saat menyusun PDF: ' + (err?.message || 'Silakan coba lagi'));
    } finally {
      setIsDirectDownloadingPdf(false);
    }
  };

  // Filtered transactions inside the detail list popup modal
  const modalTransactions = useMemo(() => {
    if (!transactionListModal) return [];
    return periodTxs.filter((tx) => {
      const isTypeMatch = tx.type === transactionListModal;
      if (!isTypeMatch) return false;
      if (!txSearchQuery.trim()) return true;

      const q = txSearchQuery.toLowerCase();
      const cat = categories.find((c) => c.id === tx.category_id);
      const catName = cat ? getCategoryDisplayName(cat.name, language).toLowerCase() : '';
      const desc = (tx.description || '').toLowerCase();
      return catName.includes(q) || desc.includes(q);
    });
  }, [periodTxs, transactionListModal, txSearchQuery, categories, language, getCategoryDisplayName]);

  return (
    <div className="p-3 sm:p-4 flex flex-col gap-4 pb-28 animate-fadeIn">
      {/* Entity Mode Switcher if activeMode is 'all' */}
      {activeMode === 'all' && (
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setEntityMode('personal');
              setSelectedAccountId('all');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              entityMode === 'personal'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Laporan Pribadi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntityMode('business');
              setSelectedAccountId('all');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              entityMode === 'business'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Laporan Bisnis / Usaha</span>
          </button>
        </div>
      )}

          {/* =========================================================================
              ANNUAL 12-MONTH PERFORMANCE MATRIX (MATRIKS KINERJA 12 BULAN LENGKAP)
             ========================================================================= */}
          {periodType === 'yearly' && (
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Matriks Kinerja Keuangan 12 Bulan (Tahun {selectedYear})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Progres realisasi pendapatan, pengeluaran, laba bersih & pencapaian anggaran per bulan
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                    12 Bulan Terdata
                  </span>
                </div>
              </div>

              {/* Annual Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-emerald-800 uppercase block">Total Pemasukan / Omzet</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">
                    {formatRupiah(annualMonthlyMatrix.totalYearIncome)}
                  </span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">12 Bulan Penuh</span>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-rose-800 uppercase block">Total Pengeluaran</span>
                  <span className="text-sm font-black text-rose-900 font-mono">
                    {formatRupiah(annualMonthlyMatrix.totalYearExpense)}
                  </span>
                  <span className="text-[9px] text-rose-700 block mt-0.5">
                    HPP: {formatRupiah(annualMonthlyMatrix.totalYearCogs)}
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-blue-800 uppercase block">Laba Bersih 1 Tahun</span>
                  <span className={`text-sm font-black font-mono ${annualMonthlyMatrix.totalYearNet >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>
                    {formatRupiah(annualMonthlyMatrix.totalYearNet)}
                  </span>
                  <span className="text-[9px] text-blue-700 block mt-0.5">
                    Margin: {annualMonthlyMatrix.yearNetMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-purple-800 uppercase block">Total Anggaran Direncanakan</span>
                  <span className="text-sm font-black text-purple-950 font-mono">
                    {formatRupiah(annualMonthlyMatrix.totalYearBudget)}
                  </span>
                  <span className="text-[9px] text-purple-700 block mt-0.5">Target Tahunan</span>
                </div>
              </div>

              {/* 12 Months Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                {annualMonthlyMatrix.months.map((m) => {
                  return (
                    <div
                      key={m.monthIndex}
                      className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-xs font-black text-slate-900">{m.monthName}</span>
                        <span className="text-[9px] font-extrabold text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                          {m.txCount} Trx
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[10px]">Masuk:</span>
                          <span className="font-mono font-bold text-emerald-700">{formatRupiah(m.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[10px]">Keluar:</span>
                          <span className="font-mono font-bold text-rose-700">{formatRupiah(m.expense)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/60 pt-1 font-black">
                          <span className="text-slate-700 text-[10px]">Laba:</span>
                          <span className={`font-mono ${m.netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                            {formatRupiah(m.netProfit)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth(m.monthIndex);
                          setPeriodType('monthly');
                        }}
                        className="mt-1 w-full py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Lihat Bulan Ini</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              IF BUSINESS MODE: RENDER SAK EMKM / IFRS PROFESSIONAL ACCOUNTING CONSOLE
             ========================================================================= */}
          {entityMode === 'business' ? (
            <div className="flex flex-col gap-4">
              {/* Sektor / Unit Bisnis Selector */}
              <div className="bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 p-3.5 rounded-3xl flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                    Pilih Unit Bisnis yang Sedang Berjalan:
                  </span>
                  <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-900/60 px-2.5 py-0.5 rounded-full border border-cyan-300/60">
                    7 Sektor + Konsolidasi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUSINESS_UNIT_OPTIONS.map((unit) => {
                    const isSelected = selectedBusinessType === unit.id;
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedBusinessType(unit.id)}
                        className={`p-2.5 rounded-2xl text-xs font-black flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                          isSelected
                            ? `${unit.color} text-white border-transparent shadow-md scale-[1.02]`
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:shadow-xs'
                        }`}
                      >
                        <span className="text-lg shrink-0">{unit.icon}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate leading-tight font-extrabold text-[11px]">{unit.tag}</span>
                          <span className={`text-[9px] truncate font-medium ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                            {unit.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Header Summary & Standard Financial Ratios */}
              <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md border border-slate-800 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      Laporan Keuangan Bisnis (SAK EMKM / IFRS)
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {businessAcctReport.businessName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Periode: {periodType === 'monthly' ? `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`} • Basis Kas & Akrual SAK EMKM
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                        businessAcctReport.balanceSheet.isBalanced
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      {businessAcctReport.balanceSheet.isBalanced ? 'Neraca Seimbang (Balanced)' : 'Neraca Selisih'}
                    </span>
                  </div>
                </div>

                {/* 4 Primary Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Omzet Penjualan</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {formatRupiah(businessAcctReport.incomeStatement.totalRevenue)}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Pendapatan Usaha</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Laba Kotor</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        businessAcctReport.incomeStatement.grossProfit >= 0 ? 'text-blue-400' : 'text-rose-400'
                      }`}
                    >
                      {formatRupiah(businessAcctReport.incomeStatement.grossProfit)}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Margin: {(businessAcctReport.financialRatios.grossMargin ?? 0).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Laba Operasional</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        businessAcctReport.incomeStatement.operatingIncome >= 0 ? 'text-indigo-300' : 'text-rose-400'
                      }`}
                    >
                      {formatRupiah(businessAcctReport.incomeStatement.operatingIncome)}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Margin: {(businessAcctReport.financialRatios.operatingMargin ?? 0).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Laba Bersih</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        businessAcctReport.incomeStatement.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {formatRupiah(businessAcctReport.incomeStatement.netProfit)}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Net: {(businessAcctReport.financialRatios.netMargin ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Sub-Tab Selector */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-1">
                {[
                  { id: 'laba_rugi', label: 'Laba Rugi', icon: TrendingUp },
                  { id: 'neraca', label: 'Posisi Keuangan (Neraca)', icon: Scale },
                  { id: 'arus_kas', label: 'Arus Kas (IAS 7)', icon: Activity },
                  { id: 'modal_rasio', label: 'Ekuitas & Rasio', icon: BadgePercent },
                  { id: 'anggaran_kas', label: 'Anggaran & Mutasi', icon: Target },
                  { id: 'stok_persediaan', label: 'Stok & Persediaan', icon: Package },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = businessTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBusinessTab(tab.id as any)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1. SUB-TAB: LABA RUGI (INCOME STATEMENT) */}
              {businessTab === 'laba_rugi' && (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Laporan Laba Rugi Komprehensif (Income Statement)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {/* A. PENDAPATAN */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>A. Pendapatan Usaha (Revenue)</span>
                        <span className="text-emerald-700 font-mono">
                          {formatRupiah(businessAcctReport.incomeStatement.totalRevenue)}
                        </span>
                      </div>
                      <div className="pl-3 space-y-1">
                        {businessAcctReport.incomeStatement.revenues.map((rev) => (
                          <div key={rev.categoryName} className="flex justify-between text-slate-600 text-[11px]">
                            <span>• {rev.categoryName}</span>
                            <span className="font-mono text-slate-800 font-bold">{formatRupiah(rev.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* B. BEBAN POKOK PENDAPATAN (HPP) */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>B. Beban Pokok Pendapatan (COGS / HPP)</span>
                        <span className="text-rose-700 font-mono">
                          ({formatRupiah(businessAcctReport.incomeStatement.totalCogs)})
                        </span>
                      </div>
                      <div className="pl-3 space-y-1">
                        {businessAcctReport.incomeStatement.cogs.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic">Tidak ada pos biaya pokok (HPP)</div>
                        ) : (
                          businessAcctReport.incomeStatement.cogs.map((item) => (
                            <div key={item.categoryName} className="flex justify-between text-slate-600 text-[11px]">
                              <span>• {item.categoryName}</span>
                              <span className="font-mono text-slate-800 font-bold">{formatRupiah(item.amount)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* SUB-TOTAL: LABA KOTOR */}
                    <div className="py-2.5 bg-blue-50/70 -mx-4 px-4 flex justify-between font-black text-blue-950 text-xs">
                      <span>LABA KOTOR (GROSS PROFIT)</span>
                      <span className="font-mono text-blue-900">
                        {formatRupiah(businessAcctReport.incomeStatement.grossProfit)}
                      </span>
                    </div>

                    {/* C. BEBAN OPERASIONAL (OPEX) */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>C. Beban Operasional & Administrasi (OPEX)</span>
                        <span className="text-rose-700 font-mono">
                          ({formatRupiah(businessAcctReport.incomeStatement.totalOperatingExpenses)})
                        </span>
                      </div>
                      <div className="pl-3 space-y-1">
                        {businessAcctReport.incomeStatement.operatingExpenses.map((exp) => (
                          <div key={exp.categoryName} className="flex justify-between text-slate-600 text-[11px]">
                            <span>• {exp.categoryName}</span>
                            <span className="font-mono text-slate-800 font-bold">{formatRupiah(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SUB-TOTAL: LABA OPERASIONAL (EBIT) */}
                    <div className="py-2.5 bg-slate-100 -mx-4 px-4 flex justify-between font-black text-slate-900 text-xs">
                      <span>LABA OPERASIONAL (EBIT)</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(businessAcctReport.incomeStatement.operatingIncome)}
                      </span>
                    </div>

                    {/* D. PENDAPATAN & BEBAN LAIN-LAIN */}
                    {(businessAcctReport.incomeStatement.nonOperatingIncome > 0 ||
                      businessAcctReport.incomeStatement.nonOperatingExpense > 0 ||
                      businessAcctReport.incomeStatement.estimatedTax > 0) && (
                      <div className="py-2.5 pl-3 space-y-1 text-slate-600 text-[11px]">
                        {businessAcctReport.incomeStatement.nonOperatingIncome > 0 && (
                          <div className="flex justify-between">
                            <span>Pendapatan Non-Operasional</span>
                            <span className="font-mono font-bold text-emerald-700">
                              +{formatRupiah(businessAcctReport.incomeStatement.nonOperatingIncome)}
                            </span>
                          </div>
                        )}
                        {businessAcctReport.incomeStatement.nonOperatingExpense > 0 && (
                          <div className="flex justify-between">
                            <span>Beban Non-Operasional</span>
                            <span className="font-mono font-bold text-rose-700">
                              -{formatRupiah(businessAcctReport.incomeStatement.nonOperatingExpense)}
                            </span>
                          </div>
                        )}
                        {businessAcctReport.incomeStatement.estimatedTax > 0 && (
                          <div className="flex justify-between">
                            <span>Beban Pajak Penghasilan (PPh Final UMKM)</span>
                            <span className="font-mono font-bold text-rose-700">
                              -{formatRupiah(businessAcctReport.incomeStatement.estimatedTax)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FINAL: LABA BERSIH */}
                    <div className="py-3 bg-slate-900 text-white -mx-4 px-4 rounded-b-2xl flex justify-between font-black text-sm">
                      <span className="uppercase">LABA BERSIH BERJALAN (NET INCOME)</span>
                      <span
                        className={`font-mono ${
                          businessAcctReport.incomeStatement.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatRupiah(businessAcctReport.incomeStatement.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SUB-TAB: POSISI KEUANGAN / NERACA (BALANCE SHEET) */}
              {businessTab === 'neraca' && (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-blue-600" />
                        Laporan Posisi Keuangan (Neraca / Balance Sheet)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Persamaan Dasar Akuntansi: Total Aset = Total Liabilitas + Total Ekuitas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SISI KIRI: ASET (AKTIVA) */}
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <div className="font-black text-slate-900 text-xs uppercase border-b border-slate-200 pb-1.5 flex justify-between">
                          <span>ASET (AKTIVA)</span>
                          <span className="font-mono text-blue-800">
                            {formatRupiah(businessAcctReport.balanceSheet.totalAssets)}
                          </span>
                        </div>

                        {/* Aset Lancar */}
                        <div className="mt-2.5">
                          <div className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                            <span>1. Aset Lancar (Current Assets)</span>
                            <span className="font-mono">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.totalCurrentAssets)}</span>
                          </div>
                          <div className="pl-3 mt-1 space-y-1 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>• Kas & Setara Kas</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentAssets.totalCashAndEquivalents)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Piutang Usaha</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentAssets.accountsReceivable)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Persediaan Barang</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentAssets.inventoryEstimate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Aset Tidak Lancar / Tetap */}
                        <div className="mt-3">
                          <div className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                            <span>2. Aset Tetap (Fixed Assets)</span>
                            <span className="font-mono">{formatRupiah(businessAcctReport.balanceSheet.nonCurrentAssets.totalNonCurrentAssets)}</span>
                          </div>
                          <div className="pl-3 mt-1 space-y-1 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>• Peralatan & Mesin</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.nonCurrentAssets.equipmentAndMachinery)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Properti & Kendaraan Usaha</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.nonCurrentAssets.propertyAndTools)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Aset Banner */}
                      <div className="mt-4 pt-2 border-t-2 border-slate-300 flex justify-between font-black text-xs text-slate-900 bg-white p-2 rounded-xl">
                        <span>TOTAL ASET</span>
                        <span className="font-mono text-blue-900">
                          {formatRupiah(businessAcctReport.balanceSheet.totalAssets)}
                        </span>
                      </div>
                    </div>

                    {/* SISI KANAN: LIABILITAS & EKUITAS (PASIVA) */}
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <div className="font-black text-slate-900 text-xs uppercase border-b border-slate-200 pb-1.5 flex justify-between">
                          <span>LIABILITAS & EKUITAS</span>
                          <span className="font-mono text-indigo-800">
                            {formatRupiah(businessAcctReport.balanceSheet.totalLiabilitiesAndEquity)}
                          </span>
                        </div>

                        {/* Liabilitas */}
                        <div className="mt-2.5">
                          <div className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                            <span>1. Total Liabilitas (Kewajiban)</span>
                            <span className="font-mono">{formatRupiah(businessAcctReport.balanceSheet.totalLiabilities)}</span>
                          </div>
                          <div className="pl-3 mt-1 space-y-1 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>• Utang Usaha & Tagihan Pemasok (Accounts Payable)</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentLiabilities.accountsPayable)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Utang Jangka Pendek & Pinjaman (Short-Term Debt)</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentLiabilities.shortTermDebt || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Beban Akrual & Utang Lainnya</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.currentLiabilities.accruedExpenses)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ekuitas */}
                        <div className="mt-3">
                          <div className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                            <span>2. Ekuitas Pemilik (Owner's Equity)</span>
                            <span className="font-mono">{formatRupiah(businessAcctReport.balanceSheet.equity.totalEquity)}</span>
                          </div>
                          <div className="pl-3 mt-1 space-y-1 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>• Modal Awal Disetor</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.equity.openingCapital)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Laba Ditahan</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatRupiah(businessAcctReport.balanceSheet.equity.retainedEarnings)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Laba Bersih Periode Ini</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {formatRupiah(businessAcctReport.balanceSheet.equity.currentPeriodNetProfit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>• Prive Pemilik (Drawings)</span>
                              <span className="font-mono font-bold text-rose-700">
                                ({formatRupiah(businessAcctReport.balanceSheet.equity.drawingsOrPrive)})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Liabilitas & Ekuitas Banner */}
                      <div className="mt-4 pt-2 border-t-2 border-slate-300 flex justify-between font-black text-xs text-slate-900 bg-white p-2 rounded-xl">
                        <span>TOTAL LIABILITAS & EKUITAS</span>
                        <span className="font-mono text-indigo-900">
                          {formatRupiah(businessAcctReport.balanceSheet.totalLiabilitiesAndEquity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SUB-TAB: ARUS KAS (CASH FLOWS - IAS 7 / SAK EMKM) */}
              {businessTab === 'arus_kas' && (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-purple-600" />
                        Laporan Arus Kas (Statement of Cash Flows)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Metode Langsung berdasarkan 3 Pilar Aktivitas (Operasi, Investasi, Pendanaan)
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {/* A. AKTIVITAS OPERASI */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>1. Arus Kas dari Aktivitas Operasi</span>
                        <span
                          className={`font-mono ${
                            businessAcctReport.cashFlowStatement.operatingActivities.netCashFromOperating >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.netCashFromOperating)}
                        </span>
                      </div>
                      <div className="pl-3 space-y-1 text-slate-600 text-[11px]">
                        <div className="flex justify-between">
                          <span>• Penerimaan Kas dari Penjualan / Pelanggan</span>
                          <span className="font-mono font-bold text-emerald-700">
                            +{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashFromCustomers)}
                          </span>
                        </div>
                        {businessAcctReport.cashFlowStatement.operatingActivities.cashFromReceivableCollection > 0 && (
                          <div className="flex justify-between">
                            <span>• Penerimaan Kas dari Pelunasan Piutang</span>
                            <span className="font-mono font-bold text-emerald-700">
                              +{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashFromReceivableCollection)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>• Pembayaran Kas ke Pemasok & HPP Kulakan</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashPaidToSuppliersAndCogs)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Pembayaran Biaya Operasional & Beban</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashPaidForOperatingExpenses)}
                          </span>
                        </div>
                        {businessAcctReport.cashFlowStatement.operatingActivities.cashPaidForReceivablesIssued > 0 && (
                          <div className="flex justify-between">
                            <span>• Pemberian Pinjaman / Piutang Dikeluarkan</span>
                            <span className="font-mono font-bold text-rose-700">
                              -{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashPaidForReceivablesIssued)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* B. AKTIVITAS INVESTASI */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>2. Arus Kas dari Aktivitas Investasi</span>
                        <span
                          className={`font-mono ${
                            businessAcctReport.cashFlowStatement.investingActivities.netCashFromInvesting >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {formatRupiah(businessAcctReport.cashFlowStatement.investingActivities.netCashFromInvesting)}
                        </span>
                      </div>
                      <div className="pl-3 space-y-1 text-slate-600 text-[11px]">
                        <div className="flex justify-between">
                          <span>• Pembelian Aset Tetap / Peralatan Usaha</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{formatRupiah(businessAcctReport.cashFlowStatement.investingActivities.purchaseOfEquipmentAndAssets)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* C. AKTIVITAS PENDANAAN */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between font-black text-slate-900 uppercase text-[11px] mb-1.5">
                        <span>3. Arus Kas dari Aktivitas Pendanaan</span>
                        <span
                          className={`font-mono ${
                            businessAcctReport.cashFlowStatement.financingActivities.netCashFromFinancing >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.netCashFromFinancing)}
                        </span>
                      </div>
                      <div className="pl-3 space-y-1 text-slate-600 text-[11px]">
                        <div className="flex justify-between">
                          <span>• Penyetoran Modal Tambahan oleh Pemilik</span>
                          <span className="font-mono font-bold text-emerald-700">
                            +{formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.ownerCapitalInjection)}
                          </span>
                        </div>
                        {businessAcctReport.cashFlowStatement.financingActivities.loanReceivedFromLenders > 0 && (
                          <div className="flex justify-between">
                            <span>• Penerimaan Pinjaman / Utang Baru</span>
                            <span className="font-mono font-bold text-emerald-700">
                              +{formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.loanReceivedFromLenders)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>• Penarikan Prive oleh Pemilik</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.ownerDrawingsPrive)}
                          </span>
                        </div>
                        {businessAcctReport.cashFlowStatement.financingActivities.loanRepaymentsPaid > 0 && (
                          <div className="flex justify-between">
                            <span>• Pembayaran Cicilan & Pelunasan Utang</span>
                            <span className="font-mono font-bold text-rose-700">
                              -{formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.loanRepaymentsPaid)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOTAL NET INCREASE & ENDING CASH */}
                    <div className="py-3 bg-slate-900 text-white -mx-4 px-4 rounded-b-2xl flex justify-between font-black text-sm">
                      <span className="uppercase">KENAIKAN (PENURUNAN) KAS BERSIH</span>
                      <span
                        className={`font-mono ${
                          businessAcctReport.cashFlowStatement.netChangeInCash >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {businessAcctReport.cashFlowStatement.netChangeInCash >= 0 ? '+' : ''}
                        {formatRupiah(businessAcctReport.cashFlowStatement.netChangeInCash)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SUB-TAB: EKUITAS & RASIO KEUANGAN */}
              {businessTab === 'modal_rasio' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Perubahan Modal Card */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <BadgePercent className="w-4 h-4 text-blue-600" />
                      Laporan Perubahan Modal (Equity Statement)
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Modal Awal Periode:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(businessAcctReport.equityStatement.beginningEquity)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Penyetoran Modal Tambahan:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          +{formatRupiah(businessAcctReport.equityStatement.capitalAdditions)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Laba Bersih Periode Ini:</span>
                        <span
                          className={`font-mono font-bold ${
                            businessAcctReport.equityStatement.netIncomePeriod >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {businessAcctReport.equityStatement.netIncomePeriod >= 0 ? '+' : ''}
                          {formatRupiah(businessAcctReport.equityStatement.netIncomePeriod)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Penarikan Prive Pemilik:</span>
                        <span className="font-mono font-bold text-rose-700">
                          -{formatRupiah(businessAcctReport.equityStatement.drawingsPrive)}
                        </span>
                      </div>
                      <div className="pt-2 border-t-2 border-slate-200 flex justify-between font-black text-slate-900 bg-slate-50 p-2 rounded-xl">
                        <span>MODAL AKHIR PERIODE:</span>
                        <span className="font-mono text-blue-900">
                          {formatRupiah(businessAcctReport.equityStatement.endingEquity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Ratios Card */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Rasio Finansial & Kinerja Usaha
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Gross Margin</span>
                        <span className="text-base font-black text-blue-800 font-mono">
                          {(businessAcctReport.financialRatios.grossMargin ?? 0).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Efisiensi HPP</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Net Profit Margin</span>
                        <span
                          className={`text-base font-black font-mono ${
                            (businessAcctReport.financialRatios.netMargin ?? 0) >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {(businessAcctReport.financialRatios.netMargin ?? 0).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Profitabilitas Akhir</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Operating Margin</span>
                        <span className="text-base font-black text-slate-800 font-mono">
                          {(businessAcctReport.financialRatios.operatingMargin ?? 0).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Efisiensi Operasional</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Rasio Kas (Liquidity)</span>
                        <span className="text-base font-black text-indigo-700 font-mono">
                          {(businessAcctReport.financialRatios.cashRatio ?? 0).toFixed(2)}x
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Daya Bayar Utang</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Debt to Asset (DAR)</span>
                        <span
                          className={`text-base font-black font-mono ${
                            (businessAcctReport.financialRatios.debtToAssetRatio ?? 0) <= 50
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {(businessAcctReport.financialRatios.debtToAssetRatio ?? 0).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Kesehatan Solvabilitas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SUB-TAB: ANGGARAN & MUTASI KAS BISNIS */}
              {businessTab === 'anggaran_kas' && (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-purple-600" />
                        Realisasi Biaya vs Rencana Anggaran Bisnis
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Kontrol biaya operasional dan belanja persediaan unit usaha
                      </p>
                    </div>
                  </div>

                  {budgetData.plannedCategoryComparisons.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 my-1">
                      <PieChart className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">
                        Belum Ada Pos Rencana Anggaran Bisnis untuk Periode Ini
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {budgetData.plannedCategoryComparisons.map((item) => {
                        const isOver = item.selisih < 0;
                        return (
                          <div
                            key={item.category.id}
                            className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-2 hover:bg-slate-100/80 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${item.category.color}20` }}
                                >
                                  <CategoryIcon
                                    name={item.category.icon}
                                    color={item.category.color}
                                    size={16}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {getCategoryDisplayName(item.category.name, language)}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isOver
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isOver ? 'Over Budget' : 'Sesuai Rencana'}
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOver ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-3 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                              <div>
                                <span className="text-slate-400 block font-normal">Rencana:</span>
                                <span className="text-slate-900">{formatRupiah(item.planned)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-normal">Realisasi:</span>
                                <span className={isOver ? 'text-rose-600' : 'text-slate-900'}>
                                  {formatRupiah(item.actual)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block font-normal">
                                  {isOver ? 'Kelebihan:' : 'Sisa:'}
                                </span>
                                <span className={isOver ? 'text-rose-600' : 'text-emerald-700'}>
                                  {formatRupiah(Math.abs(item.selisih))}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 6. SUB-TAB: STOK & PERSEDIAAN (INVENTORY REPORT) */}
              {businessTab === 'stok_persediaan' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  {/* Summary Cards Stok */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                      <span className="text-[9px] font-extrabold text-emerald-800 uppercase block">Nilai Stok Bahan Baku</span>
                      <span className="text-sm font-black text-emerald-900 font-mono">{formatRupiah(inventorySummary.totalStockValue)}</span>
                      <span className="text-[9px] text-emerald-700 block mt-0.5">{inventorySummary.rawMatAndStock.length} item</span>
                    </div>
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                      <span className="text-[9px] font-extrabold text-blue-800 uppercase block">Nilai Aset Tetap</span>
                      <span className="text-sm font-black text-blue-900 font-mono">{formatRupiah(inventorySummary.totalAssetValue)}</span>
                      <span className="text-[9px] text-blue-700 block mt-0.5">{inventorySummary.assets.length} item</span>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                      <span className="text-[9px] font-extrabold text-amber-800 uppercase block">Est. Pemakaian Bulan Ini</span>
                      <span className="text-sm font-black text-amber-900 font-mono">{formatRupiah(inventorySummary.totalUsageValue)}</span>
                      <span className="text-[9px] text-amber-700 block mt-0.5">vs HPP transaksi</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${inventorySummary.lowStockCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-[9px] font-extrabold uppercase block ${inventorySummary.lowStockCount > 0 ? 'text-rose-800' : 'text-slate-600'}`}>Stok Hampir Habis</span>
                      <span className={`text-sm font-black font-mono ${inventorySummary.lowStockCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{inventorySummary.lowStockCount} Item</span>
                      <span className={`text-[9px] block mt-0.5 ${inventorySummary.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{inventorySummary.lowStockCount > 0 ? 'Perlu Restock!' : 'Semua aman'}</span>
                    </div>
                  </div>

                  {/* Tabel Pemakaian Bahan Baku & Stok Dagang */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-amber-600" />
                          Laporan Mutasi Stok Bahan Baku & Persediaan Dagang
                        </h4>
                        <p className="text-[10px] text-slate-500">Stok awal bulan → pemakaian → stok akhir · harga pokok per unit</p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {inventorySummary.rawMatAndStock.length} Item
                      </span>
                    </div>

                    {inventorySummary.usageItems.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">Belum Ada Data Stok untuk Unit Bisnis Ini</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tambahkan item di menu Inventaris untuk mulai melacak stok & pemakaian.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[640px]">
                          <thead>
                            <tr className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                              <th className="text-left px-3 py-2 rounded-l-xl">Nama Item & SKU</th>
                              <th className="text-center px-2 py-2">Stok Awal</th>
                              <th className="text-center px-2 py-2">Pemakaian</th>
                              <th className="text-center px-2 py-2">Stok Akhir</th>
                              <th className="text-center px-2 py-2">Satuan</th>
                              <th className="text-right px-2 py-2">Harga Pokok</th>
                              <th className="text-right px-3 py-2 rounded-r-xl">Nilai Stok</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inventorySummary.usageItems.map((item) => (
                              <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.isLowStock ? 'bg-rose-50/40' : ''}`}>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {item.isLowStock && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                    <div>
                                      <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                                      {item.sku_barcode && <p className="text-[10px] text-slate-400 font-mono">{item.sku_barcode}</p>}
                                      {item.isLowStock && <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded-md">STOK RENDAH!</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-700">{item.lastQty}</td>
                                <td className="px-2 py-2.5 text-center">
                                  <span className={`font-mono font-bold ${item.usage > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                    {item.usage > 0 ? `-${item.usage}` : '—'}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <span className={`font-mono font-bold ${item.isLowStock ? 'text-rose-700' : 'text-slate-900'}`}>{item.qty}</span>
                                </td>
                                <td className="px-2 py-2.5 text-center text-slate-500">{item.unit}</td>
                                <td className="px-2 py-2.5 text-right font-mono text-slate-700">{formatRupiah(item.cost_price)}</td>
                                <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">{formatRupiah(item.qty * item.cost_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-900 text-white">
                              <td colSpan={5} className="px-3 py-2 rounded-bl-xl font-black text-xs uppercase">TOTAL NILAI PERSEDIAAN (STOK AKHIR)</td>
                              <td className="px-2 py-2 text-right text-[10px] text-slate-300 font-bold">Est. Pemakaian:</td>
                              <td className="px-3 py-2 rounded-br-xl">
                                <p className="text-right font-mono font-black text-emerald-400">{formatRupiah(inventorySummary.totalStockValue)}</p>
                                <p className="text-right text-[9px] text-amber-300 font-mono">-{formatRupiah(inventorySummary.totalUsageValue)}</p>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Tabel Aset Tetap & Peralatan */}
                  {inventorySummary.assets.length > 0 && (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-blue-600" />
                            Daftar Aset Tetap & Peralatan Usaha
                          </h4>
                          <p className="text-[10px] text-slate-500">Mesin, peralatan, furnitur & investasi aset jangka panjang</p>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                          {inventorySummary.assets.length} Aset
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[580px]">
                          <thead>
                            <tr className="bg-blue-50 text-[10px] font-black text-blue-900 uppercase">
                              <th className="text-left px-3 py-2 rounded-l-xl">Nama Aset</th>
                              <th className="text-center px-2 py-2">Qty</th>
                              <th className="text-center px-2 py-2">Satuan</th>
                              <th className="text-right px-2 py-2">Harga Perolehan/Unit</th>
                              <th className="text-right px-3 py-2 rounded-r-xl">Nilai Buku Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inventorySummary.assets.map((asset) => (
                              <tr key={asset.id} className="hover:bg-blue-50/40 transition-colors">
                                <td className="px-3 py-2.5">
                                  <p className="font-bold text-slate-900 leading-tight">{asset.name}</p>
                                  {asset.acquisition_date && <p className="text-[10px] text-slate-400">Perolehan: {asset.acquisition_date}</p>}
                                </td>
                                <td className="px-2 py-2.5 text-center font-mono font-bold text-blue-800">{asset.qty}</td>
                                <td className="px-2 py-2.5 text-center text-slate-500">{asset.unit}</td>
                                <td className="px-2 py-2.5 text-right font-mono text-slate-700">{formatRupiah(asset.cost_price)}</td>
                                <td className="px-3 py-2.5 text-right font-mono font-black text-blue-900">{formatRupiah(asset.qty * asset.cost_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-blue-900 text-white">
                              <td colSpan={4} className="px-3 py-2 rounded-bl-xl font-black text-xs uppercase">TOTAL NILAI ASET TETAP (NILAI BUKU)</td>
                              <td className="px-3 py-2 rounded-br-xl text-right font-mono font-black text-blue-200">{formatRupiah(inventorySummary.totalAssetValue)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Reconciliation note */}
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-[10px] text-blue-900 font-bold flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
                        <span>Nilai aset tetap ini juga tercermin di <strong>Neraca → Aset Tetap (Fixed Assets)</strong> sebesar {formatRupiah(inventorySummary.totalAssetValue)} — konsisten dan terhubung secara otomatis.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
                IF PERSONAL MODE: RENDER PERSONAL CASHFLOW & BUDGET CARDS
               ========================================================================= */
            <div className="flex flex-col gap-4">
              {/* 4. TOTAL PEMASUKAN & TOTAL PENGELUARAN CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CARD TOTAL PEMASUKAN */}
                <div
                  onClick={() => {
                    setTxSearchQuery('');
                    setTransactionListModal('income');
                  }}
                  className="bg-emerald-500/10 border-2 border-emerald-300/80 hover:border-emerald-500 p-4 rounded-3xl transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">Total Pemasukan Pribadi</h4>
                        <p className="text-[10px] text-emerald-700 font-bold">
                          {periodType === 'monthly'
                            ? `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`
                            : `Tahun ${selectedYear}`}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:scale-105 transition-transform">
                      <Eye className="w-3 h-3" /> Lihat Detail
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-black font-mono text-emerald-800">
                      +{formatRupiah(currentIncome)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-extrabold mt-1 flex items-center gap-1">
                      <span>Klik untuk membuka rincian pemasukan & simpan bukti input</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>

                {/* CARD TOTAL PENGELUARAN */}
                <div
                  onClick={() => {
                    setTxSearchQuery('');
                    setTransactionListModal('expense');
                  }}
                  className="bg-rose-500/10 border-2 border-rose-300/80 hover:border-rose-500 p-4 rounded-3xl transition-all cursor-pointer group shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-rose-950">Total Pengeluaran Pribadi</h4>
                        <p className="text-[10px] text-rose-700 font-bold">
                          {periodType === 'monthly'
                            ? `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`
                            : `Tahun ${selectedYear}`}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:scale-105 transition-transform">
                      <Eye className="w-3 h-3" /> Lihat Detail
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-black font-mono text-rose-800">
                      -{formatRupiah(currentExpense)}
                    </p>
                    <p className="text-[10px] text-rose-700 font-extrabold mt-1 flex items-center gap-1">
                      <span>Klik untuk membuka rincian pengeluaran & simpan bukti input</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </div>

              {/* SUMMARY NET BALANCE SURPLUS / DEFISIT BANNER */}
              <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Hasil Saldo Bersih Periode Ini
                  </span>
                  <p
                    className={`text-xl font-black font-mono mt-0.5 ${
                      currentNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentNet >= 0 ? '+' : ''}{formatRupiah(currentNet)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-extrabold block">Total Transaksi</span>
                  <span className="text-sm font-black text-white">{periodTxs.length} Transaksi</span>
                </div>
              </div>

              {/* 5. DENGAN PENGANGGARAN COMPARISON TABLE OR TANPA PENGANGGARAN BREAKDOWN */}
              {withBudget ? (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-purple-600" />
                        Perbandingan Realisasi vs Rencana Anggaran
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Evaluasi kepatuhan batas pengeluaran berdasarkan pos anggaran
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Rencana</span>
                      <span className="text-xs font-black text-purple-700">
                        {formatRupiah(budgetData.totalPlannedAmount)}
                      </span>
                    </div>
                  </div>

                  {budgetData.plannedCategoryComparisons.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 my-1">
                      <PieChart className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">
                        Belum Ada Pos Rencana Anggaran untuk Periode Ini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                        Buat rencana anggaran di menu <em>Anggaran</em> untuk mengaktifkan pemantauan perbandingan otomatis.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {budgetData.plannedCategoryComparisons.map((item) => {
                        const isOver = item.selisih < 0;
                        return (
                          <div
                            key={item.category.id}
                            className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-2 hover:bg-slate-100/80 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${item.category.color}20` }}
                                >
                                  <CategoryIcon
                                    name={item.category.icon}
                                    color={item.category.color}
                                    size={16}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {getCategoryDisplayName(item.category.name, language)}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isOver
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isOver ? 'Over Budget' : 'Sesuai Rencana'}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOver ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-3 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                              <div>
                                <span className="text-slate-400 block font-normal">Rencana:</span>
                                <span className="text-slate-900">{formatRupiah(item.planned)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-normal">Realisasi:</span>
                                <span className={isOver ? 'text-rose-600' : 'text-slate-900'}>
                                  {formatRupiah(item.actual)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block font-normal">
                                  {isOver ? 'Kelebihan:' : 'Sisa:'}
                                </span>
                                <span className={isOver ? 'text-rose-600' : 'text-emerald-700'}>
                                  {formatRupiah(Math.abs(item.selisih))}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* TANPA PENGANGGARAN CATEGORY BREAKDOWN LIST */
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    Distribusi Pengeluaran Per Kategori
                  </h3>

                  {Object.keys(expenseByCatMap).length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 my-1">
                      <p className="text-xs font-bold text-slate-800">
                        Belum Ada Catatan Pengeluaran untuk Periode Ini
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(expenseByCatMap)
                        .map(([catId, rawAmount]) => {
                          const amount = Number(rawAmount) || 0;
                          return {
                            cat: categories.find((c) => c.id === catId),
                            amount,
                            percent: currentExpense > 0 ? Math.round((amount / currentExpense) * 100) : 0,
                          };
                        })
                        .sort((a, b) => b.amount - a.amount)
                        .map(({ cat, amount, percent }) => (
                          <div
                            key={cat?.id || amount}
                            className="p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat?.color || '#3b82f6'}20` }}
                              >
                                <CategoryIcon name={cat?.icon || 'Tag'} color={cat?.color || '#3b82f6'} size={16} />
                              </div>
                              <span className="text-xs font-black text-slate-900 truncate">
                                {cat ? getCategoryDisplayName(cat.name, language) : 'Pengeluaran Lainnya'}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-rose-700 block font-mono">
                                {formatRupiah(amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">{percent}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. PANEL UTAMA CETAK & EKSPOR LAPORAN (DI AKHIR HALAMAN) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Cetak & Ekspor Laporan Resmi ({entityMode === 'personal' ? 'Pribadi' : 'Bisnis'})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tentukan periode waktu laporan yang ingin dilihat, lalu buka dokumen PDF A4 atau unduh Excel.
                </p>
              </div>
            </div>

            {/* Pilihan Waktu / Periode Laporan */}
            <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Pilih Periode Waktu Laporan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-slate-400">Bulan:</span>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
                    >
                      {MONTH_NAMES_ID.slice(0, now.getMonth() + 1).map((name, idx) => (
                        <option key={idx} value={idx}>
                          {name} {idx === now.getMonth() ? '(Bulan Ini)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-slate-400">Tahun:</span>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          Tahun {yr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons: Unduh PDF Langsung, Lihat PDF Modal & Unduh Excel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDirectDownloadingPdf}
                onClick={handleDirectDownloadPdf}
                className="py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-75"
              >
                {isDirectDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-rose-200" />
                )}
                <span>{isDirectDownloadingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF Resmi (A4)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-200" />
                <span>Lihat Pratinjau Dokumen</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh Spreadsheet (.csv)</span>
              </button>
            </div>

            {/* Discreet Simulation Helper */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">Format SAK EMKM / IAS 7 siap cetak di kertas A4</span>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Muat data contoh simulasi dari 1 Januari sampai HARI INI untuk Pribadi dan seluruh jenis bisnis?'
                    )
                  ) {
                    db.seedAnnualSampleData(selectedYear || new Date().getFullYear(), new Date());
                    window.location.reload();
                  }
                }}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Muat Data Contoh</span>
              </button>
            </div>
          </div>

      {/* 7. MODAL LIST TRANSAKSI (PEMASUKAN / PENGELUARAN) WITH PROOF INPUT DOWNLOAD LINK */}
      {transactionListModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div
              className={`px-5 py-4 text-white flex items-center justify-between shrink-0 ${
                transactionListModal === 'income' ? 'bg-emerald-900' : 'bg-rose-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    transactionListModal === 'income' ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                  }`}
                >
                  {transactionListModal === 'income' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-white truncate">
                    Daftar {transactionListModal === 'income' ? 'Pemasukan' : 'Pengeluaran'} Periode Laporan
                  </h3>
                  <p className="text-[10px] text-slate-200 font-medium">
                    {periodType === 'monthly'
                      ? `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`
                      : `Tahun ${selectedYear}`}{' '}
                    • {modalTransactions.length} Transaksi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTransactionListModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  placeholder="Cari transaksi atau kategori..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="p-4 overflow-y-auto flex flex-col gap-2.5 max-h-[60vh]">
              {modalTransactions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 my-2">
                  <p className="text-xs font-bold text-slate-700">Tidak ada transaksi ditemukan</p>
                  <p className="text-[10px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                </div>
              ) : (
                modalTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const catName = cat ? getCategoryDisplayName(cat.name, language) : 'Transaksi';
                  const hasProof = !!tx.attachment_path;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (onSelectTransaction) {
                          onSelectTransaction(tx);
                        }
                        setTransactionListModal(null);
                      }}
                      className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group flex flex-col gap-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat?.color || '#64748b'}20`, color: cat?.color || '#64748b' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} color={cat?.color || '#64748b'} size={16} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-900 truncate group-hover:text-blue-700">
                              {catName}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate">
                              {tx.description || formatDateIndonesian(tx.date, language)} • {acc?.name || 'Kas'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-black font-mono ${
                              tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Footer Badge: Has Proof Image or Click for Detail */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">
                          {formatDateIndonesian(tx.date, language)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {tx.source_type === 'receipt' ? (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold text-[9px] flex items-center gap-1">
                              🧾 Struk Kasir
                            </span>
                          ) : tx.source_type === 'statement' ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-md font-bold text-[9px] flex items-center gap-1">
                              🏦 M-Banking
                            </span>
                          ) : tx.source_type === 'voice' ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-bold text-[9px] flex items-center gap-1">
                              🎤 Form Suara
                            </span>
                          ) : tx.source_type === 'handwritten' ? (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded-md font-bold text-[9px] flex items-center gap-1">
                              ✍️ Tulisan Tangan
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md font-bold text-[9px] flex items-center gap-1">
                              📝 Form Manual
                            </span>
                          )}
                          <span className="font-extrabold text-blue-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Buka Bukti <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 text-center">
              <p className="text-[10px] text-slate-500 font-bold">
                💡 Klik transaksi mana saja untuk membuka halaman rincian & mengunduh ulang bukti foto/struk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. MONTHLY REPORT PRINT & EXPORT MODAL */}
      <MonthlyReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        budgets={budgets}
        budgetItems={budgetItems}
        inventoryItems={inventoryItems}
        activeMode={entityMode}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        initialAccountId={selectedAccountId}
      />
    </div>
  );
};
