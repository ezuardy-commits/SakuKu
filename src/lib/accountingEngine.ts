import { Transaction, Category, Account, InventoryItem } from '../types';

export interface AccountingIncomeStatement {
  revenues: { categoryName: string; amount: number }[];
  totalRevenue: number;
  cogs: { categoryName: string; amount: number }[];
  totalCogs: number;
  grossProfit: number;
  grossProfitMargin: number; // percentage
  operatingExpenses: { categoryName: string; amount: number }[];
  totalOperatingExpenses: number;
  operatingIncome: number; // EBIT
  operatingProfitMargin: number; // percentage
  nonOperatingIncome: number;
  nonOperatingExpense: number;
  netIncomeBeforeTax: number;
  estimatedTax: number;
  netProfit: number;
  netProfitMargin: number; // percentage
}

export interface AccountingBalanceSheet {
  currentAssets: {
    cashOnHand: number;
    cashInBank: number;
    cashInEWallet: number;
    totalCashAndEquivalents: number;
    accountsReceivable: number;
    inventoryEstimate: number;
    totalCurrentAssets: number;
  };
  nonCurrentAssets: {
    equipmentAndMachinery: number;
    propertyAndTools: number;
    totalNonCurrentAssets: number;
  };
  totalAssets: number;
  currentLiabilities: {
    accountsPayable: number;
    accruedExpenses: number;
    shortTermDebt: number;
    totalCurrentLiabilities: number;
  };
  longTermLiabilities: {
    longTermLoans: number;
    totalLongTermLiabilities: number;
  };
  totalLiabilities: number;
  equity: {
    openingCapital: number;
    retainedEarnings: number;
    currentPeriodNetProfit: number;
    drawingsOrPrive: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  variance: number;
  debtReceivableSummary: {
    periodDebtRepayment: number;
    periodLoanReceived: number;
    periodReceivableCollected: number;
    periodReceivableIssued: number;
    outstandingReceivables: number;
    outstandingDebts: number;
  };
}

export interface AccountingCashFlowStatement {
  operatingActivities: {
    cashFromCustomers: number;
    cashFromReceivableCollection: number;
    cashPaidToSuppliersAndCogs: number;
    cashPaidForOperatingExpenses: number;
    cashPaidForReceivablesIssued: number;
    netCashFromOperating: number;
  };
  investingActivities: {
    purchaseOfEquipmentAndAssets: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    ownerCapitalInjection: number;
    loanReceivedFromLenders: number;
    loanRepaymentsPaid: number;
    ownerDrawingsPrive: number;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

export interface AccountingEquityStatement {
  beginningEquity: number;
  capitalAdditions: number;
  netIncomePeriod: number;
  drawingsPrive: number;
  endingEquity: number;
}

export interface AccountingFinancialReport {
  periodLabel: string;
  year: number;
  month?: number;
  businessName: string;
  incomeStatement: AccountingIncomeStatement;
  balanceSheet: AccountingBalanceSheet;
  cashFlowStatement: AccountingCashFlowStatement;
  equityStatement: AccountingEquityStatement;
  financialRatios: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    cashRatio: number;
    currentRatio: number;
    debtToAssetRatio: number;
  };
}

// Categorization heuristic based on Indonesian / International business keywords
export function classifyBusinessCategory(
  catName: string,
  type: 'income' | 'expense'
): 'revenue' | 'cogs' | 'opex' | 'non_operating_income' | 'non_operating_expense' | 'asset_purchase' | 'equity_prive' | 'loan_received' | 'loan_repayment' | 'receivable_collected' | 'receivable_given' {
  const lower = (catName || '').toLowerCase();

  if (type === 'income') {
    if (
      lower.includes('pinjaman baru') ||
      lower.includes('hutang baru') ||
      lower.includes('terima hutang') ||
      lower.includes('pencairan') ||
      lower.includes('kredit modal') ||
      lower.includes('penerimaan pinjaman') ||
      lower.includes('loan received')
    ) {
      return 'loan_received';
    }

    if (
      lower.includes('pelunasan piutang') ||
      lower.includes('terima piutang') ||
      lower.includes('tagihan pelanggan') ||
      lower.includes('penagihan piutang') ||
      lower.includes('receivable collected')
    ) {
      return 'receivable_collected';
    }

    if (lower.includes('investasi') || lower.includes('bunga') || lower.includes('dividen') || lower.includes('hibah')) {
      return 'non_operating_income';
    }
    return 'revenue';
  }

  // Expense classification
  if (
    lower.includes('pembayaran hutang') ||
    lower.includes('bayar hutang') ||
    lower.includes('cicilan') ||
    lower.includes('pelunasan hutang') ||
    lower.includes('angsuran') ||
    lower.includes('kpr') ||
    lower.includes('leasing') ||
    lower.includes('debt repayment') ||
    lower.includes('kredit bank')
  ) {
    return 'loan_repayment';
  }

  if (
    lower.includes('piutang diberikan') ||
    lower.includes('pinjaman diberikan') ||
    lower.includes('pemberian pinjaman') ||
    lower.includes('beri pinjaman') ||
    lower.includes('lending') ||
    lower.includes('receivables issued')
  ) {
    return 'receivable_given';
  }

  if (
    lower.includes('kulakan') ||
    lower.includes('bahan baku') ||
    lower.includes('stok') ||
    lower.includes('cogs') ||
    lower.includes('hpp') ||
    lower.includes('pembelian barang') ||
    lower.includes('grosir') ||
    lower.includes('kemasan') ||
    lower.includes('packaging')
  ) {
    return 'cogs';
  }

  if (
    lower.includes('peralatan') ||
    lower.includes('mesin') ||
    lower.includes('alat') ||
    lower.includes('inventaris') ||
    lower.includes('renovasi') ||
    lower.includes('laptop') ||
    lower.includes('kendaraan operasional') ||
    lower.includes('aset tetap')
  ) {
    return 'asset_purchase';
  }

  if (lower.includes('prive') || lower.includes('penarikan pemilik') || lower.includes('ambil pribadi')) {
    return 'equity_prive';
  }

  if (lower.includes('pajak') || lower.includes('bunga pinjaman') || lower.includes('admin bank') || lower.includes('denda')) {
    return 'non_operating_expense';
  }

  return 'opex';
}

export function computeBusinessAccountingReport(params: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedYear: number;
  selectedMonth?: number; // 0-11, or undefined if yearly
  businessName?: string;
  inventoryItems?: InventoryItem[]; // Data inventory aktual untuk Neraca & Laporan Stok
}): AccountingFinancialReport {
  const {
    transactions,
    categories,
    accounts,
    selectedYear,
    selectedMonth,
    businessName = 'Unit Bisnis / UMKM SakuKu',
    inventoryItems,
  } = params;

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

  const periodLabel =
    selectedMonth !== undefined
      ? `${INDO_MONTHS[selectedMonth]} ${selectedYear}`
      : `Tahun Buku ${selectedYear}`;

  // Filter business transactions up to current period for cumulative balance, and within period for P&L
  const businessAccounts = accounts.filter(
    (a) => a.scope === 'business' || (a.business_name && a.business_name.trim() !== '')
  );
  const businessAccountIds = new Set(businessAccounts.map((a) => a.id));

  const allBusinessTxs = transactions.filter(
    (tx) => tx.mode === 'business' || (tx.account_id && businessAccountIds.has(tx.account_id))
  );

  // Period transactions
  const periodTxs = allBusinessTxs.filter((tx) => {
    const d = new Date(tx.date);
    if (d.getFullYear() !== selectedYear) return false;
    if (selectedMonth !== undefined && d.getMonth() !== selectedMonth) return false;
    return true;
  });

  // Prior transactions (before this period)
  const priorTxs = allBusinessTxs.filter((tx) => {
    const d = new Date(tx.date);
    if (d.getFullYear() < selectedYear) return true;
    if (selectedMonth !== undefined && d.getFullYear() === selectedYear && d.getMonth() < selectedMonth) {
      return true;
    }
    return false;
  });

  // Map category IDs
  const catMap: { [id: string]: Category } = {};
  categories.forEach((c) => {
    catMap[c.id] = c;
  });

  // 1. COMPUTE INCOME STATEMENT (LABA RUGI KOMPREHENSIF)
  const revenueMap: { [name: string]: number } = {};
  const cogsMap: { [name: string]: number } = {};
  const opexMap: { [name: string]: number } = {};
  let nonOpIncome = 0;
  let nonOpExpense = 0;
  let assetPurchasesInPeriod = 0;
  let priveInPeriod = 0;
  let periodLoanReceived = 0;
  let periodReceivableCollected = 0;
  let periodDebtRepayment = 0;
  let periodReceivableIssued = 0;

  periodTxs.forEach((tx) => {
    const cat = catMap[tx.category_id];
    const catName = cat?.name || 'Operasional Lainnya';

    if (tx.type === 'income') {
      const cls = classifyBusinessCategory(catName, 'income');
      if (cls === 'loan_received') {
        periodLoanReceived += tx.amount;
      } else if (cls === 'receivable_collected') {
        periodReceivableCollected += tx.amount;
      } else if (cls === 'non_operating_income') {
        nonOpIncome += tx.amount;
      } else {
        revenueMap[catName] = (revenueMap[catName] || 0) + tx.amount;
      }
    } else {
      const cls = classifyBusinessCategory(catName, 'expense');
      if (cls === 'loan_repayment') {
        periodDebtRepayment += tx.amount;
      } else if (cls === 'receivable_given') {
        periodReceivableIssued += tx.amount;
      } else if (cls === 'cogs') {
        cogsMap[catName] = (cogsMap[catName] || 0) + tx.amount;
      } else if (cls === 'asset_purchase') {
        assetPurchasesInPeriod += tx.amount;
      } else if (cls === 'equity_prive') {
        priveInPeriod += tx.amount;
      } else if (cls === 'non_operating_expense') {
        nonOpExpense += tx.amount;
      } else {
        opexMap[catName] = (opexMap[catName] || 0) + tx.amount;
      }
    }
  });

  const revenues = Object.entries(revenueMap).map(([categoryName, amount]) => ({ categoryName, amount }));
  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);

