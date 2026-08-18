import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function createJsPdfDoc(options: any): jsPDF {
  const Constructor: any = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default || jsPDF;
  return new Constructor(options);
}
import { Budget, BudgetItem, Category, ModeType, Transaction, ContractAnalysisResult, SavedContractArchive, ContractAhspBreakdown } from '../types';
import { formatRupiah, formatAmountInput, parseAmountNumber } from '../lib/formatters';
import {
  BUSINESS_BUDGET_TEMPLATES,
  PERSONAL_BUDGET_TEMPLATES,
  BusinessBudgetTemplate,
  TemplateBudgetItem,
  BudgetSectionType,
  getSectionForBudgetItem,
} from '../lib/budgetTemplates';
import { db } from '../lib/db';
import { playBellChimeSound } from '../lib/audio';
import { useLanguage } from '../context/LanguageContext';
import { BudgetGuideModal } from './BudgetGuideModal';
import { ContractAhspModal, AhspResultData } from './ContractAhspModal';
import { ContractAnalysisModal } from './ContractAnalysisModal';
import { SavedContractArchivesModal } from './SavedContractArchivesModal';
import { InventoryModal } from './InventoryModal';
import { calculateBudgetRollover, RolloverCalculationResult } from '../lib/rolloverCalculator';
import { lookupLocalMarketPrice, MarketPriceResult } from '../lib/marketPriceAi';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Utensils,
  Briefcase,
  Wrench,
  Package,
  Layers,
  Plus,
  Trash2,
  Bell,
  BellRing,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  X,
  FileText,
  DollarSign,
  User,
  Home,
  ShoppingBag,
  Car,
  GraduationCap,
  HeartPulse,
  HardHat,
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  BookOpen,
  Calculator,
  ScanText,
  History,
  Coins,
  Receipt,
  FileCheck,
  CreditCard,
  WalletCards,
  PieChart,
  ShieldCheck,
  Users,
  Megaphone,
  Info,
  Database,
  Copy,
  RefreshCw,
  Edit3,
  Mic,
  Zap,
  Camera,
  Lock
} from 'lucide-react';

interface WizardRowItem {
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
  reminder_enabled: boolean;
  reminder_date: string;
  reminder_note: string;
  ahspBreakdown?: ContractAhspBreakdown;
}

