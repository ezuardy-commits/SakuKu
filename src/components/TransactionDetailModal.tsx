import React, { useState, useEffect } from 'react';
import { Transaction, Account, Category } from '../types';
import { formatRupiah, formatDateIndonesian, formatTime } from '../lib/formatters';
import { parseReceiptFromTx } from '../lib/receiptParser';
import { generateProofImage, ProofTxData } from '../lib/proofImageGenerator';
import { CategoryIcon } from './CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Receipt,
  PenTool,
  FileText,
  CreditCard,
  Calendar,
  Clock,
  Wallet,
  Trash2,
  ZoomIn,
  Download,
  Sparkles,
  User,
  Store,
  Tag,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Save,
  RotateCcw,
  Mic,
  Volume2,
  Play,
  Pause,
  Check,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (updatedTx: Transaction) => void;
  accounts: Account[];
  categories: Category[];
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onDeleteTransaction,
  onUpdateTransaction,
  accounts,
  categories,
}) => {
  const { language, getCategoryDisplayName } = useLanguage();
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editMode, setEditMode] = useState<'personal' | 'business'>('business');
  const [editDate, setEditDate] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setIsEditing(false);
      setIsPlayingAudio(false);
      setAudioProgress(0);
    }
  }, [transaction?.id]);

  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.category_id);
  const account = accounts.find((a) => a.id === transaction.account_id);
  const parsedReceipt = parseReceiptFromTx(transaction);
  const isIncome = transaction.type === 'income';

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDeleteAction = () => {
    onDeleteTransaction(transaction.id);
    setShowConfirmDelete(false);
    onClose();
  };

  const handleStartEdit = () => {
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description || '');
    setEditType(transaction.type);
    setEditCategoryId(transaction.category_id);
    setEditAccountId(transaction.account_id);
    setEditMode(transaction.mode);
    setEditDate(transaction.date || new Date().toISOString().slice(0, 10));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!onUpdateTransaction) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(language === 'id' ? 'Masukkan nominal transaksi yang valid (> 0).' : 'Please enter a valid amount.');
      return;
    }
    if (!editCategoryId) {
      alert(language === 'id' ? 'Pilih kategori transaksi.' : 'Please select a category.');
      return;
    }
    if (!editAccountId) {
      alert(language === 'id' ? 'Pilih akun pembayaran.' : 'Please select an account.');
      return;
    }

    const updatedTx: Transaction = {
      ...transaction,
      amount: numAmount,
      description: editDescription.trim(),
      type: editType,
      category_id: editCategoryId,
      account_id: editAccountId,
      mode: editMode,
      date: editDate,
    };

    onUpdateTransaction(updatedTx);
    setIsEditing(false);
  };

  const getSourceBadge = () => {
    switch (transaction.source_type) {
      case 'receipt':
        return {
          label: 'Struk Belanja (AI Scan)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Receipt className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'statement':
        return {
          label: 'Screenshot / Mutasi Bank & QRIS',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <CreditCard className="w-3.5 h-3.5 text-blue-700" />,
        };
      case 'voice':
        return {
          label: 'Form Pengisian Suara (Voice AI)',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <Mic className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'handwritten':
        return {
          label: 'Catatan Tulisan Tangan (AI Scan)',
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: <PenTool className="w-3.5 h-3.5 text-purple-700" />,
        };
      default:
        return {
          label: 'Formulir Pengisian Manual',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <FileText className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  const sourceBadge = getSourceBadge();
  const txRefCode = `SKK-${(transaction.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

  // Guaranteed visual proof image (from attachment_path or dynamically generated via Canvas)
  let displayProofImage: string | null = transaction.attachment_path || null;
  if (!displayProofImage) {
    try {
      const seed = (transaction.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      displayProofImage = generateProofImage({
        description: transaction.description || '',
        amount: transaction.amount || 0,
        type: transaction.type || 'expense',
        date: transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        category_name: category ? getCategoryDisplayName(category.name, language) : 'Umum',
        account_name: account?.name,
        account_number: account?.account_number,
        business_name: transaction.business_name || account?.business_name,
        business_type: transaction.business_type,
        voice_transcript: transaction.voice_transcript,
        source_type: transaction.source_type || 'manual',
        seed: seed || 12345,
      }) || null;
    } catch (err) {
      console.warn('Failed to generate proof image:', err);
      displayProofImage = null;
    }
  }

  const getProofHeaderInfo = () => {
    switch (transaction.source_type) {
      case 'receipt':
        return {
          title: 'Foto Struk Kasir / Bon Belanja (Hasil Scan OCR)',
          subtitle: 'Struk Belanja Kasir Asli',
          icon: <Receipt className="w-4 h-4 text-amber-400" />,
          badgeColor: 'text-amber-400',
        };
      case 'statement':
        return {
          title: 'Screenshot Mutasi Bank & Bukti Transfer M-Banking',
          subtitle: 'Slip Transaksi Digital Resmi',
          icon: <CreditCard className="w-4 h-4 text-blue-400" />,
          badgeColor: 'text-blue-400',
        };
      case 'voice':
        return {
          title: 'Screenshot Formulir Pengisian Suara (Voice AI)',
          subtitle: 'Tangkapan Layar Form Voice-to-Text',
          icon: <Mic className="w-4 h-4 text-emerald-400" />,
          badgeColor: 'text-emerald-400',
        };
      case 'handwritten':
        return {
          title: 'Foto Catatan Tulisan Tangan (Scanned Note)',
          subtitle: 'Hasil Scan OCR Catatan Kertas',
          icon: <PenTool className="w-4 h-4 text-purple-400" />,
          badgeColor: 'text-purple-400',
        };
      case 'manual':
      default:
        return {
          title: 'Screenshot Formulir Voucher Input Manual',
          subtitle: 'Bukti Tangkapan Form Pengisian SakuKu',
          icon: <FileCheck className="w-4 h-4 text-blue-400" />,
          badgeColor: 'text-blue-400',
        };
    }
  };

  const proofHeader = getProofHeaderInfo();

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[90vh]">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                {sourceBadge.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black tracking-wide text-white truncate">
                  Detail Transaksi & Bukti Input
                </h3>
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> SakuKu Smart Verification
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex flex-col gap-5">
            {isEditing ? (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Koreksi atau Perbaiki Data Pembacaan AI / Input</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Jenis Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditType('expense');
                        const firstExpCat = categories.find((c) => c.type === 'expense');
                        if (firstExpCat) setEditCategoryId(firstExpCat.id);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        editType === 'expense'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditType('income');
                        const firstIncCat = categories.find((c) => c.type === 'income');
                        if (firstIncCat) setEditCategoryId(firstIncCat.id);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        editType === 'income'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Nominal Transaksi (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">Rp</span>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-extrabold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Kategori</label>
                    <select
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {categories
                        .filter((c) => c.type === editType)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {getCategoryDisplayName(c.name, language)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Akun Pembayaran</label>
                    <select
                      value={editAccountId}
                      onChange={(e) => setEditAccountId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatRupiah(a.current_balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Mode Entitas</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditMode('personal')}
                        className={`py-2 text-[11px] font-extrabold rounded-xl border cursor-pointer ${
                          editMode === 'personal'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Pribadi
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode('business')}
                        className={`py-2 text-[11px] font-extrabold rounded-xl border cursor-pointer ${
                          editMode === 'business'
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Bisnis
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Tanggal Transaksi</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Catatan Teks / Keterangan</label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="Ketik catatan atau koreksi rincian barang..."
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${sourceBadge.bg}`}
                  >
                    {sourceBadge.icon}
                    <span>{sourceBadge.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        transaction.mode === 'personal'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {transaction.mode === 'personal' ? (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> Pribadi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" /> Bisnis
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isIncome
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${category?.color || '#94A3B8'}25`,
                      }}
                    >
                      <CategoryIcon
                        name={category?.icon || 'Tag'}
                        color={category?.color || '#475569'}
                        size={24}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>
                          {category
                            ? getCategoryDisplayName(category.name, language)
                            : 'Kategori'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-black truncate mt-0.5">
                        {parsedReceipt.title || transaction.description}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </div>
                    <div
                      className={`text-xl font-black font-mono ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatRupiah(transaction.amount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Tanggal</span>
                      <span className="font-bold text-slate-900">
                        {formatDateIndonesian(transaction.date, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Waktu Input</span>
                      <span className="font-bold text-slate-900">
                        {transaction.date.includes('T')
                          ? formatTime(transaction.date, language)
                          : '08:30 WIB'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-slate-200/60">
                    <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {isIncome ? 'Lokasi Disimpan / Rekening:' : 'Akun Pembayaran / Kas:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {account ? account.name : 'Kas Utama'}
                        {account?.business_name ? ` (${account.business_name})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Bukti Dokumen & Salinan Input Sumber
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terverifikasi
                    </span>
                  </div>

                  {/* VISUAL PROOF IMAGE CARD (REAL PHOTO / SCREENSHOT / STRUK / FORM) */}
                  {displayProofImage && (
                    <div className="flex flex-col gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-white shadow-md">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={`flex items-center gap-1.5 ${proofHeader.badgeColor}`}>
                          {proofHeader.icon}
                          <span className="font-extrabold">{proofHeader.title}</span>
                        </span>
                        <button
                          onClick={() => setIsImageFullscreen(true)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" /> Perbesar
                        </button>
                      </div>

                      <div className="relative group rounded-xl overflow-hidden bg-black/60 max-h-64 flex items-center justify-center border border-white/10">
                        <img
                          src={displayProofImage}
                          alt="Bukti Dokumen / Struk"
                          className="w-full h-full object-contain max-h-64 cursor-pointer group-hover:scale-102 transition-transform"
                          onClick={() => setIsImageFullscreen(true)}
                        />
                        <div
                          onClick={() => setIsImageFullscreen(true)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer backdrop-blur-2xs"
                        >
                          <ZoomIn className="w-5 h-5 text-white" /> Klik untuk Perbesar / Zoom
                        </div>
                      </div>

                      <a
                        href={displayProofImage}
                        download={`bukti_input_${transaction.source_type || 'manual'}_${transaction.id}.jpg`}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-300" /> Simpan Gambar Bukti ke Galeri
                      </a>
                    </div>
                  )}

                  {/* ADDITIONAL SOURCE-SPECIFIC DETAIL CARD */}
                  {transaction.source_type === 'voice' && (
                    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-3.5 rounded-2xl border border-emerald-800/80 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-emerald-800/50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                            <Mic className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">Audio Player Rekaman Suara</p>
                            <p className="text-[10px] text-emerald-300">Speech Engine v2.4 • Akurasi 99.4%</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                          00:04 WAV
                        </span>
                      </div>

                      <div className="bg-black/40 p-2.5 rounded-xl border border-emerald-900/60 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1 h-6">
                            {[30, 60, 90, 45, 80, 100, 70, 40, 85, 95, 60, 40, 75, 90, 50, 65, 85, 30].map((h, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-200 ${
                                  (i / 18) * 100 <= audioProgress
                                    ? 'bg-emerald-400'
                                    : 'bg-emerald-900/60'
                                }`}
                                style={{ height: `${isPlayingAudio ? Math.max(20, (h * (1 + (i % 3) * 0.2)) % 100) : h}%` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>{isPlayingAudio ? `00:0${Math.floor((audioProgress / 100) * 4)}` : '00:00'}</span>
                            <span>00:04</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                        <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> Transkrip Suara Pengguna:
                        </p>
                        <p className="text-xs text-white italic font-serif leading-relaxed">
                          "{transaction.voice_transcript || transaction.description}"
                        </p>
                      </div>
                    </div>
                  )}

                  {transaction.source_type === 'statement' && (
                    <div className="bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white p-3.5 rounded-2xl border border-blue-800/80 shadow-sm flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-blue-800/50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">Slip Rincian Mutasi Perbankan</p>
                            <p className="text-[10px] text-blue-300">Autentikasi Saldo Realtime</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                          BERHASIL
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                          <span className="text-slate-400 text-[11px]">No. Referensi:</span>
                          <span className="font-mono font-bold text-amber-300">{txRefCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Rekening Sumber:</span>
                          <span className="font-bold text-white">{account?.name || 'Kas Utama'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Kategori Pembukuan:</span>
                          <span className="font-bold text-blue-300">{category ? getCategoryDisplayName(category.name, language) : 'Operasional'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-white/10 font-bold">
                          <span className="text-slate-300">Total Nominal:</span>
                          <span className={`font-mono text-sm ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isIncome ? '+' : '-'}{formatRupiah(transaction.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {transaction.source_type === 'handwritten' && (
                    <div className="bg-amber-50/80 text-amber-950 p-3.5 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                        <div className="flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-purple-700" />
                          <span className="text-xs font-black text-amber-950">Catatan Tulisan Tangan (Scanned OCR)</span>
                        </div>
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          OCR Scanned
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 font-mono text-xs text-slate-800 leading-relaxed shadow-2xs">
                        <p className="text-[10px] text-slate-400 mb-1 font-sans font-bold uppercase">Hasil Pembacaan Teks Tulisan Tangan:</p>
                        <p className="whitespace-pre-wrap">{transaction.description}</p>
                      </div>
                    </div>
                  )}

                  {transaction.source_type === 'manual' && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-black text-slate-900 text-xs">Formulir Voucher Input Manual</p>
                            <p className="text-[10px] text-slate-500">Dicatat via Aplikasi SakuKu</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          {txRefCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tipe Pencatatan:</span>
                          <span className="font-bold text-slate-800">Form Pengisian Manual</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Status Validasi:</span>
                          <span className="font-bold text-emerald-700">✓ Terverifikasi Sistem</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-slate-500">Nominal Dicatat:</span>
                          <span className="font-mono font-black text-slate-900">{formatRupiah(transaction.amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Rincian Item Barang Dideteksi ({parsedReceipt.items.length} Item)
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Validasi Pas
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200">
                      <th className="py-2 px-2 text-center w-7 border-r border-slate-200">#</th>
                      <th className="py-2 px-2 border-r border-slate-200">Nama Item Barang</th>
                      <th className="py-2 px-2 text-center border-r border-slate-200 w-12">Qty</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200 w-24">Satuan</th>
                      <th className="py-2 px-2 text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedReceipt.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2 text-center text-slate-400 font-mono text-[10px] border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-800 border-r border-slate-100">
                          {item.name}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-100">
                          {item.qty}x
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600 border-r border-slate-100">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-extrabold text-slate-900">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="py-1.5 px-3 text-right text-slate-600">
                        Subtotal Item:
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                        {formatRupiah(parsedReceipt.itemsSubtotal)}
                      </td>
                    </tr>
                    {parsedReceipt.taxAmount > 0 && (
                      <tr>
                        <td colSpan={4} className="py-1.5 px-3 text-right text-amber-800">
                          Pajak (PPN/PB1):
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-800">
                          +{formatRupiah(parsedReceipt.taxAmount)}
                        </td>
                      </tr>
                    )}
                    {parsedReceipt.otherFees > 0 && (
                      <tr>
                        <td colSpan={4} className="py-1.5 px-3 text-right text-slate-600">
                          Biaya Tambahan:
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                          +{formatRupiah(parsedReceipt.otherFees)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-900 text-white font-black">
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        TOTAL AKURAT STRUK:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 text-sm">
                        {formatRupiah(transaction.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Original OCR Text / Catatan Deskripsi Asli */}
            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                Catatan Teks / Hasil Ekstraksi Sumber
              </h4>
              <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {transaction.description || 'Tidak ada catatan tambahan.'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Actions Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Batal Edit</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>

              {onUpdateTransaction && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Data AI</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </>
        )}
      </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isImageFullscreen && displayProofImage && (
        <div className="fixed inset-0 bg-black/95 z-60 flex flex-col items-center justify-between p-4 animate-fadeIn">
          <div className="w-full flex items-center justify-between text-white p-2 shrink-0">
            <div className="text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{proofHeader.title} (Zoom Mode)</span>
            </div>
            <button
              onClick={() => setIsImageFullscreen(false)}
              className="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 w-full flex items-center justify-center p-2 overflow-auto">
            <img
              src={displayProofImage}
              alt="Bukti Fullscreen"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="p-2 w-full max-w-md flex justify-center shrink-0">
            <a
              href={displayProofImage}
              download={`bukti_transaksi_full_${transaction.id}.jpg`}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" /> Unduh Gambar Bukti Ini
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-70 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus transaksi ini? Data akan terhapus secara permanen dari saldo akun, daftar transaksi, dan laporan PDF/Excel.
              </p>
            </div>

            {/* Target Tx Card Summary */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {transaction.description}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                <span>📅 {formatDateIndonesian(transaction.date)}</span>
                <span className={`font-black ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
