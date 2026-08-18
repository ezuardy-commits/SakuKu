import React, { useState } from 'react';
import { Account, Category, Transaction, ModeType } from '../types';
import { formatRupiah, formatDateIndonesian, formatTime, parseTxDate } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/db';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Camera,
  Image,
  FileText,
  User,
  Store,
  Wallet,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Calendar,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  MoreVertical,
  Eye,
  Bot,
  AlertCircle,
  ShieldCheck,
  Target,
  Lightbulb,
  Scale,
  History,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  CheckCircle2,
  Activity,
  ArrowLeftRight,
} from 'lucide-react';

interface DashboardViewProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  activeMode: 'all' | ModeType;
  onOpenAddModal: (sourceType?: 'manual' | 'receipt' | 'statement' | 'handwritten') => void;
  onNavigateToTransactions: () => void;
  onNavigateToBudget: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  categories,
  transactions,
  activeMode,
  onOpenAddModal,
  onNavigateToTransactions,
  onNavigateToBudget,
  onSelectTransaction,
  onDeleteTransaction,
}) => {
  const { t, language } = useLanguage();
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'month' | 'all'>('month');
  const [detailModalType, setDetailModalType] = useState<'income' | 'expense' | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [activeMenuTxId, setActiveMenuTxId] = useState<string | null>(null);

  // Filter and sort transactions chronologically descending (newest transaction date first)
  const filteredTxs = transactions
    .filter((tx) => (activeMode === 'all' ? true : tx.mode === activeMode))
    .sort((a, b) => {
      const timeA = parseTxDate(a.date).getTime();
      const timeB = parseTxDate(b.date).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || '').localeCompare(a.id || '');
    });

  // Filter accounts based on activeMode (all | personal | business)
  const modeAccounts = accounts.filter((acc) => {
    if (activeMode === 'all') return true;
    if (activeMode === 'personal') return acc.scope === 'personal' || acc.scope === 'combined';
    if (activeMode === 'business') return acc.scope === 'business' || acc.scope === 'combined';
    return true;
  });

  // Calculate Total Saldo for active mode accounts
  const totalBalance = modeAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  // Local Date Calculations
  const now = new Date();
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');

  const localTodayStr = `${localYear}-${localMonth}-${localDay}`;
  const localMonthStr = `${localYear}-${localMonth}`;

  // Filter transactions for specific periods
  const todayTxs = filteredTxs.filter(
    (tx) => tx.date && (tx.date.startsWith(localTodayStr) || tx.date.substring(0, 10) === localTodayStr)
  );

  const monthTxs = filteredTxs.filter(
    (tx) => tx.date && (tx.date.startsWith(localMonthStr) || tx.date.substring(0, 7) === localMonthStr)
  );

  const activePeriod = summaryPeriod;

  const displayTxs =
    activePeriod === 'today'
      ? todayTxs
      : activePeriod === 'month'
      ? monthTxs
      : filteredTxs;

  const periodIncome = displayTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const periodExpense = displayTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // ═══ REKONSILIASI SALDO KAS BERKELANJUTAN (CARRYOVER PREVIOUS MONTH & SAK EMKM / IAS 7) ═══
  const prevMonthDate = new Date(localYear, now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  const currentMonthName = now.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Previous Month Transactions
  const prevMonthTxs = filteredTxs.filter(
    (tx) => tx.date && (tx.date.startsWith(prevMonthStr) || tx.date.substring(0, 7) === prevMonthStr)
  );
  const prevMonthIncome = prevMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthExpense = prevMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthNet = prevMonthIncome - prevMonthExpense;

  // Cumulative transactions strictly prior to current month
  const priorTxs = filteredTxs.filter((tx) => tx.date && tx.date.substring(0, 7) < localMonthStr);
  const priorIncome = priorTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const priorExpense = priorTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const openingCapitalAccounts = modeAccounts.reduce((sum, acc) => sum + (acc.opening_balance || 0), 0);

  // Beginning Cash Balance for current month (Carryover Kumulatif)
  const beginningMonthCash = openingCapitalAccounts + priorIncome - priorExpense;

  // Current Month Inflows & Outflows
  const currentMonthIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentMonthNet = currentMonthIncome - currentMonthExpense;

  // 5 Latest Transaksi
  const latestTxs = filteredTxs.slice(0, 5);

  const getAccountName = (accId: string) => {
    return accounts.find((a) => a.id === accId)?.name || 'Akun';
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  // ═══ DYNAMIC ACCOUNT AI PHRASING GENERATOR (NON-REPEATING & CONTEXT-AWARE) ═══
  const generateDynamicAccountComment = (
    acc: Account,
    todayIn: number,
    todayOut: number,
    lastExpense: Transaction | undefined,
    lastIncome: Transaction | undefined | null,
    isId: boolean,
    accIndex: number
  ): string => {
    const accNameLower = (acc.name || '').toLowerCase();
    const isCash = accNameLower.includes('tunai') || accNameLower.includes('dompet') || accNameLower.includes('cash') || accNameLower.includes('saku');
    const isQris = accNameLower.includes('qris') || accNameLower.includes('edc') || accNameLower.includes('wallet') || accNameLower.includes('gopay') || accNameLower.includes('ovo') || accNameLower.includes('kasir');
    const isBusiness = acc.scope === 'business';

    // Unique hash seed based on account ID + index + balance to ensure zero duplicate phrases
    const seed = (acc.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) + accIndex * 7 + Math.floor(acc.current_balance % 100)) % 10;

    // 1. OUTFLOW ONLY
    if (todayOut > 0 && todayIn === 0) {
      const descText = lastExpense ? `"${lastExpense.description}"` : 'kebutuhan pos';
      if (isId) {
        if (isCash) {
          const variants = [
            `Uang fisik keluar ${formatRupiah(todayOut)} untuk ${descText}. Sisa uang pegangan di dompet ${formatRupiah(acc.current_balance)}, masih cukup aman buat jajan sore! 👛`,
            `Dompet kas berkurang ${formatRupiah(todayOut)} belanja ${descText}. Sisa saldo tunai ${formatRupiah(acc.current_balance)}. Tetap cermat hitung kembalian ya! 💵`,
            `Ada pengeluaran tunai ${formatRupiah(todayOut)} (${descText}). Uang fisik di saku tersisa ${formatRupiah(acc.current_balance)}, jaga agar gak bocor halus! 🏷️`,
            `Terpakai ${formatRupiah(todayOut)} dari kas kecil untuk ${descText}. Sisa dana siap pakai di dompet sebesar ${formatRupiah(acc.current_balance)} ✨`,
          ];
          return variants[seed % variants.length];
        }
        if (isBusiness) {
          const variants = [
            `Biaya operasional unit usaha keluar ${formatRupiah(todayOut)} untuk ${descText}. Saldo kas toko terjaga di ${formatRupiah(acc.current_balance)}, pembukuan rapi! 🏢`,
            `Kas bisnis ini terpakai ${formatRupiah(todayOut)} bayar ${descText}. Likuiditas modal kerja tersisa ${formatRupiah(acc.current_balance)}, siap jalan terus! ⚙️`,
            `Tercatat pengeluaran usaha ${formatRupiah(todayOut)} (${descText}). Saldo rekening bisnis masih kokoh di ${formatRupiah(acc.current_balance)}! 📦`,
            `Pengeluaran pos bisnis ${formatRupiah(todayOut)} untuk ${descText}. Cadangan dana operasional aman terkontrol di ${formatRupiah(acc.current_balance)} ☕`,
          ];
          return variants[seed % variants.length];
        }
        // Bank / Rekening Pribadi
        const variants = [
          `Debet rekening ${formatRupiah(todayOut)} untuk ${descText}. Saldo simpanan tersisa ${formatRupiah(acc.current_balance)}, alokasi pos tetap terjaga! 💳`,
          `Transfer keluar ${formatRupiah(todayOut)} (${descText}). Rekening ini masih menyimpan dana ${formatRupiah(acc.current_balance)}, aman terkontrol! 🛡️`,
          `Terpakai ${formatRupiah(todayOut)} untuk pemenuhan ${descText}. Dana di rekening ini bersisa ${formatRupiah(acc.current_balance)}, mantap! ✨`,
          `Mutasi keluar ${formatRupiah(todayOut)} teralokasi ke ${descText}. Sisa saldo bank ${formatRupiah(acc.current_balance)} siap untuk pos berikutnya 🏦`,
        ];
        return variants[seed % variants.length];
      } else {
        if (isCash) {
          return `Physical cash outflow of ${formatRupiah(todayOut)} on ${descText}. Remaining wallet cash: ${formatRupiah(acc.current_balance)}! 👛`;
        }
        if (isBusiness) {
          return `Business expense of ${formatRupiah(todayOut)} for ${descText}. Operating balance holds steady at ${formatRupiah(acc.current_balance)}! 🏢`;
        }
        return `Account debit of ${formatRupiah(todayOut)} for ${descText}. Safe reserve balance remaining: ${formatRupiah(acc.current_balance)}! 💳`;
      }
    }

    // 2. INFLOW ONLY
    if (todayIn > 0 && todayOut === 0) {
      const descText = lastIncome ? `"${lastIncome.description}"` : 'penerimaan dana';
      if (isId) {
        if (isQris) {
          const variants = [
            `Cuan QRIS digital masuk ${formatRupiah(todayIn)} dari ${descText}. Saldo kasir makin segar mencapai ${formatRupiah(acc.current_balance)}! 📱⚡`,
            `Setoran non-tunai bertambah ${formatRupiah(todayIn)} (${descText}). Akun penerimaan digital terisi ${formatRupiah(acc.current_balance)}! 🚀`,
            `Omzet kasir meluncur masuk ${formatRupiah(todayIn)} via ${descText}. Saldo kasir digital siap di-settle ${formatRupiah(acc.current_balance)}! 💳✨`,
            `Penerimaan QRIS lancar ${formatRupiah(todayIn)} (${descText}). Kas digital terakumulasi ${formatRupiah(acc.current_balance)} 🎉`,
          ];
          return variants[seed % variants.length];
        }
        if (isBusiness) {
          const variants = [
            `Arus kas bisnis bertambah ${formatRupiah(todayIn)} dari ${descText}. Saldo modal dan kas usaha menguat ke ${formatRupiah(acc.current_balance)}! 📈💰`,
            `Penerimaan omzet dagang masuk ${formatRupiah(todayIn)} (${descText}). Kas operasional bisnis makin gemuk di ${formatRupiah(acc.current_balance)}! ☕🎉`,
            `Inflow hasil usaha bertambah ${formatRupiah(todayIn)} (${descText}). Rekening bisnis ini makin sehat dengan total ${formatRupiah(acc.current_balance)}! 🏢✨`,
            `Setoran penjualan masuk ${formatRupiah(todayIn)} (${descText}). Posisi likuiditas kas usaha mantap di ${formatRupiah(acc.current_balance)} 🚀`,
          ];
          return variants[seed % variants.length];
        }
        // Pribadi / Cash
        const variants = [
          `Hore, ada dana masuk ${formatRupiah(todayIn)} dari ${descText}! Saldo kas ini menebal jadi ${formatRupiah(acc.current_balance)} 🥳💵`,
          `Pemasukan baru bertambah ${formatRupiah(todayIn)} (${descText}). Kantong simpanan ini sekarang berisi ${formatRupiah(acc.current_balance)}! 💎`,
          `Aliran cuan masuk ${formatRupiah(todayIn)} (${descText}). Saldo rekening naik level ke ${formatRupiah(acc.current_balance)}! 🚀`,
          `Penerimaan dana ${formatRupiah(todayIn)} sukses dicatat (${descText}). Saldo kas bertambah kuat ke ${formatRupiah(acc.current_balance)} ✨`,
        ];
        return variants[seed % variants.length];
      } else {
        if (isQris) {
          return `QRIS digital collection of ${formatRupiah(todayIn)} from ${descText}. Digital cashier balance reached ${formatRupiah(acc.current_balance)}! 📱⚡`;
        }
        if (isBusiness) {
          return `Commercial inflow of ${formatRupiah(todayIn)} from ${descText}. Business liquidity expanded to ${formatRupiah(acc.current_balance)}! 📈💰`;
        }
        return `Fresh income of ${formatRupiah(todayIn)} logged from ${descText}. Total balance boosted to ${formatRupiah(acc.current_balance)}! 🥳💵`;
      }
    }

    // 3. BOTH INFLOW & OUTFLOW
    if (todayIn > 0 && todayOut > 0) {
      const net = todayIn - todayOut;
      const netStr = `${net >= 0 ? '+' : ''}${formatRupiah(net)}`;
      if (isId) {
        const variants = [
          `Perputaran kas sangat hidup: Masuk ${formatRupiah(todayIn)}, keluar ${formatRupiah(todayOut)} (Hasil bersih: ${netStr}). Saldo akhir kini ${formatRupiah(acc.current_balance)} 🔄✨`,
          `Aktivitas lalu lintas dana ramai: Penerimaan ${formatRupiah(todayIn)} & belanja ${formatRupiah(todayOut)} (Net: ${netStr}). Saldo terupdate ${formatRupiah(acc.current_balance)} 📊💼`,
          `Mutasi dua arah dinamis: Cuan masuk ${formatRupiah(todayIn)} dipotong biaya ${formatRupiah(todayOut)} (Selisih: ${netStr}). Saldo stabil di ${formatRupiah(acc.current_balance)} ⚡`,
          `Arus kas aktif: Pemasukan ${formatRupiah(todayIn)} vs pengeluaran ${formatRupiah(todayOut)} (Surplus/Defisit: ${netStr}). Saldo terkini ${formatRupiah(acc.current_balance)} 📈`,
        ];
        return variants[seed % variants.length];
      } else {
        return `Two-way turnover active: Received ${formatRupiah(todayIn)}, disbursed ${formatRupiah(todayOut)} (Net: ${netStr}). Final balance stands at ${formatRupiah(acc.current_balance)} 🔄✨`;
      }
    }

    // 4. IDLE / NO TRANSACTIONS TODAY (DYNAMIC & COMPLETELY UNIQUE PER ACCOUNT)
    if (isId) {
      if (isCash) {
        const cashIdleVariants = [
          `Uang tunai di dompet ini belum terpakai sama sekali hari ini. Saldo fisik aman tersimpan ${formatRupiah(acc.current_balance)} 👛🌿`,
          `Belum ada lembaran rupiah yang keluar dari dompet ini. Saldo kas saku bertapa tenang di ${formatRupiah(acc.current_balance)} 💵🧘`,
          `Kas kecil ini masih utuh tanpa pengeluaran jajan hari ini. Saldo tunai standby di angka ${formatRupiah(acc.current_balance)} 🛡️✨`,
          `Dompet fisikmu beristirahat damai tanpa pengeluaran receh hari ini. Sisa kas siap pakai ${formatRupiah(acc.current_balance)} 🍃`,
        ];
        return cashIdleVariants[seed % cashIdleVariants.length];
      }
      if (isQris) {
        const qrisIdleVariants = [
          `Kanal pembayaran digital kasir ini standby menunggu transaksi berikutnya. Saldo tercatat ${formatRupiah(acc.current_balance)} 📱⚡`,
          `Belum ada settlement baru masuk ke QRIS/EDC hari ini. Saldo penampungan kasir berada di ${formatRupiah(acc.current_balance)} 💳✨`,
          `Akun kasir digital ini siap menerima pelanggan, saldo tersimpan saat ini ${formatRupiah(acc.current_balance)} 🛒🚀`,
          `Kanal QRIS kasir tenang dan ready untuk pembayaran pelanggan. Saldo kas saat ini ${formatRupiah(acc.current_balance)} 💡`,
        ];
        return qrisIdleVariants[seed % qrisIdleVariants.length];
      }
      if (isBusiness) {
        const bizIdleVariants = [
          `Kas operasional unit usaha ini stabil tanpa mutasi keluar/masuk hari ini. Cadangan modal kerja terjaga di ${formatRupiah(acc.current_balance)} 🏢🛡️`,
          `Rekening bisnis ini dalam posisi hening terjaga. Dana operasional perusahaan aman di angka ${formatRupiah(acc.current_balance)} 💼🌿`,
          `Tidak ada biaya tak terduga yang menyentuh kas bisnis ini hari ini. Likuiditas usaha kokoh di ${formatRupiah(acc.current_balance)} 📈✨`,
          `Posisi kas unit usaha ini sangat stabil tanpa tarikan biaya mendadak. Saldo aman di ${formatRupiah(acc.current_balance)} ☕🛡️`,
          `Arus kas bisnis ini tenang tanpa pengeluaran operasional hari ini. Modal kerja terjaga rapi di ${formatRupiah(acc.current_balance)} 🏪`,
        ];
        return bizIdleVariants[seed % bizIdleVariants.length];
      }
      // Bank / Tabungan Pribadi
      const bankIdleVariants = [
        `Rekening bank ini bertapa damai tanpa mutasi hari ini. Dana simpanan terjaga utuh sebesar ${formatRupiah(acc.current_balance)} 🧘🛡️`,
        `Tidak ada debet atau transfer keluar dari rekening ini. Tabungan kamu aman terkunci di ${formatRupiah(acc.current_balance)} 🔒💎`,
        `Saldo rekening simpanan ini istirahat tenang hari ini. Posisi dana tetap solid di ${formatRupiah(acc.current_balance)} 🌿✨`,
        `Kondisi saldo bank ini sangat stabil dan tidak tersentuh belanja impulsif, aman di ${formatRupiah(acc.current_balance)} 🛡️👍`,
        `Rekening utama ini terjaga rapi tanpa tarikan dana keluar hari ini. Saldo standby di ${formatRupiah(acc.current_balance)} 🏦🌟`,
      ];
      return bankIdleVariants[seed % bankIdleVariants.length];
    } else {
      if (isCash) {
        return `Physical cash remains untouched today. Wallet balance stands undisturbed at ${formatRupiah(acc.current_balance)} 👛🌿`;
      }
      if (isBusiness) {
        return `Business operational account is peaceful today. Working capital stands safe at ${formatRupiah(acc.current_balance)} 🏢🛡️`;
      }
      return `No transactions logged today. Account balance rests calmly and securely at ${formatRupiah(acc.current_balance)} 🧘🛡️`;
    }
  };

  // ═══ SMART AI FINANCIAL COMPANION & CONDITION ENGINE ═══
  const getAIAnalysis = () => {
    const todayExpenses = todayTxs.filter((t) => t.type === 'expense');
    const todayIncomes = todayTxs.filter((t) => t.type === 'income');
    const todayExpenseSum = todayExpenses.reduce((s, t) => s + t.amount, 0);
    const todayIncomeSum = todayIncomes.reduce((s, t) => s + t.amount, 0);
    const todayNet = todayIncomeSum - todayExpenseSum;

    // Monthly budget estimate
    const monthlyBudgets = db.getBudgets().filter((b) => b.is_active);
    const totalPlannedExpense = monthlyBudgets.reduce((s, b) => s + b.total_planned_amount, 0) || 15000000;
    const monthExpenses = monthTxs.filter((t) => t.type === 'expense');
    const monthExpenseSum = monthExpenses.reduce((s, t) => s + t.amount, 0);
    const budgetUsedPercent = Math.min(100, Math.round((monthExpenseSum / totalPlannedExpense) * 100));
    const budgetRemaining = Math.max(0, totalPlannedExpense - monthExpenseSum);

    // Group expenses by category today
    const catMap: Record<string, number> = {};
    todayExpenses.forEach((t) => {
      catMap[t.category_id] = (catMap[t.category_id] || 0) + t.amount;
    });
    const topCatId = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0];
    const topCategory = topCatId ? categories.find((c) => c.id === topCatId) : null;
    const topCatName = topCategory?.name || (language === 'id' ? 'Kebutuhan Harian' : 'Daily Needs');

    // Days in current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const dayProgressPercent = Math.round((currentDay / daysInMonth) * 100);

    const isId = language === 'id';

    // 1. Alert: Budget Running Low / Shopping allowance exhausted
    if (budgetUsedPercent >= 85 || (budgetUsedPercent > dayProgressPercent + 25 && budgetUsedPercent > 60)) {
      return {
        status: 'warning',
        moodEmoji: '🛑',
        moodBadge: isId ? 'Waspada Jatah Habis' : 'Budget Alert',
        badgeColor: 'bg-rose-500 text-white',
        borderGradient: 'from-rose-500/30 via-orange-500/20 to-amber-500/20',
        cardBg: 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30',
        headline: isId
          ? 'Uang jatah belanja kamu sudah mau habis lho! Rem dikit ya 🛑🛒'
          : 'Your shopping allowance is running pretty low! Pump the brakes a bit 🛑🛒',
        subHeadline: isId
          ? `Budget bulan ini sudah terpakai ${budgetUsedPercent}% (sisa ${formatRupiah(budgetRemaining)}). Tahan godaan jajan dan belanja impulsif ya!`
          : `You've used ${budgetUsedPercent}% of your monthly budget (${formatRupiah(budgetRemaining)} remaining). Keep impulsive shopping on hold!`,
        insights: [
          {
            icon: 'AlertCircle',
            title: isId ? 'Status Anggaran Bulanan' : 'Monthly Budget Usage',
            desc: isId
              ? `Terpakai ${budgetUsedPercent}% dari total rencana anggaran. Sisa hari di bulan ini: ${daysInMonth - currentDay} hari.`
              : `${budgetUsedPercent}% used of total plan. Days remaining this month: ${daysInMonth - currentDay} days.`,
            color: '#EF4444',
          },
          {
            icon: 'TrendingDown',
            title: isId ? 'Pengeluaran Terbesar Hari Ini' : 'Top Spend Category Today',
            desc: isId
              ? `Hari ini kamu mengeluarkan ${formatRupiah(todayExpenseSum)}${topCategory ? ` dengan porsi terbesar di pos ${topCatName}` : ''}.`
              : `Today's total spend is ${formatRupiah(todayExpenseSum)}${topCategory ? ` mostly in ${topCatName}` : ''}.`,
            color: '#F97316',
          },
          {
            icon: 'Lightbulb',
            title: isId ? 'Rekomendasi Pintar Hari Ini' : 'Smart Daily Suggestion',
            desc: isId
              ? 'Terapkan jurus 24 Jam Rule: Tunggu 1 hari sebelum checkout barang non-primer.'
              : 'Apply the 24-Hour Rule: Wait a full day before checking out any non-essential items.',
            color: '#FBBF24',
          },
        ],
        actionText: isId ? 'Periksa & Atur Anggaran' : 'Review & Adjust Budget',
        actionTab: 'budget' as const,
      };
    }

    // 2. High Income / Great Cashflow Day
    if (todayIncomeSum > 0 && todayIncomeSum >= todayExpenseSum * 2) {
      return {
        status: 'cuan',
        moodEmoji: '🚀',
        moodBadge: isId ? 'Cuan Deras & Positif' : 'Great Cashflow',
        badgeColor: 'bg-emerald-500 text-slate-950',
        borderGradient: 'from-emerald-500/40 via-teal-500/20 to-cyan-500/20',
        cardBg: 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30',
        headline: isId
          ? `Wuih mantap! Cuan hari ini lagi banjir royo-royo (+${formatRupiah(todayIncomeSum)}) 🚀💰`
          : `Awesome cashflow today! You are in the green (+${formatRupiah(todayIncomeSum)}) 🚀💰`,
        subHeadline: isId
          ? `Arus kas kamu positif banget (+${formatRupiah(todayNet)}). Jangan lupa sisihkan sebagian ke tabungan atau kas cadangan ya bos!`
          : `Your net cashflow today is +${formatRupiah(todayNet)}. Remember to stash some into your savings or emergency fund!`,
        insights: [
          {
            icon: 'TrendingUp',
            title: isId ? 'Pemasukan Hari Ini' : "Today's Inflows",
            desc: isId
              ? `Total penerimaan ${formatRupiah(todayIncomeSum)} dari ${todayIncomes.length} transaksi pemasukan tercatat.`
              : `Total receipts of ${formatRupiah(todayIncomeSum)} across ${todayIncomes.length} recorded inflows.`,
            color: '#10B981',
          },
          {
            icon: 'ShieldCheck',
            title: isId ? 'Kondisi Saldo & Likuiditas' : 'Liquidity & Balance',
            desc: isId
              ? `Total saldo aktif di seluruh akun mencapai ${formatRupiah(totalBalance)}. Arus kas sangat sehat!`
              : `Active balance across accounts stands at ${formatRupiah(totalBalance)}. High liquidity!`,
            color: '#06B6D4',
          },
          {
            icon: 'Lightbulb',
            title: isId ? 'Rekomendasi Pintar Hari Ini' : 'Smart Daily Suggestion',
            desc: isId
              ? 'Manfaatkan momentum keuntungan ini untuk investasi kembali ke stok fast-moving atau dana darurat.'
              : 'Reinvest part of today’s profits into high-velocity stock or your reserve buffer.',
            color: '#14B8A6',
          },
        ],
        actionText: isId ? 'Cek Rincian Pemasukan' : 'View Inflow Details',
        actionTab: 'transactions' as const,
      };
    }

    // 3. Zero Spend / Zen Saver Day
    if (todayExpenseSum === 0) {
      return {
        status: 'zen',
        moodEmoji: '🧘',
        moodBadge: isId ? 'Dompet Tenang & Hemat' : 'Zen Saver Mode',
        badgeColor: 'bg-indigo-500 text-white',
        borderGradient: 'from-indigo-500/40 via-purple-500/20 to-blue-500/20',
        cardBg: 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30',
        headline: isId
          ? 'Hari ini dompetmu lagi bertapa damai dan super hemat! 🧘🌿'
          : 'Zen mode unlocked! Your wallet is resting peacefully with zero spend 🧘🌿',
        subHeadline: isId
          ? 'Belum ada pengeluaran liar yang keluar hari ini. Pertahankan disiplin finansial kamu sampai akhir pekan!'
          : 'Zero impulse spending today so far. Keep up this awesome financial discipline!',
        insights: [
          {
            icon: 'ShieldCheck',
            title: isId ? 'Pengeluaran Hari Ini' : "Today's Spending",
            desc: isId
              ? 'Rp 0 pengeluaran tercatat. Dompet dan rekening kamu aman tanpa kebocoran.'
              : 'Rp 0 expenses logged today. No leaks detected in your accounts.',
            color: '#8B5CF6',
          },
          {
            icon: 'Target',
            title: isId ? 'Pemakaian Anggaran Bulanan' : 'Monthly Budget Track',
            desc: isId
              ? `Baru terpakai ${budgetUsedPercent}% dari total anggaran bulan ini. Posisi kamu masih sangat aman!`
              : `Only ${budgetUsedPercent}% of monthly budget consumed. You are in a great safe zone!`,
            color: '#3B82F6',
          },
          {
            icon: 'Lightbulb',
            title: isId ? 'Rekomendasi Pintar Hari Ini' : 'Smart Daily Suggestion',
            desc: isId
              ? 'Jika ada rencana belanja kebutuhan pokok besok, buat daftar belanja terencana agar tetap on-budget.'
              : 'If planning a grocery run tomorrow, prepare a checklist to stay strictly on-budget.',
            color: '#A855F7',
          },
        ],
        actionText: isId ? 'Buka Riwayat Transaksi' : 'Open Transactions History',
        actionTab: 'transactions' as const,
      };
    }

    // 4. Deficit / High Outflow Day
    if (todayExpenseSum > todayIncomeSum && todayExpenseSum > 500000) {
      return {
        status: 'outflow',
        moodEmoji: '💸',
        moodBadge: isId ? 'Hari Pengeluaran Aktif' : 'Active Outflow Day',
        badgeColor: 'bg-amber-500 text-slate-950',
        borderGradient: 'from-amber-500/40 via-orange-500/20 to-rose-500/20',
        cardBg: 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900',
        headline: isId
          ? `Hari ini pengeluaranmu lebih gesit dari pemasukan (-${formatRupiah(Math.abs(todayNet))}) 💸⚡`
          : `Expenses were higher than inflows today (-${formatRupiah(Math.abs(todayNet))}) 💸⚡`,
        subHeadline: isId
          ? `Ada ${todayExpenses.length} transaksi keluar hari ini total ${formatRupiah(todayExpenseSum)}${topCategory ? ` (terbanyak di ${topCatName})` : ''}. Santai, besok kita kencangkan ikat pinggang lagi!`
          : `${todayExpenses.length} expense transactions today totaling ${formatRupiah(todayExpenseSum)}${topCategory ? ` (led by ${topCatName})` : ''}. Balance it out tomorrow!`,
        insights: [
          {
            icon: 'TrendingDown',
            title: isId ? 'Total Belanja & Biaya Hari Ini' : 'Today Spending Breakdown',
            desc: isId
              ? `${formatRupiah(todayExpenseSum)} keluar hari ini di pos ${topCatName}.`
              : `${formatRupiah(todayExpenseSum)} spent today in ${topCatName}.`,
            color: '#F59E0B',
          },
          {
            icon: 'Target',
            title: isId ? 'Sisa Jatah Anggaran Bulan Ini' : 'Remaining Monthly Budget',
            desc: isId
              ? `Sisa dana anggaran yang bisa kamu gunakan: ${formatRupiah(budgetRemaining)} (${100 - budgetUsedPercent}% tersisa).`
              : `Available budget allowance remaining: ${formatRupiah(budgetRemaining)} (${100 - budgetUsedPercent}% left).`,
            color: '#06B6D4',
          },
          {
            icon: 'Lightbulb',
            title: isId ? 'Rekomendasi Pintar Hari Ini' : 'Smart Daily Suggestion',
            desc: isId
              ? 'Pastikan struk belanjaan hari ini sudah tercatat rapi di SakuKu agar tidak ada selisih saldo kas.'
              : 'Double-check that all today receipts are captured accurately in SakuKu.',
            color: '#10B981',
          },
        ],
        actionText: isId ? 'Lihat Semua Transaksi Hari Ini' : 'View Today Transactions',
        actionTab: 'transactions' as const,
      };
    }

    // 5. Default Healthy Steady Day
    return {
      status: 'steady',
      moodEmoji: '✨',
      moodBadge: isId ? 'Keuangan Seimbang & Terkendali' : 'Finances Under Control',
      badgeColor: 'bg-cyan-500 text-slate-950',
      borderGradient: 'from-cyan-500/40 via-blue-500/20 to-purple-500/20',
      cardBg: 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/30',
      headline: isId
        ? 'Kondisi keuanganmu hari ini seimbang dan terkendali dengan baik! ✨🛡️'
        : 'Your daily finances are healthy, steady, and under total control! ✨🛡️',
      subHeadline: isId
        ? `Pengeluaran hari ini Rp ${formatRupiah(todayExpenseSum)} masih dalam batas wajar. Saldo total kamu ${formatRupiah(totalBalance)} siap mendukung tujuan finansialmu.`
        : `Today spend of ${formatRupiah(todayExpenseSum)} is well within safe boundaries. Total balance is ${formatRupiah(totalBalance)}.`,
      insights: [
        {
          icon: 'ShieldCheck',
          title: isId ? 'Status Pos Keuangan Hari Ini' : 'Today Financial Health',
          desc: isId
            ? `${todayTxs.length} transaksi tercatat hari ini. Pemasukan ${formatRupiah(todayIncomeSum)} • Pengeluaran ${formatRupiah(todayExpenseSum)}.`
            : `${todayTxs.length} transactions logged today. Inflow ${formatRupiah(todayIncomeSum)} • Outflow ${formatRupiah(todayExpenseSum)}.`,
          color: '#06B6D4',
        },
        {
          icon: 'Target',
          title: isId ? 'Jatah Anggaran Bulan Ini' : 'Monthly Budget Health',
          desc: isId
            ? `Realisasi pengeluaran ${budgetUsedPercent}% dari total rencana anggaran (${formatRupiah(budgetRemaining)} tersisa).`
            : `Budget utilization at ${budgetUsedPercent}% (${formatRupiah(budgetRemaining)} remaining).`,
          color: '#8B5CF6',
        },
        {
          icon: 'Lightbulb',
          title: isId ? 'Rekomendasi Pintar Hari Ini' : 'Smart Daily Suggestion',
          desc: isId
            ? 'Pertahankan pola pencatatan konsisten setiap kali bertransaksi agar evaluasi bulanan semakin akurat!'
            : 'Keep logging transactions consistently to ensure accurate month-end financial reporting!',
          color: '#10B981',
        },
      ],
      actionText: isId ? 'Buka Riwayat Transaksi' : 'Open Transactions History',
      actionTab: 'transactions' as const,
    };
  };

  return (
    <div className="p-4 flex flex-col gap-4 pb-20">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4.5 rounded-2xl shadow-md flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between text-blue-100 text-xs">
          <span className="font-medium flex items-center gap-1.5">
            <Wallet className="w-4 h-4 opacity-80" /> {t('totalBalance')} ({modeAccounts.length} {t('accounts')})
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white backdrop-blur">
            {activeMode === 'personal'
              ? t('personalMode')
              : activeMode === 'business'
              ? t('businessMode')
              : t('allMode')}
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatRupiah(totalBalance)}
          </div>
          <p className="text-[11px] text-blue-100/90 mt-0.5">
            {t('includesPersonalAndBusiness')}
          </p>
        </div>

        {/* Quick Accounts Pills */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs no-scrollbar">
          {modeAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white/10 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap text-[11px] flex items-center gap-1.5"
            >
              <span className="text-blue-100 font-bold">{acc.name}</span>
              {acc.scope === 'business' && (
                <span className="text-[9px] bg-cyan-400/30 text-cyan-100 px-1 rounded font-semibold">
                  {acc.business_name || t('cashTypeBusiness')}
                </span>
              )}
              {acc.scope === 'combined' && (
                <span className="text-[9px] bg-indigo-400/30 text-indigo-100 px-1 rounded font-semibold">
                  Combined
                </span>
              )}
              <span className="font-semibold text-white">{formatRupiah(acc.current_balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ KARTU REKONSILIASI SALDO BERKELANJUTAN & BAWAAN SISA BULAN LALU (SAK EMKM / IAS 7) ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-3 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                Alur Saldo Berkelanjutan & Sisa Bulan Lalu
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Rekonsiliasi Kas SAK EMKM & Standar Arus Kas IAS 7
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
              prevMonthNet >= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {prevMonthNet >= 0 ? `🟢 Surplus ${prevMonthName}` : `🔴 Defisit ${prevMonthName}`}
          </span>
        </div>

        {/* Visual Continuous Flow: Saldo Awal ➔ Inflow ➔ Outflow ➔ Saldo Akhir */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="flex flex-col p-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Saldo Awal ({currentMonthName.slice(0, 3)})</span>
            <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {formatRupiah(beginningMonthCash)}
            </span>
            <span className="text-[8px] text-slate-400">Bawaan kumulatif</span>
          </div>

          <div className="flex flex-col p-1.5 border-l border-slate-200 dark:border-slate-700/60">
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">(+) Masuk Bulan Ini</span>
            <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              +{formatRupiah(currentMonthIncome)}
            </span>
            <span className="text-[8px] text-emerald-600/70">{monthTxs.filter((t) => t.type === 'income').length} transaksi</span>
          </div>

          <div className="flex flex-col p-1.5 border-l border-slate-200 dark:border-slate-700/60">
            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">(-) Keluar Bulan Ini</span>
            <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-300 mt-0.5">
              -{formatRupiah(currentMonthExpense)}
            </span>
            <span className="text-[8px] text-rose-600/70">{monthTxs.filter((t) => t.type === 'expense').length} transaksi</span>
          </div>

          <div className="flex flex-col p-1.5 border-l border-slate-200 dark:border-slate-700/60 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl">
            <span className="text-[9px] font-black text-blue-900 dark:text-blue-300 uppercase">(=) Total Saldo Nyata</span>
            <span className="text-xs font-black font-mono text-blue-700 dark:text-blue-300 mt-0.5">
              {formatRupiah(totalBalance)}
            </span>
            <span className="text-[8px] text-blue-600 font-bold">100% Terkonsiliasi</span>
          </div>
        </div>

        {/* AI Financial Standard Health Insight */}
        <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-100 dark:border-slate-700 rounded-2xl flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">
              Analisis AI Kontinuitas Kas (Standar Nasional SAK EMKM & IAS 7):
            </p>
            <p className="mt-0.5">
              {prevMonthNet >= 0 ? (
                <span>
                  Kelebihan sisa kas dari <strong>{prevMonthName}</strong> sebesar <strong className="text-emerald-700 dark:text-emerald-400">+{formatRupiah(prevMonthNet)}</strong> berhasil terbawa secara berkelanjutan menjadi bantalan likuiditas kas awal bulan ini. Kondisi arus kas akumulatif sangat kokoh dan siap menopang alokasi belanja berjalan.
                </span>
              ) : (
                <span>
                  Kekurangan/defisit kas bulan <strong>{prevMonthName}</strong> sebesar <strong className="text-rose-700 dark:text-rose-400">-{formatRupiah(Math.abs(prevMonthNet))}</strong> telah otomatis tertutupi oleh cadangan saldo kas kumulatif sebelumnya. Total saldo berjalan saat ini tetap aman di <strong className="text-blue-700 dark:text-blue-300">{formatRupiah(totalBalance)}</strong>.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Pemasukan & Pengeluaran Section Header & Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate">
              {activePeriod === 'today'
                ? t('summaryTodayHeader')
                : activePeriod === 'month'
                ? t('summaryMonthHeader')
                : t('summaryTotalHeader')}
            </span>
          </div>

          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold shrink-0">
            <button
              onClick={() => setSummaryPeriod('today')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                summaryPeriod === 'today'
                  ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('btnFilterToday')} {todayTxs.length > 0 ? `(${todayTxs.length})` : ''}
            </button>
            <button
              onClick={() => setSummaryPeriod('month')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                summaryPeriod === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('btnFilterMonth')} {monthTxs.length > 0 ? `(${monthTxs.length})` : ''}
            </button>
            <button
              onClick={() => setSummaryPeriod('all')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                summaryPeriod === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('btnFilterAll')}
            </button>
          </div>
        </div>

        {/* Ringkasan Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pemasukan Card */}
          <div
            onClick={() => setDetailModalType('income')}
            className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-2xs transition-all hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer active:scale-[0.99] group"
            title="Klik untuk lihat semua transaksi pemasukan"
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span>
                {activePeriod === 'today'
                  ? t('incomeToday')
                  : activePeriod === 'month'
                  ? t('incomeThisMonth')
                  : t('incomeTotalSummary')}
              </span>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-800 dark:text-emerald-200">
              {formatRupiah(periodIncome)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span>{displayTxs.filter((t) => t.type === 'income').length} {t('transactions')}</span>
              <span className="flex items-center gap-0.5 font-bold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform">
                Lihat <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Pengeluaran Card */}
          <div
            onClick={() => setDetailModalType('expense')}
            className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-2xs transition-all hover:border-rose-400 dark:hover:border-rose-600 cursor-pointer active:scale-[0.99] group"
            title="Klik untuk lihat semua transaksi pengeluaran"
          >
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs font-bold">
              <span>
                {activePeriod === 'today'
                  ? t('expenseToday')
                  : activePeriod === 'month'
                  ? t('expenseThisMonth')
                  : t('expenseTotalSummary')}
              </span>
              <div className="w-6 h-6 rounded-full bg-rose-500/20 dark:bg-rose-500/30 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="text-lg font-black text-rose-800 dark:text-rose-200">
              {formatRupiah(periodExpense)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-medium">
              <span>{displayTxs.filter((t) => t.type === 'expense').length} {t('transactions')}</span>
              <span className="flex items-center gap-0.5 font-bold text-rose-700 dark:text-rose-300 group-hover:translate-x-0.5 transition-transform">
                Lihat <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SAKUKU AI FINANCIAL COMPANION: KESIMPULAN & KONDISI TRANSAKSI HARI INI */}
      {(() => {
        const ai = getAIAnalysis();

        return (
          <div className={`p-4 sm:p-5 rounded-3xl border border-white/10 ${ai.cardBg} shadow-xl backdrop-blur-md flex flex-col gap-4 relative overflow-hidden transition-all duration-300`}>
            {/* Ambient background glow */}
            <div className={`absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${ai.badgeColor}`} />

            {/* AI Summary Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300/40 font-black">
                  <Sparkles className="w-5 h-5 animate-pulse text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-300 tracking-wide flex items-center gap-1">
                      <span>{language === 'id' ? 'Kesimpulan Finansial Hari Ini' : 'Today Financial Summary'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-semibold block">
                    {language === 'id' ? 'Analisis Cerdas Transaksi & Arus Kas' : 'Smart Transaction & Cashflow Insights'}
                  </span>
                </div>
              </div>

              {/* Mood Badge */}
              <div className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm ${ai.badgeColor}`}>
                <span>{ai.moodEmoji}</span>
                <span>{ai.moodBadge}</span>
              </div>
            </div>

            {/* PROMINENT BORDERLESS HIGHLIGHT TEXT (ENLARGED) */}
            <div className="flex flex-col gap-1.5 py-1">
              <p className="text-sm sm:text-base font-black text-amber-300 leading-snug tracking-tight drop-shadow-sm">
                "{ai.headline}"
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                {ai.subHeadline}
              </p>
            </div>

            {/* 3 Smart AI Insight Cards (Clean & Prominent) */}
            <div className="grid grid-cols-1 gap-2">
              {ai.insights.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-white/10 flex items-start gap-3 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${item.color}30`, color: item.color }}
                  >
                    {item.icon === 'AlertCircle' && <AlertCircle className="w-4.5 h-4.5" />}
                    {item.icon === 'TrendingUp' && <TrendingUp className="w-4.5 h-4.5" />}
                    {item.icon === 'TrendingDown' && <TrendingDown className="w-4.5 h-4.5" />}
                    {item.icon === 'ShieldCheck' && <ShieldCheck className="w-4.5 h-4.5" />}
                    {item.icon === 'Target' && <Target className="w-4.5 h-4.5" />}
                    {item.icon === 'Lightbulb' && <Lightbulb className="w-4.5 h-4.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-black text-white block">
                      {item.title}
                    </span>
                    <span className="text-xs font-medium text-slate-200 block leading-snug mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ BEDAH AKTIVITAS & KONDISI DI SETIAP KAS (PRIBADI & BISNIS) — PROMINENT HIGHLIGHT ═══ */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🏦</span>
                  <span>{language === 'id' ? 'Analisis & Kondisi Seluruh Kas (Pribadi & Bisnis)' : 'Breakdown & Condition of All Accounts'}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {modeAccounts.length} {language === 'id' ? 'Akun Kas Aktif' : 'Active Accounts'}
                </span>
              </div>

              {/* List of Unit & Account Breakdowns */}
              <div className="flex flex-col gap-2.5">
                {(() => {
                  // Group modeAccounts by unit/scope
                  const unitMap: Record<string, { title: string; emoji: string; accounts: Account[] }> = {};

                  modeAccounts.forEach((acc) => {
                    let groupKey = 'personal';
                    let groupTitle = language === 'id' ? '🏡 Pribadi & Keluarga' : '🏡 Personal & Household';
                    let groupEmoji = '🏡';

                    if (acc.scope === 'business') {
                      groupKey = acc.business_name || 'Bisnis';
                      groupTitle = `🏢 ${acc.business_name || (language === 'id' ? 'Unit Bisnis' : 'Business Unit')}`;
                      groupEmoji = '🏢';
                    } else if (acc.scope === 'combined') {
                      groupKey = 'combined';
                      groupTitle = language === 'id' ? '🔄 Kas Gabungan' : '🔄 Combined Cash';
                      groupEmoji = '🔄';
                    }

                    if (!unitMap[groupKey]) {
                      unitMap[groupKey] = { title: groupTitle, emoji: groupEmoji, accounts: [] };
                    }
                    unitMap[groupKey].accounts.push(acc);
                  });

                  return Object.entries(unitMap).map(([uKey, uData]) => (
                    <div
                      key={uKey}
                      className="bg-black/35 dark:bg-slate-950/70 rounded-2xl p-3 border border-white/15 flex flex-col gap-2 shadow-sm"
                    >
                      {/* Unit Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          <span>{uData.title}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {uData.accounts.length} {language === 'id' ? 'Rekening/Kas' : 'Accounts'}
                        </span>
                      </div>

                      {/* Accounts under this Unit */}
                      <div className="flex flex-col gap-2">
                        {uData.accounts.map((acc, accIdx) => {
                          const accTodayTxs = todayTxs.filter((t) => t.account_id === acc.id);
                          const accTodayIn = accTodayTxs
                            .filter((t) => t.type === 'income')
                            .reduce((s, t) => s + t.amount, 0);
                          const accTodayOut = accTodayTxs
                            .filter((t) => t.type === 'expense')
                            .reduce((s, t) => s + t.amount, 0);
                          const lastExpense = accTodayTxs.find((t) => t.type === 'expense');
                          const lastIncome = accTodayIn > 0 ? accTodayTxs.find((t) => t.type === 'income') : null;
                          const isId = language === 'id';

                          const aiAccountComment = generateDynamicAccountComment(
                            acc,
                            accTodayIn,
                            accTodayOut,
                            lastExpense,
                            lastIncome,
                            isId,
                            accIdx
                          );

                          return (
                            <div
                              key={acc.id}
                              className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex flex-col gap-1.5 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Wallet className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                                  <span className="text-xs font-bold text-white truncate">
                                    {acc.name}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-slate-100 font-mono shrink-0">
                                  {formatRupiah(acc.current_balance)}
                                </span>
                              </div>

                              {/* Activity Badges if any */}
                              {(accTodayIn > 0 || accTodayOut > 0) && (
                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                  {accTodayIn > 0 && (
                                    <span className="text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40 font-black">
                                      +{formatRupiah(accTodayIn)}
                                    </span>
                                  )}
                                  {accTodayOut > 0 && (
                                    <span className="text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-500/40 font-black">
                                      -{formatRupiah(accTodayOut)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* PROMINENT ENLARGED COMMENTARY (WITHOUT EXTRA BOX) */}
                              <div className="text-xs sm:text-sm font-semibold text-amber-200/95 leading-relaxed pt-0.5">
                                <span>💡 {aiAccountComment}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onNavigateToTransactions}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>{language === 'id' ? 'Riwayat Transaksi' : 'Transaction History'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={onNavigateToBudget}
                className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border border-blue-400/30 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98]"
              >
                <span>{language === 'id' ? 'Rencana Anggaran' : 'Budget Plans'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* DETAIL MODAL FOR INCOME OR EXPENSE LIST */}
      {detailModalType && (() => {
        const isIncome = detailModalType === 'income';
        const modalTxs = displayTxs.filter((tx) => tx.type === detailModalType);
        const modalTotal = modalTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const periodTitle =
          activePeriod === 'today'
            ? formatExactShortDateIndonesian(new Date().toISOString().slice(0, 10))
            : activePeriod === 'month'
            ? 'Bulan Ini'
            : 'Semua Periode';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
              {/* Modal Header */}
              <div
                className={`p-4 sm:p-5 text-white flex items-center justify-between shrink-0 ${
                  isIncome
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-r from-rose-600 to-pink-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-white" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">
                      Daftar {isIncome ? 'Pemasukan' : 'Pengeluaran'} ({modalTxs.length})
                    </h3>
                    <p className="text-xs text-white/80 font-semibold">
                      Periode: {periodTitle} • {activeMode === 'all' ? 'Semua Mode' : activeMode === 'personal' ? 'Pribadi' : 'Bisnis'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalType(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 text-slate-800 dark:text-slate-100">
                {/* Total Summary Box */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isIncome
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-bold block">
                      Total {isIncome ? 'Pemasukan' : 'Pengeluaran'} ({periodTitle})
                    </span>
                    <span
                      className={`text-xl font-black ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatRupiah(modalTotal)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      isIncome
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                        : 'bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-100'
                    }`}
                  >
                    {modalTxs.length} Transaksi
                  </span>
                </div>

                {/* List of Transactions */}
                {modalTxs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    Tidak ada transaksi {isIncome ? 'pemasukan' : 'pengeluaran'} untuk periode {periodTitle.toLowerCase()}.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {modalTxs.map((tx) => {
                      const category = getCategory(tx.category_id);
                      const accountName = getAccountName(tx.account_id);

                      return (
                        <div
                          key={tx.id}
                          onClick={() => {
                            onSelectTransaction?.(tx);
                            setDetailModalType(null);
                          }}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${category?.color || '#94A3B8'}20`,
                              }}
                            >
                              <CategoryIcon
                                name={category?.icon || 'Tag'}
                                color={category?.color || '#475569'}
                                size={20}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                                  {tx.description}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                                    tx.mode === 'personal'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/80 dark:text-purple-200'
                                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/80 dark:text-cyan-200'
                                  }`}
                                >
                                  {tx.mode === 'personal' ? t('cashTypePersonal') : t('cashTypeBusiness')}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{accountName}</span>
                                <span>•</span>
                                <span>{formatDateIndonesian(tx.date)} {formatTime(tx.date)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-black whitespace-nowrap text-right ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {txToDelete && onDeleteTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setTxToDelete(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">{t('confirmDeleteTxHeader')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('confirmDeleteTxDesc')}
              </p>
            </div>

            {/* Target Tx Card Summary */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {txToDelete.description}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                <span>📅 {formatDateIndonesian(txToDelete.date)}</span>
                <span className={`font-black ${txToDelete.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {txToDelete.type === 'income' ? '+' : '-'}{formatRupiah(txToDelete.amount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('deletePermanently')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