  const cogs = Object.entries(cogsMap).map(([categoryName, amount]) => ({ categoryName, amount }));
  const totalCogs = cogs.reduce((s, r) => s + r.amount, 0);

  const grossProfit = totalRevenue - totalCogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const operatingExpenses = Object.entries(opexMap).map(([categoryName, amount]) => ({ categoryName, amount }));
  const totalOperatingExpenses = operatingExpenses.reduce((s, r) => s + r.amount, 0);

  const operatingIncome = grossProfit - totalOperatingExpenses;
  const operatingProfitMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;

  const netIncomeBeforeTax = operatingIncome + nonOpIncome - nonOpExpense;
  // SAK EMKM simple final tax rate estimation (e.g. PP 55 / 0.5% UMKM or standard)
  const estimatedTax = totalRevenue > 0 && netIncomeBeforeTax > 0 ? Math.round(totalRevenue * 0.005) : 0;
  const netProfit = netIncomeBeforeTax - estimatedTax;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const incomeStatement: AccountingIncomeStatement = {
    revenues,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    grossProfitMargin,
    operatingExpenses,
    totalOperatingExpenses,
    operatingIncome,
    operatingProfitMargin,
    nonOperatingIncome: nonOpIncome,
    nonOperatingExpense: nonOpExpense,
    netIncomeBeforeTax,
    estimatedTax,
    netProfit,
    netProfitMargin,
  };