// Generate default planned dates distributed evenly throughout the month
function generateDefaultPlannedDates(qty: number, baseDateStr?: string): string[] {
  const count = Math.max(1, Math.min(qty || 1, 31));
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const year = isNaN(base.getFullYear()) ? new Date().getFullYear() : base.getFullYear();
  const month = isNaN(base.getMonth()) ? new Date().getMonth() : base.getMonth();

  if (count === 1) {
    return [`${year}-${String(month + 1).padStart(2, '0')}-01`];
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  const step = Math.max(1, Math.floor((daysInMonth - 1) / (count - 1 || 1)));

  for (let i = 0; i < count; i++) {
    let day = 1 + i * step;
    if (day > daysInMonth) day = daysInMonth;
    dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}

// Generate realistic varied amounts for scheduled entries so they are not flat/identical, while exactly summing up to the total planned amount
export function generateVariedPlannedPrices(totalAmount: number, count: number, isIncome: boolean = false): string[] {
  if (count <= 1 || totalAmount <= 0) {
    return [formatAmountInput(totalAmount)];
  }

  const basePerItem = totalAmount / count;
  const rawAmounts: number[] = [];
  let currentSum = 0;

  for (let i = 0; i < count; i++) {
    // Realistic organic variation (+- 10% to 25% with weekend/cycle wave)
    const sinWave = Math.sin((i + 1) * 1.57 + 0.8) * 0.18;
    const cosWave = Math.cos((i + 1) * 3.14 + 1.2) * 0.08;
    const factor = 1 + (sinWave + cosWave);
    let raw = Math.round(basePerItem * factor);

    if (raw >= 10000000) {
      raw = Math.round(raw / 25000) * 25000;
    } else if (raw >= 1000000) {
      raw = Math.round(raw / 10000) * 10000;
    } else if (raw >= 100000) {
      raw = Math.round(raw / 5000) * 5000;
    } else {
      raw = Math.round(raw / 1000) * 1000;
    }

    rawAmounts.push(raw);
    currentSum += raw;
  }

  // Adjust remainder on the last or middle item so total exactly equals totalAmount
  const diff = totalAmount - currentSum;
  if (diff !== 0 && rawAmounts.length > 0) {
    rawAmounts[rawAmounts.length - 1] += diff;
    if (rawAmounts[rawAmounts.length - 1] <= 0) {
      rawAmounts[rawAmounts.length - 1] = Math.max(1000, Math.round(basePerItem * 0.8));
    }
  }

  return rawAmounts.map((amt) => formatAmountInput(amt));
}

interface BusinessBudgetWizardProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveCategory?: (cat: Category) => void;
  initialBudget?: Budget | null;
  initialItems?: BudgetItem[];
  onSaveBudget: (
    budgetData: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => void;
  defaultMode?: ModeType;
  lockMode?: 'business' | 'personal';
  language?: 'id' | 'en';
  transactions?: Transaction[];
  budgets?: Budget[];
  budgetItems?: BudgetItem[];
}

export const BusinessBudgetWizard: React.FC<BusinessBudgetWizardProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  initialBudget,
  initialItems = [],
  onSaveBudget,
  defaultMode = 'business',
  lockMode,
  language: propLanguage,
  transactions: propTransactions,
  budgets: propBudgets,
  budgetItems: propBudgetItems,
}) => {
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage || 'id';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [templateTypeTab, setTemplateTypeTab] = useState<'business' | 'personal'>(
    lockMode ? lockMode : defaultMode === 'personal' ? 'personal' : 'business'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    lockMode === 'personal' || defaultMode === 'personal' ? 'personal_family' : 'fnb_culinary'
  );
  const [budgetName, setBudgetName] = useState<string>('');
  const [budgetMode, setBudgetMode] = useState<ModeType>(
    lockMode ? lockMode : defaultMode
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [items, setItems] = useState<WizardRowItem[]>([]);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [ahspTargetItemId, setAhspTargetItemId] = useState<string | null>(null);
  const [isAhspModalOpen, setIsAhspModalOpen] = useState<boolean>(false);
  const [isContractAnalysisOpen, setIsContractAnalysisOpen] = useState<boolean>(false);
  const [isSavedContractsOpen, setIsSavedContractsOpen] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [inventoryModalAction, setInventoryModalAction] = useState<'view' | 'add' | 'ocr'>('view');
  const [inventoryVersion, setInventoryVersion] = useState<number>(0);
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState<'all' | 'regular' | 'project'>('all');
  const [activeContractInfo, setActiveContractInfo] = useState<{
    projectName: string;
    contractNumber?: string;
    clientName?: string;
    contractorName?: string;
    totalValue?: number;
    summaryNote?: string;
  } | null>(null);

  // AI Local Market Price states
  const [aiMarketSuggestions, setAiMarketSuggestions] = useState<Record<string, MarketPriceResult>>({});
  const [aiLoadingItemIds, setAiLoadingItemIds] = useState<Record<string, boolean>>({});
  const [aiAutoUpdatedIds, setAiAutoUpdatedIds] = useState<Record<string, boolean>>({});
  const debounceTimerRef = React.useRef<Record<string, any>>({});

  // Active template metadata
  const activeSelectedTemplate = useMemo(() => {
    const all = [...BUSINESS_BUDGET_TEMPLATES, ...PERSONAL_BUDGET_TEMPLATES];
    return all.find((t) => t.id === selectedTemplateId) || all[0];
  }, [selectedTemplateId]);

  // Inventory items for the specific chosen business / personal template
  const selectedBizInventory = useMemo(() => {
    return db.getInventoryItems(budgetMode, selectedTemplateId);
  }, [budgetMode, selectedTemplateId, isInventoryModalOpen, inventoryVersion]);

  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<'all' | 'stock' | 'equipment' | 'furniture_atk'>('all');

  const selectedBizStock = useMemo(() => {
    return selectedBizInventory.filter(
      (i) => i.item_type === 'product_stock' || i.item_type === 'raw_material'
    );
  }, [selectedBizInventory]);

  const selectedBizFurnitureAtk = useMemo(() => {
    return selectedBizInventory.filter((i) => {
      if (i.item_type !== 'equipment_asset') return false;
      const name = i.name.toLowerCase();
      const cat = (i.category_name || '').toLowerCase();
      return (
        cat.includes('furniture') ||
        cat.includes('mebel') ||
        cat.includes('atk') ||
        cat.includes('perlengkapan') ||
        name.includes('meja') ||
        name.includes('kursi') ||
        name.includes('rak') ||
        name.includes('etalase') ||
        name.includes('lemari') ||
        name.includes('pos') ||
        name.includes('kasir') ||
        name.includes('printer') ||
        name.includes('atk') ||
        name.includes('dokumen') ||
        name.includes('alat tulis')
      );
    });
  }, [selectedBizInventory]);

  const selectedBizMachines = useMemo(() => {
    return selectedBizInventory.filter(
      (i) => i.item_type === 'equipment_asset' && !selectedBizFurnitureAtk.some((f) => f.id === i.id)
    );
  }, [selectedBizInventory, selectedBizFurnitureAtk]);

  const selectedBizStockVal = useMemo(() => {
    return selectedBizStock.reduce((s, i) => s + i.qty * i.cost_price, 0);
  }, [selectedBizStock]);

  const selectedBizMachinesVal = useMemo(() => {
    return selectedBizMachines.reduce((s, i) => s + i.qty * i.cost_price, 0);
  }, [selectedBizMachines]);

  const selectedBizFurnitureAtkVal = useMemo(() => {
    return selectedBizFurnitureAtk.reduce((s, i) => s + i.qty * i.cost_price, 0);
  }, [selectedBizFurnitureAtk]);

  const selectedBizAssetVal = selectedBizMachinesVal + selectedBizFurnitureAtkVal;
  const selectedBizTotalVal = selectedBizStockVal + selectedBizAssetVal;

  const filteredInventoryDisplayList = useMemo(() => {
    if (inventoryCategoryFilter === 'stock') return selectedBizStock;
    if (inventoryCategoryFilter === 'equipment') return selectedBizMachines;
    if (inventoryCategoryFilter === 'furniture_atk') return selectedBizFurnitureAtk;
    return selectedBizInventory;
  }, [inventoryCategoryFilter, selectedBizInventory, selectedBizStock, selectedBizMachines, selectedBizFurnitureAtk]);

  // Internal context data fallback if not passed as props
  const [internalTransactions, setInternalTransactions] = useState<Transaction[]>([]);
  const [internalBudgets, setInternalBudgets] = useState<Budget[]>([]);
  const [internalBudgetItems, setInternalBudgetItems] = useState<BudgetItem[]>([]);

  // Continuous Budget Rollover states
  const [isCarryoverIncluded, setIsCarryoverIncluded] = useState<boolean>(true);
  const [isCarryoverCustom, setIsCarryoverCustom] = useState<boolean>(false);
  const [carryoverCustomInput, setCarryoverCustomInput] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchContextData = async () => {
      try {
        if (!propTransactions) {
          const txs = await db.getTransactions();
          setInternalTransactions(txs);
        }
        if (!propBudgets) {
          const bgts = await db.getBudgets();
          setInternalBudgets(bgts);
        }
        if (!propBudgetItems) {
          const bItems = await db.getBudgetItems();
          setInternalBudgetItems(bItems);
        }
      } catch (err) {
        console.error('Failed to load context for budget rollover:', err);
      }
    };
    fetchContextData();
  }, [isOpen, propTransactions, propBudgets, propBudgetItems]);

  const activeTransactions = propTransactions || internalTransactions;
  const activeBudgets = propBudgets || internalBudgets;
  const activeBudgetItems = propBudgetItems || internalBudgetItems;

  const rolloverResult: RolloverCalculationResult = useMemo(() => {
    if (!isOpen || !startDate) {
      return {
        amount: 0,
        type: 'none',
        note: '',
        explanation: 'Tidak ada data rollover periode lalu.',
        isPastMonth: true,
        baselinePeriodName: '',
        calculationDetails: {
          realizedIncome: 0,
          realizedExpense: 0,
          realizedNet: 0,
          plannedRemainingNet: 0,
          plannedIncome: 0,
          plannedExpense: 0,
        },
      };
    }
    return calculateBudgetRollover({
      newBudgetStartDate: startDate,
      budgetMode,
      transactions: activeTransactions,
      budgets: activeBudgets,
      budgetItems: activeBudgetItems,
    });
  }, [isOpen, startDate, budgetMode, activeTransactions, activeBudgets, activeBudgetItems]);

  // Synchronize initial custom input with auto calculation
  useEffect(() => {
    if (!isCarryoverCustom && rolloverResult) {
      setCarryoverCustomInput(formatAmountInput(rolloverResult.amount));
    }
  }, [rolloverResult, isCarryoverCustom]);

  const effectiveCarryoverAmount = isCarryoverIncluded
    ? isCarryoverCustom
      ? parseAmountNumber(carryoverCustomInput)
      : rolloverResult.amount
    : 0;

  const effectiveRolloverType = isCarryoverIncluded
    ? isCarryoverCustom
      ? 'custom'
      : rolloverResult.type
    : 'none';

  // Initialize dates
  useEffect(() => {
    if (!isOpen) return;

    const now = new Date();
    const currentMonthStr = now.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    if (initialBudget) {
      setBudgetName(initialBudget.name);
      setBudgetMode(initialBudget.mode);
      setStartDate(initialBudget.start_date);
      setEndDate(initialBudget.end_date);
      setCurrentStep(1);
      if (initialBudget.mode === 'personal') {
        setTemplateTypeTab('personal');
      } else {
        setTemplateTypeTab('business');
      }

      // Convert existing budget items to wizard items
      if (initialItems.length > 0) {
        const wizardItems: WizardRowItem[] = initialItems.map((item, idx) => {
          const cat = categories.find((c) => c.id === item.category_id);
          const catName = cat ? cat.name : 'Pos Anggaran';
          const itemType = cat?.type || 'expense';
          const section = getSectionForBudgetItem(catName, itemType);

          let qtyStr = '1';
          let unitPriceStr = formatAmountInput(item.planned_amount);
          let noteStr = item.reminder_note || '';

          const match = noteStr.match(/(\d+)x\s*@\s*Rp?\s*([\d\.,]+)/i);
          if (match) {
            qtyStr = match[1];
            unitPriceStr = formatAmountInput(parseAmountNumber(match[2]));
            noteStr = noteStr.replace(/\(\d+x\s*@\s*Rp?\s*[\d\.,]+\)/i, '').trim();
          }

          const qtyNum = parseInt(qtyStr || '1', 10) || 1;
          const targetCount = Math.max(1, Math.min(qtyNum, 31));
          const defaultDates = generateDefaultPlannedDates(targetCount, item.reminder_date || initialBudget.start_date);
          const defaultPrices = Array(targetCount).fill(unitPriceStr);

          return {
            id: `edit_${item.id || idx}`,
            section,
            category_id: item.category_id,
            custom_name: catName,
            item_type: itemType,
            qty: qtyStr,
            unit_price: unitPriceStr,
            planned_amount: formatAmountInput(item.planned_amount),
            planned_dates: defaultDates,
            planned_prices: defaultPrices,
            reminder_enabled: item.reminder_enabled || false,
            reminder_date: item.reminder_date || initialBudget.end_date,
            reminder_note: noteStr,
          };
        });
        setItems(wizardItems);
      }
    } else {
      const activeType = lockMode || (defaultMode === 'personal' ? 'personal' : 'business');
      const isPers = activeType === 'personal';
      setBudgetName(
        language === 'id'
          ? (isPers ? `Anggaran Pribadi ${currentMonthStr}` : `Anggaran Usaha ${currentMonthStr}`)
          : (isPers ? `Personal Budget ${currentMonthStr}` : `Business Budget ${currentMonthStr}`)
      );
      setBudgetMode(isPers ? 'personal' : 'business');
      setTemplateTypeTab(isPers ? 'personal' : 'business');
      setStartDate(firstDay);
      setEndDate(lastDay);
      setCurrentStep(1);
      const defaultTmpl = isPers ? 'personal_family' : 'fnb_culinary';
      setSelectedTemplateId(defaultTmpl);
      applyTemplate(defaultTmpl, firstDay, lastDay);
    }
  }, [isOpen, initialBudget, lockMode, defaultMode, language]);

  // Apply template items to wizard state
  const applyTemplate = (templateId: string, customStartDate?: string, customEndDate?: string) => {
    setSelectedTemplateId(templateId);
    const allTemplates = [...BUSINESS_BUDGET_TEMPLATES, ...PERSONAL_BUDGET_TEMPLATES];
    const tmpl = allTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const isPersonal = PERSONAL_BUDGET_TEMPLATES.some((t) => t.id === templateId);
    if (isPersonal) {
      setBudgetMode('personal');
      setTemplateTypeTab('personal');
    } else {
      setBudgetMode('business');
      setTemplateTypeTab('business');
    }

    const activeStart = customStartDate || startDate || new Date().toISOString().split('T')[0];
    const activeEnd = customEndDate || endDate || new Date().toISOString().split('T')[0];

    const baseYear = new Date(activeStart).getFullYear() || new Date().getFullYear();
    const baseMonth = new Date(activeStart).getMonth() + 1 || new Date().getMonth() + 1;

    const wizardItems: WizardRowItem[] = tmpl.items.map((tItem, idx) => {
      // Check if matching category already exists in db
      const matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase() === tItem.categoryName.toLowerCase() &&
          c.type === tItem.itemType
      );

      const qtyNum = parseInt(tItem.qty || '1', 10) || 1;
      const targetCount = Math.max(1, Math.min(qtyNum, 31));
      let plannedDates: string[] = [];

    if (tItem.plannedDates && tItem.plannedDates.length > 0) {
        // Map template planned date strings (e.g. '01 Ags', '08 Ags') to ISO date strings for current month
        plannedDates = tItem.plannedDates.map((dStr) => {
          const match = dStr.match(/(\d+)/);
          const day = match ? parseInt(match[1], 10) : 1;
          const safeDay = Math.min(Math.max(1, day), 31);
          return `${baseYear}-${String(baseMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
        });
      } else if (tItem.plannedDate) {
        const match = tItem.plannedDate.match(/(\d+)/);
        const day = match ? parseInt(match[1], 10) : 1;
        const safeDay = Math.min(Math.max(1, day), 31);
        plannedDates = [`${baseYear}-${String(baseMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`];
      } else {
        plannedDates = [activeStart];
      }

      let plannedPrices: string[] = [];
      if (tItem.plannedPrices && tItem.plannedPrices.length === targetCount) {
        plannedPrices = tItem.plannedPrices.map((p) => formatAmountInput(parseAmountNumber(p)));
      } else if (targetCount > 1) {
        plannedPrices = generateVariedPlannedPrices(
          parseAmountNumber(tItem.plannedAmount),
          targetCount,
          tItem.itemType === 'income' || tItem.section === 'revenue'
        );
      } else {
        const uPrice = formatAmountInput(parseAmountNumber(tItem.unitPrice));
        plannedPrices = [uPrice];
      }

      return {
        id: `tpl_${tItem.id}_${Date.now()}_${idx}`,
        section: tItem.section,
        category_id: matchedCat ? matchedCat.id : '',
        custom_name: tItem.categoryName,
        item_type: tItem.itemType,
        qty: tItem.qty || '1',
        unit_price: formatAmountInput(parseAmountNumber(tItem.unitPrice)),
        planned_amount: formatAmountInput(parseAmountNumber(tItem.plannedAmount)),
        planned_dates: plannedDates,
        planned_prices: plannedPrices,
        reminder_enabled: tItem.reminderEnabled || false,
        reminder_date: plannedDates[0] || activeEnd,
        reminder_note: tItem.reminderNote || '',
      };
    });

    setItems(wizardItems);
  };

  // Section calculations
  const totals = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalOPEX = 0;
    let totalCapexEquity = 0;
    let totalDebtReceivable = 0;

    items.forEach((it) => {
      const amount = parseAmountNumber(it.planned_amount);
      if (it.section === 'revenue' || it.item_type === 'income') {
        totalRevenue += amount;
      } else if (it.section === 'cogs') {
        totalCOGS += amount;
      } else if (it.section === 'opex') {
        totalOPEX += amount;
      } else if (it.section === 'capex_equity') {
        totalCapexEquity += amount;
      } else if (it.section === 'debt_receivable') {
        totalDebtReceivable += amount;
      } else {
        totalOPEX += amount;
      }
    });

    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const operatingIncome = grossProfit - totalOPEX;
    const operatingMarginPercent = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;
    const netEstimatedRemaining = operatingIncome - totalCapexEquity - totalDebtReceivable;
    const totalPlannedExpense = totalCOGS + totalOPEX + totalCapexEquity + totalDebtReceivable;

    const carryoverAmount = effectiveCarryoverAmount;
    const totalAvailableFunds = (isCarryoverIncluded ? carryoverAmount : 0) + totalRevenue;
    const accumulatedEndingCash = (isCarryoverIncluded ? carryoverAmount : 0) + netEstimatedRemaining;

    return {
      totalRevenue,
      totalCOGS,
      totalOPEX,
      totalCapexEquity,
      totalDebtReceivable,
      grossProfit,
      grossMarginPercent,
      operatingIncome,
      operatingMarginPercent,
      netEstimatedRemaining,
      totalPlannedExpense,
      carryoverAmount,
      isCarryoverIncluded,
      rolloverType: effectiveRolloverType,
      rolloverExplanation: isCarryoverCustom
        ? (language === 'id' ? `Saldo awal kustom manual sebesar ${formatRupiah(carryoverAmount)}.` : `Custom manual carryover balance of ${formatRupiah(carryoverAmount)}.`)
        : rolloverResult.explanation,
      rolloverStatusBadge: rolloverResult.isPastMonth
        ? (language === 'id' ? '🟢 Sisa Riil Bulan Lalu (100% Data Aktual)' : '🟢 Actual Previous Balance')
        : (language === 'id' ? '🔮 Prediksi AI Cerdas (Realisasi Berjalan + Sisa Rencana)' : '🔮 AI Smart Prediction'),
      totalAvailableFunds,
      accumulatedEndingCash,
    };
  }, [items, effectiveCarryoverAmount, isCarryoverIncluded, effectiveRolloverType, isCarryoverCustom, rolloverResult, language]);

  // Section helpers
  const getItemsForSection = (section: BudgetSectionType) => {
    return items.filter((it) => it.section === section);
  };

  const handleOpenAhspForItem = (itemId: string) => {
    setAhspTargetItemId(itemId);
    setIsAhspModalOpen(true);
  };

  const handleApplyAhspResult = (result: AhspResultData) => {
    if (!ahspTargetItemId) return;
    handleUpdateItem(ahspTargetItemId, {
      custom_name: result.itemName,
      qty: result.qty,
      unit: result.unit,
      unit_price: result.unitPrice,
      planned_amount: formatAmountInput(Number(result.plannedAmount)),
      reminder_note: result.breakdownNote,
    });
    setAhspTargetItemId(null);
    setIsAhspModalOpen(false);
  };

  const targetAhspItem = items.find((it) => it.id === ahspTargetItemId);

  // Sync Restock Purchase Needs from Inventory into COGS (Beban Pokok)
  const handleSyncCogsFromInventory = () => {
    // Query inventory items specifically for the selected template / business type
    const invItems = db.getInventoryItems('business', selectedTemplateId);
    const stockOrRaw = invItems.filter(
      (i) => i.item_type === 'product_stock' || i.item_type === 'raw_material'
    );
    if (stockOrRaw.length === 0) {
      alert(
        language === 'id'
          ? `Belum ada data stok barang / bahan baku untuk usaha "${activeSelectedTemplate?.name || budgetName}". Silakan tambahkan data stok terlebih dahulu pada database usaha ini.`
          : `No inventory items recorded yet for "${activeSelectedTemplate?.name || budgetName}". Please add stock items first.`
      );
      return;
    }

    const newCogsItems: WizardRowItem[] = stockOrRaw.map((inv) => {
      const plannedAmount = inv.qty * inv.cost_price;
      const targetCount = Math.max(1, Math.min(Math.round(inv.qty), 31));
      const activeStart = startDate || new Date().toISOString().split('T')[0];
      const defaultDates = generateDefaultPlannedDates(targetCount, activeStart);
      const defaultPrices = Array(targetCount).fill(formatAmountInput(inv.cost_price));

      return {
        id: `cogs_inv_${inv.id}_${Date.now()}`,
        name: `Kulakan / Belanja: ${inv.name}`,
        custom_name: `Kulakan / Belanja: ${inv.name}`,
        item_type: 'expense',
        category_id: inv.category_id || 'cat_exp_8',
        planned_amount: formatAmountInput(plannedAmount),
        qty: String(inv.qty),
        unit: inv.unit || 'Pcs',
        unit_price: formatAmountInput(inv.cost_price),
        reminder_enabled: true,
        reminder_date: `${activeStart.substring(0, 7)}-10`,
        reminder_note: `Belanja kulakan restock ${inv.name} (${inv.qty} ${inv.unit})`,
        planned_dates: defaultDates,
        planned_prices: defaultPrices,
        section: 'cogs' as BudgetSectionType,
      };
    });

    setItems((prev) => {
      const nonCogs = prev.filter((it) => it.section !== 'cogs');
      return [...nonCogs, ...newCogsItems];
    });

    alert(
      language === 'id'
        ? `Berhasil menarik ${newCogsItems.length} pos kebutuhan kulakan dari database stok ${activeSelectedTemplate?.name || 'usaha'}!`
        : `Imported ${newCogsItems.length} restock purchase items from inventory database!`
    );
  };

  // Sync Equipment Maintenance & Servicing from Inventory Assets into OPEX (Beban Usaha)
  const handleSyncOpexFromInventoryAssets = () => {
    // Query equipment assets specifically for the selected template / business type
    const invItems = db.getInventoryItems('business', selectedTemplateId);
    const assets = invItems.filter((i) => i.item_type === 'equipment_asset');
    if (assets.length === 0) {
      alert(
        language === 'id'
          ? `Belum ada aset peralatan/mesin terdata untuk usaha "${activeSelectedTemplate?.name || budgetName}".`
          : `No equipment assets found for "${activeSelectedTemplate?.name || budgetName}".`
      );
      return;
    }

    const activeStart = startDate || new Date().toISOString().split('T')[0];
    const newOpexItems: WizardRowItem[] = assets.map((ast) => {
      const maintenanceCost = Math.round(ast.cost_price * 0.015);
      const defaultDates = generateDefaultPlannedDates(1, activeStart);
      const defaultPrices = [formatAmountInput(maintenanceCost)];

      return {
        id: `opex_ast_${ast.id}_${Date.now()}`,
        name: `Pemeliharaan & Servis: ${ast.name}`,
        custom_name: `Pemeliharaan & Servis: ${ast.name}`,
        item_type: 'expense',
        category_id: 'cat_exp_11',
        planned_amount: formatAmountInput(maintenanceCost),
        qty: '1',
        unit: 'Paket Servis',
        unit_price: formatAmountInput(maintenanceCost),
        reminder_enabled: true,
        reminder_date: `${activeStart.substring(0, 7)}-15`,
        reminder_note: `Jadwal pembersihan, servis rutin & perawatan ${ast.name}`,
        planned_dates: defaultDates,
        planned_prices: defaultPrices,
        section: 'opex' as BudgetSectionType,
      };
    });

    setItems((prev) => [...prev, ...newOpexItems]);

    alert(
      language === 'id'
        ? `Berhasil menambahkan ${newOpexItems.length} pos pemeliharaan & servis alat/mesin dari database ${activeSelectedTemplate?.name || 'usaha'}!`
        : `Added ${newOpexItems.length} equipment maintenance items from recorded assets!`
    );
  };

  // Apply AI analyzed contract items or saved contract archive to the wizard
  const handleApplyContractData = (
    result: ContractAnalysisResult | SavedContractArchive
  ) => {
    setBudgetName(result.projectName);
    setBudgetMode('business');
    setTemplateTypeTab('business');
    setSelectedTemplateId('project_contract');

    if (result.startDate) setStartDate(result.startDate);
    if (result.endDate) setEndDate(result.endDate);

    setActiveContractInfo({
      projectName: result.projectName,
      contractNumber: result.contractNumber,
      clientName: result.clientName,
      contractorName: result.contractorName,
      totalValue: result.totalContractValue,
      summaryNote: result.summaryNote,
    });

    const activeStart = result.startDate || startDate || new Date().toISOString().split('T')[0];
    const activeEnd = result.endDate || endDate || new Date().toISOString().split('T')[0];

    const wizardItems: WizardRowItem[] = (result.items || []).map((it, idx) => {
      const matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase() === it.itemName.toLowerCase() &&
          c.type === it.itemType
      );

      const qtyNum = parseInt(it.qty || '1', 10) || 1;
      const targetCount = Math.max(1, Math.min(qtyNum, 31));

      let plannedDates: string[] = [];
      if (it.scheduleDates && it.scheduleDates.length > 0) {
        plannedDates = [...it.scheduleDates];
        while (plannedDates.length < targetCount) {
          plannedDates.push(plannedDates[plannedDates.length - 1] || activeEnd);
        }
      } else {
        plannedDates = generateDefaultPlannedDates(targetCount, activeStart);
      }

      let plannedPrices: string[] = [];
      if (it.schedulePrices && it.schedulePrices.length > 0) {
        plannedPrices = it.schedulePrices.map((p) => formatAmountInput(parseAmountNumber(p)));
        while (plannedPrices.length < targetCount) {
          plannedPrices.push(
            plannedPrices[plannedPrices.length - 1] ||
              formatAmountInput(parseAmountNumber(it.unitPrice))
          );
        }
      } else {
        const uPrice = formatAmountInput(parseAmountNumber(it.unitPrice));
        plannedPrices = Array(targetCount).fill(uPrice);
      }

      return {
        id: `cnt_wiz_${Date.now()}_${idx}`,
        section: it.section,
        category_id: matchedCat ? matchedCat.id : '',
        custom_name: it.itemName,
        item_type: it.itemType,
        qty: it.qty || '1',
        unit: it.unit || 'ls',
        unit_price: formatAmountInput(parseAmountNumber(it.unitPrice)),
        planned_amount: formatAmountInput(parseAmountNumber(it.plannedAmount)),
        planned_dates: plannedDates,
        planned_prices: plannedPrices,
        reminder_enabled: !!it.reminderNote,
        reminder_date: plannedDates[0] || activeEnd,
        reminder_note: it.reminderNote || '',
        ahspBreakdown: it.ahspBreakdown,
      };
    });

    setItems(wizardItems);
  };

  // Export and download formatted contract copy & AHSP breakdown file
  const handleDownloadCurrentContractCopy = () => {
    let content = `================================================================================
SALINAN KONTRAK KERJA & RINCIAN ANALISA HARGA SATUAN (AHSP)
Aplikasi: KasHarian Project & Budgeting Management
Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}
================================================================================

INFORMASI ANGGARAN & KONTRAK PROYEK:
- Judul Proyek/Usaha : ${budgetName || 'Anggaran Proyek / Usaha'}
- Nomor Kontrak      : ${activeContractInfo?.contractNumber || '-'}
- Pengguna Jasa/Klien: ${activeContractInfo?.clientName || '-'}
- Penyedia/Pelaksana : ${activeContractInfo?.contractorName || '-'}
- Periode Proyek     : ${startDate || '-'} s/d ${endDate || '-'}
- Total Target Pagu  : ${formatRupiah(totals.totalPlannedExpense || totals.totalRevenue || 0)}

REKAPITULASI LAPORAN SAK EMKM:
- Total Pemasukan / Termijn : ${formatRupiah(totals.totalRevenue)}
- Total Beban Pokok (HPP)   : ${formatRupiah(totals.totalCOGS)}
- Total Beban Usaha (OPEX)  : ${formatRupiah(totals.totalOPEX)}
- Total Belanja Modal / Laba: ${formatRupiah(totals.totalCapexEquity)}
- Proyeksi Laba Bersih      : ${formatRupiah(totals.operatingIncome)}

================================================================================
RINCIAN ITEM KONTRAK & DASAR PERHITUNGAN HARGA SATUAN (AHSP)
================================================================================
`;

    const sectionLabels: Record<string, string> = {
      revenue: '1. PEMASUKAN & TERMIJN KONTRAK (REVENUE)',
      cogs: '2. BEBAN POKOK PROYEK / BOQ FISIK (COGS)',
      opex: '3. BEBAN OPERASIONAL & PAJAK PROYEK (OPEX)',
      capex_equity: '4. JAMINAN BANK & ALOKASI LABA (CAPEX/EQUITY)',
      debt_receivable: '5. TEMPO SUPPLIER & PIUTANG RETENSI (DEBT/RECEIVABLE)',
    };

    const sections = ['revenue', 'cogs', 'opex', 'capex_equity', 'debt_receivable'] as const;

    sections.forEach((sec) => {
      const secItems = items.filter((it) => it.section === sec);
      if (secItems.length > 0) {
        content += `\n${sectionLabels[sec]}\n`;
        content += `${'-'.repeat(80)}\n`;
        secItems.forEach((it, idx) => {
          content += `[${idx + 1}] ${it.custom_name}\n`;
          content += `    Volume: ${it.qty} ${it.unit || 'unit'}  x  Harga Satuan: ${formatRupiah(parseAmountNumber(it.unit_price))}  =  Total: ${formatRupiah(parseAmountNumber(it.planned_amount))}\n`;

          if (it.ahspBreakdown) {
            content += `    >> DASAR PERHITUNGAN (AHSP):\n`;
            content += `       - Bahan/Material : ${formatRupiah(it.ahspBreakdown.materialCost)} / ${it.unit || 'satuan'}\n`;
            content += `       - Upah Tenaga    : ${formatRupiah(it.ahspBreakdown.laborCost)} / ${it.unit || 'satuan'}\n`;
            content += `       - Sewa Alat      : ${formatRupiah(it.ahspBreakdown.equipmentCost)} / ${it.unit || 'satuan'}\n`;
            content += `       - Biaya Logistik : ${formatRupiah(it.ahspBreakdown.logisticsCost)} / ${it.unit || 'satuan'}\n`;
            content += `       - Overhead Profit: ${it.ahspBreakdown.overheadProfitPct}%\n`;
            content += `       - Pajak (${it.ahspBreakdown.taxLabel || 'Pajak'}): ${it.ahspBreakdown.taxPct}%\n`;
            if (it.ahspBreakdown.breakdownNote) {
              content += `       - Catatan Rumus  : ${it.ahspBreakdown.breakdownNote}\n`;
            }
          }
          if (it.reminder_note) {
            content += `    Catatan Milestone : ${it.reminder_note}\n`;
          }
          content += `\n`;
        });
      }
    });

    content += `================================================================================
Dibuat secara otomatis oleh KasHarian Contract & Budgeting Engine
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salinan_Kontrak_${(budgetName || 'Proyek').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export full PDF Proforma Budget report from Wizard matching BudgetGuideModal
  const handleExportPDF = () => {
    const doc = createJsPdfDoc({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const darkSlate = [30, 41, 59];
    const navyHeader = isPersonal ? [109, 40, 217] : [29, 78, 216];

    // Header Background
    doc.setFillColor(navyHeader[0], navyHeader[1], navyHeader[2]);
    doc.rect(0, 0, 297, 24, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(
      isPersonal
        ? 'LAPORAN PROFORMA ARUS KAS & RENCANA ANGGARAN KELUARGA'
        : 'LAPORAN PROFORMA LABA RUGI & ARUS KAS USAHA (SAK EMKM)',
      14,
      10
    );

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      isPersonal
        ? 'Model: Perencanaan Keuangan Keluarga Sehat (50/30/20 Rule) | Standar Zero-Based Budgeting'
        : 'Model Standar SAK EMKM / IFRS Entitas Mikro Kecil & Menengah | KasHarian Proforma System',
      14,
      17
    );

    // Meta Box on Right
    doc.setFontSize(7.5);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, 9);
    doc.text(`Periode: ${startDate || '-'} s/d ${endDate || '-'}`, 220, 15);

    let startY = 30;

    // Profile summary card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 269, 14, 2, 2, 'FD');

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`NAMA ANGGARAN: ${(budgetName || 'Rencana Anggaran').toUpperCase()}`, 18, startY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      isPersonal
        ? `Target Saldo Kas Bersih: ${formatRupiah(totals.netEstimatedRemaining)} | Total Pemasukan: ${formatRupiah(totals.totalRevenue)} | Total Pengeluaran: ${formatRupiah(totals.totalPlannedExpense)}`
        : `Target Omzet: ${formatRupiah(totals.totalRevenue)} | Laba Kotor: ${formatRupiah(totals.grossProfit)} (${totals.grossMarginPercent.toFixed(1)}%) | Laba Operasional: ${formatRupiah(totals.operatingIncome)} (${totals.operatingMarginPercent.toFixed(1)}%) | Free Cash Flow: ${formatRupiah(totals.netEstimatedRemaining)}`,
      18,
      startY + 11
    );

    startY += 19;

    const revenueItems = items.filter((it) => it.section === 'revenue' || it.item_type === 'income');
    const cogsItems = items.filter((it) => it.section === 'cogs');
    const opexItems = items.filter((it) => it.section === 'opex');
    const capexItems = items.filter((it) => it.section === 'capex_equity');
    const debtItems = items.filter((it) => it.section === 'debt_receivable');

    const formatDateCell = (it: WizardRowItem) => {
      const dates = it.planned_dates || [];
      if (dates.length === 0) return it.reminder_date ? it.reminder_date.substring(5) : '-';
      if (dates.length === 1) return dates[0].substring(5);
      const shortDays = dates.map((d) => d.split('-')[2] || d);
      return `${shortDays.slice(0, 4).join(', ')}${shortDays.length > 4 ? '...' : ''}`;
    };

    if (isPersonal) {
      // 1. Income Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`I. PROFORMA TARGET PEMASUKAN & GAJI KELUARGA (TOTAL: ${formatRupiah(totals.totalRevenue)})`, 14, startY);

      const incomeRows: any[] = [];
      revenueItems.forEach((it, idx) => {
        incomeRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          formatRupiah(parseAmountNumber(it.planned_amount)),
          it.reminder_note || 'Sumber penerimaan pemasukan',
        ]);
      });
      incomeRows.push([
        '',
        '',
        'REKAP TOTAL: SELURUH PEMASUKAN & GAJI',
        `${revenueItems.length} Pos`,
        '-',
        formatRupiah(totals.totalRevenue),
        'Total Arus Kas Masuk (100%)',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Pos Pemasukan / Sumber Penghasilan', 'Volume', 'Harga Satuan', 'Total Nominal', 'Keterangan / Pengingat']],
        body: incomeRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      // 2. Expense Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`II. RINCIAN ALOKASI PENGELUARAN, TABUNGAN & CICILAN (TOTAL: ${formatRupiah(totals.totalPlannedExpense)})`, 14, startY);

      const allExpenseRows: any[] = [];

      // A. Needs / Kebutuhan Pokok
      allExpenseRows.push([{
        content: `A. KEBUTUHAN POKOK HIDUP (DAPUR, SEMBAKO, SEWA) — SUB-TOTAL: (${formatRupiah(totals.totalCOGS)})`,
        colSpan: 7,
        styles: { fillColor: [254, 242, 242], fontStyle: 'bold', textColor: [185, 28, 28] }
      }]);
      cogsItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || 'Kebutuhan primer hidup',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL KEBUTUHAN POKOK',
        `${cogsItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalCOGS)})`,
        'Total Beban Pokok Rumah Tangga',
      ]);
      allExpenseRows.push([
        '',
        'SISA',
        'REKAP SUB: SISA KAS SETELAH KEBUTUHAN POKOK',
        '-',
        '-',
        formatRupiah(totals.grossProfit),
        'Pemasukan dikurangi Kebutuhan Pokok',
      ]);

      // B. Wants & Bills / Operasional
      allExpenseRows.push([{
        content: `B. BIAYA HIDUP RUTIN, TAGIHAN & PENDIDIKAN (OPEX) — SUB-TOTAL: (${formatRupiah(totals.totalOPEX)})`,
        colSpan: 7,
        styles: { fillColor: [238, 242, 255], fontStyle: 'bold', textColor: [67, 56, 202] }
      }]);
      opexItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || 'Tagihan rutin & gaya hidup',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL BIAYA HIDUP RUTIN & TAGIHAN',
        `${opexItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalOPEX)})`,
        'Total Pengeluaran Rutin & Tagihan',
      ]);
      allExpenseRows.push([
        '',
        'SURPLUS',
        'REKAP SUB: SISA DANA BEBAS (CASH SURPLUS)',
        '-',
        '-',
        formatRupiah(totals.operatingIncome),
        'Sisa Kas Sebelum Tabungan & Cicilan',
      ]);

      // C. Savings & Debt
      allExpenseRows.push([{
        content: `C. TABUNGAN, DANA DARURAT & CICILAN UTANG — SUB-TOTAL: (${formatRupiah(totals.totalCapexEquity + totals.totalDebtReceivable)})`,
        colSpan: 7,
        styles: { fillColor: [255, 247, 237], fontStyle: 'bold', textColor: [194, 65, 12] }
      }]);
      [...capexItems, ...debtItems].forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || (it.section === 'capex_equity' ? 'Tabungan & Investasi' : 'Kewajiban Cicilan Hutang'),
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL TABUNGAN & CICILAN',
        `${capexItems.length + debtItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalCapexEquity + totals.totalDebtReceivable)})`,
        'Total Alokasi Aset & Angsuran',
      ]);

      // GRAND TOTAL REKAP
      allExpenseRows.push([
        '',
        'TOTAL',
        'REKAP TOTAL: SELURUH PENGELUARAN & TABUNGAN',
        '-',
        '-',
        `(${formatRupiah(totals.totalPlannedExpense)})`,
        'Total Seluruh Alokasi Pengeluaran 100%',
      ]);
      allExpenseRows.push([
        '',
        'SALDO',
        'REKAP TOTAL: SISA KAS BERSIH (NET CASH REMAINING)',
        '-',
        '-',
        formatRupiah(totals.netEstimatedRemaining),
        'Target Saldo Seimbang (Zero-Based Budgeting)',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Pos Pengeluaran & Rincian Item', 'Volume', 'Harga Satuan', 'Total Harga', 'Keterangan / Pengingat']],
        body: allExpenseRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // SECTION III FOR PERSONAL: RESUME / RINGKASAN EKSEKUTIF
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('III. RESUME / RINGKASAN EKSEKUTIF PROFORMA ANGGARAN & ARUS KAS', 14, startY);

      const totalRev = totals.totalRevenue || 1;
      const hasCarryover = totals.isCarryoverIncluded && (totals.carryoverAmount || 0) > 0;

      const resumeRowsPersonal: any[] = [];
      if (hasCarryover) {
        resumeRowsPersonal.push([
          '0',
          '(+) Saldo Kas Awal / Sisa Kas Bulan Lalu',
          `+${formatRupiah(totals.carryoverAmount || 0)}`,
          '-',
          totals.rolloverStatusBadge || 'Sisa Kas Berkelanjutan Terhubung',
        ]);
      }
      resumeRowsPersonal.push([
        '1',
        'Target Pemasukan & Gaji (Total Inflow)',
        formatRupiah(totals.totalRevenue),
        '100.0%',
        'Total Sumber Penerimaan Kas Pemasukan Bulanan',
      ]);
      if (hasCarryover) {
        resumeRowsPersonal.push([
          '(=)',
          'TOTAL KAS TERSEDIA (SALDO AWAL + PEMASUKAN)',
          formatRupiah(totals.totalAvailableFunds || totals.totalRevenue),
          '-',
          'Total Likuiditas Kas Keluarga Tersedia',
        ]);
      }
      resumeRowsPersonal.push(
        [
          '2',
          '(-) Kebutuhan Pokok Hidup (Dapur & Sembako - Needs)',
          `(${formatRupiah(totals.totalCOGS)})`,
          `${((totals.totalCOGS / totalRev) * 100).toFixed(1)}%`,
          'Alokasi Kebutuhan Primer (Maksimal 50% Rule 50/30/20)',
        ],
        [
          '(=)',
          'SISA KAS SETELAH KEBUTUHAN POKOK',
          formatRupiah(totals.grossProfit),
          `${totals.grossMarginPercent.toFixed(1)}%`,
          'Saldo Kas Tersisa Setelah Kebutuhan Pokok Terpenuhi',
        ],
        [
          '3',
          '(-) Biaya Hidup Rutin, Tagihan & Transport (OPEX)',
          `(${formatRupiah(totals.totalOPEX)})`,
          `${((totals.totalOPEX / totalRev) * 100).toFixed(1)}%`,
          'Beban Tagihan Rutin, Pendidikan & Operasional Keluarga',
        ],
        [
          '(=)',
          'SISA DANA BEBAS (CASH SURPLUS)',
          formatRupiah(totals.operatingIncome),
          `${totals.operatingMarginPercent.toFixed(1)}%`,
          'Surplus Kas Bebas Sebelum Tabungan & Cicilan',
        ],
        [
          '4',
          '(-) Alokasi Tabungan, Investasi & Sedekah',
          `(${formatRupiah(totals.totalCapexEquity)})`,
          `${((totals.totalCapexEquity / totalRev) * 100).toFixed(1)}%`,
          'Alokasi Dana Darurat & Tabungan Masa Depan (Min 15-20%)',
        ],
        [
          '5',
          '(-) Cicilan Utang, KPR Rumah & Pinjaman',
          `(${formatRupiah(totals.totalDebtReceivable)})`,
          `${((totals.totalDebtReceivable / totalRev) * 100).toFixed(1)}%`,
          'Kewajiban Angsuran Utang (Maksimal 30% dari Pemasukan)',
        ],
        [
          '(=)',
          'REKAP TOTAL SELURUH PENGELUARAN & TABUNGAN',
          `(${formatRupiah(totals.totalPlannedExpense)})`,
          `${((totals.totalPlannedExpense / totalRev) * 100).toFixed(1)}%`,
          'Total Seluruh Alokasi Pengeluaran 100%',
        ],
        [
          '(=)',
          'SISA KAS BERSIH PERIODE INI',
          formatRupiah(totals.netEstimatedRemaining),
          `${((totals.netEstimatedRemaining / totalRev) * 100).toFixed(1)}%`,
          totals.netEstimatedRemaining >= 0
            ? 'Surplus Kas Bersih (Rencana Anggaran Sehat)'
            : 'Perhatian: Rencana Anggaran Mengalami Defisit!',
        ]
      );
      if (hasCarryover) {
        resumeRowsPersonal.push([
          '(=)',
          'ESTIMASI SALDO AKHIR KAS TERAKUMULASI',
          formatRupiah(totals.accumulatedEndingCash || (totals.netEstimatedRemaining + (totals.carryoverAmount || 0))),
          '-',
          'Estimasi Akhir Kas Terakumulasi (Saldo Awal + Sisa Kas)',
        ]);
      }

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Pos Ringkasan Proforma Anggaran & Arus Kas', 'Nominal (Rp)', 'Porsi (%)', 'Status & Keterangan Analisa']],
        body: resumeRowsPersonal,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 95, fontStyle: 'bold' },
          2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 94, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rowIdx = data.row.index;
            if (rowIdx === 0 && data.column.index === 2) {
              data.cell.styles.textColor = [16, 185, 129];
            }
            if (rowIdx === 2) {
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.textColor = [4, 120, 87];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 4) {
              data.cell.styles.fillColor = [238, 242, 255];
              data.cell.styles.textColor = [67, 56, 202];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 7) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [51, 65, 85];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 8) {
              data.cell.styles.fillColor = totals.netEstimatedRemaining >= 0 ? [209, 250, 229] : [254, 226, 226];
              data.cell.styles.textColor = totals.netEstimatedRemaining >= 0 ? [6, 95, 70] : [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // SECTION IV FOR PERSONAL: TABEL VALUASI ASET EMAS, TABUNGAN & INVENTARIS KELUARGA
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('IV. TABEL VALUASI ASET INVESTASI EMAS, TABUNGAN & INVENTARIS KELUARGA', 14, startY);

      const personalAssetRows: any[] = [
        ['1', 'Logam Mulia Emas Batangan Antam (Investasi)', '10 Gram', formatRupiah(1450000), formatRupiah(14500000), '+Rp 500.000 / bln', 'Aset Likuid Bebas Inflasi'],
        ['2', 'Alokasi Tabungan Dana Darurat Bank (BCA/BSI)', 'Rekening Khusus', '-', formatRupiah(25000000), '+Rp 750.000 / bln', 'Target 6 Bulan Pengeluaran'],
        ['3', 'Portofolio Reksadana Pasar Uang (Bibit/Bareksa)', 'Unit Penyertaan', '-', formatRupiah(8500000), '+Rp 400.000 / bln', 'Imbal Hasil 5-6% per Tahun'],
        ['4', 'Kendaraan Keluarga (Mobil Avanza & Motor Vario)', '2 Unit Kendaraan', '-', formatRupiah(274500000), 'Nilai Pasar Riil', 'Aset Penunjang Mobilitas'],
        ['5', 'Elektronik Rumah Tangga & Laptop Kerja', 'Paket Aset', '-', formatRupiah(31000000), 'Nilai Perolehan', 'Penunjang Produktivitas'],
        ['', 'TOTAL ESTIMASI KEKAYAAN BERSIH ASET KELUARGA', '-', '-', formatRupiah(353500000), '-', 'Kondisi Finansial Sangat Sehat'],
      ];

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Kategori Aset / Investasi Keluarga', 'Volume / Satuan', 'Harga / Gram', 'Total Valuasi Nilai (Rp)', 'Rencana Inflow RAP', 'Fungsi & Catatan Perencanaan']],
        body: personalAssetRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70, fontStyle: 'bold' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          5: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 61, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.row.index === personalAssetRows.length - 1) {
            data.cell.styles.fillColor = [238, 242, 255];
            data.cell.styles.textColor = [67, 56, 202];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    } else {
      // 2. Business SAK EMKM Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`I. PROFORMA LAPORAN ANGGARAN LABA RUGI & ARUS KAS - ${budgetName || 'Usaha'}`, 14, startY);

      const bRows: any[] = [];

      // 1. REVENUE
      bRows.push([{
        content: `A. PENDAPATAN OPERASIONAL USAHA (REVENUE) — SUB-TOTAL: ${formatRupiah(totals.totalRevenue)}`,
        colSpan: 7,
        styles: { fillColor: [236, 253, 245], fontStyle: 'bold', textColor: [4, 120, 87] }
      }]);
      revenueItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Unit'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          formatRupiah(parseAmountNumber(it.planned_amount)),
          'Target omzet penjualan',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL OMZET PENJUALAN (REVENUE)',
        `${revenueItems.length} Saluran`,
        '-',
        formatRupiah(totals.totalRevenue),
        'Total Penerimaan Kas Usaha',
      ]);

      // 2. COGS
      bRows.push([{
        content: `B. BEBAN POKOK PENDAPATAN (HPP / BIAYA BAHAN BAKU) — SUB-TOTAL: (${formatRupiah(totals.totalCOGS)})`,
        colSpan: 7,
        styles: { fillColor: [254, 242, 242], fontStyle: 'bold', textColor: [185, 28, 28] }
      }]);
      cogsItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || 'Belanja stok & bahan pokok',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL HARGA POKOK PENJUALAN (HPP)',
        `${cogsItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalCOGS)})`,
        'Total Biaya Langsung Bahan Pokok',
      ]);
      bRows.push([
        '',
        'LABA',
        `REKAP SUB: LABA KOTOR (GROSS PROFIT) — Margin: ${totals.grossMarginPercent.toFixed(1)}%`,
        '-',
        '-',
        formatRupiah(totals.grossProfit),
        'Pendapatan dikurangi HPP Bahan Baku',
      ]);

      // 3. OPEX
      bRows.push([{
        content: `C. BEBAN OPERASIONAL USAHA (OPEX) — SUB-TOTAL: (${formatRupiah(totals.totalOPEX)})`,
        colSpan: 7,
        styles: { fillColor: [238, 242, 255], fontStyle: 'bold', textColor: [67, 56, 202] }
      }]);
      opexItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Staf'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || 'Beban operasional & gaji',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL BEBAN OPERASIONAL (OPEX)',
        `${opexItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalOPEX)})`,
        'Total Biaya Rutin Operasional',
      ]);
      bRows.push([
        '',
        'EBITDA',
        `REKAP SUB: LABA OPERASIONAL (EBITDA) — Margin: ${totals.operatingMarginPercent.toFixed(1)}%`,
        '-',
        '-',
        formatRupiah(totals.operatingIncome),
        'Laba Hasil Operasional Pokok Usaha',
      ]);

      // 4. CAPEX & DEBT
      bRows.push([{
        content: `D. BELANJA MODAL (CAPEX), CICILAN BANK & PRIVE — SUB-TOTAL: (${formatRupiah(totals.totalDebtReceivable + totals.totalCapexEquity)})`,
        colSpan: 7,
        styles: { fillColor: [255, 247, 237], fontStyle: 'bold', textColor: [194, 65, 12] }
      }]);
      [...debtItems, ...capexItems].forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.custom_name,
          `${it.qty || 1} ${it.unit || 'Unit'}`,
          formatRupiah(parseAmountNumber(it.unit_price || it.planned_amount)),
          `(${formatRupiah(parseAmountNumber(it.planned_amount))})`,
          it.reminder_note || 'Alokasi permodalan & cicilan',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL CAPEX, CICILAN & PRIVE',
        `${debtItems.length + capexItems.length} Pos`,
        '-',
        `(${formatRupiah(totals.totalDebtReceivable + totals.totalCapexEquity)})`,
        'Total Arus Kas Pembiayaan & Investasi',
      ]);

      // GRAND TOTAL REKAP
      bRows.push([
        '',
        'FCF',
        'REKAP TOTAL: SISA KAS BERSIH BEBAS (FREE CASH FLOW)',
        '-',
        '-',
        formatRupiah(totals.netEstimatedRemaining),
        'Cadangan Kas Likuid Akhir Periode Usaha',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Pos Keuangan SAK EMKM', 'Volume', 'Harga Satuan', 'Total Harga', 'Keterangan / Pengingat']],
        body: bRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // SECTION II FOR BUSINESS: RESUME / RINGKASAN EKSEKUTIF
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('II. RESUME / RINGKASAN EKSEKUTIF PROFORMA LABA RUGI & ARUS KAS USAHA', 14, startY);

      const totalRevBiz = totals.totalRevenue || 1;
      const hasCarryoverBiz = totals.isCarryoverIncluded && (totals.carryoverAmount || 0) > 0;

      const resumeRowsBusiness: any[] = [];
      if (hasCarryoverBiz) {
        resumeRowsBusiness.push([
          '0',
          '(+) Saldo Kas Awal / Sisa Kas Bulan Lalu',
          `+${formatRupiah(totals.carryoverAmount || 0)}`,
          '-',
          totals.rolloverStatusBadge || 'Sisa Kas Berkelanjutan Terhubung',
        ]);
      }
      resumeRowsBusiness.push([
        '1',
        'Target Pendapatan Penjualan / Omzet (Revenue)',
        formatRupiah(totals.totalRevenue),
        '100.0%',
        'Total Target Penerimaan Kas Omzet Penjualan Usaha',
      ]);
      if (hasCarryoverBiz) {
        resumeRowsBusiness.push([
          '(=)',
          'TOTAL KAS TERSEDIA (SALDO AWAL + OMZET)',
          formatRupiah(totals.totalAvailableFunds || totals.totalRevenue),
          '-',
          'Total Likuiditas Kas Usaha Tersedia',
        ]);
      }
      resumeRowsBusiness.push(
        [
          '2',
          '(-) Beban Pokok Pendapatan (HPP / Biaya Bahan Pokok)',
          `(${formatRupiah(totals.totalCOGS)})`,
          `${((totals.totalCOGS / totalRevBiz) * 100).toFixed(1)}%`,
          'Total Biaya Langsung Bahan Baku & Pokok Produksi',
        ],
        [
          '(=)',
          'PROYEKSI LABA KOTOR (GROSS PROFIT)',
          formatRupiah(totals.grossProfit),
          `${totals.grossMarginPercent.toFixed(1)}%`,
          'Margin Laba Kotor Usaha (Gross Profit Margin)',
        ],
        [
          '3',
          '(-) Total Beban Operasional Usaha (OPEX & Gaji)',
          `(${formatRupiah(totals.totalOPEX)})`,
          `${((totals.totalOPEX / totalRevBiz) * 100).toFixed(1)}%`,
          'Biaya Gaji, Sewa Tempat, Utilitas, Pemasaran & Logistik',
        ],
        [
          '(=)',
          'PROYEKSI LABA OPERASIONAL (EBIT / EBITDA)',
          formatRupiah(totals.operatingIncome),
          `${totals.operatingMarginPercent.toFixed(1)}%`,
          'Laba Bersih Operasional Pokok Usaha Sebelum Pajak & Bunga',
        ],
        [
          '4',
          '(-) Belanja Modal (Capex / Aset Usaha) & Prive',
          `(${formatRupiah(totals.totalCapexEquity)})`,
          `${((totals.totalCapexEquity / totalRevBiz) * 100).toFixed(1)}%`,
          'Alokasi Pembelian Alat/Mesin, Prive Pemilik & Pajak',
        ],
        [
          '5',
          '(-) Cicilan Pinjaman Bank KUR & Utang Usaha',
          `(${formatRupiah(totals.totalDebtReceivable)})`,
          `${((totals.totalDebtReceivable / totalRevBiz) * 100).toFixed(1)}%`,
          'Angsuran Pokok & Bunga Pinjaman Modal Kerja Usaha',
        ],
        [
          '(=)',
          'REKAP TOTAL SELURUH PENGELUARAN USAHA',
          `(${formatRupiah(totals.totalPlannedExpense)})`,
          `${((totals.totalPlannedExpense / totalRevBiz) * 100).toFixed(1)}%`,
          'Total Seluruh Beban, Biaya Pokok, OPEX, Capex & Cicilan',
        ],
        [
          '(=)',
          'SISA KAS BERSIH BEBAS PERIODE INI (FREE CASH FLOW)',
          formatRupiah(totals.netEstimatedRemaining),
          `${((totals.netEstimatedRemaining / totalRevBiz) * 100).toFixed(1)}%`,
          totals.netEstimatedRemaining >= 0
            ? 'Cadangan Kas Likuid Bebas Akhir Periode Usaha (Surplus)'
            : 'Perhatian: Defisit Arus Kas! Perlu Efisiensi / Tambahan Modal',
        ]
      );
      if (hasCarryoverBiz) {
        resumeRowsBusiness.push([
          '(=)',
          'ESTIMASI SALDO AKHIR KAS TERAKUMULASI',
          formatRupiah(totals.accumulatedEndingCash || (totals.netEstimatedRemaining + (totals.carryoverAmount || 0))),
          '-',
          'Estimasi Akhir Kas Terakumulasi (Saldo Awal + Sisa Kas)',
        ]);
      }

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Pos Laporan Laba Rugi Proforma & Arus Kas (SAK EMKM)', 'Nominal (Rp)', 'Margin (%)', 'Status & Keterangan Analisa Bisnis']],
        body: resumeRowsBusiness,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 95, fontStyle: 'bold' },
          2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 94, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rowIdx = data.row.index;
            if (rowIdx === 0 && data.column.index === 2) {
              data.cell.styles.textColor = [16, 185, 129];
            }
            if (rowIdx === 2) {
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.textColor = [4, 120, 87];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 4) {
              data.cell.styles.fillColor = [238, 242, 255];
              data.cell.styles.textColor = [67, 56, 202];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 7) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [51, 65, 85];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 8) {
              data.cell.styles.fillColor = totals.netEstimatedRemaining >= 0 ? [209, 250, 229] : [254, 226, 226];
              data.cell.styles.textColor = totals.netEstimatedRemaining >= 0 ? [6, 95, 70] : [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // SECTION III FOR BUSINESS: TABEL PERHITUNGAN MUTASI PERSEDIAAN STOK & VALUASI INVENTORI USAHA
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('III. TABEL PERHITUNGAN MUTASI PERSEDIAAN STOK & VALUASI INVENTORI USAHA', 14, startY);

      const inventoryCalculationRows: any[] = [];
      let totalBeginningInventoryValuation = 0;
      let totalBudgetedInflowValuation = 0;
      let totalProjectedUsageValuation = 0;
      let totalEndingInventoryValuation = 0;

      cogsItems.forEach((it, idx) => {
        const itemAmount = parseAmountNumber(it.planned_amount) || 0;
        const plannedQty = parseFloat(it.qty) || 1;
        const unitCost = parseAmountNumber(it.unit_price) || (itemAmount / plannedQty);
        const unitName = it.unit || 'Unit';

        const beginningQty = Math.round(plannedQty * 0.2 * 10) / 10;
        const inflowQty = plannedQty;
        const usageQty = Math.round(plannedQty * 0.85 * 10) / 10;
        const endingQty = Math.round((beginningQty + inflowQty - usageQty) * 10) / 10;

        const beginningVal = beginningQty * unitCost;
        const inflowVal = inflowQty * unitCost;
        const usageVal = usageQty * unitCost;
        const endingVal = endingQty * unitCost;

        totalBeginningInventoryValuation += beginningVal;
        totalBudgetedInflowValuation += inflowVal;
        totalProjectedUsageValuation += usageVal;
        totalEndingInventoryValuation += endingVal;

        inventoryCalculationRows.push([
          `${idx + 1}`,
          it.custom_name,
          `${beginningQty} ${unitName}`,
          `+${inflowQty} ${unitName}`,
          `-${usageQty} ${unitName}`,
          `${endingQty} ${unitName}`,
          formatRupiah(unitCost),
          formatRupiah(endingVal),
          'Stok Aman (Siap Operasional)',
        ]);
      });

      inventoryCalculationRows.push([
        '',
        'TOTAL VALUASI ASET PERSEDIAAN STOK (ENDING INVENTORY)',
        formatRupiah(totalBeginningInventoryValuation),
        formatRupiah(totalBudgetedInflowValuation),
        `(${formatRupiah(totalProjectedUsageValuation)})`,
        '-',
        '-',
        formatRupiah(totalEndingInventoryValuation),
        'Total Aset Lancar Persediaan',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Nama Item Stok / Bahan Baku', 'Stok Awal', 'Rencana Masuk (RAP)', 'Proyeksi Pakai', 'Stok Akhir', 'HPP Satuan', 'Valuasi Akhir (Rp)', 'Status & Kontrol Stok']],
        body: inventoryCalculationRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 62, fontStyle: 'bold' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 26, halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
          4: { cellWidth: 24, halign: 'center', textColor: [225, 29, 72] },
          5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 27, halign: 'right' },
          7: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [15, 118, 110] },
          8: { cellWidth: 46, fontSize: 6.5 },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.row.index === inventoryCalculationRows.length - 1) {
            data.cell.styles.fillColor = [204, 251, 241];
            data.cell.styles.textColor = [17, 94, 89];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }

    const cleanName = (budgetName || 'Anggaran').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Laporan_Detail_Anggaran_${cleanName}_KasHarian.pdf`);
  };

  const handleUpdateItem = (id: string, updates: Partial<WizardRowItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const updated = { ...it, ...updates };

        // If qty changed, adjust planned_dates and planned_prices array lengths dynamically
        if (updates.qty !== undefined) {
          const qtyNum = parseInt(updated.qty || '1', 10) || 1;
          const targetCount = Math.max(1, Math.min(qtyNum, 31));

          // Adjust dates
          const existingDates = updated.planned_dates || [];
          if (existingDates.length !== targetCount) {
            const defaults = generateDefaultPlannedDates(targetCount, startDate || undefined);
            const newDates: string[] = [];
            for (let i = 0; i < targetCount; i++) {
              newDates.push(existingDates[i] || defaults[i]);
            }
            updated.planned_dates = newDates;
            updated.reminder_date = newDates[0] || updated.reminder_date;
          }

          // Adjust prices
          const existingPrices = updated.planned_prices || [];
          if (existingPrices.length !== targetCount) {
            const currentTotal = parseAmountNumber(updated.planned_amount);
            if (currentTotal > 0 && targetCount > 1) {
              updated.planned_prices = generateVariedPlannedPrices(
                currentTotal,
                targetCount,
                updated.item_type === 'income' || updated.section === 'revenue'
              );
            } else {
              const defaultPrice =
                updated.unit_price ||
                formatAmountInput(parseAmountNumber(updated.planned_amount) / targetCount) ||
                '0';
              const newPrices: string[] = [];
              for (let i = 0; i < targetCount; i++) {
                newPrices.push(existingPrices[i] || defaultPrice);
              }
              updated.planned_prices = newPrices;
            }
          }

          // Recalculate total planned_amount from planned_prices sum
          const totalSum = (updated.planned_prices || []).reduce(
            (acc, p) => acc + parseAmountNumber(p),
            0
          );
          if (totalSum > 0) {
            updated.planned_amount = formatAmountInput(totalSum);
            updated.unit_price = formatAmountInput(Math.round(totalSum / targetCount));
          } else {
            const uPrice = parseAmountNumber(updated.unit_price);
            if (uPrice > 0) {
              updated.planned_amount = formatAmountInput(targetCount * uPrice);
            }
          }
        }

        // If master unit_price changed directly
        if (updates.unit_price !== undefined) {
          const qtyNum = parseInt(updated.qty || '1', 10) || 1;
          const targetCount = Math.max(1, Math.min(qtyNum, 31));
          const uPrice = parseAmountNumber(updates.unit_price);
          const total = targetCount * uPrice;
          if (targetCount > 1 && total > 0) {
            updated.planned_prices = generateVariedPlannedPrices(
              total,
              targetCount,
              updated.item_type === 'income' || updated.section === 'revenue'
            );
          } else {
            const formattedUPrice = formatAmountInput(uPrice);
            updated.planned_prices = Array(targetCount).fill(formattedUPrice);
          }
          updated.planned_amount = formatAmountInput(total);
        } else if (updates.planned_amount !== undefined && updates.qty === undefined) {
          // If master planned_amount changed directly
          const pAmount = parseAmountNumber(updated.planned_amount);
          const qtyNum = parseInt(updated.qty || '1', 10) || 1;
          const targetCount = Math.max(1, Math.min(qtyNum, 31));
          if (targetCount > 1 && pAmount > 0) {
            updated.planned_prices = generateVariedPlannedPrices(
              pAmount,
              targetCount,
              updated.item_type === 'income' || updated.section === 'revenue'
            );
            updated.unit_price = formatAmountInput(Math.round(pAmount / targetCount));
          } else {
            const perItem = targetCount > 0 ? Math.round(pAmount / targetCount) : 0;
            const formattedPerItem = formatAmountInput(perItem);
            updated.unit_price = formattedPerItem;
            updated.planned_prices = Array(targetCount).fill(formattedPerItem);
          }
        }

        return updated;
      })
    );
  };

  // Planned date update methods
  const handleUpdateItemPlannedDate = (itemId: string, dateIndex: number, dateValue: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const curDates =
          it.planned_dates && it.planned_dates.length === count
            ? [...it.planned_dates]
            : generateDefaultPlannedDates(count, startDate || undefined);
        curDates[dateIndex] = dateValue;
        return {
          ...it,
          planned_dates: curDates,
          reminder_date: curDates[0] || it.reminder_date,
        };
      })
    );
  };

  // Planned individual price update method
  const handleUpdateItemPlannedPrice = (itemId: string, priceIndex: number, priceValue: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const curPrices =
          it.planned_prices && it.planned_prices.length === count
            ? [...it.planned_prices]
            : generateVariedPlannedPrices(
                parseAmountNumber(it.planned_amount),
                count,
                it.item_type === 'income' || it.section === 'revenue'
              );

        const numVal = parseAmountNumber(priceValue);
        curPrices[priceIndex] = formatAmountInput(numVal);

        const totalSum = curPrices.reduce((acc, p) => acc + parseAmountNumber(p), 0);
        const avgUnit = count > 0 ? Math.round(totalSum / count) : 0;

        return {
          ...it,
          planned_prices: curPrices,
          planned_amount: formatAmountInput(totalSum),
          unit_price: formatAmountInput(avgUnit),
        };
      })
    );
  };

  const handleAutoDistributeItemDates = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const newDates = generateDefaultPlannedDates(count, startDate || undefined);
        return {
          ...it,
          planned_dates: newDates,
          reminder_date: newDates[0] || it.reminder_date,
        };
      })
    );
  };

  const handleMatchAllItemDates = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const first = (it.planned_dates && it.planned_dates[0]) || startDate || '2026-08-01';
        return {
          ...it,
          planned_dates: Array(count).fill(first),
          reminder_date: first,
        };
      })
    );
  };

  const handleMatchAllItemPrices = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const firstPrice = (it.planned_prices && it.planned_prices[0]) || it.unit_price || '0';
        const cleanFormatted = formatAmountInput(parseAmountNumber(firstPrice));
        const newPrices = Array(count).fill(cleanFormatted);
        const totalSum = count * parseAmountNumber(cleanFormatted);

        return {
          ...it,
          planned_prices: newPrices,
          unit_price: cleanFormatted,
          planned_amount: formatAmountInput(totalSum),
        };
      })
    );
  };

  const handleDivideTotalEvenly = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const total = parseAmountNumber(it.planned_amount);
        const perItem = count > 0 ? Math.round(total / count) : 0;
        const formattedPerItem = formatAmountInput(perItem);
        const newPrices = Array(count).fill(formattedPerItem);

        return {
          ...it,
          planned_prices: newPrices,
          unit_price: formattedPerItem,
          planned_amount: formatAmountInput(count * perItem),
        };
      })
    );
  };

  const handleDistributeVariedPrices = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const count = Math.max(1, Math.min(qtyNum, 31));
        const total = parseAmountNumber(it.planned_amount);
        const newPrices = generateVariedPlannedPrices(
          total,
          count,
          it.item_type === 'income' || it.section === 'revenue'
        );
        const avgPrice = count > 0 ? Math.round(total / count) : 0;

        return {
          ...it,
          planned_prices: newPrices,
          unit_price: formatAmountInput(avgPrice),
        };
      })
    );
  };

  const handleAddItemToSection = (section: BudgetSectionType, customDefaultName?: string, customDefaultUnit?: string) => {
    const isIncome = section === 'revenue';
    const defaultName =
      customDefaultName ||
      (section === 'revenue'
        ? language === 'id'
          ? (isPersonal ? 'Sumber Penghasilan / Gaji Baru' : 'Pos Penjualan Baru')
          : 'New Revenue Item'
        : section === 'cogs'
        ? language === 'id'
          ? (isPersonal ? 'Kebutuhan Pokok Baru' : 'Bahan Baku / Kulakan Baru')
          : 'New Direct Cost'
        : section === 'opex'
        ? language === 'id'
          ? (isPersonal ? 'Biaya Hidup / Tagihan Baru' : 'Biaya Operasional Baru')
          : 'New Operating Expense'
        : section === 'debt_receivable'
        ? language === 'id'
          ? (isPersonal ? 'Cicilan / Pinjaman Baru' : 'Cicilan Utang / Pelunasan Baru')
          : 'New Debt / Loan Item'
        : language === 'id'
        ? (isPersonal ? 'Pos Tabungan / Investasi Baru' : 'Aset Tetap / Prive Baru')
        : 'New Capex / Asset');

    const defaultDates = generateDefaultPlannedDates(1, startDate || undefined);

    const newItem: WizardRowItem = {
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      section,
      category_id: '',
      custom_name: defaultName,
      item_type: isIncome ? 'income' : 'expense',
      qty: '1',
      unit: customDefaultUnit || (isPersonal ? 'Bln' : 'Unit'),
      unit_price: '',
      planned_amount: '',
      planned_dates: defaultDates,
      planned_prices: [''],
      reminder_enabled: false,
      reminder_date: defaultDates[0] || endDate || new Date().toISOString().split('T')[0],
      reminder_note: '',
    };

    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Reusable Planned Schedules & Individual Unit Prices component renderer
  const renderPlannedDateInputs = (it: WizardRowItem) => {
    const qtyNum = parseInt(it.qty || '1', 10) || 1;
    const count = Math.max(1, Math.min(qtyNum, 31));
    const dates =
      it.planned_dates && it.planned_dates.length === count
        ? it.planned_dates
        : generateDefaultPlannedDates(count, startDate || undefined);

    const isIncome = it.item_type === 'income' || it.section === 'revenue';

    const prices =
      it.planned_prices && it.planned_prices.length === count
        ? it.planned_prices
        : generateVariedPlannedPrices(parseAmountNumber(it.planned_amount), count, isIncome);

    return (
      <div className="pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-700/70">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <label className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className={`w-3.5 h-3.5 ${isIncome ? 'text-emerald-500' : 'text-indigo-500'} shrink-0`} />
            <span>
              {isIncome
                ? (language === 'id' ? 'Jadwal & Nominal Penerimaan' : 'Inflow Schedule & Amount')
                : (language === 'id' ? 'Jadwal & Harga Satuan Pengeluaran' : 'Expense Schedule & Unit Price')}
              <span className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                ({count} {language === 'id' ? 'Pengisian Terjadwal' : 'Scheduled Entries'})
              </span>
            </span>
          </label>

          {count > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleDistributeVariedPrices(it.id)}
                className="text-[9.5px] font-black text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 transition-all shadow-2xs"
                title={language === 'id' ? 'Variasikan nominal setiap jadwal secara dinamis dan realistis' : 'Randomize varied amounts'}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{language === 'id' ? 'Variasikan Nominal' : 'Varied Amounts'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutoDistributeItemDates(it.id)}
                className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 transition-all"
                title={language === 'id' ? 'Bagi rata tanggal secara berkala dalam bulan anggaran' : 'Distribute dates evenly'}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{language === 'id' ? 'Bagi Rata Tgl' : 'Distribute Dates'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleMatchAllItemDates(it.id)}
                className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition-all"
                title={language === 'id' ? 'Samakan semua tanggal jadwal dengan Tgl #1' : 'Match all dates to #1'}
              >
                <span>{language === 'id' ? 'Samakan Tgl' : 'Match Dates'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleMatchAllItemPrices(it.id)}
                className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 transition-all"
                title={language === 'id' ? 'Samakan harga/nominal semua jadwal dengan Jadwal #1' : 'Match all prices to #1'}
              >
                <span>{language === 'id' ? 'Samakan Harga' : 'Match Prices'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDivideTotalEvenly(it.id)}
                className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 transition-all"
                title={language === 'id' ? 'Bagi rata total anggaran ke setiap jadwal' : 'Divide total evenly'}
              >
                <span>{language === 'id' ? 'Bagi Rata Total' : 'Split Total'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {dates.map((dVal, dIdx) => (
            <div
              key={dIdx}
              className="flex flex-col gap-1.5 bg-slate-50/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 shrink-0">
                  Jadwal #{dIdx + 1}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  Rp {prices[dIdx] || '0'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Tanggal Jadwal */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {language === 'id' ? 'Tanggal:' : 'Date:'}
                  </label>
                  <input
                    type="date"
                    value={dVal}
                    onChange={(e) => handleUpdateItemPlannedDate(it.id, dIdx, e.target.value)}
                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Harga Satuan / Nominal per Jadwal */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1 truncate">
                    {isIncome
                      ? (language === 'id' ? 'Nominal:' : 'Amount:')
                      : (language === 'id' ? 'Harga Satuan:' : 'Unit Price:')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prices[dIdx] || ''}
                    onChange={(e) => handleUpdateItemPlannedPrice(it.id, dIdx, e.target.value)}
                    placeholder="Rp 0"
                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-black text-slate-900 dark:text-white text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Automated AI Local Market Price Lookup trigger
  const triggerAiMarketPriceLookup = (
    itemId: string,
    itemName: string,
    sectionHint: BudgetSectionType,
    immediate: boolean = false
  ) => {
    if (debounceTimerRef.current[itemId]) {
      clearTimeout(debounceTimerRef.current[itemId]);
    }

    const clean = (itemName || '').trim();
    if (!clean || clean.length < 2) return;

    setAiLoadingItemIds((prev) => ({ ...prev, [itemId]: true }));

    const doLookup = async () => {
      try {
        const result = await lookupLocalMarketPrice(clean, sectionHint, selectedTemplateId);
        if (result && result.matched && result.unitPrice > 0) {
          setAiMarketSuggestions((prev) => ({ ...prev, [itemId]: result }));

          // Automatically update form with latest market price and standard unit
          setItems((prevItems) =>
            prevItems.map((it) => {
              if (it.id !== itemId) return it;
              const qtyNum = parseInt(it.qty || '1', 10) || 1;
              const targetCount = Math.max(1, Math.min(qtyNum, 31));
              const newUnitPrice = formatAmountInput(result.unitPrice);
              const newTotalAmount = formatAmountInput(qtyNum * result.unitPrice);
              const newPrices = generateVariedPlannedPrices(
                qtyNum * result.unitPrice,
                targetCount,
                it.item_type === 'income' || it.section === 'revenue'
              );

              return {
                ...it,
                unit_price: newUnitPrice,
                unit: result.unit || it.unit,
                planned_amount: newTotalAmount,
                planned_prices: newPrices,
              };
            })
          );

          setAiAutoUpdatedIds((prev) => ({ ...prev, [itemId]: true }));
          setTimeout(() => {
            setAiAutoUpdatedIds((prev) => ({ ...prev, [itemId]: false }));
          }, 5000);
        }
      } catch (err) {
        console.warn('AI Price lookup error:', err);
      } finally {
        setAiLoadingItemIds((prev) => ({ ...prev, [itemId]: false }));
      }
    };

    if (immediate) {
      doLookup();
    } else {
      debounceTimerRef.current[itemId] = setTimeout(doLookup, 350);
    }
  };

  // Reusable AI Local Market Price Feedback Badge renderer
  const renderAiMarketPriceBadge = (it: WizardRowItem) => {
    const isLoading = aiLoadingItemIds[it.id];
    const suggestion = aiMarketSuggestions[it.id];
    const isAutoUpdated = aiAutoUpdatedIds[it.id];

    if (!isLoading && !suggestion) return null;

    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
          isAutoUpdated
            ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-400'
            : 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles
            className={`w-4 h-4 shrink-0 ${
              isLoading
                ? 'animate-spin text-amber-500'
                : isAutoUpdated
                ? 'text-emerald-500 animate-bounce'
                : 'text-amber-500'
            }`}
          />
          {isLoading ? (
            <span className="text-amber-800 dark:text-amber-300 animate-pulse font-medium">
              {language === 'id'
                ? '🤖 AI sedang mencari referensi harga pasaran lokal...'
                : '🤖 AI searching local market price reference...'}
            </span>
          ) : suggestion ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <strong className="text-emerald-700 dark:text-emerald-400">✨ AI Pasaran Lokal:</strong>{' '}
                <span className="font-black text-slate-900 dark:text-white">
                  {formatRupiah(suggestion.unitPrice)}
                </span>{' '}
                / {suggestion.unit}
              </span>
              <span className="text-[9.5px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                {language === 'id' ? '✓ Harga Terupdate Diisi Otomatis' : '✓ Auto-Applied'}
              </span>
              {suggestion.note && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 hidden sm:inline italic">
                  ({suggestion.note})
                </span>
              )}
            </div>
          ) : null}
        </div>

        {!isLoading && suggestion && (
          <button
            type="button"
            onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
            title={language === 'id' ? 'Cari ulang harga pasaran lokal' : 'Re-check market price'}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0 bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>{language === 'id' ? 'Perbarui' : 'Refresh'}</span>
          </button>
        )}
      </div>
    );
  };

  // Submit and Save
  const handleFinalSave = () => {
    if (!budgetName.trim()) {
      alert(
        language === 'id'
          ? 'Silakan masukkan nama perencanaan anggaran.'
          : 'Please enter budget plan name.'
      );
      return;
    }

    const itemsToCreate: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[] = [];

    for (const it of items) {
      const pAmount = parseAmountNumber(it.planned_amount);
      if (pAmount <= 0) continue;

      const rowType = it.item_type || (it.section === 'revenue' ? 'income' : 'expense');
      let finalCatId = it.category_id;
      const rawName = (it.custom_name || '').trim();

      if (rawName) {
        // Look for existing category matching name and type
        const matched = categories.find(
          (c) =>
            c.type === rowType &&
            (c.name.toLowerCase() === rawName.toLowerCase() ||
              c.name.toLowerCase().includes(rawName.toLowerCase()) ||
              rawName.toLowerCase().includes(c.name.toLowerCase()))
        );

        if (matched) {
          finalCatId = matched.id;
        } else {
          // Register custom category to database
          const newCat: Category = {
            id: `cat_biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: rawName,
            type: rowType,
            icon: rowType === 'income' ? 'TrendingUp' : 'Tag',
            color:
              it.section === 'revenue'
                ? '#10B981'
                : it.section === 'cogs'
                ? '#EF4444'
                : it.section === 'opex'
                ? '#6366F1'
                : it.section === 'debt_receivable'
                ? '#D97706'
                : '#8B5CF6',
          };
          db.saveCategory(newCat);
          if (onSaveCategory) {
            onSaveCategory(newCat);
          }
          finalCatId = newCat.id;
        }
      }

      if (finalCatId) {
        let note = it.reminder_note || '';
        const qtyNum = parseInt(it.qty || '1', 10) || 1;
        const unitPriceNum = parseAmountNumber(it.unit_price);
        const datesList = it.planned_dates || [];
        const pricesList = it.planned_prices || [];

        const detailParts: string[] = [];
        if (qtyNum > 1 || unitPriceNum > 0) {
          const arePricesUniform =
            pricesList.length <= 1 ||
            pricesList.every(
              (p) => parseAmountNumber(p) === parseAmountNumber(pricesList[0])
            );

          if (arePricesUniform) {
            detailParts.push(
              `${qtyNum}x @ ${formatRupiah(
                unitPriceNum > 0 ? unitPriceNum : Math.round(pAmount / qtyNum)
              )}`
            );
            if (datesList.length > 0) {
              const shortDates = datesList.map((d) => {
                const parts = d.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
              });
              detailParts.push(`Tgl: ${shortDates.join(', ')}`);
            }
          } else {
            // Detailed breakdown per schedule (Date + Price)
            const breakdown = pricesList.map((p, idx) => {
              const d = datesList[idx] ? datesList[idx].split('-') : [];
              const dStr = d.length === 3 ? `${d[2]}/${d[1]}` : '';
              const pNum = parseAmountNumber(p);
              return `${dStr ? dStr + ' ' : '#' + (idx + 1) + ' '}${formatRupiah(pNum)}`;
            });
            detailParts.push(`${qtyNum}x: ${breakdown.join(' | ')}`);
          }
        } else if (datesList.length > 0) {
          const shortDates = datesList.map((d) => {
            const parts = d.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
          });
          detailParts.push(`Tgl: ${shortDates.join(', ')}`);
        }

        if (detailParts.length > 0) {
          const detailStr = detailParts.join(' • ');
          note = note ? `${note} (${detailStr})` : detailStr;
        }

        itemsToCreate.push({
          category_id: finalCatId,
          planned_amount: pAmount,
          reminder_enabled: it.reminder_enabled || false,
          reminder_date: (it.planned_dates && it.planned_dates[0]) || it.reminder_date || startDate,
          reminder_note: note,
        });
      }
    }

    if (itemsToCreate.length === 0) {
      alert(
        language === 'id'
          ? 'Mohon masukkan target rencana nominal minimal 1 pos anggaran.'
          : 'Please enter a planned amount for at least 1 budget item.'
      );
      return;
    }

    const totalPlanned = itemsToCreate.reduce((sum, i) => sum + i.planned_amount, 0);

    onSaveBudget(
      {
        name: budgetName,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalPlanned,
        mode: budgetMode,
        status: 'active',
        carryover_balance: isCarryoverIncluded ? effectiveCarryoverAmount : 0,
        rollover_type: isCarryoverIncluded ? effectiveRolloverType : 'none',
        rollover_note: isCarryoverIncluded ? (isCarryoverCustom ? 'Saldo awal kustom' : rolloverResult.note) : undefined,
      },
      itemsToCreate
    );

    // Audio chime feedback if reminders configured
    if (itemsToCreate.some((i) => i.reminder_enabled)) {
      playBellChimeSound();
    }

    onClose();
  };

  if (!isOpen) return null;

  const isPersonal = budgetMode === 'personal';

  const isProjectBudget = useMemo(() => {
    if (isPersonal) return false;
    if (
      selectedTemplateId.startsWith('proj_') ||
      selectedTemplateId === 'project_contract' ||
      activeContractInfo !== null
    ) {
      return true;
    }
    const currentName = (budgetName || initialBudget?.name || '').toLowerCase();
    return (
      currentName.includes('proyek') ||
      currentName.includes('kontrak') ||
      currentName.includes('spk') ||
      currentName.includes('termijn') ||
      currentName.includes('konstruksi') ||
      currentName.includes('pengadaan') ||
      currentName.includes('konsultan')
    );
  }, [isPersonal, selectedTemplateId, activeContractInfo, budgetName, initialBudget]);

  const filteredBusinessTemplates = useMemo(() => {
    if (businessCategoryFilter === 'project') {
      return BUSINESS_BUDGET_TEMPLATES.filter((t) => t.id.startsWith('proj_') || t.id === 'project_contract');
    }
    if (businessCategoryFilter === 'regular') {
      return BUSINESS_BUDGET_TEMPLATES.filter((t) => !t.id.startsWith('proj_') && t.id !== 'project_contract');
    }
    return BUSINESS_BUDGET_TEMPLATES;
  }, [businessCategoryFilter]);

  const stepsList = isPersonal
    ? [
        {
          num: 1,
          title: language === 'id' ? 'Profil' : 'Profile',
          fullTitle: language === 'id' ? 'Profil & Template' : 'Profile & Template',
          desc: language === 'id' ? 'Pilih jenis kebutuhan' : 'Select category',
          icon: User,
        },
        {
          num: 2,
          title: language === 'id' ? 'Aset' : 'Assets',
          fullTitle: language === 'id' ? 'Aset & Inventaris' : 'Personal Assets',
          desc: language === 'id' ? 'Aset & Inventaris' : 'Personal Assets',
          icon: Package,
        },
        {
          num: 3,
          title: language === 'id' ? '1. Pemasukan' : '1. Inflow',
          fullTitle: language === 'id' ? '1. Pemasukan (Gaji)' : '1. Income & Salary',
          desc: language === 'id' ? 'Sumber penerimaan' : 'Income sources',
          icon: TrendingUp,
        },
        {
          num: 4,
          title: language === 'id' ? '2. Kebutuhan' : '2. Essentials',
          fullTitle: language === 'id' ? '2. Kebutuhan Pokok' : '2. Living Needs',
          desc: language === 'id' ? 'Dapur, utilitas, sewa' : 'Essential needs',
          icon: Layers,
        },
        {
          num: 5,
          title: language === 'id' ? '3. Biaya Hidup' : '3. Lifestyle',
          fullTitle: language === 'id' ? '3. Biaya Hidup & Tagihan' : '3. Lifestyle & Debt',
          desc: language === 'id' ? 'Transport, anak, tagihan' : 'Bills & expenses',
          icon: Briefcase,
        },
        {
          num: 6,
          title: language === 'id' ? '4. Ringkasan' : '4. Summary',
          fullTitle: language === 'id' ? '4. Ringkasan & Tabungan' : '4. Summary & Savings',
          desc: language === 'id' ? 'Sisa kas & tabungan' : 'Cash flow & savings',
          icon: FileText,
        },
      ]
    : [
        {
          num: 1,
          title: language === 'id' ? 'Profil' : 'Profile',
          fullTitle: language === 'id' ? 'Profil & Template' : 'Profile & Template',
          desc: language === 'id' ? 'Pilih jenis usaha' : 'Select industry',
          icon: Store,
        },
        {
          num: 2,
          title: language === 'id' ? 'Inventori' : 'Inventory',
          fullTitle: language === 'id' ? 'Inventori & Modal' : 'Stock & Assets',
          desc: language === 'id' ? 'Stok & Inventaris' : 'Stock & Assets',
          icon: Package,
        },
        {
          num: 3,
          title: language === 'id' ? '1. Pendapatan' : '1. Revenue',
          fullTitle: language === 'id' ? '1. Pendapatan (Omzet)' : '1. Revenue',
          desc: language === 'id' ? 'Target penjualan' : 'Sales target',
          icon: TrendingUp,
        },
        {
          num: 4,
          title: language === 'id' ? '2. Beban Pokok' : '2. COGS',
          fullTitle: language === 'id' ? '2. Beban Pokok (HPP)' : '2. COGS',
          desc: language === 'id' ? 'Bahan baku & kulakan' : 'Raw materials',
          icon: Layers,
        },
        {
          num: 5,
          title: language === 'id' ? '3. Beban Usaha' : '3. OPEX',
          fullTitle: language === 'id' ? '3. Beban Usaha (OPEX)' : '3. OPEX',
          desc: language === 'id' ? 'Gaji, sewa, listrik' : 'Operating costs',
          icon: Briefcase,
        },
        {
          num: 6,
          title: language === 'id' ? '4. Ringkasan' : '4. Summary',
          fullTitle: language === 'id' ? '4. Ringkasan Laporan' : '4. Proforma Summary',
          desc: language === 'id' ? 'Laba rugi SAK EMKM' : 'Financial summary',
          icon: FileText,
        },
      ];

  return (
    <div
      data-no-swipe="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* HEADER BAR */}
        <div
          className={`px-5 py-4 text-white flex items-center justify-between shadow-md ${
            isPersonal
              ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900'
              : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              {isPersonal ? (
                <User className="w-5 h-5 text-purple-200" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {isPersonal
                    ? language === 'id'
                      ? 'Penganggaran Pribadi & Rumah Tangga'
                      : 'Personal & Household Budgeting Wizard'
                    : language === 'id'
                    ? 'Penganggaran Bisnis Sesuai Format Laporan'
                    : 'Structured Business Budgeting Wizard'}
                </h2>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPersonal
                      ? 'bg-purple-200 text-purple-950'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {isPersonal
                    ? language === 'id'
                      ? 'Keluarga & Pribadi'
                      : 'Personal & Family'
                    : 'SAK EMKM / IFRS'}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 hidden sm:block">
                {isPersonal
                  ? language === 'id'
                    ? 'Panduan langkah demi langkah perencanaan keuangan keluarga, gaji, tabungan, dan cicilan'
                    : 'Step-by-step guided budgeting for household needs, salary, savings, and debt'
                  : language === 'id'
                  ? 'Panduan langkah demi langkah dengan template kebutuhan item usaha otomatis'
                  : 'Step-by-step guided budgeting structured strictly after financial statement items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title={isPersonal ? 'Lihat Contoh Laporan Pribadi & Panduan (PDF)' : 'Lihat Contoh Laporan Bisnis & Panduan (PDF)'}
            >
              {isPersonal ? <BookOpen className="w-3.5 h-3.5 text-purple-200" /> : <FileText className="w-3.5 h-3.5 text-amber-300" />}
              <span className="hidden sm:inline">{isPersonal ? 'Contoh PDF & Panduan' : 'Contoh PDF Bisnis'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEPPER PROGRESS BAR (6 STEPS) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-1 sm:px-3 py-2 sm:py-2.5">
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex flex-col items-center sm:items-start text-left p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? isPersonal
                        ? 'bg-purple-600 text-white shadow-md font-bold'
                        : 'bg-blue-600 text-white shadow-md font-bold'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 border border-emerald-200/60 dark:border-emerald-800/50'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-center sm:justify-start">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? isPersonal
                            ? 'bg-white text-purple-700'
                            : 'bg-white text-blue-700'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold truncate">
                      <span className="hidden sm:inline">{step.fullTitle}</span>
                      <span className="sm:hidden">{step.title}</span>
                    </span>
                  </div>
                  <span
                    className={`text-[8.5px] truncate mt-0.5 hidden lg:block ${
                      isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/40 dark:bg-slate-900/60">
          <AnimatePresence mode="wait">
            {/* ================= STEP 1: PROFIL & TEMPLATE ================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-5"
              >
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    {isPersonal ? (
                      <User className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Store className="w-4 h-4 text-blue-600" />
                    )}
                    {language === 'id'
                      ? '1. Informasi Perencanaan Anggaran'
                      : '1. Budget Planning Information'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'id' ? 'Nama Perencanaan Anggaran:' : 'Budget Plan Name:'}
                      </label>
                      <input
                        type="text"
                        value={budgetName}
                        onChange={(e) => setBudgetName(e.target.value)}
                        placeholder={
                          language === 'id'
                            ? (isPersonal ? 'Contoh: Anggaran Pribadi & Rumah Tangga - Agustus' : 'Contoh: Anggaran Operasional UMKM - Agustus')
                            : (isPersonal ? 'e.g. Household Budget' : 'e.g. SME Operational Budget')
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'id' ? 'Peruntukan / Mode:' : 'Mode / Scope:'}
                      </label>
                      {lockMode ? (
                        <div className={`p-2.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                          lockMode === 'personal'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}>
                          {lockMode === 'personal' ? <User className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                          <span>{lockMode === 'personal' ? (language === 'id' ? 'Mode Pribadi (Terkunci)' : 'Personal Mode') : (language === 'id' ? 'Mode Bisnis (Terkunci)' : 'Business Mode')}</span>
                        </div>
                      ) : (
                        <select
                          value={budgetMode}
                          onChange={(e) => {
                            const newMode = e.target.value as ModeType;
                            setBudgetMode(newMode);
                            setTemplateTypeTab(newMode === 'personal' ? 'personal' : 'business');
                            if (newMode === 'personal') {
                              applyTemplate('personal_family');
                            } else {
                              applyTemplate('fnb_culinary');
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="business">
                            {language === 'id' ? '🏢 Mode Bisnis / UMKM' : '🏢 Business Mode'}
                          </option>
                          <option value="personal">
                            {language === 'id' ? '👤 Mode Pribadi' : '👤 Personal Mode'}
                          </option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'id' ? 'Mulai Periode:' : 'Start Period:'}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'id' ? 'Selesai Periode:' : 'End Period:'}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className={`p-2.5 rounded-xl border text-[11px] w-full flex items-center gap-1.5 ${
                        isPersonal
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200'
                          : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                      }`}>
                        <Info className="w-4 h-4 shrink-0 text-blue-600" />
                        <span>
                          {isPersonal
                            ? (language === 'id'
                                ? 'Struktur penganggaran pribadi otomatis mengacu metode 50/30/20 & pos keluarga'
                                : 'Budget lines structured after 50/30/20 rule and living categories')
                            : (language === 'id'
                                ? 'Struktur anggaran otomatis mengacu pos Laporan Keuangan resmi SAK EMKM'
                                : 'Budget lines automatically structured to official report format')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTINUOUS BUDGET ROLLOVER CARD (SISA KAS BERKELANJUTAN & PREDIKSI AI) */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/20 border border-amber-300 dark:border-amber-700/60 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {language === 'id'
                                  ? 'Sisa Anggaran & Kas Berkelanjutan'
                                  : 'Continuous Budget & Cash Rollover'}
                              </h4>
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                {rolloverResult.statusBadge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                              {rolloverResult.explanation}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Include / Exclude */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            {language === 'id' ? 'Sertakan Sisa Kas:' : 'Include Carryover:'}
                          </label>
                          <input
                            type="checkbox"
                            checked={isCarryoverIncluded}
                            onChange={(e) => setIsCarryoverIncluded(e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Rollover Amount Details & Manual Override */}
                      {isCarryoverIncluded && (
                        <div className="mt-3.5 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl">
                          <div className="flex items-center gap-3 flex-wrap text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                {isCarryoverCustom
                                  ? (language === 'id' ? 'Nominal Saldo Kustom' : 'Custom Carryover')
                                  : (language === 'id' ? 'Kalkulasi Otomatis Sistem' : 'Auto System Calculation')}
                              </span>
                              {!isCarryoverCustom ? (
                                <span className="text-base font-black text-amber-700 dark:text-amber-300">
                                  {formatRupiah(rolloverResult.amount)}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs font-bold text-slate-500">Rp</span>
                                  <input
                                    type="text"
                                    value={carryoverCustomInput}
                                    onChange={(e) => setCarryoverCustomInput(formatAmountInput(e.target.value))}
                                    className="p-1.5 w-36 bg-white dark:bg-slate-800 border border-amber-400 rounded-lg text-xs font-black text-amber-900 dark:text-amber-200 focus:outline-hidden"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="hidden sm:block h-7 w-px bg-amber-200 dark:bg-amber-800" />

                            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                              {rolloverResult.isPastMonth ? (
                                <div>
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Pemasukan Riil: {formatRupiah(rolloverResult.calculationDetails.realizedIncome)}</span>
                                  <span className="mx-1.5">•</span>
                                  <span className="font-semibold text-rose-700 dark:text-rose-400">Pengeluaran Riil: {formatRupiah(rolloverResult.calculationDetails.realizedExpense)}</span>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-semibold text-blue-700 dark:text-blue-400">Realisasi s.d. Hari Ini: {formatRupiah(rolloverResult.calculationDetails.realizedNet)}</span>
                                  <span className="mx-1.5">+</span>
                                  <span className="font-semibold text-amber-700 dark:text-amber-400">Sisa Rencana s.d. Akhir Bulan: {formatRupiah(rolloverResult.calculationDetails.plannedRemainingNet)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isCarryoverCustom) {
                                  setIsCarryoverCustom(true);
                                } else {
                                  setIsCarryoverCustom(false);
                                  setCarryoverCustomInput(formatAmountInput(rolloverResult.amount));
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-all cursor-pointer"
                            >
                              {isCarryoverCustom
                                ? (language === 'id' ? 'Kembali ke Auto Hitung' : 'Reset to Auto')
                                : (language === 'id' ? 'Ubah Manual' : 'Edit Manually')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TEMPLATE PICKER GRID & PROJECT CONTRACT SETTINGS */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {language === 'id'
                          ? (isPersonal ? '2. Pilih Template Kebutuhan Pribadi & Keluarga' : '2. Pilih Template Kebutuhan Bisnis & Proyek')
                          : (isPersonal ? '2. Select Personal & Family Template' : '2. Select Business & Project Template')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Seluruh pos pengeluaran rumah tangga, gaji, tagihan, serta tabungan langsung terisi otomatis.'
                              : 'Household expenses, salaries, bills, and savings targets are auto-populated.')
                          : (language === 'id'
                              ? 'Pilih model bisnis UMKM umum atau proyek berbasis SPK/kontrak untuk pengisian pos otomatis.'
                              : 'Select standard business or SPK/contract project templates for auto-populated items.')}
                      </p>
                    </div>

                    {!isPersonal ? (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setBusinessCategoryFilter('all')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            businessCategoryFilter === 'all'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {language === 'id' ? 'Semua Bisnis' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBusinessCategoryFilter('regular')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            businessCategoryFilter === 'regular'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {language === 'id' ? 'UMKM / Toko / Jasa' : 'SME / Retail'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBusinessCategoryFilter('project')}
                          className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            businessCategoryFilter === 'project'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-blue-700 dark:text-blue-400 hover:text-blue-900'
                          }`}
                        >
                          <HardHat className="w-3 h-3" />
                          <span>{language === 'id' ? 'Proyek & SPK' : 'Project & SPK'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        <User className="w-3.5 h-3.5" />
                        <span>{language === 'id' ? 'Template Pribadi & Keluarga' : 'Personal & Household Templates'}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(isPersonal
                      ? PERSONAL_BUDGET_TEMPLATES
                      : filteredBusinessTemplates
                    ).map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      const isTmplProject = tmpl.id.startsWith('proj_') || tmpl.id === 'project_contract';
                      const IconComponent =
                        tmpl.icon === 'HardHat'
                          ? HardHat
                          : tmpl.icon === 'Building2'
                          ? Building2
                          : tmpl.icon === 'Utensils'
                          ? Utensils
                          : tmpl.icon === 'Store'
                          ? Store
                          : tmpl.icon === 'Briefcase'
                          ? Briefcase
                          : tmpl.icon === 'Wrench'
                          ? Wrench
                          : tmpl.icon === 'Package'
                          ? Package
                          : tmpl.icon === 'Layers'
                          ? Layers
                          : tmpl.icon === 'Home'
                          ? Home
                          : tmpl.icon === 'ShoppingBag'
                          ? ShoppingBag
                          : tmpl.icon === 'Car'
                          ? Car
                          : tmpl.icon === 'GraduationCap'
                          ? GraduationCap
                          : tmpl.icon === 'HeartPulse'
                          ? HeartPulse
                          : User;

                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => applyTemplate(tmpl.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                            isSelected
                              ? isPersonal
                                ? 'bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-950/60 dark:to-indigo-950/40 border-purple-500 shadow-md ring-2 ring-purple-400/40'
                                : isTmplProject
                                ? 'bg-linear-to-br from-blue-900/10 via-indigo-950/20 to-slate-900/10 dark:from-blue-950/80 dark:to-slate-900/80 border-blue-600 shadow-md ring-2 ring-blue-500/40'
                                : 'bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/40 border-blue-500 shadow-md ring-2 ring-blue-400/40'
                              : isTmplProject
                              ? 'bg-slate-50/70 dark:bg-slate-800/80 border-blue-200 dark:border-blue-900/60 hover:border-blue-400 hover:shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  isSelected
                                    ? isPersonal
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : isTmplProject
                                      ? 'bg-blue-700 text-white shadow-xs'
                                      : 'bg-blue-600 text-white shadow-xs'
                                    : isTmplProject
                                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>

                              <div className="flex items-center gap-1">
                                {isTmplProject && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 flex items-center gap-0.5">
                                    <HardHat className="w-2.5 h-2.5" />
                                    SPK
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    isSelected
                                      ? isPersonal ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {tmpl.badge}
                                </span>
                              </div>
                            </div>

                            <div className="mb-1.5 flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                {tmpl.bidang || tmpl.industryTag}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                • {tmpl.subBidang || tmpl.badge}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                              {tmpl.name}
                            </h4>
                            {tmpl.businessName && (
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {tmpl.businessName}
                              </div>
                            )}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {tmpl.description}
                            </p>
                          </div>

                          <div className="mt-3">
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-bold">
                                {tmpl.items.length}{' '}
                                {language === 'id' ? 'Pos Siap Pakai' : 'Ready Items'}
                              </span>
                              {isSelected ? (
                                <span className={`${isPersonal ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'} font-black flex items-center gap-1`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {language === 'id' ? 'Terpilih' : 'Selected'}
                                </span>
                              ) : (
                                <span className="text-slate-400 hover:text-blue-600 font-bold">
                                  {language === 'id' ? 'Terapkan →' : 'Apply →'}
                                </span>
                              )}
                            </div>

                            {/* PROJECT-SPECIFIC QUICK AI ACTIONS ON CARD */}
                            {isTmplProject && (
                              <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyTemplate(tmpl.id);
                                    setIsContractAnalysisOpen(true);
                                  }}
                                  className="flex-1 py-1 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                                  title="Unggah / Analisis Berkas Kontrak SPK"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>{language === 'id' ? 'AI Analisis SPK' : 'AI Analyze SPK'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyTemplate(tmpl.id);
                                    setIsSavedContractsOpen(true);
                                  }}
                                  className="py-1 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Panggil Arsip Kontrak Database"
                                >
                                  <Database className="w-3 h-3 text-blue-500" />
                                  <span>{language === 'id' ? 'Arsip' : 'Saved'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PENGATURAN ANGGARAN PROYEK & INTEGRASI AI KONTRAK SPK (HANYA MUNCUL PADA KEUANGAN PROYEK) */}
                  {!isPersonal && isProjectBudget && (
                    <div className="mt-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-blue-700/60 shadow-lg animate-fadeIn">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
                              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-2">
                              {language === 'id'
                                ? 'Pengaturan Anggaran Proyek & AI Analisis Kontrak (SPK)'
                                : 'Project Budget Settings & AI Contract Analysis (SPK)'}
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                                {language === 'id' ? 'Khusus Keuangan Proyek' : 'Project Exclusive'}
                              </span>
                            </h4>
                          </div>
                          <p className="text-[11px] text-blue-200/90 leading-relaxed max-w-2xl">
                            {language === 'id'
                              ? 'Fitur khusus anggaran berbasis proyek (Konstruksi, Konsultan, atau Pengadaan). Unggah/analisis dokumen SPK dengan AI, ekstrak BoQ dan AHSP harga satuan, panggil arsip database kontrak, serta unduh salinan resmi.'
                              : 'Exclusive for project budgeting (Construction, Consultant, or Procurement). Upload/analyze contract documents with AI, extract BoQ with unit cost AHSP, access saved archives, and download contract copies.'}
                          </p>

                          {activeContractInfo && (
                            <div className="mt-2.5 p-3 bg-white/10 rounded-xl border border-white/15 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1.5 shadow-xs">
                              <span>
                                <strong className="text-amber-300">Kontrak Terpasang:</strong> {activeContractInfo.projectName}
                              </span>
                              {activeContractInfo.contractNumber && (
                                <span className="text-slate-300 font-mono">
                                  No: {activeContractInfo.contractNumber}
                                </span>
                              )}
                              {activeContractInfo.clientName && (
                                <span className="text-slate-300">
                                  Klien: {activeContractInfo.clientName}
                                </span>
                              )}
                              {activeContractInfo.contractorName && (
                                <span className="text-slate-300">
                                  Pelaksana: {activeContractInfo.contractorName}
                                </span>
                              )}
                              {activeContractInfo.totalValue && (
                                <span className="text-emerald-300 font-black">
                                  {formatRupiah(activeContractInfo.totalValue)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsContractAnalysisOpen(true)}
                            className="py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 border border-blue-400/40"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{language === 'id' ? 'AI Analisis Kontrak / SPK' : 'AI Analyze Contract'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsSavedContractsOpen(true)}
                            className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <Database className="w-3.5 h-3.5 text-blue-300" />
                            <span>{language === 'id' ? 'Panggil Arsip Database' : 'Saved Archives'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadCurrentContractCopy}
                            className="py-2.5 px-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Download Salinan Kontrak & AHSP (.txt)"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-300" />
                            <span>{language === 'id' ? 'Download Salinan' : 'Download Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 2: INVENTORI STOK & MODAL BERJALAN (BARU / UPDATE / NONE) ================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2_inventory"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                {/* STEP HEADER */}
                <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-blue-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-xs shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white">
                          {isPersonal
                            ? (language === 'id'
                                ? 'Pengaturan Inventori Aset Berharga Pribadi'
                                : 'Personal Asset & Equipment Setup')
                            : (language === 'id'
                                ? `Pengaturan Inventori Stok & Modal Berjalan: ${activeSelectedTemplate?.name || budgetName}`
                                : `Inventory Stock & Running Capital Setup: ${activeSelectedTemplate?.name || budgetName}`)}
                        </h3>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-xs">
                          {language === 'id' ? 'Database Terisolasi & Tersimpan Permanen' : 'Isolated Permanent DB'}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/90 mt-0.5 leading-relaxed">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Catat aset pribadi bernilai (laptop, kendaraan, emas, furniture dsb) untuk kalkulasi kekayaan bersih.'
                              : 'Record personal valuable assets or equipment for net-worth calculation.')
                          : (language === 'id'
                              ? 'Catat stok barang dagangan, bahan baku, mesin peralatan, furniture meja-kursi, dan ATK operasional usaha ini.'
                              : 'Manage merchandise stock, raw materials, machinery, furniture, and office supplies.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 CLEAR ACTION CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Tambah Stok Baru */}
                  <div
                    onClick={() => {
                      setInventoryModalAction('add');
                      setIsInventoryModalOpen(true);
                    }}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {language === 'id' ? '1. Catat Stok / Aset Baru' : '1. Add New Stock / Asset'}
                        </h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {language === 'id' ? 'Foto AI / Suara / Katalog / Form Cepat' : 'Scan AI / Voice / Preset / Form'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {language === 'id'
                        ? 'Input barang dagangan, bahan baku dapur, mesin peralatan, furniture meja/kursi, atau ATK baru ke database usaha ini.'
                        : 'Add new products, raw ingredients, machinery, furniture, or office supplies directly into this business database.'}
                    </p>
                  </div>

                  {/* 2. Update / Kelola Stok Terdata */}
                  <div
                    onClick={() => {
                      setInventoryModalAction('view');
                      setIsInventoryModalOpen(true);
                    }}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {language === 'id' ? '2. Kelola / Update Stok Terdata' : '2. Manage Stock Database'}
                        </h4>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {selectedBizInventory.length} {language === 'id' ? 'Pos Item & Aset Tersimpan' : 'Items Recorded'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {language === 'id'
                        ? 'Periksa daftar stok yang sudah ada, sesuaikan jumlah sisa barang (+ / -), atau ubah harga modal kulakan.'
                        : 'View and adjust quantities, unit cost prices, or edit existing records.'}
                    </p>
                  </div>
                </div>

                {/* 4 CARA INPUT CEPAT & PRAKTIS */}
                <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{language === 'id' ? '4 Mode Input Stok / Aset Praktis:' : '4 Easy Input Modes:'}</span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.2 rounded-full font-bold border border-amber-400/30">
                          {language === 'id' ? 'Super Cepat' : 'Instant'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-300">
                        {language === 'id'
                          ? 'Foto faktur supplier, dikte suara bicara, katalog 1-klik, atau form manual.'
                          : 'Scan invoice, voice dictation, 1-click catalog, or quick form.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setInventoryModalAction('ocr');
                        setIsInventoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer active:scale-95 transition-all border border-blue-400/40"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-300" />
                      <span>{language === 'id' ? '1. Foto Nota' : '1. Scan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInventoryModalAction('add');
                        setIsInventoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30 cursor-pointer active:scale-95 transition-all border border-rose-400/40"
                    >
                      <Mic className="w-3.5 h-3.5 text-amber-300" />
                      <span>{language === 'id' ? '2. Suara AI' : '2. Voice'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInventoryModalAction('add');
                        setIsInventoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/30 cursor-pointer active:scale-95 transition-all border border-amber-300/60"
                    >
                      <Zap className="w-3.5 h-3.5 text-slate-950" />
                      <span>{language === 'id' ? '3. Katalog' : '3. Preset'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInventoryModalAction('add');
                        setIsInventoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all border border-emerald-400/40"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{language === 'id' ? '4. Form Cepat' : '4. Form'}</span>
                    </button>
                  </div>
                </div>

                {/* AUTOMATIC CARRYOVER & PERMANENT ASSETS EXPLANATION BANNER */}
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-3 text-xs">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-blue-950 dark:text-blue-200 flex items-center gap-2">
                      <span>{language === 'id' ? '🔄 Sinkronisasi Otomatis dari Database / Bulan Sebelumnya' : '🔄 Automatic Inventory Carryover from Database'}</span>
                      <span className="text-[10px] bg-blue-200 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 px-2 py-0.2 rounded-full font-bold">
                        {language === 'id' ? 'Pengisian Cukup Sekali' : 'One-Time Setup'}
                      </span>
                    </h5>
                    <p className="text-[11px] text-blue-800/90 dark:text-blue-300 leading-relaxed">
                      {language === 'id'
                        ? 'Aset tetap (seperti Meja, Kursi, Rak Gondola/Etalase, Komputer Kasir POS, Mesin Peralatan, dan ATK) otomatis tersimpan permanen dan terbawa ke setiap anggaran bulan baru tanpa perlu diisi ulang. Anda hanya perlu memperbarui kuantitas sisa stok barang dagangan yang mengalami mutasi penjualan.'
                        : 'Fixed assets (Tables, Chairs, Shelves, POS Computers, Machinery, and Office Supplies) are permanently preserved and carried over automatically across monthly budgets. You only need to adjust moving merchandise stocks.'}
                    </p>
                  </div>
                </div>

                {/* METRICS REKAP MODAL TERTANAM (4 METRIC TILES) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Stok Barang */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-emerald-800 dark:text-emerald-300 font-black uppercase">
                        {language === 'id' ? 'Stok Barang & Bahan' : 'Stock & Materials'}
                      </span>
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 block">
                        {formatRupiah(selectedBizStockVal)}
                      </span>
                      <span className="text-[10px] text-emerald-600">
                        {selectedBizStock.length} {language === 'id' ? 'Pos Item' : 'Items'}
                      </span>
                    </div>
                  </div>

                  {/* Peralatan & Mesin */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-indigo-800 dark:text-indigo-300 font-black uppercase">
                        {language === 'id' ? 'Mesin & Peralatan' : 'Machinery'}
                      </span>
                      <Wrench className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 block">
                        {formatRupiah(selectedBizMachinesVal)}
                      </span>
                      <span className="text-[10px] text-indigo-600">
                        {selectedBizMachines.length} {language === 'id' ? 'Unit Peralatan' : 'Units'}
                      </span>
                    </div>
                  </div>

                  {/* Furniture & ATK */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-purple-800 dark:text-purple-300 font-black uppercase">
                        {language === 'id' ? 'Furniture, Rak & ATK' : 'Furniture & Supplies'}
                      </span>
                      <Layers className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300 block">
                        {formatRupiah(selectedBizFurnitureAtkVal)}
                      </span>
                      <span className="text-[10px] text-purple-600">
                        {selectedBizFurnitureAtk.length} {language === 'id' ? 'Pos Perlengkapan' : 'Items'}
                      </span>
                    </div>
                  </div>

                  {/* Total Modal Berjalan */}
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-blue-100 font-black uppercase">
                        {language === 'id' ? 'Total Modal Berjalan' : 'Total Capital'}
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-base font-black text-amber-300 block truncate">
                        {formatRupiah(selectedBizTotalVal)}
                      </span>
                      <span className="text-[10px] text-blue-100/90">
                        {selectedBizInventory.length} {language === 'id' ? 'Total Pos & Aset' : 'Total Items'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* INVENTORY ITEMS TABLE WITH FILTER TABS & QUICK ADJUSTERS */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>
                          {language === 'id'
                            ? `Daftar Inventaris Terdata: ${activeSelectedTemplate?.name || budgetName}`
                            : `Recorded Inventory Items: ${activeSelectedTemplate?.name || budgetName}`}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'id'
                          ? 'Anda dapat mengubah sisa stok dengan tombol (+) / (-) atau mengetik langsung kuantitas & harga.'
                          : 'Adjust quantity with (+) / (-) buttons or edit directly.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setInventoryModalAction('add');
                          setIsInventoryModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>{language === 'id' ? '+ Tambah Item' : '+ Add Item'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInventoryModalAction('ocr');
                          setIsInventoryModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{language === 'id' ? '📸 Scan Faktur (AI)' : '📸 Scan Invoice'}</span>
                      </button>
                    </div>
                  </div>

                  {/* FILTER TABS */}
                  <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setInventoryCategoryFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === 'all'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'id' ? '✨ Semua Item' : '✨ All Items'} ({selectedBizInventory.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInventoryCategoryFilter('stock')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === 'stock'
                          ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'id' ? '📦 Stok Barang & Bahan' : '📦 Stock & Materials'} ({selectedBizStock.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInventoryCategoryFilter('equipment')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === 'equipment'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'id' ? '🛠️ Mesin & Alat' : '🛠️ Machinery'} ({selectedBizMachines.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInventoryCategoryFilter('furniture_atk')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === 'furniture_atk'
                          ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'id' ? '🪑 Meja, Kursi & ATK' : '🪑 Furniture & Supplies'} ({selectedBizFurnitureAtk.length})
                    </button>
                  </div>

                  {/* ITEMS LIST */}
                  {filteredInventoryDisplayList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p>
                        {language === 'id'
                          ? 'Belum ada data pada kategori inventaris ini.'
                          : 'No items recorded in this inventory category.'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setInventoryModalAction('add');
                            setIsInventoryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                        >
                          {language === 'id' ? '➕ Tambah Item Baru' : '➕ Add Item'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredInventoryDisplayList.map((item, idx) => {
                        const itemSubtotal = item.qty * item.cost_price;
                        const isFurnitureAtk = selectedBizFurnitureAtk.some((f) => f.id === item.id);
                        
                        const typeBadge =
                          item.item_type === 'product_stock'
                            ? { label: language === 'id' ? 'Barang Dagangan' : 'Product Stock', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                            : item.item_type === 'raw_material'
                            ? { label: language === 'id' ? 'Bahan Baku' : 'Raw Material', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' }
                            : isFurnitureAtk
                            ? { label: language === 'id' ? 'Furniture & ATK' : 'Furniture & Supplies', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' }
                            : { label: language === 'id' ? 'Peralatan/Mesin' : 'Equipment', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };

                        return (
                          <div
                            key={item.id || idx}
                            className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <strong className="text-slate-900 dark:text-white truncate block">
                                    {item.name}
                                  </strong>
                                  <span className={`text-[9px] font-black px-2 py-0.2 rounded-full ${typeBadge.color}`}>
                                    {typeBadge.label}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                                  {language === 'id' ? 'Harga Beli Modal:' : 'Unit Cost:'} {formatRupiah(item.cost_price)} / {item.unit}
                                </span>

                                {/* POSISI BULAN SEBELUMNYA STRIP */}
                                {item.item_type === 'equipment_asset' || isFurnitureAtk ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60 mt-1">
                                    <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>
                                      {language === 'id' ? 'Bulan Lalu:' : 'Last Month:'} <strong>{item.last_month_qty || item.qty} {item.unit}</strong>{' '}
                                      ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong>{item.qty} {item.unit}</strong>{' '}
                                      <span className="text-amber-700 dark:text-amber-400 font-normal">
                                        ({language === 'id' ? '🔒 Aset Tetap' : 'Fixed Asset'})
                                      </span>
                                    </span>
                                  </div>
                                ) : (
                                  (() => {
                                    const lastQty = item.last_month_qty !== undefined ? item.last_month_qty : item.qty;
                                    const diff = item.qty - lastQty;

                                    if (diff < 0) {
                                      return (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800/60 mt-1">
                                          <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                          <span>
                                            {language === 'id' ? 'Bulan Lalu:' : 'Last Month:'} <strong className="line-through opacity-75">{lastQty} {item.unit}</strong>{' '}
                                            ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong className="text-rose-700 dark:text-rose-300">{item.qty} {item.unit}</strong>{' '}
                                            <span className="text-rose-600 dark:text-rose-400 font-black ml-1">
                                              (-{Math.abs(diff)} {item.unit} {language === 'id' ? 'terpakai' : 'used'})
                                            </span>
                                          </span>
                                        </div>
                                      );
                                    } else if (diff > 0) {
                                      return (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 mt-1">
                                          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                          <span>
                                            {language === 'id' ? 'Bulan Lalu:' : 'Last Month:'} <strong className="opacity-75">{lastQty} {item.unit}</strong>{' '}
                                            ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong className="text-emerald-700 dark:text-emerald-300">{item.qty} {item.unit}</strong>{' '}
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black ml-1">
                                              (+{diff} {item.unit} {language === 'id' ? 'restock' : 'restocked'})
                                            </span>
                                          </span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/60 mt-1">
                                          <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                          <span>
                                            {language === 'id' ? 'Bulan Lalu:' : 'Last Month:'} <strong>{lastQty} {item.unit}</strong>{' '}
                                            ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong>{item.qty} {item.unit}</strong>{' '}
                                            <span className="text-blue-600 dark:text-blue-400 font-normal">
                                              ({language === 'id' ? 'Sama / Utuh' : 'Same'})
                                            </span>
                                          </span>
                                        </div>
                                      );
                                    }
                                  })()
                                )}
                              </div>
                            </div>

                            {/* QTY ADJUSTER & SUBTOTAL */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                              {/* Quick Qty adjuster */}
                              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(0, item.qty - 1);
                                    db.saveInventoryItem({ ...item, qty: newQty });
                                    setInventoryVersion((v) => v + 1);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-2 font-black text-slate-900 dark:text-white text-xs min-w-8 text-center">
                                  {item.qty} {item.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = item.qty + 1;
                                    db.saveInventoryItem({ ...item, qty: newQty });
                                    setInventoryVersion((v) => v + 1);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="text-right min-w-24">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                                  {language === 'id' ? 'Nilai Modal' : 'Total Capital'}
                                </span>
                                <strong className="text-slate-900 dark:text-white font-black text-xs">
                                  {formatRupiah(itemSubtotal)}
                                </strong>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus item ${item.name} dari database?`)) {
                                    db.deleteInventoryItem(item.id);
                                    setInventoryVersion((v) => v + 1);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Hapus Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 3: TARGET PENDAPATAN (OMZET) / PEMASUKAN ================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3_revenue"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Bagian 1: Pemasukan & Sumber Penghasilan (Gaji / Usaha)'
                              : 'Part 1: Inflow & Income Sources')
                          : (language === 'id'
                              ? 'Bagian 1: Target Pendapatan Penjualan (Omzet Usaha)'
                              : 'Part 1: Sales Revenue Target')}
                      </h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Rencana penghasilan: Gaji utama, penghasilan pasangan, usaha sampingan, bonus/THR, dan dividen.'
                              : 'Planned income: Main salary, spouse income, side hustle, bonuses, and investment returns.')
                          : (language === 'id'
                              ? 'Rencana omzet: Penjualan produk/jasa, termijn proyek SPK, atau pendapatan layanan operasional.'
                              : 'Planned turnover: Product sales, project termijns, or service billing.')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      {isPersonal
                        ? (language === 'id' ? 'Total Pemasukan' : 'Total Inflow')
                        : (language === 'id' ? 'Total Target Omzet' : 'Total Revenue')}
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-600">
                      {formatRupiah(totals.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* ITEMS LIST */}
                <div className="flex flex-col gap-2.5">
                  {getItemsForSection('revenue').map((it, idx) => (
                    <div
                      key={it.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={it.custom_name}
                            onChange={(e) => {
                              handleUpdateItem(it.id, { custom_name: e.target.value });
                              triggerAiMarketPriceLookup(it.id, e.target.value, it.section);
                            }}
                            placeholder={
                              isPersonal
                                ? (language === 'id' ? 'Nama Pos Pemasukan (Gaji, Bonus, Usaha...)' : 'Income Name')
                                : (language === 'id' ? 'Nama Pos Pendapatan (Penjualan, Termijn Proyek...)' : 'Revenue Item Name')
                            }
                            className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
                            title={language === 'id' ? 'Cek referensi harga pasaran lokal terkini (AI)' : 'Check local market price (AI)'}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Harga Pasar (AI)' : 'Market (AI)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAhspForItem(it.id)}
                            title={language === 'id' ? 'Hitung Dasar Analisa Harga Satuan (AHSP) / Komposisi Biaya' : 'Unit Cost Analysis (AHSP)'}
                            className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {renderAiMarketPriceBadge(it)}

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {isPersonal ? (language === 'id' ? 'Frekuensi' : 'Frequency') : (language === 'id' ? 'Qty / Vol' : 'Quantity')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={it.qty || '1'}
                            onChange={(e) => handleUpdateItem(it.id, { qty: e.target.value })}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {language === 'id' ? 'Satuan' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={it.unit || 'Bln'}
                            onChange={(e) => handleUpdateItem(it.id, { unit: e.target.value })}
                            placeholder="Bln / Pcs"
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5 truncate">
                            {isPersonal
                              ? (language === 'id' ? 'Total Pemasukan (Rp)' : 'Total Income (Rp)')
                              : (language === 'id' ? 'Total Target Pendapatan (Rp)' : 'Total Revenue (Rp)')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={it.planned_amount}
                            onChange={(e) =>
                              handleUpdateItem(it.id, {
                                planned_amount: formatAmountInput(
                                  parseAmountNumber(e.target.value)
                                ),
                              })
                            }
                            placeholder="Rp 0"
                            className="w-full p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-300 text-right"
                          />
                        </div>
                      </div>

                      {renderPlannedDateInputs(it)}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddItemToSection('revenue')}
                    className="py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isPersonal
                        ? (language === 'id'
                            ? '+ Tambah Pos Pemasukan / Gaji Baru'
                            : '+ Add New Income Stream')
                        : (language === 'id'
                            ? '+ Tambah Pos Target Pendapatan Baru'
                            : '+ Add New Revenue Target')}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 4: BEBAN POKOK (HPP) / KEBUTUHAN POKOK ================= */}
            {currentStep === 4 && (
              <motion.div
                key="step4_cogs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-950 dark:text-rose-200">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Bagian 2: Kebutuhan Pokok Hidup (Dapur, Sembako, Utilitas Pokok)'
                              : 'Part 2: Essential Living Needs (Groceries & Primary Needs)')
                          : (language === 'id'
                              ? 'Bagian 2: Beban Pokok Pendapatan (HPP / Biaya Langsung Usaha)'
                              : 'Part 2: Cost of Goods Sold (COGS & Direct Costs)')}
                      </h3>
                      <p className="text-xs text-rose-700 dark:text-rose-400">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Rencana biaya primer mutlak: Belanja dapur/sembako, makan harian, gas elpiji, air galon, dan perlengkapan mandi.'
                              : 'Primary essential costs: Groceries, daily food, cooking gas, gallon water, and hygiene essentials.')
                          : (language === 'id'
                              ? 'Rencana biaya pokok langsung: Bahan baku produksi, kulakan barang dagangan, upah tukang langsung BoQ, atau food cost porsi.'
                              : 'Direct production costs: Raw materials, inventory purchases, direct project labor BoQ, food ingredients.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        {isPersonal
                          ? (language === 'id' ? 'Total Kebutuhan Pokok' : 'Total Essentials')
                          : (language === 'id' ? 'Total Beban Pokok (HPP)' : 'Total COGS')}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-600">
                        {formatRupiah(totals.totalCOGS)}
                      </span>
                    </div>

                    <div className="text-right bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-2xs">
                      <span className="text-[9px] font-bold text-emerald-100 block uppercase">
                        {isPersonal
                          ? (language === 'id' ? 'Sisa Kas Pokok' : 'Balance After Needs')
                          : (language === 'id' ? 'Laba Kotor (Gross Profit)' : 'Gross Profit')}
                      </span>
                      <span className="text-xs sm:text-sm font-black">
                        {formatRupiah(totals.grossProfit)} (
                        {totals.grossMarginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* ITEMS LIST */}
                <div className="flex flex-col gap-2.5">
                  {getItemsForSection('cogs').map((it, idx) => (
                    <div
                      key={it.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={it.custom_name}
                            onChange={(e) => {
                              handleUpdateItem(it.id, { custom_name: e.target.value });
                              triggerAiMarketPriceLookup(it.id, e.target.value, it.section);
                            }}
                            placeholder={
                              isPersonal
                                ? (language === 'id' ? 'Nama Kebutuhan Pokok (Beras, Dapur, Sembako...)' : 'Essential Item Name')
                                : (language === 'id' ? 'Nama Pos Beban Pokok (Bahan Baku, Kulakan...)' : 'COGS Item Name')
                            }
                            className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
                            title={language === 'id' ? 'Cek referensi harga pasaran lokal terkini (AI)' : 'Check local market price (AI)'}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Harga Pasar (AI)' : 'Market (AI)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAhspForItem(it.id)}
                            title={language === 'id' ? 'Hitung Dasar Analisa Harga Satuan (AHSP) / Komposisi Biaya' : 'Unit Cost Analysis (AHSP)'}
                            className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Calculator className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {renderAiMarketPriceBadge(it)}

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {isPersonal ? (language === 'id' ? 'Qty / Porsi' : 'Quantity') : (language === 'id' ? 'Qty / Vol' : 'Quantity')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={it.qty || '1'}
                            onChange={(e) => handleUpdateItem(it.id, { qty: e.target.value })}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {language === 'id' ? 'Satuan' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={it.unit || 'Kg'}
                            onChange={(e) => handleUpdateItem(it.id, { unit: e.target.value })}
                            placeholder="Kg / Pcs"
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5 truncate">
                            {isPersonal
                              ? (language === 'id' ? 'Total Kebutuhan Pokok (Rp)' : 'Total Essentials (Rp)')
                              : (language === 'id' ? 'Total Beban Pokok / HPP (Rp)' : 'Total COGS (Rp)')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={it.planned_amount}
                            onChange={(e) =>
                              handleUpdateItem(it.id, {
                                planned_amount: formatAmountInput(
                                  parseAmountNumber(e.target.value)
                                ),
                              })
                            }
                            placeholder="Rp 0"
                            className="w-full p-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-black text-rose-700 dark:text-rose-300 text-right"
                          />
                        </div>
                      </div>

                      {renderPlannedDateInputs(it)}
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItemToSection('cogs')}
                      className="flex-1 py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border border-dashed border-rose-300 dark:border-rose-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {isPersonal
                          ? (language === 'id'
                              ? '+ Tambah Pos Kebutuhan Pokok / Dapur Baru'
                              : '+ Add New Essential Living Item')
                          : (language === 'id'
                              ? '+ Tambah Pos Beban Pokok (HPP) Baru'
                              : '+ Add New COGS Line Item')}
                      </span>
                    </button>

                    {!isPersonal && (
                      <button
                        type="button"
                        onClick={handleSyncCogsFromInventory}
                        className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Tarik daftar belanja kulakan langsung dari data inventaris stok berjalan"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'id' ? '🪄 Tarik Belanja Kulakan dari Stok Berjalan' : '🪄 Sync Restock from Inventory'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 5: BEBAN OPERASIONAL (OPEX) / BIAYA HIDUP ================= */}
            {currentStep === 5 && (
              <motion.div
                key="step5_opex"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Bagian 3: Biaya Operasional Keluarga & Gaya Hidup (Sewa, Transport, Tagihan)'
                              : 'Part 3: Family Lifestyle, Bills & Utilities')
                          : (language === 'id'
                              ? 'Bagian 3: Beban Operasional Usaha (OPEX & Administrasi)'
                              : 'Part 3: Operating Expenses (OPEX & Admin)')}
                      </h3>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Rencana biaya rutin: Biaya sekolah anak, transport bensin, listrik PLN / PDAM, internet/wifi, asuransi, dan hiburan.'
                              : 'Recurring overhead: Children schooling, gasoline/transport, electricity, wifi, health insurance, and leisure.')
                          : (language === 'id'
                              ? 'Rencana biaya rutin: Gaji karyawan, sewa tempat, listrik & air PLN/PDAM, iklan/promosi, dan wifi.'
                              : 'Recurring overhead: Payroll, facility lease, utilities, digital marketing, maintenance.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        {isPersonal
                          ? (language === 'id' ? 'Total Biaya Hidup' : 'Total Living OPEX')
                          : (language === 'id' ? 'Total OPEX' : 'Total OPEX')}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-indigo-600">
                        {formatRupiah(totals.totalOPEX)}
                      </span>
                    </div>

                    <div className="text-right bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-2xs">
                      <span className="text-[9px] font-bold text-blue-100 block uppercase">
                        {isPersonal
                          ? (language === 'id' ? 'Sisa Kas Bersih' : 'Net Discretionary Cash')
                          : (language === 'id' ? 'Laba Usaha (EBIT)' : 'Operating Profit')}
                      </span>
                      <span className="text-xs sm:text-sm font-black">
                        {formatRupiah(totals.operatingProfit)} (
                        {totals.operatingMarginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* ITEMS LIST */}
                <div className="flex flex-col gap-2.5">
                  {getItemsForSection('opex').map((it, idx) => (
                    <div
                      key={it.id}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={it.custom_name}
                            onChange={(e) => {
                              handleUpdateItem(it.id, { custom_name: e.target.value });
                              triggerAiMarketPriceLookup(it.id, e.target.value, it.section);
                            }}
                            placeholder={
                              isPersonal
                                ? (language === 'id' ? 'Nama Pos Biaya Hidup (Listrik, Wifi, Sekolah...)' : 'Living Cost Name')
                                : (language === 'id' ? 'Nama Pos Beban Usaha (Gaji, Sewa, Listrik...)' : 'OPEX Item Name')
                            }
                            className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
                            title={language === 'id' ? 'Cek referensi harga pasaran lokal terkini (AI)' : 'Check local market price (AI)'}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Harga Pasar (AI)' : 'Market (AI)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAhspForItem(it.id)}
                            title={language === 'id' ? 'Hitung Dasar Analisa Harga Satuan (AHSP) / Komposisi Biaya' : 'Unit Cost Analysis (AHSP)'}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {renderAiMarketPriceBadge(it)}

                      {/* QUANTITY, UNIT & TOTAL PRICING */}
                      <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {language === 'id' ? 'Qty / Vol' : 'Quantity:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={it.qty || '1'}
                            onChange={(e) => handleUpdateItem(it.id, { qty: e.target.value })}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {language === 'id' ? 'Satuan' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={it.unit || 'Bln'}
                            onChange={(e) =>
                              handleUpdateItem(it.id, { unit: e.target.value })
                            }
                            placeholder="Bln / Unit"
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5 truncate">
                            {isPersonal
                              ? (language === 'id' ? 'Total Rencana Biaya Hidup (Rp)' : 'Total Living OPEX (Rp)')
                              : (language === 'id' ? 'Total Rencana Beban Usaha (Rp)' : 'Total OPEX (Rp)')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={it.planned_amount}
                            onChange={(e) =>
                              handleUpdateItem(it.id, {
                                planned_amount: formatAmountInput(
                                  parseAmountNumber(e.target.value)
                                ),
                              })
                            }
                            placeholder="Rp 0"
                            className="w-full p-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-black text-indigo-700 dark:text-indigo-300 text-right"
                          />
                        </div>
                      </div>

                      {renderPlannedDateInputs(it)}
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItemToSection('opex')}
                      className="flex-1 py-2.5 px-4 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-200 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {isPersonal
                          ? (language === 'id'
                              ? '+ Tambah Pos Biaya Hidup / Tagihan Baru'
                              : '+ Add New Living Expense Line Item')
                          : (language === 'id'
                              ? '+ Tambah Pos Beban Operasional Baru'
                              : '+ Add New OPEX Line Item')}
                      </span>
                    </button>

                    {!isPersonal && (
                      <button
                        type="button"
                        onClick={handleSyncOpexFromInventoryAssets}
                        className="py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Tarik pos pemeliharaan & servis mesin dari daftar aset terdata"
                      >
                        <Wrench className="w-3.5 h-3.5 text-amber-200" />
                        <span>{language === 'id' ? '🪄 Tarik Biaya Servis & Perawatan Aset Mesin' : '🪄 Sync Equipment Maintenance'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 6: ASET, TABUNGAN / PRIVE & RINGKASAN LAPORAN ================= */}
            {currentStep === 6 && (
              <motion.div
                key="step6_summary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-5"
              >
                {/* CAPEX / SAVINGS & EQUITY OPTIONAL ITEMS */}
                <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <WalletCards className="w-4 h-4 text-purple-600" />
                      <div>
                        <h4 className="text-xs font-black text-purple-950 dark:text-purple-200">
                          {isPersonal
                            ? (language === 'id'
                                ? 'Tabungan Masa Depan, Investasi, Dana Darurat & Sedekah'
                                : 'Savings, Emergency Fund, Investments & Charity')
                            : (language === 'id'
                                ? 'Belanja Modal (Aset Baru), Prive Pemilik & Pajak Usaha'
                                : 'Capital Expenditure (Capex), Owner Drawings & Taxes')}
                        </h4>
                        <p className="text-[10px] text-purple-700 dark:text-purple-400">
                          {isPersonal
                            ? (language === 'id'
                                ? 'Rencana pos dana darurat, tabungan pensiun, reksadana/saham, qurban/zakat.'
                                : 'Emergency funds, retirement, investments, and donations.')
                            : (language === 'id'
                                ? 'Pembelian mesin/alat baru, prive pemilik, dan pajak penghasilan.'
                                : 'New equipment, owner drawings, and taxes.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddItemToSection('capex_equity')}
                      className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-purple-300 hover:bg-purple-100 cursor-pointer shrink-0"
                    >
                      {isPersonal
                        ? (language === 'id' ? '+ Tambah Tabungan/Investasi' : '+ Add Savings/Invest')
                        : (language === 'id' ? '+ Tambah Pos Aset/Prive' : '+ Add Capex/Prive')}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {getItemsForSection('capex_equity').map((it, idx) => (
                      <div
                        key={it.id}
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-2xs flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={it.custom_name}
                              onChange={(e) => {
                                handleUpdateItem(it.id, { custom_name: e.target.value });
                                triggerAiMarketPriceLookup(it.id, e.target.value, it.section);
                              }}
                              placeholder={
                                isPersonal
                                  ? (language === 'id' ? 'Pos Tabungan / Investasi (Dana Darurat, Emas...)' : 'Savings / Investment Name')
                                  : (language === 'id' ? 'Pos Belanja Modal / Aset / Prive' : 'Capex / Asset Name')
                              }
                              className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
                              title={language === 'id' ? 'Cek referensi harga pasaran lokal terkini (AI)' : 'Check local market price (AI)'}
                              className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span className="hidden sm:inline">{language === 'id' ? 'Harga Pasar (AI)' : 'Market (AI)'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAhspForItem(it.id)}
                              title={language === 'id' ? 'Hitung Dasar Analisa Harga Satuan (AHSP) / Komposisi Biaya' : 'Unit Cost Analysis (AHSP)'}
                              className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                            >
                              <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span className="hidden sm:inline">{language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(it.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {renderAiMarketPriceBadge(it)}

                        {/* QUANTITY, UNIT & TOTAL PRICING */}
                        <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                          <div className="w-20 sm:w-24 shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              {language === 'id' ? 'Qty / Vol' : 'Quantity:'}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={it.qty || '1'}
                              onChange={(e) => handleUpdateItem(it.id, { qty: e.target.value })}
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                            />
                          </div>

                          <div className="w-20 sm:w-24 shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              {language === 'id' ? 'Satuan' : 'Unit'}
                            </label>
                            <input
                              type="text"
                              value={it.unit || 'Bln'}
                              onChange={(e) =>
                                handleUpdateItem(it.id, { unit: e.target.value })
                              }
                              placeholder="Bln / Unit"
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-0.5 truncate">
                              {language === 'id' ? 'Total Rencana (Rp)' : 'Total Planned:'}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={it.planned_amount}
                              onChange={(e) =>
                                handleUpdateItem(it.id, {
                                  planned_amount: formatAmountInput(
                                    parseAmountNumber(e.target.value)
                                  ),
                                })
                              }
                              placeholder="Rp 0"
                              className="w-full p-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-black text-purple-700 dark:text-purple-300 text-right"
                            />
                          </div>
                        </div>

                        {renderPlannedDateInputs(it)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEBT & RECEIVABLE ITEMS (UTANG & PIUTANG / CICILAN) */}
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <div>
                        <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                          {isPersonal
                            ? (language === 'id'
                                ? 'Cicilan Utang, KPR, Kendaraan & Kartu Kredit'
                                : 'Personal Loans, Mortgages & Credit Cards')
                            : (language === 'id'
                                ? 'Utang & Piutang (Cicilan Pinjaman, Pelunasan & Tagihan)'
                                : 'Debt & Receivables (Loan Repayments, Collections)')}
                        </h4>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                          {isPersonal
                            ? (language === 'id'
                                ? 'Perencanaan cicilan KPR rumah, cicilan motor/mobil, kartu kredit, dan paylater.'
                                : 'Planned mortgage, vehicle financing, credit card, and loan payments.')
                            : (language === 'id'
                                ? 'Perencanaan cicilan utang bulanan, pelunasan utang usaha, atau piutang.'
                                : 'Planned monthly loan installments, supplier debt repayments, or accounts receivable.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddItemToSection('debt_receivable')}
                      className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 cursor-pointer shrink-0"
                    >
                      {isPersonal
                        ? (language === 'id' ? '+ Tambah Cicilan / Utang' : '+ Add Loan Item')
                        : (language === 'id' ? '+ Tambah Pos Utang/Piutang' : '+ Add Debt/Receivable')}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {getItemsForSection('debt_receivable').length === 0 ? (
                      <p className="text-[11px] text-amber-700/80 italic py-1">
                        {language === 'id'
                          ? 'Tidak ada pos utang / piutang khusus yang direncanakan.'
                          : 'No active debt or receivable plan items.'}
                      </p>
                    ) : (
                      getItemsForSection('debt_receivable').map((it, idx) => (
                        <div
                          key={it.id}
                          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-2xs flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={it.custom_name}
                                onChange={(e) => {
                                  handleUpdateItem(it.id, { custom_name: e.target.value });
                                  triggerAiMarketPriceLookup(it.id, e.target.value, it.section);
                                }}
                                placeholder={
                                  isPersonal
                                    ? (language === 'id'
                                        ? 'Nama Cicilan / Utang (KPR, Motor, Kartu Kredit...)'
                                        : 'Loan / Mortgage Name')
                                    : (language === 'id'
                                        ? 'Nama Pinjaman / Cicilan / Piutang'
                                        : 'Loan / Repayment Name')
                                }
                                className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => triggerAiMarketPriceLookup(it.id, it.custom_name, it.section, true)}
                                title={language === 'id' ? 'Cek referensi harga pasaran lokal terkini (AI)' : 'Check local market price (AI)'}
                                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span className="hidden sm:inline">{language === 'id' ? 'Harga Pasar (AI)' : 'Market (AI)'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAhspForItem(it.id)}
                                title={language === 'id' ? 'Hitung Dasar Analisa Harga Satuan (AHSP) / Komposisi Biaya' : 'Unit Cost Analysis (AHSP)'}
                                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                              >
                                <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="hidden sm:inline">{language === 'id' ? 'Dasar Hitungan (AHSP)' : 'AHSP / Unit Cost'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(it.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {renderAiMarketPriceBadge(it)}

                          {/* QUANTITY, UNIT & TOTAL PRICING */}
                          <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                            <div className="w-20 sm:w-24 shrink-0">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                {language === 'id' ? 'Qty / Vol' : 'Quantity:'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={it.qty || '1'}
                                onChange={(e) => handleUpdateItem(it.id, { qty: e.target.value })}
                                className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                              />
                            </div>

                            <div className="w-20 sm:w-24 shrink-0">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                {language === 'id' ? 'Satuan' : 'Unit'}
                              </label>
                              <input
                                type="text"
                                value={it.unit || 'Bln'}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, { unit: e.target.value })
                                }
                                placeholder="Bln / Cicilan"
                                className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5 truncate">
                                {language === 'id' ? 'Total Cicilan (Rp)' : 'Total Planned:'}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={it.planned_amount}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, {
                                    planned_amount: formatAmountInput(
                                      parseAmountNumber(e.target.value)
                                    ),
                                  })
                                }
                                placeholder="Rp 0"
                                className="w-full p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-black text-amber-700 dark:text-amber-300 text-right"
                              />
                            </div>
                          </div>

                          {renderPlannedDateInputs(it)}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PROFORMA FINANCIAL STATEMENT (SAK EMKM / IFRS FORMAT OR PERSONAL CASH FLOW) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-black tracking-wide uppercase">
                        {isPersonal
                          ? (language === 'id'
                              ? 'Pratinjau Ringkasan Anggaran & Arus Kas Pribadi'
                              : 'Personal Budget & Cashflow Statement Preview')
                          : (language === 'id'
                              ? 'Pratinjau Laporan Laba Rugi Proforma (SAK EMKM)'
                              : 'Proforma Income Statement (IFRS / SME Standard)')}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {startDate} s/d {endDate}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col gap-2.5 font-mono text-xs">
                    {/* 1. Revenue / Income */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans">
                      <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        {isPersonal
                          ? (language === 'id'
                              ? 'Target Pemasukan & Gaji'
                              : 'Target Inflow & Income')
                          : (language === 'id'
                              ? 'Proyeksi Pendapatan Penjualan (Omzet)'
                              : 'Gross Revenue (Sales)')}
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        {formatRupiah(totals.totalRevenue)}
                      </span>
                    </div>

                    {/* 2. COGS / Essentials */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                      <span>
                        (-) {isPersonal
                          ? (language === 'id' ? 'Kebutuhan Pokok Hidup (Dapur & Sembako)' : 'Essential Living Expenses')
                          : (language === 'id' ? 'Beban Pokok Pendapatan (HPP)' : 'Cost of Goods Sold (COGS)')}
                      </span>
                      <span className="font-bold text-rose-600">
                        ({formatRupiah(totals.totalCOGS)})
                      </span>
                    </div>

                    {/* 3. Gross Profit / Balance After Needs */}
                    <div className="flex items-center justify-between py-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
                      <span className="font-black text-emerald-950 dark:text-emerald-200">
                        (=) {isPersonal
                          ? (language === 'id' ? 'SISA KAS SETELAH KEBUTUHAN POKOK' : 'BALANCE AFTER ESSENTIALS')
                          : (language === 'id' ? 'PROYEKSI LABA KOTOR (Gross Profit)' : 'GROSS PROFIT')}
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        {formatRupiah(totals.grossProfit)}{' '}
                        <span className="text-[10px] font-bold">
                          ({totals.grossMarginPercent.toFixed(1)}%)
                        </span>
                      </span>
                    </div>

                    {/* 4. OPEX / Family Bills */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                      <span>
                        (-) {isPersonal
                          ? (language === 'id' ? 'Biaya Hidup Rutin, Tagihan & Transport' : 'Lifestyle & Recurring Overhead')
                          : (language === 'id' ? 'Total Beban Operasional Usaha (OPEX)' : 'Operating Expenses (OPEX)')}
                      </span>
                      <span className="font-bold text-indigo-600">
                        ({formatRupiah(totals.totalOPEX)})
                      </span>
                    </div>

                    {/* 5. Operating Income (EBIT) / Net Cash After Bills */}
                    <div className="flex items-center justify-between py-2 bg-blue-50 dark:bg-blue-950/40 px-3 rounded-xl border border-blue-200 dark:border-blue-800 font-sans">
                      <span className="font-black text-blue-950 dark:text-blue-200">
                        (=) {isPersonal
                          ? (language === 'id' ? 'SISA DANA BEBAS (Cash Surplus)' : 'NET OPERATING SURPLUS')
                          : (language === 'id' ? 'PROYEKSI LABA OPERASIONAL (EBIT)' : 'OPERATING PROFIT (EBIT)')}
                      </span>
                      <span className="font-black text-blue-700 dark:text-blue-300 text-sm">
                        {formatRupiah(totals.operatingIncome)}{' '}
                        <span className="text-[10px] font-bold">
                          ({totals.operatingMarginPercent.toFixed(1)}%)
                        </span>
                      </span>
                    </div>

                    {/* 6. Capex, Prive & Tax / Savings & Investments */}
                    {totals.totalCapexEquity > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                        <span>
                          (-) {isPersonal
                            ? (language === 'id' ? 'Alokasi Tabungan, Investasi & Sedekah' : 'Savings & Investments')
                            : (language === 'id' ? 'Belanja Modal (Aset), Prive & Pajak' : 'Capex, Drawings & Tax')}
                        </span>
                        <span className="font-bold text-purple-600">
                          ({formatRupiah(totals.totalCapexEquity)})
                        </span>
                      </div>
                    )}

                    {/* 7. Debt & Receivables / Loan Installments */}
                    {totals.totalDebtReceivable > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                        <span>
                          (-) {isPersonal
                            ? (language === 'id' ? 'Cicilan Utang, KPR & Pinjaman' : 'Debt Repayments & Installments')
                            : (language === 'id' ? 'Cicilan Utang & Pelunasan Pinjaman' : 'Debt Repayments & Financing')}
                        </span>
                        <span className="font-bold text-amber-600">
                          ({formatRupiah(totals.totalDebtReceivable)})
                        </span>
                      </div>
                    )}

                    {/* 8. Net Balance */}
                    <div
                      className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl border font-sans ${
                        totals.netEstimatedRemaining >= 0
                          ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md'
                          : 'bg-linear-to-r from-rose-600 to-red-700 text-white border-rose-600 shadow-md'
                      }`}
                    >
                      <div>
                        <span className="font-black text-xs block uppercase tracking-wide">
                          {isPersonal
                            ? (language === 'id'
                                ? 'ESTIMASI SALDO BERSIH BULANAN'
                                : 'ESTIMATED NET MONTHLY SAVINGS')
                            : (language === 'id'
                                ? 'ESTIMASI ARUS KAS BERSIH / SISA SALDO LABA'
                                : 'ESTIMATED NET SURPLUS / CASHFLOW')}
                        </span>
                        <span className="text-[10px] text-white/80">
                          {totals.netEstimatedRemaining >= 0
                            ? language === 'id'
                              ? 'Rencana Anggaran Sehat & Menguntungkan (Surplus)'
                              : 'Healthy & Profitable Plan'
                            : language === 'id'
                            ? 'Perhatian: Rencana Mengalami Defisit!'
                            : 'Warning: Deficit budget plan'}
                        </span>
                      </div>

                      <span className="text-base sm:text-lg font-black tracking-tight">
                        {formatRupiah(totals.netEstimatedRemaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FULL PDF REPORT DOWNLOAD BAR IN STEP 5 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        {language === 'id' ? 'Laporan PDF Lengkap & Resume' : 'Full PDF Report & Executive Resume'}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'id'
                          ? 'Unduh atau cetak laporan anggaran terstruktur lengkap beserta rincian sub-total, jadwal tanggal, dan resume eksekutif.'
                          : 'Download or print comprehensive budget statement with schedules, sub-totals and executive summary.'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full sm:w-auto py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'id' ? 'Unduh Laporan PDF' : 'Download PDF Report'}</span>
                  </button>
                </div>

                {/* CONTRACT & AHSP DOWNLOAD BAR IN STEP 5 (ONLY FOR PROJECT BUDGETS) */}
                {!isPersonal && isProjectBudget && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                      <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <strong className="block">Dokumen Salinan Kontrak & AHSP</strong>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300">
                          Unduh berkas salinan lengkap kontrak proyek beserta rincian analisa harga satuan dan dasar perhitungannya.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadCurrentContractCopy}
                      className="w-full sm:w-auto py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Salinan Kontrak (.txt)</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'id' ? 'Kembali' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className={`py-2.5 px-5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  isPersonal ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>
                  {currentStep === 1
                    ? isPersonal
                      ? (language === 'id' ? 'Lanjut ke Aset Pribadi →' : 'Next: Personal Assets →')
                      : (language === 'id' ? 'Lanjut ke Inventori & Modal →' : 'Next: Inventory & Capital →')
                    : currentStep === 2
                    ? isPersonal
                      ? (language === 'id' ? 'Lanjut ke 1. Pemasukan (Gaji) →' : 'Next: 1. Inflow & Income →')
                      : (language === 'id' ? 'Lanjut ke 1. Target Pendapatan →' : 'Next: 1. Revenue Target →')
                    : currentStep === 3
                    ? isPersonal
                      ? (language === 'id' ? 'Lanjut ke 2. Kebutuhan Pokok →' : 'Next: 2. Essential Living Needs →')
                      : (language === 'id' ? 'Lanjut ke 2. Beban Pokok (HPP) →' : 'Next: 2. COGS (Direct Costs) →')
                    : currentStep === 4
                    ? isPersonal
                      ? (language === 'id' ? 'Lanjut ke 3. Biaya Hidup & Tagihan →' : 'Next: 3. Lifestyle & Bills →')
                      : (language === 'id' ? 'Lanjut ke 3. Beban Operasional (OPEX) →' : 'Next: 3. OPEX & Overhead →')
                    : isPersonal
                    ? (language === 'id' ? 'Lanjut ke 4. Ringkasan & Tabungan →' : 'Next: 4. Summary & Savings →')
                    : (language === 'id' ? 'Lanjut ke 4. Ringkasan Laporan →' : 'Next: 4. Proforma Summary →')}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSave}
                className={`py-2.5 px-6 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                  isPersonal
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isPersonal
                    ? language === 'id'
                      ? 'Simpan & Terapkan Anggaran Pribadi'
                      : 'Save & Apply Personal Budget'
                    : language === 'id'
                    ? 'Simpan & Terapkan Anggaran Usaha'
                    : 'Save & Apply Business Budget'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SAMPLE REPORT & STEP GUIDE MODAL (PDF) */}
      {isGuideModalOpen && (
        <BudgetGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          mode={isPersonal ? 'personal' : 'business'}
          initialMonth={startDate ? new Date(startDate).getMonth() : new Date().getMonth()}
          initialYear={startDate ? new Date(startDate).getFullYear() : 2026}
          onUseTemplate={(tmplId, targetMonth, targetYear) => {
            setIsGuideModalOpen(false);
            if (targetMonth !== undefined && targetYear !== undefined) {
              const daysInM = new Date(targetYear, targetMonth + 1, 0).getDate();
              const newStart = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
              const newEnd = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(daysInM).padStart(2, '0')}`;
              setStartDate(newStart);
              setEndDate(newEnd);
              applyTemplate(tmplId, newStart, newEnd);
            } else {
              applyTemplate(tmplId);
            }
          }}
        />
      )}

      {/* CONTRACT & AHSP (ANALISA HARGA SATUAN PEKERJAAN) MODAL */}
      {isAhspModalOpen && targetAhspItem && (
        <ContractAhspModal
          isOpen={isAhspModalOpen}
          onClose={() => {
            setIsAhspModalOpen(false);
            setAhspTargetItemId(null);
          }}
          initialItemName={targetAhspItem.custom_name}
          initialQty={targetAhspItem.qty || '1'}
          initialUnit={targetAhspItem.unit || 'ls'}
          initialUnitPrice={targetAhspItem.unit_price || ''}
          initialPlannedAmount={targetAhspItem.planned_amount}
          categorySection={targetAhspItem.section}
          onApply={handleApplyAhspResult}
        />
      )}

      {/* CONTRACT AI ANALYSIS MODAL */}
      {isContractAnalysisOpen && (
        <ContractAnalysisModal
          isOpen={isContractAnalysisOpen}
          onClose={() => setIsContractAnalysisOpen(false)}
          onApplyToWizard={handleApplyContractData}
          language={language}
        />
      )}

      {/* SAVED CONTRACT ARCHIVES DATABASE MODAL */}
      {isSavedContractsOpen && (
        <SavedContractArchivesModal
          isOpen={isSavedContractsOpen}
          onClose={() => setIsSavedContractsOpen(false)}
          onSelectContract={handleApplyContractData}
          language={language}
        />
      )}

      {/* INVENTORY & RUNNING CAPITAL MODAL */}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          mode={budgetMode}
          businessType={selectedTemplateId}
          businessTitle={activeSelectedTemplate?.name || budgetName}
          initialAction={inventoryModalAction}
        />
      )}
    </div>
  );
};
