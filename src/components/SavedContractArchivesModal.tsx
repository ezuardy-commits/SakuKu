import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Copy,
  Check,
  Search,
  Trash2,
  Layers,
  FileCheck,
  ChevronRight,
  ArrowRight,
  FileText,
  AlertCircle,
  ExternalLink,
  Calculator
} from 'lucide-react';
import { formatRupiah } from '../lib/formatters';
import { SavedContractArchive, ContractAnalyzedItem } from '../types';
import { db } from '../lib/db';

interface SavedContractArchivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContract: (contract: SavedContractArchive) => void;
  language?: 'id' | 'en';
}

export const SavedContractArchivesModal: React.FC<SavedContractArchivesModalProps> = ({
  isOpen,
  onClose,
  onSelectContract,
  language = 'id',
}) => {
  const [contracts, setContracts] = useState<SavedContractArchive[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeContract, setActiveContract] = useState<SavedContractArchive | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen]);

  const loadContracts = () => {
    const list = db.getContractArchives();
    setContracts(list);
    if (list.length > 0 && !activeContract) {
      setActiveContract(list[0]);
    }
  };

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmText =
      language === 'id'
        ? 'Apakah Anda yakin ingin menghapus arsip kontrak ini dari database?'
        : 'Are you sure you want to delete this contract archive from the database?';
    if (window.confirm(confirmText)) {
      const updated = db.deleteContractArchive(id);
      setContracts(updated);
      if (activeContract?.id === id) {
        setActiveContract(updated[0] || null);
      }
    }
  };

  const handleDownloadCopy = (contract: SavedContractArchive, e?: React.MouseEvent) => {
    e?.stopPropagation();

    let content = `================================================================================
SALINAN ARSIP KONTRAK KERJA & RINCIAN HARGA SATUAN (AHSP)
Database: KasHarian Project Contract Archives
Tanggal Unduh: ${new Date().toLocaleString('id-ID')}
================================================================================

INFORMASI KONTRAK PROYEK:
- Judul Proyek    : ${contract.projectName}
- Nomor Kontrak   : ${contract.contractNumber || '-'}
- Pengguna Jasa   : ${contract.clientName || '-'}
- Penyedia Jasa   : ${contract.contractorName || '-'}
- Tipe Kontrak    : ${contract.contractType.toUpperCase()}
- Nilai Kontrak   : ${formatRupiah(contract.totalContractValue)}
- Periode Proyek  : ${contract.startDate} s/d ${contract.endDate}
- Tanggal Dibuat  : ${new Date(contract.createdAt).toLocaleDateString('id-ID')}

RINGKASAN & METODOLOGI PERHITUNGAN:
${contract.summaryNote || '-'}

================================================================================
RINCIAN ITEM ANGGARAN & ANALISA HARGA SATUAN PEKERJAAN (AHSP):
================================================================================
`;

    const sectionLabels: Record<string, string> = {
      revenue: '1. PEMASUKAN & TERMIJN KONTRAK (REVENUE)',
      cogs: '2. BEBAN POKOK PROYEK / BOQ FISIK (COGS)',
      opex: '3. BEBAN OPERASIONAL & PAJAK PROYEK (OPEX)',
      capex_equity: '4. JAMINAN BANK & MARGIN KEUNTUNGAN (CAPEX/EQUITY)',
      debt_receivable: '5. TEMPO SUPPLIER & PIUTANG RETENSI (DEBT/RECEIVABLE)',
    };

    const sections = ['revenue', 'cogs', 'opex', 'capex_equity', 'debt_receivable'] as const;

    sections.forEach((sec) => {
      const secItems = (contract.items || []).filter((it) => it.section === sec);
      if (secItems.length > 0) {
        content += `\n${sectionLabels[sec]}\n`;
        content += `${'-'.repeat(80)}\n`;
        secItems.forEach((it, idx) => {
          content += `[${idx + 1}] ${it.itemName}\n`;
          content += `    Volume: ${it.qty} ${it.unit}  x  Harga Satuan: ${formatRupiah(Number(it.unitPrice))}  =  Total: ${formatRupiah(Number(it.plannedAmount))}\n`;

          if (it.ahspBreakdown) {
            content += `    >> DASAR PERHITUNGAN (AHSP):\n`;
            content += `       - Bahan/Material : ${formatRupiah(it.ahspBreakdown.materialCost)} / ${it.unit}\n`;
            content += `       - Upah Tenaga    : ${formatRupiah(it.ahspBreakdown.laborCost)} / ${it.unit}\n`;
            content += `       - Sewa Alat      : ${formatRupiah(it.ahspBreakdown.equipmentCost)} / ${it.unit}\n`;
            content += `       - Biaya Logistik : ${formatRupiah(it.ahspBreakdown.logisticsCost)} / ${it.unit}\n`;
            content += `       - Overhead Profit: ${it.ahspBreakdown.overheadProfitPct}%\n`;
            content += `       - Pajak (${it.ahspBreakdown.taxLabel || 'Pajak'}): ${it.ahspBreakdown.taxPct}%\n`;
            if (it.ahspBreakdown.breakdownNote) {
              content += `       - Catatan Rumus  : ${it.ahspBreakdown.breakdownNote}\n`;
            }
          }
          if (it.reminderNote) {
            content += `    Catatan Milestone : ${it.reminderNote}\n`;
          }
          content += `\n`;
        });
      }
    });

    content += `================================================================================
Tersimpan di Database KasHarian
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salinan_Arsip_Kontrak_${contract.projectName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = (contract: SavedContractArchive, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let text = `ARSIP KONTRAK: ${contract.projectName}\n`;
    text += `No. Kontrak: ${contract.contractNumber || '-'}\n`;
    text += `Pemberi Tugas: ${contract.clientName || '-'}\n`;
    text += `Penyedia: ${contract.contractorName || '-'}\n`;
    text += `Nilai Kontrak: ${formatRupiah(contract.totalContractValue)}\n\n`;
    text += `DAFTAR ITEM & AHSP:\n`;

    (contract.items || []).forEach((it, i) => {
      text += `${i + 1}. [${it.section.toUpperCase()}] ${it.itemName}: ${it.qty} ${it.unit} @ ${formatRupiah(Number(it.unitPrice))} = ${formatRupiah(Number(it.plannedAmount))}\n`;
      if (it.ahspBreakdown?.breakdownNote) {
        text += `   AHSP: ${it.ahspBreakdown.breakdownNote}\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopiedId(contract.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contractNumber && c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.clientName && c.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.contractorName && c.contractorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || c.contractType === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-blue-400/30">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {language === 'id' ? 'Arsip Database Kontrak Proyek & AHSP' : 'Saved Project Contracts & AHSP Database'}
                </h3>
                <span className="text-[10px] bg-blue-500/30 border border-blue-400/40 text-blue-200 px-2 py-0.5 rounded-full font-bold">
                  {contracts.length} Tersimpan
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {language === 'id'
                  ? 'Panggil kembali data kontrak yang pernah dibuat, unduh salinan, atau sesuaikan ke wizard anggaran'
                  : 'Recall previously saved contracts, download copies, or load into budget wizard'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'id'
                  ? 'Cari nama proyek, no. kontrak, pemberi tugas...'
                  : 'Search project name, contract no, client...'
              }
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Tipe' },
              { id: 'construction', label: 'Konstruksi Fisik' },
              { id: 'consultant', label: 'Konsultan IT' },
              { id: 'custom', label: 'Pengadaan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL MAIN CONTENT (TWO COLUMN: LIST & DETAILS) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* LEFT LIST COLUMN (5 COLS) */}
          <div className="md:col-span-5 overflow-y-auto p-3 space-y-2.5 max-h-[40vh] md:max-h-[60vh]">
            {filteredContracts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Database className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-bold">
                  {language === 'id' ? 'Tidak ada arsip kontrak yang cocok' : 'No matching contract archives'}
                </p>
              </div>
            ) : (
              filteredContracts.map((c) => {
                const isSelected = activeContract?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveContract(c)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 uppercase">
                            {c.contractType}
                          </span>
                          {c.contractNumber && (
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                              {c.contractNumber}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                          {c.projectName}
                        </h5>
                        <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(c.totalContractValue)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(c.id, e)}
                        title="Hapus dari database"
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <span>{c.itemsCount || c.items?.length || 0} item anggaran</span>
                      <span>{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT PREVIEW & DETAILS COLUMN (7 COLS) */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[50vh] md:max-h-[60vh] bg-slate-50/50 dark:bg-slate-900/40">
            {activeContract ? (
              <>
                {/* ACTIVE CONTRACT HEADER CARD */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 uppercase">
                          {activeContract.contractType}
                        </span>
                        {activeContract.contractNumber && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            No: {activeContract.contractNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                        {activeContract.projectName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Total Pagu
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(activeContract.totalContractValue)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pemberi Tugas:</span>
                      <span className="font-bold">{activeContract.clientName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Penyedia / Pelaksana:</span>
                      <span className="font-bold">{activeContract.contractorName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Periode Kontrak:</span>
                      <span className="font-bold">{activeContract.startDate} s/d {activeContract.endDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Item:</span>
                      <span className="font-bold">{activeContract.items?.length || 0} Baris Anggaran</span>
                    </div>
                  </div>

                  {activeContract.summaryNote && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                        Metodologi & Analisa:
                      </span>
                      <p className="text-[11px] leading-relaxed">{activeContract.summaryNote}</p>
                    </div>
                  )}

                  {/* QUICK DOWNLOAD & COPY BAR */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadCopy(activeContract, e)}
                      className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{language === 'id' ? 'Download Salinan Kontrak' : 'Download Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyText(activeContract, e)}
                      className="py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedId === activeContract.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedId === activeContract.id ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* ITEM BREAKDOWN PREVIEW */}
                <div className="space-y-2">
                  <h6 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Daftar Harga Satuan (AHSP)</span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {activeContract.items?.length || 0} Baris
                    </span>
                  </h6>

                  <div className="space-y-2">
                    {(activeContract.items || []).map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 font-bold">
                          <span className="text-slate-800 dark:text-slate-100 truncate">
                            {idx + 1}. {it.itemName}
                          </span>
                          <span className="text-slate-900 dark:text-white shrink-0">
                            {formatRupiah(Number(it.plannedAmount))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {it.qty} {it.unit} @ {formatRupiah(Number(it.unitPrice))}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-600">
                            {it.section}
                          </span>
                        </div>
                        {it.ahspBreakdown?.breakdownNote && (
                          <p className="text-[10px] text-slate-400 italic pt-0.5">
                            {it.ahspBreakdown.breakdownNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs font-bold">
                  {language === 'id' ? 'Pilih kontrak di sebelah kiri untuk melihat rincian' : 'Select a contract on the left to view details'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>

          {activeContract && (
            <button
              type="button"
              onClick={() => {
                onSelectContract(activeContract);
                onClose();
              }}
              className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>
                {language === 'id'
                  ? `Panggil & Terapkan "${activeContract.projectName.slice(0, 24)}..." ke Wizard`
                  : 'Load into Wizard'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
