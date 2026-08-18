import React, { useState, useEffect, useRef } from 'react';
import { Account, Category, DocumentType, ModeType, ReceiptItem, StatementItem, TransactionType, Budget, BudgetItem } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { db } from '../lib/db';
import { SAMPLE_IMAGES, SampleImage } from '../lib/sampleImages';
import { formatRupiah, WORLD_CURRENCIES, formatAmountInput, parseAmountNumber } from '../lib/formatters';
import { compressImageBase64 } from '../lib/imageUtils';
import { sakukuStorage } from '../lib/sakukuStorage';
import { useLanguage } from '../context/LanguageContext';
import { parseVoiceToTransaction, ParsedVoiceTransaction } from '../lib/transactionVoiceParser';
import { startHybridVoiceRecognition, VoiceController, transcribeAudioFile, isSecureContextOrigin } from '../lib/voiceService';
import { BUSINESS_BUDGET_TEMPLATES, PERSONAL_BUDGET_TEMPLATES } from '../lib/budgetTemplates';
import {
  X,
  Camera,
  Image as ImageIcon,
  Edit3,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Store,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  Upload,
  Download,
  Trash2,
  Plus,
  Receipt,
  Percent,
  PieChart,
  Target,
  Folder,
  Mic,
  MicOff,
  Volume2,
  Smartphone,
  PenTool,
  Zap,
  Check,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  CornerDownLeft,
  ArrowLeft,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  budgets?: Budget[];
  initialSourceType?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
  activeMode?: 'all' | ModeType;
  onSaveSingle: (tx: {
    amount: number;
    description: string;
    date: string;
    account_id: string;
    category_id: string;
    mode: ModeType;
    type: TransactionType;
    source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
    voice_transcript?: string;
    attachment_path?: string;
  }) => void;
  onSaveMultiple: (txs: {
    amount: number;
    description: string;
    date: string;
    account_id: string;
    category_id: string;
    mode: ModeType;
    type: TransactionType;
    source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
    voice_transcript?: string;
    attachment_path?: string;
  }[]) => void;
  onSaveAccount?: (account: Account) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  budgets = [],
  initialSourceType = 'manual',
  activeMode = 'all',
  onSaveSingle,
  onSaveMultiple,
  onSaveAccount,
}) => {
  const { t, getCategoryDisplayName, getBudgetDisplayName, currency, language } = useLanguage();
  const currSymbol = WORLD_CURRENCIES.find((c) => c.code === currency)?.symbol || 'Rp';
  const [step, setStep] = useState<'method' | 'docType' | 'scanning' | 'statementList' | 'confirm' | 'voice'>('method');
  const [sourceType, setSourceType] = useState<'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice'>(initialSourceType);
  const [docType, setDocType] = useState<DocumentType>('receipt');

  // Budget & Non-budget switching state
  const [inputCategory, setInputCategory] = useState<'non-budget' | 'budget'>('non-budget'); // Default: non-budget
  const [budgetScopeFilter, setBudgetScopeFilter] = useState<'personal' | 'business'>(
    activeMode === 'business' ? 'business' : 'personal'
  );
  const [activeBudgetTab, setActiveBudgetTab] = useState<string>(
    activeMode === 'business' ? 'biz_a' : 'personal'
  );
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<{
    budget: Budget;
    item: BudgetItem;
    category?: Category;
    remainingAmount: number;
  } | null>(null);
  const [budgetItemTypeFilter, setBudgetItemTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [isNonBudgetDropdownOpen, setIsNonBudgetDropdownOpen] = useState<boolean>(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState<boolean>(false);

  // Helper for local date string YYYY-MM-DD
  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Single form fields
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayLocalDateStr());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [mode, setMode] = useState<ModeType>(activeMode === 'business' ? 'business' : 'personal');
  const [targetBusinessName, setTargetBusinessName] = useState<string | undefined>(undefined);
  const [type, setType] = useState<TransactionType>('expense');
  // Helper for attractive business emoji icon
  const getBusinessEmoji = (name: string, type?: string) => {
    const lower = (name + ' ' + (type || '')).toLowerCase();
    if (lower.includes('kopi') || lower.includes('fnb') || lower.includes('senja') || lower.includes('kafe') || lower.includes('cafe')) {
      return '☕';
    }
    if (lower.includes('sembako') || lower.includes('retail') || lower.includes('minimarket') || lower.includes('toko') || lower.includes('berkah')) {
      return '🛒';
    }
    if (lower.includes('bengkel') || lower.includes('workshop') || lower.includes('motor') || lower.includes('mobil') || lower.includes('autocare')) {
      return '🔧';
    }
    if (lower.includes('laundry') || lower.includes('cuci')) {
      return '🧺';
    }
    if (lower.includes('fashion') || lower.includes('butik') || lower.includes('konveksi') || lower.includes('busana') || lower.includes('harmoni')) {
      return '👗';
    }
    if (lower.includes('cipta') || lower.includes('bangun') || lower.includes('konstruksi') || lower.includes('proyek') || lower.includes('contractor') || lower.includes('kontraktor')) {
      return '🏗️';
    }
    if (lower.includes('digital') || lower.includes('solusi') || lower.includes('it') || lower.includes('software') || lower.includes('agency')) {
      return '💻';
    }
    return '🏢';
  };

  // Dynamic business units list for "Bisnis A, B, C, D, E, F, G" (Menjamin 7 contoh anggaran bisnis lengkap)
  const businessUnitsList = React.useMemo(() => {
    const list: { id: string; letter: string; name: string; type: string }[] = [];
    const foundNames = new Set<string>();

    // 1. First add from 7 standard business templates from PDF examples
    BUSINESS_BUDGET_TEMPLATES.forEach((tmpl) => {
      const cleanName = (tmpl.businessName || tmpl.name).trim();
      if (cleanName && !foundNames.has(cleanName)) {
        foundNames.add(cleanName);
        const letter = String.fromCharCode(65 + list.length);
        list.push({
          id: tmpl.id,
          letter,
          name: cleanName,
          type: tmpl.id,
        });
      }
    });

    // 2. Add any other business budgets created by user
    const allBudgets = budgets && budgets.length > 0 ? budgets : db.getBudgets();
    allBudgets
      .filter((b) => b.mode === 'business')
      .forEach((b) => {
        let cleanName = (b.business_name || b.name)
          .replace(/-\s*(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|May|June|July|August|September|October|November|December)\s*\d{4}/gi, '')
          .replace(/\s*\d{4}-\d{2}/g, '')
          .replace(/^Anggaran\s+(Bisnis\s+)?/i, '')
          .trim();
        if (cleanName && !foundNames.has(cleanName)) {
          foundNames.add(cleanName);
          const letter = String.fromCharCode(65 + list.length);
          list.push({
            id: b.id,
            letter,
            name: cleanName,
            type: b.business_type || 'business',
          });
        }
      });

    // 3. Add any additional business accounts
    accounts
      .filter((a) => a.scope === 'business' && a.business_name)
      .forEach((a) => {
        if (a.business_name && !foundNames.has(a.business_name)) {
          foundNames.add(a.business_name);
          const letter = String.fromCharCode(65 + list.length);
          list.push({
            id: a.id,
            letter,
            name: a.business_name,
            type: 'business',
          });
        }
      });

    return list;
  }, [budgets, accounts]);

  // Quick Inline Account Creation
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'cash' | 'bank' | 'ewallet'>('bank');

  const handleQuickCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const createdAcc: Account = {
      id: `acc_${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType,
      scope: mode === 'business' ? 'business' : 'personal',
      business_name: mode === 'business' ? 'Bisnis Utama' : undefined,
      opening_balance: 0,
      current_balance: 0,
      is_active: true,
    };
    onSaveAccount?.(createdAcc);
    setSelectedAccountId(createdAcc.id);
    setNewAccName('');
    setIsCreatingAccount(false);
  };

  // Multi-item Receipt Breakdown state
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [taxAmount, setTaxAmount] = useState<string>('0');

  // Single transaction Qty & Item Price calculator state
  const [showQtyCalc, setShowQtyCalc] = useState(false);
  const [itemQty, setItemQty] = useState('1');
  const [itemUnitPrice, setItemUnitPrice] = useState('');

  const handleCalcQtyChange = (qtyVal: string) => {
    const cleaned = qtyVal.replace(/\D/g, '');
    setItemQty(cleaned);
    const qNum = parseInt(cleaned, 10) || 1;
    const pNum = parseAmountNumber(itemUnitPrice);
    if (pNum > 0) {
      setAmount(formatAmountInput(qNum * pNum));
    }
  };

  const handleCalcUnitPriceChange = (priceVal: string) => {
    const formatted = formatAmountInput(priceVal);
    setItemUnitPrice(formatted);
    const qNum = parseInt(itemQty, 10) || 1;
    const pNum = parseAmountNumber(priceVal);
    setAmount(formatAmountInput(qNum * pNum));
  };

  // Statement list fields for bank statement multi-select
  const [statementItems, setStatementItems] = useState<StatementItem[]>([]);

  // Scanning & Camera status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMessage, setScanMessage] = useState('Menganalisis dokumen dengan AI Gemini...');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Live Camera State
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Voice AI Recognition State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribingAi, setIsTranscribingAi] = useState(false);
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [voiceTimer, setVoiceTimer] = useState(0);
  const [voiceAudioLevel, setVoiceAudioLevel] = useState(1);
  const voiceControllerRef = useRef<VoiceController | null>(null);
  const [voiceAIHighlight, setVoiceAIHighlight] = useState<ParsedVoiceTransaction | null>(null);

  // Form Auto-Advance and Field Step Highlighter State
  const [activeStepField, setActiveStepField] = useState<'amount' | 'category' | 'account' | 'description' | 'date'>('amount');
  const [highlightFieldAnimation, setHighlightFieldAnimation] = useState<string | null>(null);

  // Voice Timer Interval
  useEffect(() => {
    let timerInterval: any = null;
    let waveInterval: any = null;
    if (isListening) {
      timerInterval = setInterval(() => {
        setVoiceTimer((prev) => prev + 1);
      }, 1000);
      waveInterval = setInterval(() => {
        // Subtle fallback wave if analyser is idle
        setVoiceAudioLevel((prev) => Math.max(1, (prev % 6) + 1));
      }, 200);
    } else {
      clearInterval(timerInterval);
      clearInterval(waveInterval);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (waveInterval) clearInterval(waveInterval);
    };
  }, [isListening]);

  // Clean up voice controller on unmount or close
  useEffect(() => {
    return () => {
      if (voiceControllerRef.current) {
        voiceControllerRef.current.cancel();
      }
    };
  }, []);

  // Voice Recognition Controls (Hybrid: Web Speech API + Audio MediaRecorder + Gemini AI Fallback)
  const startVoiceRecording = async () => {
    setVoiceTranscript('');
    setVoiceInterimText('');
    setVoiceTimer(0);
    setVoiceErrorMessage(null);
    setStep('voice');

    if (voiceControllerRef.current) {
      voiceControllerRef.current.cancel();
    }

    setIsListening(true);
    setIsTranscribingAi(false);

    try {
      const controller = await startHybridVoiceRecognition({
        language: language === 'en' ? 'en' : 'id',
        onTranscript: (finalText) => {
          setVoiceTranscript(finalText);
          setVoiceInterimText('');
          // Live parse preview
          const parsed = parseVoiceToTransaction(finalText, categories, accounts, activeMode as ('all' | ModeType));
          setVoiceAIHighlight(parsed);
        },
        onInterim: (interimText) => {
          setVoiceInterimText(interimText);
        },
        onAudioLevel: (level) => {
          setVoiceAudioLevel(level);
        },
        onError: (err) => {
          setVoiceErrorMessage(err);
        },
        onAiProcessingStart: () => {
          setIsTranscribingAi(true);
        },
        onStart: () => {
          setIsListening(true);
        },
        onEnd: () => {
          setIsListening(false);
          setIsTranscribingAi(false);
        },
      });

      voiceControllerRef.current = controller;
    } catch (e: any) {
      console.warn('Speech recognition init failure:', e);
      setIsListening(false);
      setVoiceErrorMessage(e.message || 'Gagal memulai perekaman suara.');
    }
  };

  const stopVoiceRecording = async () => {
    setIsListening(false);
    if (voiceControllerRef.current) {
      await voiceControllerRef.current.stop();
    }
  };

  const handleProcessVoiceResult = (spokenText: string) => {
    stopVoiceRecording();
    const textToProcess = (spokenText || voiceTranscript || voiceInterimText || '').trim();
    if (!textToProcess) {
      alert('Silakan berbicara atau pilih contoh suara di bawah.');
      return;
    }

    const parsed = parseVoiceToTransaction(textToProcess, categories, accounts, activeMode as ('all' | ModeType));
    setVoiceAIHighlight(parsed);
    setVoiceTranscript(textToProcess);

    if (parsed.amount > 0) {
      setAmount(formatAmountInput(parsed.amount));
    }
    setType(parsed.type);
    if (parsed.suggestedCategoryId) {
      setSelectedCategoryId(parsed.suggestedCategoryId);
    }
    if (parsed.suggestedAccountId) {
      setSelectedAccountId(parsed.suggestedAccountId);
    }
    if (parsed.suggestedMode) {
      setMode(parsed.suggestedMode);
    }
    if (parsed.description) {
      setDescription(parsed.description);
    }
    if (parsed.date) {
      setDate(parsed.date);
    }

    setSourceType('voice');
    setDocType('voice' as any);
    setActiveStepField('amount');
    setHighlightFieldAnimation('all');
    setTimeout(() => setHighlightFieldAnimation(null), 2500);
    setStep('confirm');
  };

  // Helper for quick nominal chips & auto advance
  const handleSelectQuickAmount = (val: number, isAddition = false) => {
    if (isAddition) {
      const current = parseAmountNumber(amount);
      const next = current + val;
      setAmount(formatAmountInput(next));
    } else {
      setAmount(formatAmountInput(val));
    }
    // Highlight effect & Auto-advance to category
    setHighlightFieldAnimation('amount');
    setTimeout(() => {
      setHighlightFieldAnimation(null);
      setActiveStepField('category');
    }, 400);
  };

  const handleSelectCategoryWithAutoAdvance = (catId: string) => {
    setSelectedCategoryId(catId);
    setHighlightFieldAnimation('category');
    setTimeout(() => {
      setHighlightFieldAnimation(null);
      setActiveStepField('account');
    }, 350);
  };

  const handleSelectAccountWithAutoAdvance = (accId: string) => {
    setSelectedAccountId(accId);
    const chosenAcc = accounts.find((a) => a.id === accId);
    if (chosenAcc) {
      if (chosenAcc.scope === 'personal') setMode('personal');
      else if (chosenAcc.scope === 'business') setMode('business');
    }
    setHighlightFieldAnimation('account');
    setTimeout(() => {
      setHighlightFieldAnimation(null);
      setActiveStepField('description');
    }, 350);
  };

  // Hidden file input refs for direct native camera & gallery access
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const modalBodyRef = React.useRef<HTMLDivElement | null>(null);

  // Extract distinct business entities from accounts list (Bisnis A, Bisnis B, etc.)
  const distinctBusinesses = React.useMemo(() => {
    const map = new Map<string, { name: string; accounts: Account[] }>();
    accounts.forEach((acc) => {
      if (acc.scope === 'business' || acc.scope === 'combined') {
        const bName = acc.business_name || acc.name || 'Bisnis Utama';
        if (!map.has(bName)) {
          map.set(bName, { name: bName, accounts: [] });
        }
        map.get(bName)!.accounts.push(acc);
      }
    });
    return Array.from(map.values());
  }, [accounts]);

  const startCamera = async () => {
    setCameraError(null);
    setIsLiveCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan tombol "Buka Kamera HP" atau "Pilih dari Galeri".');
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsLiveCamera(false);
  };

  const takePhotoFromStream = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawBase64 = canvas.toDataURL('image/jpeg', 0.8);
      stopCamera();
      const compressed = await compressImageBase64(rawBase64, 800, 800, 0.6);
      processImageOcr(compressed, docType);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('method'); // Always start on interactive input selector screen
      setSourceType(initialSourceType);
      if (initialSourceType !== 'manual') {
        setDocType(initialSourceType as DocumentType);
      }
      resetForm();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [step]);

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);

    // Choose default mode based on currently active view context (activeMode)
    const initialMode: ModeType = activeMode === 'business' ? 'business' : 'personal';
    setMode(initialMode);

    // Pick best default account matching activeMode
    let defaultAcc = accounts.find((a) => {
      if (activeMode === 'business') return a.scope === 'business' || a.scope === 'combined';
      if (activeMode === 'personal') return a.scope === 'personal' || a.scope === 'combined';
      return true;
    });
    if (!defaultAcc && accounts.length > 0) defaultAcc = accounts[0];

    if (defaultAcc) {
      setSelectedAccountId(defaultAcc.id);
      if (defaultAcc.scope === 'personal') setMode('personal');
      else if (defaultAcc.scope === 'business') setMode('business');
      else setMode(initialMode);
    }

    setType('expense');
    setStatementItems([]);
    setReceiptItems([]);
    setTaxAmount('0');
    setPreviewImage(null);
    setCameraError(null);

    // Reset budget connection state
    setInputCategory('non-budget');
    setSelectedBudgetId(null);
    setSelectedBudgetItem(null);
    setBudgetItemTypeFilter('all');

    // Default category
    const defaultExpenseCat = categories.find((c) => c.type === 'expense')?.id || '';
    setSelectedCategoryId(defaultExpenseCat);
  };

  // Computed available budgets list for "Item Penganggaran" Step 1
  const availableBudgets = React.useMemo(() => {
    if (!isOpen) return [];
    const bList = budgets && budgets.length > 0 ? budgets : db.getBudgets();
    const itemsList = db.getBudgetItems();
    const txsList = db.getTransactions();

    return bList.map((b) => {
      const bItems = itemsList.filter((bi) => bi.budget_id === b.id);
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      bEnd.setHours(23, 59, 59, 999);

      const totalPlanned = bItems.reduce((s, item) => s + item.planned_amount, 0);

      const bTxs = txsList.filter((tx) => {
        const d = new Date(tx.date);
        const inPeriod = d >= bStart && d <= bEnd;
        const isModeMatch = b.mode === 'all' ? true : tx.mode === b.mode;
        return inPeriod && isModeMatch && bItems.some((bi) => bi.category_id === tx.category_id);
      });

      const totalRealized = bTxs.reduce((s, t) => s + t.amount, 0);

      return {
        budget: b,
        itemsCount: bItems.length,
        totalPlanned,
        totalRealized,
      };
    });
  }, [budgets, isOpen]);

  // Computed available budget items for "Item Penganggaran" Step 2
  const availableBudgetItems = React.useMemo(() => {
    if (!isOpen) return [];
    const bList = budgets && budgets.length > 0 ? budgets : db.getBudgets();
    const itemsList = db.getBudgetItems();
    const txsList = db.getTransactions();

    const result: Array<{
      budget: Budget;
      item: BudgetItem;
      category?: Category;
      realizedAmount: number;
      remainingAmount: number;
      percent: number;
      type: TransactionType;
    }> = [];

    itemsList.forEach((bi) => {
      const b = bList.find((bg) => bg.id === bi.budget_id);
      if (!b) return;

      const cat = categories.find((c) => c.id === bi.category_id);
      const itemType: TransactionType = cat?.type || 'expense';

      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      bEnd.setHours(23, 59, 59, 999);

      const catTxs = txsList.filter((tx) => {
        const d = new Date(tx.date);
        const inPeriod = d >= bStart && d <= bEnd;
        const isModeMatch = b.mode === 'all' ? true : tx.mode === b.mode;
        return inPeriod && isModeMatch && tx.category_id === bi.category_id && tx.type === itemType;
      });

      const realized = catTxs.reduce((s, t) => s + t.amount, 0);
      const remaining = Math.max(0, bi.planned_amount - realized);
      const pct = bi.planned_amount > 0 ? Math.round((realized / bi.planned_amount) * 100) : 0;

      result.push({
        budget: b,
        item: bi,
        category: cat,
        realizedAmount: realized,
        remainingAmount: remaining,
        percent: pct,
        type: itemType,
      });
    });

    return result;
  }, [budgets, categories, isOpen]);

  const displayedBudgetItems = availableBudgetItems.filter((bi) => {
    if (selectedBudgetId && bi.budget.id !== selectedBudgetId) return false;
    if (budgetItemTypeFilter === 'all') return true;
    return bi.type === budgetItemTypeFilter;
  });

  const downloadReceiptImage = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `foto_struk_sakuku_${new Date().toISOString().split('T')[0]}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleItemChange = (id: string, field: 'name' | 'qty' | 'price', value: any) => {
    setReceiptItems((prev) => {
      const matchItem =
        field === 'name' && typeof value === 'string' && value.trim().length >= 2
          ? prev.find(
              (it) =>
                it.id !== id &&
                it.name &&
                it.name.trim().toLowerCase() === value.trim().toLowerCase() &&
                (it.price > 0 || it.qty > 1)
            )
          : null;

      return prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (matchItem) {
          updated.qty = matchItem.qty;
          updated.price = matchItem.price;
          updated.total = matchItem.qty * matchItem.price;
        } else if (field === 'qty' || field === 'price') {
          const q = field === 'qty' ? Math.max(1, parseFloat(value) || 0) : item.qty;
          const p = field === 'price' ? Math.max(0, parseFloat(value) || 0) : item.price;
          updated.qty = q;
          updated.price = p;
          updated.total = q * p;
        }
        return updated;
      });
    });
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `rc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: language === 'en' ? 'New Item' : 'Item Baru',
      qty: 1,
      price: 0,
      total: 0,
      selected: true,
    };
    setReceiptItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setReceiptItems((prev) => prev.filter((it) => it.id !== id));
  };

  const toggleReceiptItemSelect = (id: string) => {
    setReceiptItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Recalculate totals automatically
  const activeReceiptItems = receiptItems.filter((i) => i.selected);
  const itemsSubtotal = activeReceiptItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const numericTax = parseFloat(taxAmount) || 0;
  const itemsGrandTotal = itemsSubtotal + numericTax;

  useEffect(() => {
    if (receiptItems.length > 0) {
      setAmount(itemsGrandTotal.toString());
    }
  }, [receiptItems, taxAmount]);

  useEffect(() => {
    if (step === 'confirm' && (docType === 'receipt' || sourceType === 'receipt') && receiptItems.length === 0) {
      const numTotal = parseFloat(amount) || 0;
      setReceiptItems([
        {
          id: `rc_0_${Date.now()}`,
          name: language === 'en' ? 'Receipt Item 1' : 'Item 1 (Edit Jika Perlu)',
          qty: 1,
          price: numTotal,
          total: numTotal,
          selected: true,
        },
      ]);
    }
  }, [step, docType, sourceType]);

  if (!isOpen) return null;

  const translateOcrDescription = (desc: string): string => {
    if (!desc) return '';
    if (language === 'en') {
      const lower = desc.toLowerCase().trim();
      if (
        lower.includes('gambar tidak dapat dibaca') ||
        lower.includes('tidak dapat dibaca') ||
        lower.includes('unreadable')
      ) {
        return 'Unreadable image (blurry)';
      }
      if (lower.includes('struk indomaret')) {
        return 'Indomaret Receipt - Grocery, Oil, Eggs 1kg';
      }
      if (lower.includes('catatan tangan')) {
        return 'Handwritten Note: Daily Cashier Wage Payment';
      }
      if (lower.includes('mutasi rekening')) {
        return 'Bank Account Statement';
      }
      if (lower.includes('belanja stok sembako')) {
        return 'Store Grocery & Oil Stock Purchase';
      }
      if (lower.includes('catatan pengeluaran harian')) {
        return 'Daily Store Cashier Expense Note';
      }
      if (lower.includes('transaksi dari scan ai')) {
        return 'AI Scanned Transaction';
      }
    }
    return desc;
  };

  // Process uploaded image or sample
  const processImageOcr = async (base64Data: string, docKind: DocumentType, sample?: SampleImage) => {
    setIsAnalyzing(true);
    setStep('scanning');
    setPreviewImage(base64Data);

    // Auto-check and save into SakuKu structured folder hierarchy
    try {
      sakukuStorage
        .saveReceiptPhoto(base64Data, {
          date: date || new Date().toISOString().slice(0, 10),
          categoryName: 'Foto_Struk_Input',
          description: 'Foto Bukti Transaksi',
        })
        .catch((err) => console.warn('Auto-save receipt photo error:', err));
    } catch (e) {
      console.warn('Auto-save error:', e);
    }

    try {
      if (sample) {
        // Instant sample loader for testing OCR UI immediately!
        await new Promise((r) => setTimeout(r, 1200)); // smooth scanning animation

        if (sample.mockResult.statementItems && sample.mockResult.statementItems.length > 0) {
          const defaultIncCat = categories.find((c) => c.type === 'income')?.id || categories[0]?.id || '';
          const defaultExpCat = categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '';

          const formattedItems: StatementItem[] = sample.mockResult.statementItems.map((item, idx) => {
            const itemType: TransactionType = item.type === 'income' ? 'income' : 'expense';
            const matchedCat = categories.find(
              (c) => c.type === itemType && c.name.toLowerCase() === (item.categoryName || '').toLowerCase()
            ) || categories.find(
              (c) => c.name.toLowerCase() === (item.categoryName || '').toLowerCase()
            );

            return {
              id: `st_${idx}_${Date.now()}`,
              date: item.date,
              description: translateOcrDescription(item.description),
              amount: item.amount,
              type: itemType,
              category_id: matchedCat?.id || (itemType === 'income' ? defaultIncCat : defaultExpCat),
              mode: mode,
              selected: true,
            };
          });
          setStatementItems(formattedItems);
          setIsAnalyzing(false);
          setStep('statementList');
          return;
        } else {
          setAmount(sample.mockResult.amount.toString());
          setDescription(translateOcrDescription(sample.mockResult.description));
          setType(sample.mockResult.suggestedType);

          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === sample.mockResult.suggestedCategoryName.toLowerCase()
          );
          if (matchedCat) setSelectedCategoryId(matchedCat.id);

          // Sample receipt breakdown if testing receipt sample
          if (docKind === 'receipt') {
            const total = sample.mockResult.amount;
            setReceiptItems([
              { id: 'sample_1', name: 'Minyak Goreng 2L', qty: 1, price: Math.round(total * 0.6), total: Math.round(total * 0.6), selected: true },
              { id: 'sample_2', name: 'Beras Premium 5kg', qty: 1, price: Math.round(total * 0.4), total: Math.round(total * 0.4), selected: true },
            ]);
            setTaxAmount('0');
          } else {
            setReceiptItems([]);
            setTaxAmount('0');
          }

          setIsAnalyzing(false);
          setStep('confirm');
          return;
        }
      }

      // Real AI Call to server endpoint /api/ocr
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, documentType: docKind, language }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn('OCR endpoint returned non-JSON response:', res.status, text.slice(0, 100));
        data = { success: false, error: 'Server returned HTML or invalid response format' };
      }

      setIsAnalyzing(false);

      if (data.success) {
        if (data.statementItems && data.statementItems.length > 0) {
          const defaultIncCat = categories.find((c) => c.type === 'income')?.id || categories[0]?.id || '';
          const defaultExpCat = categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '';

          const formattedItems: StatementItem[] = data.statementItems.map((item: any, idx: number) => {
            const itemType: TransactionType = item.type === 'income' ? 'income' : 'expense';
            const matchedCat = categories.find(
              (c) => c.type === itemType && c.name.toLowerCase() === (item.categoryName || '').toLowerCase()
            ) || categories.find(
              (c) => c.name.toLowerCase() === (item.categoryName || '').toLowerCase()
            );

            return {
              id: `st_${idx}_${Date.now()}`,
              date: item.date || getTodayLocalDateStr(),
              description: translateOcrDescription(item.description),
              amount: item.amount,
              type: itemType,
              category_id: matchedCat?.id || (itemType === 'income' ? defaultIncCat : defaultExpCat),
              mode: mode,
              selected: true,
            };
          });
          setStatementItems(formattedItems);
          setStep('statementList');
        } else {
          setAmount((data.amount || 0).toString());
          setDescription(translateOcrDescription(data.description || (language === 'en' ? 'AI Scanned Transaction' : 'Transaksi')));
          if (data.date) setDate(data.date);
          if (data.suggestedType) setType(data.suggestedType);

          if (data.suggestedCategoryName) {
            const matchedCat = categories.find(
              (c) => c.name.toLowerCase() === data.suggestedCategoryName.toLowerCase()
            );
            if (matchedCat) setSelectedCategoryId(matchedCat.id);
          }

          if (data.receiptItems && data.receiptItems.length > 0) {
            const parsedItems: ReceiptItem[] = data.receiptItems.map((item: any, idx: number) => ({
              id: `rc_${idx}_${Date.now()}`,
              name: item.name || `Item ${idx + 1}`,
              qty: item.qty || 1,
              price: item.price || 0,
              total: item.total || (item.qty || 1) * (item.price || 0),
              selected: true,
            }));
            setReceiptItems(parsedItems);
          } else {
            const numTotal = parseFloat(data.amount || '0') || 0;
            setReceiptItems([
              {
                id: `rc_0_${Date.now()}`,
                name: data.description && !data.description.includes('blur')
                  ? data.description
                  : (language === 'en' ? 'Item 1' : 'Item 1'),
                qty: 1,
                price: numTotal,
                total: numTotal,
                selected: true,
              },
            ]);
          }

          if (data.tax !== undefined && data.tax !== null) {
            setTaxAmount(data.tax.toString());
          } else {
            setTaxAmount('0');
          }

          setStep('confirm');
        }
      } else {
        // Fallback to manual form if OCR fails
        if (docKind === 'receipt') {
          setReceiptItems([
            {
              id: `rc_0_${Date.now()}`,
              name: language === 'en' ? 'Item 1 (Edit Name/Price)' : 'Item 1 (Edit Nama/Harga)',
              qty: 1,
              price: parseFloat(amount) || 0,
              total: parseFloat(amount) || 0,
              selected: true,
            },
          ]);
        }
        alert(language === 'en' ? 'Unable to process image, please enter details manually.' : 'Tidak dapat memproses gambar, silakan isi manual.');
        setStep('confirm');
      }
    } catch (e) {
      console.error(e);
      if (docKind === 'receipt') {
        setReceiptItems([
          {
            id: `rc_0_${Date.now()}`,
            name: language === 'en' ? 'Item 1 (Edit Name/Price)' : 'Item 1 (Edit Nama/Harga)',
            qty: 1,
            price: parseFloat(amount) || 0,
            total: parseFloat(amount) || 0,
            selected: true,
          },
        ]);
      }
      setIsAnalyzing(false);
      setStep('confirm');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, overrideDocType?: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetDocType = overrideDocType || docType;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const compressed = await compressImageBase64(rawBase64, 800, 800, 0.65);
      processImageOcr(compressed, targetDocType);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseAmountNumber(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Masukkan nominal yang valid.');
      return;
    }
    if (!selectedAccountId) {
      alert('Pilih akun penyimpanan.');
      return;
    }

    let finalDesc = description || 'Tanpa keterangan';
    if (receiptItems.length > 0) {
      const activeItems = receiptItems.filter((i) => i.selected);
      if (activeItems.length > 0) {
        const itemLines = activeItems
          .map((i) => `• ${i.name} (${i.qty}x @ ${formatRupiah(i.price)} = ${formatRupiah(i.total)})`)
          .join('\n');
        const taxLine = numericTax > 0 ? `\nPajak (PPN): ${formatRupiah(numericTax)}` : '';
        finalDesc = `${description || (language === 'en' ? 'Multi-Item Receipt' : 'Struk Belanja Multi-Item')}\n\nRincian Item:\n${itemLines}${taxLine}`;
      }
    } else if (showQtyCalc && itemUnitPrice && parseAmountNumber(itemUnitPrice) > 0) {
      const qNum = parseInt(itemQty, 10) || 1;
      finalDesc = `${finalDesc} (${qNum}x @ ${formatRupiah(parseAmountNumber(itemUnitPrice))})`;
    }

    // Auto-save receipt photo to structured SakuKu directory
    if (previewImage) {
      const catName = categories.find((c) => c.id === selectedCategoryId)?.name;
      sakukuStorage.saveReceiptPhoto(previewImage, {
        date,
        amount: numAmount,
        categoryName: catName,
        description: finalDesc,
      }).catch((err) => console.warn('Failed to auto-save to SakuKu folder:', err));
    }

    onSaveSingle({
      amount: numAmount,
      description: finalDesc,
      date,
      account_id: selectedAccountId,
      category_id: selectedCategoryId || categories[0]?.id || '',
      mode,
      type,
      source_type: sourceType,
      voice_transcript: sourceType === 'voice' ? (voiceTranscript || finalDesc) : undefined,
      attachment_path: previewImage || undefined,
    });
    onClose();
  };

  const handleSaveMultiItemTransactions = () => {
    const activeItems = receiptItems.filter((i) => i.selected && i.total > 0);
    if (activeItems.length === 0) {
      alert('Pilih setidaknya 1 item dari bon.');
      return;
    }
    if (!selectedAccountId) {
      alert('Pilih akun penyimpanan.');
      return;
    }

    if (previewImage) {
      const catName = categories.find((c) => c.id === selectedCategoryId)?.name || 'Struk Belanja';
      sakukuStorage.saveReceiptPhoto(previewImage, {
        date,
        amount: itemsGrandTotal,
        categoryName: catName,
        description: description || 'Multi-item Receipt',
      }).catch((err) => console.warn('Failed to auto-save to SakuKu folder:', err));
    }

    const txsToSave = activeItems.map((item) => ({
      amount: item.total,
      description: `${item.name} (${item.qty}x @ ${formatRupiah(item.price)})`,
      date,
      account_id: selectedAccountId,
      category_id: selectedCategoryId || categories[0]?.id || '',
      mode,
      type,
      source_type: sourceType,
      attachment_path: previewImage || undefined,
    }));

    if (numericTax > 0) {
      const taxCat = categories.find((c) => c.name.toLowerCase().includes('tagihan') || c.name.toLowerCase().includes('lain'))?.id || selectedCategoryId;
      txsToSave.push({
        amount: numericTax,
        description: `Pajak Bon (PPN) - ${description || 'Struk Belanja'}`,
        date,
        account_id: selectedAccountId,
        category_id: taxCat,
        mode,
        type,
        source_type: sourceType,
        attachment_path: previewImage || undefined,
      });
    }

    onSaveMultiple(txsToSave);
    onClose();
  };

  const handleSaveSelectedStatementItems = () => {
    const selectedItems = statementItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      alert('Pilih setidaknya 1 transaksi yang akan disimpan.');
      return;
    }

    if (previewImage) {
      sakukuStorage.saveReceiptPhoto(previewImage, {
        date,
        description: 'Mutasi Rekening / Dokumen Finansial',
      }).catch((err) => console.warn('Failed to auto-save to SakuKu folder:', err));
    }

    const txsToSave = selectedItems.map((item) => ({
      amount: item.amount,
      description: item.description,
      date: item.date,
      account_id: selectedAccountId || accounts[0]?.id || '',
      category_id: item.category_id || categories[0]?.id || '',
      mode: mode,
      type: item.type, // 'income' or 'expense'
      source_type: sourceType,
      attachment_path: previewImage || undefined,
    }));

    onSaveMultiple(txsToSave);
    onClose();
  };

  // Toggle item selection in statement list
  const toggleStatementItem = (id: string) => {
    setStatementItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Toggle transaction direction (income vs expense)
  const toggleStatementItemType = (id: string) => {
    setStatementItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextType: TransactionType = it.type === 'income' ? 'expense' : 'income';
        const defaultCat = categories.find((c) => c.type === nextType)?.id || categories[0]?.id || '';
        return { ...it, type: nextType, category_id: defaultCat };
      })
    );
  };

  // Update category of statement item
  const updateStatementItemCategory = (id: string, categoryId: string) => {
    setStatementItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, category_id: categoryId } : it))
    );
  };

  // Update description of statement item
  const updateStatementItemDescription = (id: string, description: string) => {
    setStatementItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, description } : it))
    );
  };

  // Update amount of statement item
  const updateStatementItemAmount = (id: string, amount: number) => {
    setStatementItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, amount } : it))
    );
  };

  // Update date of statement item
  const updateStatementItemDate = (id: string, date: string) => {
    setStatementItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, date } : it))
    );
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header Modal */}
        <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {sourceType === 'manual' ? (
                <Edit3 className="w-4 h-4 text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-yellow-300" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {step === 'method'
                  ? t('selectInputMethodHeader')
                  : step === 'docType'
                  ? t('cameraAndUploadHeader')
                  : step === 'scanning'
                  ? t('geminiScanHeader')
                  : step === 'statementList'
                  ? t('selectStatementTxHeader')
                  : t('recordFormHeader')}
              </h3>
              <p className="text-[10px] text-blue-100">
                {t('appSubtitleTag')}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div ref={modalBodyRef} className="p-5 overflow-y-auto flex-1">
          {/* STEP 0: INTERACTIVE INPUT METHOD SELECTOR */}
          {step === 'method' && (
            <div className="flex flex-col gap-3">
              {/* Dual Tab Switcher: Tetap seperti sebelumnya (Non Penganggaran vs Item Penganggaran) */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setInputCategory('non-budget');
                    setSelectedBudgetItem(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputCategory === 'non-budget'
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'id' ? 'Non Penganggaran' : 'Non-Budget Item'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputCategory('budget');
                    setSelectedBudgetItem(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputCategory === 'budget'
                      ? 'bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 shadow-xs border border-purple-200 dark:border-purple-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'id' ? 'Item Penganggaran' : 'Budgeted Item'}</span>
                </button>
              </div>

              {/* TARGET DROPDOWN FOR NON-BUDGET ITEM: MEMUAT PRIBADI & SELURUH RAP BISNIS CONTOH */}
              {inputCategory === 'non-budget' && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-850 dark:to-indigo-950/30 border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 shadow-2xs animate-fadeIn relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>🎯</span>
                      <span>Tujuan Input Transaksi:</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 truncate max-w-[150px]">
                      {mode === 'personal'
                        ? '🏡 Pribadi'
                        : `${getBusinessEmoji(targetBusinessName || businessUnitsList[0]?.name || '')} ${targetBusinessName || businessUnitsList[0]?.name || 'Bisnis'}`}
                    </span>
                  </div>

                  {/* Custom Compact Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNonBudgetDropdownOpen(!isNonBudgetDropdownOpen)}
                      className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between shadow-2xs cursor-pointer hover:border-indigo-400 transition-all"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {mode === 'personal' ? (
                          <>
                            <span>🏡</span>
                            <span>Pribadi: Anggaran Keluarga & Rumah Tangga</span>
                          </>
                        ) : (
                          <>
                            <span>{getBusinessEmoji(targetBusinessName || businessUnitsList[0]?.name || '')}</span>
                            <span>
                              Bisnis {businessUnitsList.find((b) => b.name === targetBusinessName)?.letter || 'A'}: {targetBusinessName || businessUnitsList[0]?.name}
                            </span>
                          </>
                        )}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isNonBudgetDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>

                    {/* Floating Popover List */}
                    {isNonBudgetDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Pribadi Section */}
                        <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/80 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                          🏡 Keperluan Pribadi & Rumah Tangga
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('personal');
                            setTargetBusinessName(undefined);
                            setIsNonBudgetDropdownOpen(false);
                          }}
                          className={`w-full text-left py-1.5 px-2.5 flex items-center justify-between text-[10px] font-bold transition-all hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer ${
                            mode === 'personal' ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-black' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🏡</span>
                            <span>Pribadi: Anggaran Keluarga & Rumah Tangga</span>
                          </span>
                          {mode === 'personal' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </button>

                        {/* Bisnis Section */}
                        <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/80 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                          🏢 Unit Usaha & RAP Bisnis
                        </div>
                        {businessUnitsList.map((biz) => {
                          const emoji = getBusinessEmoji(biz.name, biz.type);
                          const isSelected = mode === 'business' && (targetBusinessName === biz.name || (!targetBusinessName && biz === businessUnitsList[0]));
                          return (
                            <button
                              key={biz.id}
                              type="button"
                              onClick={() => {
                                setMode('business');
                                setTargetBusinessName(biz.name);
                                setIsNonBudgetDropdownOpen(false);
                              }}
                              className={`w-full text-left py-1.5 px-2.5 flex items-center justify-between text-[10px] font-bold transition-all hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer ${
                                isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-black' : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span>{emoji}</span>
                                <span>Bisnis {biz.letter}: {biz.name}</span>
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IF "Item Penganggaran" IS SELECTED AND NO ITEM PICKED YET */}
              {inputCategory === 'budget' && !selectedBudgetItem ? (
                <div className="flex flex-col gap-2 animate-fadeIn">
                  {/* DROPDOWN TARGET ANGGARAN: PRIBADI ATAU BISNIS (A / B / C / D dst) */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/50 dark:from-slate-850 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col gap-2 shadow-2xs relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>📁</span>
                        <span>Rencana Anggaran (Bulan Terakhir):</span>
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 truncate max-w-[180px]">
                        {activeBudgetTab === 'personal'
                          ? '🏡 Pribadi'
                          : `${getBusinessEmoji(businessUnitsList.find(b => b.id === activeBudgetTab)?.name || '')} Bisnis ${businessUnitsList.find(b => b.id === activeBudgetTab)?.letter || 'A'}`}
                      </span>
                    </div>

                    {/* Custom Compact Dropdown Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                        className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between shadow-2xs cursor-pointer hover:border-purple-400 transition-all"
                      >
                        <span className="truncate flex items-center gap-2">
                          {activeBudgetTab === 'personal' ? (
                            <>
                              <span>🏡</span>
                              <span>Pribadi: Anggaran Keluarga & Rumah Tangga</span>
                            </>
                          ) : (
                            <>
                              <span>{getBusinessEmoji(businessUnitsList.find((b) => b.id === activeBudgetTab)?.name || '')}</span>
                              <span>
                                Bisnis {businessUnitsList.find((b) => b.id === activeBudgetTab)?.letter || 'A'}: {businessUnitsList.find((b) => b.id === activeBudgetTab)?.name}
                              </span>
                            </>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBudgetDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                      </button>

                      {/* Floating Popover List */}
                      {isBudgetDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {/* Pribadi Section */}
                          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            🏡 Anggaran Pribadi
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBudgetTab('personal');
                              setIsBudgetDropdownOpen(false);
                            }}
                            className={`w-full text-left py-2.5 px-3 flex items-center justify-between text-xs sm:text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer ${
                              activeBudgetTab === 'personal' ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>🏡</span>
                              <span>Pribadi: Anggaran Keluarga & Rumah Tangga</span>
                            </span>
                            {activeBudgetTab === 'personal' && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                          </button>

                          {/* Bisnis Section */}
                          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            🏢 Rencana Anggaran Bisnis (RAP)
                          </div>
                          {businessUnitsList.map((biz) => {
                            const emoji = getBusinessEmoji(biz.name, biz.type);
                            const isSelected = activeBudgetTab === biz.id;
                            return (
                              <button
                                key={biz.id}
                                type="button"
                                onClick={() => {
                                  setActiveBudgetTab(biz.id);
                                  setIsBudgetDropdownOpen(false);
                                }}
                                className={`w-full text-left py-2.5 px-3 flex items-center justify-between text-xs sm:text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer ${
                                  isSelected ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black' : 'text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span>{emoji}</span>
                                  <span>Bisnis {biz.letter}: {biz.name}</span>
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TAMPILKAN SELURUH ITEM ANGGARAN DARI PILIHAN TERSEBUT (BULAN TERAKHIR) */}
                  {(() => {
                    const allB = (budgets && budgets.length > 0 ? budgets : db.getBudgets())
                      .slice()
                      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

                    let chosenBudget: Budget | undefined = undefined;
                    let isBiz = false;
                    let displayedItems: Array<{
                      budget: Budget;
                      item: BudgetItem;
                      category?: Category;
                      remainingAmount: number;
                      type: TransactionType;
                      cleanItemName: string;
                    }> = [];

                    const catMap = new Map<string, Category>(categories.map((c): [string, Category] => [c.id, c]));

                    if (activeBudgetTab === 'personal') {
                      chosenBudget = allB.find((b) => b.mode === 'personal' || b.mode === 'all');
                      isBiz = false;
                    } else {
                      const currentBiz = businessUnitsList.find((b) => b.id === activeBudgetTab);
                      if (currentBiz) {
                        chosenBudget = allB.find((b) => {
                          if (b.mode !== 'business') return false;
                          const bName = (b.business_name || b.name).toLowerCase();
                          return (
                            bName.includes(currentBiz.name.toLowerCase()) ||
                            currentBiz.name.toLowerCase().includes(bName) ||
                            b.business_type === currentBiz.type ||
                            b.template_id === currentBiz.type ||
                            b.template_id === currentBiz.id
                          );
                        });
                      }
                      if (!chosenBudget) {
                        chosenBudget = allB.find((b) => b.mode === 'business');
                      }
                      isBiz = true;
                    }

                    const currentBiz = businessUnitsList.find((b) => b.id === activeBudgetTab);
                    const tmpl = activeBudgetTab === 'personal'
                      ? PERSONAL_BUDGET_TEMPLATES[0]
                      : (
                          BUSINESS_BUDGET_TEMPLATES.find((t) => t.id === activeBudgetTab) ||
                          BUSINESS_BUDGET_TEMPLATES.find((t) => currentBiz && (
                            t.name.toLowerCase().includes(currentBiz.name.toLowerCase()) ||
                            currentBiz.name.toLowerCase().includes((t.businessName || '').toLowerCase()) ||
                            currentBiz.name.toLowerCase().includes(t.name.toLowerCase())
                          )) ||
                          BUSINESS_BUDGET_TEMPLATES[0]
                        );

                    const effectiveBudget: Budget = chosenBudget || {
                      id: tmpl.id,
                      name: tmpl.name,
                      start_date: `${new Date().getFullYear()}-01-01`,
                      end_date: `${new Date().getFullYear()}-12-31`,
                      total_planned_amount: parseAmountNumber(tmpl.items.reduce((s, i) => s + (parseAmountNumber(i.plannedAmount) || 0), 0).toString()),
                      total_income_target: 0,
                      mode: tmpl.mode || 'business',
                      business_type: tmpl.id,
                      template_id: tmpl.id,
                      business_name: tmpl.businessName || tmpl.name,
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };

                    const bItemsFromDb = chosenBudget ? db.getBudgetItems(chosenBudget.id) : [];

                    if (tmpl && tmpl.items && tmpl.items.length > 0) {
                      displayedItems = tmpl.items.map((it, idx) => {
                        const cat = categories.find((c) => 
                          c.name.toLowerCase() === it.categoryName.toLowerCase() ||
                          c.name.toLowerCase().includes(it.categoryName.toLowerCase()) || 
                          it.categoryName.toLowerCase().includes(c.name.toLowerCase())
                        ) || (it.itemType === 'income' ? categories.find(c => c.type === 'income') : categories.find(c => c.type === 'expense')) || categories[0];

                        const amt = parseAmountNumber(it.plannedAmount) || 0;
                        const matchingDbItem = bItemsFromDb.find(bi => 
                          (bi.reminder_note && bi.reminder_note.toLowerCase().includes(it.categoryName.toLowerCase())) ||
                          (bi.reminder_note && it.categoryName.toLowerCase().includes(bi.reminder_note.toLowerCase()))
                        );
                        const spent = matchingDbItem ? matchingDbItem.spent_amount : 0;
                        const remaining = Math.max(0, amt - spent);

                        return {
                          budget: effectiveBudget,
                          item: {
                            id: matchingDbItem ? matchingDbItem.id : `tmpl_item_${tmpl.id}_${idx}`,
                            budget_id: effectiveBudget.id,
                            category_id: cat?.id || (it.itemType === 'income' ? 'cat_inc_1' : 'cat_exp_1'),
                            planned_amount: amt,
                            spent_amount: spent,
                            reminder_enabled: !!it.reminderEnabled,
                            reminder_date: `${new Date().getFullYear()}-12-31`,
                            reminder_note: it.reminderNote || it.categoryName,
                            reminder_status: 'pending' as const,
                          },
                          category: cat,
                          remainingAmount: remaining,
                          type: it.itemType,
                          cleanItemName: it.categoryName,
                        };
                      });
                    }

                    if (displayedItems.length === 0) {
                      return (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/60 my-1">
                          <PieChart className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                            Belum Ada Rencana Anggaran untuk pilihan ini.
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Buat rencana anggaran terlebih dahulu di menu "Anggaran".
                          </p>
                        </div>
                      );
                    }

                    // Group items
                    const groupsMap: Record<string, typeof displayedItems> = {};

                    const getItemGroupName = (name: string, itemType: TransactionType, isBusiness: boolean) => {
                      const lower = name.toLowerCase();
                      if (itemType === 'income') {
                        return isBusiness ? '🟢 Pemasukan & Omzet Penjualan' : '🟢 Pendapatan & Pemasukan';
                      }
                      if (isBusiness) {
                        if (
                          lower.includes('kopi') ||
                          lower.includes('susu') ||
                          lower.includes('sirup') ||
                          lower.includes('beras') ||
                          lower.includes('minyak') ||
                          lower.includes('bahan') ||
                          lower.includes('stok') ||
                          lower.includes('sparepart') ||
                          lower.includes('oli') ||
                          lower.includes('kulakan') ||
                          lower.includes('barang dagangan') ||
                          lower.includes('kemasan') ||
                          lower.includes('cup') ||
                          lower.includes('deterjen') ||
                          lower.includes('parfum') ||
                          lower.includes('bumbu') ||
                          lower.includes('kain') ||
                          lower.includes('benang') ||
                          lower.includes('kancing') ||
                          lower.includes('resleting') ||
                          lower.includes('zipper') ||
                          lower.includes('ready mix') ||
                          lower.includes('besi') ||
                          lower.includes('semen') ||
                          lower.includes('bata') ||
                          lower.includes('pasir') ||
                          lower.includes('mortar')
                        ) {
                          return '📦 Bahan Baku & Persediaan Dagangan';
                        }
                        if (
                          lower.includes('gaji') ||
                          lower.includes('upah') ||
                          lower.includes('barista') ||
                          lower.includes('karyawan') ||
                          lower.includes('pegawai') ||
                          lower.includes('lembur') ||
                          lower.includes('mekanik') ||
                          lower.includes('kasir') ||
                          lower.includes('cuci') ||
                          lower.includes('setrika') ||
                          lower.includes('staf') ||
                          lower.includes('penjahit') ||
                          lower.includes('obras') ||
                          lower.includes('mandor') ||
                          lower.includes('tukang') ||
                          lower.includes('programmer') ||
                          lower.includes('designer') ||
                          lower.includes('tenaga')
                        ) {
                          return '👥 Gaji & Tenaga Kerja';
                        }
                        if (
                          lower.includes('cloud') ||
                          lower.includes('server') ||
                          lower.includes('aws') ||
                          lower.includes('api') ||
                          lower.includes('lisensi') ||
                          lower.includes('saas') ||
                          lower.includes('hosting') ||
                          lower.includes('domain')
                        ) {
                          return '💻 Server, Cloud & Lisensi Teknologi';
                        }
                        if (
                          lower.includes('pajak') ||
                          lower.includes('pph') ||
                          lower.includes('ppn') ||
                          lower.includes('retribusi')
                        ) {
                          return '⚖️ Pajak & Kewajiban Proyek';
                        }
                        if (
                          lower.includes('cicilan') ||
                          lower.includes('kredit') ||
                          lower.includes('angsuran') ||
                          lower.includes('dryer')
                        ) {
                          return '💳 Cicilan Kredit & Alat Usaha';
                        }
                        if (
                          lower.includes('prive') ||
                          lower.includes('dividen') ||
                          lower.includes('bagi hasil')
                        ) {
                          return '💰 Prive & Bagi Hasil Pemilik';
                        }
                        if (
                          lower.includes('listrik') ||
                          lower.includes('air') ||
                          lower.includes('sewa') ||
                          lower.includes('ruko') ||
                          lower.includes('kios') ||
                          lower.includes('toko') ||
                          lower.includes('operasional') ||
                          lower.includes('wifi') ||
                          lower.includes('internet') ||
                          lower.includes('bensin') ||
                          lower.includes('transport') ||
                          lower.includes('kebersihan') ||
                          lower.includes('atk') ||
                          lower.includes('perawatan') ||
                          lower.includes('gas') ||
                          lower.includes('scaffolding') ||
                          lower.includes('alat berat')
                        ) {
                          return '⚙️ Operasional, Tempat & Utilitas';
                        }
                        if (
                          lower.includes('iklan') ||
                          lower.includes('promosi') ||
                          lower.includes('ads') ||
                          lower.includes('banner') ||
                          lower.includes('brosur') ||
                          lower.includes('spanduk') ||
                          lower.includes('marketing') ||
                          lower.includes('diskon') ||
                          lower.includes('endorse')
                        ) {
                          return '📣 Pemasaran & Promosi';
                        }
                        return '📋 Biaya & Pos Operasional Lainnya';
                      } else {
                        if (
                          lower.includes('makan') ||
                          lower.includes('minum') ||
                          lower.includes('sembako') ||
                          lower.includes('dapur') ||
                          lower.includes('sayur') ||
                          lower.includes('daging') ||
                          lower.includes('pasar')
                        ) {
                          return '🛒 Kebutuhan Pokok & Dapur';
                        }
                        if (
                          lower.includes('listrik') ||
                          lower.includes('air') ||
                          lower.includes('wifi') ||
                          lower.includes('pulsa') ||
                          lower.includes('sewa') ||
                          lower.includes('rumah') ||
                          lower.includes('pln') ||
                          lower.includes('pdam')
                        ) {
                          return '💡 Tagihan & Rumah Tangga';
                        }
                        if (
                          lower.includes('bensin') ||
                          lower.includes('transport') ||
                          lower.includes('servis') ||
                          lower.includes('parkir') ||
                          lower.includes('ojol') ||
                          lower.includes('tol')
                        ) {
                          return '🚗 Transportasi & Kendaraan';
                        }
                        if (
                          lower.includes('obat') ||
                          lower.includes('dokter') ||
                          lower.includes('sekolah') ||
                          lower.includes('les') ||
                          lower.includes('spp') ||
                          lower.includes('vitamin') ||
                          lower.includes('kesehatan')
                        ) {
                          return '💊 Kesehatan & Pendidikan';
                        }
                        if (
                          lower.includes('nonton') ||
                          lower.includes('liburan') ||
                          lower.includes('jajan') ||
                          lower.includes('ngopi') ||
                          lower.includes('hiburan') ||
                          lower.includes('game')
                        ) {
                          return '☕ Gaya Hidup & Hiburan';
                        }
                        return '📋 Pengeluaran Pribadi Lainnya';
                      }
                    };

                    displayedItems.forEach((it) => {
                      const grp = getItemGroupName(it.cleanItemName, it.type, isBiz);
                      if (!groupsMap[grp]) groupsMap[grp] = [];
                      groupsMap[grp].push(it);
                    });

                    const groupKeys = Object.keys(groupsMap);

                    return (
                      <div className="flex flex-col gap-3">
                        <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs font-black truncate block">
                                {getBudgetDisplayName(chosenBudget.name, language)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Periode: {chosenBudget.start_date} s/d {chosenBudget.end_date} • Klik item pos untuk mencatat
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* LIST KE BAWAH PER KELOMPOK (FULL WIDTH, TIDAK KE SAMPING) */}
                        <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1">
                          {groupKeys.map((grpName) => {
                            const items = groupsMap[grpName];
                            return (
                              <div key={grpName} className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                                  <span>{grpName}</span>
                                  <span className="text-[10px] font-bold text-slate-500">{items.length} item</span>
                                </span>

                                <div className="flex flex-col gap-1.5">
                                  {items.map(({ budget, item, category, remainingAmount, type: itemType, cleanItemName }) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedBudgetItem({
                                          budget,
                                          item,
                                          category,
                                          remainingAmount,
                                        });
                                        setType(itemType);
                                        setSelectedCategoryId(item.category_id);
                                        if (budget.mode !== 'all') {
                                          setMode(budget.mode);
                                        } else if (activeMode !== 'all') {
                                          setMode(activeMode);
                                        }
                                        const defaultDesc = cleanItemName;
                                        setDescription(defaultDesc);
                                      }}
                                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-left flex items-center justify-between group transition-all shadow-2xs active:scale-[0.99] cursor-pointer w-full"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div
                                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                                          style={{
                                            backgroundColor: `${category?.color || '#8b5cf6'}20`,
                                            color: category?.color || '#8b5cf6',
                                          }}
                                        >
                                          <CategoryIcon iconName={category?.icon || 'PieChart'} color={category?.color || '#8b5cf6'} className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 leading-snug">
                                          {cleanItemName}
                                        </span>
                                      </div>
                                      <div className="shrink-0 flex items-center gap-1.5 pl-2">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 group-hover:text-indigo-600 transition-colors">
                                          Pilih Pos →
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* SHOW INPUT METHOD OPTIONS */
                <>
                  {selectedBudgetItem && (
                    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-md border border-purple-400/30 animate-fadeIn">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <CategoryIcon iconName={selectedBudgetItem.category?.icon || 'PieChart'} color="#ffffff" className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">
                            📌 Pos Anggaran Berjalan: {selectedBudgetItem.category ? getCategoryDisplayName(selectedBudgetItem.category.name, language) : 'Pos Anggaran'}
                          </p>
                          <p className="text-[10px] text-purple-200 truncate">
                            {getBudgetDisplayName(selectedBudgetItem.budget.name, language)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBudgetItem(null)}
                        className="text-[10px] font-black bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-colors"
                      >
                        {language === 'id' ? 'Ganti Pos' : 'Change Item'}
                      </button>
                    </div>
                  )}

                  <div className="text-center py-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      ⚡ Pilih Metode Pencatatan
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                      Bagaimana Anda Ingin Mencatat?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pilih metode otomatis AI atau form pintar terpandu
                    </p>
                  </div>

                  {/* Hidden Native Input Elements */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, 'receipt')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'statement')}
                    className="hidden"
                  />

                  {/* Modern Input Method Cards Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* 1. INPUT SUARA AI (VOICE SMART ASSISTANT) */}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="p-4 rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 hover:border-indigo-400 text-left flex items-center justify-between group transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                          <Mic className="w-6 h-6 stroke-[2.2] animate-pulse text-amber-200" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">Input Suara AI (Voice Smart)</span>
                            <span className="text-[9px] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs">
                              ✨ REKOMENDASI TERCEPAT
                            </span>
                          </div>
                          <p className="text-xs text-indigo-200/90 font-medium mt-1 leading-snug">
                            Bicara bebas (contoh: <em>"Beli bensin 50rb bayar pakai BCA"</em>) — AI otomatis membedah & mengisi seluruh kolom!
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-white group-hover:translate-x-1 group-hover:bg-indigo-600 transition-all shrink-0 relative z-10">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>

                    {/* 2. SCAN STRUK AI (SMART OCR) */}
                    <button
                      type="button"
                      onClick={() => {
                        setDocType('receipt');
                        setSourceType('receipt');
                        if (cameraInputRef.current) {
                          cameraInputRef.current.click();
                        }
                      }}
                      className="p-4 rounded-3xl border-2 border-blue-500/30 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 hover:border-blue-400 text-left flex items-center justify-between group transition-all shadow-md hover:shadow-blue-500/20 active:scale-[0.99] cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">Scan Foto Struk / Bon Kasir</span>
                            <span className="text-[9px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              ⚡ MULTI-ITEM OCR
                            </span>
                          </div>
                          <p className="text-xs text-blue-200/90 font-medium mt-1 leading-snug">
                            Foto nota/struk belanja — AI ekstrak total, rincian barang, dan pajak secara otomatis.
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-white group-hover:translate-x-1 group-hover:bg-blue-600 transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>

                    {/* 3. SCREENSHOT BANK & QRIS */}
                    <button
                      type="button"
                      onClick={() => {
                        setDocType('statement');
                        setSourceType('statement');
                        if (galleryInputRef.current) {
                          galleryInputRef.current.click();
                        }
                      }}
                      className="p-4 rounded-3xl border-2 border-teal-500/30 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 hover:border-teal-400 text-left flex items-center justify-between group transition-all shadow-md hover:shadow-teal-500/20 active:scale-[0.99] cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                          <Smartphone className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">Screenshot Bank & QRIS</span>
                            <span className="text-[9px] bg-teal-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              🏦 E-WALLET
                            </span>
                          </div>
                          <p className="text-xs text-teal-200/90 font-medium mt-1 leading-snug">
                            Upload bukti transfer m-banking BCA, Mandiri, BRI, QRIS, GoPay, atau OVO.
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-white group-hover:translate-x-1 group-hover:bg-teal-600 transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>

                    {/* 4. CATATAN TANGAN */}
                    <button
                      type="button"
                      onClick={() => {
                        setDocType('handwritten');
                        setSourceType('handwritten');
                        if (galleryInputRef.current) {
                          galleryInputRef.current.click();
                        }
                      }}
                      className="p-4 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 hover:border-amber-400 text-left flex items-center justify-between group transition-all shadow-md hover:shadow-amber-500/20 active:scale-[0.99] cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                          <PenTool className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">Catatan Tangan & Buku Kas</span>
                            <span className="text-[9px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              📝 CORETAN
                            </span>
                          </div>
                          <p className="text-xs text-amber-200/90 font-medium mt-1 leading-snug">
                            Foto buku kas tulisan tangan manual atau rekapan kasir harian.
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-white group-hover:translate-x-1 group-hover:bg-amber-600 transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>

                    {/* 5. FORM CEPAT INTERAKTIF */}
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('manual');
                        setActiveStepField('amount');
                        setStep('confirm');
                      }}
                      className="p-4 rounded-3xl border-2 border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 hover:border-slate-500 text-left flex items-center justify-between group transition-all shadow-md active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <Zap className="w-6 h-6 text-amber-300 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">Formulir Cepat Interaktif</span>
                            <span className="text-[9px] bg-slate-700 text-white font-extrabold px-2 py-0.5 rounded-full">
                              🎯 MANUAL TERPANDU
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                            Pengisian manual terpandu dengan chip nominal kilat & auto-advance highlight.
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-white group-hover:translate-x-1 group-hover:bg-slate-600 transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  </div>

                  {/* Sample Images & Live Webcam Fallback */}
                  <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Alternatif Pengujian Cepat:</span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-[11px] text-cyan-700 dark:text-cyan-400 hover:underline font-extrabold flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Buka Kamera Live Web
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_IMAGES.slice(0, 2).map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => processImageOcr(sample.svgDataUri, sample.docType, sample)}
                          className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-left flex items-center gap-2 group text-[11px] text-amber-900 dark:text-amber-200 font-bold cursor-pointer transition-colors"
                        >
                          <img src={sample.svgDataUri} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          <span className="truncate">{sample.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP: VOICE AI RECORDING INTERFACE */}
          {step === 'voice' && (
            <div className="flex flex-col gap-4 py-2 animate-fadeIn">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceRecording();
                    setStep('method');
                  }}
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Pilihan Metode</span>
                </button>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xs">
                  ✨ SakuKu Voice AI (Hybrid Engine)
                </span>
              </div>

              {/* Error / Permission Banner if microphone is blocked */}
              {voiceErrorMessage && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-[11px] leading-snug">{voiceErrorMessage}</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                      💡 Pastikan izin akses mikrofon telah diaktifkan di browser HP Anda.
                    </p>
                  </div>
                </div>
              )}

              {/* Central Single Voice Recorder Card */}
              <div className="p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl border border-indigo-500/30 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Big Single Mic Button */}
                <div className="relative mt-2">
                  {isListening && (
                    <>
                      <div className="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping" />
                      <div className="absolute -inset-8 rounded-full bg-purple-500/20 animate-pulse" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all relative z-10 cursor-pointer ${
                      isListening
                        ? 'bg-gradient-to-tr from-rose-600 to-pink-600 scale-110 ring-4 ring-pink-400/50 animate-pulse'
                        : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Mic className={`w-11 h-11 ${isListening ? 'animate-bounce text-white' : 'text-amber-200'}`} />
                  </button>
                </div>

                {/* Live Animated Audio Wave Bars */}
                {isListening ? (
                  <div className="flex items-center gap-1.5 h-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                      const heights = ['h-2', 'h-4', 'h-6', 'h-3', 'h-5', 'h-2', 'h-6', 'h-4'];
                      return (
                        <div
                          key={bar}
                          className={`w-1.5 bg-gradient-to-t from-pink-400 to-amber-300 rounded-full transition-all duration-150 ${
                            heights[(bar + voiceAudioLevel) % heights.length]
                          }`}
                        />
                      );
                    })}
                  </div>
                ) : isTranscribingAi ? (
                  <div className="h-6 flex items-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI Gemini Mentranskripsi Suara Anda...</span>
                  </div>
                ) : (
                  <div className="h-6 flex items-center">
                    <span className="text-[11px] text-indigo-300 font-bold">
                      Ketuk mikrofon di atas, lalu ucapkan transaksi Anda
                    </span>
                  </div>
                )}

                {/* Status & Timer Badge */}
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : isTranscribingAi ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                    {isListening
                      ? `Sedang Merekam (${String(Math.floor(voiceTimer / 60)).padStart(2, '0')}:${String(voiceTimer % 60).padStart(2, '0')}) — Ketuk untuk Selesai`
                      : isTranscribingAi
                      ? 'AI Gemini Menganalisis Suara...'
                      : 'Perekam Suara Siaga'}
                  </span>
                </div>

                {/* Realtime Transcript Speech Bubble */}
                <div className="w-full bg-slate-900/90 border border-indigo-400/30 p-3.5 rounded-2xl text-left min-h-[64px] flex flex-col justify-center">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wide block mb-1">
                    Hasil Suara:
                  </span>
                  <p className="text-xs font-semibold text-white leading-relaxed">
                    {voiceTranscript || voiceInterimText ? (
                      `"${voiceTranscript || voiceInterimText}"`
                    ) : (
                      <span className="text-slate-400 italic">
                        Contoh: "Beli bensin pertalite 50 ribu pakai Gopay"...
                      </span>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full gap-2 pt-1">
                  {isListening ? (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="flex-1 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <span>⏹ Selesai Bicara & Proses AI</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleProcessVoiceResult(voiceTranscript || voiceInterimText)}
                      disabled={!voiceTranscript && !voiceInterimText}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        voiceTranscript || voiceInterimText
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Proses Transaksi dengan AI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Instant Voice Test Simulator & Presets */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Contoh Cepat & Uji Suara (1-Tap):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const testSamples = [
                        'Beli bensin pertalite 50 ribu pakai Gopay',
                        'Terima honor freelance desain 2.5 juta masuk rekening BCA',
                        'Belanja sayur dan sembako dapur 85 ribu bayar tunai',
                        'Bayar tagihan listrik PLN dan WiFi rumah 1.2 juta lewat Mandiri',
                        'Penjualan harian omzet kafe kopi 3.8 juta via QRIS',
                        'Beli minyak goreng dan beras 150 ribu tunai kas toko',
                        'Bayar sewa ruko bulanan 4.5 juta via transfer BCA',
                      ];
                      const randomSample = testSamples[Math.floor(Math.random() * testSamples.length)];
                      handleProcessVoiceResult(randomSample);
                    }}
                    className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>🎯 Tes Simulasi Acak</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Beli Bensin 50rb Gopay', text: 'Beli bensin pertalite 50 ribu pakai Gopay', icon: '⛽' },
                    { label: 'Honor Freelance 2.5jt BCA', text: 'Terima honor freelance desain 2.5 juta masuk rekening BCA', icon: '💻' },
                    { label: 'Belanja Sembako 85rb Cash', text: 'Belanja sayur dan sembako dapur 85 ribu bayar tunai', icon: '🛒' },
                    { label: 'Listrik & WiFi 1.2jt Mandiri', text: 'Bayar tagihan listrik PLN dan WiFi rumah 1.2 juta lewat Mandiri', icon: '⚡' },
                    { label: 'Omzet Toko 3.8jt QRIS', text: 'Penjualan harian omzet kafe kopi 3.8 juta via QRIS', icon: '☕' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessVoiceResult(preset.text)}
                      className="p-2.5 bg-indigo-50/70 dark:bg-slate-850 hover:bg-indigo-100 dark:hover:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-left flex items-center gap-2.5 transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                    >
                      <span className="text-base">{preset.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-indigo-950 dark:text-indigo-200 font-extrabold group-hover:text-indigo-600">
                          {preset.label}
                        </span>
                        <span className="block truncate text-[10px] text-slate-500 font-normal">
                          "{preset.text}"
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: PICK DOCUMENT TYPE / TAKE PHOTO (Direct Live Webcam view if opened) */}
          {step === 'docType' && (
            <div className="flex flex-col gap-4">
              {isLiveCamera ? (
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-3/4 flex items-center justify-center shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                        {t('positionDocHere')}
                      </span>
                    </div>

                    {cameraError && (
                      <div className="absolute inset-4 bg-black/80 rounded-xl p-4 flex flex-col items-center justify-center text-center text-white">
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                        <p className="text-xs">{cameraError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={takePhotoFromStream}
                      className="flex-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> {t('takePhotoBtn')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-center py-2">
                    <h4 className="text-sm font-bold text-slate-900">{t('howToInputDocTitle')}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{t('howToInputDocSubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-center flex flex-col items-center gap-2 group transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t('useCamera')}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{t('takePhotoDirectly')}</div>
                      </div>
                    </button>

                    <label className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-slate-100 text-center flex flex-col items-center gap-2 group transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t('openGallery')}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{t('uploadFromDevice')}</div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, docType)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-2 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-500 mb-2">
                      {t('testAiWithSample')}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_IMAGES.filter((s) => s.docType === docType).map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => processImageOcr(sample.svgDataUri, sample.docType, sample)}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left flex items-center gap-2 group"
                        >
                          <img src={sample.svgDataUri} alt="" className="w-8 h-8 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate">
                              {sample.name}
                            </div>
                            <div className="text-[9px] text-slate-500">Sample {sample.docType}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCANNING / ANALYZING ANIMATION */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-600 flex items-center justify-center relative overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Scan Preview"
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-blue-500/40 to-transparent animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{t('analyzingDocAiTitle')}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {t('analyzingDocAiDesc')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: MULTI-TRANSACTION LIST (AUTODETECTED INCOME & EXPENSE) */}
          {step === 'statementList' && (
            <div className="flex flex-col gap-3">
              {/* Summary Banner with Income vs Expense Breakdown */}
              {(() => {
                const selectedItems = statementItems.filter((i) => i.selected);
                const sumInc = selectedItems.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0);
                const sumExp = selectedItems.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0);

                return (
                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span className="text-xs font-black text-amber-200">
                          AI Otomatis Memisahkan Transaksi ({statementItems.length} Item)
                        </span>
                      </div>
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                        {sourceType === 'handwritten' ? 'Catatan Tangan' : sourceType === 'statement' ? 'Mutasi Bank' : 'Struk/Bon'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
                      <div className="bg-emerald-950/80 border border-emerald-500/40 p-2 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
                          🟢 Uang Masuk ({selectedItems.filter((i) => i.type === 'income').length})
                        </span>
                        <span className="text-xs font-black text-emerald-300 mt-0.5">
                          +{formatRupiah(sumInc)}
                        </span>
                      </div>

                      <div className="bg-rose-950/80 border border-rose-500/40 p-2 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wide">
                          🔴 Uang Keluar ({selectedItems.filter((i) => i.type === 'expense').length})
                        </span>
                        <span className="text-xs font-black text-rose-300 mt-0.5">
                          -{formatRupiah(sumExp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Account Selection for Multiple Items */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">{t('saveStatementToAccount')}</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map((acc) => {
                    let labelBadge = '';
                    if (acc.scope === 'business') labelBadge = ` (${t('businessType')}: ${acc.business_name || 'UMKM'})`;
                    else if (acc.scope === 'combined') labelBadge = ` (${t('combinedAccount')})`;
                    else labelBadge = ` (${t('personalCash')})`;

                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}{labelBadge} — {t('balance')}: {formatRupiah(acc.current_balance)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Checkbox & Item Adjustment List */}
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 flex flex-col gap-2">
                {statementItems.map((item) => {
                  const isInc = item.type === 'income';
                  const availableCats = categories.filter((c) => c.type === item.type);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                        item.selected
                          ? isInc
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50 border-slate-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Checkbox & Details */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleStatementItem(item.id)}
                            className="text-blue-600 shrink-0 mt-0.5 cursor-pointer"
                          >
                            {item.selected ? (
                              <CheckSquare className="w-5 h-5 fill-blue-600 text-white" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateStatementItemDescription(item.id, e.target.value)}
                              className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none w-full truncate pb-0.5"
                              placeholder="Nama barang / keterangan"
                            />
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] font-bold text-slate-500">📅 Tgl:</span>
                              <input
                                type="date"
                                value={item.date}
                                onChange={(e) => updateStatementItemDate(item.id, e.target.value)}
                                className="text-[10px] text-slate-700 font-mono font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Amount & Income/Expense Toggle */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-black ${isInc ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isInc ? '+' : '-'}
                            </span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateStatementItemAmount(item.id, parseFloat(e.target.value) || 0)}
                              className={`text-xs font-black w-24 text-right bg-transparent border-b border-dashed ${
                                isInc ? 'text-emerald-700 border-emerald-300' : 'text-rose-700 border-rose-300'
                              } focus:outline-none`}
                            />
                          </div>

                          {/* Quick Toggle Button for Kas Masuk / Kas Keluar */}
                          <button
                            type="button"
                            onClick={() => toggleStatementItemType(item.id)}
                            className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold cursor-pointer transition-transform hover:scale-105 shadow-xs ${
                              isInc
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-600 text-white hover:bg-rose-700'
                            }`}
                            title="Klik untuk mengubah status Uang Masuk / Uang Keluar"
                          >
                            {isInc ? '🟢 Kas Masuk' : '🔴 Kas Keluar'}
                          </button>
                        </div>
                      </div>

                      {/* Category Selection for each item */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Kategori:</span>
                        <select
                          value={item.category_id}
                          onChange={(e) => updateStatementItemCategory(item.id, e.target.value)}
                          className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {availableCats.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {getCategoryDisplayName(cat.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSelectedStatementItems}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Simpan Semua ({statementItems.filter((i) => i.selected).length})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SINGLE TRANSACTION CONFIRM FORM (INTERACTIVE SMART FORM WITH AUTO-ADVANCE & HIGHLIGHT) */}
          {step === 'confirm' && (
            <form onSubmit={handleSingleSubmit} className="flex flex-col gap-3.5 animate-fadeIn">
              {/* Top Navigation & Method Tag */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('backToOtherMethod')}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    sourceType === 'voice'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300'
                      : sourceType === 'receipt'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300'
                      : sourceType === 'statement'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300'
                  }`}>
                    {sourceType === 'voice' ? '🎙️ Voice AI' : sourceType === 'receipt' ? '📄 Struk OCR' : sourceType === 'statement' ? '🏦 QRIS/Bank' : '✍️ Form Manual'}
                  </span>
                </div>
              </div>

              {/* ==================================================== */}
              {/* INTERACTIVE STEP PROGRESS HIGHLIGHT BAR */}
              {/* ==================================================== */}
              <div className="p-1.5 bg-slate-100 dark:bg-slate-850 rounded-2xl flex items-center justify-between gap-1 border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'amount', label: '1. Nominal', isDone: parseAmountNumber(amount) > 0 },
                  { id: 'category', label: '2. Kategori', isDone: !!selectedCategoryId },
                  { id: 'account', label: '3. Akun/Kas', isDone: !!selectedAccountId },
                  { id: 'description', label: '4. Keterangan', isDone: !!description.trim() },
                ].map((st) => {
                  const isActive = activeStepField === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveStepField(st.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700 scale-[1.02]'
                          : st.isDone
                          ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'text-slate-500 hover:bg-white/50'
                      }`}
                    >
                      {st.isDone && !isActive && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Voice AI Result Feedback Banner */}
              {sourceType === 'voice' && (voiceTranscript || description) && (
                <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-300 dark:border-purple-800 p-3 rounded-2xl flex items-start gap-2.5">
                  <span className="p-1.5 bg-purple-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-xs font-black text-purple-950 dark:text-purple-200">
                        ✨ Terisi Otomatis oleh Voice AI (Akurasi 95%)
                      </span>
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="text-[10px] font-bold text-purple-700 dark:text-purple-300 underline hover:text-purple-900 cursor-pointer"
                      >
                        Rekam Ulang
                      </button>
                    </div>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300/90 italic mt-0.5 font-medium">
                      "{voiceTranscript || description}"
                    </p>
                  </div>
                </div>
              )}

              {/* Connected Budget Item Banner */}
              {selectedBudgetItem && (
                <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <CategoryIcon iconName={selectedBudgetItem.category?.icon || 'PieChart'} color="#ffffff" className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-purple-950 truncate">
                        📌 Realisasi Pos: {selectedBudgetItem.category ? getCategoryDisplayName(selectedBudgetItem.category.name, language) : 'Pos Anggaran'}
                      </p>
                      <p className="text-[10px] text-purple-700 font-medium truncate">
                        {getBudgetDisplayName(selectedBudgetItem.budget.name, language)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBudgetItem(null)}
                    className="text-[10px] font-extrabold text-purple-700 hover:text-purple-900 underline shrink-0 cursor-pointer"
                  >
                    {language === 'id' ? 'Lepas Koneksi' : 'Disconnect'}
                  </button>
                </div>
              )}

              {/* 1. DIRECTION SWITCHER: PEMASUKAN VS PENGELUARAN */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    const incCat = categories.find((c) => c.type === 'income');
                    if (incCat) setSelectedCategoryId(incCat.id);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30 scale-[1.01]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 shrink-0" />
                  <span>🟢 {t('saveIncome')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    const expCat = categories.find((c) => c.type === 'expense');
                    if (expCat) setSelectedCategoryId(expCat.id);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/30 scale-[1.01]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-200 shrink-0" />
                  <span>🔴 {t('saveExpense')}</span>
                </button>
              </div>

              {/* 2. FIELD 1: NOMINAL DENGAN QUICK CHIPS & AUTO-ADVANCE */}
              <div className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-2.5 ${
                activeStepField === 'amount'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💵 {t('amountLabel').replace('(Rp)', `(${currSymbol})`)}</span>
                    {activeStepField === 'amount' && (
                      <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.2 rounded-full animate-pulse">
                        Aktif
                      </span>
                    )}
                  </label>
                  {parseAmountNumber(amount) > 0 && (
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Terisi
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-lg text-indigo-600 dark:text-indigo-400">
                    {currSymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onFocus={() => setActiveStepField('amount')}
                    onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setActiveStepField('category');
                      }
                    }}
                    placeholder="0"
                    required
                    className="w-full pl-12 pr-3 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>

                {/* Quick Nominal Preset Chips (1-Tap Fill & Auto-Advance) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Pilih Cepat Nominal (Otomatis Lanjut):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[10000, 25000, 50000, 100000, 250000, 500000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectQuickAmount(val, false)}
                        className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-2xs text-center truncate"
                      >
                        {formatRupiah(val).replace(',00', '')}
                      </button>
                    ))}
                  </div>

                  {/* Increment Add Chips (+10k, +50k, +100k) */}
                  <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-0.5 scrollbar-thin">
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">Tambah:</span>
                    {[
                      { l: '+10rb', v: 10000 },
                      { l: '+20rb', v: 20000 },
                      { l: '+50rb', v: 50000 },
                      { l: '+100rb', v: 100000 },
                      { l: '+500rb', v: 500000 },
                      { l: '+1jt', v: 1000000 },
                    ].map((inc) => (
                      <button
                        key={inc.l}
                        type="button"
                        onClick={() => handleSelectQuickAmount(inc.v, true)}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                      >
                        {inc.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. FIELD 2: KATEGORI DENGAN CHIPS PICKER & AUTO-ADVANCE */}
              <div className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-2.5 ${
                activeStepField === 'category'
                  ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🏷️ {t('categoryLabel')} ({type === 'income' ? t('categoryIn') : t('categoryOut')})</span>
                    {activeStepField === 'category' && (
                      <span className="text-[9px] bg-purple-600 text-white px-2 py-0.2 rounded-full animate-pulse">
                        Aktif
                      </span>
                    )}
                  </label>
                  {selectedCategoryId && (
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Terpilih
                    </span>
                  )}
                </div>

                {/* Grid Visual Category Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    const catName = getCategoryDisplayName(cat.name, language);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoryWithAutoAdvance(cat.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm scale-[1.01] font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20`,
                            color: isSelected ? '#ffffff' : cat.color,
                          }}
                        >
                          <CategoryIcon iconName={cat.icon} color={isSelected ? '#ffffff' : cat.color} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate font-bold">{catName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. FIELD 3: PILIHAN AKUN / LOKASI KAS DENGAN AUTO-ADVANCE */}
              <div className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-2.5 ${
                activeStepField === 'account'
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-300 dark:ring-teal-700 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🏦 {type === 'income' ? t('incomeStorageLocation') : t('step2AccountHeader')}</span>
                    {activeStepField === 'account' && (
                      <span className="text-[9px] bg-teal-600 text-white px-2 py-0.2 rounded-full animate-pulse">
                        Aktif
                      </span>
                    )}
                  </label>
                  {selectedAccountId && (
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Terpilih
                    </span>
                  )}
                </div>

                {/* Quick Account Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const icon = acc.type === 'cash' ? '💵' : acc.type === 'ewallet' ? '📱' : '🏦';

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccountWithAutoAdvance(acc.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-[1.01]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base">{icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate">{acc.name}</span>
                            <span className={`text-[10px] block ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                              Saldo: {formatRupiah(acc.current_balance)}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. FIELD 4: KETERANGAN & TANGGAL TRANSAKSI */}
              <div className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-3 ${
                activeStepField === 'description' || activeStepField === 'date'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>📝 {t('descriptionLabel')} & 📅 Tanggal</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={description}
                    onFocus={() => setActiveStepField('description')}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Belanja bensin pertalite, Gaji bulanan, Kopi senja..."
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDate(getTodayLocalDateStr())}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        date === getTodayLocalDateStr()
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                      }}
                      className="py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Kemarin
                    </button>
                  </div>

                  <input
                    type="date"
                    value={date}
                    onFocus={() => setActiveStepField('date')}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 6. TOMBOL SIMPAN DATA TRANSAKSI */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="flex-1 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className={`flex-2 py-3.5 text-white rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    type === 'expense'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan {type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ({formatRupiah(parseAmountNumber(amount) || 0)})</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
