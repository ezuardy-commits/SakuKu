import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  X,
  Sparkles,
  FileText,
  Upload,
  FileCheck,
  Download,
  Copy,
  Check,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  ChevronRight,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Camera,
  FolderOpen,
  FileType,
  FileUp,
  Image as ImageIcon,
  HelpCircle,
  Paperclip,
  CheckCircle2,
  Info
} from 'lucide-react';
import { formatRupiah } from '../lib/formatters';
import { ContractAnalysisResult, ContractAnalyzedItem, ContractProjectType, SavedContractArchive } from '../types';
import { db } from '../lib/db';

interface ContractAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToWizard: (result: ContractAnalysisResult) => void;
  language?: 'id' | 'en';
}

interface AttachedFileInfo {
  name: string;
  size: number;
  type: 'image' | 'pdf' | 'excel' | 'word' | 'text' | 'other';
  previewUrl?: string;
  extraInfo?: string;
}

export const ContractAnalysisModal: React.FC<ContractAnalysisModalProps> = ({
  isOpen,
  onClose,
  onApplyToWizard,
  language = 'id',
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [contractType, setContractType] = useState<ContractProjectType>('construction');
  const [contractText, setContractText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSavedToDb, setIsSavedToDb] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileDocInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    if (!file) return;

    // Check file size (< 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(
        language === 'id'
          ? 'Ukuran berkas terlalu besar (Maksimum 25MB)'
          : 'File size too large (Max 25MB)'
      );
      return;
    }

    setIsParsingFile(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extension);
    const isPdf = file.type === 'application/pdf' || extension === 'pdf';
    const isExcel =
      file.type.includes('spreadsheet') ||
      file.type.includes('excel') ||
      ['xlsx', 'xls', 'csv'].includes(extension);
    const isWord =
      file.type.includes('word') ||
      file.type.includes('officedocument.wordprocessingml') ||
      ['docx', 'doc'].includes(extension);
    const isText = file.type.startsWith('text/') || extension === 'txt';

    try {
      if (isExcel) {
        // Parse Excel workbook via SheetJS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let extractedContent = `[DATA KONTRAK & BOQ DARI FILE EXCEL: ${fileName}]\n`;
        let totalRows = 0;

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          const rows = csv.split('\n').filter((r) => r.trim().length > 0);
          totalRows += rows.length;

          if (rows.length > 0) {
            extractedContent += `\n--- LEMBAR KERJA (SHEET): ${sheetName} (${rows.length} Baris) ---\n`;
            extractedContent += csv.trim() + '\n';
          }
        });

        if (extractedContent.trim().length > 0) {
          setContractText((prev) =>
            prev.trim() ? `${prev}\n\n${extractedContent}` : extractedContent
          );
          setAttachedFile({
            name: fileName,
            size: file.size,
            type: 'excel',
            extraInfo: `${workbook.SheetNames.length} Sheet (${totalRows} Baris Terbaca)`,
          });
          setSuccessInfo(
            language === 'id'
              ? `Tabel Excel "${fileName}" berhasil dibaca (${totalRows} baris) dan dimasukkan otomatis ke kolom input teks.`
              : `Excel file "${fileName}" extracted (${totalRows} rows) and added to text input.`
          );
        } else {
          throw new Error('File Excel tidak berisi data baris yang valid.');
        }
      } else if (isWord && extension === 'docx') {
        // Parse Word (.docx) via mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value || '';

        if (text.trim().length > 0) {
          const formatted = `[DOKUMEN KONTRAK & SPK DARI FILE WORD: ${fileName}]\n\n${text.trim()}`;
          setContractText((prev) => (prev.trim() ? `${prev}\n\n${formatted}` : formatted));
          setAttachedFile({
            name: fileName,
            size: file.size,
            type: 'word',
            extraInfo: `${text.split(/\s+/).length} Kata Terbaca`,
          });
          setSuccessInfo(
            language === 'id'
              ? `Dokumen Word "${fileName}" berhasil diekstrak dan dimasukkan otomatis ke kolom input teks.`
              : `Word document "${fileName}" extracted and inserted into text input.`
          );
        } else {
          throw new Error('Dokumen Word tidak berisi teks yang dapat diekstrak.');
        }
      } else if (isPdf) {
        // Read PDF as base64 for Gemini Vision & AI document parsing
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setImageBase64(base64);
          setAttachedFile({
            name: fileName,
            size: file.size,
            type: 'pdf',
            previewUrl: base64,
            extraInfo: `Dokumen PDF (${(file.size / 1024).toFixed(1)} KB)`,
          });
          setSuccessInfo(
            language === 'id'
              ? `Berkas PDF "${fileName}" terlampir dan siap dipindai oleh AI.`
              : `PDF file "${fileName}" attached and ready for AI analysis.`
          );
        };
        reader.readAsDataURL(file);
      } else if (isImg) {
        // Read image file as base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setImageBase64(base64);
          setAttachedFile({
            name: fileName,
            size: file.size,
            type: 'image',
            previewUrl: base64,
            extraInfo: `Foto / Scan (${(file.size / 1024).toFixed(1)} KB)`,
          });
          setSuccessInfo(
            language === 'id'
              ? `Foto dokumen "${fileName}" berhasil dimuat.`
              : `Document photo "${fileName}" uploaded successfully.`
          );
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        // Read plain text file
        const text = await file.text();
        setContractText((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
        setAttachedFile({
          name: fileName,
          size: file.size,
          type: 'text',
          extraInfo: `${text.length} Karakter`,
        });
        setSuccessInfo(
          language === 'id'
            ? `Berkas teks "${fileName}" berhasil dimuat.`
            : `Text file "${fileName}" loaded.`
        );
      } else {
        // Generic binary / document fallback: read as base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setImageBase64(base64);
          setAttachedFile({
            name: fileName,
            size: file.size,
            type: 'other',
            previewUrl: base64,
            extraInfo: `Berkas Dokumen (${(file.size / 1024).toFixed(1)} KB)`,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(
        language === 'id'
          ? `Gagal membaca berkas ${fileName}: ${err.message || 'Format tidak didukung'}`
          : `Failed to read file ${fileName}: ${err.message || 'Unsupported format'}`
      );
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setImageBase64(null);
    setAttachedFile(null);
    setSuccessInfo(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleAnalyze = async () => {
    if (!contractText.trim() && !imageBase64) {
      setErrorMessage(
        language === 'id'
          ? 'Silakan foto kontrak, pilih berkas (PDF/Excel/Word), atau ketik/tempel teks rincian kontrak terlebih dahulu.'
          : 'Please take a photo, choose a file (PDF/Excel/Word), or paste contract text first.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: contractText.trim(),
          imageBase64: imageBase64,
          contractType,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menganalisis dokumen kontrak');
      }

      setAnalysisResult(data);
      setActiveTab('preview');
      setIsSavedToDb(false);
    } catch (err: any) {
      console.error('Contract analysis failed:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses kontrak.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sampleType: 'construction' | 'consultant' | 'procurement') => {
    setContractType(sampleType === 'procurement' ? 'custom' : sampleType);
    if (sampleType === 'construction') {
      setContractText(`SURAT PERJANJIAN KERJA (KONTRAK FISIK)
NOMOR: 042/SPK/DPU-CK/VIII/2026

PEKERJAAN: Pembangunan Gedung Rawat Inap Puskesmas 3 Lantai
PEMBERI TUGAS: Dinas Pekerjaan Umum & Penataan Ruang Prov. DKI Jakarta
KONTRAKTOR PELAKSANA: PT Cipta Sarana Bangun Persada
NILAI KONTRAK: Rp 1.500.000.000,- (Satu Miliar Lima Ratus Juta Rupiah) Termasuk PPh Final 2.65% dan PPN
MASA PELAKSANAAN: 120 Hari Kalender (01 Agustus 2026 s/d 30 November 2026)

KETENTUAN PEMBAYARAN:
1. Uang Muka (DP) 20% = Rp 300.000.000,- (Setelah penyerahan Bank Garansi UM 20%)
2. Termijn 1 Progres Fisik Struktur 50% = Rp 450.000.000,-
3. Termijn 2 Progres Finishing & MEP 80% = Rp 450.000.000,-
4. Termijn 3 Serah Terima Pertama (PHO 100%) = Rp 225.000.000,-
5. Retensi Pemeliharaan (FHO 5%) = Rp 75.000.000,- (Dibayarkan setelah 180 hari)

DAFTAR KUANTITAS & ANALISA HARGA SATUAN (BOQ & AHSP):
- Pengecoran Beton Ready Mix K-300 Pelat & Balok: 240 m3 @ Rp 1.250.000 = Rp 300.000.000 (Bahan Rp 980rb, Upah Rp 140rb, Alat Rp 120rb, Logistik Rp 35rb, Overhead 10%, Pajak PPh 2.65%)
- Pasangan Dinding Bata Ringan Hebel t=10cm + Plester Aci: 1.250 m2 @ Rp 160.000 = Rp 200.000.000 (Bahan Rp 95rb, Upah Rp 42rb, Alat Rp 8rb, Logistik Rp 5rb, Profit 12%, PPh 2.65%)
- Upah Regu Kerja Lapangan (Mandor, Tukang & Pekerja): 6 Minggu @ Rp 40.000.000 = Rp 240.000.000
- Sewa Alat Berat & Scaffolding 600 Set: 3 Bulan @ Rp 30.000.000 = Rp 90.000.000
- Pajak PPh Final Jasa Konstruksi (2.65%): Rp 39.750.000
- Uji Kuat Tekan Laboratorium Independen & K3: Rp 15.000.000
- Bank Garansi & Jaminan Pelaksanaan: Rp 18.000.000
- Target Keuntungan Bersih Kontraktor (10%): Rp 150.000.000
- Piutang Retensi 5%: Rp 75.000.000`);
    } else if (sampleType === 'consultant') {
      setContractText(`SURAT PERINTAH KERJA (SPK KONSULTANSI IT & SOFTWARE)
NOMOR: 018/SPK/KONS-IT/VII/2026

PEKERJAAN: Pengembangan Sistem Dashboard Keuangan & Integrasi Cloud Server
PEMBERI TUGAS: PT Nusantara Integra Solusindo
KONSULTAN: PT Digital Solusi Utama
NILAI KONTRAK: Rp 480.000.000,- Termasuk Pajak PPh 23 (2%)
JANGKA WAKTU: 3 Bulan (01 Agustus 2026 s/d 31 Oktober 2026)

PEMBAYARAN MILESTONE:
- Termijn 1: Inception Report & System Architecture 20% = Rp 96.000.000
- Termijn 2: Interim Deliverable & Core API Development 40% = Rp 192.000.000
- Termijn 3: Pelunasan BAST Serah Terima Source Code 40% = Rp 192.000.000

RINCIAN HARGA SATUAN (BILLING RATE INKINDO & NON-PERSONIL):
- Remunerasi Lead Software Architect: 3 OB (Orang-Bulan) @ Rp 25.000.000 = Rp 75.000.000 (Upah Rp 20jt, Workstation & Tool Rp 5jt, Overhead 15%, PPh 23 2%)
- Remunerasi 2 Full-Stack Developers: 6 OB @ Rp 18.000.000 = Rp 108.000.000
- Sewa Dedicated Cloud Server & Staging Environment: 3 Bulan @ Rp 12.000.000 = Rp 36.000.000
- Pajak PPh Pasal 23 (2%): Rp 9.600.000
- Target Keuntungan Bersih Konsultan (25%): Rp 120.000.000`);
    } else {
      setContractText(`SURAT PERJANJIAN PENGADAAN PERALATAN SERVER & INFRASTRUKTUR IT
NOMOR: 091/PENG/KEMEN/VIII/2026

PEKERJAAN: Pengadaan & Instalasi Rack Server Data Center High Availability
PEMBERI TUGAS: Biro Sistem Informasi & Infrastruktur
VENDOR / PENYEDIA: PT Mitra Teknologi Serverindo
TOTAL NILAI PENGADAAN: Rp 650.000.000,- (Termasuk Pajak PPh 22 1.5% dan PPN)
MASA PENGIRIMAN & INSTALASI: 45 Hari Kalender (01 Ags 2026 s/d 15 Sep 2026)

PEMBAYARAN:
- Pembayaran DP Pengadaan 30% = Rp 195.000.000
- Pelunasan 70% Setelah BAST Uji Fungsi & Komisioning = Rp 455.000.000

RINCIAN BARANG & JASA:
- Server Enterprise 2U Dual Xeon 64-Core, 256GB RAM: 2 Unit @ Rp 165.000.000 = Rp 330.000.000
- Rack Server 42U + Smart PDU & Cable Management: 1 Unit @ Rp 45.000.000 = Rp 45.000.000
- UPS Online Double Conversion 10 kVA: 1 Unit @ Rp 75.000.000 = Rp 75.000.000
- Jasa Instalasi, Pengkabelan & Setting Staging: 1 Paket @ Rp 35.000.000 = Rp 35.000.000
- Pajak PPh 22 Pengadaan (1.5%): Rp 9.750.000
- Alokasi Margin Keuntungan Bersih Vendor: Rp 80.000.000`);
    }
  };

  const handleSaveToDatabase = () => {
    if (!analysisResult) return;

    const archiveData: Omit<SavedContractArchive, 'id' | 'createdAt' | 'updatedAt'> = {
      projectName: analysisResult.projectName,
      contractNumber: analysisResult.contractNumber,
      clientName: analysisResult.clientName,
      contractorName: analysisResult.contractorName,
      contractType: analysisResult.contractType,
      totalContractValue: analysisResult.totalContractValue,
      startDate: analysisResult.startDate || new Date().toISOString().split('T')[0],
      endDate: analysisResult.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      summaryNote: analysisResult.summaryNote,
      rawContractText: analysisResult.rawContractText || contractText,
      itemsCount: analysisResult.items.length,
      items: analysisResult.items,
    };

    db.saveContractArchive(archiveData);
    setIsSavedToDb(true);
  };

  const handleDownloadCopy = () => {
    if (!analysisResult) return;

    let content = `================================================================================
SALINAN KONTRAK KERJA & RINCIAN ANALISA HARGA SATUAN (AHSP)
Aplikasi: KasHarian Project & Contract Management System
Waktu Ekspor: ${new Date().toLocaleString('id-ID')}
================================================================================

INFORMASI PROYEK & KONTRAK:
- Judul Proyek    : ${analysisResult.projectName}
- Nomor Kontrak   : ${analysisResult.contractNumber || '-'}
- Pengguna Jasa   : ${analysisResult.clientName || '-'}
- Penyedia/Vendor : ${analysisResult.contractorName || '-'}
- Tipe Kontrak    : ${analysisResult.contractType.toUpperCase()}
- Nilai Kontrak   : ${formatRupiah(analysisResult.totalContractValue)}
- Periode Proyek  : ${analysisResult.startDate || '-'} s/d ${analysisResult.endDate || '-'}

RINGKASAN METODOLOGI & ANALISA:
${analysisResult.summaryNote || '-'}

================================================================================
RINCIAN ITEM ANGGARAN KONTRAK & DASAR PERHITUNGAN HARGA SATUAN (AHSP)
================================================================================
`;

    const sectionLabels: Record<string, string> = {
      revenue: '1. PEMASUKAN & TERMIJN KONTRAK (INCOME / REVENUE)',
      cogs: '2. BEBAN POKOK PROYEK / BOQ PEKERJAAN LANGSUNG (COGS)',
      opex: '3. BEBAN OPERASIONAL, PAJAK PROYEK & RETRIBUSI (OPEX)',
      capex_equity: '4. JAMINAN BANK, CADANGAN RISIKO & MARGIN LABA (CAPEX/EQUITY)',
      debt_receivable: '5. HUTANG TEMPO SUPPLIER & PIUTANG RETENSI (DEBT/RECEIVABLE)',
    };

    const sections = ['revenue', 'cogs', 'opex', 'capex_equity', 'debt_receivable'] as const;

    sections.forEach((sec) => {
      const secItems = analysisResult.items.filter((it) => it.section === sec);
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
Dibuat secara otomatis oleh AI Smart Contract Analyzer - KasHarian
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salinan_Kontrak_${analysisResult.projectName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!analysisResult) return;

    let text = `SALINAN KONTRAK & AHSP: ${analysisResult.projectName}\n`;
    text += `No. Kontrak: ${analysisResult.contractNumber || '-'}\n`;
    text += `Pemberi Tugas: ${analysisResult.clientName || '-'}\n`;
    text += `Penyedia: ${analysisResult.contractorName || '-'}\n`;
    text += `Total Nilai Kontrak: ${formatRupiah(analysisResult.totalContractValue)}\n\n`;
    text += `RINGKASAN ITEM & HARGA SATUAN:\n`;

    analysisResult.items.forEach((it, i) => {
      text += `${i + 1}. [${it.section.toUpperCase()}] ${it.itemName}: ${it.qty} ${it.unit} @ ${formatRupiah(Number(it.unitPrice))} = ${formatRupiah(Number(it.plannedAmount))}\n`;
      if (it.ahspBreakdown?.breakdownNote) {
        text += `   AHSP: ${it.ahspBreakdown.breakdownNote}\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyAndClose = () => {
    if (!analysisResult) return;
    if (!isSavedToDb) {
      handleSaveToDatabase();
    }
    onApplyToWizard(analysisResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/25">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {language === 'id' ? 'AI Analisis Kontrak Proyek & AHSP' : 'AI Project Contract & AHSP Analyzer'}
                </h3>
                <span className="text-[10px] bg-amber-400/30 border border-amber-300/40 text-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Auto-Fill Wizard
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {language === 'id'
                  ? 'Foto kontrak, ambil file PDF/Excel/Word dari HP, atau ketik teks rincian BoQ & AHSP'
                  : 'Take photo, pick PDF/Excel/Word files from phone, or paste BoQ & AHSP text'}
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

        {/* TABS NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'input'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'id' ? '1. Input Foto / Berkas Dokumen Kontrak' : '1. Input Photo / Documents'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (analysisResult) setActiveTab('preview');
              }}
              disabled={!analysisResult}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                  : analysisResult
                  ? 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer'
                  : 'border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'id' ? '2. Hasil Analisis & Salinan AHSP' : '2. Analysis & AHSP Copy'}</span>
              {analysisResult && (
                <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                  {analysisResult.items.length} item
                </span>
              )}
            </button>
          </div>

          {analysisResult && (
            <div className="flex items-center gap-1.5 py-2">
              <button
                type="button"
                onClick={handleDownloadCopy}
                title="Download Salinan Kontrak & AHSP (.txt)"
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{language === 'id' ? 'Salinan Kontrak' : 'Download Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copied ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Teks' : 'Copy')}</span>
              </button>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-bold block">Peringatan Analisis:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <span>{successInfo}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="text-emerald-500 hover:text-emerald-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'input' && (
            <div className="space-y-4">
              {/* SELECT CONTRACT TYPE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'id' ? 'Pilih Kategori Proyek / Kontrak' : 'Select Project / Contract Category'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'construction', label: 'Konstruksi & Fisik', icon: Building2, desc: 'AHSP Bahan, Upah, Alat, Termijn 4-5 Tahap & PPh 2.65%' },
                    { id: 'consultant', label: 'Konsultan & IT', icon: FileCheck, desc: 'Billing Rate Man-Month, Server & PPh 23 (2%)' },
                    { id: 'custom', label: 'Pengadaan & Umum', icon: Layers, desc: 'Pengadaan Barang, PPh 22 (1.5%) & Milestone' },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = contractType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setContractType(type.id as ContractProjectType)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{type.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                          {type.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DUAL INPUT SECTION: CAMERA VS HP STORAGE FILE PICKER */}
              <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/30 p-4 sm:p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-blue-600" />
                    <span>{language === 'id' ? 'Unggah Dokumen / Ambil Foto Kontrak' : 'Upload Document / Take Photo'}</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'id' ? 'Mendukung Kamera HP, PDF, Excel (.xlsx), Word (.docx), Foto Scan' : 'Supports Camera, PDF, Excel (.xlsx), Word (.docx), Photo/Scan'}
                  </span>
                </div>

                {/* HIDDEN INPUTS FOR CAMERA & FILE PICKER */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={fileDocInputRef}
                  onChange={handleDocFileChange}
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.csv,image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  className="hidden"
                />

                {/* ACTION BUTTONS & DRAG DROP BOX */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-100/50 dark:bg-blue-950/60 scale-[1.01]'
                      : 'border-blue-300/80 dark:border-blue-800/80 bg-white/70 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {/* CAMERA BUTTON */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isParsingFile}
                      className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <div className="text-left">
                        <span className="block">{language === 'id' ? 'Foto Kontrak / Buka Kamera' : 'Take Photo with Camera'}</span>
                        <span className="text-[10px] text-blue-200 font-normal">{language === 'id' ? 'Foto langsung lembar SPK/BoQ' : 'Direct SPK/BoQ Photo'}</span>
                      </div>
                    </button>

                    {/* FOLDER FILE PICKER (PDF / EXCEL / WORD) */}
                    <button
                      type="button"
                      onClick={() => fileDocInputRef.current?.click()}
                      disabled={isParsingFile}
                      className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <FolderOpen className="w-4 h-4 text-emerald-200" />
                      <div className="text-left">
                        <span className="block">{language === 'id' ? 'Ambil File dari Folder HP' : 'Pick File from Folder'}</span>
                        <span className="text-[10px] text-emerald-200 font-normal">{language === 'id' ? 'PDF, Excel, Word, Galeri' : 'PDF, Excel, Word, Gallery'}</span>
                      </div>
                    </button>
                  </div>

                  {/* PARSING PROGRESS INDICATOR */}
                  {isParsingFile && (
                    <div className="mt-3 py-2 px-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>{language === 'id' ? 'Membaca dan mengekstrak rincian berkas...' : 'Reading and extracting document data...'}</span>
                    </div>
                  )}

                  {/* ATTACHED FILE CARD */}
                  {attachedFile && !isParsingFile && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                          {attachedFile.type === 'excel' ? (
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                          ) : attachedFile.type === 'word' ? (
                            <FileType className="w-5 h-5 text-blue-600" />
                          ) : attachedFile.type === 'pdf' ? (
                            <FileText className="w-5 h-5 text-rose-600" />
                          ) : attachedFile.type === 'image' ? (
                            <ImageIcon className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Paperclip className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {attachedFile.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {attachedFile.extraInfo || `${(attachedFile.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {attachedFile.type === 'image' && attachedFile.previewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowImageModal(true)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Lihat Foto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{language === 'id' ? 'Lihat Foto' : 'View'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'id' ? 'Hapus' : 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FORMAT HINT BADGES */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold">{language === 'id' ? 'Format didukung:' : 'Supported formats:'}</span>
                    <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded font-bold">📄 PDF</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-bold">📊 Excel (.xlsx/.xls)</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded font-bold">📝 Word (.docx)</span>
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded font-bold">📸 Foto Kamera / Scan</span>
                  </div>
                </div>
              </div>

              {/* QUICK SAMPLE BUTTONS */}
              <div className="flex items-center flex-wrap gap-2 pt-0.5">
                <span className="text-[11px] font-bold text-slate-500">
                  {language === 'id' ? 'Atau Coba Contoh SPK Cepat:' : 'Or Try Sample Contracts:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('construction')}
                  className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-bold hover:bg-amber-100 cursor-pointer flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Proyek Puskesmas 3 Lt (Rp 1.5M)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('consultant')}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold hover:bg-indigo-100 cursor-pointer flex items-center gap-1"
                >
                  <FileCheck className="w-3 h-3" />
                  <span>SPK Konsultan IT (Rp 480Jt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('procurement')}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  <span>Pengadaan Server (Rp 650Jt)</span>
                </button>
              </div>

              {/* TEXTAREA INPUT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{language === 'id' ? 'Teks Kontrak / SPK / Rincian BoQ (Bisa Diketik / Diedit)' : 'Contract Text / SPK / BoQ Items (Editable)'}</span>
                  </label>
                  {contractText && (
                    <button
                      type="button"
                      onClick={() => setContractText('')}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                    >
                      {language === 'id' ? 'Bersihkan Teks' : 'Clear Text'}
                    </button>
                  )}
                </div>
                <textarea
                  rows={7}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder={
                    language === 'id'
                      ? 'Teks hasil ekstraksi berkas (Excel/Word) atau salinan kontrak akan tampil di sini. Anda juga dapat mengetik, menempel, atau menyesuaikan rincian klausul sebelum dianalisis AI...'
                      : 'Extracted text from Excel/Word files or pasted contract copy will appear here. You can also type or edit clauses before AI analysis...'
                  }
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'preview' && analysisResult && (
            <div className="space-y-4">
              {/* CONTRACT HEADER SUMMARY CARD */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg border border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
                        {analysisResult.contractType}
                      </span>
                      {analysisResult.contractNumber && (
                        <span className="text-xs text-slate-300 font-mono">
                          No: {analysisResult.contractNumber}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                      {analysisResult.projectName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                      {analysisResult.clientName && (
                        <span>
                          <strong className="text-slate-400">Pemberi Tugas:</strong> {analysisResult.clientName}
                        </span>
                      )}
                      {analysisResult.contractorName && (
                        <span>
                          <strong className="text-slate-400">Pelaksana:</strong> {analysisResult.contractorName}
                        </span>
                      )}
                      {analysisResult.startDate && analysisResult.endDate && (
                        <span>
                          <strong className="text-slate-400">Periode:</strong> {analysisResult.startDate} s/d {analysisResult.endDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/10 sm:border-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Nilai Kontrak</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-300">
                      {formatRupiah(analysisResult.totalContractValue)}
                    </span>
                  </div>
                </div>

                {analysisResult.summaryNote && (
                  <div className="mt-3.5 pt-3 border-t border-slate-700/80 text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl">
                    <strong className="text-amber-300 block mb-0.5">Analisa AI & Salinan Dasar Perhitungan:</strong>
                    <span>{analysisResult.summaryNote}</span>
                  </div>
                )}
              </div>

              {/* ITEMIZED CARDS LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {language === 'id' ? 'Daftar Item BoQ & Analisa Harga Satuan (AHSP):' : 'Itemized BoQ & Unit Price Analysis:'}
                  </h4>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Total {analysisResult.items.length} Item
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {analysisResult.items.map((item, idx) => {
                    const sectionBadgeClass =
                      item.section === 'revenue'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.section === 'cogs'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : item.section === 'opex'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : item.section === 'capex_equity'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${sectionBadgeClass}`}>
                                {item.section.toUpperCase()}
                              </span>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {item.itemName}
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.qty} {item.unit} x {formatRupiah(Number(item.unitPrice))}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {formatRupiah(Number(item.plannedAmount))}
                            </span>
                          </div>
                        </div>

                        {/* AHSP BREAKDOWN DETAILS */}
                        {item.ahspBreakdown && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[11px] bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Dasar Perhitungan Harga Satuan (AHSP):</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                              {item.ahspBreakdown.materialCost !== undefined && item.ahspBreakdown.materialCost > 0 && (
                                <div>
                                  <span className="text-slate-400 block">Bahan/Material:</span>
                                  <strong className="text-slate-800 dark:text-slate-200">
                                    {formatRupiah(item.ahspBreakdown.materialCost)}
                                  </strong>
                                </div>
                              )}
                              {item.ahspBreakdown.laborCost !== undefined && item.ahspBreakdown.laborCost > 0 && (
                                <div>
                                  <span className="text-slate-400 block">Upah Tenaga:</span>
                                  <strong className="text-slate-800 dark:text-slate-200">
                                    {formatRupiah(item.ahspBreakdown.laborCost)}
                                  </strong>
                                </div>
                              )}
                              {item.ahspBreakdown.equipmentCost !== undefined && item.ahspBreakdown.equipmentCost > 0 && (
                                <div>
                                  <span className="text-slate-400 block">Sewa Alat:</span>
                                  <strong className="text-slate-800 dark:text-slate-200">
                                    {formatRupiah(item.ahspBreakdown.equipmentCost)}
                                  </strong>
                                </div>
                              )}
                              {item.ahspBreakdown.logisticsCost !== undefined && item.ahspBreakdown.logisticsCost > 0 && (
                                <div>
                                  <span className="text-slate-400 block">Logistik/K3:</span>
                                  <strong className="text-slate-800 dark:text-slate-200">
                                    {formatRupiah(item.ahspBreakdown.logisticsCost)}
                                  </strong>
                                </div>
                              )}
                              {item.ahspBreakdown.overheadProfitPct !== undefined && item.ahspBreakdown.overheadProfitPct > 0 && (
                                <div>
                                  <span className="text-slate-400 block">Overhead & Laba:</span>
                                  <strong className="text-emerald-600">
                                    {item.ahspBreakdown.overheadProfitPct}%
                                  </strong>
                                </div>
                              )}
                              {item.ahspBreakdown.taxPct !== undefined && item.ahspBreakdown.taxPct > 0 && (
                                <div>
                                  <span className="text-slate-400 block">{item.ahspBreakdown.taxLabel || 'Pajak'}:</span>
                                  <strong className="text-rose-600">
                                    {item.ahspBreakdown.taxPct}%
                                  </strong>
                                </div>
                              )}
                            </div>
                            {item.ahspBreakdown.breakdownNote && (
                              <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                                💡 {item.ahspBreakdown.breakdownNote}
                              </p>
                            )}
                          </div>
                        )}

                        {item.reminderNote && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-200/50">
                            <strong>Milestone:</strong> {item.reminderNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* IMAGE PREVIEW MODAL */}
        {showImageModal && attachedFile?.previewUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={attachedFile.previewUrl}
                alt="Preview Dokumen Kontrak"
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* FOOTER ACTION BAR */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {activeTab === 'preview' ? (
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ← {language === 'id' ? 'Edit / Ganti Dokumen' : 'Edit / Change File'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'input' ? (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || isParsingFile}
                className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'id' ? 'Menganalisis Dokumen AI...' : 'Analyzing Document...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{language === 'id' ? 'Mulai Analisis AI Kontrak' : 'Start AI Analysis'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyAndClose}
                className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {language === 'id'
                    ? 'Terapkan & Sesuaikan ke Wizard Anggaran'
                    : 'Apply & Fill Budget Wizard'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
