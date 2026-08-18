import JSZip from 'jszip';
import { Transaction, Category, Budget, BudgetItem, Account } from '../types';
import { formatRupiah, parseTxDate } from './formatters';

export interface SakukuFileRecord {
  id: string;
  name: string;
  folder: string; // e.g. "SakuKu/Foto_Struk_Bon/Tahun_2026/08_Agustus"
  category: 'receipt' | 'report_pdf' | 'report_excel' | 'backup';
  type: string; // mime type
  size: number;
  createdAt: string;
  dataBase64?: string;
  textContent?: string;
  transactionId?: string;
  year: number;
  month: number; // 0-11
}

const INDO_MONTHS = [
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

const DB_NAME = 'sakuku_storage_db_v1';
const STORE_FILES = 'sakuku_files';
const STORE_META = 'sakuku_meta';

// Helper to open IndexedDB
function openSakukuDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        fileStore.createIndex('folder', 'folder', { unique: false });
        fileStore.createIndex('category', 'category', { unique: false });
        fileStore.createIndex('year_month', ['year', 'month'], { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class SakukuStorageService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const db = await openSakukuDB();
      // Try restoring saved native directory handle from metadata store
      try {
        const handle = await this.getStoredMeta<FileSystemDirectoryHandle>('native_sakuku_dir_handle');
        if (handle) {
          // Verify permission
          const status = await (handle as any).queryPermission({ mode: 'readwrite' });
          if (status === 'granted') {
            this.directoryHandle = handle;
            console.log('📂 SakuKu Native Directory Handle restored from IndexedDB');
          }
        }
      } catch (e) {
        console.warn('Could not restore directory handle:', e);
      }

      this.isInitialized = true;
      console.log('📁 SakuKu Storage Engine initialized successfully');
    } catch (err) {
      console.warn('Could not initialize IndexedDB for SakuKu storage:', err);
    }
  }

  // Store metadata helper
  private async setStoredMeta(key: string, value: any): Promise<void> {
    try {
      const db = await openSakukuDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readwrite');
        const store = tx.objectStore(STORE_META);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to store meta in IndexedDB:', err);
    }
  }

  private async getStoredMeta<T>(key: string): Promise<T | null> {
    try {
      const db = await openSakukuDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readonly');
        const store = tx.objectStore(STORE_META);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  // Get standardized subfolder path
  public getFolderPath(
    type: 'receipt' | 'report_pdf' | 'report_excel' | 'backup',
    year: number,
    month: number
  ): string {
    const monthNum = String(month + 1).padStart(2, '0');
    const monthName = INDO_MONTHS[month] || 'Bulan';

    switch (type) {
      case 'receipt':
        return `SakuKu/Foto_Struk_Bon/Tahun_${year}/${monthNum}_${monthName}`;
      case 'report_pdf':
        return `SakuKu/Laporan_PDF_A4/Tahun_${year}/${monthNum}_${monthName}`;
      case 'report_excel':
        return `SakuKu/Laporan_Excel_CSV/Tahun_${year}/${monthNum}_${monthName}`;
      case 'backup':
        return `SakuKu/Cadangan_Backup/Tahun_${year}`;
      default:
        return `SakuKu/Lainnya/Tahun_${year}`;
    }
  }

  // Check if browser supports native File System Access API
  public isNativeSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  // Check if native folder handle is already connected and has permission
  public async isNativeFolderConnected(): Promise<boolean> {
    await this.init();
    if (!this.directoryHandle) return false;
    try {
      const perm = await (this.directoryHandle as any).queryPermission({ mode: 'readwrite' });
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  public getConnectedFolderName(): string | null {
    return this.directoryHandle ? this.directoryHandle.name : null;
  }

  // Directly trigger Android / Desktop folder authorization dialog (must be called directly on user tap)
  public async requestNativeFolderPermission(): Promise<{ success: boolean; folderName?: string; error?: string }> {
    await this.init();
    if (!this.isNativeSupported()) {
      return {
        success: false,
        error: 'Browser ini menggunakan sistem unduhan standar. File otomatis diunduh ke folder Download HP.',
      };
    }

    try {
      // Default to 'downloads' folder on phone
      const rootPickerHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads',
      });

      let sakukuFolderHandle: FileSystemDirectoryHandle;
      if (rootPickerHandle.name.toLowerCase() === 'sakuku') {
        sakukuFolderHandle = rootPickerHandle;
      } else {
        sakukuFolderHandle = await rootPickerHandle.getDirectoryHandle('SakuKu', {
          create: true,
        });
      }

      this.directoryHandle = sakukuFolderHandle;
      await this.setStoredMeta('native_sakuku_dir_handle', sakukuFolderHandle);

      // Auto-create all standard subfolders immediately
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const monthNum = String(currentMonth + 1).padStart(2, '0');
      const monthName = INDO_MONTHS[currentMonth] || 'Bulan';

      // Subfolders
      const receiptDir = await sakukuFolderHandle.getDirectoryHandle('Foto_Struk_Bon', { create: true });
      const receiptYear = await receiptDir.getDirectoryHandle(`Tahun_${currentYear}`, { create: true });
      await receiptYear.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      const pdfDir = await sakukuFolderHandle.getDirectoryHandle('Laporan_PDF_A4', { create: true });
      const pdfYear = await pdfDir.getDirectoryHandle(`Tahun_${currentYear}`, { create: true });
      await pdfYear.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      const excelDir = await sakukuFolderHandle.getDirectoryHandle('Laporan_Excel_CSV', { create: true });
      const excelYear = await excelDir.getDirectoryHandle(`Tahun_${currentYear}`, { create: true });
      await excelYear.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      const backupDir = await sakukuFolderHandle.getDirectoryHandle('Cadangan_Backup', { create: true });
      await backupDir.getDirectoryHandle(`Tahun_${currentYear}`, { create: true });

      // Readme
      try {
        const readmeHandle = await sakukuFolderHandle.getFileHandle('PETUNJUK_FOLDER_SAKUKU.txt', { create: true });
        const writable = await readmeHandle.createWritable();
        await writable.write(
          `=====================================================\n` +
          `FOLDER RESMI SAKUKU - PENYIMPANAN INTERNAL HP (DOWNLOAD/SAKUKU)\n` +
          `=====================================================\n` +
          `Folder ini dibuat otomatis untuk mengorganisir seluruh data keuangan Anda di HP.\n\n` +
          `Daftar Subfolder:\n` +
          `📁 Foto_Struk_Bon/     -> Foto fisik bon dan struk belanja per bulan\n` +
          `📁 Laporan_PDF_A4/     -> Laporan buku kas resmi format dokumen A4\n` +
          `📁 Laporan_Excel_CSV/  -> Data pembukuan spreadsheet Excel / CSV\n` +
          `📁 Cadangan_Backup/    -> File cadangan database sistem SakuKu\n\n` +
          `Dibuat pada: ${new Date().toLocaleString('id-ID')}\n`
        );
        await writable.close();
      } catch {
        // ignore
      }

      return {
        success: true,
        folderName: sakukuFolderHandle.name || 'SakuKu',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Pemilihan folder dibatalkan.' };
      }
      if (err.message && err.message.includes('sub frames')) {
        return {
          success: false,
          error:
            'Aplikasi saat ini dibuka dalam jendela Preview. Berkas PDF, Excel, dan Foto otomatis diunduh ke folder Download HP dengan struktur nama folder lengkap (SakuKu/Laporan_.../Tahun_.../)!',
        };
      }
      return { success: false, error: err.message || 'Gagal mengakses folder di HP' };
    }
  }

  // Check if currently inside iframe preview
  public isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  // Disconnect native folder
  public async disconnectNativeFolder(): Promise<void> {
    this.directoryHandle = null;
    await this.setStoredMeta('native_sakuku_dir_handle', null);
  }

  // Automatically check if folder is available; if not, request permission & create SakuKu and all subfolders
  public async ensureNativeDirectoryReady(promptUser = true): Promise<FileSystemDirectoryHandle | null> {
    await this.init();

    // 1. If already in memory and granted
    if (this.directoryHandle) {
      try {
        const perm = await (this.directoryHandle as any).queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          return this.directoryHandle;
        }
        if (perm === 'prompt' && promptUser) {
          const req = await (this.directoryHandle as any).requestPermission({ mode: 'readwrite' });
          if (req === 'granted') return this.directoryHandle;
        }
      } catch {
        // Continue to re-select
      }
    }

    // 2. If showDirectoryPicker is supported in this browser
    if (this.isNativeSupported() && promptUser) {
      const res = await this.requestNativeFolderPermission();
      if (res.success) {
        return this.directoryHandle;
      }
    }

    return this.directoryHandle;
  }

  // Check & update auto-download preference
  public isAutoDownloadEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('sakuku_auto_download_to_device');
    return stored === null ? true : stored === 'true';
  }

  public setAutoDownloadEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sakuku_auto_download_to_device', enabled ? 'true' : 'false');
    }
  }

  // Trigger real file download directly to device storage / downloads
  public downloadFileDirectly(fileName: string, dataOrBase64OrBlob: string | Blob, mimeType = 'image/jpeg'): void {
    if (typeof window === 'undefined') return;
    try {
      let url = '';
      let isBlobUrl = false;

      if (dataOrBase64OrBlob instanceof Blob) {
        url = URL.createObjectURL(dataOrBase64OrBlob);
        isBlobUrl = true;
      } else if (typeof dataOrBase64OrBlob === 'string' && dataOrBase64OrBlob.startsWith('data:')) {
        url = dataOrBase64OrBlob;
      } else {
        const blob = new Blob([dataOrBase64OrBlob as any], { type: mimeType });
        url = URL.createObjectURL(blob);
        isBlobUrl = true;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          if (isBlobUrl) URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 60000);
    } catch (err) {
      console.warn('Failed to direct download file to device:', err);
    }
  }

  // Auto-save captured receipt photo to SakuKu folder structure & trigger phone download
  public async saveReceiptPhoto(
    photoBase64: string,
    txData: {
      date: string;
      amount?: number;
      categoryName?: string;
      description?: string;
      transactionId?: string;
    },
    options: { autoDownload?: boolean; promptDirectory?: boolean } = {}
  ): Promise<{ record: SakukuFileRecord; savedToNative: boolean; nativePath?: string }> {
    await this.init();
    const dateObj = parseTxDate(txData.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const folder = this.getFolderPath('receipt', year, month);

    const safeCat = (txData.categoryName || 'Struk')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 20);
    const cleanDate = txData.date ? txData.date.slice(0, 10) : '2026-01-01';
    const amountStr = txData.amount ? `_Rp${Math.round(txData.amount)}` : '';
    const fileId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fileName = `Bon_${cleanDate}_${safeCat}${amountStr}.jpg`;

    // Rough size estimate from base64 string
    const size = Math.round((photoBase64.length * 3) / 4);

    const record: SakukuFileRecord = {
      id: fileId,
      name: fileName,
      folder,
      category: 'receipt',
      type: 'image/jpeg',
      size,
      createdAt: new Date().toISOString(),
      dataBase64: photoBase64,
      transactionId: txData.transactionId,
      year,
      month,
    };

    await this.saveFileRecord(record);

    // Auto-check and write to native disk
    let savedToNative = false;
    const handle = await this.ensureNativeDirectoryReady(options.promptDirectory ?? false);
    if (handle) {
      savedToNative = await this.writeToNativeDisk(record);
    }

    // Fallback: If not saved to native directory and download is requested
    const shouldDownload = options.autoDownload !== undefined ? options.autoDownload : this.isAutoDownloadEnabled();
    if (shouldDownload && !savedToNative) {
      this.downloadFileDirectly(fileName, photoBase64, 'image/jpeg');
    }

    return { record, savedToNative, nativePath: `${folder}/${fileName}` };
  }

  // Auto-save generated reports (Excel CSV, HTML, PDF metadata / Blob)
  public async saveReport(
    name: string,
    contentOrBlob: string | Blob,
    category: 'report_excel' | 'report_pdf' | 'backup',
    year: number,
    month: number,
    mimeType = 'text/csv',
    promptDirectory = true
  ): Promise<{ record: SakukuFileRecord; savedToNative: boolean; nativePath: string }> {
    await this.init();
    const folder = this.getFolderPath(category, year, month);
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const isBlob = contentOrBlob instanceof Blob;
    const size = isBlob ? contentOrBlob.size : new Blob([contentOrBlob]).size;
    const textContent = isBlob ? undefined : contentOrBlob;

    const record: SakukuFileRecord = {
      id: fileId,
      name,
      folder,
      category,
      type: mimeType,
      size,
      createdAt: new Date().toISOString(),
      textContent,
      year,
      month,
    };

    await this.saveFileRecord(record);

    // Auto check if folder exists or prompt creation
    let savedToNative = false;
    const handle = await this.ensureNativeDirectoryReady(promptDirectory);
    if (handle) {
      savedToNative = await this.writeToNativeDisk(record, isBlob ? contentOrBlob : undefined);
    }

    // Direct download trigger as well so file is guaranteed to be on device
    if (!savedToNative) {
      this.downloadFileDirectly(name, contentOrBlob, mimeType);
    }

    return { record, savedToNative, nativePath: `${folder}/${name}` };
  }

  // Save record to IndexedDB
  public async saveFileRecord(record: SakukuFileRecord): Promise<void> {
    try {
      const db = await openSakukuDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to save file record in IndexedDB:', err);
    }
  }

  // Get all files from SakuKu storage
  public async getAllFiles(): Promise<SakukuFileRecord[]> {
    try {
      const db = await openSakukuDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  // Delete a file record
  public async deleteFile(id: string): Promise<void> {
    try {
      const db = await openSakukuDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to delete file from IndexedDB:', err);
    }
  }

  // Sync / Populate with existing transactions' attachments if not yet indexed
  public async syncExistingTransactions(
    transactions: Transaction[],
    categories: Category[]
  ): Promise<number> {
    await this.init();
    const existingFiles = await this.getAllFiles();
    const existingTxIds = new Set(existingFiles.map((f) => f.transactionId).filter(Boolean));

    let importedCount = 0;
    for (const tx of transactions) {
      if (tx.attachment_path && !existingTxIds.has(tx.id)) {
        const cat = categories.find((c) => c.id === tx.category_id);
        await this.saveReceiptPhoto(tx.attachment_path, {
          date: tx.date,
          amount: tx.amount,
          categoryName: cat?.name,
          description: tx.description,
          transactionId: tx.id,
        });
        importedCount++;
      }
    }
    return importedCount;
  }

  // Connect and create real SakuKu folder structure directly in storage (no ZIP)
  public async createAndSyncNativeFolders(
    transactions: Transaction[] = [],
    categories: Category[] = [],
    accounts: Account[] = [],
    budgets: Budget[] = [],
    budgetItems: BudgetItem[] = []
  ): Promise<{ success: boolean; folderName?: string; error?: string }> {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      return {
        success: false,
        error: 'Browser tidak mendukung File System Access API langsung.',
      };
    }

    try {
      // 1. Prompt user to select directory (e.g. Internal Storage or Documents)
      const rootPickerHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      // 2. If selected folder is already named SakuKu, use it. Otherwise, create folder "SakuKu" inside
      let sakukuFolderHandle: FileSystemDirectoryHandle;
      if (rootPickerHandle.name.toLowerCase() === 'sakuku') {
        sakukuFolderHandle = rootPickerHandle;
      } else {
        sakukuFolderHandle = await rootPickerHandle.getDirectoryHandle('SakuKu', {
          create: true,
        });
      }

      this.directoryHandle = sakukuFolderHandle;

      // 3. Create all standard subfolders
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const monthNum = String(currentMonth + 1).padStart(2, '0');
      const monthName = INDO_MONTHS[currentMonth] || 'Bulan';

      // Subfolder 1: Foto_Struk_Bon
      const receiptRootDir = await sakukuFolderHandle.getDirectoryHandle('Foto_Struk_Bon', {
        create: true,
      });
      const receiptYearDir = await receiptRootDir.getDirectoryHandle(`Tahun_${currentYear}`, {
        create: true,
      });
      await receiptYearDir.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      // Subfolder 2: Laporan_PDF_A4
      const pdfRootDir = await sakukuFolderHandle.getDirectoryHandle('Laporan_PDF_A4', {
        create: true,
      });
      const pdfYearDir = await pdfRootDir.getDirectoryHandle(`Tahun_${currentYear}`, {
        create: true,
      });
      await pdfYearDir.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      // Subfolder 3: Laporan_Excel_CSV
      const excelRootDir = await sakukuFolderHandle.getDirectoryHandle('Laporan_Excel_CSV', {
        create: true,
      });
      const excelYearDir = await excelRootDir.getDirectoryHandle(`Tahun_${currentYear}`, {
        create: true,
      });
      await excelYearDir.getDirectoryHandle(`${monthNum}_${monthName}`, { create: true });

      // Subfolder 4: Cadangan_Backup
      const backupRootDir = await sakukuFolderHandle.getDirectoryHandle('Cadangan_Backup', {
        create: true,
      });
      const backupYearDir = await backupRootDir.getDirectoryHandle(`Tahun_${currentYear}`, {
        create: true,
      });

      // 4. Create README in SakuKu root folder
      const readmeHandle = await sakukuFolderHandle.getFileHandle('PETUNJUK_FOLDER_SAKUKU.txt', {
        create: true,
      });
      const readmeWritable = await readmeHandle.createWritable();
      const readmeContent = `=====================================================\n` +
        `FOLDER RESMI SAKUKU - PENYIMPANAN INTERNAL HP (DOWNLOAD/SAKUKU)\n` +
        `=====================================================\n` +
        `Folder ini dibuat otomatis untuk mengorganisir seluruh data keuangan Anda di HP.\n\n` +
        `Daftar Subfolder:\n` +
        `📁 Foto_Struk_Bon/     -> Foto fisik bon dan struk belanja per bulan\n` +
        `📁 Laporan_PDF_A4/     -> Laporan buku kas resmi format dokumen A4\n` +
        `📁 Laporan_Excel_CSV/  -> Data pembukuan spreadsheet Excel / CSV\n` +
        `📁 Cadangan_Backup/    -> File cadangan database sistem SakuKu\n\n` +
        `Dibuat pada: ${new Date().toLocaleString('id-ID')}\n`;
      await readmeWritable.write(readmeContent);
      await readmeWritable.close();

      // 5. Write complete database backup directly to Cadangan_Backup/
      if (transactions.length > 0) {
        const backupData = {
          app: 'SakuKu',
          version: '2.0.0',
          export_date: new Date().toISOString(),
          accounts,
          categories,
          transactions,
          budgets,
          budgetItems,
        };
        const backupFileHandle = await backupYearDir.getFileHandle(
          `Backup_SakuKu_${new Date().toISOString().slice(0, 10)}.json`,
          { create: true }
        );
        const backupWritable = await backupFileHandle.createWritable();
        await backupWritable.write(JSON.stringify(backupData, null, 2));
        await backupWritable.close();
      }

      // 6. Write all existing stored files to their respective subfolders
      const storedFiles = await this.getAllFiles();
      for (const f of storedFiles) {
        await this.writeToNativeDisk(f);
      }

      return { success: true, folderName: sakukuFolderHandle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Pemilihan folder dibatalkan.' };
      }
      console.warn('Error creating native SakuKu folder:', err);
      return { success: false, error: err.message || 'Gagal membuat folder di memori HP.' };
    }
  }

  // Check if native directory is currently active
  public hasNativeDirectory(): boolean {
    return this.directoryHandle !== null;
  }

  public getNativeDirectoryName(): string | null {
    return this.directoryHandle ? this.directoryHandle.name : null;
  }

  // Connect to native directory on HP via File System Access API (if supported)
  public async connectNativeDirectory(): Promise<{ success: boolean; name?: string }> {
    return this.createAndSyncNativeFolders();
  }

  // Write a file to the connected native directory
  public async writeToNativeDisk(record: SakukuFileRecord, directBlob?: Blob): Promise<boolean> {
    if (!this.directoryHandle) return false;
    try {
      // Remove leading SakuKu/ if directory handle is already the SakuKu folder
      let folderPath = record.folder;
      if (this.directoryHandle.name.toLowerCase() === 'sakuku' && folderPath.startsWith('SakuKu/')) {
        folderPath = folderPath.slice(7);
      }

      const parts = folderPath.split('/').filter(Boolean);
      let currentDir = this.directoryHandle;

      // Navigate / create subfolders
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
      }

      // Create file
      const fileHandle = await currentDir.getFileHandle(record.name, { create: true });
      const writable = await fileHandle.createWritable();

      if (directBlob) {
        await writable.write(directBlob);
      } else if (record.dataBase64) {
        const res = await fetch(record.dataBase64);
        const blob = await res.blob();
        await writable.write(blob);
      } else if (record.textContent) {
        await writable.write(record.textContent);
      }
      await writable.close();
      return true;
    } catch (e) {
      console.warn('Error writing file to native directory:', e);
      return false;
    }
  }

  // Generate a complete organized ZIP of the entire SakuKu folder structure
  public async exportCompleteSakukuZip(
    transactions: Transaction[],
    categories: Category[],
    accounts: Account[],
    budgets: Budget[],
    budgetItems: BudgetItem[]
  ): Promise<Blob> {
    await this.syncExistingTransactions(transactions, categories);
    const files = await this.getAllFiles();

    const zip = new JSZip();
    const rootFolder = zip.folder('SakuKu')!;

    // 1. Add README & Folder Structure Index Guide
    const readmeContent = `=====================================================
SAKUKU - STRUKTUR FOLDER PENYIMPANAN RESMI
=====================================================
Dicetak/Dibuat pada: ${new Date().toLocaleString('id-ID')}

Struktur Folder Internal:
📁 SakuKu/
  ├── 📂 Foto_Struk_Bon/
  │   └── 📂 Tahun_YYYY/
  │       └── 📂 MM_NamaBulan/    (Semua foto struk/bon belanja terorganisir)
  ├── 📂 Laporan_PDF_A4/
  │   └── 📂 Tahun_YYYY/
  │       └── 📂 MM_NamaBulan/    (File laporan buku kas A4 resmi)
  ├── 📂 Laporan_Excel_CSV/
  │   └── 📂 Tahun_YYYY/
  │       └── 📂 MM_NamaBulan/    (File spreadsheet mutasi arus kas)
  └── 📂 Cadangan_Backup/
      └── 📂 Tahun_YYYY/          (File backup database lengkap)

Aplikasi SakuKu - Pencatatan Keuangan Pribadi & Bisnis
=====================================================`;
    rootFolder.file('README_STRUKTUR_SAKUKU.txt', readmeContent);

    // 2. Add all stored files into their exact respective subfolders
    for (const f of files) {
      const relPath = f.folder.startsWith('SakuKu/') ? f.folder.slice(7) : f.folder;
      const targetFolder = rootFolder.folder(relPath) || rootFolder;

      if (f.dataBase64) {
        const base64Data = f.dataBase64.split(',')[1] || f.dataBase64;
        targetFolder.file(f.name, base64Data, { base64: true });
      } else if (f.textContent) {
        targetFolder.file(f.name, f.textContent);
      }
    }

    // 3. Add fresh complete database backup to Cadangan_Backup/
    const currentYear = new Date().getFullYear();
    const backupFolder = rootFolder.folder(`Cadangan_Backup/Tahun_${currentYear}`)!;
    const backupData = {
      app: 'SakuKu',
      version: '2.0.0',
      export_date: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      budgets,
      budgetItems,
    };
    backupFolder.file(
      `Backup_Database_SakuKu_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backupData, null, 2)
    );

    // 4. Generate CSV export for all transactions
    const csvHeader = 'No,Tanggal,Deskripsi,Kategori,Tipe,Jumlah,Akun,Mode\n';
    const csvRows = transactions
      .map((t, idx) => {
        const cat = categories.find((c) => c.id === t.category_id)?.name || 'Lainnya';
        const acc = accounts.find((a) => a.id === t.account_id)?.name || 'Kas';
        const desc = (t.description || '').replace(/"/g, '""');
        return `${idx + 1},"${t.date}","${desc}","${cat}","${t.type}",${t.amount},"${acc}","${t.mode}"`;
      })
      .join('\n');

    const csvFolder = rootFolder.folder(`Laporan_Excel_CSV/Tahun_${currentYear}`)!;
    csvFolder.file(`Laporan_Keseluruhan_Transaksi_${currentYear}.csv`, '\ufeff' + csvHeader + csvRows);

    return await zip.generateAsync({ type: 'blob' });
  }

  // Create organized ZIP containing reports and receipts for a specific month
  public async exportMonthlyPackageZip(params: {
    year: number;
    month: number;
    modeLabel: string;
    pdfBlob?: Blob;
    htmlContent?: string;
    csvContent?: string;
    transactions?: Transaction[];
  }): Promise<Blob> {
    const { year, month, modeLabel, pdfBlob, htmlContent, csvContent, transactions = [] } = params;
    const monthNum = String(month + 1).padStart(2, '0');
    const monthName = INDO_MONTHS[month] || 'Bulan';

    const zip = new JSZip();
    const rootFolder = zip.folder('SakuKu')!;

    // README
    rootFolder.file(
      'PETUNJUK_FOLDER_SAKUKU.txt',
      `=====================================================\n` +
      `LAPORAN & FOLDER ARSIP SAKUKU (${monthName} ${year})\n` +
      `=====================================================\n` +
      `Mode Laporan: ${modeLabel}\n` +
      `Diekstrak ke penyimpanan internal HP Anda.\n\n` +
      `Struktur Folder Otomatis:\n` +
      `• SakuKu/Laporan_PDF_A4/Tahun_${year}/${monthNum}_${monthName}/\n` +
      `• SakuKu/Laporan_Excel_CSV/Tahun_${year}/${monthNum}_${monthName}/\n` +
      `• SakuKu/Foto_Struk_Bon/Tahun_${year}/${monthNum}_${monthName}/\n`
    );

    // 1. Add Real PDF Document if available
    const pdfFolder = rootFolder.folder(`Laporan_PDF_A4/Tahun_${year}/${monthNum}_${monthName}`)!;
    if (pdfBlob) {
      pdfFolder.file(
        `Laporan_Buku_Kas_${year}_${monthNum}_${monthName}_${modeLabel}.pdf`,
        pdfBlob
      );
    }

    // 2. Add HTML Document
    if (htmlContent) {
      pdfFolder.file(
        `Laporan_Buku_Kas_${year}_${monthNum}_${monthName}_${modeLabel}.html`,
        htmlContent
      );
    }

    // 3. Add CSV Spreadsheet
    if (csvContent) {
      const excelFolder = rootFolder.folder(`Laporan_Excel_CSV/Tahun_${year}/${monthNum}_${monthName}`)!;
      excelFolder.file(
        `Laporan_Buku_Kas_${year}_${monthNum}_${monthName}_${modeLabel}.csv`,
        csvContent
      );
    }

    // 4. Add receipt photos for this month
    const receiptFolder = rootFolder.folder(`Foto_Struk_Bon/Tahun_${year}/${monthNum}_${monthName}`)!;
    const allFiles = await this.getAllFiles();
    const monthFiles = allFiles.filter(
      (f) => f.year === year && f.month === month && (f.category === 'receipt' || f.type === 'image/jpeg' || f.type === 'receipt_photo')
    );

    for (const f of monthFiles) {
      if (f.dataBase64) {
        const base64Data = f.dataBase64.split(',')[1] || f.dataBase64;
        receiptFolder.file(f.name, base64Data, { base64: true });
      }
    }

    // Also check transactions with attachment_path
    for (const tx of transactions) {
      if (tx.attachment_path && tx.attachment_path.startsWith('data:image')) {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === year && txDate.getMonth() === month) {
          const txFileName = `Bon_${tx.date}_${tx.id?.slice(0, 8) || 'tx'}.jpg`;
          const base64 = tx.attachment_path.split(',')[1] || tx.attachment_path;
          receiptFolder.file(txFileName, base64, { base64: true });
        }
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  // Create starter structured directory ZIP so the SakuKu folder immediately appears in phone file manager
  public async createStarterFolderZip(): Promise<Blob> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthNum = String(currentMonth + 1).padStart(2, '0');
    const monthName = INDO_MONTHS[currentMonth] || 'Bulan';

    const zip = new JSZip();
    const rootFolder = zip.folder('SakuKu')!;

    rootFolder.file(
      'README_PETUNJUK_FOLDER.txt',
      `=====================================================\n` +
      `FOLDER PENYIMPANAN RESMI SAKUKU DI HP ANDROID\n` +
      `=====================================================\n` +
      `Folder ini otomatis dibuat untuk menampung seluruh foto struk,\n` +
      `laporan PDF A4, dan spreadsheet Excel Anda.\n\n` +
      `Subfolder:\n` +
      `• Foto_Struk_Bon/Tahun_${currentYear}/${monthNum}_${monthName}/\n` +
      `• Laporan_PDF_A4/Tahun_${currentYear}/${monthNum}_${monthName}/\n` +
      `• Laporan_Excel_CSV/Tahun_${currentYear}/${monthNum}_${monthName}/\n` +
      `• Cadangan_Backup/Tahun_${currentYear}/\n`
    );

    // Ensure all subfolders exist in ZIP
    const receiptFolder = rootFolder.folder(`Foto_Struk_Bon/Tahun_${currentYear}/${monthNum}_${monthName}`)!;
    receiptFolder.file('.folder_info.txt', 'Tempat penyimpanan foto struk dan bon fisik.');

    const pdfFolder = rootFolder.folder(`Laporan_PDF_A4/Tahun_${currentYear}/${monthNum}_${monthName}`)!;
    pdfFolder.file('.folder_info.txt', 'Tempat penyimpanan laporan pembukuan PDF format A4.');

    const excelFolder = rootFolder.folder(`Laporan_Excel_CSV/Tahun_${currentYear}/${monthNum}_${monthName}`)!;
    excelFolder.file('.folder_info.txt', 'Tempat penyimpanan laporan spreadsheet Excel CSV.');

    const backupFolder = rootFolder.folder(`Cadangan_Backup/Tahun_${currentYear}`)!;
    backupFolder.file('.folder_info.txt', 'Tempat file backup data SakuKu.');

    return await zip.generateAsync({ type: 'blob' });
  }
}

export const sakukuStorage = new SakukuStorageService();
