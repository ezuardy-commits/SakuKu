import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Budget, BudgetItem, Account, ModeType, InventoryItem } from '../types';
import { formatRupiah } from '../lib/formatters';
import { computeBusinessAccountingReport } from '../lib/accountingEngine';

function createJsPdfDoc(options: any = { orientation: 'portrait', unit: 'mm', format: 'a4' }): jsPDF {
  const Constructor: any = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default || jsPDF;
  return new Constructor(options);
}

const INDO_MONTHS = [
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

interface GeneratePdfOptions {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  budgetItems: BudgetItem[];
  inventoryItems?: InventoryItem[];
  selectedYear: number;
  selectedMonth: number;
  filterMode: 'all' | ModeType;
  filterCategory: string;
  filterAccount: string;
  userName?: string;
}

// ─── HELPER: DRAW MULTI-MONTH TREND CHART IN PDF ────────────────────────────
function drawMultiMonthTrendChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  trendItems: { monthName: string; shortName: string; income: number; expense: number; net: number }[],
  currentMonthIndex: number
) {
  // Background container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  const chartTop = y + 8;
  const chartBottom = y + h - 14;
  const chartH = chartBottom - chartTop;

  // Max value among all months
  const maxVal = Math.max(
    ...trendItems.map((m) => Math.max(m.income, m.expense, Math.abs(m.net))),
    1
  );

  const numMonths = trendItems.length;
  const colW = (w - 14) / Math.max(numMonths, 1);
  const barW = Math.min(5.5, (colW - 3) / 2);

  // Baseline line
  doc.setDrawColor(203, 213, 225);
  doc.line(x + 5, chartBottom, x + w - 5, chartBottom);

  trendItems.forEach((m, idx) => {
    const colCenterX = x + 7 + idx * colW + colW / 2;
    const isCurrent = idx === currentMonthIndex;

    const incH = Math.max(2, (m.income / maxVal) * chartH);
    const expH = Math.max(2, (m.expense / maxVal) * chartH);

    // Income Bar (Emerald)
    doc.setFillColor(isCurrent ? 5 : 52, isCurrent ? 150 : 211, isCurrent ? 105 : 153);
    doc.roundedRect(colCenterX - barW - 0.5, chartBottom - incH, barW, incH, 0.5, 0.5, 'F');

    // Expense Bar (Rose)
    doc.setFillColor(isCurrent ? 225 : 248, isCurrent ? 29 : 113, isCurrent ? 72 : 113);
    doc.roundedRect(colCenterX + 0.5, chartBottom - expH, barW, expH, 0.5, 0.5, 'F');

    // Month Label
    doc.setFont('helvetica', isCurrent ? 'bold' : 'normal');
    doc.setFontSize(6);
    doc.setTextColor(isCurrent ? 15 : 100, isCurrent ? 23 : 116, isCurrent ? 42 : 139);
    doc.text(m.shortName, colCenterX, chartBottom + 4.5, { align: 'center' });

    // Net tag
    doc.setFontSize(5);
    doc.setTextColor(m.net >= 0 ? 22 : 153, m.net >= 0 ? 101 : 27, m.net >= 0 ? 52 : 27);
    const netShort = `${m.net >= 0 ? '+' : ''}${Math.round(m.net / 1000)}k`;
    doc.text(netShort, colCenterX, chartBottom + 8.5, { align: 'center' });
  });

  // Legend at top right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setFillColor(16, 185, 129);
  doc.rect(x + w - 45, y + 2.5, 2.5, 2.5, 'F');
  doc.setTextColor(71, 85, 105);
  doc.text('Omzet', x + w - 41, y + 4.5);

  doc.setFillColor(225, 29, 72);
  doc.rect(x + w - 24, y + 2.5, 2.5, 2.5, 'F');
  doc.text('Beban', x + w - 20, y + 4.5);
}

// ─── HELPER: DRAW PERFORMANCE BAR CHART IN PDF ──────────────────────────────
function drawPerformanceBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  items: { label: string; amount: number; color: [number, number, number]; subLabel?: string }[]
) {
  const maxVal = Math.max(...items.map((i) => Math.abs(i.amount)), 1);
  const barGap = 6;
  const barW = (w - (items.length - 1) * barGap - 12) / items.length;

  // Background container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  const chartTop = y + 8;
  const chartBottom = y + h - 14;
  const chartH = chartBottom - chartTop;

  // Baseline line
  doc.setDrawColor(203, 213, 225);
  doc.line(x + 5, chartBottom, x + w - 5, chartBottom);

  items.forEach((item, idx) => {
    const itemX = x + 6 + idx * (barW + barGap);
    const barHeight = Math.max(3, (Math.abs(item.amount) / maxVal) * chartH);
    const barY = chartBottom - barHeight;

    // Bar fill
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(itemX, barY, barW, barHeight, 1, 1, 'F');

    // Amount text above bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(formatRupiah(item.amount), itemX + barW / 2, Math.max(y + 6, barY - 1.5), { align: 'center' });

    // Label below bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(item.label, itemX + barW / 2, chartBottom + 4.5, { align: 'center' });

    if (item.subLabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.subLabel, itemX + barW / 2, chartBottom + 8.5, { align: 'center' });
    }
  });
}

