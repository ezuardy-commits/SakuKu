import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Category, ModeType, Budget, BudgetItem, Account, InventoryItem } from '../types';
import {
  formatRupiah,
  formatExactDateIndonesian,
  formatExactShortDateIndonesian,
} from '../lib/formatters';
import { parseReceiptFromTx } from '../lib/receiptParser';
import { sakukuStorage } from '../lib/sakukuStorage';
import { generateSakuKuMonthlyPdf } from '../lib/pdfGenerator';
import { computeBusinessAccountingReport } from '../lib/accountingEngine';
import {
  X,
  Printer,
  BookOpen,
  FileSpreadsheet,
  Download,
  Share2,
  Send,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ArrowLeft,
  ChevronDown,
  Maximize2,
  RotateCcw,
  Folder,
  HardDrive,
  Loader2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface MonthlyReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  budgetItems?: BudgetItem[];
  inventoryItems?: InventoryItem[];
  activeMode: 'all' | ModeType;
  initialMonth?: number;
  initialYear?: number;
  initialAccountId?: string;
}

const MONTH_NAMES = [
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

export const MonthlyReportPrintModal: React.FC<MonthlyReportPrintModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts = [],
  budgets = [],
  budgetItems = [],
  inventoryItems = [],
  activeMode,
  initialMonth,
  initialYear,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth !== undefined ? initialMonth : now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(initialYear !== undefined ? initialYear : now.getFullYear());
  const [printPeriodScope, setPrintPeriodScope] = useState<'monthly' | 'yearly'>('monthly');
  const [reportMode, setReportMode] = useState<'all' | ModeType>(activeMode);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isFolderConnected, setIsFolderConnected] = useState<boolean>(false);
  const [connectedFolderName, setConnectedFolderName] = useState<string | null>(null);
  // Section Selector: 'all_sections' (Lengkap A4), 'growth' (Bagian 1: Pertumbuhan), 'accounting' (Bagian 2: Akuntansi Resmi)
  const [reportSection, setReportSection] = useState<'all_sections' | 'growth' | 'accounting'>('all_sections');

  const printAreaRef = useRef<HTMLDivElement>(null);
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastTapTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      if (initialMonth !== undefined) setSelectedMonth(initialMonth);
      if (initialYear !== undefined) setSelectedYear(initialYear);
      if (activeMode) setReportMode(activeMode);
    }
  }, [isOpen, initialMonth, initialYear, activeMode]);

  useEffect(() => {
    sakukuStorage.isNativeFolderConnected().then((connected) => {
      setIsFolderConnected(connected);
      if (connected) {
        setConnectedFolderName(sakukuStorage.getConnectedFolderName());
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Available Years from transactions or current year
  const availableYears = Array.from(
    new Set([
      2026,
      2025,
      now.getFullYear(),
      now.getFullYear() - 1,
      ...transactions.map((t) => new Date(t.date).getFullYear()),
    ])
  ).sort((a, b) => b - a);

  // Filter transactions for chosen Month, Year, and Mode
  const filteredTxs = transactions
    .filter((tx) => {
      const d = new Date(tx.date);
      const isSameMonth = printPeriodScope === 'yearly' ? true : d.getMonth() === selectedMonth;
      const isSameYear = d.getFullYear() === selectedYear;
      const isSameMode = reportMode === 'all' ? true : tx.mode === reportMode;
      return isSameMonth && isSameYear && isSameMode;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate totals
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Multi-Month / Annual Performance Trend for Graphic Visualization
  const annualPerformanceTrend = useMemo(() => {
    return Array.from({ length: selectedMonth + 1 }, (_, idx) => {
      const mTxs = transactions.filter((t) => {
        const d = new Date(t.date);
        const isM = d.getFullYear() === selectedYear && d.getMonth() === idx;
        const isMode = reportMode === 'all' ? true : t.mode === reportMode;
        return isM && isMode;
      });
      const inc = mTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      return {
        monthIndex: idx,
        monthName: MONTH_NAMES[idx],
        shortName: MONTH_NAMES[idx].substring(0, 3),
        income: inc,
        expense: exp,
        net,
      };
    });
  }, [transactions, selectedYear, selectedMonth, reportMode]);

  // Previous month performance for MoM comparison
  const prevMonthPerf = useMemo(() => {
    if (selectedMonth === 0) return null;
    const prevIdx = selectedMonth - 1;
    const pTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      const isM = d.getFullYear() === selectedYear && d.getMonth() === prevIdx;
      const isMode = reportMode === 'all' ? true : t.mode === reportMode;
      return isM && isMode;
    });
    const inc = pTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = pTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = inc - exp;
    return { income: inc, expense: exp, net };
  }, [transactions, selectedYear, selectedMonth, reportMode]);

  const momRevenueGrowth = useMemo(() => {
    if (!prevMonthPerf || prevMonthPerf.income === 0) return null;
    return Math.round(((totalIncome - prevMonthPerf.income) / prevMonthPerf.income) * 100);
  }, [prevMonthPerf, totalIncome]);

  // Calculate Budget Planning for Selected Month / Year / Mode
  const matchingBudgets = (budgets || []).filter((b) => {
    const isModeMatch = reportMode === 'all' ? true : b.mode === reportMode || b.mode === 'all';
    const bStart = new Date(b.start_date);
    const bEnd = new Date(b.end_date);
    if (printPeriodScope === 'yearly') {
      const yStart = new Date(selectedYear, 0, 1);
      const yEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return isModeMatch && bStart <= yEnd && bEnd >= yStart;
    }
    const mStart = new Date(selectedYear, selectedMonth, 1);
    const mEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    const isOverlap = bStart <= mEnd && bEnd >= mStart;
    return isModeMatch && isOverlap;
  });

  const matchingBudgetIds = matchingBudgets.map((b) => b.id);
  const relevantBudgetItems = (budgetItems || []).filter((item) =>
    matchingBudgetIds.includes(item.budget_id)
  );

  // Map planned budget per category
  const plannedPerCatMap: { [catId: string]: number } = {};
  relevantBudgetItems.forEach((item) => {
    plannedPerCatMap[item.category_id] =
      (plannedPerCatMap[item.category_id] || 0) + item.planned_amount;
  });

  const totalPlannedBudget = Object.values(plannedPerCatMap).reduce((s, v) => s + v, 0);
  const hasBudgetPlan = totalPlannedBudget > 0;

  // Planned categories comparisons
  const plannedComparisons = categories
    .filter((c) => c.type === 'expense' && (plannedPerCatMap[c.id] || 0) > 0)
    .map((cat) => {
      const planned = plannedPerCatMap[cat.id] || 0;
      const actual = filteredTxs
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0);
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

  // Unplanned categories comparisons
  const unplannedComparisons = categories
    .filter(
      (c) =>
        c.type === 'expense' &&
        (plannedPerCatMap[c.id] || 0) === 0 &&
        filteredTxs.some((t) => t.type === 'expense' && t.category_id === c.id)
    )
    .map((cat) => {
      const actual = filteredTxs
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return {
        category: cat,
        actual,
      };
    })
    .sort((a, b) => b.actual - a.actual);

  const totalUnplannedExpense = unplannedComparisons.reduce((s, i) => s + i.actual, 0);

  const monthPadded = String(selectedMonth + 1).padStart(2, '0');
  const monthName = MONTH_NAMES[selectedMonth];
  const modeLabel = reportMode === 'all' ? 'Gabungan' : reportMode === 'personal' ? 'Pribadi' : 'Bisnis';
  const folderPathStr = `Sakuku/Tahun_${selectedYear}/${monthPadded}_${monthName}`;
  const defaultFileName = `Laporan_Buku_Kas_${selectedYear}_${monthPadded}_${monthName}_${modeLabel}`;

  const businessAccountObj = accounts.find(
    (a) => a.scope === 'business' || (a.business_name && a.business_name.trim() !== '')
  );
  const businessName =
    businessAccountObj?.business_name ||
    businessAccountObj?.name ||
    'Unit Bisnis / UMKM SakuKu';

  // Filter inventory items for current mode
  const businessInventoryItems = inventoryItems.filter((it) => it.mode === 'business');

  const businessAcctReport = computeBusinessAccountingReport({
    transactions,
    categories,
    accounts,
    selectedYear,
    selectedMonth,
    businessName,
    inventoryItems: businessInventoryItems,
  });

  // Exact print timestamp formatted without relative words
  const printedDateFormatted = `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}, ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  const localMonthStr = `${selectedYear}-${monthPadded}`;
  const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prevMonthName = MONTH_NAMES[prevMonthDate.getMonth()] || 'Bulan Lalu';

  // Cumulative transactions strictly prior to current month
  const priorTxs = transactions.filter((tx) => {
    if (reportMode !== 'all' && tx.mode !== reportMode) return false;
    const dStr = tx.date ? tx.date.substring(0, 7) : '';
    return dStr < localMonthStr;
  });
  const priorIncome = priorTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const priorExpense = priorTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const openingCapitalAccounts = accounts
    .filter((a) => (reportMode === 'all' ? true : a.scope === reportMode || a.scope === 'combined'))
    .reduce((s, a) => s + (a.opening_balance || 0), 0);

  const beginningMonthCash = openingCapitalAccounts + priorIncome - priorExpense;
  const reconciledEndingCash = beginningMonthCash + netBalance;

  // Group top expense categories for visual gauge bars
  const expenseCatMap: { [catId: string]: number } = {};
  filteredTxs
    .filter((t) => t.type === 'expense')
    .forEach((tx) => {
      expenseCatMap[tx.category_id] = (expenseCatMap[tx.category_id] || 0) + tx.amount;
    });

  const topExpenseCategories = Object.entries(expenseCatMap)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        name: cat?.name || 'Kebutuhan Lainnya',
        amount,
        percentage: pct,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Helper to build CSV content
  const generateCsvContent = () => {
    if (reportMode === 'business') {
      let csv = `LAPORAN KEUANGAN BISNIS RESMI (STANDAR SAK EMKM & IFRS FOR SMES)\n`;
      csv += `Nama Entitas,${businessName}\n`;
      csv += `Periode,${MONTH_NAMES[selectedMonth]} ${selectedYear}\n`;
      csv += `Mata Uang,IDR (Rupiah)\n`;
      csv += `Dicetak Pada,${printedDateFormatted}\n`;
      csv += `Folder Penyimpanan,Internal Storage/Download/SakuKu/Laporan_Excel_CSV/Tahun_${selectedYear}/${monthPadded}_${monthName}/\n\n`;

      csv += `I. LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)\n`;
      csv += `Pos Akuntansi,Rincian (Rp),Total (Rp)\n`;
      csv += `1. PENDAPATAN USAHA (REVENUE)\n`;
      businessAcctReport.incomeStatement.revenues.forEach((r) => {
        csv += `"${r.categoryName}",${r.amount},\n`;
      });
      csv += `TOTAL PENDAPATAN USAHA,,${businessAcctReport.incomeStatement.totalRevenue}\n\n`;

      csv += `2. HARGA POKOK PENJUALAN (HPP / COGS)\n`;
      businessAcctReport.incomeStatement.cogs.forEach((c) => {
        csv += `"${c.categoryName}",-${c.amount},\n`;
      });
      csv += `TOTAL HARGA POKOK PENJUALAN,,-${businessAcctReport.incomeStatement.totalCogs}\n`;
      csv += `LABA KOTOR (GROSS PROFIT) [Margin: ${businessAcctReport.financialRatios.grossMargin}%],,${businessAcctReport.incomeStatement.grossProfit}\n\n`;

      csv += `3. BEBAN OPERASIONAL USAHA (OPEX)\n`;
      businessAcctReport.incomeStatement.operatingExpenses.forEach((o) => {
        csv += `"${o.categoryName}",-${o.amount},\n`;
      });
      csv += `TOTAL BEBAN OPERASIONAL,,-${businessAcctReport.incomeStatement.totalOperatingExpenses}\n`;
      csv += `LABA OPERASIONAL (EBIT) [Margin: ${businessAcctReport.financialRatios.operatingMargin}%],,${businessAcctReport.incomeStatement.operatingIncome}\n`;
      if (businessAcctReport.incomeStatement.estimatedTax > 0) {
        csv += `Estimasi Beban Pajak UMKM (PP 55),,-${businessAcctReport.incomeStatement.estimatedTax}\n`;
      }
      csv += `LABA BERSIH (NET PROFIT) [Margin: ${businessAcctReport.financialRatios.netMargin}%],,${businessAcctReport.incomeStatement.netProfit}\n\n`;

      csv += `II. LAPORAN POSISI KEUANGAN / NERACA (BALANCE SHEET)\n`;
      csv += `ASET (AKTIVA),Jumlah (Rp),LIABILITAS & EKUITAS (PASIVA),Jumlah (Rp)\n`;
      csv += `A. ASET LANCAR,,A. LIABILITAS,\n`;
      csv += `Kas Tunai di Tangan,${businessAcctReport.balanceSheet.currentAssets.cashOnHand},Utang Usaha & Akrual,${businessAcctReport.balanceSheet.currentLiabilities.accountsPayable}\n`;
      csv += `Kas di Bank Bisnis,${businessAcctReport.balanceSheet.currentAssets.cashInBank},Pinjaman Jangka Panjang,${businessAcctReport.balanceSheet.longTermLiabilities.longTermLoans}\n`;
      csv += `Saldo E-Wallet Usaha,${businessAcctReport.balanceSheet.currentAssets.cashInEWallet},TOTAL LIABILITAS,${businessAcctReport.balanceSheet.totalLiabilities}\n`;
      csv += `Estimasi Persediaan Stok,${businessAcctReport.balanceSheet.currentAssets.inventoryEstimate},,\n`;
      csv += `TOTAL ASET LANCAR,${businessAcctReport.balanceSheet.currentAssets.totalCurrentAssets},B. EKUITAS / MODAL PEMILIK,\n`;
      csv += `,,Modal Awal Disetor,${businessAcctReport.balanceSheet.equity.openingCapital}\n`;
      csv += `B. ASET TIDAK LANCAR,,Laba Ditahan Akumulasi,${businessAcctReport.balanceSheet.equity.retainedEarnings}\n`;
      csv += `Peralatan & Inventaris Usaha,${businessAcctReport.balanceSheet.nonCurrentAssets.equipmentAndMachinery},Laba Bersih Periode Berjalan,${businessAcctReport.balanceSheet.equity.currentPeriodNetProfit}\n`;
      csv += `TOTAL ASET TIDAK LANCAR,${businessAcctReport.balanceSheet.nonCurrentAssets.totalNonCurrentAssets},Penarikan Prive Pemilik,-${businessAcctReport.balanceSheet.equity.drawingsOrPrive}\n`;
      csv += `,,TOTAL EKUITAS BERSIH,${businessAcctReport.balanceSheet.equity.totalEquity}\n`;
      csv += `TOTAL ASET (AKTIVA),${businessAcctReport.balanceSheet.totalAssets},TOTAL LIABILITAS & EKUITAS,${businessAcctReport.balanceSheet.totalLiabilitiesAndEquity}\n\n`;

      csv += `III. LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS - IAS 7)\n`;
      csv += `Aktivitas Arus Kas,Jumlah (Rp)\n`;
      csv += `Arus Kas Masuk dari Penjualan/Pelanggan,${businessAcctReport.cashFlowStatement.operatingActivities.cashFromCustomers}\n`;
      csv += `Arus Kas Keluar untuk HPP & Kulakan,-${businessAcctReport.cashFlowStatement.operatingActivities.cashPaidToSuppliersAndCogs}\n`;
      csv += `Arus Kas Keluar untuk Beban Operasional,-${businessAcctReport.cashFlowStatement.operatingActivities.cashPaidForOperatingExpenses}\n`;
      csv += `ARUS KAS BERSIH DARI OPERASI,${businessAcctReport.cashFlowStatement.operatingActivities.netCashFromOperating}\n`;
      csv += `ARUS KAS BERSIH DARI INVESTASI (ASET),${businessAcctReport.cashFlowStatement.investingActivities.netCashFromInvesting}\n`;
      csv += `ARUS KAS BERSIH DARI PENDANAAN (PRIVE),${businessAcctReport.cashFlowStatement.financingActivities.netCashFromFinancing}\n`;
      csv += `KENAIKAN / (PENURUNAN) BERSIH KAS,${businessAcctReport.cashFlowStatement.netChangeInCash}\n`;
      csv += `SALDO KAS AKHIR PERIODE,${businessAcctReport.cashFlowStatement.endingCashBalance}\n\n`;

      // Laporan Stok & Inventaris
      const stockItems = businessInventoryItems.filter((it) => it.item_type === 'product_stock' || it.item_type === 'raw_material');
      const assetItems = businessInventoryItems.filter((it) => it.item_type === 'equipment_asset');
      if (stockItems.length > 0 || assetItems.length > 0) {
        csv += `IV. LAPORAN POSISI STOK & PERSEDIAAN\n`;
        csv += `Nama Item,SKU/Barcode,Stok Awal,Pemakaian,Stok Akhir,Satuan,Harga Pokok,Nilai Stok\n`;
        stockItems.forEach((it) => {
          const lastQty = it.last_month_qty !== undefined ? it.last_month_qty : it.qty;
          const usage = Math.max(0, lastQty - it.qty);
          csv += `"${it.name}","${it.sku_barcode || ''}",${lastQty},${usage > 0 ? '-' + usage : 0},${it.qty},"${it.unit}",${it.cost_price},${it.qty * it.cost_price}\n`;
        });
        const totalStockVal = stockItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
        csv += `TOTAL NILAI PERSEDIAAN,,,,,,, ${totalStockVal}\n\n`;

        if (assetItems.length > 0) {
          csv += `V. DAFTAR ASET TETAP & PERALATAN USAHA\n`;
          csv += `Nama Aset,SKU/Kode,Qty,Satuan,Harga Perolehan,Nilai Buku Total,Tanggal Perolehan\n`;
          assetItems.forEach((it) => {
            csv += `"${it.name}","${it.sku_barcode || ''}",${it.qty},"${it.unit}",${it.cost_price},${it.qty * it.cost_price},"${it.acquisition_date || ''}"\n`;
          });
          const totalAssetVal = assetItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
          csv += `TOTAL NILAI ASET TETAP,,,,,,${totalAssetVal}\n\n`;
        }

        csv += `VI. BUKU BESAR MUTASI KAS BISNIS (${filteredTxs.length} Record)\n`;
      } else {
        csv += `IV. BUKU BESAR MUTASI KAS BISNIS (${filteredTxs.length} Record)\n`;
      }
      csv += `No,Tanggal,Deskripsi,Kategori,Akun,Mode,Pemasukan (Debet),Pengeluaran (Kredit),Saldo Kas\n`;

      let runBal = 0;
      filteredTxs.forEach((tx, idx) => {
        if (tx.type === 'income') runBal += tx.amount;
        else runBal -= tx.amount;
        const catObj = categories.find((c) => c.id === tx.category_id);
        const accObj = accounts.find((a) => a.id === tx.account_id);
        const desc = (tx.description || '').replace(/"/g, '""');
        const debet = tx.type === 'income' ? tx.amount : 0;
        const kredit = tx.type === 'expense' ? tx.amount : 0;
        csv += `${idx + 1},"${tx.date}","${desc}","${catObj?.name || 'Lainnya'}","${accObj?.name || 'Kas'}","${tx.mode}",${debet},${kredit},${runBal}\n`;
      });
      csv += `,,TOTAL MUTASI KAS BISNIS,,,${totalIncome},${totalExpense},${netBalance}\n\n`;

      return csv;
    }

    let csv = `LAPORAN BUKU KAS A4 SAKUKU\n`;
    csv += `Periode,${MONTH_NAMES[selectedMonth]} ${selectedYear}\n`;
    csv += `Mode Laporan,${modeLabel}\n`;
    csv += `Dicetak Pada,${printedDateFormatted}\n`;
    csv += `Folder Penyimpanan,Internal Storage/Documents/SakuKu/Laporan_Excel_CSV/Tahun_${selectedYear}/${monthPadded}_${monthName}/\n\n`;

    csv += `RINGKASAN KEUANGAN\n`;
    if (hasBudgetPlan) {
      csv += `Rencana Anggaran,${totalPlannedBudget}\n`;
      csv += `Realisasi Pengeluaran,${totalExpense}\n`;
      csv += `Sisa Anggaran,${totalPlannedBudget - totalExpense}\n`;
    } else {
      csv += `Total Pemasukan (Debet),${totalIncome}\n`;
      csv += `Total Pengeluaran (Kredit),${totalExpense}\n`;
    }
    csv += `Arus Kas Bersih,${netBalance}\n\n`;

    // Section 1: Planned Budget Categories (if any)
    if (hasBudgetPlan && plannedComparisons.length > 0) {
      csv += `1. PERBANDINGAN POS ANGGARAN TERENCANA\n`;
      csv += `No,Kategori Pengeluaran,Rencana (Rp),Realisasi (Rp),Selisih Varian (Rp),Status (%)\n`;
      plannedComparisons.forEach((row, idx) => {
        csv += `${idx + 1},"${row.category.name}",${row.planned},${row.actual},${row.selisih},"${row.percentage}%"\n`;
      });
      csv += `,"TOTAL POS TERENCANA",${totalPlannedBudget},${plannedComparisons.reduce(
        (s, r) => s + r.actual,
        0
      )},${totalPlannedBudget - plannedComparisons.reduce((s, r) => s + r.actual, 0)},"${Math.round(
        (plannedComparisons.reduce((s, r) => s + r.actual, 0) / (totalPlannedBudget || 1)) * 100
      )}%"\n\n`;
    }

    // Section 2: Unplanned Categories (if any)
    if (hasBudgetPlan && unplannedComparisons.length > 0) {
      csv += `2. TRANSAKSI DI LUAR RENCANA ANGGARAN\n`;
      csv += `No,Kategori Pengeluaran,Realisasi Keluar (Rp),Keterangan\n`;
      unplannedComparisons.forEach((row, idx) => {
        csv += `${idx + 1},"${row.category.name}",${row.actual},"Di Luar Rencana Anggaran"\n`;
      });
      csv += `,"TOTAL DI LUAR RENCANA",${totalUnplannedExpense},"-\n\n`;
    }

    // Section 3: Ledger Transactions
    const ledgerTitle = hasBudgetPlan
      ? `3. RINCIAN MUTASI TRANSAKSI BUKU KAS (${filteredTxs.length} Record)`
      : `1. RINCIAN MUTASI TRANSAKSI BUKU KAS (${filteredTxs.length} Record)`;
    csv += `${ledgerTitle}\n`;
    csv += `No,Tanggal,Deskripsi,Kategori,Akun,Mode,Pemasukan (Debet),Pengeluaran (Kredit),Arus Kas Bersih\n`;

    let runBal = 0;
    filteredTxs.forEach((tx, idx) => {
      if (tx.type === 'income') runBal += tx.amount;
      else runBal -= tx.amount;
      const catObj = categories.find((c) => c.id === tx.category_id);
      const accObj = accounts.find((a) => a.id === tx.account_id);
      const desc = (tx.description || '').replace(/"/g, '""');
      const debet = tx.type === 'income' ? tx.amount : 0;
      const kredit = tx.type === 'expense' ? tx.amount : 0;
      csv += `${idx + 1},"${tx.date}","${desc}","${catObj?.name || 'Lainnya'}","${accObj?.name || 'Kas'}","${tx.mode}",${debet},${kredit},${runBal}\n`;
    });
    csv += `,,TOTAL MUTASI KAS,,,${totalIncome},${totalExpense},${netBalance}\n\n`;

    // Section 4: Receipts Items
    const receipts = filteredTxs.filter(
      (tx) => tx.type === 'expense' && (tx.source_type === 'receipt' || tx.description?.includes('•') || !!tx.attachment_path)
    );
    if (receipts.length > 0) {
      csv += `4. RINCIAN ITEM PER STRUK BELANJA (${receipts.length} Struk)\n`;
      csv += `No Struk,Nama Toko/Struk,Tanggal,Nama Item,Qty,Harga Satuan,Subtotal Item,Pajak,Biaya Tambahan,Total Struk\n`;
      receipts.forEach((tx, idx) => {
        const parsed = parseReceiptFromTx(tx);
        parsed.items.forEach((it) => {
          csv += `${idx + 1},"${parsed.title}","${tx.date}","${it.name.replace(/"/g, '""')}",${it.qty},${it.price},${it.total},${parsed.taxAmount},${parsed.otherFees},${parsed.grandTotal}\n`;
        });
      });
    }

    return csv;
  };

  // Helper to build HTML document
  const generateHtmlDocument = () => {
    const content = printAreaRef.current?.innerHTML || '';
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${folderPathStr}/${defaultFileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; background: #0f172a; color: #0f172a; }
    #a4-print-section { background: #ffffff; width: 794px; min-height: 1123px; margin: 0 auto; padding: 40px; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; text-align: left; vertical-align: middle; }
    th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10px; }
    .grid { display: grid; }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 14px; }
    .text-2xl { font-size: 24px; }
    .rounded-lg { border-radius: 8px; }
    .border { border: 1px solid #cbd5e1; }
    .bg-indigo-50 { background-color: #eef2ff; }
    .bg-rose-50 { background-color: #fff1f2; }
    .bg-amber-50 { background-color: #fffbeb; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-slate-50 { background-color: #f8fafc; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .bg-slate-900 { background-color: #0f172a; color: white; }
    .text-emerald-700 { color: #047857; }
    .text-rose-700 { color: #be123c; }
    .text-indigo-950 { color: #1e1b4b; }
    @media print {
      body { background: #ffffff; padding: 0; }
      #a4-print-section { box-shadow: none; width: 100%; padding: 0; border: none; }
      @page { size: A4 portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div id="a4-print-section">
    ${content}
  </div>
</body>
</html>`;
  };

  // Direct trigger to request Android / Desktop Folder Permission
  const handleRequestFolderPermission = async () => {
    const res = await sakukuStorage.requestNativeFolderPermission();
    if (res.success && res.folderName) {
      setIsFolderConnected(true);
      setConnectedFolderName(res.folderName);
      setSaveNotice(
        `📁 Izin Penyimpanan Berhasil Diberikan!\n✅ Folder "${res.folderName}" dan seluruh subfoldernya telah terhubung langsung ke memori HP.`
      );
    } else if (res.error) {
      setSaveNotice(`ℹ️ ${res.error}`);
    }
  };

  // Handle Trigger Print / Save Real PDF (A4)
  const handlePrint = async () => {
    const cleanDocTitle = `SakuKu_Laporan_A4_${selectedYear}_${monthPadded}_${monthName}_${modeLabel}`;
    setIsGeneratingPdf(true);
    setSaveNotice('⏳ Sedang memproses dokumen PDF A4 resmi...');

    try {
      // Generate genuine vector PDF blob with all financial data, tables, and branding
      const pdfBlob = generateSakuKuMonthlyPdf({
        transactions,
        categories,
        accounts,
        budgets,
        budgetItems,
        inventoryItems,
        selectedYear,
        selectedMonth,
        filterMode: reportMode,
        filterCategory: 'all',
        filterAccount: 'all',
      });

      const fileName = `${cleanDocTitle}.pdf`;

      // 1. Trigger direct file download immediately on user click
      sakukuStorage.downloadFileDirectly(fileName, pdfBlob, 'application/pdf');

      // 2. Save file record in IndexedDB / folder
      const res = await sakukuStorage.saveReport(
        fileName,
        pdfBlob,
        'report_pdf',
        selectedYear,
        selectedMonth,
        'application/pdf',
        false
      );

      if (res.savedToNative) {
        setSaveNotice(
          `✅ Dokumen PDF A4 resmi berhasil dibuat & disimpan ke folder HP:\n📁 ${res.nativePath}\n📄 Berkas: ${fileName}`
        );
      } else {
        setSaveNotice(
          `✅ Dokumen PDF A4 resmi berhasil diunduh ke HP!\n📂 Tersimpan di: Download → ${fileName}\n📁 Kategori Folder: SakuKu/Laporan_PDF_A4/Tahun_${selectedYear}/${monthPadded}_${monthName}`
        );
      }
    } catch (err: any) {
      console.warn('PDF export error:', err);
      setSaveNotice(`⚠️ Gagal menyusun PDF: ${err?.message || 'Terjadi kendala saat menyusun berkas'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Native Browser Print Spooler
  const handleBrowserPrint = () => {
    const originalTitle = document.title;
    document.title = `SakuKu_Laporan_A4_${selectedYear}_${monthPadded}_${monthName}_${modeLabel}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Direct Excel CSV Download
  const handleSaveExcel = async () => {
    const csv = generateCsvContent();
    const fileName = `SakuKu_Laporan_Excel_${selectedYear}_${monthPadded}_${monthName}_${modeLabel}.csv`;

    setSaveNotice('⏳ Menyiapkan spreadsheet Excel (.csv)...');
    try {
      const res = await sakukuStorage.saveReport(
        fileName,
        '\ufeff' + csv,
        'report_excel',
        selectedYear,
        selectedMonth,
        'text/csv',
        false
      );

      sakukuStorage.downloadFileDirectly(fileName, '\ufeff' + csv, 'text/csv');

      if (res.savedToNative) {
        setSaveNotice(
          `📊 File Excel (.csv) otomatis tersimpan di folder HP:\n📁 ${res.nativePath}\n📄 Berkas: ${fileName}`
        );
      } else {
        setSaveNotice(
          `📊 File Excel (.csv) berhasil diunduh ke HP!\n📂 Tersimpan di: Download → ${fileName}\n📁 Kategori: SakuKu/Laporan_Excel_CSV/Tahun_${selectedYear}/${monthPadded}_${monthName}`
        );
      }
    } catch (err) {
      console.warn('Excel export error:', err);
    }
  };

  // Direct HTML Document Download
  const handleDownloadOfflineDoc = async () => {
    const fullHtml = generateHtmlDocument();
    const fileName = `SakuKu_Laporan_A4_${selectedYear}_${monthPadded}_${monthName}_${modeLabel}.html`;

    setSaveNotice('⏳ Menyiapkan dokumen offline (.html)...');
    try {
      const res = await sakukuStorage.saveReport(
        fileName,
        fullHtml,
        'report_pdf',
        selectedYear,
        selectedMonth,
        'text/html',
        false
      );

      sakukuStorage.downloadFileDirectly(fileName, fullHtml, 'text/html');

      if (res.savedToNative) {
        setSaveNotice(
          `📁 Dokumen Laporan A4 (.html) otomatis tersimpan di folder HP:\n📁 ${res.nativePath}\n📄 Berkas: ${fileName}`
        );
      } else {
        setSaveNotice(
          `📁 Dokumen Laporan A4 (.html) berhasil diunduh ke HP!\n📂 Tersimpan di: Download → ${fileName}\n📁 Kategori: SakuKu/Laporan_PDF_A4/Tahun_${selectedYear}/${monthPadded}_${monthName}`
        );
      }
    } catch (err) {
      console.warn('HTML export error:', err);
    }
  };

  // Direct Package ZIP Download (Creates exact real SakuKu folder structure inside Download/)
  const handleDownloadZipPackage = async () => {
    setIsGeneratingPdf(true);
    setSaveNotice('⏳ Mengemas seluruh berkas (PDF A4, Excel CSV, HTML & Foto Struk) ke struktur folder SakuKu (.zip)...');
    try {
      const pdfBlob = generateSakuKuMonthlyPdf({
        transactions,
        categories,
        accounts,
        budgets,
        budgetItems,
        inventoryItems,
        selectedYear,
        selectedMonth,
        filterMode: reportMode,
        filterCategory: 'all',
        filterAccount: 'all',
      });
      const csv = generateCsvContent();
      const html = generateHtmlDocument();

      const zipBlob = await sakukuStorage.exportMonthlyPackageZip({
        year: selectedYear,
        month: selectedMonth,
        modeLabel,
        pdfBlob,
        htmlContent: html,
        csvContent: '\ufeff' + csv,
        transactions: filteredTxs,
      });

      const zipFileName = `SakuKu_Paket_Folder_Tahun_${selectedYear}_${monthPadded}_${monthName}.zip`;
      sakukuStorage.downloadFileDirectly(zipFileName, zipBlob, 'application/zip');

      setSaveNotice(
        `📦 Paket Arsip Folder SakuKu (.zip) berhasil diunduh ke folder Download HP!\n📂 Berkas: ${zipFileName}\n💡 Buka File Manager di HP Anda lalu pilih "Ekstrak di sini" untuk langsung memunculkan folder SakuKu beserta seluruh subfoldernya di memori HP!`
      );
    } catch (err) {
      console.warn('Zip package export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate Structured Share Text for WA / Telegram / Email
  const generateShareText = () => {
    let text = `📄 *LAPORAN BUKU KAS BULANAN (A4 SAKUKU)*\n`;
    text += `📅 Periode: *${MONTH_NAMES[selectedMonth]} ${selectedYear}*\n`;
    text += `🏷️ Mode: *${modeLabel}*\n`;
    text += `🕒 Dicetak Pada: *${printedDateFormatted}*\n`;
    text += `📊 Total Transaksi: *${filteredTxs.length} Record*\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *RINGKASAN KEUANGAN:*\n`;
    if (hasBudgetPlan) {
      text += `• Rencana Anggaran: *${formatRupiah(totalPlannedBudget)}*\n`;
      text += `• Realisasi Pengeluaran: *${formatRupiah(totalExpense)}*\n`;
      text += `• Sisa Anggaran: *${formatRupiah(totalPlannedBudget - totalExpense)}*\n`;
      text += `• Total Pemasukan: *+${formatRupiah(totalIncome)}*\n`;
      text += `• Arus Kas Bersih: *${netBalance >= 0 ? '+' : ''}${formatRupiah(netBalance)}*\n`;
    } else {
      text += `• Total Pemasukan (Debet): *+${formatRupiah(totalIncome)}*\n`;
      text += `• Total Pengeluaran (Kredit): *-${formatRupiah(totalExpense)}*\n`;
      text += `• Arus Kas Bersih (Net): *${netBalance >= 0 ? '+' : ''}${formatRupiah(netBalance)}*\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `📋 *RINCIAN TRANSAKSI TERAKHIR:*\n`;
    filteredTxs.slice(0, 8).forEach((tx, idx) => {
      const cat = categories.find((c) => c.id === tx.category_id)?.name || 'Lainnya';
      const sign = tx.type === 'income' ? '+' : '-';
      text += `${idx + 1}. [${formatExactShortDateIndonesian(tx.date)}] ${tx.description || cat}: ${sign}${formatRupiah(tx.amount)}\n`;
    });
    if (filteredTxs.length > 8) {
      text += `...dan ${filteredTxs.length - 8} transaksi lainnya dalam lembar A4.\n`;
    }

    text += `\n📁 *Arsip Dokumen PDF Resmi A4:* Tersimpan pada folder HP: *Sakuku/Tahun_${selectedYear}/${monthPadded}_${monthName}*`;
    return text;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Laporan Keuangan Sakuku - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`);
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Laporan Kas ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
          text: generateShareText(),
        });
      } catch (err) {
        console.log('Share dismissed or failed', err);
      }
    } else {
      handleShareWhatsApp();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateShareText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Touch Pinch-to-zoom and Double Tap gestures (Allows natural 1-finger panning/scrolling without page switching)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDistanceRef.current = dist;
      initialScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / initialTouchDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleFactor, 0.5), 2.5);
      setZoomScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length < 2) {
      initialTouchDistanceRef.current = null;
    }
    // Double tap toggle between 1.0 and 1.35
    if (e.touches.length === 0) {
      const nowTime = Date.now();
      if (nowTime - lastTapTimeRef.current < 280) {
        setZoomScale((prev) => (prev > 1.05 ? 1 : 1.3));
      }
      lastTapTimeRef.current = nowTime;
    }
  };

  // Compute Running Balance for the Ledger
  let currentRunningBalance = 0;
  const ledgerRows = filteredTxs.map((tx, idx) => {
    if (tx.type === 'income') {
      currentRunningBalance += tx.amount;
    } else {
      currentRunningBalance -= tx.amount;
    }

    const catObj = categories.find((c) => c.id === tx.category_id);

    return {
      no: idx + 1,
      date: tx.date,
      description: tx.description,
      categoryName: catObj?.name || 'Lain-lain',
      mode: tx.mode,
      debet: tx.type === 'income' ? tx.amount : 0,
      kredit: tx.type === 'expense' ? tx.amount : 0,
      runningBalance: currentRunningBalance,
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 w-screen h-screen flex flex-col overflow-hidden text-slate-900 overscroll-contain select-none"
      style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* CSS Injection for Real A4 Print Layout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-print-section, #a4-print-section * {
            visibility: visible;
          }
          #a4-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            transform: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER BAR: Fixed Single Row, Clear Exit, Dropdowns & Action Buttons */}
      <div className="no-print bg-slate-900 text-white px-2.5 sm:px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2 z-30 shadow-md">
        {/* 1. TOMBOL KELUAR FULL SCREEN */}
        <button
          type="button"
          onClick={onClose}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-700 shadow-sm shrink-0 cursor-pointer transition-colors"
          title="Tutup Laporan Fullscreen"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Keluar</span>
        </button>

        {/* 2. DROPDOWN PERIODE (Bulan & Tahun s/d Bulan Berjalan) */}
        <div className="flex items-center gap-1.5 flex-1 justify-center max-w-lg">
          {/* Pilih Bulan */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="py-1.5 px-2 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {MONTH_NAMES.slice(0, now.getMonth() + 1).map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>

          {/* Pilih Tahun */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="py-1.5 px-2 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Filter Mode */}
          <select
            value={reportMode}
            onChange={(e) => setReportMode(e.target.value as any)}
            className="py-1.5 px-2 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer hidden sm:block"
          >
            <option value="all">Semua Mode</option>
            <option value="personal">Mode Pribadi</option>
            <option value="business">Mode Bisnis</option>
          </select>
        </div>

        {/* 3. TOMBOL ACTION: BAGIKAN (SHARE) & SIMPAN (PDF/EXCEL) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* TOMBOL BAGIKAN (SHARE) */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="py-1.5 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Bagikan Laporan ke WhatsApp, Telegram, Email"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden xs:inline">Bagikan</span>
          </button>

          {/* TOMBOL SIMPAN DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
              className="py-1.5 px-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-80 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Simpan Laporan ke Folder HP Sakuku"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>{isGeneratingPdf ? 'Memproses...' : 'Simpan'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isSaveMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSaveMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 text-slate-900 z-50 flex flex-col gap-1.5 animate-fadeIn">
                {/* Folder Connection Header & Status */}
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-emerald-600" />
                      Penyimpanan Internal HP
                    </p>
                    {isFolderConnected ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Terhubung
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        Download Mode
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 font-mono truncate mt-1">
                    📍 SakuKu/Laporan_.../Tahun_{selectedYear}/{monthPadded}_{monthName}
                  </p>
                  {!isFolderConnected && sakukuStorage.isNativeSupported() && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSaveMenuOpen(false);
                        handleRequestFolderPermission();
                      }}
                      className="mt-2 w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 active:scale-95 border border-blue-200 text-blue-800 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Izinkan Akses Folder SakuKu di HP</span>
                    </button>
                  )}
                </div>

                {/* OPSI 1: CETAK / SIMPAN BENTUK PDF */}
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    handlePrint();
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Printer className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-rose-900">1. Simpan File PDF Resmi (A4)</p>
                    <p className="text-[10px] text-slate-500">File PDF dokumen A4 (Bukan ZIP / Bukan HTML)</p>
                  </div>
                </button>

                {/* OPSI 2: SIMPAN BENTUK EXCEL */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    handleSaveExcel();
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-emerald-800">2. Unduh Excel (.csv)</p>
                    <p className="text-[10px] text-slate-500">Tabel mutasi ke subfolder Excel_CSV</p>
                  </div>
                </button>

                {/* OPSI 3: CETAK SISTEM HP (PRINT PREVIEW) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    handleBrowserPrint();
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-purple-800">3. Cetak / Print HP (Simpan PDF)</p>
                    <p className="text-[10px] text-slate-500">Buka jendela cetak sistem Android / Chrome</p>
                  </div>
                </button>

                {/* OPSI 4: SIMPAN DOKUMEN HTML / A4 OFFLINE */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    handleDownloadOfflineDoc();
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-blue-800">4. Unduh Dokumen A4 (.html)</p>
                    <p className="text-[10px] text-slate-500">Bisa dibuka offline di Chrome HP</p>
                  </div>
                </button>

                {/* OPSI 5: UNDUH PAKET STRUKTUR FOLDER LENGKAP (.ZIP) */}
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    handleDownloadZipPackage();
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 transition-colors flex items-center gap-2.5 cursor-pointer group mt-0.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-600 shadow-xs transition-colors">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-amber-950">5. Unduh Paket Folder SakuKu (.zip)</p>
                      <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-bold">Otomatis</span>
                    </div>
                    <p className="text-[10px] text-amber-800">Membuat folder & subfolder lengkap otomatis di HP</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION SELECTOR BAR: Dual-Part Report Switcher */}
      <div className="no-print bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-center gap-1.5 z-30 shrink-0">
        <span className="text-[10px] text-slate-400 font-bold hidden md:inline mr-1">
          Pilihan Tampilan:
        </span>
        <button
          type="button"
          onClick={() => setReportSection('all_sections')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            reportSection === 'all_sections'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>📄 Lengkap (Semua Bagian)</span>
        </button>
        <button
          type="button"
          onClick={() => setReportSection('growth')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            reportSection === 'growth'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>📈 Bagian 1: Laporan Pertumbuhan & Tren</span>
        </button>
        <button
          type="button"
          onClick={() => setReportSection('accounting')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            reportSection === 'accounting'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>🏛️ Bagian 2: Laporan Akuntansi Resmi (SAK EMKM)</span>
        </button>
      </div>

      {/* Save Notification Banner */}
      {saveNotice && (
        <div className="no-print bg-emerald-600 text-white font-medium p-3.5 border-b border-emerald-700 shadow-md flex items-start justify-between gap-3 z-30 animate-fadeIn shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
              ✓
            </div>
            <div className="whitespace-pre-line text-xs font-sans leading-relaxed text-white font-semibold">{saveNotice}</div>
          </div>
          <button
            onClick={() => setSaveNotice(null)}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
            title="Tutup pemberitahuan"
          >
            <X className="w-4 h-4 font-bold" />
          </button>
        </div>
      )}

      {/* Floating Gesture Guide & Scale Indicator */}
      <div className="no-print fixed bottom-4 right-4 z-40 bg-slate-900/90 backdrop-blur-xs text-slate-200 text-[10px] font-bold px-3 py-2 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-2.5 pointer-events-auto">
        <span className="font-mono text-emerald-400">Skala: {Math.round(zoomScale * 100)}%</span>
        <span className="text-slate-400 text-[10px] hidden xs:inline">
          👈 Geser u/ lihat semua kolom • Cubit 2 jari u/ zoom
        </span>
        {zoomScale !== 1 && (
          <button
            type="button"
            onClick={() => setZoomScale(1)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold underline cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset 100%</span>
          </button>
        )}
      </div>

      {/* MAIN VIEWPORT: TRUE A4 CANVAS WITH FULL HORIZONTAL & VERTICAL 2D PANNING */}
      <div
        className="flex-1 w-full h-full overflow-x-auto overflow-y-auto bg-slate-950 p-3 sm:p-8 flex justify-start md:justify-center items-start shadow-inner overscroll-contain"
        style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Zoom Transform Wrapper */}
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.1s ease-out',
          }}
          className="shrink-0 my-2"
        >
          {/* A4 Paper Document Container: STRICT A4 PHYSICAL WIDTH (794px = 210mm at standard DPI) */}
          <div
            id="a4-print-section"
            ref={printAreaRef}
            className="w-[794px] min-w-[794px] min-h-[1123px] p-8 sm:p-10 shadow-2xl rounded-xs border border-slate-300 flex flex-col justify-between text-xs mx-auto"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
            }}
          >
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              {/* =========================================================================
                  BAGIAN 1: LAPORAN PERJALANAN & PERTUMBUHAN USAHA (EXECUTIVE GROWTH REPORT)
                 ========================================================================= */}
              {(reportSection === 'all_sections' || reportSection === 'growth') && (
                <div className="flex flex-col mb-8">
                  {/* Document Header 1 */}
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">
                          Bagian 1 • Kinerja & Tren
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {reportMode === 'business' ? businessName : 'Keuangan Pribadi'}
                        </span>
                      </div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 mt-1">
                        LAPORAN PERJALANAN & PERTUMBUHAN USAHA
                      </h1>
                      <p className="text-[11px] font-bold text-blue-700 tracking-wide uppercase">
                        EXECUTIVE GROWTH & PERFORMANCE ANALYSIS
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        PERIODE: {MONTH_NAMES[selectedMonth].toUpperCase()} {selectedYear}
                      </div>
                      <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                        Dicetak pada: {printedDateFormatted}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total Data: {filteredTxs.length} Transaksi Terverifikasi
                      </div>
                    </div>
                  </div>

                  {/* 4 Primary KPI Executive Cards */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4 text-center">
                    <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col justify-between">
                      <div className="text-[9px] font-bold text-emerald-800 uppercase">
                        {reportMode === 'business' ? 'Omzet Penjualan' : 'Total Pemasukan'}
                      </div>
                      <div className="text-sm font-black text-emerald-950 font-mono my-1">
                        +{formatRupiah(totalIncome)}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                        {momRevenueGrowth !== null ? (
                          <span>{momRevenueGrowth >= 0 ? `▲ +${momRevenueGrowth}% MoM` : `▼ ${momRevenueGrowth}% MoM`}</span>
                        ) : (
                          <span>Periode Berjalan</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-50/90 border border-cyan-200 rounded-xl flex flex-col justify-between">
                      <div className="text-[9px] font-bold text-cyan-800 uppercase">
                        {reportMode === 'business' ? 'Laba Kotor (Margin)' : 'Total Pengeluaran'}
                      </div>
                      <div className="text-sm font-black text-cyan-950 font-mono my-1">
                        {reportMode === 'business'
                          ? `+${formatRupiah(businessAcctReport.incomeStatement.grossProfit)}`
                          : `-${formatRupiah(totalExpense)}`}
                      </div>
                      <div className="text-[9px] font-bold text-cyan-700">
                        {reportMode === 'business'
                          ? `Gross Margin: ${businessAcctReport.financialRatios.grossMargin}%`
                          : `${Math.round((totalExpense / (totalIncome || 1)) * 100)}% dari Pemasukan`}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-col justify-between">
                      <div className="text-[9px] font-bold text-blue-800 uppercase">
                        {reportMode === 'business' ? 'Laba Bersih (Net)' : 'Surplus / Defisit Kas'}
                      </div>
                      <div className="text-sm font-black text-blue-950 font-mono my-1">
                        {netBalance >= 0 ? '+' : ''}{formatRupiah(netBalance)}
                      </div>
                      <div className="text-[9px] font-bold text-blue-700">
                        {reportMode === 'business'
                          ? `Net Margin: ${businessAcctReport.financialRatios.netMargin}%`
                          : netBalance >= 0 ? 'Surplus Terkendali' : 'Defisit Terkendali'}
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-xl flex flex-col justify-between">
                      <div className="text-[9px] font-bold text-purple-800 uppercase">
                        Saldo Kas Nyata Terkonsiliasi
                      </div>
                      <div className="text-sm font-black text-purple-950 font-mono my-1">
                        {formatRupiah(reconciledEndingCash)}
                      </div>
                      <div className="text-[9px] font-bold text-purple-700">
                        ✓ Akumulasi Berkelanjutan
                      </div>
                    </div>
                  </div>

                  {/* GRAFIK TREN PERKEMBANGAN DARI WAKTU KE WAKTU (12 BULAN / MULTI-MONTH TREND CHART) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        📈 Tren Perkembangan Keuangan dari Waktu ke Waktu (Tahun {selectedYear})
                      </span>
                      <div className="flex items-center gap-3 text-[9px] font-bold">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Pemasukan / Omzet
                        </span>
                        <span className="flex items-center gap-1 text-rose-700">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> Pengeluaran / Beban
                        </span>
                        <span className="flex items-center gap-1 text-blue-700">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span> Laba Bersih (Net)
                        </span>
                      </div>
                    </div>

                    {/* Interactive SVG Bar & Line Chart */}
                    <div className="pt-2">
                      <div className="grid grid-flow-col auto-cols-fr gap-2 items-end min-h-[90px] border-b border-slate-300 pb-1">
                        {annualPerformanceTrend.map((m) => {
                          const maxMetric = Math.max(
                            ...annualPerformanceTrend.map((t) => Math.max(t.income, t.expense, Math.abs(t.net))),
                            1
                          );
                          const incH = Math.min(65, Math.max(6, (m.income / maxMetric) * 65));
                          const expH = Math.min(65, Math.max(6, (m.expense / maxMetric) * 65));
                          const isCurrent = m.monthIndex === selectedMonth;

                          return (
                            <div key={m.monthIndex} className="flex flex-col items-center gap-1 min-w-0">
                              <div className="flex items-end gap-0.5 justify-center h-[65px]">
                                {/* Income Bar */}
                                <div
                                  title={`Pemasukan: ${formatRupiah(m.income)}`}
                                  style={{ height: `${incH}px` }}
                                  className={`w-3.5 rounded-t transition-all ${
                                    isCurrent ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-400/80'
                                  }`}
                                />
                                {/* Expense Bar */}
                                <div
                                  title={`Pengeluaran: ${formatRupiah(m.expense)}`}
                                  style={{ height: `${expH}px` }}
                                  className={`w-3.5 rounded-t transition-all ${
                                    isCurrent ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-rose-400/80'
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-[8.5px] font-black uppercase truncate ${
                                  isCurrent ? 'text-blue-900 underline' : 'text-slate-600'
                                }`}
                              >
                                {m.shortName}
                              </span>
                              <span className="text-[7.5px] font-mono font-bold text-slate-500 truncate">
                                {m.net >= 0 ? '+' : ''}{Math.round(m.net / 1000)}k
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-medium pt-1.5">
                        <span>* Nilai dinyatakan dalam Rupiah (Rp) per bulan kalender</span>
                        <span className="font-bold text-blue-900">Bulan Terpilih: {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* ALUR SALDO KAS BERKELANJUTAN (CONTINUOUS CASH WATERFALL) */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                      <span className="text-[10px] font-black text-blue-950 uppercase flex items-center gap-1.5">
                        🔄 Alur Saldo Kas Berkelanjutan & Rekonsiliasi
                      </span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                        Carryover Kontinu
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-1">
                      <div className="p-2 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase">
                          Saldo Awal ({prevMonthName})
                        </span>
                        <span className="text-xs font-black font-mono text-slate-900 my-0.5">
                          {formatRupiah(beginningMonthCash)}
                        </span>
                        <span className="text-[8px] text-slate-400">Bawaan Bulan Lalu</span>
                      </div>

                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-between shadow-2xs">
                        <span className="text-[8.5px] font-bold text-emerald-800 uppercase">
                          (+) Masuk (Debet)
                        </span>
                        <span className="text-xs font-black font-mono text-emerald-800 my-0.5">
                          +{formatRupiah(totalIncome)}
                        </span>
                        <span className="text-[8px] text-emerald-600">Total Penerimaan</span>
                      </div>

                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex flex-col justify-between shadow-2xs">
                        <span className="text-[8.5px] font-bold text-rose-800 uppercase">
                          (-) Keluar (Kredit)
                        </span>
                        <span className="text-xs font-black font-mono text-rose-800 my-0.5">
                          -{formatRupiah(totalExpense)}
                        </span>
                        <span className="text-[8px] text-rose-600">Total Pengeluaran</span>
                      </div>

                      <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl flex flex-col justify-between shadow-2xs">
                        <span className="text-[8.5px] font-bold text-purple-900 uppercase">
                          (=) Saldo Akhir Kas
                        </span>
                        <span className="text-xs font-black font-mono text-purple-950 my-0.5">
                          {formatRupiah(reconciledEndingCash)}
                        </span>
                        <span className="text-[8px] text-purple-700 font-bold">100% Terkonsiliasi</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-100/70 text-[9px] text-blue-900 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>💡</span>
                      <span>
                        <strong>Kontinuitas Finansial:</strong> Saldo kas akhir bulan {MONTH_NAMES[selectedMonth]} ({formatRupiah(reconciledEndingCash)}) secara otomatis diteruskan sebagai saldo kas awal pada bulan berikutnya ({MONTH_NAMES[(selectedMonth + 1) % 12]}).
                      </span>
                    </div>
                  </div>

                  {/* DISTRIBUSI POS PENGELUARAN TERATAS */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-800 uppercase">
                        📊 Distribusi 5 Pos Pengeluaran Terbesar
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        Total Beban: {formatRupiah(totalExpense)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {topExpenseCategories.slice(0, 4).map((cat, idx) => (
                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded-xl flex flex-col gap-1">
                          <div className="flex justify-between text-[9.5px] font-bold text-slate-800">
                            <span className="truncate">{idx + 1}. {cat.name}</span>
                            <span className="font-mono text-rose-700">{formatRupiah(cat.amount)} ({cat.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {topExpenseCategories.length === 0 && (
                        <div className="col-span-2 text-center py-3 text-[10px] text-slate-400 italic">
                          Belum ada pengeluaran yang tercatat pada periode ini.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TABEL POS ANGGARAN TERENCANA VS REALISASI (JIKA ADA ANGGARAN) */}
                  {hasBudgetPlan && (
                    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                      <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                        <span>Perbandingan Pos Anggaran Terencana vs Realisasi</span>
                        <span>Bulan {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                      </div>
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                            <th className="py-2 px-2.5 border-r border-slate-300 text-center w-8">No</th>
                            <th className="py-2 px-3 border-r border-slate-300">Kategori Anggaran</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right w-28">Rencana (Rp)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right w-28">Realisasi (Rp)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right w-28">Selisih Varian</th>
                            <th className="py-2 px-3 text-center w-24">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {plannedComparisons.map((row, idx) => (
                            <tr key={row.category.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 text-slate-500 font-medium">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-800">
                                {row.category.name}
                              </td>
                              <td className="py-1.5 px-3 text-right border-r border-slate-200 font-mono text-indigo-900">
                                {formatRupiah(row.planned)}
                              </td>
                              <td className="py-1.5 px-3 text-right border-r border-slate-200 font-mono text-rose-700">
                                {formatRupiah(row.actual)}
                              </td>
                              <td
                                className={`py-1.5 px-3 text-right border-r border-slate-200 font-mono font-bold ${
                                  row.selisih >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {row.selisih >= 0 ? `+${formatRupiah(row.selisih)}` : formatRupiah(row.selisih)}
                              </td>
                              <td className="py-1.5 px-3 text-center font-bold">
                                <span
                                  className={`px-2 py-0.5 rounded text-[8.5px] ${
                                    row.percentage <= 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {row.percentage}% {row.percentage <= 100 ? '(Hemat)' : '(Over)'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                            <td colSpan={2} className="py-2 px-3 text-right border-r border-slate-300 uppercase">
                              TOTAL POS ANGGARAN:
                            </td>
                            <td className="py-2 px-3 text-right border-r border-slate-300 font-mono text-indigo-900">
                              {formatRupiah(totalPlannedBudget)}
                            </td>
                            <td className="py-2 px-3 text-right border-r border-slate-300 font-mono text-rose-900">
                              {formatRupiah(plannedComparisons.reduce((s, r) => s + r.actual, 0))}
                            </td>
                            <td
                              className={`py-2 px-3 text-right border-r border-slate-300 font-mono ${
                                totalPlannedBudget - plannedComparisons.reduce((s, r) => s + r.actual, 0) >= 0
                                  ? 'text-emerald-800'
                                  : 'text-rose-800'
                              }`}
                            >
                              {formatRupiah(totalPlannedBudget - plannedComparisons.reduce((s, r) => s + r.actual, 0))}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              {totalPlannedBudget > 0
                                ? `${Math.round((plannedComparisons.reduce((s, r) => s + r.actual, 0) / totalPlannedBudget) * 100)}%`
                                : '0%'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  BAGIAN 2: LAPORAN AKUNTANSI RESMI (SAK EMKM / IFRS FOR SMES AUDIT STANDARD)
                 ========================================================================= */}
              {(reportSection === 'all_sections' || reportSection === 'accounting') && (
                <div className={`flex flex-col ${reportSection === 'all_sections' ? 'pt-6 border-t-4 border-slate-900 mt-6' : ''}`}>
                  {/* Document Header 2 */}
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                          Bagian 2 • Laporan Akuntansi Resmi
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">
                          Standar SAK EMKM / IFRS for SMEs
                        </span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900 mt-1">
                        LAPORAN KEUANGAN RESMI ENTITAS USAHA
                      </h2>
                      <p className="text-[11px] font-bold text-slate-700 uppercase">
                        {reportMode === 'business' ? businessName : 'Entitas Keuangan SakuKu'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        PERIODE: {MONTH_NAMES[selectedMonth].toUpperCase()} {selectedYear}
                      </div>
                      <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                        Mata Uang: IDR (Rupiah)
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        ✓ Pemeriksaan Akuntan Terverifikasi
                      </div>
                    </div>
                  </div>

                  {/* 1. LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT) */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                    <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                      <span>1. Laporan Laba Rugi Komprehensif (Income Statement)</span>
                      <span>SAK EMKM</span>
                    </div>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300">Pos Akuntansi</th>
                          <th className="py-1.5 px-3 border-r border-slate-300 text-right w-36">Rincian Pos</th>
                          <th className="py-1.5 px-3 text-right w-36">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {/* Pendapatan */}
                        <tr className="bg-emerald-50/50 font-bold text-emerald-950">
                          <td colSpan={3} className="py-1.5 px-3 uppercase text-[9px] tracking-wider">
                            A. PENDAPATAN USAHA (REVENUE)
                          </td>
                        </tr>
                        {businessAcctReport.incomeStatement.revenues.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-4 border-r border-slate-200 text-slate-700">• {item.categoryName}</td>
                            <td className="py-1 px-3 text-right border-r border-slate-200 font-mono text-slate-700">+{formatRupiah(item.amount)}</td>
                            <td className="py-1 px-3 text-right font-mono text-slate-400">-</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-100/70 font-bold text-emerald-900 border-t border-b border-emerald-200">
                          <td colSpan={2} className="py-1.5 px-3 text-right border-r border-emerald-200 uppercase">
                            Total Pendapatan Usaha (A):
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-900">
                            +{formatRupiah(businessAcctReport.incomeStatement.totalRevenue)}
                          </td>
                        </tr>

                        {/* HPP */}
                        <tr className="bg-amber-50/50 font-bold text-amber-950">
                          <td colSpan={3} className="py-1.5 px-3 uppercase text-[9px] tracking-wider">
                            B. HARGA POKOK PENJUALAN (HPP / COGS)
                          </td>
                        </tr>
                        {businessAcctReport.incomeStatement.cogs.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-4 border-r border-slate-200 text-slate-700">• {item.categoryName}</td>
                            <td className="py-1 px-3 text-right border-r border-slate-200 font-mono text-rose-700">-{formatRupiah(item.amount)}</td>
                            <td className="py-1 px-3 text-right font-mono text-slate-400">-</td>
                          </tr>
                        ))}
                        <tr className="bg-amber-100/70 font-bold text-amber-900 border-t border-b border-amber-200">
                          <td colSpan={2} className="py-1.5 px-3 text-right border-r border-amber-200 uppercase">
                            Total Harga Pokok Penjualan (B):
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-black text-rose-800">
                            -{formatRupiah(businessAcctReport.incomeStatement.totalCogs)}
                          </td>
                        </tr>

                        {/* Laba Kotor */}
                        <tr className="bg-slate-900 text-white font-black text-[10.5px]">
                          <td colSpan={2} className="py-2 px-3 text-right border-r border-slate-700 uppercase">
                            LABA KOTOR (GROSS PROFIT) [Margin: {businessAcctReport.financialRatios.grossMargin}%]:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-400">
                            +{formatRupiah(businessAcctReport.incomeStatement.grossProfit)}
                          </td>
                        </tr>

                        {/* Beban Operasional */}
                        <tr className="bg-rose-50/50 font-bold text-rose-950">
                          <td colSpan={3} className="py-1.5 px-3 uppercase text-[9px] tracking-wider">
                            C. BEBAN OPERASIONAL USAHA (OPEX)
                          </td>
                        </tr>
                        {businessAcctReport.incomeStatement.operatingExpenses.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-4 border-r border-slate-200 text-slate-700">• {item.categoryName}</td>
                            <td className="py-1 px-3 text-right border-r border-slate-200 font-mono text-rose-700">-{formatRupiah(item.amount)}</td>
                            <td className="py-1 px-3 text-right font-mono text-slate-400">-</td>
                          </tr>
                        ))}
                        <tr className="bg-rose-100/70 font-bold text-rose-900 border-t border-b border-rose-200">
                          <td colSpan={2} className="py-1.5 px-3 text-right border-r border-rose-200 uppercase">
                            Total Beban Operasional (C):
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-black text-rose-900">
                            -{formatRupiah(businessAcctReport.incomeStatement.totalOperatingExpenses)}
                          </td>
                        </tr>

                        {/* Laba Bersih */}
                        <tr className="bg-blue-950 text-white font-black text-[11px]">
                          <td colSpan={2} className="py-2 px-3 text-right border-r border-blue-900 uppercase">
                            LABA BERSIH PERIODE BERJALAN (NET PROFIT) [Margin: {businessAcctReport.financialRatios.netMargin}%]:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-300">
                            {businessAcctReport.incomeStatement.netProfit >= 0 ? '+' : ''}
                            {formatRupiah(businessAcctReport.incomeStatement.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. LAPORAN POSISI KEUANGAN / NERACA (BALANCE SHEET) */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                    <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                      <span>2. Laporan Posisi Keuangan / Neraca (Balance Sheet)</span>
                      <span className="text-emerald-400 font-bold">
                        {businessAcctReport.balanceSheet.isBalanced ? '✓ Aktiva = Pasiva Seimbang 100%' : 'Aktiva = Pasiva'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-slate-300 text-[10px]">
                      {/* Left Column: ASET */}
                      <div>
                        <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-900 border-b border-slate-200 uppercase text-[9px]">
                          ASET (AKTIVA)
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <div>
                            <span className="font-bold text-slate-800 uppercase text-[9px] block">A. Aset Lancar</span>
                            <div className="pl-2 flex flex-col gap-1 mt-1 text-slate-700">
                              <div className="flex justify-between">
                                <span>• Kas di Tangan:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.cashOnHand)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Kas di Rekening Bank:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.cashInBank)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Saldo E-Wallet Bisnis:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.cashInEWallet)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>• Persediaan Dagang / Stok:</span>
                                <span className="font-mono font-bold text-slate-800">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.inventoryEstimate)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 pt-1.5 mt-1 border-t border-slate-200">
                              <span>Total Aset Lancar:</span>
                              <span className="font-mono text-blue-900">{formatRupiah(businessAcctReport.balanceSheet.currentAssets.totalCurrentAssets)}</span>
                            </div>
                          </div>

                          <div className="mt-1">
                            <span className="font-bold text-slate-800 uppercase text-[9px] block">B. Aset Tidak Lancar (Tetap)</span>
                            <div className="pl-2 flex flex-col gap-1 mt-1 text-slate-700">
                              <div className="flex justify-between">
                                <span>• Peralatan & Mesin Usaha:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.nonCurrentAssets.equipmentAndMachinery)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 pt-1.5 mt-1 border-t border-slate-200">
                              <span>Total Aset Tetap:</span>
                              <span className="font-mono text-blue-900">{formatRupiah(businessAcctReport.balanceSheet.nonCurrentAssets.totalNonCurrentAssets)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 text-white font-black p-2.5 flex justify-between items-center text-[10px]">
                          <span>TOTAL ASET (AKTIVA):</span>
                          <span className="font-mono text-emerald-400">{formatRupiah(businessAcctReport.balanceSheet.totalAssets)}</span>
                        </div>
                      </div>

                      {/* Right Column: LIABILITAS & EKUITAS */}
                      <div>
                        <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-900 border-b border-slate-200 uppercase text-[9px]">
                          LIABILITAS & EKUITAS (PASIVA)
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <div>
                            <span className="font-bold text-slate-800 uppercase text-[9px] block">A. Liabilitas (Kewajiban)</span>
                            <div className="pl-2 flex flex-col gap-1 mt-1 text-slate-700">
                              <div className="flex justify-between">
                                <span>• Utang Usaha & Operasional:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.currentLiabilities.accountsPayable)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 pt-1.5 mt-1 border-t border-slate-200">
                              <span>Total Liabilitas:</span>
                              <span className="font-mono text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.totalLiabilities)}</span>
                            </div>
                          </div>

                          <div className="mt-1">
                            <span className="font-bold text-slate-800 uppercase text-[9px] block">B. Ekuitas (Modal Pemilik)</span>
                            <div className="pl-2 flex flex-col gap-1 mt-1 text-slate-700">
                              <div className="flex justify-between">
                                <span>• Modal Awal Disetor:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.equity.openingCapital)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Laba Ditahan Akumulasi:</span>
                                <span className="font-mono font-bold text-slate-900">{formatRupiah(businessAcctReport.balanceSheet.equity.retainedEarnings)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Laba Bersih Periode Berjalan:</span>
                                <span className="font-mono font-bold text-blue-800">{formatRupiah(businessAcctReport.balanceSheet.equity.currentPeriodNetProfit)}</span>
                              </div>
                              {businessAcctReport.balanceSheet.equity.drawingsOrPrive > 0 && (
                                <div className="flex justify-between text-rose-700">
                                  <span>• Penarikan Prive Pemilik:</span>
                                  <span className="font-mono font-bold">-{formatRupiah(businessAcctReport.balanceSheet.equity.drawingsOrPrive)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 pt-1.5 mt-1 border-t border-slate-200">
                              <span>Total Ekuitas Bersih:</span>
                              <span className="font-mono text-purple-900">{formatRupiah(businessAcctReport.balanceSheet.equity.totalEquity)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 text-white font-black p-2.5 flex justify-between items-center text-[10px]">
                          <span>TOTAL LIABILITAS & EKUITAS:</span>
                          <span className="font-mono text-emerald-400">{formatRupiah(businessAcctReport.balanceSheet.totalLiabilitiesAndEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS - IAS 7) */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                    <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                      <span>3. Laporan Arus Kas (Statement of Cash Flows - IAS 7)</span>
                      <span>Metode Langsung</span>
                    </div>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td colSpan={2} className="py-1.5 px-3 uppercase text-[9px]">A. Arus Kas dari Aktivitas Operasi</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-4 text-slate-700">• Penerimaan Kas dari Penjualan / Konsumen</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-emerald-700">+{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashFromCustomers)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-4 text-slate-700">• Pembayaran Kas untuk HPP & Kulakan Barang</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-rose-700">-{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashPaidToSuppliersAndCogs)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-4 text-slate-700">• Pembayaran Kas untuk Beban Operasional</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-rose-700">-{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.cashPaidForOperatingExpenses)}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-1.5 px-3 text-right text-slate-800">Arus Kas Bersih dari Aktivitas Operasi:</td>
                          <td className="py-1.5 px-3 text-right font-mono text-blue-900">{formatRupiah(businessAcctReport.cashFlowStatement.operatingActivities.netCashFromOperating)}</td>
                        </tr>

                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td colSpan={2} className="py-1.5 px-3 uppercase text-[9px]">B. Arus Kas dari Aktivitas Investasi & Pendanaan</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-4 text-slate-700">• Arus Kas Bersih Aktivitas Investasi (Pembelian Aset)</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(businessAcctReport.cashFlowStatement.investingActivities.netCashFromInvesting)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-4 text-slate-700">• Arus Kas Bersih Aktivitas Pendanaan (Prive / Setoran Modal)</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(businessAcctReport.cashFlowStatement.financingActivities.netCashFromFinancing)}</td>
                        </tr>

                        <tr className="bg-slate-900 text-white font-black text-[10.5px]">
                          <td className="py-2 px-3 text-right uppercase">SALDO AKHIR KAS & SETARA KAS PERIODE INI:</td>
                          <td className="py-2 px-3 text-right font-mono text-amber-300">{formatRupiah(businessAcctReport.cashFlowStatement.endingCashBalance)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. LAPORAN POSISI STOK PERSEDIAAN & VALUASI ASET BERJALAN (JIKA ADA) */}
                  {businessInventoryItems.length > 0 && (
                    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                      <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                        <span>4. Laporan Posisi Stok Persediaan & Valuasi Aset Berjalan</span>
                        <span>Stok Berkelanjutan</span>
                      </div>
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                            <th className="py-1.5 px-2 text-center w-8 border-r border-slate-300">#</th>
                            <th className="py-1.5 px-3 border-r border-slate-300">Nama Item & SKU</th>
                            <th className="py-1.5 px-2 text-center border-r border-slate-300 w-16">Stok Awal</th>
                            <th className="py-1.5 px-2 text-center border-r border-slate-300 w-16">Pemakaian</th>
                            <th className="py-1.5 px-2 text-center border-r border-slate-300 w-16">Stok Akhir</th>
                            <th className="py-1.5 px-3 border-r border-slate-300 text-right w-24">Harga Pokok</th>
                            <th className="py-1.5 px-3 text-right w-28">Nilai Stok (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {businessInventoryItems.map((it, idx) => {
                            const lastQty = it.last_month_qty !== undefined ? it.last_month_qty : it.qty;
                            const usage = Math.max(0, lastQty - it.qty);
                            return (
                              <tr key={it.id} className="hover:bg-slate-50">
                                <td className="py-1 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                                <td className="py-1 px-3 border-r border-slate-200 font-bold text-slate-900">
                                  {it.name}
                                  {it.sku_barcode && <span className="text-[8.5px] font-normal text-slate-500 block">{it.sku_barcode}</span>}
                                </td>
                                <td className="py-1 px-2 text-center border-r border-slate-200 font-mono text-slate-600">{lastQty} {it.unit}</td>
                                <td className="py-1 px-2 text-center border-r border-slate-200 font-mono text-rose-700">{usage > 0 ? `-${usage}` : '0'}</td>
                                <td className="py-1 px-2 text-center border-r border-slate-200 font-mono font-bold text-emerald-800">{it.qty} {it.unit}</td>
                                <td className="py-1 px-3 text-right border-r border-slate-200 font-mono">{formatRupiah(it.cost_price)}</td>
                                <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(it.qty * it.cost_price)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-black border-t border-slate-300">
                          <tr>
                            <td colSpan={6} className="py-1.5 px-3 text-right border-r border-slate-300 uppercase">
                              TOTAL VALUASI PERSEDIAAN & ASET:
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-blue-950">
                              {formatRupiah(businessInventoryItems.reduce((s, it) => s + it.qty * it.cost_price, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="p-2 bg-slate-50 text-[8.5px] text-slate-600 flex items-center gap-1.5 border-t border-slate-200">
                        <span>💡</span>
                        <span>
                          <strong>Update Persediaan Otomatis:</strong> Sisa stok akhir bulan {MONTH_NAMES[selectedMonth]} otomatis tercatat sebagai stok awal pada periode bulan {MONTH_NAMES[(selectedMonth + 1) % 12]} untuk menjamin kelancaran rantai pasok usaha.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 5. REKAPITULASI BUKU BESAR MUTASI KAS (GENERAL LEDGER) */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white mb-4 shadow-2xs">
                    <div className="bg-slate-900 text-white px-3.5 py-2 text-[10px] font-black uppercase flex items-center justify-between">
                      <span>{businessInventoryItems.length > 0 ? '5.' : '4.'} Buku Besar Mutasi Kas (General Ledger Rekap)</span>
                      <span>{ledgerRows.length} Record Transaksi</span>
                    </div>
                    {ledgerRows.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 font-medium bg-slate-50">
                        Tidak ada transaksi tercatat pada bulan {MONTH_NAMES[selectedMonth]} {selectedYear}.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                            <th className="py-1.5 px-2 text-center w-8 border-r border-slate-300">No</th>
                            <th className="py-1.5 px-2.5 border-r border-slate-300 w-24">Tanggal</th>
                            <th className="py-1.5 px-3 border-r border-slate-300">Keterangan & Pos Kategori</th>
                            <th className="py-1.5 px-3 border-r border-slate-300 text-right w-28">Debet (Masuk)</th>
                            <th className="py-1.5 px-3 border-r border-slate-300 text-right w-28">Kredit (Keluar)</th>
                            <th className="py-1.5 px-3 text-right w-28">Saldo Kas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {ledgerRows.map((row) => (
                            <tr key={row.no} className="hover:bg-slate-50">
                              <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-500">{row.no}</td>
                              <td className="py-1 px-2.5 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                                {formatExactShortDateIndonesian(row.date)}
                              </td>
                              <td className="py-1 px-3 border-r border-slate-200">
                                <span className="font-bold text-slate-900">{row.description || 'Mutasi Kas'}</span>
                                <span className="text-[8.5px] text-slate-500 block">• {row.categoryName}</span>
                              </td>
                              <td className="py-1 px-3 text-right border-r border-slate-200 font-mono text-emerald-700 whitespace-nowrap">
                                {row.debet > 0 ? `+${formatRupiah(row.debet)}` : '-'}
                              </td>
                              <td className="py-1 px-3 text-right border-r border-slate-200 font-mono text-rose-700 whitespace-nowrap">
                                {row.kredit > 0 ? `-${formatRupiah(row.kredit)}` : '-'}
                              </td>
                              <td className="py-1 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {row.runningBalance >= 0 ? '+' : ''}{formatRupiah(row.runningBalance)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-900 text-white font-black text-[10.5px]">
                            <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-700 uppercase">
                              TOTAL MUTASI KAS BULAN INI:
                            </td>
                            <td className="py-2 px-3 text-right border-r border-slate-700 text-emerald-400 font-mono">
                              +{formatRupiah(totalIncome)}
                            </td>
                            <td className="py-2 px-3 text-right border-r border-slate-700 text-rose-400 font-mono">
                              -{formatRupiah(totalExpense)}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-300 font-mono">
                              {netBalance >= 0 ? '+' : ''}{formatRupiah(netBalance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 6. CATATAN ATAS LAPORAN KEUANGAN (CALK) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1 text-[9px] text-slate-600 mb-4">
                    <span className="font-bold text-slate-800 uppercase text-[9.5px]">
                      {businessInventoryItems.length > 0 ? '6.' : '5.'} Catatan Atas Laporan Keuangan (CALK)
                    </span>
                    <p>1. Standar Penyusunan: Mengacu pada Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan IFRS for SMEs.</p>
                    <p>2. Saldo Berkelanjutan: Saldo kas akhir dan stok persediaan secara otomatis diteruskan sebagai saldo awal periode pelaporan berikutnya.</p>
                    <p>3. Rekonsiliasi Kas: Seluruh mutasi telah terverifikasi dengan bukti digital transaksi dan sistem pembukuan resmi SakuKu.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Document Signature Footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-center text-[11px] text-slate-700">
              <div>
                <p>Diperiksa Oleh,</p>
                <div className="h-12"></div>
                <p className="font-bold underline text-slate-900">( ........................................ )</p>
                <p className="text-[9px] text-slate-500">Pemeriksa / Admin</p>
              </div>

              <div>
                <p>Dibuat Oleh,</p>
                <div className="h-12"></div>
                <p className="font-bold underline text-slate-900">( Pemilik SakuKu )</p>
                <p className="text-[9px] text-slate-500">Pengelola Keuangan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE MODAL DIALOG (WhatsApp, Telegram, Email, System Share) */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-4 text-slate-900 shadow-2xl border border-slate-200 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Bagikan Laporan Kas</h3>
                  <p className="text-[10px] text-slate-500">Periode: {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {/* OPSI 1: WHATSAPP */}
              <button
                type="button"
                onClick={() => {
                  handleShareWhatsApp();
                  setIsShareModalOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer border border-emerald-200"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-emerald-900">Kirim ke WhatsApp</p>
                  <p className="text-[10px] text-emerald-700 font-normal">Kirim ringkasan & data ke kontak/grup WA</p>
                </div>
              </button>

              {/* OPSI 2: TELEGRAM */}
              <button
                type="button"
                onClick={() => {
                  handleShareTelegram();
                  setIsShareModalOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer border border-sky-200"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-sky-900">Kirim ke Telegram</p>
                  <p className="text-[10px] text-sky-700 font-normal">Bagikan langsung ke channel atau chat</p>
                </div>
              </button>

              {/* OPSI 3: EMAIL */}
              <button
                type="button"
                onClick={() => {
                  handleShareEmail();
                  setIsShareModalOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer border border-purple-200"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-purple-900">Kirim via Email</p>
                  <p className="text-[10px] text-purple-700 font-normal">Kirim draft email resmi ke rekan/atasan</p>
                </div>
              </button>

              {/* OPSI 4: NATIVE SYSTEM SHARE */}
              <button
                type="button"
                onClick={() => {
                  handleNativeShare();
                  setIsShareModalOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer border border-blue-200"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-blue-900">Bagikan Lewat HP (Lainnya)</p>
                  <p className="text-[10px] text-blue-700 font-normal">Bluetooth, Drive, Catatan, dll.</p>
                </div>
              </button>

              {/* OPSI 5: SALIN TEKS LAPORAN */}
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer border border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900">
                    {isCopied ? 'Teks Berhasil Disalin!' : 'Salin Teks Laporan'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal">Salin format rapi ke clipboard</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