  // 2. COMPUTE CASH BALANCE & LIQUIDITY FROM ACCOUNTS
  let cashOnHand = 0;
  let cashInBank = 0;
  let cashInEWallet = 0;

  businessAccounts.forEach((acc) => {
    const accTxs = allBusinessTxs.filter((t) => t.account_id === acc.id);
    const balance =
      (acc.opening_balance || 0) +
      accTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
      accTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    if (acc.type === 'cash') cashOnHand += Math.max(0, balance);
    else if (acc.type === 'bank') cashInBank += Math.max(0, balance);
    else if (acc.type === 'ewallet') cashInEWallet += Math.max(0, balance);
    else cashInBank += Math.max(0, balance);
  });

  // Fallback if no specific business accounts configured
  if (businessAccounts.length === 0) {
    const totalAllIncome = allBusinessTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalAllExpense = allBusinessTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    cashOnHand = Math.max(0, totalAllIncome - totalAllExpense);
  }

  const totalCashAndEquivalents = cashOnHand + cashInBank + cashInEWallet;

  // Cumulative Prior Net Income (Laba Ditahan Akumulatif)
  let priorNetIncome = 0;
  priorTxs.forEach((tx) => {
    if (tx.type === 'income') priorNetIncome += tx.amount;
    else priorNetIncome -= tx.amount;
  });

