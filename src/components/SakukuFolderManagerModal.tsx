import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Database,
  Download,
  HardDrive,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { sakukuStorage, SakukuFileRecord } from '../lib/sakukuStorage';
import { Transaction, Category, Account, Budget, BudgetItem } from '../types';
import { formatRupiah } from '../lib/formatters';

interface SakukuFolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  budgetItems?: BudgetItem[];
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SakukuFolderManagerModal: React.FC<SakukuFolderManagerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts = [],
  budgets = [],
  budgetItems = [],
  showToast,
}) => {
  const [files, setFiles] = useState<SakukuFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({
    'SakuKu/Foto_Struk_Bon': true,
    'SakuKu/Laporan_PDF_A4': true,
    'SakuKu/Laporan_Excel_CSV': true,
    'SakuKu/Cadangan_Backup': true,
  });
  const [previewFile, setPreviewFile] = useState<SakukuFileRecord | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isCreatingStarter, setIsCreatingStarter] = useState<boolean>(false);
  const [connectedDirName, setConnectedDirName] = useState<string | null>(null);
  const [autoDownloadToDevice, setAutoDownloadToDevice] = useState<boolean>(() =>
    sakukuStorage.isAutoDownloadEnabled()
  );

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      await sakukuStorage.syncExistingTransactions(transactions, categories);
      const loaded = await sakukuStorage.getAllFiles();
      setFiles(loaded);
    } catch (e) {
      console.warn('Error loading files:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, transactions]);

  const handleToggleAutoDownload = (enabled: boolean) => {
    setAutoDownloadToDevice(enabled);
    sakukuStorage.setAutoDownloadEnabled(enabled);
    if (showToast) {
      showToast(
        enabled
          ? '✅ Foto bon & laporan akan otomatis terunduh ke penyimpanan HP saat input data'
          : '⚠️ Simpan otomatis ke penyimpanan HP dinonaktifkan',
        enabled ? 'success' : 'info'
      );
    }
  };

  const handleCreateStarterFolder = async () => {
    setIsCreatingStarter(true);
    try {
      const zipBlob = await sakukuStorage.createStarterFolderZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SakuKu_Folder_Struktur_HP.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) {
        showToast('📁 Folder SakuKu (.zip) berhasil dibuat & diunduh ke HP!', 'success');
      }
    } catch (err) {
      console.error('Failed to create starter folder:', err);
      if (showToast) {
        showToast('Gagal membuat folder starter', 'error');
      }
    } finally {
      setIsCreatingStarter(false);
    }
  };

  if (!isOpen) return null;

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  // Group files by top-level category and year/month
  const receiptFiles = files.filter((f) => f.category === 'receipt');
  const pdfFiles = files.filter((f) => f.category === 'report_pdf');
  const excelFiles = files.filter((f) => f.category === 'report_excel');
  const backupFiles = files.filter((f) => f.category === 'backup');

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const formattedTotalSize =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;

  // Filtered files according to selection
  const displayedFiles =
    selectedFolder === 'all'
      ? files
      : files.filter((f) => f.folder.startsWith(selectedFolder));

  // Handle Create Native Folder Structure
  const handleCreateNativeFolders = async () => {
    setIsCreatingStarter(true);
    try {
      const res = await sakukuStorage.createAndSyncNativeFolders(
        transactions,
        categories,
        accounts,
        budgets,
        budgetItems
      );
      if (res.success && res.folderName) {
        setConnectedDirName(res.folderName);
        if (showToast) {
          showToast(`📁 Folder "${res.folderName}" dan seluruh subfoldernya berhasil dibuat di HP!`, 'success');
        }
      } else if (res.error && res.error !== 'Pemilihan folder dibatalkan.') {
        if (showToast) {
          showToast(res.error, 'error');
        }
      }
    } catch (err) {
      console.error('Failed to create native folders:', err);
      if (showToast) {
        showToast('Gagal membuat folder di penyimpanan HP', 'error');
      }
    } finally {
      setIsCreatingStarter(false);
    }
  };

  // Handle Download Single File
  const handleDownloadFile = (file: SakukuFileRecord) => {
    if (file.dataBase64) {
      const link = document.createElement('a');
      link.href = file.dataBase64;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.textContent) {
      const blob = new Blob([file.textContent], { type: file.type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    if (showToast) {
      showToast(`📄 Berkas tersimpan ke ${file.folder}/${file.name}`, 'info');
    }
  };

  // Handle Connect to Native Directory
  const handleConnectNative = async () => {
    const res = await sakukuStorage.connectNativeDirectory();
    if (res.success && res.name) {
      setConnectedDirName(res.name);
      if (showToast) {
        showToast(`✅ Folder "${res.name}" terhubung ke memori internal HP!`, 'success');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <HardDrive className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Folder Internal SakuKu</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Otomatis
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Penyimpanan foto bon, laporan PDF A4, Excel, & backup terstruktur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Directory Path Bar & Quick Stats */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 truncate">
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Storage / Internal / SakuKu /</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500">
              Total Berkas: <strong className="text-slate-900">{files.length}</strong>
            </span>
            <span className="text-slate-500">
              Ukuran: <strong className="text-slate-900">{formattedTotalSize}</strong>
            </span>
          </div>
        </div>

        {/* Android Storage Auto-Creator Notice Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-slate-900">
                Penyimpanan Internal HP (Storage &gt; SakuKu)
              </p>
              <p className="text-[11px] text-slate-600 leading-tight">
                Folder <strong className="text-amber-900 font-mono">SakuKu</strong> dan seluruh subfolder resmi (<code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">Foto_Struk_Bon</code>, <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">Laporan_PDF_A4</code>, <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">Laporan_Excel_CSV</code>) dapat dibuat langsung di penyimpanan HP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={handleCreateNativeFolders}
              disabled={isCreatingStarter}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isCreatingStarter ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
              <span>Buat Folder SakuKu di HP</span>
            </button>
          </div>
        </div>

        {/* Auto-Download Toggle Bar */}
        <div className="bg-white px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-slate-800 text-[11px]">
              Otomatis unduh foto bon & laporan ke Penyimpanan HP saat input data
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggleAutoDownload(!autoDownloadToDevice)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoDownloadToDevice ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                autoDownloadToDevice ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Main Content: Split Sidebar Folder Tree & File Grid */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col sm:flex-row gap-4 min-h-[320px]">
          {/* Left / Top: Folder Navigation */}
          <div className="w-full sm:w-56 shrink-0 flex flex-col gap-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-3">
            <p className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
              Subfolder SakuKu
            </p>

            {/* All Files Tab */}
            <button
              type="button"
              onClick={() => setSelectedFolder('all')}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                selectedFolder === 'all'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">Semua Berkas</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                {files.length}
              </span>
            </button>

            {/* Folder 1: Foto Struk Bon */}
            <button
              type="button"
              onClick={() => setSelectedFolder('SakuKu/Foto_Struk_Bon')}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                selectedFolder.startsWith('SakuKu/Foto_Struk_Bon')
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                <span className="truncate">Foto_Struk_Bon</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                {receiptFiles.length}
              </span>
            </button>

            {/* Folder 2: Laporan PDF A4 */}
            <button
              type="button"
              onClick={() => setSelectedFolder('SakuKu/Laporan_PDF_A4')}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                selectedFolder.startsWith('SakuKu/Laporan_PDF_A4')
                  ? 'bg-rose-100 text-rose-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">Laporan_PDF_A4</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono">
                {pdfFiles.length}
              </span>
            </button>

            {/* Folder 3: Laporan Excel CSV */}
            <button
              type="button"
              onClick={() => setSelectedFolder('SakuKu/Laporan_Excel_CSV')}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                selectedFolder.startsWith('SakuKu/Laporan_Excel_CSV')
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Laporan_Excel_CSV</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono">
                {excelFiles.length}
              </span>
            </button>

            {/* Folder 4: Cadangan Data */}
            <button
              type="button"
              onClick={() => setSelectedFolder('SakuKu/Cadangan_Backup')}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                selectedFolder.startsWith('SakuKu/Cadangan_Backup')
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Database className="w-3.5 h-3.5 text-purple-600" />
                <span className="truncate">Cadangan_Backup</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-mono">
                {backupFiles.length}
              </span>
            </button>

            {/* Info helper box */}
            <div className="mt-auto p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-[10px] text-blue-900 font-medium">
              <div className="flex items-center gap-1 font-bold text-blue-950 mb-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Otomatis Tertata</span>
              </div>
              Setiap foto struk yang difoto langsung masuk ke subfolder tahun & bulan transaksi.
            </div>
          </div>

          {/* Right: File List in Current Selected Folder */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[380px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-bold">Menyiapkan berkas folder...</span>
              </div>
            ) : displayedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <Folder className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Folder Masih Kosong</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Foto struk belanja yang diambil atau laporan yang diunduh akan otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {displayedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {file.category === 'receipt' ? (
                        file.dataBase64 ? (
                          <img
                            src={file.dataBase64}
                            alt={file.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )
                      ) : file.category === 'report_pdf' ? (
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : file.category === 'report_excel' ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          📂 {file.folder}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {Math.round(file.size / 1024)} KB •{' '}
                          {new Date(file.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {file.dataBase64 && (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 hover:text-blue-700 transition-colors cursor-pointer"
                          title="Lihat Foto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
                        title="Unduh Berkas ke HP"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Hapus berkas "${file.name}" dari folder SakuKu?`)) {
                            await sakukuStorage.deleteFile(file.id);
                            loadFiles();
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Full ZIP Download & Storage Link */}
        <div className="bg-slate-900 p-3 sm:p-4 text-white flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">
              {connectedDirName ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung: {connectedDirName}
                </span>
              ) : (
                'Folder SakuKu aktif & otomatis tersinkron.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCreateNativeFolders}
              disabled={isCreatingStarter}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isCreatingStarter ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
              <span>Buat / Sinkron Folder SakuKu di HP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Image Modal */}
      {previewFile && previewFile.dataBase64 && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden p-4 border border-slate-700 flex flex-col gap-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="truncate">
                <p className="text-xs font-black truncate">{previewFile.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{previewFile.folder}</p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-full bg-slate-800 text-white cursor-pointer hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img
                src={previewFile.dataBase64}
                alt={previewFile.name}
                className="max-h-[55vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400">
                Ukuran: {Math.round(previewFile.size / 1024)} KB
              </span>
              <button
                type="button"
                onClick={() => handleDownloadFile(previewFile)}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan ke HP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
