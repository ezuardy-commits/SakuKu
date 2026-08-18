export type ModeType = 'personal' | 'business';
export type TransactionType = 'income' | 'expense';
export type AccountType = 'cash' | 'bank' | 'ewallet';
export type AccountScope = 'personal' | 'business' | 'combined';
export type DocumentType = 'receipt' | 'statement' | 'handwritten' | 'voice';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  scope: AccountScope; // 'personal' | 'business' | 'combined'
  business_name?: string; // e.g. "Toko Sembako Jaya", "Laundry Express", etc.
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  account_number?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name or emoji
  color: string; // Hex color code
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm
  type: TransactionType;
  amount: number;
  account_id: string;
  category_id: string;
  mode: ModeType;
  description: string;
  attachment_path?: string; // base64 or URL
  source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
  voice_transcript?: string;
  business_type?: string;
  business_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_amount?: number;
  total_income_target?: number;
  total_planned_amount?: number;
  mode: 'personal' | 'business' | 'all';
  status?: 'active' | 'completed' | 'expired';
  business_type?: string;
  business_name?: string;
  template_id?: string;
  description?: string;
  is_active?: boolean;
  carryover_balance?: number; // Sisa anggaran / saldo kas bawaan bulan sebelumnya
  rollover_type?: 'actual_previous' | 'predicted_ongoing' | 'manual' | 'none'; // Metode kalkulasi saldo bawaan
  rollover_note?: string; // Catatan rincian realisasi dan prediksi sisa rencana
  created_at?: string;
  updated_at?: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  planned_amount: number;
  spent_amount: number;
  reminder_enabled?: boolean;
  reminder_date?: string; // YYYY-MM-DD
  reminder_note?: string; // e.g., "Bayar Tagihan Listrik / Pembelian Stok"
  reminder_status?: 'pending' | 'dismissed' | 'completed';
  is_continuous?: boolean; // Penanda khusus pos berkelanjutan (Hutang / Piutang / Kontrak)
  continuous_type?: 'debt' | 'receivable' | 'contract' | 'other';
  progress_current?: number; // Angsuran / Termin ke-X
  progress_total?: number; // Total Tenor / Termin Y
  total_principal?: number; // Total Plafond / Pokok
  remaining_principal?: number; // Sisa Pokok / Piutang
  progress_note?: string; // Catatan Progres & Status
}

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  mode: ModeType;
  selected: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  category_id?: string;
  selected?: boolean;
}

export interface OCRResult {
  success: boolean;
  documentType: DocumentType;
  amount?: number;
  description?: string;
  date?: string;
  suggestedCategoryName?: string;
  suggestedType?: TransactionType;
  statementItems?: StatementItem[];
  receiptItems?: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  service?: number;
  rawText?: string;
  error?: string;
}

export type ContractProjectType = 'construction' | 'consultant' | 'procurement' | 'custom';

export interface ContractAhspBreakdown {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  logisticsCost: number;
  overheadProfitPct: number;
  taxPct: number;
  taxLabel?: string;
  breakdownNote?: string;
}

export interface ContractAnalyzedItem {
  id: string;
  itemName: string;
  section: 'revenue' | 'cogs' | 'opex' | 'capex_equity' | 'debt_receivable';
  itemType: 'income' | 'expense';
  qty: string;
  unit: string;
  unitPrice: string;
  plannedAmount: string;
  ahspBreakdown?: ContractAhspBreakdown;
  scheduleDates?: string[];
  schedulePrices?: string[];
  reminderNote?: string;
}

export interface ContractAnalysisResult {
  success: boolean;
  projectName: string;
  contractNumber?: string;
  clientName?: string;
  contractorName?: string;
  contractType: ContractProjectType;
  totalContractValue: number;
  startDate?: string;
  endDate?: string;
  summaryNote?: string;
  items: ContractAnalyzedItem[];
  rawContractText?: string;
  error?: string;
}

export interface SavedContractArchive {
  id: string;
  projectName: string;
  contractNumber?: string;
  clientName?: string;
  contractorName?: string;
  contractType: ContractProjectType;
  totalContractValue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  summaryNote?: string;
  rawContractText?: string;
  itemsCount: number;
  items: ContractAnalyzedItem[];
}

export type InventoryItemType = 'product_stock' | 'raw_material' | 'equipment_asset';

export interface InventoryItem {
  id: string;
  name: string;
  sku_barcode?: string;
  category_id?: string;
  category_name?: string;
  item_type: InventoryItemType; // 'product_stock' (barang dagang), 'raw_material' (bahan baku), 'equipment_asset' (peralatan/alat)
  qty: number;
  unit: string; // pcs, kg, box, botol, liter, roll, set, unit, dll.
  cost_price: number; // Harga beli modal per unit
  selling_price?: number; // Harga jual per unit (khusus barang dagang)
  min_stock_alert?: number; // Batas minimum stok peringatan restock
  photo_url?: string; // Foto barang / nota
  notes?: string;
  mode: ModeType; // 'business' | 'personal'
  business_type?: string; // ID / key jenis usaha spesifik (e.g. 'retail_shop', 'fnb_culinary', 'workshop_service', 'project_contract', 'personal_family', etc.)
  template_id?: string;
  business_name?: string;
  acquisition_date?: string; // Tanggal beli / perolehan (YYYY-MM-DD)
  last_month_qty?: number; // Posisi kuantitas bulan sebelumnya (referensi carryover)
  created_at: string;
  updated_at: string;
}

export interface InventoryOCRItem {
  name: string;
  qty: number;
  unit?: string;
  cost_price: number;
  selling_price?: number;
  item_type?: InventoryItemType;
  category_name?: string;
}

export interface InventoryOCRResult {
  success: boolean;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  items: InventoryOCRItem[];
  rawText?: string;
  error?: string;
}

