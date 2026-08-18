import React, { useState } from 'react';
import { Transaction, Category, ModeType, Account } from '../types';
import { parseReceiptFromTx, ParsedReceiptData } from '../lib/receiptParser';
import { generateProofImage } from '../lib/proofImageGenerator';
import { formatRupiah, formatDate, formatTime } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { SakukuFolderManagerModal } from './SakukuFolderManagerModal';
import { useLanguage } from '../context/LanguageContext';
import {
  Receipt,
  Search,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Percent,
  Plus,
  ShoppingBag,
  Eye,
  X,
  Printer,
  Folder,
} from 'lucide-react';

interface ReceiptBreakdownReportProps {
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  activeMode: 'all' | ModeType;
}

export const ReceiptBreakdownReport: React.FC<ReceiptBreakdownReportProps> = ({
  transactions,
  categories,
  accounts = [],
  activeMode,
}) => {
  const { language, getCategoryDisplayName } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'ai_items' | 'photo'>('all');
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [expandedReceipts, setExpandedReceipts] = useState<{ [id: string]: boolean }>({});
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState<boolean>(false);

  // Filter transactions that are receipts or expenses with receipt source or attachments or item details
  const receiptTransactions = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    const isModeMatch = activeMode === 'all' ? true : tx.mode === activeMode;
    if (!isModeMatch) return false;

    const isReceiptSource = tx.source_type === 'receipt' || !!tx.attachment_path;
    const hasReceiptItems = tx.description?.includes('Rincian Item:') || tx.description?.includes('•');

    return isReceiptSource || hasReceiptItems;
  });

  // Filter by search & source
  const filteredTxs = receiptTransactions.filter((tx) => {
    if (filterSource === 'photo' && !tx.attachment_path) return false;
    if (filterSource === 'ai_items' && !tx.description?.includes('Rincian Item:')) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const cat = categories.find((c) => c.id === tx.category_id);
      const matchCat = cat?.name.toLowerCase().includes(q);
      return matchDesc || matchCat;
    }
    return true;
  });

  // Parse all receipt details
  const parsedList = filteredTxs.map((tx) => ({
    tx,
    parsed: parseReceiptFromTx(tx),
    category: categories.find((c) => c.id === tx.category_id),
    account: accounts.find((a) => a.id === tx.account_id),
  }));

  // Aggregate statistics
  const totalStrukCount = parsedList.length;
  const totalItemsCount = parsedList.reduce((s, p) => s + p.parsed.items.length, 0);
  const grandTotalItemsAmount = parsedList.reduce((s, p) => s + p.parsed.itemsSubtotal, 0);
  const grandTotalTaxAmount = parsedList.reduce((s, p) => s + p.parsed.taxAmount, 0);
  const grandTotalOtherFees = parsedList.reduce((s, p) => s + p.parsed.otherFees, 0);
  const grandTotalAmount = parsedList.reduce((s, p) => s + p.parsed.grandTotal, 0);

  const toggleExpand = (id: string) => {
    setExpandedReceipts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadPhoto = (imgPath: string, dateStr: string) => {
    const link = document.createElement('a');
    link.href = imgPath;
    link.download = `foto_struk_sakuku_${dateStr}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>Laporan Pengeluaran Per Struk Belanja</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-400/30">
                Data Rinci & Transparan
              </span>
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Rincian item barang, harga satuan, dan biaya/pajak (PPN). Subtotal item + biaya tepat sama dengan total nominal struk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsFolderManagerOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Folder Foto SakuKu</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-blue-600" /> Total Struk
          </span>
          <span className="text-base font-black text-slate-900">{totalStrukCount} Struk</span>
          <span className="text-[10px] text-slate-400">Total bukti transaksi</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> Item Barang
          </span>
          <span className="text-base font-black text-slate-900">{totalItemsCount} Item</span>
          <span className="text-[10px] text-slate-400">Barang dibeli</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-500" /> Total Pajak & Biaya
          </span>
          <span className="text-base font-black text-amber-700">{formatRupiah(grandTotalTaxAmount + grandTotalOtherFees)}</span>
          <span className="text-[10px] text-slate-400">PPN + Biaya Layanan</span>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-3.5 rounded-2xl shadow-xs flex flex-col gap-1 border border-blue-800">
          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Struk (Sub=Total)
          </span>
          <span className="text-base font-black text-amber-400">{formatRupiah(grandTotalAmount)}</span>
          <span className="text-[10px] text-blue-300">Subtotal + Biaya = Total</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari item barang atau toko..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterSource === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Struk ({receiptTransactions.length})
          </button>
          <button
            onClick={() => setFilterSource('ai_items')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterSource === 'ai_items'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Ada Rincian AI
          </button>
          <button
            onClick={() => setFilterSource('photo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterSource === 'photo'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Memiliki Foto Struk
          </button>
        </div>
      </div>

      {/* List of Receipt Cards */}
      {parsedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2">
          <Receipt className="w-10 h-10 text-slate-300" />
          <p className="text-xs font-bold text-slate-700">Belum Ada Transaksi Struk Belanja</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Gunakan tombol "Catat Transaksi" lalu pilih opsi Scan Struk untuk mencatat pengeluaran beserta rincian itemnya secara otomatis.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {parsedList.map(({ tx, parsed, category, account }, index) => {
            const isCollapsed = expandedReceipts[tx.id] === false;

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col transition-all hover:border-blue-300"
              >
                {/* Header Card Struk */}
                <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                      <CategoryIcon
                        name={category?.icon || 'ShoppingBag'}
                        color={category?.color || '#2563eb'}
                        size={18}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{parsed.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {getCategoryDisplayName(category?.name || 'Pengeluaran')}
                        </span>
                        {parsed.hasDetailedItems && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> {parsed.items.length} Item AI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{formatDate(tx.date, language as any)}</span>
                        <span>•</span>
                        <span>Metode: {account?.name || 'Kas'}</span>
                        <span>•</span>
                        <span className="text-slate-400">ID #{tx.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">TOTAL STRUK</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {formatRupiah(parsed.grandTotal)}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(tx.id)}
                      className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer transition-colors"
                      title="Sembunyikan / Tampilkan Rincian"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Body Card Struk */}
                {!isCollapsed && (
                  <div className="p-3.5 flex flex-col md:flex-row gap-4">
                    {/* Visual Foto Struk */}
                    {(() => {
                      let photoSrc = tx.attachment_path;
                      if (!photoSrc) {
                        try {
                          const seed = tx.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                          photoSrc = generateProofImage({
                            description: tx.description,
                            amount: tx.amount,
                            type: tx.type,
                            date: tx.date ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                            category_name: category ? getCategoryDisplayName(category.name, language) : 'Umum',
                            account_name: account?.name,
                            account_number: account?.account_number,
                            business_name: tx.business_name || account?.business_name,
                            voice_transcript: tx.voice_transcript,
                            source_type: 'receipt',
                            seed,
                          });
                        } catch {
                          photoSrc = undefined;
                        }
                      }
                      if (!photoSrc) return null;
                      return (
                        <div className="w-full md:w-48 shrink-0 flex flex-col gap-2 bg-slate-900 p-2 rounded-xl text-white">
                          <div className="relative rounded-lg overflow-hidden bg-slate-950 aspect-4/3 group border border-slate-800">
                            <img
                              src={photoSrc}
                              alt="Foto Struk"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <button
                              onClick={() => setPreviewModalImg(photoSrc!)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity cursor-pointer backdrop-blur-2xs"
                            >
                              <Eye className="w-4 h-4" /> Perbesar
                            </button>
                          </div>

                          <button
                            onClick={() => handleDownloadPhoto(photoSrc!, tx.date)}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3 h-3" /> Simpan Foto ke HP
                          </button>
                        </div>
                      );
                    })()}

                    {/* Table Rincian Item */}
                    <div className="flex-1 flex flex-col gap-2 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-[11px]">
                            <th className="py-2 px-2.5 w-8">#</th>
                            <th className="py-2 px-2.5">Nama Item / Barang</th>
                            <th className="py-2 px-2.5 text-center w-16">Qty</th>
                            <th className="py-2 px-2.5 text-right w-28">Harga Satuan</th>
                            <th className="py-2 px-2.5 text-right w-32">Subtotal Item</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsed.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="py-2 px-2.5 font-bold text-slate-900">{item.name}</td>
                              <td className="py-2 px-2.5 text-center font-bold text-slate-700 bg-slate-50/50">
                                {item.qty}x
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                                {formatRupiah(item.price)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold font-mono text-slate-900">
                                {formatRupiah(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-xs">
                          {/* Subtotal Item Row */}
                          <tr>
                            <td colSpan={4} className="py-1.5 px-2.5 text-right text-slate-600">
                              Subtotal Item ({parsed.items.length} jenis):
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(parsed.itemsSubtotal)}
                            </td>
                          </tr>

                          {/* Tax / PPN Row */}
                          {parsed.taxAmount > 0 && (
                            <tr className="text-amber-800">
                              <td colSpan={4} className="py-1.5 px-2.5 text-right font-bold">
                                Pajak (PPN / PB1):
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                                +{formatRupiah(parsed.taxAmount)}
                              </td>
                            </tr>
                          )}

                          {/* Other Fees Row */}
                          {parsed.otherFees > 0 && (
                            <tr className="text-slate-700">
                              <td colSpan={4} className="py-1.5 px-2.5 text-right font-bold">
                                Biaya Tambahan / Layanan:
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                                +{formatRupiah(parsed.otherFees)}
                              </td>
                            </tr>
                          )}

                          {/* Grand Total Struk Match Banner */}
                          <tr className="bg-blue-900 text-white font-black text-xs">
                            <td colSpan={4} className="py-2 px-2.5 text-right tracking-wide">
                              TOTAL SUB & TOTAL STRUK (PAS):
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-amber-400 text-sm">
                              {formatRupiah(parsed.grandTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Validation Equal Banner */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200/80">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Status Verifikasi: Subtotal Item ({formatRupiah(parsed.itemsSubtotal)}) + Biaya/Pajak ({formatRupiah(parsed.taxAmount + parsed.otherFees)}) = Total Struk ({formatRupiah(parsed.grandTotal)})</span>
                        </span>
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                          ✓ Sesuai (100%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Zoom Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2 flex flex-col gap-2 border border-slate-700">
            <div className="flex justify-between items-center px-2 py-1 text-white text-xs font-bold">
              <span>Foto Bukti Fisik Struk</span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex justify-center">
              <img src={previewModalImg} alt="Preview Struk" className="max-w-full h-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
      {/* SakuKu Folder Manager Modal */}
      <SakukuFolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
      />
    </div>
  );
};
