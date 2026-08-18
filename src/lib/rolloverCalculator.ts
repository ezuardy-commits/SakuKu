import { Budget, BudgetItem, Transaction, ModeType } from '../types';
import { formatRupiah } from './formatters';

export interface BudgetRolloverCalculation {
  targetStartDate: string;
  targetEndDate?: string;
  baselineMonthName: string;
  baselineStart: string;
  baselineEnd: string;
  isPastMonth: boolean; // True if today > baselineEnd (after month end)
  rolloverType: 'actual_previous' | 'predicted_ongoing';
  
  // Realized so far (or full month if past)
  realizedIncome: number;
  realizedExpense: number;
  realizedNetBalance: number;
  
  // Remaining planned for rest of month (if ongoing)
  hasOngoingBudget: boolean;
  ongoingBudgetName?: string;
  remainingPlannedIncome: number;
  remainingPlannedExpense: number;
  remainingPlannedNet: number;
  
  // Final calculated carryover
  calculatedCarryover: number;
  
  // Unified fields
  amount: number;
  type: 'actual_previous' | 'predicted_ongoing' | 'none';
  note: string;
  explanation: string;
  statusTitle: string;
  statusBadge: string;
  summaryText: string;
  baselinePeriodName: string;
  calculationDetails: {
    realizedIncome: number;
    realizedExpense: number;
    realizedNet: number;
    plannedRemainingNet: number;
    plannedIncome: number;
    plannedExpense: number;
  };
}

export type RolloverCalculationResult = BudgetRolloverCalculation;

export interface CalculateRolloverParams {
  newBudgetStartDate?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  budgetMode?: ModeType | 'all';
  mode?: ModeType | 'all';
  transactions: Transaction[];
  budgets: Budget[];
  budgetItems: BudgetItem[];
  customTodayStr?: string;
}

/**
 * Calculates continuous rollover budget balance (Sisa Anggaran Berkelanjutan)
 * - If creating budget after previous month ended -> 100% Real previous month actual net balance
 * - If creating budget before previous month ended (mid-month) -> AI prediction: Realized to date + Remaining Planned to end of month
 */