  // Cumulative Asset Purchases & Equipment
  let cumulativeEquipment = assetPurchasesInPeriod;
  let cumulativeLoanReceived = 0;
  let cumulativeLoanRepaid = 0;
  let cumulativeReceivableIssued = 0;
  let cumulativeReceivableCollected = 0;

  allBusinessTxs.forEach((tx) => {
    const cat = catMap[tx.category_id];
    const catName = cat?.name || '';
    if (tx.type === 'expense') {
      const cls = classifyBusinessCategory(catName, 'expense');
      if (cls === 'asset_purchase') {
        cumulativeEquipment += tx.amount;
      } else if (cls === 'loan_repayment') {
        cumulativeLoanRepaid += tx.amount;
      } else if (cls === 'receivable_given') {
        cumulativeReceivableIssued += tx.amount;
      }
    } else {
      const cls = classifyBusinessCategory(catName, 'income');
      if (cls === 'loan_received') {
        cumulativeLoanReceived += tx.amount;
      } else if (cls === 'receivable_collected') {
        cumulativeReceivableCollected += tx.amount;
      }
    }
  });

  const outstandingDebts = Math.max(0, cumulativeLoanReceived - cumulativeLoanRepaid);
  const outstandingReceivables = Math.max(0, cumulativeReceivableIssued - cumulativeReceivableCollected);

  // Opening Capital from business accounts opening balances
  const openingCapital = businessAccounts.reduce((s, a) => s + (a.opening_balance || 0), 0);

  // 3. BALANCE SHEET (LAPORAN POSISI KEUANGAN / NERACA)
  // Gunakan inventoryItems yang diteruskan dari ReportsView (sudah difilter per unit bisnis)
  // Fallback ke estimasi dari transaksi COGS jika tidak ada data inventory
  const invItems = inventoryItems || [];
  const recordedStockValuation = invItems
    .filter((it) => it.item_type === 'product_stock' || it.item_type === 'raw_material')
    .reduce((s, it) => s + it.qty * it.cost_price, 0);
  const recordedAssetValuation = invItems
    .filter((it) => it.item_type === 'equipment_asset')
    .reduce((s, it) => s + it.qty * it.cost_price, 0);

  const inventoryEstimate = recordedStockValuation > 0
    ? recordedStockValuation
    : (totalCogs > 0 ? Math.round(totalCogs * 0.2) : 0);

  const totalCurrentAssets = totalCashAndEquivalents + outstandingReceivables + inventoryEstimate;

  const currentAssets = {
    cashOnHand,
    cashInBank,
    cashInEWallet,
    totalCashAndEquivalents,
    accountsReceivable: outstandingReceivables,
    inventoryEstimate,
    totalCurrentAssets,
  };

  // Jika ada data inventory aktual, gunakan nilai aset tetap dari inventory
  // Jika tidak, fallback ke akumulasi pembelian aset dari transaksi
  const totalEquipmentValuation = recordedAssetValuation > 0
    ? recordedAssetValuation
    : cumulativeEquipment;

  const nonCurrentAssets = {
    equipmentAndMachinery: totalEquipmentValuation,
    propertyAndTools: 0,
    totalNonCurrentAssets: totalEquipmentValuation,
  };

  const totalAssets = currentAssets.totalCurrentAssets + nonCurrentAssets.totalNonCurrentAssets;

  const currentLiabilities = {
    accountsPayable: estimatedTax,
    accruedExpenses: 0,
    shortTermDebt: outstandingDebts,
    totalCurrentLiabilities: estimatedTax + outstandingDebts,
  };

  const longTermLiabilities = {
    longTermLoans: 0,
    totalLongTermLiabilities: 0,
  };

  const totalLiabilities = currentLiabilities.totalCurrentLiabilities + longTermLiabilities.totalLongTermLiabilities;