// ─── HELPER: DRAW CONTINUOUS CASH FLOW WATERFALL ────────────────────────────
function drawCashflowWaterfall(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  beginningCash: number,
  inflows: number,
  outflows: number,
  endingCash: number,
  prevMonthName: string
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  const stepW = (w - 28) / 4;
  const steps = [
    { title: 'Saldo Awal', val: beginningCash, color: [71, 85, 105], note: `Bawaan ${prevMonthName}` },
    { title: '(+) Masuk', val: inflows, color: [16, 185, 129], note: 'Total Penerimaan' },
    { title: '(-) Keluar', val: -outflows, color: [225, 29, 72], note: 'Total Pengeluaran/HPP' },
    { title: '(=) Saldo Akhir', val: endingCash, color: [37, 99, 235], note: 'Kumulatif Berjalan' },
  ];

  steps.forEach((st, i) => {
    const stX = x + 3.5 + i * (stepW + 6.5);
    const isLast = i === steps.length - 1;

    doc.setFillColor(isLast ? 238 : 255, isLast ? 242 : 255, isLast ? 255 : 255);
    doc.setDrawColor(st.color[0], st.color[1], st.color[2]);
    doc.roundedRect(stX, y + 3.5, stepW, h - 7, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(st.color[0], st.color[1], st.color[2]);
    doc.text(st.title.toUpperCase(), stX + stepW / 2, y + 7.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.text(formatRupiah(Math.abs(st.val)), stX + stepW / 2, y + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(st.note, stX + stepW / 2, y + 17.5, { align: 'center' });

    if (i < steps.length - 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('➔', stX + stepW + 3.2, y + 12.5, { align: 'center' });
    }
  });
}

// ─── HELPER: DRAW CATEGORY EXPENSE GAUGE BARS ──────────────────────────────
function drawCategoryGaugeBars(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  items: { name: string; amount: number; percentage: number; color?: [number, number, number] }[]
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  const maxItems = Math.min(items.length, 5);
  const rowH = (h - 10) / maxItems;

  for (let i = 0; i < maxItems; i++) {
    const item = items[i];
    const rowY = y + 5 + i * rowH;
    const barW = w - 85;
    const barX = x + 38;

    // Category Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    const truncatedName = item.name.length > 18 ? item.name.substring(0, 16) + '..' : item.name;
    doc.text(truncatedName, x + 4, rowY + 3.5);

    // Background track
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, rowY + 1, barW, 3.5, 0.8, 0.8, 'F');

    // Filled progress bar
    const fillPct = Math.min(100, Math.max(2, item.percentage));
    const filledWidth = (barW * fillPct) / 100;
    const barColor = item.color || [59, 130, 246];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(barX, rowY + 1, filledWidth, 3.5, 0.8, 0.8, 'F');

    // Percentage & Amount tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(barColor[0], barColor[1], barColor[2]);
    doc.text(`${item.percentage}%`, barX + barW + 3, rowY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(formatRupiah(item.amount), x + w - 4, rowY + 3.5, { align: 'right' });
  }
}

// ─── MAIN PDF GENERATION FUNCTION ──────────────────────────────────────────
export function generateSakuKuMonthlyPdf(options: GeneratePdfOptions): Blob {
  const {
    transactions,
    categories,
    accounts,
    budgets,
    budgetItems,
    selectedYear,
    selectedMonth,
    filterMode,
    filterCategory,
    filterAccount,
    userName = 'Pengelola Keuangan SakuKu',
  } = options;

  const monthName = INDO_MONTHS[selectedMonth] || 'Bulan';
  const monthPadded = String(selectedMonth + 1).padStart(2, '0');
  const isBusinessReport = filterMode === 'business';

  const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prevMonthName = INDO_MONTHS[prevMonthDate.getMonth()] || 'Bulan Lalu';
  const localMonthStr = `${selectedYear}-${monthPadded}`;

  // Filter transactions for chosen month, year, mode
  const filteredTxs = transactions
    .filter((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return false;
      if (filterMode !== 'all' && tx.mode !== filterMode) return false;
      if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false;
      if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalIncome = filteredTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  // Cumulative transactions prior to current month
  const priorTxs = transactions.filter((tx) => {
    if (filterMode !== 'all' && tx.mode !== filterMode) return false;
    const dStr = tx.date ? tx.date.substring(0, 7) : '';
    return dStr < localMonthStr;
  });
  const priorIncome = priorTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const priorExpense = priorTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const openingCapitalAccounts = accounts
    .filter((a) => (filterMode === 'all' ? true : a.scope === filterMode || a.scope === 'combined'))
    .reduce((s, a) => s + (a.opening_balance || 0), 0);

  const beginningMonthCash = openingCapitalAccounts + priorIncome - priorExpense;
  const reconciledEndingCash = beginningMonthCash + netCashFlow;

  const doc = createJsPdfDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 14;

  // ══════════════════════════════════════════════════════════════════════════
  // IF BUSINESS REPORT: Full Public Accountant Audit Standards (SAK EMKM / IFRS)
  // ══════════════════════════════════════════════════════════════════════════
  if (isBusinessReport) {
    const selectedAccountObj = accounts.find((a) => a.id === filterAccount);
    const businessName =
      selectedAccountObj?.business_name ||
      selectedAccountObj?.name ||
      'Unit Bisnis / UMKM SakuKu';

    const businessInventoryItems = (options.inventoryItems || []).filter((it) => it.mode === 'business');

    const acctReport = computeBusinessAccountingReport({
      transactions,
      categories,
      accounts,
      selectedYear,
      selectedMonth,
      businessName,
      inventoryItems: businessInventoryItems,
    });

    // Multi-Month / Annual Performance Trend
    const annualPerformanceTrend = Array.from({ length: selectedMonth + 1 }, (_, idx) => {
      const mTxs = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx && t.mode === 'business';
      });
      const inc = mTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      return {
        monthName: INDO_MONTHS[idx],
        shortName: INDO_MONTHS[idx].substring(0, 3),
        income: inc,
        expense: exp,
        net,
      };
    });

    // Top Expense Categories for Gauges
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
          name: cat?.name || 'Beban Usaha',
          amount,
          percentage: pct,
          color: [225, 29, 72] as [number, number, number],
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // =========================================================================
    // PAGE 1: BAGIAN 1 - LAPORAN PERJALANAN & PERTUMBUHAN USAHA (GROWTH REPORT)
    // =========================================================================
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`BAGIAN 1: LAPORAN PERJALANAN & PERTUMBUHAN USAHA`, margin, 11);

    doc.setFontSize(10.5);
    doc.setTextColor(147, 197, 253);
    doc.text(`${businessName.toUpperCase()}`, margin, 17.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Executive Performance & Multi-Period Growth Analysis  |  Mata Uang: IDR (Rupiah)`,
      margin,
      23.5
    );
    doc.text(
      `Periode: ${monthName} ${selectedYear}  |  Pengelola: ${userName}  |  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      margin,
      29
    );

    let startY = 41;

    // 4 PRIMARY KPI CARDS
    const cardW = 43;
    // Card 1: Omzet
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, startY, cardW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PENDAPATAN (OMZET)', margin + 3, startY + 4.5);
    doc.setFontSize(8.5);
    doc.text(formatRupiah(acctReport.incomeStatement.totalRevenue), margin + 3, startY + 11);

    // Card 2: Laba Kotor
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin + 46, startY, cardW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(67, 56, 202);
    doc.text(`LABA KOTOR (${acctReport.financialRatios.grossMargin}%)`, margin + 49, startY + 4.5);
    doc.setFontSize(8.5);
    doc.text(formatRupiah(acctReport.incomeStatement.grossProfit), margin + 49, startY + 11);

    // Card 3: Laba Bersih
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin + 92, startY, cardW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(146, 64, 14);
    doc.text(`LABA BERSIH (${acctReport.financialRatios.netMargin}%)`, margin + 95, startY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(
      acctReport.incomeStatement.netProfit >= 0 ? 22 : 153,
      acctReport.incomeStatement.netProfit >= 0 ? 101 : 27,
      acctReport.incomeStatement.netProfit >= 0 ? 52 : 27
    );
    doc.text(formatRupiah(acctReport.incomeStatement.netProfit), margin + 95, startY + 11);

    // Card 4: Total Aset Neraca
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 138, startY, cardW + 1, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`TOTAL ASET (NERACA)`, margin + 141, startY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(formatRupiah(acctReport.balanceSheet.totalAssets), margin + 141, startY + 11);

    startY += 19;

    // GRAFIK 1: MULTI-MONTH TREND CHART (PERKEMBANGAN DARI WAKTU KE WAKTU)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`A. TREN PERKEMBANGAN DARI WAKTU KE WAKTU (JANUARI - ${monthName.toUpperCase()} ${selectedYear})`, margin, startY);
    startY += 3.5;

    const chartWidth = 88;
    drawMultiMonthTrendChart(
      doc,
      margin,
      startY,
      chartWidth,
      34,
      annualPerformanceTrend,
      selectedMonth
    );

    // GAUGE DISTRIBUSI POS PENGELUARAN TERATAS
    drawCategoryGaugeBars(
      doc,
      margin + chartWidth + 4,
      startY,
      chartWidth,
      34,
      topExpenseCategories.length > 0
        ? topExpenseCategories
        : [{ name: 'Belum Ada Beban', amount: 0, percentage: 0 }]
    );

    startY += 38;

    // GRAFIK 2: ALUR SALDO KAS BERKELANJUTAN (WATERFALL REKONSILIASI KAS)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('B. ALUR SALDO KAS BERKELANJUTAN (REKONSILIASI CARRYOVER BULAN LALU)', margin, startY);
    startY += 3.5;

    drawCashflowWaterfall(
      doc,
      margin,
      startY,
      pageWidth - margin * 2,
      24,
      beginningMonthCash,
      totalIncome,
      totalExpense,
      reconciledEndingCash,
      prevMonthName
    );

    startY += 28;

    // KETERANGAN KONTINUITAS SALDO
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, startY, pageWidth - margin * 2, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(67, 56, 202);
    doc.text(
      `* Kontinuitas Finansial: Saldo Kas Akhir ${monthName} (${formatRupiah(reconciledEndingCash)}) otomatis menjadi Saldo Kas Awal pada bulan berikutnya.`,
      margin + 3,
      startY + 5.5
    );

    // =========================================================================
    // PAGE 2+: BAGIAN 2 - LAPORAN AKUNTANSI RESMI (STANDAR SAK EMKM & IFRS)
    // =========================================================================
    doc.addPage();
    startY = 14;

    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`BAGIAN 2: LAPORAN KEUANGAN RESMI (STANDAR SAK EMKM & IFRS)`, margin, 10);

    doc.setFontSize(9.5);
    doc.setTextColor(147, 197, 253);
    doc.text(`${businessName.toUpperCase()}`, margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Standar Akuntansi Keuangan SAK EMKM & IFRS for SMEs  |  Periode: ${monthName} ${selectedYear}  |  Mata Uang: IDR (Rupiah)`,
      margin,
      21.5
    );

    startY = 35;

    // 1. STATEMENTS 1: LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. LAPORAN LABA RUGI KOMPREHENSIF (STATEMENT OF COMPREHENSIVE INCOME)', margin, startY);
    startY += 3.5;

    const incomeRows: any[] = [];
    incomeRows.push(['I. PENDAPATAN USAHA (OPERATING REVENUES)', '', '']);
    if (acctReport.incomeStatement.revenues.length > 0) {
      acctReport.incomeStatement.revenues.forEach((r) => {
        incomeRows.push([`   • ${r.categoryName}`, formatRupiah(r.amount), '']);
      });
    } else {
      incomeRows.push(['   • Pendapatan Usaha', formatRupiah(0), '']);
    }
    incomeRows.push(['   TOTAL PENDAPATAN USAHA (A)', '', formatRupiah(acctReport.incomeStatement.totalRevenue)]);

    incomeRows.push(['II. HARGA POKOK PENJUALAN (HPP / COGS)', '', '']);
    if (acctReport.incomeStatement.cogs.length > 0) {
      acctReport.incomeStatement.cogs.forEach((c) => {
        incomeRows.push([`   • ${c.categoryName}`, `(${formatRupiah(c.amount)})`, '']);
      });
    } else {
      incomeRows.push(['   • Tidak ada pos biaya HPP/Bahan Baku', 'Rp 0', '']);
    }
    incomeRows.push(['   TOTAL HARGA POKOK PENJUALAN (B)', '', `(${formatRupiah(acctReport.incomeStatement.totalCogs)})`]);

    incomeRows.push([
      `LABA KOTOR (GROSS PROFIT) [Margin: ${acctReport.financialRatios.grossMargin}%]`,
      '',
      formatRupiah(acctReport.incomeStatement.grossProfit),
    ]);

    incomeRows.push(['III. BEBAN OPERASIONAL & ADMINISTRASI (OPEX)', '', '']);
    if (acctReport.incomeStatement.operatingExpenses.length > 0) {
      acctReport.incomeStatement.operatingExpenses.forEach((o) => {
        incomeRows.push([`   • ${o.categoryName}`, `(${formatRupiah(o.amount)})`, '']);
      });
    } else {
      incomeRows.push(['   • Belum ada beban operasional tercatat', 'Rp 0', '']);
    }
    incomeRows.push([
      '   TOTAL BEBAN OPERASIONAL (C)',
      '',
      `(${formatRupiah(acctReport.incomeStatement.totalOperatingExpenses)})`,
    ]);

    incomeRows.push([
      `LABA OPERASIONAL SEBELUM BUNGA & PAJAK (EBIT) [Margin: ${acctReport.financialRatios.operatingMargin}%]`,
      '',
      formatRupiah(acctReport.incomeStatement.operatingIncome),
    ]);

    if (acctReport.incomeStatement.estimatedTax > 0) {
      incomeRows.push(['IV. ESTIMASI BEBAN PAJAK UMKM (PP 55 / FINAL)', '', `(${formatRupiah(acctReport.incomeStatement.estimatedTax)})`]);
    }

    incomeRows.push([
      `LABA BERSIH PERIODE BERJALAN (NET PROFIT) [Margin: ${acctReport.financialRatios.netMargin}%]`,
      '',
      formatRupiah(acctReport.incomeStatement.netProfit),
    ]);

    autoTable(doc, {
      startY,
      head: [['Uraian Pos Akuntansi', 'Rincian Pos (Rp)', 'Total (Rp)']],
      body: incomeRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 36, halign: 'right' },
        2: { cellWidth: 36, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        const text = String(data.cell.raw || '');
        if (
          text.includes('I. ') ||
          text.includes('II. ') ||
          text.includes('III. ') ||
          text.includes('IV. ') ||
          text.includes('TOTAL ') ||
          text.includes('LABA KOTOR') ||
          text.includes('LABA OPERASIONAL') ||
          text.includes('LABA BERSIH')
        ) {
          data.cell.styles.fontStyle = 'bold';
          if (text.includes('LABA BERSIH')) {
            data.cell.styles.fillColor = [254, 243, 199];
          } else if (text.includes('LABA KOTOR') || text.includes('LABA OPERASIONAL')) {
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // 2. STATEMENTS 2: LAPORAN POSISI KEUANGAN / NERACA (BALANCE SHEET)
    if (startY > 185) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. LAPORAN POSISI KEUANGAN / NERACA (STATEMENT OF FINANCIAL POSITION)', margin, startY);
    startY += 3.5;

    const bsRows: any[] = [
      ['ASET (AKTIVA)', '', 'LIABILITAS & EKUITAS (PASIVA)', ''],
      ['A. ASET LANCAR (CURRENT ASSETS)', '', 'A. LIABILITAS / KEWAJIBAN', ''],
      [
        '   • Kas Tunai di Tangan',
        formatRupiah(acctReport.balanceSheet.currentAssets.cashOnHand),
        '   • Utang Usaha & Akrual',
        formatRupiah(acctReport.balanceSheet.currentLiabilities.accountsPayable),
      ],
      [
        '   • Kas di Rekening Bank Usaha',
        formatRupiah(acctReport.balanceSheet.currentAssets.cashInBank),
        '   • Pinjaman Jangka Panjang',
        formatRupiah(acctReport.balanceSheet.longTermLiabilities.longTermLoans),
      ],
      [
        '   • Saldo E-Wallet / Digital Kasir',
        formatRupiah(acctReport.balanceSheet.currentAssets.cashInEWallet),
        '   TOTAL LIABILITAS',
        formatRupiah(acctReport.balanceSheet.totalLiabilities),
      ],
      [
        '   • Estimasi Persediaan / Stok Barang',
        formatRupiah(acctReport.balanceSheet.currentAssets.inventoryEstimate),
        '',
        '',
      ],
      [
        '   TOTAL ASET LANCAR',
        formatRupiah(acctReport.balanceSheet.currentAssets.totalCurrentAssets),
        'B. EKUITAS / MODAL PEMILIK',
        '',
      ],
      [
        '',
        '',
        '   • Modal Awal Disetor',
        formatRupiah(acctReport.balanceSheet.equity.openingCapital),
      ],
      [
        'B. ASET TIDAK LANCAR (TETAP)',
        '',
        '   • Laba Ditahan Akumulasi Lalu',
        formatRupiah(acctReport.balanceSheet.equity.retainedEarnings),
      ],
      [
        '   • Peralatan, Mesin & Aset Usaha',
        formatRupiah(acctReport.balanceSheet.nonCurrentAssets.equipmentAndMachinery),
        '   • Laba Bersih Periode Berjalan',
        formatRupiah(acctReport.balanceSheet.equity.currentPeriodNetProfit),
      ],
      [
        '   TOTAL ASET TIDAK LANCAR',
        formatRupiah(acctReport.balanceSheet.nonCurrentAssets.totalNonCurrentAssets),
        '   • Penarikan Prive Pemilik',
        `(${formatRupiah(acctReport.balanceSheet.equity.drawingsOrPrive)})`,
      ],
      [
        '',
        '',
        '   TOTAL EKUITAS BERSIH',
        formatRupiah(acctReport.balanceSheet.equity.totalEquity),
      ],
      [
        'TOTAL ASET (AKTIVA)',
        formatRupiah(acctReport.balanceSheet.totalAssets),
        'TOTAL LIABILITAS & EKUITAS',
        formatRupiah(acctReport.balanceSheet.totalLiabilitiesAndEquity),
      ],
    ];

    autoTable(doc, {
      startY,
      head: [['Pos Aktiva (Aset)', 'Jumlah (Rp)', 'Pos Pasiva (Kewajiban & Modal)', 'Jumlah (Rp)']],
      body: bsRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 36, halign: 'right' },
        2: { cellWidth: 55 },
        3: { cellWidth: 36, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        const text = String(data.cell.raw || '');
        if (
          text.includes('TOTAL ASET') ||
          text.includes('TOTAL LIABILITAS') ||
          text.includes('TOTAL EKUITAS') ||
          text.includes('A. ') ||
          text.includes('B. ') ||
          text.includes('ASET (AKTIVA)')
        ) {
          data.cell.styles.fontStyle = 'bold';
          if (text.includes('TOTAL ASET (AKTIVA)') || text.includes('TOTAL LIABILITAS & EKUITAS')) {
            data.cell.styles.fillColor = [238, 242, 255];
          }
        }
      },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // 3. STATEMENTS 3: LAPORAN ARUS KAS (IAS 7 / SAK EMKM)
    if (startY > 195) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS - IAS 7)', margin, startY);
    startY += 3.5;

    const cfRows = [
      ['A. ARUS KAS DARI AKTIVITAS OPERASI', '', ''],
      ['   • Penerimaan Kas dari Pelanggan / Penjualan', formatRupiah(acctReport.cashFlowStatement.operatingActivities.cashFromCustomers), ''],
      ['   • Pembayaran Kas untuk HPP & Kulakan', `(${formatRupiah(acctReport.cashFlowStatement.operatingActivities.cashPaidToSuppliersAndCogs)})`, ''],
      ['   • Pembayaran Kas untuk Beban Operasional Usaha', `(${formatRupiah(acctReport.cashFlowStatement.operatingActivities.cashPaidForOperatingExpenses)})`, ''],
      ['   ARUS KAS BERSIH DARI AKTIVITAS OPERASI', '', formatRupiah(acctReport.cashFlowStatement.operatingActivities.netCashFromOperating)],
      ['B. ARUS KAS DARI AKTIVITAS INVESTASI', '', ''],
      ['   • Pembelian Peralatan & Aset Usaha Baru', `(${formatRupiah(acctReport.cashFlowStatement.investingActivities.purchaseOfEquipmentAndAssets)})`, ''],
      ['   ARUS KAS BERSIH DARI AKTIVITAS INVESTASI', '', formatRupiah(acctReport.cashFlowStatement.investingActivities.netCashFromInvesting)],
      ['C. ARUS KAS DARI AKTIVITAS PENDANAAN', '', ''],
      ['   • Penarikan Modal Prive oleh Pemilik', `(${formatRupiah(acctReport.cashFlowStatement.financingActivities.ownerDrawingsPrive)})`, ''],
      ['   ARUS KAS BERSIH DARI AKTIVITAS PENDANAAN', '', formatRupiah(acctReport.cashFlowStatement.financingActivities.netCashFromFinancing)],
      ['KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS', '', formatRupiah(acctReport.cashFlowStatement.netChangeInCash)],
      ['SALDO KAS AWAL PERIODE (BAWAAN BULAN LALU)', '', formatRupiah(beginningMonthCash)],
      ['SALDO KAS & SETARA KAS AKHIR PERIODE (REKONSILIASI)', '', formatRupiah(reconciledEndingCash)],
    ];

    autoTable(doc, {
      startY,
      head: [['Aktivitas Arus Kas', 'Rincian (Rp)', 'Total (Rp)']],
      body: cfRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 36, halign: 'right' },
        2: { cellWidth: 36, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        const text = String(data.cell.raw || '');
        if (text.includes('A. ') || text.includes('B. ') || text.includes('C. ') || text.includes('ARUS KAS BERSIH') || text.includes('SALDO KAS')) {
          data.cell.styles.fontStyle = 'bold';
          if (text.includes('SALDO KAS & SETARA KAS AKHIR')) {
            data.cell.styles.fillColor = [240, 253, 244];
          }
        }
      },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // 4. STATEMENTS 4: LAPORAN POSISI STOK PERSEDIAAN & VALUASI ASET BERJALAN
    if (businessInventoryItems.length > 0) {
      if (startY > 200) {
        doc.addPage();
        startY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('4. LAPORAN POSISI STOK PERSEDIAAN & VALUASI ASET BERJALAN', margin, startY);
      startY += 3.5;

      const invRows = businessInventoryItems.map((it, idx) => {
        const lastQty = it.last_month_qty !== undefined ? it.last_month_qty : it.qty;
        const usage = Math.max(0, lastQty - it.qty);
        return [
          String(idx + 1),
          it.name + (it.sku_barcode ? ` (${it.sku_barcode})` : ''),
          `${lastQty} ${it.unit}`,
          usage > 0 ? `-${usage}` : '0',
          `${it.qty} ${it.unit}`,
          formatRupiah(it.cost_price),
          formatRupiah(it.qty * it.cost_price),
        ];
      });

      const totalStockVal = businessInventoryItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
      invRows.push(['', 'TOTAL VALUASI PERSEDIAAN & ASET', '', '', '', '', formatRupiah(totalStockVal)]);

      autoTable(doc, {
        startY,
        head: [['No', 'Nama Item Barang & SKU', 'Stok Awal', 'Pakai', 'Stok Akhir', 'Harga Pokok', 'Nilai Stok (Rp)']],
        body: invRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 6.5,
          cellPadding: 1.4,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 58 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 26, halign: 'right' },
          6: { cellWidth: 28, halign: 'right' },
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (data.row.index === invRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        },
      });

      startY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 5. CATATAN ATAS LAPORAN KEUANGAN (CALK) & OPINI PEMERIKSAAN AKUNTAN PUBLIK
    if (startY > 210) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${businessInventoryItems.length > 0 ? '5.' : '4.'} CATATAN ATAS LAPORAN KEUANGAN (CALK) & PERNYATAAN AKUNTABILITAS`, margin, startY);
    startY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '1. Dasar Penyusunan: Laporan keuangan disusun mengacu pada Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan IFRS for SMEs.',
      margin,
      startY
    );
    startY += 3.5;
    doc.text(
      '2. Saldo Berkelanjutan: Saldo akhir kas dan sisa persediaan barang secara kontinu menjadi saldo awal pada periode pelaporan bulan berikutnya.',
      margin,
      startY
    );
    startY += 3.5;
    doc.text(
      '3. Pengakuan & Verifikasi: Seluruh penerimaan dan pengeluaran didukung oleh bukti digital transaksi dan arsip internal terverifikasi sistem SakuKu.',
      margin,
      startY
    );
    startY += 8;

    // AUDIT SEAL & SIGNATURE BLOCK
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, startY, pageWidth - margin * 2, 28, 2, 2, 'FD');

    const col1X = margin + 20;
    const col2X = pageWidth - margin - 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SELESAI DIPERIKSA & DISETUJUI', col1X, startY + 5.5);
    doc.text('DISUSUN OLEH AUDITEE / PENGELOLA', col2X - 5, startY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('(Pemeriksa / Auditor / Mitra Keuangan)', col1X, startY + 9);
    doc.text('(Bagian Pembukuan & Keuangan)', col2X - 5, startY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('( .................................................. )', col1X - 6, startY + 23);
    doc.text(`( ${userName} )`, col2X - 5, startY + 23);

    // FOOTER ON ALL PAGES
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SakuKu Business Accounting  |  Standar Pemeriksaan SAK EMKM / IFRS  |  Halaman ${i} dari ${pageCount}`,
        margin,
        290
      );
      doc.text(
        `Arsip: Internal Storage/Download/SakuKu/Laporan_PDF_A4/Tahun_${selectedYear}/${monthPadded}_${monthName}`,
        pageWidth - margin,
        290,
        { align: 'right' }
      );
    }

    return doc.output('blob');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERSONAL / COMBINED MODE REPORT WITH DUAL-PART STRUCTURE & VISUALS
  // ══════════════════════════════════════════════════════════════════════════
  const modeLabel = filterMode === 'all' ? 'Semua Mode (Pribadi & Bisnis)' : 'Keuangan Pribadi';

  // Multi-Month / Annual Performance Trend for Personal/Combined
  const annualPerformanceTrend = Array.from({ length: selectedMonth + 1 }, (_, idx) => {
    const mTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== idx) return false;
      if (filterMode !== 'all' && t.mode !== filterMode) return false;
      return true;
    });
    const inc = mTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = mTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = inc - exp;
    return {
      monthName: INDO_MONTHS[idx],
      shortName: INDO_MONTHS[idx].substring(0, 3),
      income: inc,
      expense: exp,
      net,
    };
  });

  // Active budget matching
  const matchingBudgets = (budgets || []).filter((b) => {
    const isModeMatch = filterMode === 'all' ? true : b.mode === filterMode || b.mode === 'all';
    const bStart = new Date(b.start_date);
    const bEnd = new Date(b.end_date);
    const mStart = new Date(selectedYear, selectedMonth, 1);
    const mEnd = new Date(selectedYear, selectedMonth + 1, 0);
    return isModeMatch && bStart <= mEnd && bEnd >= mStart;
  });

  const matchingBudgetIds = matchingBudgets.map((b) => b.id);
  const relevantBudgetItems = (budgetItems || []).filter((item) =>
    matchingBudgetIds.includes(item.budget_id)
  );

  const plannedPerCatMap: { [catId: string]: number } = {};
  relevantBudgetItems.forEach((item) => {
    plannedPerCatMap[item.category_id] =
      (plannedPerCatMap[item.category_id] || 0) + item.planned_amount;
  });

  const totalPlannedBudget = Object.values(plannedPerCatMap).reduce((s, v) => s + v, 0);
  const hasBudgetPlan = totalPlannedBudget > 0;
  const remainingBudget = totalPlannedBudget - totalExpense;

  const plannedComparisons = categories
    .filter((c) => c.type === 'expense' && (plannedPerCatMap[c.id] || 0) > 0)
    .map((cat) => {
      const planned = plannedPerCatMap[cat.id] || 0;
      const actual = filteredTxs
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      const selisih = planned - actual;
      const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;
      return { category: cat, planned, actual, selisih, percentage };
    })
    .sort((a, b) => b.planned - a.planned);

  // Group top expense categories for graphic gauge bars
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
        color: [225, 29, 72] as [number, number, number],
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // =========================================================================
  // PAGE 1: BAGIAN 1 - PERJALANAN & PERTUMBUHAN KEUANGAN (EXECUTIVE GROWTH)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BAGIAN 1: LAPORAN PERJALANAN & PERTUMBUHAN KEUANGAN', margin, 11);

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text(`SAKUKU - ${modeLabel.toUpperCase()}`, margin, 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Periode: ${monthName} ${selectedYear}  |  Mata Uang: IDR (Rupiah)`, margin, 23.5);
  doc.text(
    `Pengelola: ${userName}  |  Total: ${filteredTxs.length} Transaksi  |  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    margin,
    29
  );

  let startY = 40;

  // SUMMARY CARDS
  if (hasBudgetPlan) {
    const boxW = 43;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.text('RENCANA ANGGARAN', margin + 3, startY + 4.5);
    doc.setFontSize(8.5);
    doc.text(formatRupiah(totalPlannedBudget), margin + 3, startY + 11);

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 205, 205);
    doc.roundedRect(margin + 46, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(153, 27, 27);
    doc.text('REALISASI KELUAR', margin + 49, startY + 4.5);
    doc.setFontSize(8.5);
    doc.text('-' + formatRupiah(totalExpense), margin + 49, startY + 11);

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin + 92, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(146, 64, 14);
    doc.text('SISA ANGGARAN', margin + 95, startY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(remainingBudget >= 0 ? 22 : 153, remainingBudget >= 0 ? 101 : 27, remainingBudget >= 0 ? 52 : 27);
    doc.text(formatRupiah(remainingBudget), margin + 95, startY + 11);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 138, startY, boxW + 1, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL SALDO KAS', margin + 141, startY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(reconciledEndingCash >= 0 ? 22 : 153, reconciledEndingCash >= 0 ? 101 : 27, reconciledEndingCash >= 0 ? 52 : 27);
    doc.text(formatRupiah(reconciledEndingCash), margin + 141, startY + 11);

    startY += 19;
  } else {
    const boxW = 58;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PEMASUKAN', margin + 3, startY + 4.5);
    doc.setFontSize(9);
    doc.text('+' + formatRupiah(totalIncome), margin + 3, startY + 11);

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 205, 205);
    doc.roundedRect(margin + 62, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL PENGELUARAN', margin + 65, startY + 4.5);
    doc.setFontSize(9);
    doc.text('-' + formatRupiah(totalExpense), margin + 65, startY + 11);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 124, startY, boxW, 15, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL SALDO KAS NYATA', margin + 127, startY + 4.5);
    doc.setFontSize(9);
    doc.setTextColor(reconciledEndingCash >= 0 ? 22 : 153, reconciledEndingCash >= 0 ? 101 : 27, reconciledEndingCash >= 0 ? 52 : 27);
    doc.text(formatRupiah(reconciledEndingCash), margin + 127, startY + 11);

    startY += 19;
  }

  // GRAFIK 1: MULTI-MONTH TREND CHART & EXPENSE GAUGE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`A. TREN PERKEMBANGAN FINANSIAL (JANUARI - ${monthName.toUpperCase()} ${selectedYear})`, margin, startY);
  startY += 3.5;

  const leftChartW = 88;
  drawMultiMonthTrendChart(
    doc,
    margin,
    startY,
    leftChartW,
    34,
    annualPerformanceTrend,
    selectedMonth
  );

  drawCategoryGaugeBars(
    doc,
    margin + leftChartW + 4,
    startY,
    leftChartW,
    34,
    topExpenseCategories.length > 0
      ? topExpenseCategories
      : [{ name: 'Belum Ada Pengeluaran', amount: 0, percentage: 0 }]
  );

  startY += 38;

  // GRAFIK 2: ALUR SALDO KAS BERKELANJUTAN (WATERFALL CARRYOVER)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('B. ALUR SALDO KAS BERKELANJUTAN (REKONSILIASI BULAN SEBELUMNYA)', margin, startY);
  startY += 3.5;

  drawCashflowWaterfall(
    doc,
    margin,
    startY,
    pageWidth - margin * 2,
    24,
    beginningMonthCash,
    totalIncome,
    totalExpense,
    reconciledEndingCash,
    prevMonthName
  );

  startY += 28;

  // KETERANGAN KONTINUITAS SALDO
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, startY, pageWidth - margin * 2, 9, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(67, 56, 202);
  doc.text(
    `* Kontinuitas Finansial: Saldo Kas Akhir ${monthName} (${formatRupiah(reconciledEndingCash)}) otomatis menjadi Saldo Kas Awal pada bulan berikutnya.`,
    margin + 3,
    startY + 5.5
  );

  // =========================================================================
  // PAGE 2: BAGIAN 2 - BUKU KAS & REKAPITULASI MUTASI TRANSAKSI
  // =========================================================================
  doc.addPage();
  startY = 14;

  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BAGIAN 2: BUKU KAS & REKAPITULASI MUTASI KEUANGAN', margin, 10);

  doc.setFontSize(9.5);
  doc.setTextColor(147, 197, 253);
  doc.text(`SAKUKU - BUKU BESAR TRANSAKSI & PENGESAHAN`, margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Periode: ${monthName} ${selectedYear}  |  Mata Uang: IDR (Rupiah)  |  Pengelola: ${userName}`,
    margin,
    21.5
  );

  startY = 35;

  // 1. TABEL RINGKASAN POS ANGGARAN TERENCANA (JIKA ADA)
  let secNum = 1;
  if (hasBudgetPlan && plannedComparisons.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${secNum}. PERBANDINGAN REALISASI VS RENCANA ANGGARAN`, margin, startY);
    startY += 3.5;
    secNum++;

    const totalActualPlanned = plannedComparisons.reduce((s, row) => s + row.actual, 0);
    const totalDiffPlanned = totalPlannedBudget - totalActualPlanned;
    const totalPct = totalPlannedBudget > 0 ? Math.round((totalActualPlanned / totalPlannedBudget) * 100) : 0;

    const budgetTableData = plannedComparisons.map((row, idx) => [
      String(idx + 1),
      row.category.name,
      formatRupiah(row.planned),
      formatRupiah(row.actual),
      (row.selisih >= 0 ? '+' : '') + formatRupiah(row.selisih),
      `${row.percentage}% ${row.percentage <= 100 ? '(Sesuai)' : '(Over)'}`,
    ]);

    budgetTableData.push([
      '',
      'TOTAL POS ANGGARAN',
      formatRupiah(totalPlannedBudget),
      formatRupiah(totalActualPlanned),
      (totalDiffPlanned >= 0 ? '+' : '') + formatRupiah(totalDiffPlanned),
      `${totalPct}%`,
    ]);

    autoTable(doc, {
      startY,
      head: [['No', 'Kategori Pengeluaran', 'Rencana (Rp)', 'Realisasi (Rp)', 'Selisih Varian', 'Status (%)']],
      body: budgetTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 54 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.row.index === budgetTableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 2. TABEL RINGKASAN ARUS KAS EKSEKUTIF (BUKU KAS)
  if (startY > 200) {
    doc.addPage();
    startY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${secNum}. RINGKASAN REKAPITULASI ARUS KAS EKSEKUTIF`, margin, startY);
  startY += 3.5;

  const cashSummaryRows = [
    ['1', 'Pemasukan Kas & Pendapatan', `+${formatRupiah(totalIncome)}`, `${filteredTxs.filter((t) => t.type === 'income').length} Transaksi Pemasukan`],
    ['2', 'Pengeluaran Kas & Belanja Kebutuhan', `-${formatRupiah(totalExpense)}`, `${filteredTxs.filter((t) => t.type === 'expense').length} Transaksi Pengeluaran`],
    ['3', 'Arus Kas Bersih Periode Berjalan (Net Flow)', `${netCashFlow >= 0 ? '+' : ''}${formatRupiah(netCashFlow)}`, netCashFlow >= 0 ? 'Surplus Kas' : 'Defisit Terkendali'],
    ['4', 'Saldo Awal Kas Bawaan (Dari Bulan Lalu)', formatRupiah(beginningMonthCash), `Sisa dari ${prevMonthName}`],
    ['5', 'TOTAL SALDO KAS BERJALAN (KUMULATIF)', formatRupiah(reconciledEndingCash), '100% Terkonsiliasi Nyata'],
  ];

  autoTable(doc, {
    startY,
    head: [['No', 'Uraian Komponen Kas', 'Jumlah Nominal (Rp)', 'Keterangan Analisis']],
    body: cashSummaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.6,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 44, halign: 'right' },
      3: { cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [238, 242, 255];
      }
    },
  });

  startY = (doc as any).lastAutoTable.finalY + 6;

  // 3. REKAPITULASI MUTASI TRANSAKSI KAS
  if (filteredTxs.length > 0) {
    if (startY > 200) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${secNum + 1}. REKAPITULASI BUKU MUTASI TRANSAKSI`, margin, startY);
    startY += 3.5;

    let runningBal = beginningMonthCash;
    const txRows = filteredTxs.map((tx, idx) => {
      if (tx.type === 'income') runningBal += tx.amount;
      else runningBal -= tx.amount;

      const cat = categories.find((c) => c.id === tx.category_id);
      const d = new Date(tx.date);
      const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

      return [
        String(idx + 1),
        dateFormatted,
        (tx.description || 'Transaksi Kas') + (cat ? ` (${cat.name})` : ''),
        tx.type === 'income' ? `+${formatRupiah(tx.amount)}` : '-',
        tx.type === 'expense' ? `-${formatRupiah(tx.amount)}` : '-',
        formatRupiah(runningBal),
      ];
    });

    autoTable(doc, {
      startY,
      head: [['No', 'Tanggal', 'Keterangan & Kategori', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)']],
      body: txRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 6.2,
        cellPadding: 1.2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 70 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;
  }

  // LEMBAR PENGESAHAN PENGELOLA
  if (startY > 235) {
    doc.addPage();
    startY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 25;
  const col2X = pageWidth - margin - 55;

  doc.text('Diperiksa Oleh,', col1X, startY);
  doc.text('Pengelola Keuangan,', col2X, startY);

  startY += 16;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('( ........................................ )', col1X - 8, startY);
  doc.text(`( ${userName} )`, col2X - 5, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Pemeriksa / Keluarga / Mitra', col1X - 4, startY + 4);
  doc.text('Pemilik Akun SakuKu', col2X + 2, startY + 4);

  // FOOTER ON ALL PAGES
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SakuKu Financial System  |  Dokumen Resmi A4 Berkelanjutan  |  Halaman ${i} dari ${pageCount}`,
      margin,
      290
    );
    doc.text(
      `Arsip: Internal Storage/Download/SakuKu/Laporan_PDF_A4/Tahun_${selectedYear}/${monthPadded}_${monthName}`,
      pageWidth - margin,
      290,
      { align: 'right' }
    );
  }

  return doc.output('blob');
}
