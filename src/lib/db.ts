import { Account, Category, Transaction, Budget, BudgetItem, ModeType, TransactionType, SavedContractArchive, InventoryItem, InventoryItemType } from '../types';
import { parseTxDate } from './formatters';
import { ANNUAL_SAMPLE_ACCOUNTS, generateAnnualSampleDataset } from './annualSampleData';

const STORAGE_KEYS = {
  ACCOUNTS: 'kasharian_accounts_v2',
  CATEGORIES: 'kasharian_categories_v2',
  TRANSACTIONS: 'kasharian_transactions_v2',
  BUDGETS: 'kasharian_budgets_v2',
  BUDGET_ITEMS: 'kasharian_budget_items_v2',
  CONTRACT_ARCHIVES: 'kasharian_contract_archives_v2',
  INVENTORY: 'kasharian_inventory_v2',
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran (Expense)
  { id: 'cat_exp_1', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#EF4444' },
  { id: 'cat_exp_2', name: 'Transport', type: 'expense', icon: 'Car', color: '#F97316' },
  { id: 'cat_exp_3', name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { id: 'cat_exp_4', name: 'Tagihan', type: 'expense', icon: 'Receipt', color: '#6366F1' },
  { id: 'cat_exp_5', name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#10B981' },
  { id: 'cat_exp_6', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#3B82F6' },
  { id: 'cat_exp_7', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6' },
  { id: 'cat_exp_8', name: 'Bahan Baku/Stok', type: 'expense', icon: 'Package', color: '#059669' },
  { id: 'cat_exp_9', name: 'Gaji Karyawan', type: 'expense', icon: 'Users', color: '#D97706' },
  { id: 'cat_exp_10', name: 'Sewa Tempat', type: 'expense', icon: 'Store', color: '#2563EB' },
  { id: 'cat_exp_11', name: 'Operasional', type: 'expense', icon: 'Wrench', color: '#64748B' },
  { id: 'cat_exp_12', name: 'Pemasaran & Promo', type: 'expense', icon: 'Megaphone', color: '#06B6D4' },
  { id: 'cat_exp_hutang', name: 'Pembayaran Hutang & Cicilan', type: 'expense', icon: 'CreditCard', color: '#DC2626' },
  { id: 'cat_exp_piutang', name: 'Pemberian Pinjaman (Piutang Diberikan)', type: 'expense', icon: 'ArrowUpRight', color: '#D97706' },
  { id: 'cat_exp_13', name: 'Lain-lain', type: 'expense', icon: 'MoreHorizontal', color: '#94A3B8' },

  // Pemasukan (Income)
  { id: 'cat_inc_1', name: 'Gaji/Upah', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat_inc_2', name: 'Penjualan', type: 'income', icon: 'Store', color: '#059669' },
  { id: 'cat_inc_3', name: 'Transfer Masuk', type: 'income', icon: 'ArrowDownLeft', color: '#3B82F6' },
  { id: 'cat_inc_4', name: 'Bonus', type: 'income', icon: 'Gift', color: '#8B5CF6' },
  { id: 'cat_inc_5', name: 'Modal Tambahan', type: 'income', icon: 'Landmark', color: '#0284C7' },
  { id: 'cat_inc_hutang', name: 'Penerimaan Pinjaman / Hutang Baru', type: 'income', icon: 'Landmark', color: '#0284C7' },
  { id: 'cat_inc_piutang', name: 'Penerimaan Pelunasan Piutang', type: 'income', icon: 'ArrowDownLeft', color: '#10B981' },
  { id: 'cat_inc_6', name: 'Lain-lain', type: 'income', icon: 'PlusCircle', color: '#14B8A6' },
];

export const STORAGE_ENV_KEY = 'sakuku_data_environment_v1';

export const DEFAULT_REAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_real_cash_1',
    name: 'Dompet Tunai (Kas Utama)',
    type: 'cash',
    scope: 'personal',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
  },
  {
    id: 'acc_real_bank_1',
    name: 'Rekening Bank (BCA / Mandiri / BRI)',
    type: 'bank',
    scope: 'combined',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
  },
  {
    id: 'acc_real_biz_1',
    name: 'Kas Kasir / Operasional Bisnis',
    type: 'cash',
    scope: 'business',
    business_name: 'Bisnis Saya',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
  },
];

export const DEFAULT_ACCOUNTS: Account[] = ANNUAL_SAMPLE_ACCOUNTS;

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_BUDGETS: Budget[] = [];

export const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [];

export const DEFAULT_CONTRACT_ARCHIVES: SavedContractArchive[] = [
  {
    id: 'cnt_arch_sample_1',
    projectName: 'Pembangunan Gedung Rawat Inap Puskesmas 3 Lantai',
    contractNumber: '042/SPK/DPU-CK/VIII/2026',
    clientName: 'Dinas Pekerjaan Umum & Tata Ruang Prov. DKI',
    contractorName: 'PT Cipta Sarana Bangun Persada',
    contractType: 'construction',
    totalContractValue: 1500000000,
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    summaryNote: 'Kontrak fisik konstruksi gedung pelayanan publik dengan pembayaran bertahap 4 termijn + retensi FHO 5%, dilengkapi analisa harga satuan pekerjaan (AHSP) beton, pasangan bata, upah mandor/tukang, PPh Final 2.65%, dan jaminan bank garansi.',
    rawContractText: 'SURAT PERJANJIAN KERJA (KONTRAK) NOMOR: 042/SPK/DPU-CK/VIII/2026. Pekerjaan: Pembangunan Gedung Rawat Inap Puskesmas 3 Lantai. Nilai Kontrak: Rp 1.500.000.000,- Termasuk Pajak PPh Final 2.65% dan PPN.',
    itemsCount: 14,
    items: [
      // REVENUE
      {
        id: 'citem_rev_1',
        itemName: 'Pemasukan Termijn 1: Uang Muka (DP) Kontrak 20%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '300000000',
        plannedAmount: '300000000',
        scheduleDates: ['2026-08-05'],
        schedulePrices: ['300000000'],
        reminderNote: 'Penerimaan DP setelah penyerahan Jaminan Uang Muka Bank Garansi 20%',
      },
      {
        id: 'citem_rev_2',
        itemName: 'Pemasukan Termijn 2: Progres Fisik Struktur 50%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '450000000',
        plannedAmount: '450000000',
        scheduleDates: ['2026-09-15'],
        schedulePrices: ['450000000'],
        reminderNote: 'Termijn 2 penagihan MC-50% struktur sloof, kolom & pelat lantai',
      },
      {
        id: 'citem_rev_3',
        itemName: 'Pemasukan Termijn 3: Progres Fisik Finishing 80%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '450000000',
        plannedAmount: '450000000',
        scheduleDates: ['2026-10-20'],
        schedulePrices: ['450000000'],
        reminderNote: 'Termijn 3 penagihan MC-80% arsitektur, MEP & plesteran',
      },
      {
        id: 'citem_rev_4',
        itemName: 'Pemasukan Termijn 4: Serah Terima Pertama (PHO 100%)',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '225000000',
        plannedAmount: '225000000',
        scheduleDates: ['2026-11-28'],
        schedulePrices: ['225000000'],
        reminderNote: 'Pelunasan PHO fisik 100% setelah uji fungsi MEP & komisioning',
      },
      {
        id: 'citem_rev_5',
        itemName: 'Pemasukan Termijn 5: Pelunasan Retensi Pemeliharaan (FHO 5%)',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '75000000',
        plannedAmount: '75000000',
        scheduleDates: ['2026-11-30'],
        schedulePrices: ['75000000'],
        reminderNote: 'Pencairan sisa retensi 5% pasca masa pemeliharaan 180 hari',
      },
      // COGS (BOQ FISIK + AHSP)
      {
        id: 'citem_cogs_1',
        itemName: 'Pekerjaan Pengecoran Beton Ready Mix K-300 Pelat & Balok',
        section: 'cogs',
        itemType: 'expense',
        qty: '240',
        unit: 'm³',
        unitPrice: '1250000',
        plannedAmount: '300000000',
        ahspBreakdown: {
          materialCost: 980000,
          laborCost: 140000,
          equipmentCost: 120000,
          logisticsCost: 35000,
          overheadProfitPct: 10,
          taxPct: 2.65,
          taxLabel: 'PPh Final Konstruksi (2.65%)',
          breakdownNote: 'Analisa AHSP m³: Beton K-300 slump 12±2 cm, concrete pump, vibrator, regu tukang cor, uji silinder lab & PPh 2.65%',
        },
        scheduleDates: ['2026-08-10', '2026-08-20', '2026-09-05', '2026-09-20'],
        schedulePrices: ['75000000', '75000000', '75000000', '75000000'],
        reminderNote: 'Pengiriman batching plant beton ready mix K-300 + sewa concrete pump',
      },
      {
        id: 'citem_cogs_2',
        itemName: 'Pekerjaan Pasangan Dinding Bata Ringan Hebel t=10cm + Plester Aci',
        section: 'cogs',
        itemType: 'expense',
        qty: '1250',
        unit: 'm²',
        unitPrice: '160000',
        plannedAmount: '200000000',
        ahspBreakdown: {
          materialCost: 95000,
          laborCost: 42000,
          equipmentCost: 8000,
          logisticsCost: 5000,
          overheadProfitPct: 12,
          taxPct: 2.65,
          taxLabel: 'PPh Final Konstruksi (2.65%)',
          breakdownNote: 'Analisa AHSP m²: Bata hebel, semen mortar perekat & plesteran, tukang batu + mandor, scaffolding, profit 12% & PPh Final 2.65%',
        },
        scheduleDates: ['2026-08-25', '2026-09-10', '2026-09-25', '2026-10-10'],
        schedulePrices: ['50000000', '50000000', '50000000', '50000000'],
        reminderNote: 'Pemasangan dinding bata ringan dan acian halus interior/eksterior',
      },
      {
        id: 'citem_cogs_3',
        itemName: 'Upah Regu Kerja Lapangan: Mandor, Kepala Tukang, Tukang & Pekerja',
        section: 'cogs',
        itemType: 'expense',
        qty: '6',
        unit: 'Minggu',
        unitPrice: '40000000',
        plannedAmount: '240000000',
        scheduleDates: ['2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29', '2026-09-05', '2026-09-12'],
        schedulePrices: ['40000000', '40000000', '40000000', '40000000', '40000000', '40000000'],
        reminderNote: 'Pembayaran opname mingguan tukang borongan & harian',
      },
      {
        id: 'citem_cogs_4',
        itemName: 'Sewa Alat Berat, Scaffolding 600 Set & Peralatan K3 Keselamatan Kerja',
        section: 'cogs',
        itemType: 'expense',
        qty: '3',
        unit: 'Bulan',
        unitPrice: '30000000',
        plannedAmount: '90000000',
        scheduleDates: ['2026-08-01', '2026-09-01', '2026-10-01'],
        schedulePrices: ['30000000', '30000000', '30000000'],
        reminderNote: 'Sewa scaffolding tubular, concrete vibrator, genset & APD K3',
      },
      // OPEX
      {
        id: 'citem_opex_1',
        itemName: 'Pajak Proyek: PPh Final Jasa Konstruksi (Tarif 2.65%)',
        section: 'opex',
        itemType: 'expense',
        qty: '1',
        unit: 'Pajak',
        unitPrice: '39750000',
        plannedAmount: '39750000',
        scheduleDates: ['2026-08-15'],
        schedulePrices: ['39750000'],
        reminderNote: 'Penyetoran PPh Final Jasa Konstruksi Kualifikasi Menengah (2.65%)',
      },
      {
        id: 'citem_opex_2',
        itemName: 'Pengujian Laboratorium Independen Silinder Beton & Uji Tarik Baja',
        section: 'opex',
        itemType: 'expense',
        qty: '1',
        unit: 'Paket Lab',
        unitPrice: '15000000',
        plannedAmount: '15000000',
        scheduleDates: ['2026-08-20'],
        schedulePrices: ['15000000'],
        reminderNote: 'Uji tekan beton 7, 14, 28 hari di Lab PU Independen',
      },
      // CAPEX & EQUITY
      {
        id: 'citem_cap_1',
        itemName: 'Biaya Penerbitan Bank Garansi Jaminan Uang Muka & Pelaksanaan',
        section: 'capex_equity',
        itemType: 'expense',
        qty: '1',
        unit: 'Garansi',
        unitPrice: '18000000',
        plannedAmount: '18000000',
        scheduleDates: ['2026-08-02'],
        schedulePrices: ['18000000'],
        reminderNote: 'Biaya provisi & surety bond Bank BUMN',
      },
      {
        id: 'citem_cap_2',
        itemName: 'Alokasi Target Margin Keuntungan Bersih Kontraktor (Net Profit 10%)',
        section: 'capex_equity',
        itemType: 'expense',
        qty: '1',
        unit: 'Laba',
        unitPrice: '150000000',
        plannedAmount: '150000000',
        scheduleDates: ['2026-11-30'],
        schedulePrices: ['150000000'],
        reminderNote: 'Target laba bersih pelaksana proyek setelah cadangan risiko',
      },
      // DEBT & RECEIVABLES
      {
        id: 'citem_debt_1',
        itemName: 'Piutang Retensi 5% yang Ditahan Pemberi Kerja Hingga Masa FHO',
        section: 'debt_receivable',
        itemType: 'expense',
        qty: '1',
        unit: 'Retensi',
        unitPrice: '75000000',
        plannedAmount: '75000000',
        scheduleDates: ['2026-11-30'],
        schedulePrices: ['75000000'],
        reminderNote: 'Piutang garansi pemeliharaan 6 bulan',
      },
    ],
  },
  {
    id: 'cnt_arch_sample_2',
    projectName: 'Pengembangan Sistem Dashboard Keuangan & Integrasi Cloud Server',
    contractNumber: '018/SPK/KONS-IT/VII/2026',
    clientName: 'PT Nusantara Integra Solusindo',
    contractorName: 'PT Digital Solusi Utama',
    contractType: 'consultant',
    totalContractValue: 480000000,
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
    summaryNote: 'Kontrak jasa konsultansi IT dan software engineering: Remunerasi Tenaga Ahli (Billing Rate Man-Month), Biaya Non-Personil Cloud Infrastructure, PPh 23 (2%), dan milestone BAST deliverable.',
    rawContractText: 'KONTRAK KERJA SAMA PENGEMBANGAN SISTEM IT & CLOUD INFRASTRUCTURE NO. 018/SPK/KONS-IT/VII/2026. Nilai Kontrak: Rp 480.000.000,- Pembayaran Termijn Milestone 4 Tahap.',
    itemsCount: 9,
    items: [
      {
        id: 'citem_it_rev_1',
        itemName: 'Pemasukan Termijn 1: Inception Report & System Architecture 20%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '96000000',
        plannedAmount: '96000000',
        scheduleDates: ['2026-08-05'],
        schedulePrices: ['96000000'],
        reminderNote: 'Termijn 1 setelah persetujuan Dokumen SRS & Arsitektur',
      },
      {
        id: 'citem_it_rev_2',
        itemName: 'Pemasukan Termijn 2: Interim Deliverable & Core API Development 40%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '192000000',
        plannedAmount: '192000000',
        scheduleDates: ['2026-09-10'],
        schedulePrices: ['192000000'],
        reminderNote: 'Termijn 2 modul transaksi, API service & database staging',
      },
      {
        id: 'citem_it_rev_3',
        itemName: 'Pemasukan Termijn 3: Pelunasan & BAST Serah Terima Source Code 40%',
        section: 'revenue',
        itemType: 'income',
        qty: '1',
        unit: 'Termijn',
        unitPrice: '192000000',
        plannedAmount: '192000000',
        scheduleDates: ['2026-10-25'],
        schedulePrices: ['192000000'],
        reminderNote: 'Termijn final setelah lolos UAT dan penyerahan dokumentasi',
      },
      {
        id: 'citem_it_cogs_1',
        itemName: 'Remunerasi Tenaga Ahli Utama (Team Leader & Senior Architect)',
        section: 'cogs',
        itemType: 'expense',
        qty: '3',
        unit: 'OB (Orang-Bulan)',
        unitPrice: '25000000',
        plannedAmount: '75000000',
        ahspBreakdown: {
          materialCost: 0,
          laborCost: 20000000,
          equipmentCost: 2500000,
          logisticsCost: 2500000,
          overheadProfitPct: 15,
          taxPct: 2.0,
          taxLabel: 'PPh 23 Jasa Konsultan (2%)',
          breakdownNote: 'Standar Billing Rate INKINDO: Gaji pokok ahli, workstation, cloud environment, overhead 15% & PPh 23 (2%)',
        },
        scheduleDates: ['2026-08-30', '2026-09-30', '2026-10-30'],
        schedulePrices: ['25000000', '25000000', '25000000'],
        reminderNote: 'Billing rate bulanan Solution Architect & Project Lead',
      },
      {
        id: 'citem_it_cogs_2',
        itemName: 'Remunerasi Software Engineers & Full-Stack Developers (2 Personil)',
        section: 'cogs',
        itemType: 'expense',
        qty: '6',
        unit: 'OB (Orang-Bulan)',
        unitPrice: '18000000',
        plannedAmount: '108000000',
        scheduleDates: ['2026-08-30', '2026-09-30', '2026-10-30'],
        schedulePrices: ['36000000', '36000000', '36000000'],
        reminderNote: 'Gaji 2 orang Full-Stack Developer selama 3 bulan',
      },
      {
        id: 'citem_it_opex_1',
        itemName: 'Sewa Cloud Dedicated Server, Database Cluster & SSL Security',
        section: 'opex',
        itemType: 'expense',
        qty: '3',
        unit: 'Bulan',
        unitPrice: '12000000',
        plannedAmount: '36000000',
        scheduleDates: ['2026-08-01', '2026-09-01', '2026-10-01'],
        schedulePrices: ['12000000', '12000000', '12000000'],
        reminderNote: 'Langganan server cloud staging & production high availability',
      },
      {
        id: 'citem_it_opex_2',
        itemName: 'Pajak Jasa Konsultan IT: PPh Pasal 23 (Tarif 2%)',
        section: 'opex',
        itemType: 'expense',
        qty: '1',
        unit: 'Pajak',
        unitPrice: '9600000',
        plannedAmount: '9600000',
        scheduleDates: ['2026-08-15'],
        schedulePrices: ['9600000'],
        reminderNote: 'Bukti potong PPh Pasal 23 atas imbalan jasa IT 2%',
      },
      {
        id: 'citem_it_cap_1',
        itemName: 'Target Keuntungan Bersih Konsultan IT (Net Profit Margin 25%)',
        section: 'capex_equity',
        itemType: 'expense',
        qty: '1',
        unit: 'Laba',
        unitPrice: '120000000',
        plannedAmount: '120000000',
        scheduleDates: ['2026-10-30'],
        schedulePrices: ['120000000'],
        reminderNote: 'Target keuntungan bersih proyek software konsultansi',
      },
    ],
  },
];

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  // ============================================================================
  // 1. F&B Coffee Shop & Resto ('fnb_culinary')
  // ============================================================================
  // Stok Bahan Baku & Bahan Minuman
  {
    id: 'inv_fb_1',
    name: 'Biji Kopi Arabika Gayo & Flores (Roast Beans)',
    sku_barcode: '8991002001',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 25,
    last_month_qty: 30,
    unit: 'Kg',
    cost_price: 180000,
    min_stock_alert: 5,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    notes: 'Stok biji kopi specialty grade medium-dark roast',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_2',
    name: 'Fresh Milk Pasteurisasi Full Cream 1 Liter',
    sku_barcode: '8991002002',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 60,
    last_month_qty: 80,
    unit: 'Karton (1L)',
    cost_price: 20000,
    min_stock_alert: 15,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    notes: 'Susu segar pasteurisasi dingin untuk latte/cappuccino',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_3',
    name: 'Sirup Barista Karamel, Vanilla & Hazelnut',
    sku_barcode: '8991002003',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 12,
    last_month_qty: 15,
    unit: 'Botol',
    cost_price: 125000,
    min_stock_alert: 3,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    notes: 'Sirup impor kualitas barista',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_6',
    name: 'Bubuk Matcha & Dark Chocolate Katering Premium',
    sku_barcode: '8991002004',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 10,
    last_month_qty: 10,
    unit: 'Kg',
    cost_price: 160000,
    min_stock_alert: 2,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    notes: 'Bahan baku minuman non-kopi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_7',
    name: 'Cup Plastik Sablon Logo 16oz + Tutup Dome / Strawless',
    sku_barcode: '8991002005',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Kemasan',
    item_type: 'raw_material',
    qty: 1000,
    last_month_qty: 1500,
    unit: 'Pcs',
    cost_price: 850,
    min_stock_alert: 200,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    notes: 'Kemasan takeaway cup dingin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mesin & Peralatan Usaha Utama
  {
    id: 'inv_fb_4',
    name: 'Mesin Espresso Komersial 2-Group Nuova Simonelli',
    sku_barcode: 'AST-ESP-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    last_month_qty: 1,
    unit: 'Unit',
    cost_price: 45000000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-10',
    notes: 'Mesin espresso utama bar, daya 3200 watt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_5',
    name: 'Grinder Kopi Otomatis On-Demand Mahlkonig',
    sku_barcode: 'AST-GRD-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 12500000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-15',
    notes: 'Grinder burr baja presisi untuk espresso bar',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_8',
    name: 'Blender Komersial Heavy Duty Sound Enclosure Ice Crusher',
    sku_barcode: 'AST-BLN-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 2800000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-15',
    notes: 'Blender frappe & smoothies kedap suara',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_9',
    name: 'Under-Counter Chiller Kulkas Stainless 2 Pintu',
    sku_barcode: 'AST-CHL-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 11500000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-08',
    notes: 'Pendingin susu & bahan bar barista',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Furniture Meja, Kursi & Interior Cafe
  {
    id: 'inv_fb_10',
    name: 'Meja Bar Barista & Kasir Custom Finishing HPL Wood + Stainless',
    sku_barcode: 'AST-MBAR-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 8500000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2024-12-20',
    notes: 'Meja counter utama bar espresso & kasir',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_11',
    name: 'Set Meja Makan Kayu Jati Belanda & Kursi Cafe Pelanggan (4 Kursi/Set)',
    sku_barcode: 'AST-MKRS-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 10,
    unit: 'Set',
    cost_price: 1450000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2024-12-22',
    notes: 'Meja & kursi makan dine-in kapasitas 40 orang',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_12',
    name: 'Kursi Barstool Tinggi Besi Hollow Dudukan Kayu Solid',
    sku_barcode: 'AST-BSTL-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 6,
    unit: 'Unit',
    cost_price: 350000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2024-12-22',
    notes: 'Kursi tinggi area counter bar depan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Perlengkapan Kasir POS & ATK Kantor
  {
    id: 'inv_fb_13',
    name: 'Komputer Tablet POS Kasir Android + Bluetooth Thermal Receipt Printer',
    sku_barcode: 'AST-POS-FB',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 3800000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-05',
    notes: 'Perangkat kasir transaksi digital QRIS & struk pesanan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_14',
    name: 'Laci Kasir Otomatis RJ-11 (Cash Drawer Besi 5 Slot)',
    sku_barcode: 'AST-CDR-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 650000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-05',
    notes: 'Laci uang cash kasir buka otomatis',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_fb_15',
    name: 'Paket ATK & Operasional: Buku Pesanan, Nota Manual, Pulpen, Akrilik Menu & Stampel',
    sku_barcode: 'AST-ATK-FB',
    category_id: 'cat_exp_11',
    category_name: 'Perlengkapan/ATK',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 450000,
    mode: 'business',
    business_type: 'fnb_culinary',
    template_id: 'fnb_culinary',
    business_name: 'Kopi Senja Nusantara & Eatery',
    acquisition_date: '2025-01-05',
    notes: 'Alat tulis kantor & operasional kasir cafe',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ============================================================================
  // 2. Toko Swalayan / Ritel Sembako ('retail_shop')
  // ============================================================================
  // Stok Barang Dagangan
  {
    id: 'inv_ret_1',
    name: 'Beras Premium Ramos Setra 5 Kg',
    sku_barcode: '8992003001',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 40,
    unit: 'Karung',
    cost_price: 68000,
    selling_price: 75000,
    min_stock_alert: 10,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    notes: 'Beras pulen kemasan resmi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_2',
    name: 'Minyak Goreng Pouch 2 Liter',
    sku_barcode: '8992003002',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 72,
    unit: 'Pouch',
    cost_price: 31000,
    selling_price: 36000,
    min_stock_alert: 20,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    notes: 'Minyak goreng kelapa sawit higienis',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_3',
    name: 'Gula Pasir Kristal Putih 1 Kg',
    sku_barcode: '8992003003',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 50,
    unit: 'Kg',
    cost_price: 15500,
    selling_price: 17500,
    min_stock_alert: 15,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    notes: 'Gula pasir kemasan pabrik',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_6',
    name: 'Telur Ayam Ras Segar Peti / Karpet (Isi 30 Butir)',
    sku_barcode: '8992003004',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 15,
    unit: 'Peti/Karpet',
    cost_price: 52000,
    selling_price: 60000,
    min_stock_alert: 3,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    notes: 'Telur ayam segar peternak langsung',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_7',
    name: 'Mie Instan Aneka Rasa Goreng & Kuah Dus (Isi 40)',
    sku_barcode: '8992003005',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 30,
    unit: 'Dus',
    cost_price: 115000,
    selling_price: 130000,
    min_stock_alert: 5,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    notes: 'Mie instan favorit pelanggan ritel',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mesin & Peralatan Ritel
  {
    id: 'inv_ret_9',
    name: 'Showcase Chiller Minuman Dingin 2 Pintu Polytron Fast Cooling',
    sku_barcode: 'AST-CHL-RT',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 7500000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-10-15',
    notes: 'Kulkas showcase display minuman botol & kaleng',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_10',
    name: 'Timbangan Digital Presisi Komersial 30 Kg (Price Computing Scale)',
    sku_barcode: 'AST-TMB-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 650000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-10',
    notes: 'Timbangan digital komoditas beras, telur & gula',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Furniture Meja Kasir, Kursi & Rak Display
  {
    id: 'inv_ret_11',
    name: 'Meja Kasir Ritel Custom L-Shape Finishing HPL + Laci Uang Kunci',
    sku_barcode: 'AST-MKAS-RT',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 2500000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-20',
    notes: 'Meja transaksi kasir depan toko',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_12',
    name: 'Kursi Kerja Kasir Ergonomis Putar Hidrolik',
    sku_barcode: 'AST-KKAS-RT',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 450000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-20',
    notes: 'Kursi kerja kasir toko 2 shift',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_4',
    name: 'Rak Gondola Display Minimarket Double Side (5 Tingkat)',
    sku_barcode: 'AST-RAK-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 6,
    unit: 'Set',
    cost_price: 2800000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-20',
    notes: 'Rak display baja powder coating 5 tingkat lorong tengah',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_13',
    name: 'Rak Gondola Single Wall Side Dinding (5 Tingkat)',
    sku_barcode: 'AST-RAK-02',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 4,
    unit: 'Set',
    cost_price: 1950000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-20',
    notes: 'Rak display tempel dinding toko',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_14',
    name: 'Etalase Kaca Display Rokok, Obat Bebas & Kosmetik (2M)',
    sku_barcode: 'AST-ETL-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 1850000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2024-11-20',
    notes: 'Etalase kaca aluminium area kasir',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Peralatan Kasir POS & ATK Kantor
  {
    id: 'inv_ret_5',
    name: 'Set Komputer Kasir POS Touchscreen & Thermal Printer',
    sku_barcode: 'AST-POS-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Set',
    cost_price: 6500000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2025-01-05',
    notes: 'Komputer kasir, laci uang otomatis & scanner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_15',
    name: 'Barcode Scanner Omnidirectional 2D QR & Barcode USB',
    sku_barcode: 'AST-SCN-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 850000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2025-01-05',
    notes: 'Scanner kasir auto-scan meja',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_ret_16',
    name: 'Paket ATK Toko: Buku Faktur Pembelian, Kertas Struk Thermal Roll, Spidol, Kalkulator & Alat Tulis',
    sku_barcode: 'AST-ATK-RT',
    category_id: 'cat_exp_11',
    category_name: 'Perlengkapan/ATK',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 550000,
    mode: 'business',
    business_type: 'retail_shop',
    template_id: 'retail_shop',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    acquisition_date: '2025-01-05',
    notes: 'Persediaan perlengkapan administrasi toko',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ============================================================================
  // 3. Bengkel Otomotif & Sparepart ('workshop_service')
  // ============================================================================
  // Stok Suku Cadang & Pelumas
  {
    id: 'inv_bkl_1',
    name: 'Oli Mesin Motor Matic Full Synthetic 10W-40 (0.8L)',
    sku_barcode: '8993004001',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 36,
    unit: 'Botol',
    cost_price: 42000,
    selling_price: 55000,
    min_stock_alert: 10,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    notes: 'Oli mesin resmi kualitas prima',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_2',
    name: 'Kampas Rem Depan Cakram Motor Honda/Yamaha',
    sku_barcode: '8993004002',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 24,
    unit: 'Set',
    cost_price: 30000,
    selling_price: 45000,
    min_stock_alert: 8,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    notes: 'Kampas rem orisinil non-asbes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_5',
    name: 'Busi Motor Standar Nikel & Iridium Universal',
    sku_barcode: '8993004003',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 50,
    unit: 'Pcs',
    cost_price: 22000,
    selling_price: 35000,
    min_stock_alert: 15,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    notes: 'Busi pengapian motor bebek & matic',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_6',
    name: 'Vanbelt & Roller CVT Matic Honda Beat / Vario / Mio',
    sku_barcode: '8993004004',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 15,
    unit: 'Set',
    cost_price: 85000,
    selling_price: 120000,
    min_stock_alert: 4,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    notes: 'Paket transmisi matic orisinil',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_7',
    name: 'Ban Luar Tubeless Ring 14 (Ukuran 80/90 & 90/90)',
    sku_barcode: '8993004005',
    category_id: 'cat_exp_8',
    category_name: 'Barang Dagangan',
    item_type: 'product_stock',
    qty: 12,
    unit: 'Pcs',
    cost_price: 195000,
    selling_price: 245000,
    min_stock_alert: 3,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    notes: 'Ban motor harian anti-slip',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mesin & Peralatan Bengkel
  {
    id: 'inv_bkl_3',
    name: 'Mesin Kompresor Udara 3 HP & Instalasi Selang Pneumatik',
    sku_barcode: 'AST-KMP-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 8500000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-10',
    notes: 'Kompresor udara utama untuk impact wrench & isi angin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_4',
    name: 'Hydraulic Bike Lift (Lift Motor Servis)',
    sku_barcode: 'AST-LFT-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 3,
    unit: 'Unit',
    cost_price: 4500000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-12',
    notes: 'Lift hidrolik servis motor teknisi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_8',
    name: 'Mesin Pembuka Ban Otomatis / Tyre Changer Motor',
    sku_barcode: 'AST-TYR-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 14500000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-15',
    notes: 'Mesin ganti ban tubeless tanpa merusak velg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_9',
    name: 'Set Tool Cabinet Lemari Perkakas & Kunci Pas/Ring/Soket Tekiro',
    sku_barcode: 'AST-TOL-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 3,
    unit: 'Set',
    cost_price: 3200000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-15',
    notes: 'Toolbox lengkap 3 pit mekanik',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_10',
    name: 'Scanner Diagnostik Injeksi Motor Universal OBD Bluetooth',
    sku_barcode: 'AST-SCN-BK',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 4800000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-09-01',
    notes: 'Scanner reset ECU & cek sensor motor injeksi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Furniture Meja & Kursi Bengkel
  {
    id: 'inv_bkl_11',
    name: 'Meja Kasir Bengkel & Rak Display Sparepart Depan',
    sku_barcode: 'AST-MBKL-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 3200000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-01',
    notes: 'Meja kasir & etalase sparepart penerimaan servis',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_12',
    name: 'Kursi Ruang Tunggu Pelanggan Stainless Steel 4 Dudukan',
    sku_barcode: 'AST-KBKL-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 1100000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-01',
    notes: 'Kursi tunggu konsumen servis',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_13',
    name: 'Meja Kerja Mekanik Heavy Duty Plat Besi Baja (Workbench)',
    sku_barcode: 'AST-WBKL-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 3,
    unit: 'Unit',
    cost_price: 1500000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-01',
    notes: 'Meja bongkar mesin & karburator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Perlengkapan Kasir & ATK Bengkel
  {
    id: 'inv_bkl_14',
    name: 'Komputer Kasir Faktur Servis + Printer Dot Matrix/Thermal Struk',
    sku_barcode: 'AST-POS-BK',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 4500000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-05',
    notes: 'Sistem cetak nota invoice servis motor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_bkl_15',
    name: 'Paket ATK Bengkel: Buku Estimasi SPK Servis, Nomor Antrean, Pulpen, Stampel & Kalkulator',
    sku_barcode: 'AST-ATK-BK',
    category_id: 'cat_exp_11',
    category_name: 'Perlengkapan/ATK',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 350000,
    mode: 'business',
    business_type: 'workshop_service',
    template_id: 'workshop_service',
    business_name: 'Bengkel Maju Jaya Motor & Sparepart',
    acquisition_date: '2024-08-05',
    notes: 'Alat tulis operasional penerimaan servis',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ============================================================================
  // 4. Proyek Konstruksi & Pengadaan ('project_contract' / 'proj_construction')
  // ============================================================================
  // Material Proyek
  {
    id: 'inv_prj_1',
    name: 'Semen Portland Komposit (PCC) 50 Kg',
    sku_barcode: '8994005001',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 150,
    unit: 'Zak',
    cost_price: 64000,
    min_stock_alert: 30,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    notes: 'Material semen struktur & pasangan dinding proyek',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_4',
    name: 'Besi Beton Ulir D13 SNI Panjang 12 Meter',
    sku_barcode: '8994005002',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 100,
    unit: 'Batang',
    cost_price: 125000,
    min_stock_alert: 20,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    notes: 'Besi tulangan struktur kolom & balok beton',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_5',
    name: 'Bata Ringan / Hebel Tebal 10cm Grade A',
    sku_barcode: '8994005003',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 12,
    unit: 'm³ (Kubik)',
    cost_price: 650000,
    min_stock_alert: 3,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    notes: 'Bata hebel dinding bangunan lantai 2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_6',
    name: 'Pasir Pasang & Cor Beton Dump Truk (6 m³)',
    sku_barcode: '8994005004',
    category_id: 'cat_exp_8',
    category_name: 'Bahan Baku/Stok',
    item_type: 'raw_material',
    qty: 4,
    unit: 'Rit',
    cost_price: 1800000,
    min_stock_alert: 1,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    notes: 'Pasir hitam cor kualitas uji lab',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mesin & Peralatan Proyek
  {
    id: 'inv_prj_2',
    name: 'Mesin Molen Cor Beton Portable 350L (Concrete Mixer Diesel 8 HP)',
    sku_barcode: 'AST-MLN-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 14000000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2025-01-02',
    notes: 'Molen pengaduk beton diesel 8 HP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_7',
    name: 'Concrete Vibrator Pemadat Beton Selang 4 Meter Honda Engine',
    sku_barcode: 'AST-VBR-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 2800000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2025-01-02',
    notes: 'Alat pemadat pengecoran kolom & pelat lantai',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_3',
    name: 'Set Scaffolding Baja Galvanis (Main Frame, Cross, Catwalk, Jack Base)',
    sku_barcode: 'AST-SCF-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 40,
    unit: 'Set',
    cost_price: 650000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-10-15',
    notes: 'Scaffolding perancah keselamatan kerja lantai 2 & 3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_8',
    name: 'Genset Silent Diesel Proyek 5 KVA Portable 220V',
    sku_barcode: 'AST-GEN-01',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 11500000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-11-01',
    notes: 'Sumber listrik darurat lapangan & alat las/potong',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Furniture Direksi Keet Lapangan & Kantor
  {
    id: 'inv_prj_9',
    name: 'Set Meja Rapat Proyek & Kursi Direksi Keet Lapangan (8 Kursi)',
    sku_barcode: 'AST-MDIR-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 3800000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-12-01',
    notes: 'Meja rapat koordinasi mingguan konsultan & owner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_10',
    name: 'Meja Gambar Kerja Arsitek / Pelaksana Lapangan + Kursi Putar',
    sku_barcode: 'AST-MGMB-01',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 2,
    unit: 'Unit',
    cost_price: 1200000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-12-01',
    notes: 'Meja kerja teknis drafter & site engineer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_11',
    name: 'Lemari Arsip Dokumen Kontrak & SPK Besi 2 Pintu Kunci (Filling Cabinet)',
    sku_barcode: 'AST-LMR-PRJ',
    category_id: 'cat_exp_11',
    category_name: 'Furniture/Mebel',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 2100000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-12-01',
    notes: 'Penyimpanan arsip gambar kerja as-built & surat SPK',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Peralatan Kantor & ATK Proyek
  {
    id: 'inv_prj_12',
    name: 'Printer A3 Gambar Kerja & Cetak Laporan Progres Mingguan',
    sku_barcode: 'AST-PRN-A3',
    category_id: 'cat_exp_11',
    category_name: 'Peralatan/Aset',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 5500000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-12-05',
    notes: 'Printer cetak format A3 denah & BoQ proyek',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prj_13',
    name: 'Paket ATK & K3 Proyek: Buku Direksi, Kertas HVS A4/A3, Helm K3, Rompi Reflektor & Meteran Laser',
    sku_barcode: 'AST-ATK-PRJ',
    category_id: 'cat_exp_11',
    category_name: 'Perlengkapan/ATK',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 1650000,
    mode: 'business',
    business_type: 'project_contract',
    template_id: 'project_contract',
    business_name: 'PT Cipta Sarana Bangun Persada',
    acquisition_date: '2024-12-05',
    notes: 'Perlengkapan administrasi site engineer & APD K3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ============================================================================
  // 5. Personal Asset & Equipment ('personal_family')
  // ============================================================================
  {
    id: 'inv_prs_1',
    name: 'Laptop Kerja & Komputer Pribadi (MacBook / ThinkPad)',
    sku_barcode: 'AST-PRS-01',
    category_id: 'cat_exp_11',
    category_name: 'Aset Elektronik',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 18500000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2025-01-01',
    notes: 'Laptop utama penunjang kerja profesional & produktivitas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prs_2',
    name: 'Sepeda Motor Pribadi Operasional Keluarga',
    sku_barcode: 'AST-PRS-02',
    category_id: 'cat_exp_2',
    category_name: 'Kendaraan Pribadi',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Unit',
    cost_price: 24000000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2024-05-15',
    notes: 'Kendaraan mobilitas harian dan antar-jemput anak',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prs_3',
    name: 'Perangkat Elektronik Rumah Tangga (Kulkas Inverter, Mesin Cuci, Smart TV 50")',
    sku_barcode: 'AST-PRS-03',
    category_id: 'cat_exp_11',
    category_name: 'Aset Rumah Tangga',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 14500000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2024-03-10',
    notes: 'Peralatan elektronik penunjang kenyamanan rumah',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prs_4',
    name: 'Meja Kerja Minimalis Kayu Jati & Kursi Ergonomis',
    sku_barcode: 'AST-PRS-04',
    category_id: 'cat_exp_11',
    category_name: 'Furniture Rumah',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Set',
    cost_price: 2800000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2024-04-12',
    notes: 'Meja ruang kerja dan belajar di rumah',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prs_5',
    name: 'Logam Mulia Emas Batangan Antam Logam Mulia (10 Gram)',
    sku_barcode: 'AST-PRS-05',
    category_id: 'cat_exp_11',
    category_name: 'Investasi Logam Mulia',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Keping (10g)',
    cost_price: 14500000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2024-01-20',
    notes: 'Aset lindung nilai tabungan emas fisik',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv_prs_6',
    name: 'Paket Perlengkapan Dokumen & ATK Rumah: Box File Sertifikat, Map Dokumen & Pulpen',
    sku_barcode: 'AST-PRS-06',
    category_id: 'cat_exp_11',
    category_name: 'Perlengkapan/ATK',
    item_type: 'equipment_asset',
    qty: 1,
    unit: 'Paket',
    cost_price: 250000,
    mode: 'personal',
    business_type: 'personal_family',
    template_id: 'personal_family',
    acquisition_date: '2024-01-20',
    notes: 'Arsip dokumen penting keluarga',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class DatabaseService {
  public getDataEnvironment(): 'real' | 'sample' {
    try {
      const stored = localStorage.getItem(STORAGE_ENV_KEY);
      if (stored === 'real' || stored === 'sample') return stored;
    } catch {}
    return 'sample';
  }

  public setDataEnvironment(env: 'real' | 'sample'): void {
    try {
      localStorage.setItem(STORAGE_ENV_KEY, env);
    } catch {}
    this.initDatabase();
    this.recalculateAllBalances();
  }

  public getKey(key: string): string {
    const env = this.getDataEnvironment();
    if (env === 'real') {
      return key.replace(/^kasharian_/, 'sakuku_real_');
    }
    return key;
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const targetKey = this.getKey(key);
      const data = localStorage.getItem(targetKey);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    const targetKey = this.getKey(key);
    try {
      localStorage.setItem(targetKey, JSON.stringify(value));
    } catch (e) {
      console.warn(`localStorage quota exceeded on key "${targetKey}", attempting automated cleanup fallback...`, e);

      // Attempt Quota Recovery
      if (key === STORAGE_KEYS.TRANSACTIONS && Array.isArray(value)) {
        let transactions = [...(value as unknown as Transaction[])];

        // 1. First pass: strip attachments longer than 150KB (uncompressed photos)
        transactions = transactions.map((tx) => {
          if (tx.attachment_path && tx.attachment_path.length > 150000) {
            return {
              ...tx,
              attachment_path: undefined,
            };
          }
          return tx;
        });

        try {
          localStorage.setItem(targetKey, JSON.stringify(transactions));
          console.info('Successfully saved transactions after trimming heavy image attachments.');
          return;
        } catch {
          // 2. Second pass: strip ALL attachments from all transactions if quota is extremely tight
          transactions = transactions.map((tx) => ({
            ...tx,
            attachment_path: undefined,
          }));

          try {
            localStorage.setItem(targetKey, JSON.stringify(transactions));
            console.info('Successfully saved transactions after clearing all image attachments to fit quota.');
            return;
          } catch (err2) {
            console.error('Critical storage limit reached:', err2);
          }
        }
      } else {
        // Clear heavy attachments from stored transactions to free space for other keys
        try {
          const rawTxs = localStorage.getItem(this.getKey(STORAGE_KEYS.TRANSACTIONS));
          if (rawTxs) {
            const txs = JSON.parse(rawTxs) as Transaction[];
            const cleanedTxs = txs.map((tx) => ({ ...tx, attachment_path: undefined }));
            localStorage.setItem(this.getKey(STORAGE_KEYS.TRANSACTIONS), JSON.stringify(cleanedTxs));
            // Retry setting target key
            localStorage.setItem(targetKey, JSON.stringify(value));
            return;
          }
        } catch (err3) {
          console.error('Failed to recover quota:', err3);
        }
      }
    }
  }

  public initDatabase(forceReset = false): void {
    const env = this.getDataEnvironment();

    if (env === 'real') {
      const realAccsKey = this.getKey(STORAGE_KEYS.ACCOUNTS);
      const hasRealAccounts = !!localStorage.getItem(realAccsKey);

      if (forceReset || !hasRealAccounts) {
        this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        this.setItem(STORAGE_KEYS.ACCOUNTS, DEFAULT_REAL_ACCOUNTS);
        this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
        this.setItem(STORAGE_KEYS.BUDGETS, []);
        this.setItem(STORAGE_KEYS.BUDGET_ITEMS, []);
        this.setItem(STORAGE_KEYS.INVENTORY, []);
        this.recalculateAllBalances();
      }
      return;
    }

    // SAMPLE MODE
    const SAMPLE_VERSION_KEY = 'sakuku_sample_data_version_tag';
    const CURRENT_SAMPLE_VERSION = 'v2026_08_18_v8_dynamic_variable_incomes';
    const isVersionOutdated = localStorage.getItem(SAMPLE_VERSION_KEY) !== CURRENT_SAMPLE_VERSION;

    const sampleAccsKey = this.getKey(STORAGE_KEYS.ACCOUNTS);
    const hasAccounts = !!localStorage.getItem(sampleAccsKey);
    const storedTxs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const hasTxs = storedTxs && storedTxs.length > 0;
    const storedBudgets = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    const uniqueBizBudgets = new Set(
      storedBudgets
        .filter((b) => b.mode === 'business')
        .map((b) => (b.business_name || b.name || '').toLowerCase().trim())
    );
    const hasAll7BizBudgets = uniqueBizBudgets.size >= 7;

    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    
    // Check if stored transactions contain future dates (e.g. Dec 2026) that need cleanup
    const hasFutureTxs = storedTxs.some((tx) => tx.date && tx.date.slice(0, 10) > todayStr);

    if (forceReset || isVersionOutdated || !hasAccounts || !hasTxs || hasFutureTxs || !hasAll7BizBudgets) {
      this.seedAnnualSampleData(now.getFullYear(), now);
      localStorage.setItem(SAMPLE_VERSION_KEY, CURRENT_SAMPLE_VERSION);
    }
  }

  public seedAnnualSampleData(year = new Date().getFullYear(), targetDate: Date = new Date()): void {
    const annualDataset = generateAnnualSampleDataset(year, targetDate);
    this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    this.setItem(STORAGE_KEYS.ACCOUNTS, annualDataset.accounts);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, annualDataset.transactions);
    this.setItem(STORAGE_KEYS.BUDGETS, annualDataset.budgets);
    this.setItem(STORAGE_KEYS.BUDGET_ITEMS, annualDataset.budgetItems);
    this.recalculateAllBalances();
    try {
      localStorage.setItem('sakuku_sample_data_version_tag', 'v2026_08_18_v8_dynamic_variable_incomes');
    } catch {
      // ignore
    }
  }

  public syncDailySampleData(targetDate: Date = new Date()): void {
    this.seedAnnualSampleData(targetDate.getFullYear(), targetDate);
  }

  // --- ACCOUNTS ---
  public getAccounts(): Account[] {
    const accs = this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    return accs.map((a) => {
      if (!a.scope) {
        if (a.name.toLowerCase().includes('kios') || a.name.toLowerCase().includes('toko') || a.name.toLowerCase().includes('bisnis')) {
          a.scope = 'business';
          a.business_name = 'Toko Utama';
        } else if (a.name.toLowerCase().includes('bca') || a.name.toLowerCase().includes('bank')) {
          a.scope = 'combined';
        } else {
          a.scope = 'personal';
        }
      }
      return a;
    });
  }

  public saveAccount(account: Account): Account[] {
    const accounts = this.getAccounts();
    const existingIdx = accounts.findIndex((a) => a.id === account.id);
    if (existingIdx >= 0) {
      accounts[existingIdx] = account;
    } else {
      accounts.push(account);
    }
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    this.recalculateAllBalances();
    return this.getAccounts();
  }

  public deleteAccount(id: string): Account[] {
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return accounts;
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    const stored = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    // Ensure all default categories (like new debt & receivable categories) are included
    let hasChanges = false;
    const currentMap = new Map(stored.map((c) => [c.name.toLowerCase().trim(), c]));
    for (const defCat of DEFAULT_CATEGORIES) {
      if (!currentMap.has(defCat.name.toLowerCase().trim())) {
        stored.push(defCat);
        currentMap.set(defCat.name.toLowerCase().trim(), defCat);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.setItem(STORAGE_KEYS.CATEGORIES, stored);
    }
    return stored;
  }

  public saveCategory(category: Category): Category[] {
    const categories = this.getCategories();
    const existingIdx = categories.findIndex((c) => c.id === category.id);
    if (existingIdx >= 0) {
      categories[existingIdx] = category;
    } else {
      categories.push(category);
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
    return categories;
  }

  // --- TRANSACTIONS ---
  public getTransactions(): Transaction[] {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    return txs.sort((a, b) => {
      const timeA = parseTxDate(a.date).getTime();
      const timeB = parseTxDate(b.date).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }

  public addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    transactions.unshift(newTx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.recalculateAllBalances();
    return newTx;
  }

  public addMultipleTransactions(txs: Omit<Transaction, 'id'>[]): Transaction[] {
    const transactions = this.getTransactions();
    const created: Transaction[] = txs.map((tx, idx) => ({
      ...tx,
      id: `tx_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
    }));
    transactions.unshift(...created);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.recalculateAllBalances();
    return created;
  }

  public deleteTransaction(id: string): Transaction[] {
    const transactions = this.getTransactions().filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.recalculateAllBalances();
    return transactions;
  }

  public updateTransaction(tx: Transaction): Transaction[] {
    const transactions = this.getTransactions();
    const idx = transactions.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      transactions[idx] = tx;
      this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
      this.recalculateAllBalances();
    }
    return transactions;
  }

  // --- BUDGETS ---
  public getBudgets(): Budget[] {
    return this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
  }

  public getBudgetItems(budgetId?: string): BudgetItem[] {
    const items = this.getItem<BudgetItem[]>(STORAGE_KEYS.BUDGET_ITEMS, DEFAULT_BUDGET_ITEMS);
    if (budgetId) {
      return items.filter((i) => i.budget_id === budgetId);
    }
    return items;
  }

  public createBudget(
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ): Budget {
    const budgets = this.getBudgets();
    const newBudget: Budget = {
      ...budget,
      id: `bdg_${Date.now()}`,
    };
    budgets.push(newBudget);
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);

    const budgetItems = this.getBudgetItems();
    const newItems: BudgetItem[] = items.map((it, idx) => ({
      id: `bi_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      budget_id: newBudget.id,
      category_id: it.category_id,
      planned_amount: it.planned_amount,
      spent_amount: 0,
      reminder_enabled: it.reminder_enabled || false,
      reminder_date: it.reminder_date || budget.end_date,
      reminder_note: it.reminder_note || '',
      reminder_status: 'pending',
    }));

    budgetItems.push(...newItems);
    this.setItem(STORAGE_KEYS.BUDGET_ITEMS, budgetItems);
    this.recalculateAllBalances();
    return newBudget;
  }

  public updateBudget(
    budgetId: string,
    budget: Omit<Budget, 'id'>,
    items: {
      category_id: string;
      planned_amount: number;
      reminder_enabled?: boolean;
      reminder_date?: string;
      reminder_note?: string;
    }[]
  ): Budget {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex((b) => b.id === budgetId);
    const updatedBudget: Budget = {
      ...budget,
      id: budgetId,
    };

    if (idx >= 0) {
      budgets[idx] = updatedBudget;
    } else {
      budgets.push(updatedBudget);
    }
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);

    let budgetItems = this.getBudgetItems().filter((bi) => bi.budget_id !== budgetId);

    const newItems: BudgetItem[] = items.map((it, i) => ({
      id: `bi_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      budget_id: budgetId,
      category_id: it.category_id,
      planned_amount: it.planned_amount,
      spent_amount: 0,
      reminder_enabled: it.reminder_enabled || false,
      reminder_date: it.reminder_date || budget.end_date,
      reminder_note: it.reminder_note || '',
      reminder_status: 'pending',
    }));

    budgetItems.push(...newItems);
    this.setItem(STORAGE_KEYS.BUDGET_ITEMS, budgetItems);
    this.recalculateAllBalances();
    return updatedBudget;
  }

  public updateBudgetItem(item: BudgetItem): BudgetItem[] {
    const items = this.getBudgetItems();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
      this.setItem(STORAGE_KEYS.BUDGET_ITEMS, items);
    }
    return items;
  }

  public deleteBudget(id: string): void {
    const budgets = this.getBudgets().filter((b) => b.id !== id);
    const budgetItems = this.getBudgetItems().filter((bi) => bi.budget_id !== id);
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);
    this.setItem(STORAGE_KEYS.BUDGET_ITEMS, budgetItems);
  }

  // --- RECALCULATION ENGINE ---
  public recalculateAllBalances(): void {
    const accounts = this.getAccounts();
    const transactions = this.getTransactions();
    const budgetItems = this.getBudgetItems();
    const budgets = this.getBudgets();

    // 1. Recalculate account current balances
    accounts.forEach((acc) => {
      let balance = acc.opening_balance;
      transactions.forEach((tx) => {
        if (tx.account_id === acc.id) {
          if (tx.type === 'income') {
            balance += tx.amount;
          } else {
            balance -= tx.amount;
          }
        }
      });
      acc.current_balance = balance;
    });
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);

    // 2. Recalculate budget spent amounts
    budgetItems.forEach((item) => {
      const parentBudget = budgets.find((b) => b.id === item.budget_id);
      let totalSpent = 0;

      if (parentBudget) {
        const bStart = new Date(parentBudget.start_date).getTime();
        const bEnd = new Date(parentBudget.end_date).getTime() + 86400000; // inclusive end

        transactions.forEach((tx) => {
          if (tx.type === 'expense' && tx.category_id === item.category_id) {
            const txDate = new Date(tx.date).getTime();
            const matchesMode =
              parentBudget.mode === 'all' || tx.mode === parentBudget.mode;

            if (txDate >= bStart && txDate <= bEnd && matchesMode) {
              totalSpent += tx.amount;
            }
          }
        });
      }
      item.spent_amount = totalSpent;
    });
    this.setItem(STORAGE_KEYS.BUDGET_ITEMS, budgetItems);
  }

  // --- CONTRACT ARCHIVES (SAVED CONTRACTS & AHSP DATABASE) ---
  public getContractArchives(): SavedContractArchive[] {
    return this.getItem<SavedContractArchive[]>(
      STORAGE_KEYS.CONTRACT_ARCHIVES,
      DEFAULT_CONTRACT_ARCHIVES
    );
  }

  public getContractArchiveById(id: string): SavedContractArchive | undefined {
    const list = this.getContractArchives();
    return list.find((c) => c.id === id);
  }

  public saveContractArchive(
    contractData: Omit<SavedContractArchive, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
    }
  ): SavedContractArchive {
    const list = this.getContractArchives();
    const nowIso = new Date().toISOString();
    const existingIdx = contractData.id
      ? list.findIndex((c) => c.id === contractData.id)
      : -1;

    let savedItem: SavedContractArchive;

    if (existingIdx >= 0) {
      savedItem = {
        ...list[existingIdx],
        ...contractData,
        id: list[existingIdx].id,
        createdAt: list[existingIdx].createdAt || nowIso,
        updatedAt: nowIso,
      };
      list[existingIdx] = savedItem;
    } else {
      savedItem = {
        ...contractData,
        id: contractData.id || `cnt_arch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: contractData.createdAt || nowIso,
        updatedAt: nowIso,
      };
      list.unshift(savedItem);
    }

    this.setItem(STORAGE_KEYS.CONTRACT_ARCHIVES, list);
    return savedItem;
  }

  public deleteContractArchive(id: string): SavedContractArchive[] {
    const list = this.getContractArchives().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CONTRACT_ARCHIVES, list);
    return list;
  }

  // --- INVENTORY & INVESTED CAPITAL METHODS ---
  public getInventoryItems(mode?: ModeType, businessType?: string): InventoryItem[] {
    const saved = this.getItem<InventoryItem[] | null>(STORAGE_KEYS.INVENTORY, null);
    let items: InventoryItem[];
    if (!saved || saved.length === 0) {
      items = DEFAULT_INVENTORY_ITEMS;
      this.setItem(STORAGE_KEYS.INVENTORY, items);
    } else {
      // Merge any missing default template items so users always have rich defaults (meja, kursi, ATK, mesin)
      const existingIds = new Set(saved.map((i) => i.id));
      const missingDefaults = DEFAULT_INVENTORY_ITEMS.filter((def) => !existingIds.has(def.id));
      if (missingDefaults.length > 0) {
        items = [...saved, ...missingDefaults];
        this.setItem(STORAGE_KEYS.INVENTORY, items);
      } else {
        items = saved;
      }
    }

    let filtered = items;
    if (mode) {
      filtered = filtered.filter((item) => item.mode === mode);
    }
    if (businessType && businessType !== 'all') {
      filtered = filtered.filter(
        (item) => item.business_type === businessType || item.template_id === businessType
      );
    }
    return filtered.map((it) => ({
      ...it,
      last_month_qty: it.last_month_qty !== undefined ? it.last_month_qty : it.qty,
    }));
  }

  public saveInventoryItem(itemData: Partial<InventoryItem> & { name: string; cost_price: number; qty: number; item_type: InventoryItemType }): InventoryItem {
    const list = this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY_ITEMS);
    const nowIso = new Date().toISOString();
    const existingIdx = itemData.id ? list.findIndex((i) => i.id === itemData.id) : -1;

    let savedItem: InventoryItem;

    if (existingIdx >= 0) {
      savedItem = {
        ...list[existingIdx],
        ...itemData,
        id: list[existingIdx].id,
        last_month_qty:
          itemData.last_month_qty !== undefined
            ? Number(itemData.last_month_qty)
            : list[existingIdx].last_month_qty !== undefined
            ? list[existingIdx].last_month_qty
            : list[existingIdx].qty,
        created_at: list[existingIdx].created_at || nowIso,
        updated_at: nowIso,
      };
      list[existingIdx] = savedItem;
    } else {
      savedItem = {
        id: itemData.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: itemData.name,
        sku_barcode: itemData.sku_barcode || '',
        category_id: itemData.category_id || 'cat_exp_8',
        category_name: itemData.category_name || (itemData.item_type === 'equipment_asset' ? 'Peralatan/Aset' : 'Bahan Baku/Stok'),
        item_type: itemData.item_type || 'product_stock',
        qty: Number(itemData.qty) || 1,
        last_month_qty: itemData.last_month_qty !== undefined ? Number(itemData.last_month_qty) : Number(itemData.qty) || 1,
        unit: itemData.unit || 'pcs',
        cost_price: Number(itemData.cost_price) || 0,
        selling_price: itemData.selling_price ? Number(itemData.selling_price) : undefined,
        min_stock_alert: itemData.min_stock_alert ? Number(itemData.min_stock_alert) : undefined,
        photo_url: itemData.photo_url || '',
        notes: itemData.notes || '',
        mode: itemData.mode || 'business',
        business_type: itemData.business_type || '',
        template_id: itemData.template_id || itemData.business_type || '',
        business_name: itemData.business_name || '',
        acquisition_date: itemData.acquisition_date || nowIso.split('T')[0],
        created_at: nowIso,
        updated_at: nowIso,
      };
      list.unshift(savedItem);
    }

    this.setItem(STORAGE_KEYS.INVENTORY, list);
    return savedItem;
  }

  public bulkSaveInventoryItems(newItems: (Partial<InventoryItem> & { name: string; cost_price: number; qty: number })[]): InventoryItem[] {
    const list = this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY_ITEMS);
    const nowIso = new Date().toISOString();

    const added: InventoryItem[] = newItems.map((it) => ({
      id: it.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: it.name,
      sku_barcode: it.sku_barcode || '',
      category_id: it.category_id || 'cat_exp_8',
      category_name: it.category_name || (it.item_type === 'equipment_asset' ? 'Peralatan/Aset' : 'Bahan Baku/Stok'),
      item_type: it.item_type || 'product_stock',
      qty: Number(it.qty) || 1,
      last_month_qty: it.last_month_qty !== undefined ? Number(it.last_month_qty) : Number(it.qty) || 1,
      unit: it.unit || 'pcs',
      cost_price: Number(it.cost_price) || 0,
      selling_price: it.selling_price ? Number(it.selling_price) : undefined,
      min_stock_alert: it.min_stock_alert ? Number(it.min_stock_alert) : undefined,
      photo_url: it.photo_url || '',
      notes: it.notes || '',
      mode: it.mode || 'business',
      business_type: it.business_type || '',
      template_id: it.template_id || it.business_type || '',
      business_name: it.business_name || '',
      acquisition_date: it.acquisition_date || nowIso.split('T')[0],
      created_at: nowIso,
      updated_at: nowIso,
    }));

    const combined = [...added, ...list];
    this.setItem(STORAGE_KEYS.INVENTORY, combined);
    return combined;
  }

  public deleteInventoryItem(id: string): InventoryItem[] {
    const list = this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY_ITEMS).filter((i) => i.id !== id);
    this.setItem(STORAGE_KEYS.INVENTORY, list);
    return list;
  }
}

export const db = new DatabaseService();