  // Equity calculations to maintain accounting equation (Assets = Liabilities + Equity)
  const retainedEarnings = priorNetIncome;
  const totalEquity = totalAssets - totalLiabilities;

  const equity = {
    openingCapital: openingCapital > 0 ? openingCapital : Math.max(0, totalEquity - netProfit - retainedEarnings),
    retainedEarnings,
    currentPeriodNetProfit: netProfit,
    drawingsOrPrive: priveInPeriod,
    totalEquity,
  };

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = variance < 1;

  const debtReceivableSummary = {
    periodDebtRepayment,
    periodLoanReceived,
    periodReceivableCollected,
    periodReceivableIssued,
    outstandingReceivables,
    outstandingDebts,
  };

  const balanceSheet: AccountingBalanceSheet = {
    currentAssets,
    nonCurrentAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalLiabilities,
    equity,
    totalLiabilitiesAndEquity,
    isBalanced,
    variance,
    debtReceivableSummary,
  };

  // 4. CASH FLOW STATEMENT (LAPORAN ARUS KAS - IAS 7 / SAK)
  const cashFromCustomers = totalRevenue;
  const cashFromReceivableCollection = periodReceivableCollected;
  const cashPaidToSuppliersAndCogs = totalCogs;
  const cashPaidForOperatingExpenses = totalOperatingExpenses + nonOpExpense + estimatedTax;
  const cashPaidForReceivablesIssued = periodReceivableIssued;
  const netCashFromOperating =
    cashFromCustomers +
    cashFromReceivableCollection -
    cashPaidToSuppliersAndCogs -
    cashPaidForOperatingExpenses -
    cashPaidForReceivablesIssued;

  const netCashFromInvesting = -assetPurchasesInPeriod;

  const loanReceivedFromLenders = periodLoanReceived;
  const loanRepaymentsPaid = periodDebtRepayment;
  const netCashFromFinancing = loanReceivedFromLenders - loanRepaymentsPaid - priveInPeriod;

  const netChangeInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;
  const endingCashBalance = totalCashAndEquivalents;
  const beginningCashBalance = endingCashBalance - netChangeInCash;

  const cashFlowStatement: AccountingCashFlowStatement = {
    operatingActivities: {
      cashFromCustomers,
      cashFromReceivableCollection,
      cashPaidToSuppliersAndCogs,
      cashPaidForOperatingExpenses,
      cashPaidForReceivablesIssued,
      netCashFromOperating,
    },
    investingActivities: {
      purchaseOfEquipmentAndAssets: assetPurchasesInPeriod,
      netCashFromInvesting,
    },
    financingActivities: {
      ownerCapitalInjection: 0,
      loanReceivedFromLenders,
      loanRepaymentsPaid,
      ownerDrawingsPrive: priveInPeriod,
      netCashFromFinancing,
    },
    netChangeInCash,
    beginningCashBalance: Math.max(0, beginningCashBalance),
    endingCashBalance,
  };

  // 5. EQUITY STATEMENT (LAPORAN PERUBAHAN EKUITAS)
  const beginningEquity = totalEquity - netProfit + priveInPeriod;
  const equityStatement: AccountingEquityStatement = {
    beginningEquity,
    capitalAdditions: 0,
    netIncomePeriod: netProfit,
    drawingsPrive: priveInPeriod,
    endingEquity: totalEquity,
  };

  // 6. FINANCIAL RATIOS
  const financialRatios = {
    grossMargin: Math.round(grossProfitMargin * 10) / 10,
    operatingMargin: Math.round(operatingProfitMargin * 10) / 10,
    netMargin: Math.round(netProfitMargin * 10) / 10,
    cashRatio: totalLiabilities > 0 ? Math.round((totalCashAndEquivalents / totalLiabilities) * 100) / 100 : 1,
    currentRatio: totalLiabilities > 0 ? Math.round((currentAssets.totalCurrentAssets / totalLiabilities) * 100) / 100 : 1,
    debtToAssetRatio: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0,
  };

  return {
    periodLabel,
    year: selectedYear,
    month: selectedMonth,
    businessName,
    incomeStatement,
    balanceSheet,
    cashFlowStatement,
    equityStatement,
    financialRatios,
  };
}