export function calculateBudgetRollover(
  arg1: CalculateRolloverParams | string,
  arg2?: string,
  arg3?: ModeType | 'all',
  arg4?: Transaction[],
  arg5?: Budget[],
  arg6?: BudgetItem[],
  arg7?: string
): RolloverCalculationResult {
  let targetStartDate = '';
  let targetEndDate = '';
  let mode: ModeType | 'all' = 'all';
  let transactions: Transaction[] = [];
  let budgets: Budget[] = [];
  let budgetItems: BudgetItem[] = [];
  let customTodayStr: string | undefined = undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    targetStartDate = arg1.newBudgetStartDate || arg1.targetStartDate || '';
    targetEndDate = arg1.targetEndDate || '';
    mode = arg1.budgetMode || arg1.mode || 'all';
    transactions = arg1.transactions || [];
    budgets = arg1.budgets || [];
    budgetItems = arg1.budgetItems || [];
    customTodayStr = arg1.customTodayStr;
  } else {
    targetStartDate = typeof arg1 === 'string' ? arg1 : '';
    targetEndDate = arg2 || '';
    mode = arg3 || 'all';
    transactions = arg4 || [];
    budgets = arg5 || [];
    budgetItems = arg6 || [];
    customTodayStr = arg7;
  }

  const today = customTodayStr ? new Date(customTodayStr) : new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Parse target start date or fallback to today
  const targetStart = targetStartDate ? new Date(targetStartDate) : new Date();
  const targetYear = isNaN(targetStart.getFullYear()) ? today.getFullYear() : targetStart.getFullYear();
  const targetMonth = isNaN(targetStart.getMonth()) ? today.getMonth() : targetStart.getMonth();

  // Baseline previous month relative to targetStartDate
  // If target start is Month M, previous month is Month M - 1
  const prevMonthDate = new Date(targetYear, targetMonth - 1, 1);
  const baselineYear = prevMonthDate.getFullYear();
  const baselineMonth = prevMonthDate.getMonth(); // 0-11

  const baselineDaysInMonth = new Date(baselineYear, baselineMonth + 1, 0).getDate();
  const baselineStart = `${baselineYear}-${String(baselineMonth + 1).padStart(2, '0')}-01`;
  const baselineEnd = `${baselineYear}-${String(baselineMonth + 1).padStart(2, '0')}-${String(baselineDaysInMonth).padStart(2, '0')}`;

  const baselineMonthName = prevMonthDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Filter transactions matching mode
  const modeTxFilter = (tx: Transaction) => {
    if (mode === 'all') return true;
    return tx.mode === mode;
  };

  // Determine if today is after baselineEnd
  const isPastMonth = todayStr > baselineEnd;

  if (isPastMonth) {
    // -------------------------------------------------------------
    // KASUS 1: SETELAH AKHIR BULAN (Past Month -> 100% Realisasi Riil)
    // -------------------------------------------------------------
    let realizedIncome = 0;
    let realizedExpense = 0;

    transactions.forEach((tx) => {
      const txDate = tx.date ? tx.date.substring(0, 10) : '';
      if (txDate >= baselineStart && txDate <= baselineEnd && modeTxFilter(tx)) {
        if (tx.type === 'income') {
          realizedIncome += tx.amount || 0;
        } else if (tx.type === 'expense') {
          realizedExpense += tx.amount || 0;
        }
      }
    });

    const realizedNetBalance = realizedIncome - realizedExpense;

    // Check if there was a saved budget for that baseline period
    const prevBudget = budgets.find((b) => {
      if (mode !== 'all' && b.mode !== 'all' && b.mode !== mode) return false;
      return (
        (b.start_date >= baselineStart && b.start_date <= baselineEnd) ||
        (b.end_date >= baselineStart && b.end_date <= baselineEnd)
      );
    });

    const explanation = `Periode ${baselineMonthName} telah berakhir penuh (100% Final). Sisa kas riil dihitung dari pemasukan nyata (${formatRupiah(realizedIncome)}) dikurangi seluruh pengeluaran nyata (${formatRupiah(realizedExpense)}).`;
    const note = `Sisa kas riil 100% dari ${baselineMonthName} (Pemasukan: ${formatRupiah(realizedIncome)}, Pengeluaran: ${formatRupiah(realizedExpense)})`;

    return {
      targetStartDate,
      targetEndDate,
      baselineMonthName,
      baselinePeriodName: baselineMonthName,
      baselineStart,
      baselineEnd,
      isPastMonth: true,
      rolloverType: 'actual_previous',
      type: 'actual_previous',
      amount: realizedNetBalance,
      calculatedCarryover: realizedNetBalance,
      note,
      realizedIncome,
      realizedExpense,
      realizedNetBalance,
      hasOngoingBudget: !!prevBudget,
      ongoingBudgetName: prevBudget?.name,
      remainingPlannedIncome: 0,
      remainingPlannedExpense: 0,
      remainingPlannedNet: 0,
      statusTitle: 'Sisa Anggaran Riil Bulan Lalu',
      statusBadge: '🟢 Realisasi Penuh 100% (Bulan Lalu Selesai)',
      explanation,
      summaryText: `Sisa Kas Riil: ${formatRupiah(realizedNetBalance)}`,
      calculationDetails: {
        realizedIncome,
        realizedExpense,
        realizedNet: realizedNetBalance,
        plannedRemainingNet: 0,
        plannedIncome: 0,
        plannedExpense: 0,
      },
    };
  } else {
    // -------------------------------------------------------------
    // KASUS 2: SEBELUM BULAN BARU / BULAN BERJALAN BELUM SELESAI
    // (Ongoing Month -> Realisasi Berjalan + Prediksi Sisa Rencana)
    // -------------------------------------------------------------
    
    // 1. Realisasi Berjalan s.d. Hari Ini (baselineStart s.d. todayStr)
    let realizedIncome = 0;
    let realizedExpense = 0;

    transactions.forEach((tx) => {
      const txDate = tx.date ? tx.date.substring(0, 10) : '';
      if (txDate >= baselineStart && txDate <= todayStr && modeTxFilter(tx)) {
        if (tx.type === 'income') {
          realizedIncome += tx.amount || 0;
        } else if (tx.type === 'expense') {
          realizedExpense += tx.amount || 0;
        }
      }
    });

    const realizedNetBalance = realizedIncome - realizedExpense;

    // 2. Sisa Rencana Berjalan (todayStr + 1 s.d. baselineEnd)
    // Cari budget aktif bulan berjalan
    const ongoingBudget = budgets.find((b) => {
      if (mode !== 'all' && b.mode !== 'all' && b.mode !== mode) return false;
      return (
        (b.start_date <= todayStr && b.end_date >= todayStr) ||
        (b.start_date >= baselineStart && b.start_date <= baselineEnd)
      );
    });

    let remainingPlannedIncome = 0;
    let remainingPlannedExpense = 0;
    let hasOngoingBudget = false;

    if (ongoingBudget) {
      hasOngoingBudget = true;
      const ongoingItems = budgetItems.filter((bi) => bi.budget_id === ongoingBudget.id);
      
      ongoingItems.forEach((item) => {
        const itemRemDate = item.reminder_date || ongoingBudget.end_date;
        const isFutureSchedule = itemRemDate > todayStr;
        
        // If the item is scheduled in the future or not fully spent
        if (isFutureSchedule) {
          remainingPlannedExpense += item.planned_amount || 0;
        } else {
          // If scheduled today or earlier, count unspent portion
          const unspent = Math.max(0, (item.planned_amount || 0) - (item.spent_amount || 0));
          remainingPlannedExpense += unspent;
        }
      });
    } else {
      // If no explicit budget created, calculate run-rate projection for remaining days
      const dayOfMonth = Math.max(1, today.getDate());
      const daysRemaining = Math.max(0, baselineDaysInMonth - dayOfMonth);

      if (dayOfMonth > 0 && daysRemaining > 0) {
        const dailyIncomeRate = realizedIncome / dayOfMonth;
        const dailyExpenseRate = realizedExpense / dayOfMonth;
        remainingPlannedIncome = Math.round(dailyIncomeRate * daysRemaining);
        remainingPlannedExpense = Math.round(dailyExpenseRate * daysRemaining);
      }
    }

    const remainingPlannedNet = remainingPlannedIncome - remainingPlannedExpense;
    const calculatedCarryover = realizedNetBalance + remainingPlannedNet;

    const explanation = `Anggaran dibuat sebelum bulan baru selesai. AI menggabungkan realisasi kas s.d. hari ini (${formatRupiah(realizedNetBalance)}) dengan estimasi sisa rencana hingga akhir bulan (${formatRupiah(remainingPlannedNet)}) sebagai prediksi sisa kas bawaan.`;
    const note = `Prediksi AI bulan berjalan (Realisasi s.d. hari ini: ${formatRupiah(realizedNetBalance)}, Sisa rencana: ${formatRupiah(remainingPlannedNet)})`;

    return {
      targetStartDate,
      targetEndDate,
      baselineMonthName,
      baselinePeriodName: baselineMonthName,
      baselineStart,
      baselineEnd,
      isPastMonth: false,
      rolloverType: 'predicted_ongoing',
      type: 'predicted_ongoing',
      amount: calculatedCarryover,
      calculatedCarryover,
      note,
      realizedIncome,
      realizedExpense,
      realizedNetBalance,
      hasOngoingBudget,
      ongoingBudgetName: ongoingBudget?.name,
      remainingPlannedIncome,
      remainingPlannedExpense,
      remainingPlannedNet,
      statusTitle: 'Prediksi AI Sisa Anggaran Bulan Berjalan',
      statusBadge: '🔮 Prediksi AI Cerdas (Realisasi Berjalan + Sisa Rencana)',
      explanation,
      summaryText: `Prediksi Sisa Kas: ${formatRupiah(calculatedCarryover)} (Realisasi: ${formatRupiah(realizedNetBalance)} + Sisa Rencana: ${formatRupiah(remainingPlannedNet)})`,
      calculationDetails: {
        realizedIncome,
        realizedExpense,
        realizedNet: realizedNetBalance,
        plannedRemainingNet: remainingPlannedNet,
        plannedIncome: remainingPlannedIncome,
        plannedExpense: remainingPlannedExpense,
      },
    };
  }
}
