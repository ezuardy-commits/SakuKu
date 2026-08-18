import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Budget, BudgetItem, Category, ModeType, Transaction } from '../types';
import { formatRupiah, formatAmountInput, parseAmountNumber } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { useLanguage, getCategoryDisplayName, getBudgetDisplayName } from '../context/LanguageContext';
import { playBellChimeSound } from '../lib/audio';
import { db } from '../lib/db';
import { BusinessBudgetWizard } from './BusinessBudgetWizard';
import { BudgetGuideModal } from './BudgetGuideModal';
import { InventoryModal } from './InventoryModal';
import { motion, AnimatePresence } from 'motion/react';
import {
  WalletCards,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  User,
  Store,
  Layers,
  Sparkles,
  Package,
  X,
  Target,
  PieChart,
  HelpCircle,
  Bell,
  BellRing,
  Clock,
  Calendar,
  Volume2,
  Check,
  RotateCcw,
  Edit3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Download,
  Printer,
  FileText,
  Building2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DynamicItemRow {
  input_mode?: 'dropdown' | 'manual';
  category_id: string;
  custom_name?: string;
  item_type?: 'expense' | 'income';
  qty?: string;
  unit_price?: string;
  planned_amount: string;
  reminder_enabled?: boolean;
  reminder_date?: string;
  reminder_note?: string;
}

interface BudgetViewProps {
  budgets: Budget[];
  budgetItems: BudgetItem[];
  categories: Category[];
  transactions: Transaction[];
  activeMode: 'all' | ModeType;
  onCreateBudget: (
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => void;
  onUpdateBudget?: (
    id: string,
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => void;
  onSaveCategory?: (category: Category) => void;
  onUpdateBudgetItem?: (item: BudgetItem) => void;
  onDeleteBudget: (id: string) => void;
}

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

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  budgetItems,
  categories,
  transactions,
  activeMode,
  onCreateBudget,
  onUpdateBudget,
  onSaveCategory,
  onUpdateBudgetItem,
  onDeleteBudget,
}) => {
  const { language, t, getBudgetDisplayName } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetMode, setBudgetMode] = useState<ModeType>('business');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

  // 12-Month Continuous Budget Navigation State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | 'all'>(now.getMonth());
  const [selectedBudgetYear, setSelectedBudgetYear] = useState<number>(now.getFullYear() || 2026);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [detailModal, setDetailModal] = useState<{ budget: Budget; type: 'income' | 'expense' } | null>(null);

  // Edit budget modal state & accordion expanded IDs
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [expandedBudgetIds, setExpandedBudgetIds] = useState<string[]>([]);
  const [menuOpenBudgetId, setMenuOpenBudgetId] = useState<string | null>(null);

  // Edit Reminder Modal State for an existing budget item
  const [selectedItemForReminder, setSelectedItemForReminder] = useState<BudgetItem | null>(null);
  const [reminderEnabledInput, setReminderEnabledInput] = useState(false);
  const [reminderDateInput, setReminderDateInput] = useState(todayStr);
  const [reminderNoteInput, setReminderNoteInput] = useState('');

  // Due Date & Reminder Hub State
  const [isReminderHubExpanded, setIsReminderHubExpanded] = useState<boolean>(true);

  // State for budget item type filter (Expense vs Income vs All)
  const [budgetCategoryType, setBudgetCategoryType] = useState<'expense' | 'income' | 'all'>('expense');

  // Business Budget Step-by-Step Wizard State
  const [isBusinessWizardOpen, setIsBusinessWizardOpen] = useState(false);
  const [wizardLockMode, setWizardLockMode] = useState<'personal' | 'business' | undefined>(undefined);
  const [wizardEditingBudget, setWizardEditingBudget] = useState<Budget | null>(null);
  const [wizardEditingItems, setWizardEditingItems] = useState<BudgetItem[]>([]);

  // Guide & Sample Report Modal State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideModalMode, setGuideModalMode] = useState<'personal' | 'business'>('personal');

  // Inventory & Running Capital Modal State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  // Flexible Dynamic Items State: Array of DynamicItemRow
  const [dynamicItems, setDynamicItems] = useState<DynamicItemRow[]>([
    {
      input_mode: 'dropdown',
      category_id: categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '',
      custom_name: '',
      qty: '1',
      unit_price: '',
      planned_amount: '',
      reminder_enabled: false,
      reminder_date: defaultEnd,
      reminder_note: '',
    },
  ]);

  const lastRowRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToNewRow, setShouldScrollToNewRow] = useState(false);

  useEffect(() => {
    if (shouldScrollToNewRow && lastRowRef.current) {
      lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusTarget = lastRowRef.current.querySelector('input, select') as HTMLElement | null;
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 150);
      }
      setShouldScrollToNewRow(false);
    }
  }, [dynamicItems, shouldScrollToNewRow]);

  // Filter budgets based on active mode and selected month/year
  const filteredBudgets = useMemo(() => {
    const byMode = budgets.filter((b) =>
      activeMode === 'all' ? true : b.mode === activeMode || b.mode === 'all'
    );

    if (selectedMonthIndex === 'all') {
      return byMode;
    }

    const padM = String(selectedMonthIndex + 1).padStart(2, '0');
    const targetPrefix = `${selectedBudgetYear}-${padM}`;

    const daysInTarget = new Date(selectedBudgetYear, selectedMonthIndex + 1, 0).getDate();
    const targetStart = `${selectedBudgetYear}-${padM}-01`;
    const targetEnd = `${selectedBudgetYear}-${padM}-${String(daysInTarget).padStart(2, '0')}`;

    return byMode.filter((b) => {
      if (!b.start_date || !b.end_date) return true;
      if (b.start_date.startsWith(targetPrefix)) return true;
      return b.start_date <= targetEnd && b.end_date >= targetStart;
    });
  }, [budgets, activeMode, selectedMonthIndex, selectedBudgetYear]);

  // Switch budget item type filter
  const handleTypeFilterChange = (typeVal: 'expense' | 'income' | 'all') => {
    setBudgetCategoryType(typeVal);
    if (typeVal !== 'all') {
      const validCats = categories.filter((c) => c.type === typeVal);
      if (validCats.length > 0) {
        setDynamicItems((prev) =>
          prev.map((row) => {
            const currentCat = categories.find((c) => c.id === row.category_id);
            if (currentCat && currentCat.type !== typeVal && row.input_mode !== 'manual') {
              return { ...row, category_id: validCats[0].id };
            }
            return row;
          })
        );
      }
    }
  };

  // Pre-fill button: Loads categories based on selected budget type into dynamic rows
  const handleAutoFillCategories = () => {
    const targetCats = categories.filter((c) =>
      budgetCategoryType === 'all' ? true : c.type === budgetCategoryType
    );
    if (targetCats.length === 0) return;
    setDynamicItems(
      targetCats.map((cat, idx) => {
        const prevMatch = getPreviousItemMatch(idx, 'dropdown', cat.id, undefined);
        return {
          input_mode: 'dropdown',
          category_id: cat.id,
          custom_name: '',
          qty: prevMatch ? prevMatch.qty : '1',
          unit_price: prevMatch ? prevMatch.unit_price : '',
          planned_amount: prevMatch ? prevMatch.planned_amount : '',
          reminder_enabled: false,
          reminder_date: endDate,
          reminder_note: '',
        };
      })
    );
  };

  // Helper to find previously filled values (qty, unit_price, planned_amount) for a given item name or category
  const getPreviousItemMatch = (
    currentIndex: number,
    mode: 'dropdown' | 'manual',
    catId?: string,
    customName?: string
  ): { qty: string; unit_price: string; planned_amount: string } | null => {
    const normCustomName = customName ? customName.trim().toLowerCase() : '';

    // 1. Search in other rows of dynamicItems
    for (let i = 0; i < dynamicItems.length; i++) {
      if (i === currentIndex) continue;
      const row = dynamicItems[i];

      const hasValues =
        (row.planned_amount && row.planned_amount !== '' && row.planned_amount !== '0') ||
        (row.unit_price && row.unit_price !== '' && row.unit_price !== '0');
      if (!hasValues) continue;

      let isMatch = false;

      if (mode === 'dropdown' && catId) {
        if (row.input_mode !== 'manual' && row.category_id === catId) {
          isMatch = true;
        } else if (row.input_mode === 'manual' && row.custom_name) {
          const selectedCat = categories.find((c) => c.id === catId);
          if (selectedCat) {
            const catDisplayName = getCategoryDisplayName(selectedCat.name, language).trim().toLowerCase();
            if (catDisplayName === row.custom_name.trim().toLowerCase()) {
              isMatch = true;
            }
          }
        }
      } else if (mode === 'manual' && normCustomName !== '') {
        if (row.input_mode === 'manual' && row.custom_name) {
          if (row.custom_name.trim().toLowerCase() === normCustomName) {
            isMatch = true;
          }
        } else if (row.input_mode !== 'manual' && row.category_id) {
          const rowCat = categories.find((c) => c.id === row.category_id);
          if (rowCat) {
            const rowCatDisplayName = getCategoryDisplayName(rowCat.name, language).trim().toLowerCase();
            if (rowCatDisplayName === normCustomName) {
              isMatch = true;
            }
          }
        }
      }

      if (isMatch) {
        return {
          qty: row.qty || '1',
          unit_price: row.unit_price || '',
          planned_amount: row.planned_amount || '',
        };
      }
    }

    // 2. Search in historical budgetItems
    if (mode === 'dropdown' && catId) {
      const existingBudgetItem = budgetItems.find((b) => b.category_id === catId && b.planned_amount > 0);
      if (existingBudgetItem) {
        let qtyStr = '1';
        let unitPriceStr = formatAmountInput(existingBudgetItem.planned_amount);
        const note = existingBudgetItem.reminder_note || '';
        const match = note.match(/(\d+)x\s*@\s*Rp?\s*([\d\.,]+)/i);
        if (match) {
          qtyStr = match[1];
          unitPriceStr = formatAmountInput(parseAmountNumber(match[2]));
        }
        return {
          qty: qtyStr,
          unit_price: unitPriceStr,
          planned_amount: formatAmountInput(existingBudgetItem.planned_amount),
        };
      }
    } else if (mode === 'manual' && normCustomName !== '') {
      const matchedCategory = categories.find(
        (c) => getCategoryDisplayName(c.name, language).trim().toLowerCase() === normCustomName
      );
      if (matchedCategory) {
        const existingBudgetItem = budgetItems.find((b) => b.category_id === matchedCategory.id && b.planned_amount > 0);
        if (existingBudgetItem) {
          let qtyStr = '1';
          let unitPriceStr = formatAmountInput(existingBudgetItem.planned_amount);
          const note = existingBudgetItem.reminder_note || '';
          const match = note.match(/(\d+)x\s*@\s*Rp?\s*([\d\.,]+)/i);
          if (match) {
            qtyStr = match[1];
            unitPriceStr = formatAmountInput(parseAmountNumber(match[2]));
          }
          return {
            qty: qtyStr,
            unit_price: unitPriceStr,
            planned_amount: formatAmountInput(existingBudgetItem.planned_amount),
          };
        }
      }
    }

    // 3. Search in transactions
    if (mode === 'dropdown' && catId) {
      const lastTx = transactions.find((t) => t.category_id === catId && t.amount > 0);
      if (lastTx) {
        return {
          qty: '1',
          unit_price: formatAmountInput(lastTx.amount),
          planned_amount: formatAmountInput(lastTx.amount),
        };
      }
    } else if (mode === 'manual' && normCustomName !== '') {
      const lastTx = transactions.find(
        (t) => t.description && t.description.toLowerCase().includes(normCustomName) && t.amount > 0
      );
      if (lastTx) {
        return {
          qty: '1',
          unit_price: formatAmountInput(lastTx.amount),
          planned_amount: formatAmountInput(lastTx.amount),
        };
      }
    }

    return null;
  };

  // Add a new empty budget line
  const handleAddRow = () => {
    const defaultType = budgetCategoryType === 'income' ? 'income' : 'expense';
    const availableCats = categories.filter((c) => c.type === defaultType);
    const unusedCat = availableCats.find(
      (c) => !dynamicItems.some((item) => item.category_id === c.id)
    );
    const defaultCatId = unusedCat?.id || availableCats[0]?.id || categories[0]?.id || '';

    const newRow: DynamicItemRow = {
      input_mode: 'dropdown',
      category_id: defaultCatId,
      custom_name: '',
      item_type: defaultType,
      qty: '1',
      unit_price: '',
      planned_amount: '',
      reminder_enabled: false,
      reminder_date: endDate,
      reminder_note: '',
    };

    const prevMatch = getPreviousItemMatch(dynamicItems.length, 'dropdown', defaultCatId, undefined);
    if (prevMatch) {
      newRow.qty = prevMatch.qty;
      newRow.unit_price = prevMatch.unit_price;
      newRow.planned_amount = prevMatch.planned_amount;
    }

    setDynamicItems([...dynamicItems, newRow]);
    setShouldScrollToNewRow(true);
  };

  // Remove a budget line
  const handleRemoveRow = (index: number) => {
    setDynamicItems(dynamicItems.filter((_, idx) => idx !== index));
  };

  // Toggle input mode (dropdown vs manual) for a row
  const handleRowInputModeToggle = (index: number, mode: 'dropdown' | 'manual') => {
    const updated = [...dynamicItems];
    updated[index].input_mode = mode;

    if (mode === 'dropdown' && updated[index].category_id) {
      const prevMatch = getPreviousItemMatch(index, 'dropdown', updated[index].category_id, undefined);
      if (prevMatch) {
        updated[index].qty = prevMatch.qty;
        updated[index].unit_price = prevMatch.unit_price;
        updated[index].planned_amount = prevMatch.planned_amount;
      }
    } else if (mode === 'manual' && updated[index].custom_name) {
      const prevMatch = getPreviousItemMatch(index, 'manual', undefined, updated[index].custom_name);
      if (prevMatch) {
        updated[index].qty = prevMatch.qty;
        updated[index].unit_price = prevMatch.unit_price;
        updated[index].planned_amount = prevMatch.planned_amount;
      }
    }

    setDynamicItems(updated);
  };

  // Handle custom name change
  const handleCustomNameChange = (index: number, nameVal: string) => {
    const updated = [...dynamicItems];
    updated[index].custom_name = nameVal;

    if (nameVal.trim().length >= 2) {
      const prevMatch = getPreviousItemMatch(index, 'manual', undefined, nameVal);
      if (prevMatch) {
        updated[index].qty = prevMatch.qty;
        updated[index].unit_price = prevMatch.unit_price;
        updated[index].planned_amount = prevMatch.planned_amount;
      }
    }

    setDynamicItems(updated);
  };

  // Toggle item type (expense vs income) for a row
  const handleRowItemTypeChange = (index: number, newType: 'expense' | 'income') => {
    const updated = [...dynamicItems];
    updated[index].item_type = newType;
    if (updated[index].input_mode !== 'manual') {
      const validCats = categories.filter((c) => c.type === newType);
      const currentCat = categories.find((c) => c.id === updated[index].category_id);
      if (!currentCat || currentCat.type !== newType) {
        if (validCats.length > 0) {
          updated[index].category_id = validCats[0].id;
          const prevMatch = getPreviousItemMatch(index, 'dropdown', validCats[0].id, undefined);
          if (prevMatch) {
            updated[index].qty = prevMatch.qty;
            updated[index].unit_price = prevMatch.unit_price;
            updated[index].planned_amount = prevMatch.planned_amount;
          }
        }
      }
    }
    setDynamicItems(updated);
  };

  // Handle row category change
  const handleCategoryChange = (index: number, newCatId: string) => {
    const updated = [...dynamicItems];
    updated[index].category_id = newCatId;
    const matchedCat = categories.find((c) => c.id === newCatId);
    if (matchedCat) {
      updated[index].item_type = matchedCat.type;
    }

    const prevMatch = getPreviousItemMatch(index, 'dropdown', newCatId, undefined);
    if (prevMatch) {
      updated[index].qty = prevMatch.qty;
      updated[index].unit_price = prevMatch.unit_price;
      updated[index].planned_amount = prevMatch.planned_amount;
    }

    setDynamicItems(updated);
  };

  // Handle row qty change
  const handleQtyChange = (index: number, val: string) => {
    const updated = [...dynamicItems];
    const qtyVal = val.replace(/\D/g, '');
    updated[index].qty = qtyVal;

    const qtyNum = parseInt(qtyVal, 10) || 1;
    const priceNum = parseAmountNumber(updated[index].unit_price);
    if (priceNum > 0) {
      updated[index].planned_amount = formatAmountInput(qtyNum * priceNum);
    } else {
      const totalNum = parseAmountNumber(updated[index].planned_amount);
      if (totalNum > 0 && qtyNum > 0) {
        updated[index].unit_price = formatAmountInput(Math.round(totalNum / qtyNum));
      }
    }
    setDynamicItems(updated);
  };

  // Handle row unit price change
  const handleUnitPriceChange = (index: number, val: string) => {
    const formattedPrice = formatAmountInput(val);
    const updated = [...dynamicItems];
    updated[index].unit_price = formattedPrice;

    const qtyNum = parseInt(updated[index].qty || '1', 10) || 1;
    const priceNum = parseAmountNumber(val);
    updated[index].planned_amount = formatAmountInput(qtyNum * priceNum);
    setDynamicItems(updated);
  };

  // Handle row amount (total price) change
  const handleAmountChange = (index: number, val: string) => {
    const formatted = formatAmountInput(val);
    const updated = [...dynamicItems];
    updated[index].planned_amount = formatted;

    const totalNum = parseAmountNumber(val);
    const qtyNum = parseInt(updated[index].qty || '1', 10) || 1;
    if (qtyNum > 0 && totalNum > 0) {
      updated[index].unit_price = formatAmountInput(Math.round(totalNum / qtyNum));
    }
    setDynamicItems(updated);
  };

  // Handle row reminder toggle/data change
  const handleToggleRowReminder = (index: number) => {
    const updated = [...dynamicItems];
    updated[index].reminder_enabled = !updated[index].reminder_enabled;
    if (!updated[index].reminder_date) {
      updated[index].reminder_date = endDate;
    }
    setDynamicItems(updated);
  };

  const handleRowReminderDateChange = (index: number, dateVal: string) => {
    const updated = [...dynamicItems];
    updated[index].reminder_date = dateVal;
    setDynamicItems(updated);
  };

  const handleRowReminderNoteChange = (index: number, noteVal: string) => {
    const updated = [...dynamicItems];
    updated[index].reminder_note = noteVal;
    setDynamicItems(updated);
  };

  const handleOpenBusinessWizard = (budgetToEdit?: Budget, lockMode?: 'personal' | 'business') => {
    setWizardLockMode(
      lockMode || (budgetToEdit ? (budgetToEdit.mode === 'personal' ? 'personal' : 'business') : undefined)
    );
    if (budgetToEdit) {
      setWizardEditingBudget(budgetToEdit);
      setWizardEditingItems(budgetItems.filter((bi) => bi.budget_id === budgetToEdit.id));
    } else {
      setWizardEditingBudget(null);
      setWizardEditingItems([]);
    }
    setMenuOpenBudgetId(null);
    setIsBusinessWizardOpen(true);
  };

  const handleOpenGuideModal = (mode: 'personal' | 'business') => {
    setGuideModalMode(mode);
    setIsGuideModalOpen(true);
  };

  const handleOpenCreateFlexibleModal = (targetMode?: ModeType) => {
    setEditingBudgetId(null);
    const activeMIdx = selectedMonthIndex === 'all' ? now.getMonth() : selectedMonthIndex;
    const activeYr = selectedBudgetYear;
    const currentMonthStr = `${MONTH_NAMES_ID[activeMIdx]} ${activeYr}`;
    const daysInM = new Date(activeYr, activeMIdx + 1, 0).getDate();
    const activeStart = `${activeYr}-${String(activeMIdx + 1).padStart(2, '0')}-01`;
    const activeEnd = `${activeYr}-${String(activeMIdx + 1).padStart(2, '0')}-${String(daysInM).padStart(2, '0')}`;

    const chosenMode = targetMode || (activeMode === 'all' ? 'business' : activeMode);
    setBudgetName(
      language === 'id'
        ? `${chosenMode === 'personal' ? 'Anggaran Pribadi' : 'Anggaran Usaha'} ${currentMonthStr}`
        : `${chosenMode === 'personal' ? 'Personal Budget' : 'Business Budget'} ${currentMonthStr}`
    );
    setStartDate(activeStart);
    setEndDate(activeEnd);
    setBudgetMode(chosenMode);
    setDynamicItems([
      {
        input_mode: 'dropdown',
        category_id: categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '',
        custom_name: '',
        item_type: 'expense',
        qty: '1',
        unit_price: '',
        planned_amount: '',
        reminder_enabled: false,
        reminder_date: activeEnd,
        reminder_note: '',
      },
    ]);
    setIsModalOpen(true);
  };

  const handleWizardSave = (
    budgetData: Omit<Budget, 'id'>,
    itemsToCreate: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ) => {
    if (wizardEditingBudget && onUpdateBudget) {
      onUpdateBudget(wizardEditingBudget.id, budgetData, itemsToCreate);
    } else {
      if (wizardEditingBudget) {
        onDeleteBudget(wizardEditingBudget.id);
      }
      onCreateBudget(budgetData, itemsToCreate);
    }
    setIsBusinessWizardOpen(false);
    setWizardEditingBudget(null);
    setWizardEditingItems([]);
  };

  const handleOpenCreateModal = () => {
    setEditingBudgetId(null);
    const activeMIdx = selectedMonthIndex === 'all' ? now.getMonth() : selectedMonthIndex;
    const activeYr = selectedBudgetYear;
    const currentMonthStr = `${MONTH_NAMES_ID[activeMIdx]} ${activeYr}`;
    const daysInM = new Date(activeYr, activeMIdx + 1, 0).getDate();
    const activeStart = `${activeYr}-${String(activeMIdx + 1).padStart(2, '0')}-01`;
    const activeEnd = `${activeYr}-${String(activeMIdx + 1).padStart(2, '0')}-${String(daysInM).padStart(2, '0')}`;

    setBudgetName(`${language === 'id' ? 'Anggaran' : 'Budget'} ${currentMonthStr}`);
    setStartDate(activeStart);
    setEndDate(activeEnd);
    setBudgetMode(activeMode === 'all' ? 'business' : activeMode);
    setDynamicItems([
      {
        input_mode: 'dropdown',
        category_id: categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '',
        custom_name: '',
        item_type: 'expense',
        qty: '1',
        unit_price: '',
        planned_amount: '',
        reminder_enabled: false,
        reminder_date: activeEnd,
        reminder_note: '',
      },
    ]);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setBudgetName(budget.name);
    setStartDate(budget.start_date);
    setEndDate(budget.end_date);
    setBudgetMode(budget.mode);

    const items = budgetItems.filter((bi) => bi.budget_id === budget.id);
    if (items.length > 0) {
      setDynamicItems(
        items.map((item) => {
          let qtyStr = '1';
          let unitPriceStr = formatAmountInput(item.planned_amount);
          let noteStr = item.reminder_note || '';

          const match = noteStr.match(/(\d+)x\s*@\s*Rp?\s*([\d\.,]+)/i);
          if (match) {
            qtyStr = match[1];
            unitPriceStr = formatAmountInput(parseAmountNumber(match[2]));
            noteStr = noteStr.replace(/\(\d+x\s*@\s*Rp?\s*[\d\.,]+\)/i, '').trim();
          }

          const cat = categories.find((c) => c.id === item.category_id);

          return {
            input_mode: 'dropdown',
            category_id: item.category_id,
            custom_name: cat ? getCategoryDisplayName(cat.name, language) : '',
            item_type: cat?.type || 'expense',
            qty: qtyStr,
            unit_price: unitPriceStr,
            planned_amount: formatAmountInput(item.planned_amount),
            reminder_enabled: item.reminder_enabled || false,
            reminder_date: item.reminder_date || budget.end_date,
            reminder_note: noteStr,
          };
        })
      );
    }
    setMenuOpenBudgetId(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName.trim()) {
      alert(language === 'id' ? 'Masukkan nama perencanaan anggaran.' : 'Please enter budget plan name.');
      return;
    }

    const itemsToCreate: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[] = [];

    for (const item of dynamicItems) {
      const pAmount = parseAmountNumber(item.planned_amount);
      if (pAmount <= 0) continue;

      const rowType = item.item_type || categories.find((c) => c.id === item.category_id)?.type || 'expense';
      let finalCatId = item.category_id;

      // Check if user entered manual name or typed custom category
      const rawName = (item.custom_name || '').trim();
      if (item.input_mode === 'manual' || rawName) {
        if (rawName) {
          // Check if category with matching type and name already exists
          const matched = categories.find(
            (c) =>
              c.type === rowType &&
              (c.name.toLowerCase() === rawName.toLowerCase() ||
                getCategoryDisplayName(c.name, language).toLowerCase() === rawName.toLowerCase())
          );

          if (matched) {
            finalCatId = matched.id;
          } else {
            // Save new custom category to database & refresh state with EXACT rowType
            const isIncome = rowType === 'income';
            const newCat: Category = {
              id: `cat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: rawName,
              type: rowType,
              icon: isIncome ? 'TrendingUp' : 'Tag',
              color: isIncome ? '#10b981' : '#6366f1',
            };
            db.saveCategory(newCat);
            if (onSaveCategory) {
              onSaveCategory(newCat);
            }
            finalCatId = newCat.id;
          }
        }
      } else {
        // Dropdown mode: ensure selected category matches rowType
        const currentCat = categories.find((c) => c.id === item.category_id);
        if (!currentCat || currentCat.type !== rowType) {
          const validCat = categories.find((c) => c.type === rowType);
          if (validCat) {
            finalCatId = validCat.id;
          }
        }
      }

      if (finalCatId) {
        let note = item.reminder_note || '';
        const qtyNum = parseInt(item.qty || '1', 10) || 1;
        const unitPriceNum = parseAmountNumber(item.unit_price);
        if (qtyNum > 1 || unitPriceNum > 0) {
          const detailStr = `${qtyNum}x @ ${formatRupiah(unitPriceNum > 0 ? unitPriceNum : Math.round(pAmount / qtyNum))}`;
          note = note ? `${note} (${detailStr})` : detailStr;
        }

        itemsToCreate.push({
          category_id: finalCatId,
          planned_amount: pAmount,
          reminder_enabled: item.reminder_enabled || false,
          reminder_date: item.reminder_date || endDate,
          reminder_note: note,
        });
      }
    }

    if (itemsToCreate.length === 0) {
      alert(language === 'id' ? 'Isi rencana anggaran minimal Rp 1 untuk setidaknya 1 pos kategori.' : 'Enter at least 1 budget amount.');
      return;
    }

    const totalPlanned = itemsToCreate.reduce((sum, i) => sum + i.planned_amount, 0);

    if (editingBudgetId && onUpdateBudget) {
      onUpdateBudget(
        editingBudgetId,
        {
          name: budgetName,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalPlanned,
          mode: budgetMode,
          status: 'active',
        },
        itemsToCreate
      );
    } else {
      if (editingBudgetId) {
        onDeleteBudget(editingBudgetId);
      }
      onCreateBudget(
        {
          name: budgetName,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalPlanned,
          mode: budgetMode,
          status: 'active',
        },
        itemsToCreate
      );
    }

    // Play ringing bell if any reminder was enabled on creation!
    if (itemsToCreate.some((i) => i.reminder_enabled)) {
      playBellChimeSound();
    }

    setIsModalOpen(false);
    setEditingBudgetId(null);
    setBudgetName('');
    setDynamicItems([
      {
        input_mode: 'dropdown',
        category_id: categories[0]?.id || '',
        custom_name: '',
        planned_amount: '',
        reminder_enabled: false,
        reminder_date: defaultEnd,
        reminder_note: '',
      },
    ]);
  };

  // Open item reminder edit modal
  const handleOpenItemReminderModal = (item: BudgetItem) => {
    setSelectedItemForReminder(item);
    setReminderEnabledInput(item.reminder_enabled || false);
    setReminderDateInput(item.reminder_date || todayStr);
    setReminderNoteInput(item.reminder_note || '');
  };

  // Save item reminder edit
  const handleSaveItemReminder = () => {
    if (!selectedItemForReminder || !onUpdateBudgetItem) return;

    const updatedItem: BudgetItem = {
      ...selectedItemForReminder,
      reminder_enabled: reminderEnabledInput,
      reminder_date: reminderDateInput,
      reminder_note: reminderNoteInput,
      reminder_status: reminderEnabledInput ? 'pending' : 'dismissed',
    };

    onUpdateBudgetItem(updatedItem);

    if (reminderEnabledInput) {
      playBellChimeSound();
    }

    setSelectedItemForReminder(null);
  };

  // Toggle item status completed/dismissed directly
  const handleMarkItemReminderStatus = (item: BudgetItem, status: 'completed' | 'pending' | 'dismissed') => {
    if (!onUpdateBudgetItem) return;
    const updatedItem: BudgetItem = {
      ...item,
      reminder_status: status,
    };
    onUpdateBudgetItem(updatedItem);
    if (status === 'completed' || status === 'pending') {
      playBellChimeSound();
    }
  };

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  // ---------------------------------------------------------------------------
  // REMINDERS: STRICTLY FILTERED BY ACTIVE MODE (PERSONAL ONLY IN PERSONAL, BUSINESS ONLY IN BUSINESS)
  // ---------------------------------------------------------------------------
  const allEnabledReminderItems = budgetItems.filter((item) => item.reminder_enabled);

  // Reminders filtered strictly by activeMode
  const modeReminderItems = useMemo(() => {
    return allEnabledReminderItems.filter((item) => {
      const parentBudget = budgets.find((b) => b.id === item.budget_id);
      if (activeMode === 'personal') {
        return parentBudget?.mode === 'personal';
      }
      if (activeMode === 'business') {
        return parentBudget && parentBudget.mode !== 'personal';
      }
      return true;
    });
  }, [allEnabledReminderItems, budgets, activeMode]);

  // Contextual filtering based on selectedMonthIndex if not 'all'
  const contextualReminderItems = useMemo(() => {
    if (selectedMonthIndex !== 'all') {
      const padM = String(selectedMonthIndex + 1).padStart(2, '0');
      const targetPrefix = `${selectedBudgetYear}-${padM}`;
      return modeReminderItems.filter((item) => {
        const isCurrentMonth = item.reminder_date?.startsWith(targetPrefix);
        const isOverdue = item.reminder_status !== 'completed' && item.reminder_date && item.reminder_date <= todayStr;
        return isCurrentMonth || isOverdue;
      });
    }
    return modeReminderItems;
  }, [modeReminderItems, selectedMonthIndex, selectedBudgetYear, todayStr]);

  // Sorted items: Uncompleted first (by date), then completed
  const sortedReminderItems = useMemo(() => {
    return [...contextualReminderItems].sort((a, b) => {
      if (a.reminder_status === 'completed' && b.reminder_status !== 'completed') return 1;
      if (a.reminder_status !== 'completed' && b.reminder_status === 'completed') return -1;
      return (a.reminder_date || '').localeCompare(b.reminder_date || '');
    });
  }, [contextualReminderItems]);

  const urgentRemindersCount = useMemo(() => {
    return sortedReminderItems.filter(
      (item) => item.reminder_status !== 'completed' && item.reminder_date && item.reminder_date <= todayStr
    ).length;
  }, [sortedReminderItems, todayStr]);

  // Split budgets into personal & business
  const personalBudgets = useMemo(() => filteredBudgets.filter((b) => b.mode === 'personal'), [filteredBudgets]);
  const businessBudgets = useMemo(() => filteredBudgets.filter((b) => b.mode !== 'personal'), [filteredBudgets]);

  // Compute aggregations for Personal Budgets Resume
  const personalResume = useMemo(() => {
    let plannedIncome = 0;
    let plannedExpense = 0;

    personalBudgets.forEach((budget) => {
      let bIncome = 0;
      let bExpense = 0;
      const items = budgetItems.filter((bi) => bi.budget_id === budget.id);
      items.forEach((item) => {
        const cat = categories.find((c) => c.id === item.category_id);
        if (cat?.type === 'income') {
          bIncome += item.planned_amount;
        } else {
          bExpense += item.planned_amount;
        }
      });
      if (bIncome === 0 && typeof budget.total_income_target === 'number') {
        bIncome = budget.total_income_target;
      }
      if (bExpense === 0 && typeof budget.total_planned_amount === 'number') {
        bExpense = budget.total_planned_amount;
      }
      plannedIncome += bIncome;
      plannedExpense += bExpense;
    });

    let realizedIncome = 0;
    let realizedExpense = 0;

    if (personalBudgets.length > 0) {
      let minStart = personalBudgets[0].start_date || '';
      let maxEnd = personalBudgets[0].end_date || '';
      for (const b of personalBudgets) {
        if (b.start_date && b.start_date < minStart) minStart = b.start_date;
        if (b.end_date && b.end_date > maxEnd) maxEnd = b.end_date;
      }

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.mode === 'personal' && tx.date >= minStart && tx.date <= maxEnd) {
          if (tx.type === 'income') {
            realizedIncome += tx.amount;
          } else {
            realizedExpense += tx.amount;
          }
        }
      }
    }

    const plannedNet = plannedIncome - plannedExpense;
    const realizedNet = realizedIncome - realizedExpense;
    const expensePercent = plannedExpense > 0 ? Math.round((realizedExpense / plannedExpense) * 100) : 0;

    return { plannedIncome, plannedExpense, realizedIncome, realizedExpense, plannedNet, realizedNet, expensePercent };
  }, [personalBudgets, budgetItems, categories, transactions]);

  // Compute aggregations for Business Budgets Resume
  const businessResume = useMemo(() => {
    let plannedRevenue = 0;
    let plannedExpense = 0;

    businessBudgets.forEach((budget) => {
      let bRev = 0;
      let bExp = 0;
      const items = budgetItems.filter((bi) => bi.budget_id === budget.id);
      items.forEach((item) => {
        const cat = categories.find((c) => c.id === item.category_id);
        if (cat?.type === 'income') {
          bRev += item.planned_amount;
        } else {
          bExp += item.planned_amount;
        }
      });
      if (bRev === 0 && typeof budget.total_income_target === 'number') {
        bRev = budget.total_income_target;
      }
      if (bExp === 0 && typeof budget.total_planned_amount === 'number') {
        bExp = budget.total_planned_amount;
      }
      plannedRevenue += bRev;
      plannedExpense += bExp;
    });

    let realizedRevenue = 0;
    let realizedExpense = 0;

    if (businessBudgets.length > 0) {
      let minStart = businessBudgets[0].start_date || '';
      let maxEnd = businessBudgets[0].end_date || '';
      for (const b of businessBudgets) {
        if (b.start_date && b.start_date < minStart) minStart = b.start_date;
        if (b.end_date && b.end_date > maxEnd) maxEnd = b.end_date;
      }

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.mode === 'business' && tx.date >= minStart && tx.date <= maxEnd) {
          if (tx.type === 'income') {
            realizedRevenue += tx.amount;
          } else {
            realizedExpense += tx.amount;
          }
        }
      }
    }

    const plannedProfit = plannedRevenue - plannedExpense;
    const realizedProfit = realizedRevenue - realizedExpense;
    const revenuePercent = plannedRevenue > 0 ? Math.round((realizedRevenue / plannedRevenue) * 100) : 0;

    return { plannedRevenue, plannedExpense, realizedRevenue, realizedExpense, plannedProfit, realizedProfit, revenuePercent };
  }, [businessBudgets, budgetItems, categories, transactions]);

  // Helper to render individual budget card
  const renderBudgetCard = (budget: Budget, indexInGroup?: number, groupPrefix?: string) => {
    const items = budgetItems.filter((bi) => bi.budget_id === budget.id);

    // Calculate planned amounts for income and expense
    let plannedIncome = 0;
    let plannedExpense = 0;

    items.forEach((item) => {
      const cat = categories.find((c) => c.id === item.category_id);
      if (cat?.type === 'income') {
        plannedIncome += item.planned_amount;
      } else {
        plannedExpense += item.planned_amount;
      }
    });

    if (plannedIncome === 0 && typeof budget.total_income_target === 'number' && budget.total_income_target > 0) {
      plannedIncome = budget.total_income_target;
    }
    if (plannedExpense === 0 && typeof budget.total_planned_amount === 'number' && budget.total_planned_amount > 0) {
      plannedExpense = budget.total_planned_amount;
    }

    const plannedBalance = plannedIncome - plannedExpense;

    // Calculate actual realized amounts during budget period and matching specific business / mode
    const bStart = budget.start_date || '';
    const bEnd = budget.end_date || '';

    let realizedIncome = 0;
    let realizedExpense = 0;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx.date >= bStart && tx.date <= bEnd) {
        if (budget.mode === 'personal') {
          if (tx.mode === 'personal') {
            if (tx.type === 'income') realizedIncome += tx.amount;
            else realizedExpense += tx.amount;
          }
        } else if (budget.mode === 'business') {
          if (tx.mode === 'business') {
            // Match specific business name / type if available on budget
            const matchesBiz =
              (!budget.business_name || !tx.business_name || tx.business_name.toLowerCase().trim() === budget.business_name.toLowerCase().trim()) &&
              (!budget.business_type || !tx.business_type || tx.business_type === budget.business_type);
            if (matchesBiz) {
              if (tx.type === 'income') realizedIncome += tx.amount;
              else realizedExpense += tx.amount;
            }
          }
        } else {
          // budget.mode === 'all'
          if (tx.type === 'income') realizedIncome += tx.amount;
          else realizedExpense += tx.amount;
        }
      }
    }

    const realizedBalance = realizedIncome - realizedExpense;

    const incomePercent =
      plannedIncome > 0 ? Math.round((realizedIncome / plannedIncome) * 100) : 0;
    const expensePercent =
      plannedExpense > 0 ? Math.round((realizedExpense / plannedExpense) * 100) : 0;

    const displayName = getBudgetDisplayName(budget.name, language);
    const numberingLabel = indexInGroup !== undefined && groupPrefix ? `${groupPrefix} ${indexInGroup}` : null;

    return (
      <div
        key={budget.id}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
      >
        {/* Header: Title, Mode/Numbering Badge, Date Range, 3-dots Menu */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {numberingLabel && (
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-md font-black tracking-wide ${
                    budget.mode === 'personal'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-cyan-600 text-white shadow-xs'
                  }`}
                >
                  {numberingLabel}
                </span>
              )}
              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                {displayName}
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  budget.mode === 'personal'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border border-purple-200 dark:border-purple-700'
                    : 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/80 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700'
                }`}
              >
                {budget.mode === 'personal' ? t('personal') : t('business')}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                {budget.start_date} ~ {budget.end_date}
              </span>
            </p>

            {/* Carryover Indicator if budget has carryover balance */}
            {typeof budget.carryover_balance === 'number' && budget.carryover_balance !== 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {language === 'id' ? 'Saldo Kas Bawaan: ' : 'Carryover Balance: '}
                  <strong className="text-amber-700 dark:text-amber-300 font-mono font-black">
                    {formatRupiah(budget.carryover_balance)}
                  </strong>
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-extrabold ml-1">
                  {budget.rollover_type === 'actual_previous'
                    ? (language === 'id' ? 'Realisasi Riil' : 'Actual')
                    : budget.rollover_type === 'predicted_ongoing'
                    ? (language === 'id' ? 'Prediksi AI' : 'AI Predicted')
                    : (language === 'id' ? 'Kustom' : 'Custom')}
                </span>
              </div>
            )}
          </div>

          {/* 3-dots Menu Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpenBudgetId(menuOpenBudgetId === budget.id ? null : budget.id)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={language === 'id' ? 'Opsi Anggaran' : 'Budget Options'}
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {menuOpenBudgetId === budget.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpenBudgetId(null)}
                />
                <div className="absolute right-0 top-9 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 min-w-[210px] animate-fadeIn text-xs">
                  <button
                    onClick={() => handleOpenBusinessWizard(budget, budget.mode === 'personal' ? 'personal' : 'business')}
                    className="w-full px-3.5 py-2.5 text-left font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{language === 'id' ? 'Wizard Format Laporan' : 'Report Format Wizard'}</span>
                  </button>
                  <button
                    onClick={() => handleEditBudget(budget)}
                    className="w-full px-3.5 py-2 text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'id' ? 'Edit Form Cepat' : 'Quick Form Edit'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpenBudgetId(null);
                      setBudgetToDelete(budget);
                    }}
                    className="w-full px-3.5 py-2 text-left font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-slate-700 mt-1 pt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'id' ? 'Hapus Anggaran' : 'Delete Budget'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Realisasi & Perbandingan Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-slate-100">
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{language === 'id' ? 'Realisasi vs Rencana Anggaran' : 'Actual vs Planned Budget'}</span>
            </span>
          </div>

          {/* Comparison Grid: Income vs Expense */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pemasukan Card */}
            <div
              onClick={() => setDetailModal({ budget, type: 'income' })}
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex flex-col gap-2.5 shadow-2xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-all active:scale-[0.99] group"
              title={language === 'id' ? 'Klik untuk lihat detail pemasukan' : 'Click to view income details'}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  {budget.mode === 'personal'
                    ? language === 'id' ? 'Target Pemasukan' : 'Target Income'
                    : language === 'id' ? 'Target Omset' : 'Revenue Target'}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    incomePercent >= 100
                      ? 'bg-emerald-200 text-emerald-950 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {incomePercent}% {t('achieved')}
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs mt-0.5">
                <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold">{language === 'id' ? 'Realisasi:' : 'Actual:'}</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">{formatRupiah(realizedIncome)}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs border-t border-emerald-200/80 dark:border-emerald-800/60 pt-1.5">
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">{language === 'id' ? 'Rencana:' : 'Planned:'}</span>
                <span className="font-black text-slate-900 dark:text-white">{formatRupiah(plannedIncome)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-emerald-200/80 dark:bg-emerald-900/80 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(incomePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Pengeluaran Card */}
            <div
              onClick={() => setDetailModal({ budget, type: 'expense' })}
              className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl flex flex-col gap-2.5 shadow-2xs cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-all active:scale-[0.99] group"
              title={language === 'id' ? 'Klik untuk lihat detail pengeluaran' : 'Click to view expense details'}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-950 dark:text-rose-200 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                  {budget.mode === 'personal'
                    ? language === 'id' ? 'Batas Pengeluaran' : 'Expense Limit'
                    : language === 'id' ? 'Beban & HPP Usaha' : 'Expenses & COGS'}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    expensePercent > 100
                      ? 'bg-rose-200 text-rose-950 border-rose-300 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-700'
                      : 'bg-rose-200/90 text-rose-900 border-rose-300/60 dark:bg-rose-900/80 dark:text-rose-100 dark:border-rose-700'
                  }`}
                >
                  {expensePercent}% {t('used')}
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs mt-0.5">
                <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold">{language === 'id' ? 'Realisasi:' : 'Actual:'}</span>
                <span className="font-black text-rose-700 dark:text-rose-300 text-sm">{formatRupiah(realizedExpense)}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs border-t border-rose-200/80 dark:border-rose-800/60 pt-1.5">
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">{language === 'id' ? 'Rencana:' : 'Planned:'}</span>
                <span className="font-black text-slate-900 dark:text-white">{formatRupiah(plannedExpense)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-rose-200/80 dark:bg-rose-900/80 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    expensePercent > 100 ? 'bg-rose-600' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(expensePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary Net Balance Banner */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <WalletCards className="w-4.5 h-4.5 text-blue-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {budget.mode === 'personal'
                    ? language === 'id' ? 'Sisa Saldo Tabungan / Kas' : 'Net Cash & Savings'
                    : language === 'id' ? 'Estimasi Laba Bersih Usaha' : 'Net Business Profit'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'id' ? 'Rencana Net:' : 'Planned Net:'} {formatRupiah(plannedBalance)}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">
                {language === 'id' ? 'Realisasi Net' : 'Actual Net'}
              </span>
              <span
                className={`text-sm font-black ${
                  realizedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatRupiah(realizedBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col gap-5 pb-24">
      {/* CREATION PANELS: PERSONAL VS BUSINESS (HIDDEN IN ALL MODE) */}
      {activeMode === 'personal' && (
        <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-purple-500/30 relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col gap-2 border-b border-purple-500/20 pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-xl shrink-0">
                  <User className="w-4.5 h-4.5 text-purple-300" />
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  {language === 'id' ? 'Penganggaran Pribadi & Rumah Tangga' : 'Personal & Household Budgeting'}
                </h2>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-600 text-white border border-purple-400/40">
                  {language === 'id' ? 'Mode Pribadi' : 'Personal Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenGuideModal('personal')}
                  className="px-2.5 py-1 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400/50 text-purple-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                  title="Lihat PDF Dummy & Panduan Pribadi"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span>{language === 'id' ? 'Contoh (PDF)' : 'Sample (PDF)'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-purple-200/90 leading-relaxed">
              {language === 'id'
                ? 'Rencanakan keuangan pribadi dengan metode 50/30/20, pos kebutuhan pokok, cicilan utang, dan tabungan dana darurat.'
                : 'Plan personal finances with 50/30/20 rule, living necessities, debt payments, and emergency savings.'}
            </p>
          </div>

          {/* 1. PRIMARY / PROMINENT WIZARD PANEL (BESAR DENGAN ARAHAN REKOMENDASI) */}
          <div className="relative z-10 bg-gradient-to-br from-purple-900/40 via-purple-950/60 to-slate-900/90 border-2 border-purple-400/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-lg backdrop-blur-xs">
            <div className="flex items-start gap-3">
              <span className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-md border border-purple-300/40 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {language === 'id' ? '✨ Wizard Anggaran Pribadi' : '✨ Personal Budget Wizard'}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs border border-amber-300 whitespace-nowrap">
                    ⭐ {language === 'id' ? 'Rekomendasi Utama' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 mt-1 leading-relaxed">
                  {language === 'id'
                    ? 'Alur terpandu 5 langkah otomatis mengisi pos kebutuhan pokok, tagihan rutin, cicilan utang, serta alokasi tabungan & dana darurat sesuai metode 50/30/20.'
                    : 'Guided 5-step workflow auto-allocating living essentials, routine bills, debt payments, and 50/30/20 savings & emergency funds.'}
                </p>

                {/* Benefit highlights */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    ⚡ {language === 'id' ? '5 Langkah Otomatis' : '5-Step Flow'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    📊 {language === 'id' ? 'Metode 50/30/20' : '50/30/20 Rule'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    🛡️ {language === 'id' ? 'Dana Darurat' : 'Emergency Fund'}
                  </span>
                </div>
              </div>
            </div>

            {/* Big CTA Button */}
            <button
              type="button"
              onClick={() => handleOpenBusinessWizard(undefined, 'personal')}
              className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-[0.98] transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-purple-200" />
              <span>{language === 'id' ? 'Buka Wizard Pribadi (Langkah demi Langkah)' : 'Open Personal Wizard (Step-by-Step)'}</span>
              <ArrowRight className="w-4 h-4 text-purple-200" />
            </button>
          </div>

          {/* 2. SECONDARY FLEXIBLE PANEL (KECIL DENGAN TOMBOL DI BAWAH KETERANGAN) */}
          <div className="relative z-10 bg-slate-900/50 hover:bg-slate-900/70 border border-purple-500/20 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 transition-all">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30 shrink-0 mt-0.5">
                <Plus className="w-4 h-4 text-indigo-300" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-100">
                  {language === 'id' ? '➕ Anggaran Fleksibel (Input Pos Manual)' : '➕ Flexible Personal Budget (Manual Input)'}
                </h4>
                <p className="text-[11px] text-purple-200/80 mt-0.5 leading-relaxed">
                  {language === 'id'
                    ? 'Input pos anggaran pribadi secara mandiri & leluasa tanpa rumus wizard.'
                    : 'Create and manage custom personal budget lines freely without wizard formula.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateFlexibleModal('personal')}
              className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-purple-300" />
              <span>{language === 'id' ? 'Buat Anggaran Fleksibel Pribadi' : 'Create Flexible Budget'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          </div>
        </div>
      )}

      {activeMode === 'business' && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-blue-500/30 relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col gap-2 border-b border-blue-500/20 pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-xl shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-blue-400" />
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  {language === 'id' ? 'Penganggaran Bisnis & UMKM (SAK EMKM)' : 'Business & SME Budgeting (SAK EMKM)'}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-400/40">
                  {language === 'id' ? 'Mode Bisnis' : 'Business Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenGuideModal('business')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                  title="Lihat PDF Dummy & Panduan Bisnis"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{language === 'id' ? 'Contoh (PDF)' : 'Sample (PDF)'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'id'
                ? 'Proyeksikan target omzet, batasi HPP/kulakan, kelola beban operasional (OPEX), dan pastikan laba bersih usaha Anda.'
                : 'Project revenue targets, control COGS, manage operational expenses, and secure your net profit.'}
            </p>
          </div>

          {/* 1. PRIMARY / PROMINENT WIZARD PANEL (BESAR DENGAN ARAHAN REKOMENDASI) */}
          <div className="relative z-10 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 border-2 border-amber-400/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl backdrop-blur-xs">
            <div className="flex items-start gap-3">
              <span className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-md border border-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {language === 'id' ? '✨ Wizard Bisnis & UMKM (SAK EMKM)' : '✨ Business Wizard (SAK EMKM)'}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs border border-amber-300 whitespace-nowrap">
                    ⭐ {language === 'id' ? 'Rekomendasi Utama' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {language === 'id'
                    ? 'Alur terpandu 5 langkah standar akuntansi SAK EMKM: Menghitung target pendapatan usaha, mengunci batas beban HPP/kulakan bahan, mengendalikan beban operasional (OPEX), dan mengamankan laba bersih usaha.'
                    : 'Guided 5-step workflow matching SAK EMKM standards: Projecting revenue, capping COGS/material costs, controlling OPEX, and securing net business profit.'}
                </p>

                {/* Benefit highlights */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    📑 {language === 'id' ? 'Standar SAK EMKM' : 'SAK EMKM'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    🎯 {language === 'id' ? 'Kunci Batas HPP' : 'Lock COGS'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    💰 {language === 'id' ? 'Hitung Laba Bersih' : 'Auto Profit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Big CTA Button */}
            <button
              type="button"
              onClick={() => handleOpenBusinessWizard(undefined, 'business')}
              className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>{language === 'id' ? 'Buka Wizard Bisnis (Langkah demi Langkah)' : 'Open Business Wizard (Step-by-Step)'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          {/* 2. SECONDARY FLEXIBLE PANEL (KECIL DENGAN TOMBOL DI BAWAH KETERANGAN) */}
          <div className="relative z-10 bg-slate-900/50 hover:bg-slate-900/70 border border-blue-500/20 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 transition-all">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30 shrink-0 mt-0.5">
                <Plus className="w-4 h-4 text-blue-300" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-100">
                  {language === 'id' ? '➕ Anggaran Fleksibel Bisnis (Input Pos Manual)' : '➕ Flexible Business Budget (Manual Input)'}
                </h4>
                <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed">
                  {language === 'id'
                    ? 'Input pos anggaran unit bisnis secara mandiri & leluasa sesuai kebutuhan usaha.'
                    : 'Create and manage custom business budget lines freely based on business needs.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateFlexibleModal('business')}
              className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-cyan-300" />
              <span>{language === 'id' ? 'Buat Anggaran Fleksibel Bisnis' : 'Create Flexible Business Budget'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>
        </div>
      )}

      {/* ALL MODE HEADER SUMMARY (NO CREATION BUTTONS) */}
      {activeMode === 'all' && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white">
                  {language === 'id' ? 'Semua Anggaran Terjadwal' : 'All Scheduled Budgets'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {budgets.length} {language === 'id' ? 'Anggaran' : 'Budgets'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'id'
                  ? 'Menampilkan seluruh rekapitulasi anggaran yang telah dibuat pada Mode Pribadi & Mode Bisnis.'
                  : 'Displaying comprehensive overview of all budgets created across Personal and Business modes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800">
            <div className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{budgets.filter((b) => b.mode === 'personal').length} {language === 'id' ? 'Pribadi' : 'Personal'}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-bold flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>{budgets.filter((b) => b.mode === 'business').length} {language === 'id' ? 'Bisnis' : 'Business'}</span>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE & CLEAN JATUH TEMPO PANEL (STRICTLY MODE-SPECIFIC, NO EXTRA CHOICES / CLUTTER) */}
      {sortedReminderItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 shadow-sm border transition-all ${
            urgentRemindersCount > 0
              ? 'bg-slate-900 text-white border-rose-500/40 shadow-rose-950/20'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {/* Clean Minimal Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`p-2 rounded-xl border shrink-0 ${
                  urgentRemindersCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 animate-pulse'
                    : 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <span>
                    {activeMode === 'personal'
                      ? (language === 'id' ? 'Jatuh Tempo Pembayaran Pribadi' : 'Personal Due Dates')
                      : activeMode === 'business'
                      ? (language === 'id' ? 'Jatuh Tempo Kewajiban & Tagihan Usaha' : 'Business Due Dates')
                      : (language === 'id' ? 'Daftar Jatuh Tempo' : 'Due Date Reminders')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {urgentRemindersCount > 0
                    ? (language === 'id'
                        ? `${urgentRemindersCount} tagihan menjelang / lewat jatuh tempo`
                        : `${urgentRemindersCount} due soon or overdue`)
                    : (language === 'id'
                        ? `${sortedReminderItems.length} jadwal tagihan terpantau aman`
                        : `${sortedReminderItems.length} scheduled items`)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                  urgentRemindersCount > 0
                    ? 'bg-rose-600 text-white border-rose-500 shadow-xs animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {sortedReminderItems.filter((it) => it.reminder_status !== 'completed').length}{' '}
                {language === 'id' ? 'Belum Lunas' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Simple Clean List */}
          <div className="flex flex-col gap-2 mt-3 max-h-[320px] overflow-y-auto pr-1">
            {sortedReminderItems.map((item) => {
              const cat = getCategory(item.category_id);
              const isDueToday = item.reminder_date === todayStr;
              const isOverdue = !!(item.reminder_date && item.reminder_date < todayStr);
              const isCompleted = item.reminder_status === 'completed';

              // Format date cleanly e.g. "10 Agu 2026"
              let formattedDate = item.reminder_date || '';
              if (item.reminder_date) {
                const parts = item.reminder_date.split('-');
                if (parts.length === 3) {
                  const mIdx = parseInt(parts[1], 10) - 1;
                  formattedDate = `${parseInt(parts[2], 10)} ${MONTH_SHORT_ID[mIdx] || parts[1]} ${parts[0]}`;
                }
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-3 flex items-center justify-between gap-3 transition-all border ${
                    isCompleted
                      ? 'bg-slate-800/40 border-slate-800/80 opacity-60'
                      : isOverdue
                      ? 'bg-slate-800/90 border-rose-500/50 shadow-xs'
                      : isDueToday
                      ? 'bg-slate-800/90 border-amber-500/60 shadow-xs'
                      : 'bg-slate-800/70 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                      <CategoryIcon name={cat?.icon || 'Tag'} color={cat?.color} size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-black truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {cat ? getCategoryDisplayName(cat.name, language) : item.reminder_note || 'Tagihan'}
                        </span>

                        {/* Status Badge */}
                        {!isCompleted && isOverdue && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600/90 text-white border border-rose-500">
                            {language === 'id' ? 'Lewat Jatuh Tempo' : 'Overdue'}
                          </span>
                        )}
                        {!isCompleted && isDueToday && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                            {language === 'id' ? 'Hari Ini' : 'Due Today'}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {formattedDate}
                        </span>
                        {item.reminder_note && (
                          <span className="text-slate-400 truncate max-w-[200px]">
                            • {item.reminder_note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-black ${
                        isCompleted ? 'line-through text-slate-500' : 'text-amber-300'
                      }`}
                    >
                      {formatRupiah(item.planned_amount)}
                    </span>

                    {/* Simple toggle lunas */}
                    <button
                      type="button"
                      onClick={() => handleMarkItemReminderStatus(item, isCompleted ? 'pending' : 'completed')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95'
                      }`}
                      title={
                        isCompleted
                          ? language === 'id'
                            ? 'Batal Lunas'
                            : 'Mark Unpaid'
                          : language === 'id'
                          ? 'Tandai Lunas'
                          : 'Mark Paid'
                      }
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px]">{language === 'id' ? 'Lunas' : 'Paid'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{language === 'id' ? 'Bayar' : 'Pay'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* SECTION RESUME PENGANGGARAN PRIBADI */}
      {(activeMode === 'all' || activeMode === 'personal') && (
        <div className="flex flex-col gap-3.5">
          {/* Resume Header & Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl shrink-0">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{language === 'id' ? 'Resume Penganggaran Pribadi & Rumah Tangga' : 'Personal Budget Resume'}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                      {personalBudgets.length} {language === 'id' ? 'Anggaran' : 'Budgets'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'id'
                      ? 'Ringkasan rencana pengeluaran kebutuhan hidup, tabungan, dan realisasi'
                      : 'Summary of living expenses, savings, and actual realization'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenGuideModal('personal')}
                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Cth Laporan (PDF)' : 'Sample (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {personalBudgets.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Target Pemasukan' : 'Planned Income'}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {formatRupiah(personalResume.plannedIncome)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Rencana Pengeluaran' : 'Planned Expense'}</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                    {formatRupiah(personalResume.plannedExpense)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Realisasi Pengeluaran' : 'Actual Expense'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">
                    {formatRupiah(personalResume.realizedExpense)} ({personalResume.expensePercent}%)
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Sisa Saldo Rencana' : 'Planned Net'}</span>
                  <span className={`text-xs font-black mt-0.5 truncate ${personalResume.plannedNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                    {formatRupiah(personalResume.plannedNet)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Personal Budgets List */}
          {personalBudgets.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {personalBudgets.map((budget, idx) =>
                renderBudgetCard(budget, idx + 1, language === 'id' ? 'Pribadi' : 'Personal')
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-purple-200 dark:border-purple-900/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5">
              <span className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {language === 'id'
                    ? `Belum Ada Anggaran Pribadi untuk Bulan ${selectedMonthIndex === 'all' ? `Tahun ${selectedBudgetYear}` : `${MONTH_NAMES_ID[selectedMonthIndex]} ${selectedBudgetYear}`}`
                    : `No Personal Budget for ${selectedMonthIndex === 'all' ? `Year ${selectedBudgetYear}` : `${MONTH_NAMES_ID[selectedMonthIndex]} ${selectedBudgetYear}`}`}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                  {language === 'id'
                    ? 'Gunakan Wizard Pribadi atau buat anggaran fleksibel untuk menyusun alokasi keuangan bulan ini.'
                    : 'Use Personal Wizard or create flexible budget to plan your finances for this month.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBusinessWizard(undefined, 'personal')}
                className="mt-1 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Susun dengan Wizard Pribadi' : 'Create with Personal Wizard'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION RESUME PENGANGGARAN BISNIS (BISNIS 1, BISNIS 2, DST.) */}
      {(activeMode === 'all' || activeMode === 'business') && (
        <div className="flex flex-col gap-3.5 mt-2">
          {/* Resume Header & Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 rounded-xl shrink-0">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{language === 'id' ? 'Resume Penganggaran Bisnis & Unit Usaha (SAK EMKM)' : 'Business Budget Resume (SAK EMKM)'}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">
                      {businessBudgets.length} {language === 'id' ? 'Unit Bisnis' : 'Business Units'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'id'
                      ? 'Resume proyeksi omset, batas beban HPP & operasional untuk Bisnis 1, Bisnis 2, dst.'
                      : 'Revenue projections, COGS & operational budgets for Business 1, Business 2, etc.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenGuideModal('business')}
                  className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Cth Laporan (PDF)' : 'Sample (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {businessBudgets.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Total Target Omzet' : 'Total Target Revenue'}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {formatRupiah(businessResume.plannedRevenue)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Total Beban & HPP' : 'Total COGS & Expense'}</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                    {formatRupiah(businessResume.plannedExpense)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Realisasi Omzet' : 'Actual Revenue'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">
                    {formatRupiah(businessResume.realizedRevenue)} ({businessResume.revenuePercent}%)
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'id' ? 'Target Laba Bersih' : 'Target Net Profit'}</span>
                  <span className={`text-xs font-black mt-0.5 truncate ${businessResume.plannedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {formatRupiah(businessResume.plannedProfit)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Business Budgets List (Bisnis 1, Bisnis 2, dst.) */}
          {businessBudgets.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {businessBudgets.map((budget, idx) =>
                renderBudgetCard(budget, idx + 1, language === 'id' ? 'Bisnis' : 'Business')
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5">
              <span className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-2xl">
                <Store className="w-6 h-6" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {language === 'id'
                    ? `Belum Ada Anggaran Bisnis untuk Bulan ${selectedMonthIndex === 'all' ? `Tahun ${selectedBudgetYear}` : `${MONTH_NAMES_ID[selectedMonthIndex]} ${selectedBudgetYear}`}`
                    : `No Business Budget for ${selectedMonthIndex === 'all' ? `Year ${selectedBudgetYear}` : `${MONTH_NAMES_ID[selectedMonthIndex]} ${selectedBudgetYear}`}`}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                  {language === 'id'
                    ? 'Susun rencana omzet, batasi HPP & beban operasional unit usaha untuk bulan ini dengan wizard SAK EMKM.'
                    : 'Plan revenue, cap COGS & OPEX for this month using SAK EMKM wizard.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBusinessWizard(undefined, 'business')}
                className="mt-1 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Susun dengan Wizard Bisnis' : 'Create with Business Wizard'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE DYNAMIC FLEXIBLE BUDGET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    {editingBudgetId
                      ? language === 'id'
                        ? 'Edit Perencanaan Anggaran'
                        : 'Edit Budget Plan'
                      : t('createFlexibleBudgetModalTitle')}
                  </h3>
                  <p className="text-[10px] text-slate-300">{t('modalBudgetSub')}</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Quick switch to Business Wizard */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    {language === 'id'
                      ? 'Butuh panduan step-by-step sesuai Format Laporan Keuangan (SAK EMKM)?'
                      : 'Want step-by-step guidance following Financial Statements (SAK EMKM)?'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleOpenBusinessWizard(editingBudgetId ? budgets.find((b) => b.id === editingBudgetId) : undefined);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg shrink-0 cursor-pointer"
                >
                  {language === 'id' ? 'Buka Wizard →' : 'Open Wizard →'}
                </button>
              </div>

              {/* Nama Anggaran */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('budgetNameLabel')}</label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder={t('budgetNamePlaceholder')}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Select Mode */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{t('financialModeLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetMode('personal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      budgetMode === 'personal'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> {t('personal')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBudgetMode('business')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      budgetMode === 'business'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" /> {t('business')}
                  </button>
                </div>
              </div>

              {/* Tanggal Periode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">{t('startPeriod')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">{t('endPeriod')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Budget Items Builder with Integrated Reminder Option */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    {t('budgetLinesLabel')} ({dynamicItems.length} {language === 'id' ? 'Pos Anggaran' : 'Budget Lines'}):
                  </label>

                  <button
                    type="button"
                    onClick={handleAutoFillCategories}
                    className="text-[10px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded cursor-pointer"
                  >
                    {t('loadAllCategoriesBtn')}
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {dynamicItems.map((row, idx) => {
                    const rowType = row.item_type || categories.find((c) => c.id === row.category_id)?.type || 'expense';

                    return (
                      <div
                        key={idx}
                        ref={idx === dynamicItems.length - 1 ? lastRowRef : null}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 shadow-2xs"
                      >
                        {/* Sub-header: Row Index, Item Type Switcher (Pemasukan vs Pengeluaran), and Input Mode Switcher */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>

                            {/* Type Selector (Pengeluaran vs Pemasukan) per Pos */}
                            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => handleRowItemTypeChange(idx, 'expense')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-0.5 ${
                                  rowType === 'expense'
                                    ? 'bg-rose-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <TrendingDown className="w-3 h-3 shrink-0" />
                                {t('expenseType')}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRowItemTypeChange(idx, 'income')}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-0.5 ${
                                  rowType === 'income'
                                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <TrendingUp className="w-3 h-3 shrink-0" />
                                {t('incomeType')}
                              </button>
                            </div>
                          </div>

                          {/* Mode Selector Pill (Dropdown vs Manual) */}
                          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleRowInputModeToggle(idx, 'dropdown')}
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                row.input_mode !== 'manual'
                                  ? 'bg-white text-blue-700 shadow-xs font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {t('selectFromList')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRowInputModeToggle(idx, 'manual')}
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                row.input_mode === 'manual'
                                  ? 'bg-purple-600 text-white shadow-xs font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {t('typeManually')}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {row.input_mode === 'manual' ? (
                            /* Manual Text Input */
                            <input
                              type="text"
                              placeholder={t('customPosPlaceholder')}
                              value={row.custom_name || ''}
                              onChange={(e) => handleCustomNameChange(idx, e.target.value)}
                              className="flex-1 p-2 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold text-purple-950 dark:text-purple-200 bg-purple-50/50 dark:bg-purple-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                            />
                          ) : (
                            /* Dropdown Category Select */
                            <select
                              value={row.category_id}
                              onChange={(e) => {
                                if (e.target.value === '__NEW_MANUAL_INPUT__') {
                                  handleRowInputModeToggle(idx, 'manual');
                                } else {
                                  handleCategoryChange(idx, e.target.value);
                                }
                              }}
                              className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                            >
                              {categories
                                .filter((c) => c.type === rowType)
                                .map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.type === 'income' ? `[${t('filterIncome')}] ` : `[${t('filterExpense')}] `}
                                    {getCategoryDisplayName(cat.name, language)}
                                  </option>
                                ))}
                              <option value="__NEW_MANUAL_INPUT__" className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950">
                                {t('typeNewPosOption')}
                              </option>
                            </select>
                          )}

                          {/* Toggle Reminder Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleRowReminder(idx)}
                            className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                              row.reminder_enabled
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                            title={language === 'id' ? 'Aktifkan Pengingat Jatuh Tempo' : 'Enable Due Date Reminder'}
                          >
                            <Bell className="w-4 h-4" />
                          </button>

                          {/* Remove Line Item */}
                          {dynamicItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                              title={language === 'id' ? 'Hapus baris' : 'Remove row'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* 3 Input Baris: Qty (1/5th = setengah dari harga satuan), Harga Satuan (2/5th), Total (2/5th) */}
                        <div className="grid grid-cols-5 gap-1.5 bg-slate-50/90 p-2 rounded-lg border border-slate-200/80">
                          {/* Qty (1 unit width = 20%) */}
                          <div className="col-span-1 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600 truncate text-center" title={language === 'id' ? 'Jumlah Item / Volume' : 'Item Quantity / Volume'}>
                              {t('qtyLabel')}
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={row.qty ?? '1'}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded-md text-xs font-bold text-center bg-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Harga Satuan (2 units width = 40%) */}
                          <div className="col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600 truncate" title={language === 'id' ? 'Harga Satuan Item' : 'Unit Price'}>
                              {t('itemPriceLabel')}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={language === 'id' ? 'Rp Satuan' : 'Unit Price'}
                              value={row.unit_price ?? ''}
                              onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded-md text-xs font-bold text-right bg-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Total Harga (2 units width = 40%, sama besar dengan Harga Satuan) */}
                          <div className="col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-blue-700 truncate" title={language === 'id' ? 'Total Harga' : 'Total Price'}>
                              {t('totalPriceLabel')}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={language === 'id' ? 'Rp Total' : 'Total Price'}
                              value={row.planned_amount}
                              onChange={(e) => handleAmountChange(idx, e.target.value)}
                              className="w-full p-1.5 border border-blue-300 rounded-md text-xs font-black text-right bg-blue-50/80 text-blue-900 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Tanggal Rencana Realisasi Input Bar */}
                        <div className="flex items-center justify-between text-xs bg-slate-100/90 p-2 rounded-lg border border-slate-200/80">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {t('realizationDateLabel')}
                          </span>
                          <input
                            type="date"
                            value={row.reminder_date || endDate}
                            onChange={(e) => handleRowReminderDateChange(idx, e.target.value)}
                            className="p-1 border border-slate-300 rounded-md bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Manual input auto-save notification */}
                        {row.input_mode === 'manual' && (
                          <p className="text-[10px] text-purple-800 font-medium bg-purple-100/60 p-1.5 rounded-lg border border-purple-200/80">
                            {t('customPosAutoSaveHint')}
                          </p>
                        )}

                        {/* Expandable Reminder Config for this row */}
                        {row.reminder_enabled && (
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 flex flex-col gap-2 animate-fadeIn text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 flex items-center gap-1">
                                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                                {t('reminderTitle')}
                              </span>
                              <input
                                type="date"
                                value={row.reminder_date || endDate}
                                onChange={(e) => handleRowReminderDateChange(idx, e.target.value)}
                                className="p-1 border border-amber-300 rounded-md bg-white text-xs font-bold text-amber-900"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder={t('reminderNotePlaceholder')}
                              value={row.reminder_note || ''}
                              onChange={(e) => handleRowReminderNoteChange(idx, e.target.value)}
                              className="w-full p-1.5 border border-amber-300 rounded-md bg-white text-xs text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Row Button */}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="mt-1 py-2 px-3 border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('newBudgetLineBtn')}
                </button>
              </div>

              {/* Total Planned Summary */}
              {(() => {
                const getRowItemType = (row: DynamicItemRow): 'income' | 'expense' => {
                  if (row.item_type) return row.item_type;
                  const cat = categories.find((c) => c.id === row.category_id);
                  if (cat) return cat.type;
                  return 'expense';
                };

                const calcTotalExpense = dynamicItems.reduce((sum, item) => {
                  if (getRowItemType(item) === 'expense') {
                    return sum + parseAmountNumber(item.planned_amount);
                  }
                  return sum;
                }, 0);

                const calcTotalIncome = dynamicItems.reduce((sum, item) => {
                  if (getRowItemType(item) === 'income') {
                    return sum + parseAmountNumber(item.planned_amount);
                  }
                  return sum;
                }, 0);

                const plannedBalance = calcTotalIncome - calcTotalExpense;

                return (
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Total Pemasukan sebelah kiri */}
                      <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/80 flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {t('totalPlannedIncome')}
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          {formatRupiah(calcTotalIncome)}
                        </span>
                      </div>

                      {/* Total Pengeluaran sebelah kanan */}
                      <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/80 flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {t('totalPlannedExpense')}
                        </span>
                        <span className="text-sm font-black text-rose-400">
                          {formatRupiah(calcTotalExpense)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-800 text-xs font-bold text-slate-300 px-1">
                      <span>{t('plannedBalanceLabel')}</span>
                      <span className={`text-sm font-black ${plannedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatRupiah(plannedBalance)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {editingBudgetId
                    ? language === 'id'
                      ? 'Simpan Perubahan'
                      : 'Save Changes'
                    : t('savePlanBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM REMINDER MODAL */}
      {selectedItemForReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{t('reminderEditTitle')}</h3>
                  <p className="text-[11px] font-bold text-slate-500">
                    {getCategoryDisplayName(
                      getCategory(selectedItemForReminder.category_id)?.name || '',
                      language
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItemForReminder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Toggle Switch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('reminderEnableToggle')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {reminderEnabledInput
                      ? (language === 'id' ? 'Pengingat aktif' : 'Reminder active')
                      : (language === 'id' ? 'Pengingat dinonaktifkan' : 'Reminder disabled')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setReminderEnabledInput(!reminderEnabledInput)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    reminderEnabledInput ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      reminderEnabledInput ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {reminderEnabledInput && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  {/* Quick Shortcut Due Date Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('reminderDateLabel')}
                    </label>
                    <input
                      type="date"
                      value={reminderDateInput}
                      onChange={(e) => setReminderDateInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    />

                    <div className="flex gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setReminderDateInput(todayStr)}
                        className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        {t('btnFilterToday')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setReminderDateInput(tomorrow.toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        {language === 'id' ? 'Besok' : 'Tomorrow'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const in3Days = new Date();
                          in3Days.setDate(in3Days.getDate() + 3);
                          setReminderDateInput(in3Days.toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        {language === 'id' ? '+3 Hari' : '+3 Days'}
                      </button>
                    </div>
                  </div>

                  {/* Reminder Note */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('reminderNoteLabel')}
                    </label>
                    <input
                      type="text"
                      value={reminderNoteInput}
                      placeholder={t('reminderNotePlaceholder')}
                      onChange={(e) => setReminderNoteInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>

                  {/* Sound Test Button */}
                  <button
                    type="button"
                    onClick={() => playBellChimeSound()}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>{t('reminderTestSoundBtn')}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItemForReminder(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleSaveItemReminder}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {t('reminderSetBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL BREAKDOWN MODAL FOR INCOME OR EXPENSE */}
      {detailModal && (() => {
        const { budget, type } = detailModal;
        const isIncome = type === 'income';

        const items = budgetItems.filter((bi) => bi.budget_id === budget.id);
        const typeItems = items.filter((bi) => {
          const cat = categories.find((c) => c.id === bi.category_id);
          if (isIncome) return cat?.type === 'income';
          return !cat || cat.type === 'expense';
        });

        const catIds = new Set(typeItems.map((bi) => bi.category_id));

        const bStart = new Date(budget.start_date);
        const bEnd = new Date(budget.end_date);
        bEnd.setHours(23, 59, 59, 999);

        const matchingTxs = transactions.filter((tx) => {
          const txDate = new Date(tx.date);
          const inPeriod = txDate >= bStart && txDate <= bEnd;
          const isModeMatch = budget.mode === 'all' ? true : tx.mode === budget.mode;
          const isTypeMatch = tx.type === type;
          return inPeriod && isModeMatch && isTypeMatch;
        });

        const totalPlanned = typeItems.reduce((sum, item) => sum + item.planned_amount, 0);
        const totalRealized = matchingTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const percent = totalPlanned > 0 ? Math.round((totalRealized / totalPlanned) * 100) : 0;
        const diff = isIncome ? totalRealized - totalPlanned : totalPlanned - totalRealized;

        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
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
                      {language === 'id' ? 'Detail' : 'Detail'} {isIncome ? (language === 'id' ? 'Pemasukan' : 'Income') : (language === 'id' ? 'Pengeluaran' : 'Expenses')}
                    </h3>
                    <p className="text-xs text-white/80 font-medium">
                      {getBudgetDisplayName(budget.name, language)} ({budget.start_date} ~ {budget.end_date})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 text-slate-800 dark:text-slate-100">
                {/* Summary Ringkasan Box */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                    isIncome
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold block">
                        {language === 'id' ? 'Total Rencana:' : 'Total Planned:'}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatRupiah(totalPlanned)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold block">
                        {language === 'id' ? 'Total Realisasi:' : 'Total Actual:'}
                      </span>
                      <span
                        className={`text-sm font-black ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatRupiah(totalRealized)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {isIncome
                        ? (language === 'id' ? 'Status Realisasi:' : 'Realization Status:')
                        : (language === 'id' ? 'Status Terpakai:' : 'Usage Status:')}
                    </span>
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                        isIncome
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                          : percent > 100
                          ? 'bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-100'
                          : 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      }`}
                    >
                      {percent}% {isIncome ? (language === 'id' ? 'Terealisasi' : 'Realized') : (language === 'id' ? 'Terpakai' : 'Used')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>
                      {isIncome
                        ? (language === 'id' ? 'Selisih Pemasukan:' : 'Income Variance:')
                        : (language === 'id' ? 'Sisa Anggaran:' : 'Remaining Budget:')}
                    </span>
                    <span
                      className={`font-bold ${
                        diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatRupiah(diff)}
                    </span>
                  </div>
                </div>

                {/* Section 1: Rencana Pos Kategori */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>
                      {language === 'id' ? 'Rencana Pos' : 'Planned'} {isIncome ? (language === 'id' ? 'Pemasukan' : 'Income') : (language === 'id' ? 'Pengeluaran' : 'Expenses')} ({typeItems.length})
                    </span>
                  </h4>

                  {typeItems.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400">
                      {language === 'id' ? 'Belum ada pos rencana khusus yang ditambahkan pada anggaran ini.' : 'No specific planned items added to this budget yet.'}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {typeItems.map((item) => {
                        const cat = categories.find((c) => c.id === item.category_id);
                        const catRealized = matchingTxs
                          .filter((tx) => tx.category_id === item.category_id)
                          .reduce((s, t) => s + t.amount, 0);
                        const catPercent =
                          item.planned_amount > 0 ? Math.round((catRealized / item.planned_amount) * 100) : 0;

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex flex-col gap-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CategoryIcon
                                  iconName={cat?.icon || 'Circle'}
                                  color={cat?.color || '#3b82f6'}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {cat ? getCategoryDisplayName(cat.name, language) : (language === 'id' ? 'Pos Kategori' : 'Category Item')}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isIncome
                                    ? catRealized >= item.planned_amount
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : catRealized > item.planned_amount
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {catPercent}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {language === 'id' ? 'Rencana:' : 'Planned:'}{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {formatRupiah(item.planned_amount)}
                                </strong>
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {language === 'id' ? 'Realisasi:' : 'Actual:'}{' '}
                                <strong
                                  className={
                                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }
                                >
                                  {formatRupiah(catRealized)}
                                </strong>
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isIncome ? 'bg-emerald-500' : catPercent > 100 ? 'bg-rose-600' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(catPercent, 100)}%` }}
                              />
                            </div>

                            {/* Reminder Info */}
                            {item.reminder_enabled && item.reminder_date && (
                              <div className="mt-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 p-1.5 rounded-xl">
                                <span className="flex items-center gap-1 font-bold">
                                  <Bell className="w-3 h-3 text-amber-500" /> {language === 'id' ? 'Pengingat:' : 'Reminder:'} {item.reminder_date}
                                </span>
                                {item.reminder_note && (
                                  <span className="truncate max-w-[150px]">{item.reminder_note}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Daftar Transaksi Realisasi */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{language === 'id' ? 'Daftar Transaksi Realisasi' : 'Actual Transactions List'} ({matchingTxs.length})</span>
                  </h4>

                  {matchingTxs.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400">
                      {language === 'id' ? 'Belum ada transaksi realisasi pada periode anggaran ini.' : 'No actual transactions recorded during this budget period.'}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {matchingTxs.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.category_id);
                        return (
                          <div
                            key={tx.id}
                            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CategoryIcon
                                iconName={cat?.icon || 'Circle'}
                                color={cat?.color || '#64748b'}
                                className="w-4 h-4 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {tx.description || (cat ? getCategoryDisplayName(cat.name, language) : (language === 'id' ? 'Transaksi' : 'Transaction'))}
                                </p>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {tx.date} • {cat ? getCategoryDisplayName(cat.name, language) : (language === 'id' ? 'Umum' : 'General')}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`font-black text-xs shrink-0 ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM DELETE BUDGET CONFIRMATION MODAL */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setBudgetToDelete(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">{language === 'id' ? 'Konfirmasi Hapus Rencana Anggaran' : 'Confirm Delete Budget Plan'}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'id' ? (
                  <>Apakah Anda yakin ingin menghapus rencana anggaran <strong>"{getBudgetDisplayName(budgetToDelete.name, language)}"</strong>? Data perencanaan ini akan dihapus.</>
                ) : (
                  <>Are you sure you want to delete budget plan <strong>"{getBudgetDisplayName(budgetToDelete.name, language)}"</strong>? This budget plan data will be removed.</>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBudget(budgetToDelete.id);
                  setBudgetToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {language === 'id' ? 'Ya, Hapus Anggaran' : 'Yes, Delete Budget'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP-BY-STEP BUDGET WIZARD (PERSONAL & BUSINESS) */}
      {isBusinessWizardOpen && (
        <BusinessBudgetWizard
          isOpen={isBusinessWizardOpen}
          onClose={() => {
            setIsBusinessWizardOpen(false);
            setWizardEditingBudget(null);
            setWizardEditingItems([]);
          }}
          onSaveBudget={handleWizardSave}
          categories={categories}
          initialBudget={wizardEditingBudget || undefined}
          initialItems={wizardEditingItems}
          lockMode={wizardLockMode}
          defaultMode={wizardLockMode || (activeMode === 'personal' ? 'personal' : 'business')}
          language={language}
          transactions={transactions}
          budgets={budgets}
          budgetItems={budgetItems}
        />
      )}

      {/* SAMPLE REPORT & STEP-BY-STEP GUIDE MODAL (PDF) */}
      {isGuideModalOpen && (
        <BudgetGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          mode={guideModalMode}
          initialMonth={selectedMonthIndex === 'all' ? now.getMonth() : selectedMonthIndex}
          initialYear={selectedBudgetYear}
          onUseTemplate={(templateId, targetMonth, targetYear) => {
            setIsGuideModalOpen(false);
            if (targetMonth !== undefined) {
              setSelectedMonthIndex(targetMonth);
            }
            if (targetYear !== undefined) {
              setSelectedBudgetYear(targetYear);
            }
            handleOpenBusinessWizard(undefined, guideModalMode);
          }}
        />
      )}

      {/* INVENTORY & INVESTED CAPITAL MANAGEMENT MODAL */}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          mode={activeMode === 'personal' ? 'personal' : 'business'}
        />
      )}
    </div>
  );
};
