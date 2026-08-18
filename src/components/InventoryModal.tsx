import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InventoryItem, InventoryItemType, ModeType } from '../types';
import { formatRupiah } from '../lib/formatters';
import { db } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import { getQuickPresets, QuickInventoryPreset } from '../lib/inventoryPresets';
import { parseVoiceToInventoryItem } from '../lib/inventoryVoiceParser';
import { startHybridVoiceRecognition, VoiceController, transcribeAudioFile, isSecureContextOrigin } from '../lib/voiceService';
import {
  X,
  Package,
  Plus,
  Trash2,
  Edit3,
  Search,
  Camera,
  Download,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  Sparkles,
  ShoppingBag,
  Wrench,
  Check,
  Mic,
  MicOff,
  Zap,
  Layers,
  Volume2,
  FileText,
  Lock,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Smartphone
} from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: ModeType;
  businessType?: string; // Specific business template / type id (e.g. 'retail_shop', 'fnb_culinary', 'workshop_service', 'project_contract', etc.)
  businessTitle?: string; // Display title e.g. "Swalayan & Toko Sembako", "Kedai Kopi & F&B"
  initialAction?: 'view' | 'add' | 'ocr';
  onSelectItemsForBudget?: (items: InventoryItem[]) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  mode = 'business',
  businessType,
  businessTitle,
  initialAction = 'view',
}) => {
  const { language } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>(() => db.getInventoryItems());
  const [activeTab, setActiveTab] = useState<'all' | InventoryItemType | 'low_stock'>('all');
  const [filterMode, setFilterMode] = useState<ModeType>(mode);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 4-Mode Input Switcher in Edit/Add Modal: 'manual' | 'scan' | 'voice' | 'catalog'
  const [inputMode, setInputMode] = useState<'manual' | 'scan' | 'voice' | 'catalog'>(
    initialAction === 'ocr' ? 'scan' : 'manual'
  );

  // Add/Edit Single Item Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(initialAction === 'add' || initialAction === 'ocr');
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(
    initialAction === 'add' || initialAction === 'ocr'
      ? {
          name: '',
          qty: 1,
          cost_price: 0,
          unit: 'pcs',
          item_type: 'product_stock',
          mode: mode,
          business_type: businessType,
          template_id: businessType,
          business_name: businessTitle,
        }
      : null
  );

  // Speech Recognition & Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Custom Category & Custom Unit state
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const unitInputRef = useRef<HTMLInputElement>(null);

  // AI Invoice OCR Modal State
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrPreviewItems, setOcrPreviewItems] = useState<any[] | null>(null);
  const [ocrSupplierName, setOcrSupplierName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Preset quick catalog items for this business
  const quickPresets = useMemo(() => {
    return getQuickPresets(businessType);
  }, [businessType]);

  const voiceControllerRef = useRef<VoiceController | null>(null);

  // Clean up voice controller on unmount
  useEffect(() => {
    return () => {
      if (voiceControllerRef.current) {
        voiceControllerRef.current.cancel();
      }
    };
  }, []);

  // Hybrid Speech Recognition control (Web Speech API + MediaRecorder Audio + Gemini AI Fallback)
  const startVoiceRecognition = async () => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.cancel();
    }

    setVoiceTranscript('');
    setVoiceFeedback(null);
    setIsListening(true);

    try {
      const controller = await startHybridVoiceRecognition({
        language: language === 'id' ? 'id' : 'en',
        onTranscript: (finalText) => {
          setVoiceTranscript(finalText);
          const parsed = parseVoiceToInventoryItem(finalText);
          if (parsed.name && parsed.name !== 'Item Inventaris') {
            setEditingItem((prev) => ({
              ...prev,
              name: parsed.name,
              qty: parsed.qty || 1,
              unit: parsed.unit || 'pcs',
              cost_price: parsed.cost_price || (prev?.cost_price ?? 0),
              item_type: parsed.item_type || 'product_stock',
              category_name: parsed.category_name || prev?.category_name,
            }));
            setVoiceFeedback(
              language === 'id'
                ? `✅ Berhasil mengenali: ${parsed.name} (${parsed.qty} ${parsed.unit}) @ Rp ${(parsed.cost_price || 0).toLocaleString('id-ID')}`
                : `✅ Recognized: ${parsed.name}`
            );
          }
        },
        onInterim: (interim) => {
          setVoiceTranscript(interim);
        },
        onError: (err) => {
          setVoiceFeedback(err);
        },
        onStart: () => {
          setIsListening(true);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      voiceControllerRef.current = controller;
    } catch (e: any) {
      console.warn('Inventory voice recognition start error:', e);
      setIsListening(false);
      setVoiceFeedback(e.message || 'Gagal memulai perekaman suara.');
    }
  };

  const stopVoiceRecognition = async () => {
    setIsListening(false);
    if (voiceControllerRef.current) {
      await voiceControllerRef.current.stop();
    }
  };

  // Reload items when isOpen or businessType changes
  useEffect(() => {
    if (isOpen) {
      setItems(db.getInventoryItems());
      if (initialAction === 'add' || initialAction === 'ocr') {
        setIsEditModalOpen(true);
        setInputMode(initialAction === 'ocr' ? 'scan' : 'manual');
        setEditingItem({
          name: '',
          qty: 1,
          cost_price: 0,
          unit: 'pcs',
          item_type: 'product_stock',
          mode: mode,
          business_type: businessType,
          template_id: businessType,
          business_name: businessTitle,
        });
      }
    }
  }, [isOpen, businessType, initialAction, mode, businessTitle]);

  if (!isOpen) return null;

  // Filter items by mode, businessType, & active tab
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Mode filter
      if (it.mode !== filterMode) return false;

      // Business Type / Specific template isolation
      if (businessType && businessType !== 'all') {
        // Match specific business type or items created under this template
        const matchBizType = it.business_type === businessType || it.template_id === businessType;
        if (!matchBizType) return false;
      }

      // Tab filter
      if (activeTab === 'low_stock') {
        if (!it.min_stock_alert || it.qty > it.min_stock_alert) return false;
      } else if (activeTab !== 'all') {
        if (it.item_type !== activeTab) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = it.name.toLowerCase().includes(q);
        const matchSku = (it.sku_barcode || '').toLowerCase().includes(q);
        const matchCat = (it.category_name || '').toLowerCase().includes(q);
        const matchBiz = (it.business_name || '').toLowerCase().includes(q);
        return matchName || matchSku || matchCat || matchBiz;
      }

      return true;
    });
  }, [items, filterMode, businessType, activeTab, searchQuery]);

  // Grouping items by Classification / Category Group
  const groupedInventory = useMemo(() => {
    const groups: {
      id: string;
      title: string;
      icon: string;
      isFixedAsset: boolean;
      items: InventoryItem[];
      totalModal: number;
    }[] = [
      {
        id: 'raw_material',
        title: language === 'id' ? 'Bahan Baku, Dapur & Produksi' : 'Raw Materials & Kitchen Stock',
        icon: '🌾',
        isFixedAsset: false,
        items: [],
        totalModal: 0,
      },
      {
        id: 'packaging',
        title: language === 'id' ? 'Bahan Kemasan & Packaging' : 'Packaging & Takeaway Supplies',
        icon: '📦',
        isFixedAsset: false,
        items: [],
        totalModal: 0,
      },
      {
        id: 'product_stock',
        title: language === 'id' ? 'Barang Dagangan Siap Jual' : 'Merchandise / Retail Products',
        icon: '🛍️',
        isFixedAsset: false,
        items: [],
        totalModal: 0,
      },
      {
        id: 'equipment_asset',
        title: language === 'id' ? 'Peralatan & Mesin Usaha Utama' : 'Machinery & Primary Equipment',
        icon: '🛠️',
        isFixedAsset: true,
        items: [],
        totalModal: 0,
      },
      {
        id: 'furniture',
        title: language === 'id' ? 'Furniture, Meja & Kursi Usaha' : 'Furniture, Tables & Seating',
        icon: '🪑',
        isFixedAsset: true,
        items: [],
        totalModal: 0,
      },
      {
        id: 'atk',
        title: language === 'id' ? 'Perlengkapan Kasir, POS & ATK Kantor' : 'Cashier POS & Office Supplies',
        icon: '📑',
        isFixedAsset: true,
        items: [],
        totalModal: 0,
      },
      {
        id: 'vehicle',
        title: language === 'id' ? 'Kendaraan Operasional Usaha' : 'Operational Vehicles',
        icon: '🚚',
        isFixedAsset: true,
        items: [],
        totalModal: 0,
      },
      {
        id: 'investment',
        title: language === 'id' ? 'Aset Investasi / Berharga' : 'Investment & Valuable Assets',
        icon: '💎',
        isFixedAsset: true,
        items: [],
        totalModal: 0,
      },
      {
        id: 'other',
        title: language === 'id' ? 'Kelompok Inventaris Lainnya' : 'Other Inventory Items',
        icon: '🏷️',
        isFixedAsset: false,
        items: [],
        totalModal: 0,
      },
    ];

    filteredItems.forEach((item) => {
      const cat = (item.category_name || '').toLowerCase();
      let targetId = 'other';

      if (cat.includes('kemasan') || cat.includes('packaging')) {
        targetId = 'packaging';
      } else if (cat.includes('furniture') || cat.includes('mebel') || cat.includes('meja') || cat.includes('kursi')) {
        targetId = 'furniture';
      } else if (cat.includes('atk') || cat.includes('kantor') || cat.includes('pos') || cat.includes('kasir')) {
        targetId = 'atk';
      } else if (cat.includes('kendaraan') || cat.includes('motor') || cat.includes('mobil')) {
        targetId = 'vehicle';
      } else if (cat.includes('investasi') || cat.includes('emas') || cat.includes('tanah')) {
        targetId = 'investment';
      } else if (item.item_type === 'raw_material' || cat.includes('bahan') || cat.includes('dapur')) {
        targetId = 'raw_material';
      } else if (item.item_type === 'equipment_asset' || cat.includes('peralatan') || cat.includes('mesin') || cat.includes('aset')) {
        targetId = 'equipment_asset';
      } else if (item.item_type === 'product_stock' || cat.includes('barang') || cat.includes('dagang')) {
        targetId = 'product_stock';
      }

      const group = groups.find((g) => g.id === targetId) || groups[groups.length - 1];
      group.items.push(item);
      group.totalModal += item.qty * item.cost_price;
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredItems, language]);

  // Valuation metrics calculations
  const metrics = useMemo(() => {
    let modeItems = items.filter((it) => it.mode === filterMode);
    if (businessType && businessType !== 'all') {
      modeItems = modeItems.filter(
        (it) => it.business_type === businessType || it.template_id === businessType
      );
    }
    
    const stockItems = modeItems.filter((it) => it.item_type === 'product_stock');
    const rawItems = modeItems.filter((it) => it.item_type === 'raw_material');
    const assetItems = modeItems.filter((it) => it.item_type === 'equipment_asset');

    const totalStockValuation = stockItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
    const totalRawValuation = rawItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
    const totalAssetValuation = assetItems.reduce((s, it) => s + it.qty * it.cost_price, 0);
    const totalInvestedCapital = totalStockValuation + totalRawValuation + totalAssetValuation;

    const lowStockCount = modeItems.filter(
      (it) => it.min_stock_alert && it.qty <= it.min_stock_alert
    ).length;

    return {
      totalInvestedCapital,
      totalStockValuation,
      totalRawValuation,
      totalAssetValuation,
      stockCount: stockItems.length,
      rawCount: rawItems.length,
      assetCount: assetItems.length,
      lowStockCount,
    };
  }, [items, filterMode, businessType]);

  // Handle Save Single Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || !editingItem.cost_price) return;

    let finalCategory = editingItem.category_name;
    if (isCustomCategory && customCategoryText.trim()) {
      finalCategory = customCategoryText.trim();
    }

    db.saveInventoryItem({
      ...editingItem,
      name: editingItem.name,
      cost_price: Number(editingItem.cost_price),
      qty: Number(editingItem.qty) || 1,
      unit: editingItem.unit || 'pcs',
      item_type: editingItem.item_type || 'product_stock',
      category_name: finalCategory || 'Barang Dagangan',
      mode: filterMode,
      business_type: editingItem.business_type || businessType || '',
      template_id: editingItem.template_id || businessType || '',
      business_name: editingItem.business_name || businessTitle || '',
    });

    setItems(db.getInventoryItems());
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsCustomCategory(false);
    setCustomCategoryText('');
  };

  // Handle Open Edit
  const handleOpenEdit = (item: InventoryItem) => {
    const knownCats = [
      'Barang Dagangan',
      'Bahan Baku/Stok',
      'Bahan Kemasan',
      'Peralatan/Aset',
      'Furniture/Mebel',
      'Perlengkapan/ATK',
      'Kendaraan Operasional',
      'Aset Investasi',
    ];
    const isCustom = item.category_name ? !knownCats.includes(item.category_name) : false;
    setIsCustomCategory(isCustom);
    setCustomCategoryText(isCustom ? item.category_name || '' : '');
    setEditingItem({ ...item });
    setInputMode('manual');
    setIsEditModalOpen(true);
  };

  // Handle Quick Qty Update (+1 / -1)
  const handleQuickQtyChange = (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.qty + delta);
    db.saveInventoryItem({
      ...item,
      qty: newQty,
    });
    setItems(db.getInventoryItems());
  };

  // Handle Delete Item
  const handleDeleteItem = (id: string) => {
    if (confirm(language === 'id' ? 'Hapus item inventaris ini?' : 'Delete this inventory item?')) {
      db.deleteInventoryItem(id);
      setItems(db.getInventoryItems());
    }
  };

  // Handle Invoice Image Upload & AI OCR
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/inventory-ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, language }),
          });
          const data = await res.json();
          if (data.success && data.items && data.items.length > 0) {
            setOcrSupplierName(data.supplierName || '');
            setOcrPreviewItems(data.items);
          } else {
            alert(language === 'id' ? 'Gagal membaca faktur atau faktur tidak jelas.' : 'Failed to parse invoice.');
          }
        } catch (fetchErr) {
          console.error('Invoice OCR fetch error:', fetchErr);
        } finally {
          setIsOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setIsOcrLoading(false);
    }
  };

  // Handle Confirm OCR Batch Save
  const handleConfirmOcrBatchSave = () => {
    if (!ocrPreviewItems || ocrPreviewItems.length === 0) return;

    db.bulkSaveInventoryItems(
      ocrPreviewItems.map((it) => ({
        ...it,
        mode: filterMode,
        business_type: businessType || '',
        template_id: businessType || '',
        business_name: businessTitle || (ocrSupplierName ? `Supplier: ${ocrSupplierName}` : undefined),
      }))
    );

    setItems(db.getInventoryItems());
    setOcrPreviewItems(null);
    setOcrSupplierName('');
    alert(
      language === 'id'
        ? `Berhasil menyimpan ${ocrPreviewItems.length} item stok ke database ${businessTitle || 'usaha'}!`
        : `Successfully imported ${ocrPreviewItems.length} inventory items!`
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    let csv = `INVENTARIS & ASET MODAL BERJALAN - SAKUKU\n`;
    csv += `Entitas: ${filterMode === 'business' ? 'Mode Bisnis / Usaha' : 'Mode Pribadi'}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csv += `No,Nama Barang/Aset,Tipe,SKU/Barcode,Jumlah (Qty),Satuan,Harga Beli Modal (Rp),Total Modal Tertanam (Rp),Harga Jual (Rp),Keterangan\n`;

    filteredItems.forEach((it, idx) => {
      const typeLabel =
        it.item_type === 'product_stock'
          ? 'Barang Dagangan'
          : it.item_type === 'raw_material'
          ? 'Bahan Baku'
          : 'Peralatan/Aset';
      const subtotal = it.qty * it.cost_price;
      csv += `${idx + 1},"${it.name}","${typeLabel}","${it.sku_barcode || ''}",${it.qty},"${it.unit}",${it.cost_price},${subtotal},${it.selling_price || 0},"${it.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventaris_Modal_Berjalan_${filterMode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div
      data-no-swipe="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-md shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                  {businessTitle
                    ? `📦 Database Inventaris: ${businessTitle}`
                    : language === 'id'
                    ? '📦 Inventaris Stok & Aset Modal Berjalan'
                    : '📦 Inventory & Invested Capital Management'}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs border border-amber-300">
                  {businessTitle
                    ? businessTitle
                    : filterMode === 'business'
                    ? language === 'id'
                      ? 'Mode Bisnis / UMKM'
                      : 'Business Mode'
                    : language === 'id'
                    ? 'Aset Pribadi'
                    : 'Personal Assets'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {businessTitle
                  ? language === 'id'
                    ? `Database stok barang dagangan, bahan baku, dan mesin peralatan khusus ${businessTitle}.`
                    : `Dedicated stock and equipment database for ${businessTitle}.`
                  : language === 'id'
                  ? 'Kelola stok barang dagangan, bahan baku, dan peralatan aset modal usaha.'
                  : 'Track ready stock, raw materials, equipment, and invested working capital.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Switcher (only show if not scoped to a specific business template) */}
            {!businessType && (
              <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('business')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    filterMode === 'business'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'id' ? 'Bisnis' : 'Business'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('personal')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    filterMode === 'personal'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'id' ? 'Pribadi' : 'Personal'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VALUATION SUMMARY METRIC CARDS */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          {/* Card 1: Total Modal Tertanam */}
          <div className="p-3 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border border-indigo-500/30 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-indigo-200 text-[10px] font-bold">
              <span>{language === 'id' ? 'Total Modal Tertanam' : 'Total Invested Capital'}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-1 truncate">
              {formatRupiah(metrics.totalInvestedCapital)}
            </div>
            <div className="text-[10px] text-indigo-300 mt-0.5">
              {filteredItems.length} {language === 'id' ? 'Item Terdata' : 'Items Recorded'}
            </div>
          </div>

          {/* Card 2: Stok Barang Dagang */}
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold">
              <span>{language === 'id' ? 'Stok Barang Siap Jual' : 'Product Stock Value'}</span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 mt-1 truncate">
              {formatRupiah(metrics.totalStockValuation)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {metrics.stockCount} {language === 'id' ? 'Barang Jadi' : 'Products'}
            </div>
          </div>

          {/* Card 3: Bahan Baku & Dapur */}
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold">
              <span>{language === 'id' ? 'Bahan Baku & Dapur' : 'Raw Materials Value'}</span>
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(metrics.totalRawValuation)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {metrics.rawCount} {language === 'id' ? 'Bahan Baku' : 'Materials'}
            </div>
          </div>

          {/* Card 4: Peralatan & Aset Tetap */}
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold">
              <span>{language === 'id' ? 'Peralatan & Aset Mesin' : 'Equipment & Assets'}</span>
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-1 truncate">
              {formatRupiah(metrics.totalAssetValuation)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {metrics.assetCount} {language === 'id' ? 'Peralatan/Alat' : 'Assets'}
            </div>
          </div>
        </div>

        {/* ACTION TOOLBAR & SEARCH */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ✨ {language === 'id' ? 'Semua Item' : 'All Items'} ({filteredItems.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('product_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'product_stock'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              📦 {language === 'id' ? 'Barang Dagangan' : 'Products'} ({metrics.stockCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw_material')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'raw_material'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              🌾 {language === 'id' ? 'Bahan Baku' : 'Raw Materials'} ({metrics.rawCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('equipment_asset')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'equipment_asset'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ⚙️ {language === 'id' ? 'Peralatan/Aset' : 'Equipment'} ({metrics.assetCount})
            </button>

            {metrics.lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('low_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'low_stock'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                🚨 {language === 'id' ? 'Stok Menipis' : 'Low Stock'} ({metrics.lowStockCount})
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari barang/SKU...' : 'Search items...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* AI Scan Faktur Supplier OCR Button */}
            {/* 1. AI Scan Faktur Supplier OCR Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              onChange={handleInvoiceUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isOcrLoading}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="1. Foto Faktur / Nota Kulakan Supplier untuk ekstrak item otomatis"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>{isOcrLoading ? (language === 'id' ? 'Menganalisis...' : 'Analyzing...') : (language === 'id' ? '1. Foto Faktur' : '1. Scan Invoice')}</span>
            </button>

            {/* 2. Suara / Dikte Voice Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  item_type: activeTab === 'all' || activeTab === 'low_stock' ? 'product_stock' : activeTab,
                  qty: 1,
                  unit: 'pcs',
                  cost_price: 0,
                  mode: filterMode,
                  business_type: businessType,
                  template_id: businessType,
                  business_name: businessTitle,
                });
                setInputMode('voice');
                setIsEditModalOpen(true);
                setTimeout(() => {
                  startVoiceRecognition();
                }, 100);
              }}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="2. Dikte Suara Instan"
            >
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'id' ? '2. Suara AI' : '2. Voice AI'}</span>
            </button>

            {/* 3. Katalog Cepat Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  item_type: activeTab === 'all' || activeTab === 'low_stock' ? 'product_stock' : activeTab,
                  qty: 1,
                  unit: 'pcs',
                  cost_price: 0,
                  mode: filterMode,
                  business_type: businessType,
                  template_id: businessType,
                  business_name: businessTitle,
                });
                setInputMode('catalog');
                setIsEditModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="3. Pilih dari Katalog Cepat 1-Klik"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{language === 'id' ? '3. Katalog' : '3. Preset'}</span>
            </button>

            {/* 4. Tambah Manual Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  item_type: activeTab === 'all' || activeTab === 'low_stock' ? 'product_stock' : activeTab,
                  qty: 1,
                  unit: 'pcs',
                  cost_price: 0,
                  mode: filterMode,
                  business_type: businessType,
                  template_id: businessType,
                  business_name: businessTitle,
                });
                setInputMode('manual');
                setIsEditModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'id' ? '4. Tambah Form' : '4. Add Item'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
              title="Export CSV / Excel"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INVENTORY ITEMS LIST (GROUPED BY CLASSIFICATION) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-600 dark:text-slate-300">
                {language === 'id'
                  ? 'Belum ada item inventaris pada kategori ini.'
                  : 'No inventory items found.'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                {language === 'id'
                  ? 'Gunakan tombol Foto Faktur AI untuk scan nota kulakan, atau klik Tambah Item untuk mencatat stok awal.'
                  : 'Use Scan Invoice AI to scan supplier receipts or click Add Item to record your initial stock.'}
              </p>
            </div>
          ) : (
            groupedInventory.map((group) => (
              <div key={group.id} className="flex flex-col gap-2">
                {/* KELOMPOK GROUP HEADER */}
                <div className="flex items-center justify-between p-2.5 px-3 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{group.icon}</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {group.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2 font-bold">
                        ({group.items.length} {language === 'id' ? 'item terdata' : 'items'})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        group.isFixedAsset
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {group.isFixedAsset
                        ? language === 'id' ? '🔒 Aset Tetap / Permanen' : 'Fixed Asset'
                        : language === 'id' ? '🔄 Stok Berjalan' : 'Stock'}
                    </span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                      {formatRupiah(group.totalModal)}
                    </span>
                  </div>
                </div>

                {/* ITEMS IN THIS GROUP */}
                <div className="flex flex-col gap-2 pl-1 sm:pl-2">
                  {group.items.map((item) => {
                    const subtotalModal = item.qty * item.cost_price;
                    const isLowStock = item.min_stock_alert && item.qty <= item.min_stock_alert;
                    const lastQty = item.last_month_qty !== undefined ? item.last_month_qty : item.qty;
                    const diff = item.qty - lastQty;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLowStock
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400 shadow-2xs'
                        }`}
                      >
                        {/* Item Info Left */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                              item.item_type === 'product_stock'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200'
                                : item.item_type === 'raw_material'
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200'
                            }`}
                          >
                            {item.item_type === 'product_stock' ? (
                              <ShoppingBag className="w-4 h-4" />
                            ) : item.item_type === 'raw_material' ? (
                              <Utensils className="w-4 h-4" />
                            ) : (
                              <Wrench className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                                {item.name}
                              </h3>

                              {/* Item Category Badge */}
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                                  item.item_type === 'product_stock'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                    : item.item_type === 'raw_material'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                }`}
                              >
                                {item.category_name || (item.item_type === 'product_stock' ? 'Barang Dagang' : item.item_type === 'raw_material' ? 'Bahan Baku' : 'Peralatan/Aset')}
                              </span>

                              {/* Barcode/SKU if available */}
                              {item.sku_barcode && (
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                                  {item.sku_barcode}
                                </span>
                              )}

                              {/* Low stock alert badge */}
                              {isLowStock && (
                                <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {language === 'id' ? 'Stok Menipis' : 'Low Stock'}
                                </span>
                              )}
                            </div>

                            {/* Cost & Price Details */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                              <span>
                                {language === 'id' ? 'Harga Modal:' : 'Cost:'}{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {formatRupiah(item.cost_price)}
                                </strong>
                                /{item.unit}
                              </span>

                              {item.selling_price && (
                                <span>
                                  {language === 'id' ? 'Harga Jual:' : 'Selling:'}{' '}
                                  <strong className="text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(item.selling_price)}
                                  </strong>
                                  {' ('}
                                  {Math.round(((item.selling_price - item.cost_price) / item.cost_price) * 100)}% margin)
                                </span>
                              )}

                              {item.acquisition_date && (
                                <span>
                                  {language === 'id' ? 'Tgl Beli:' : 'Acquired:'} {item.acquisition_date}
                                </span>
                              )}
                            </div>

                            {/* POSISI INVENTARIS BULAN SEBELUMNYA (SIMPEL, JELAS, SEKALI LIHAT PAHAM) */}
                            {item.item_type === 'equipment_asset' || group.isFixedAsset ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 mt-2">
                                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>
                                  {language === 'id' ? 'Posisi Bulan Lalu:' : 'Last Month:'}{' '}
                                  <strong>{lastQty} {item.unit}</strong>{' '}
                                  ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong>{item.qty} {item.unit}</strong>{' '}
                                  <span className="text-amber-700 dark:text-amber-400 font-normal">
                                    ({language === 'id' ? '🔒 Aset Tetap / Modal Permanen - Terbawa Otomatis' : 'Permanent Fixed Asset - Auto Carried Over'})
                                  </span>
                                </span>
                              </div>
                            ) : (
                              (() => {
                                if (diff < 0) {
                                  return (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800/60 mt-2">
                                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                      <span>
                                        {language === 'id' ? 'Posisi Bulan Lalu:' : 'Last Month:'}{' '}
                                        <strong className="line-through opacity-75">{lastQty} {item.unit}</strong>{' '}
                                        ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong className="text-rose-700 dark:text-rose-300">{item.qty} {item.unit}</strong>{' '}
                                        <span className="bg-rose-200/90 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 px-1.5 py-0.2 rounded font-black ml-1">
                                          -{Math.abs(diff)} {item.unit} {language === 'id' ? 'Terpakai / Terjual' : 'Used'}
                                        </span>
                                      </span>
                                    </div>
                                  );
                                } else if (diff > 0) {
                                  return (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60 mt-2">
                                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>
                                        {language === 'id' ? 'Posisi Bulan Lalu:' : 'Last Month:'}{' '}
                                        <strong className="opacity-75">{lastQty} {item.unit}</strong>{' '}
                                        ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong className="text-emerald-700 dark:text-emerald-300">{item.qty} {item.unit}</strong>{' '}
                                        <span className="bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.2 rounded font-black ml-1">
                                          +{diff} {item.unit} {language === 'id' ? 'Restock / Masuk Baru' : 'Restocked'}
                                        </span>
                                      </span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800/60 mt-2">
                                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span>
                                        {language === 'id' ? 'Posisi Bulan Lalu:' : 'Last Month:'}{' '}
                                        <strong>{lastQty} {item.unit}</strong>{' '}
                                        ➔ {language === 'id' ? 'Bulan Ini:' : 'This Month:'} <strong>{item.qty} {item.unit}</strong>{' '}
                                        <span className="text-blue-700 dark:text-blue-400 font-normal">
                                          ({language === 'id' ? 'Stok Utuh / Tidak Berubah' : 'Same Stock'})
                                        </span>
                                      </span>
                                    </div>
                                  );
                                }
                              })()
                            )}
                          </div>
                        </div>

                        {/* Item Qty, Valuation & Action Buttons Right */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60 shrink-0">
                          {/* Qty Adjustment Controls */}
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQuickQtyChange(item, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-black shadow-xs hover:bg-slate-200 cursor-pointer"
                              title="Kurangi 1 Qty"
                            >
                              -
                            </button>
                            <span className="text-xs font-black px-1.5 text-slate-900 dark:text-white min-w-8 text-center">
                              {item.qty} {item.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickQtyChange(item, 1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-black shadow-xs hover:bg-slate-200 cursor-pointer"
                              title="Tambah 1 Qty"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal Invested Value */}
                          <div className="text-right min-w-24">
                            <span className="text-[9px] text-slate-400 block font-bold">
                              {language === 'id' ? 'Modal Tertanam' : 'Invested Value'}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300">
                              {formatRupiah(subtotalModal)}
                            </span>
                          </div>

                          {/* Edit & Delete Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {language === 'id'
                ? 'Data stok & peralatan modal otomatis terhubung ke Laporan Neraca & Wizard Anggaran.'
                : 'Inventory & asset values are automatically synced to Balance Sheet and Budget Wizard.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:opacity-90 transition-all cursor-pointer shrink-0"
          >
            {language === 'id' ? 'Selesai / Tutup' : 'Done / Close'}
          </button>
        </div>
      </div>

      {/* SUB-MODAL: TAMBAH / EDIT ITEM INVENTARIS (4-MODE SYSTEM) */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto">
          <form
            onSubmit={handleSaveItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-3 max-h-[92vh] overflow-y-auto my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingItem.id
                      ? language === 'id'
                        ? 'Edit / Update Stok Inventaris'
                        : 'Edit / Update Stock'
                      : language === 'id'
                      ? 'Input Item Inventaris & Modal'
                      : 'Add Inventory & Asset Item'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {businessTitle ? `Database: ${businessTitle}` : 'Inventaris Usaha & Operasional'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceRecognition();
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 INPUT MODES SELECTOR - RICH VIBRANT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Scan AI */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceRecognition();
                  setInputMode('scan');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                  inputMode === 'scan'
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white border-blue-400 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      inputMode === 'scan'
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      inputMode === 'scan'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                    }`}
                  >
                    AI Vision
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black leading-tight">1. Foto / Nota AI</div>
                  <div className={`text-[10px] mt-0.5 ${inputMode === 'scan' ? 'text-blue-100' : 'text-slate-400'}`}>
                    Scan faktur otomatis
                  </div>
                </div>
              </button>

              {/* 2. Suara AI */}
              <button
                type="button"
                onClick={() => {
                  setInputMode('voice');
                  if (!isListening) startVoiceRecognition();
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                  inputMode === 'voice'
                    ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 text-white border-rose-400 shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/50 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      inputMode === 'voice'
                        ? 'bg-white/20 text-white shadow-xs animate-pulse'
                        : 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      inputMode === 'voice'
                        ? 'bg-white text-rose-700 font-black animate-pulse'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    Voice AI
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black leading-tight">2. Suara AI</div>
                  <div className={`text-[10px] mt-0.5 ${inputMode === 'voice' ? 'text-rose-100' : 'text-slate-400'}`}>
                    Catat sambil bicara
                  </div>
                </div>
              </button>

              {/* 3. Katalog Cepat */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceRecognition();
                  setInputMode('catalog');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                  inputMode === 'catalog'
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02] font-black'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      inputMode === 'catalog'
                        ? 'bg-black/15 text-slate-950 shadow-xs'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      inputMode === 'catalog'
                        ? 'bg-slate-950 text-amber-400 font-black'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    1-Klik
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black leading-tight">3. Katalog Cepat</div>
                  <div className={`text-[10px] mt-0.5 ${inputMode === 'catalog' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    Preset standar usaha
                  </div>
                </div>
              </button>

              {/* 4. Form Manual */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceRecognition();
                  setInputMode('manual');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                  inputMode === 'manual'
                    ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white border-emerald-400 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      inputMode === 'manual'
                        ? 'bg-white/20 text-white shadow-xs'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      inputMode === 'manual'
                        ? 'bg-white text-emerald-700 font-black'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                    }`}
                  >
                    Manual
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black leading-tight">4. Form Cepat</div>
                  <div className={`text-[10px] mt-0.5 ${inputMode === 'manual' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Input manual fleksibel
                  </div>
                </div>
              </button>
            </div>

            {/* PANEL MODE 1: SCAN FAKTUR / FOTO NOTA AI */}
            {inputMode === 'scan' && (
              <div className="p-3.5 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border-2 border-blue-300 dark:border-blue-800/80 flex flex-col gap-2.5 animate-fadeIn shadow-xs">
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleInvoiceUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                    <Camera className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <span>{language === 'id' ? 'Foto Nota Kulakan / Faktur Supplier' : 'Scan Supplier Invoice Receipt'}</span>
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-black">AI OCR</span>
                    </h4>
                    <p className="text-[10px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                      {language === 'id'
                        ? 'AI langsung mengekstrak nama barang, kuantitas, dan harga beli modal otomatis.'
                        : 'AI automatically reads items, quantities, and cost prices from receipt.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={isOcrLoading}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>
                      {isOcrLoading
                        ? language === 'id' ? 'Menganalisis Foto Faktur AI...' : 'Analyzing Invoice...'
                        : language === 'id' ? '📸 Ambil Foto / Unggah Nota Faktur' : '📸 Take Photo / Upload Invoice'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* PANEL MODE 2: SUARA / DIKTE VOICE AI */}
            {inputMode === 'voice' && (
              <div className="p-3.5 bg-gradient-to-br from-rose-50/90 to-pink-50/90 dark:from-rose-950/40 dark:to-pink-950/40 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 flex flex-col gap-2.5 animate-fadeIn shadow-xs">
                {/* Hidden Audio File Input for Native Phone Voice Recording */}
                <input
                  type="file"
                  accept="audio/*"
                  capture="microphone"
                  ref={voiceAudioFileInputRef}
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md transition-all ${
                        isListening
                          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/50 shadow-rose-600/40'
                          : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                        <span>
                          {isListening
                            ? language === 'id'
                              ? '🎙️ Mendengarkan Suara Anda...'
                              : '🎙️ Listening to your voice...'
                            : language === 'id'
                              ? '🎙️ Dikte Suara Instan (100% Mobile Ready)'
                              : '🎙️ Voice Dictation'}
                        </span>
                        {isListening && (
                          <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black animate-pulse">
                            REC
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-rose-800/80 dark:text-rose-300/80">
                        {language === 'id'
                          ? 'Bicara santai, AI otomatis mendeteksi nama barang, qty, dan harga modal.'
                          : 'Speak naturally, AI automatically extracts item name, qty, and price.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5 ${
                      isListening
                        ? 'bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 shadow-rose-600/30'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-3.5 h-3.5 animate-bounce" />
                        <span>{language === 'id' ? '⏹ Selesai Bicara' : '⏹ Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>{language === 'id' ? '🎙️ Mulai Bicara' : '🎙️ Start Voice'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Transcript / Feedback Display */}
                {(voiceTranscript || voiceFeedback) && (
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 font-medium italic flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
                    <span>{voiceFeedback || `"${voiceTranscript}"`}</span>
                  </div>
                )}

                {/* Prompt Suggestions */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300">
                    {language === 'id' ? '💡 Contoh ucapan (Klik untuk coba langsung):' : '💡 Example voice phrases (Click to try):'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      businessType === 'fnb_culinary'
                        ? 'Biji Kopi Arabika 10 kg harga 180 ribu'
                        : businessType === 'workshop_service'
                        ? 'Oli Mesin Matic 20 botol harga 42 ribu'
                        : businessType === 'project_contract'
                        ? 'Semen PCC 50 zak harga 64 ribu'
                        : 'Beras Ramos 10 karung harga 68 ribu',
                      'Minyak Goreng 24 pouch harga 31 ribu',
                      'Meja Kasir 1 unit 2 juta 500 ribu',
                    ].map((examplePhrase, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setVoiceTranscript(examplePhrase);
                          const parsed = parseVoiceToInventoryItem(examplePhrase);
                          setEditingItem((prev) => ({
                            ...prev,
                            name: parsed.name,
                            qty: parsed.qty || 1,
                            unit: parsed.unit || 'pcs',
                            cost_price: parsed.cost_price || 0,
                            item_type: parsed.item_type || 'product_stock',
                            category_name: parsed.category_name,
                          }));
                          setVoiceFeedback(
                            language === 'id'
                              ? `✅ Berhasil mengisi: ${parsed.name} (${parsed.qty} ${parsed.unit}) @ Rp ${parsed.cost_price.toLocaleString('id-ID')}`
                              : `✅ Filled: ${parsed.name}`
                          );
                        }}
                        className="px-2 py-1 bg-white/90 dark:bg-slate-800 text-[10px] font-bold text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer text-left transition-all shadow-2xs"
                      >
                        🗣️ &ldquo;{examplePhrase}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>

                {voiceFeedback && (
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{voiceFeedback}</span>
                  </div>
                )}
              </div>
            )}

            {/* PANEL MODE 3: KATALOG PRESET CEPAT 1-KLIK */}
            {inputMode === 'catalog' && (
              <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/40 dark:to-orange-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 flex flex-col gap-2.5 animate-fadeIn shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                      {language === 'id' ? 'Pilih Cepat dari Katalog Standar Usaha' : 'Quick Pick Standard Catalog'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200/90 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300/80">
                    ⚡ 1-Klik Terisi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {quickPresets.map((preset) => {
                    const isSelected = editingItem.name === preset.name;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditingItem((prev) => ({
                            ...prev,
                            name: preset.name,
                            unit: preset.unit,
                            cost_price: preset.default_cost,
                            selling_price: preset.default_selling,
                            item_type: preset.item_type,
                            category_name: preset.category_name,
                            qty: prev?.qty || 1,
                          }));
                          setIsCustomCategory(false);
                        }}
                        className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/30 font-black'
                            : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-black truncate text-[11px]">{preset.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 shrink-0 font-bold">
                            {preset.unit}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-80 flex items-center justify-between">
                          <span>{preset.category_name}</span>
                          <span className="font-bold">{formatRupiah(preset.default_cost)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORM FIELDS (ACTIVE & ADJUSTABLE ACROSS ALL MODES) */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Nama Barang */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'id' ? 'Nama Barang / Bahan / Peralatan *' : 'Item Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder={
                    language === 'id'
                      ? 'Contoh: Beras Ramos 5kg, Biji Kopi Gayo, Meja Kasir...'
                      : 'e.g. Arabica Beans 1kg, Cashier Desk...'
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              {/* Tipe Item & Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Klasifikasi Item (Expanded Categories & Custom Category Option) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'id' ? 'Klasifikasi / Kategori Item *' : 'Classification *'}
                  </label>
                  <select
                    value={
                      isCustomCategory
                        ? 'custom'
                        : editingItem.category_name === 'Bahan Kemasan'
                        ? 'packaging'
                        : editingItem.category_name === 'Furniture/Mebel'
                        ? 'furniture'
                        : editingItem.category_name === 'Perlengkapan/ATK'
                        ? 'atk'
                        : editingItem.category_name === 'Kendaraan Operasional'
                        ? 'vehicle'
                        : editingItem.category_name === 'Aset Investasi'
                        ? 'investment'
                        : editingItem.category_name === 'Bahan Baku/Stok' || editingItem.item_type === 'raw_material'
                        ? 'raw_material'
                        : editingItem.category_name === 'Peralatan/Aset'
                        ? 'equipment_asset'
                        : editingItem.item_type || 'product_stock'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setIsCustomCategory(true);
                        setEditingItem({
                          ...editingItem,
                          item_type: 'equipment_asset',
                          category_name: customCategoryText || 'Kategori Lainnya',
                        });
                      } else {
                        setIsCustomCategory(false);
                        if (val === 'packaging') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'raw_material',
                            category_name: 'Bahan Kemasan',
                          });
                        } else if (val === 'furniture') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'equipment_asset',
                            category_name: 'Furniture/Mebel',
                          });
                        } else if (val === 'atk') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'equipment_asset',
                            category_name: 'Perlengkapan/ATK',
                          });
                        } else if (val === 'vehicle') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'equipment_asset',
                            category_name: 'Kendaraan Operasional',
                          });
                        } else if (val === 'investment') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'equipment_asset',
                            category_name: 'Aset Investasi',
                          });
                        } else if (val === 'raw_material') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'raw_material',
                            category_name: 'Bahan Baku/Stok',
                          });
                        } else if (val === 'equipment_asset') {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'equipment_asset',
                            category_name: 'Peralatan/Aset',
                          });
                        } else {
                          setEditingItem({
                            ...editingItem,
                            item_type: 'product_stock',
                            category_name: 'Barang Dagangan',
                          });
                        }
                      }
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
                  >
                    <option value="product_stock">📦 Barang Dagangan Siap Jual (Retail / Produk Jadi)</option>
                    <option value="raw_material">🌾 Bahan Baku, Dapur & Produksi</option>
                    <option value="packaging">📦 Bahan Kemasan & Packaging (Cup, Dus, Plastik, Kardus)</option>
                    <option value="equipment_asset">🛠️ Peralatan & Mesin Usaha Utama</option>
                    <option value="furniture">🪑 Furniture, Meja, Kursi & Rak Etalase</option>
                    <option value="atk">📑 Perlengkapan Kasir, POS & ATK Kantor</option>
                    <option value="vehicle">🚚 Kendaraan Operasional Usaha (Motor / Mobil / Pickup)</option>
                    <option value="investment">💎 Aset Investasi / Berharga Lainnya (Emas / Properti)</option>
                    <option value="custom">🏷️ Pilihan Kategori Lainnya (Ketik Sendiri...)</option>
                  </select>

                  {/* Text Input for Custom Category */}
                  {isCustomCategory && (
                    <div className="mt-1.5 animate-fadeIn">
                      <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        {language === 'id' ? 'Ketik Nama Kategori Lainnya:' : 'Custom Category Name:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={customCategoryText}
                        onChange={(e) => {
                          setCustomCategoryText(e.target.value);
                          setEditingItem({
                            ...editingItem,
                            category_name: e.target.value || 'Kategori Lainnya',
                          });
                        }}
                        placeholder={
                          language === 'id'
                            ? 'Contoh: Bibit Tanaman, Pupuk, Sparepart Elektronik...'
                            : 'e.g. Plant Seeds, Fertilizers...'
                        }
                        className="w-full p-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 font-bold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Satuan Unit with Expanded Chips & "Lainnya" Button */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'id' ? 'Satuan Unit *' : 'Unit *'}
                  </label>
                  <input
                    ref={unitInputRef}
                    type="text"
                    required
                    value={editingItem.unit || 'pcs'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="pcs, kg, botol, karton, set, lainnya..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  {/* Expanded Quick Unit Chips */}
                  <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto pr-0.5">
                    {[
                      'pcs',
                      'kg',
                      'gram',
                      'liter',
                      'ml',
                      'karung',
                      'pouch',
                      'botol',
                      'dus',
                      'box',
                      'set',
                      'unit',
                      'zak',
                      'batang',
                      'lembar',
                      'meter',
                      'roll',
                      'pack',
                      'pail',
                      'rit',
                      'keping',
                      'lusin',
                    ].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, unit: u })}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          editingItem.unit?.toLowerCase() === u
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                    {/* "+ Lainnya" Button to focus input */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem({ ...editingItem, unit: '' });
                        unitInputRef.current?.focus();
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 cursor-pointer"
                    >
                      ➕ {language === 'id' ? 'Lainnya...' : 'Other...'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Jumlah (Qty) & Harga Beli Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {language === 'id' ? 'Jumlah Stok (Qty) *' : 'Current Qty *'}
                    </label>
                    {/* Stepper buttons */}
                    <div className="flex items-center gap-1">
                      {[-5, -1, 1, 5].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              qty: Math.max(0, (Number(editingItem.qty) || 0) + delta),
                            })
                          }
                          className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editingItem.qty || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, qty: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-black"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'id' ? 'Harga Beli Modal / Unit (Rp) *' : 'Cost Price / Unit *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.cost_price || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, cost_price: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-black"
                  />
                  {/* Quick Price Helper Pills */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { label: '+10rb', val: 10000 },
                      { label: '+50rb', val: 50000 },
                      { label: '+100rb', val: 100000 },
                      { label: '+1jt', val: 1000000 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setEditingItem({
                            ...editingItem,
                            cost_price: (Number(editingItem.cost_price) || 0) + p.val,
                          })
                        }
                        className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posisi Bulan Lalu & Harga Jual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {language === 'id' ? 'Posisi Stok Bulan Lalu (Qty)' : 'Last Month Qty'}
                    </label>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {editingItem.item_type === 'equipment_asset'
                        ? language === 'id' ? '🔒 Aset Tetap' : 'Fixed'
                        : language === 'id' ? 'Referensi Lalu' : 'Ref'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      editingItem.last_month_qty !== undefined
                        ? editingItem.last_month_qty
                        : editingItem.qty !== undefined
                        ? editingItem.qty
                        : ''
                    }
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        last_month_qty: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder={String(editingItem.qty || 1)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'id' ? 'Harga Jual / Unit (Opsional)' : 'Selling Price (Optional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.selling_price || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        selling_price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Rp..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-black"
                  />
                </div>
              </div>

              {/* Batas Minimum Restock Alert */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'id' ? 'Batas Minimum Stok Restock Alert (Opsional)' : 'Min Restock Alert Qty'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.min_stock_alert || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      min_stock_alert: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Contoh: 5"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Total Modal Preview Card */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    💰
                  </div>
                  <div>
                    <span className="block text-[11px] font-black">
                      {language === 'id' ? 'Subtotal Modal Berjalan:' : 'Subtotal Capital:'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {editingItem.qty || 0} {editingItem.unit || 'pcs'} × {formatRupiah(Number(editingItem.cost_price) || 0)}
                    </span>
                  </div>
                </div>
                <span className="font-black text-indigo-700 dark:text-indigo-300 text-base">
                  {formatRupiah((Number(editingItem.qty) || 0) * (Number(editingItem.cost_price) || 0))}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceRecognition();
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{language === 'id' ? 'Simpan Item Inventaris' : 'Save Item'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-MODAL: AI INVOICE OCR PREVIEW & BATCH SAVE */}
      {ocrPreviewItems && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'id' ? 'Hasil Analisa AI Faktur Pembelian Stok' : 'AI Invoice OCR Results'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'id'
                      ? `Terdeteksi ${ocrPreviewItems.length} item barang dari ${ocrSupplierName || 'Supplier'}`
                      : `Found ${ocrPreviewItems.length} items from ${ocrSupplierName || 'Supplier'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOcrPreviewItems(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of scanned items */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[50vh] pr-1">
              {ocrPreviewItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => {
                        const updated = [...ocrPreviewItems];
                        updated[idx].name = e.target.value;
                        setOcrPreviewItems(updated);
                      }}
                      className="font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 w-full outline-none"
                    />
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>
                        Harga Modal: <strong>{formatRupiah(it.cost_price)}</strong>/{it.unit || 'pcs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-indigo-700 dark:text-indigo-300">
                      {it.qty} {it.unit || 'pcs'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(it.qty * it.cost_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = ocrPreviewItems.filter((_, i) => i !== idx);
                        setOcrPreviewItems(updated);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Total:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                  {formatRupiah(ocrPreviewItems.reduce((s, it) => s + it.qty * it.cost_price, 0))}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOcrPreviewItems(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOcrBatchSave}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Simpan Semua Item ke Stok' : 'Import All to Inventory'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
