import { Category, ModeType } from '../types';

export type BudgetSectionType = 'revenue' | 'cogs' | 'opex' | 'capex_equity' | 'debt_receivable';

export interface TemplateBudgetItem {
  id: string;
  section: BudgetSectionType;
  categoryName: string;
  itemType: 'income' | 'expense';
  plannedDate?: string;
  plannedDates?: string[];
  plannedPrices?: string[];
  qty: string;
  unit?: string;
  unitPrice: string;
  plannedAmount: string;
  reminderEnabled?: boolean;
  reminderNote?: string;
  icon?: string;
  color?: string;
  isContinuous?: boolean;
  continuousType?: 'debt' | 'receivable' | 'contract' | 'other';
  progressCurrent?: number;
  progressTotal?: number;
  totalPrincipal?: number;
  remainingPrincipal?: number;
  progressNote?: string;
}

export interface BusinessBudgetTemplate {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  industryTag: string;
  bidang: string;
  subBidang: string;
  mode?: ModeType;
  businessName?: string;
  periodText?: string;
  items: TemplateBudgetItem[];
}

export function getSectionForBudgetItem(categoryName: string, itemType: 'income' | 'expense'): BudgetSectionType {
  if (itemType === 'income') return 'revenue';
  const lower = categoryName.toLowerCase();
  if (
    lower.includes('kulakan') || lower.includes('bahan') || lower.includes('stok') ||
    lower.includes('boq') || lower.includes('pokok') || lower.includes('makan') ||
    lower.includes('sembako') || lower.includes('hpp') || lower.includes('beras') ||
    lower.includes('minyak') || lower.includes('telur') || lower.includes('gula') ||
    lower.includes('lauk') || lower.includes('sayur') || lower.includes('buah') ||
    lower.includes('gas lpg') || lower.includes('galon') || lower.includes('kopi biji') ||
    lower.includes('susu segar') || lower.includes('sirup') || lower.includes('sparepart') ||
    lower.includes('oli ') || lower.includes('kampas') || lower.includes('busi') ||
    lower.includes('aki') || lower.includes('ban ') || lower.includes('vanbelt') ||
    lower.includes('deterjen konsentrat') || lower.includes('parfum laundry') ||
    lower.includes('plastik packing') || lower.includes('hanger') ||
    lower.includes('kain ') || lower.includes('benang') || lower.includes('kancing') ||
    lower.includes('resleting') || lower.includes('label') ||
    lower.includes('ready mix') || lower.includes('besi beton') || lower.includes('bata') ||
    lower.includes('semen ') || lower.includes('pasir') || lower.includes('keramik') ||
    lower.includes('pipa') || lower.includes('kabel listrik') || lower.includes('cat tembok') ||
    lower.includes('rokok') || lower.includes('mi instan') || lower.includes('tepung') ||
    lower.includes('snack') || lower.includes('minuman botol') || lower.includes('es krim') ||
    lower.includes('bumbu sachet') || lower.includes('sabun karton') || lower.includes('shampo karton')
  ) {
    return 'cogs';
  }
  if (
    lower.includes('cicilan') || lower.includes('hutang') || lower.includes('kredit') ||
    lower.includes('kur') || lower.includes('angsuran') || lower.includes('kpr') ||
    lower.includes('leasing')
  ) {
    return 'debt_receivable';
  }
  if (
    lower.includes('capex') || lower.includes('tabungan') || lower.includes('prive') ||
    lower.includes('investasi') || lower.includes('darurat') || lower.includes('aset') ||
    lower.includes('laba') || lower.includes('zakat') || lower.includes('sedekah') ||
    lower.includes('infaq') || lower.includes('reksadana') || lower.includes('emas') ||
    lower.includes('deviden direksi') || lower.includes('founder')
  ) {
    return 'capex_equity';
  }
  return 'opex';
}

// Helper to create items quickly
const mkItem = (
  id: string, section: BudgetSectionType, name: string, type: 'income' | 'expense',
  qty: string, unit: string, price: string, amount: string,
  extra?: Partial<TemplateBudgetItem>
): TemplateBudgetItem => ({
  id, section, categoryName: name, itemType: type,
  qty, unit, unitPrice: price, plannedAmount: amount,
  ...extra,
});

// ============================================================================
// TEMPLATE ANGGARAN PRIBADI & RUMAH TANGGA — SUPER DETAIL
// 1 ITEM = 1 PEMBAYARAN (TIDAK ADA GABUNGAN)
// ============================================================================
export const PERSONAL_BUDGET_TEMPLATES: BusinessBudgetTemplate[] = [
  {
    id: 'personal_family',
    name: 'Anggaran Keluarga & Rumah Tangga Mandiri',
    badge: 'Keluarga Lengkap',
    icon: 'Users',
    description: 'Rancangan anggaran keluarga super detail: setiap item pembayaran terpisah. Dari beras, minyak goreng, telur, hingga zakat maal — tidak ada yang digabung.',
    industryTag: 'Rumah Tangga',
    bidang: 'Keuangan Rumah Tangga',
    subBidang: 'Keluarga Mandiri Sejahtera',
    mode: 'personal',
    businessName: 'Keluarga Mandiri Sejahtera',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (7 item bervariasi) ═══
      mkItem('pf_r01', 'revenue', 'Gaji Pokok & Tunjangan Bulanan Suami', 'income', '1', 'Bln', '8500000', '8500000', { icon: 'Briefcase', color: '#10B981' }),
      mkItem('pf_r02', 'revenue', 'Tunjangan Lembur & Bonus Prestasi Suami', 'income', '1', 'Bln', '1750000', '1750000', { icon: 'TrendingUp', color: '#059669' }),
      mkItem('pf_r03', 'revenue', 'Penghasilan Gaji Istri (Guru / Pengajar)', 'income', '1', 'Bln', '4200000', '4200000', { icon: 'Briefcase', color: '#10B981' }),
      mkItem('pf_r04', 'revenue', 'Keuntungan Usaha Sampingan Toko Online Istri', 'income', '4', 'Mg', '450000', '1800000', { icon: 'Store', color: '#047857' }),
      mkItem('pf_r05', 'revenue', 'Pendapatan Proyek Freelance Desain & Konsultasi', 'income', '2', 'Paket', '1100000', '2200000', { icon: 'TrendingUp', color: '#14B8A6' }),
      mkItem('pf_r06', 'revenue', 'Bagi Hasil Dividen Reksadana & Deposito', 'income', '1', 'Bln', '650000', '650000', { icon: 'ArrowDownLeft', color: '#0D9488' }),
      mkItem('pf_r07', 'revenue', 'Uang Sewa Paviliun / Kamar Kos Belakang Rumah', 'income', '1', 'Bln', '900000', '900000', { icon: 'Home', color: '#065F46' }),

      // ═══ BELANJA KEBUTUHAN POKOK & DAPUR — per item terpisah (15 item) ═══
      mkItem('pf_c01', 'cogs', 'Beras Premium 25kg (Pandan Wangi)', 'expense', '1', 'Karung', '345000', '345000', { icon: 'Package', color: '#EF4444', reminderEnabled: true, reminderNote: 'Beli beras awal bulan di toko grosir' }),
      mkItem('pf_c02', 'cogs', 'Minyak Goreng Bimoli/Filma 5 Liter', 'expense', '2', 'Jerigen', '42000', '84000', { icon: 'Package', color: '#F97316' }),
      mkItem('pf_c03', 'cogs', 'Telur Ayam Negeri 2 Tray (60 butir)', 'expense', '2', 'Tray', '35000', '70000', { icon: 'Package', color: '#F59E0B' }),
      mkItem('pf_c04', 'cogs', 'Gula Pasir 3 Kilogram', 'expense', '3', 'Kg', '16500', '49500', { icon: 'Package', color: '#EAB308' }),
      mkItem('pf_c05', 'cogs', 'Teh Celup Sariwangi & Kopi Kapal Api Sachet', 'expense', '1', 'Paket', '55000', '55000', { icon: 'Package', color: '#92400E' }),
      mkItem('pf_c06', 'cogs', 'Lauk Protein Minggu I (Ayam, Ikan, Tahu Tempe)', 'expense', '1', 'Minggu', '475000', '475000', { icon: 'Utensils', color: '#DC2626' }),
      mkItem('pf_c07', 'cogs', 'Lauk Protein Minggu II (Daging Sapi, Telur, Tempe)', 'expense', '1', 'Minggu', '525000', '525000', { icon: 'Utensils', color: '#B91C1C' }),
      mkItem('pf_c08', 'cogs', 'Lauk Protein Minggu III (Ikan Laut, Ayam, Tahu)', 'expense', '1', 'Minggu', '450000', '450000', { icon: 'Utensils', color: '#991B1B' }),
      mkItem('pf_c09', 'cogs', 'Lauk Protein Minggu IV (Ayam Kampung, Lele, Tempe)', 'expense', '1', 'Minggu', '500000', '500000', { icon: 'Utensils', color: '#7F1D1D' }),
      mkItem('pf_c10', 'cogs', 'Sayur Mayur, Bumbu Dapur & Rempah Segar', 'expense', '1', 'Bln', '320000', '320000', { icon: 'Utensils', color: '#16A34A' }),
      mkItem('pf_c11', 'cogs', 'Buah Segar (Jeruk, Pepaya, Pisang)', 'expense', '1', 'Bln', '175000', '175000', { icon: 'Utensils', color: '#65A30D' }),
      mkItem('pf_c12', 'cogs', 'Gas LPG 3 Kilogram (2 Tabung)', 'expense', '2', 'Tabung', '22000', '44000', { icon: 'Receipt', color: '#C2410C' }),
      mkItem('pf_c13', 'cogs', 'Air Minum Galon Isi Ulang (8 Galon)', 'expense', '8', 'Galon', '7000', '56000', { icon: 'Receipt', color: '#0369A1' }),
      mkItem('pf_c14', 'cogs', 'Susu UHT Anak & Susu Bubuk Keluarga', 'expense', '1', 'Bln', '185000', '185000', { icon: 'Package', color: '#F59E0B' }),
      mkItem('pf_c15', 'cogs', 'Jajanan & Cemilan Anak Sekolah', 'expense', '1', 'Bln', '150000', '150000', { icon: 'Package', color: '#EA580C' }),

      // ═══ PERLENGKAPAN RUMAH TANGGA — per item (5 item) ═══
      mkItem('pf_c16', 'cogs', 'Sabun Cuci Piring Sunlight & Spons', 'expense', '1', 'Bln', '32000', '32000', { icon: 'Package', color: '#0891B2' }),
      mkItem('pf_c17', 'cogs', 'Deterjen Bubuk Rinso/Attack 1.8kg', 'expense', '1', 'Bungkus', '42000', '42000', { icon: 'Package', color: '#0E7490' }),
      mkItem('pf_c18', 'cogs', 'Sabun Mandi Batang & Cair Keluarga', 'expense', '1', 'Bln', '45000', '45000', { icon: 'Package', color: '#155E75' }),
      mkItem('pf_c19', 'cogs', 'Shampo Pantene/Dove & Pasta Gigi Pepsodent', 'expense', '1', 'Bln', '55000', '55000', { icon: 'Package', color: '#164E63' }),
      mkItem('pf_c20', 'cogs', 'Tisu Toilet, Tisu Makan & Pembalut Wanita', 'expense', '1', 'Bln', '68000', '68000', { icon: 'Package', color: '#134E4A' }),

      // ═══ TAGIHAN RUTIN — per item terpisah (10 item) ═══
      mkItem('pf_o01', 'opex', 'Token Listrik PLN Rumah (R1/2200 VA)', 'expense', '1', 'Bln', '685000', '685000', { icon: 'Receipt', color: '#6366F1', reminderEnabled: true, reminderNote: 'Beli token listrik sebelum habis' }),
      mkItem('pf_o02', 'opex', 'Tagihan Air PDAM Rumah', 'expense', '1', 'Bln', '135000', '135000', { icon: 'Receipt', color: '#4F46E5', reminderEnabled: true, reminderNote: 'Bayar PDAM via mobile banking' }),
      mkItem('pf_o03', 'opex', 'Langganan WiFi IndiHome/Biznet 50 Mbps', 'expense', '1', 'Bln', '375000', '375000', { icon: 'Receipt', color: '#3B82F6', reminderEnabled: true, reminderNote: 'Auto debet WiFi rumah' }),
      mkItem('pf_o04', 'opex', 'Paket Data Seluler Telkomsel Suami', 'expense', '1', 'Bln', '85000', '85000', { icon: 'Receipt', color: '#2563EB' }),
      mkItem('pf_o05', 'opex', 'Paket Data Seluler XL Istri', 'expense', '1', 'Bln', '75000', '75000', { icon: 'Receipt', color: '#1D4ED8' }),
      mkItem('pf_o06', 'opex', 'Iuran Kebersihan & Sampah RT/RW', 'expense', '1', 'Bln', '50000', '50000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('pf_o07', 'opex', 'Iuran Keamanan Lingkungan (Satpam)', 'expense', '1', 'Bln', '75000', '75000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('pf_o08', 'opex', 'PBB Rumah (Pajak Bumi & Bangunan) / 12', 'expense', '1', 'Bln', '125000', '125000', { icon: 'Receipt', color: '#312E81' }),
      mkItem('pf_o09', 'opex', 'Langganan Streaming Netflix / Disney+', 'expense', '1', 'Bln', '65000', '65000', { icon: 'Receipt', color: '#7C3AED' }),
      mkItem('pf_o10', 'opex', 'Langganan Spotify Premium Keluarga', 'expense', '1', 'Bln', '80000', '80000', { icon: 'Receipt', color: '#6D28D9' }),

      // ═══ PENDIDIKAN ANAK — per item (4 item) ═══
      mkItem('pf_o11', 'opex', 'SPP Sekolah Anak ke-1 (SD Swasta)', 'expense', '1', 'Bln', '850000', '850000', { icon: 'GraduationCap', color: '#8B5CF6', reminderEnabled: true, reminderNote: 'Transfer SPP anak sebelum tgl 10' }),
      mkItem('pf_o12', 'opex', 'Uang Les Bimbingan Belajar Matematika & IPA', 'expense', '1', 'Bln', '450000', '450000', { icon: 'GraduationCap', color: '#7C3AED' }),
      mkItem('pf_o13', 'opex', 'Uang Jajan & Transport Anak Sekolah', 'expense', '22', 'Hari', '20000', '440000', { icon: 'WalletCards', color: '#6D28D9' }),
      mkItem('pf_o14', 'opex', 'Buku Tulis, Pensil, Penghapus & ATK Anak', 'expense', '1', 'Bln', '85000', '85000', { icon: 'GraduationCap', color: '#5B21B6' }),

      // ═══ KESEHATAN — per item (3 item) ═══
      mkItem('pf_o15', 'opex', 'Iuran BPJS Kesehatan Keluarga (4 Jiwa)', 'expense', '4', 'Jiwa', '100000', '400000', { icon: 'HeartPulse', color: '#EC4899', reminderEnabled: true, reminderNote: 'Auto debet BPJS tgl 10' }),
      mkItem('pf_o16', 'opex', 'Obat Rutin, Vitamin & Suplemen Keluarga', 'expense', '1', 'Bln', '165000', '165000', { icon: 'HeartPulse', color: '#DB2777' }),
      mkItem('pf_o17', 'opex', 'Biaya Berobat ke Dokter / Klinik Umum', 'expense', '1', 'Bln', '200000', '200000', { icon: 'HeartPulse', color: '#BE185D' }),

      // ═══ TRANSPORTASI — per item (5 item) ═══
      mkItem('pf_o18', 'opex', 'Bensin Motor Honda Vario (Pertalite)', 'expense', '4', 'Minggu', '75000', '300000', { icon: 'Truck', color: '#64748B' }),
      mkItem('pf_o19', 'opex', 'Bensin Mobil Avanza (Pertamax)', 'expense', '4', 'Minggu', '150000', '600000', { icon: 'Truck', color: '#475569' }),
      mkItem('pf_o20', 'opex', 'Servis Motor Berkala & Ganti Oli', 'expense', '1', 'Bln', '185000', '185000', { icon: 'Truck', color: '#334155' }),
      mkItem('pf_o21', 'opex', 'Parkir Harian & Tol Commuting Kantor', 'expense', '22', 'Hari', '12000', '264000', { icon: 'Truck', color: '#1E293B' }),
      mkItem('pf_o22', 'opex', 'Ojek Online (GrabBike/GoRide) Istri', 'expense', '1', 'Bln', '180000', '180000', { icon: 'Truck', color: '#0F172A' }),

      // ═══ GAYA HIDUP & HIBURAN — per item (5 item) ═══
      mkItem('pf_o23', 'opex', 'Skincare & Perawatan Wajah Istri', 'expense', '1', 'Bln', '185000', '185000', { icon: 'ShoppingBag', color: '#EC4899' }),
      mkItem('pf_o24', 'opex', 'Potong Rambut Suami & Anak', 'expense', '1', 'Bln', '65000', '65000', { icon: 'ShoppingBag', color: '#DB2777' }),
      mkItem('pf_o25', 'opex', 'Rekreasi Keluarga Weekend (Mall / Taman)', 'expense', '2', 'Kali', '175000', '350000', { icon: 'ShoppingBag', color: '#BE185D' }),
      mkItem('pf_o26', 'opex', 'Nonton Bioskop Keluarga (Tiket + Snack)', 'expense', '1', 'Kali', '250000', '250000', { icon: 'ShoppingBag', color: '#9D174D' }),
      mkItem('pf_o27', 'opex', 'Ngopi & Jajan di Luar Rumah', 'expense', '1', 'Bln', '225000', '225000', { icon: 'ShoppingBag', color: '#831843' }),

      // ═══ CICILAN & HUTANG — per item (3 item) ═══
      mkItem('pf_d01', 'debt_receivable', 'Cicilan KPR Rumah Bank BTN (Tenor 15 Tahun)', 'expense', '1', 'Bln', '3200000', '3200000', {
        icon: 'Home', color: '#DC2626', reminderEnabled: true, reminderNote: 'Auto debet KPR Bank BTN tgl 6',
        isContinuous: true, continuousType: 'debt', progressCurrent: 38, progressTotal: 180,
        totalPrincipal: 576000000, remainingPrincipal: 454400000,
        progressNote: 'Bulan ke-38 dari 180 (15 Thn) • Sisa Rp 454.400.000',
      }),
      mkItem('pf_d02', 'debt_receivable', 'Cicilan Kredit Motor Honda Vario (Tenor 3 Tahun)', 'expense', '1', 'Bln', '950000', '950000', {
        icon: 'CreditCard', color: '#B91C1C', reminderEnabled: true, reminderNote: 'Angsuran motor FIF tgl 18',
        isContinuous: true, continuousType: 'debt', progressCurrent: 18, progressTotal: 36,
        totalPrincipal: 34200000, remainingPrincipal: 17100000,
        progressNote: 'Bulan ke-18 dari 36 (3 Thn) • Sisa Rp 17.100.000',
      }),
      mkItem('pf_d03', 'debt_receivable', 'Cicilan HP Samsung Galaxy A55 (Paylater 12x)', 'expense', '1', 'Bln', '375000', '375000', {
        icon: 'CreditCard', color: '#991B1B', reminderEnabled: true, reminderNote: 'Jatuh tempo paylater HP tgl 15',
        isContinuous: true, continuousType: 'debt', progressCurrent: 5, progressTotal: 12,
        totalPrincipal: 4500000, remainingPrincipal: 2625000,
        progressNote: 'Bulan ke-5 dari 12 (1 Thn) • Sisa Rp 2.625.000',
      }),

      // ═══ TABUNGAN, INVESTASI & SOSIAL — per item (5 item) ═══
      mkItem('pf_e01', 'capex_equity', 'Tabungan Dana Darurat (Target 6 Bulan Gaji)', 'expense', '1', 'Bln', '750000', '750000', { icon: 'PiggyBank', color: '#10B981' }),
      mkItem('pf_e02', 'capex_equity', 'Investasi Tabungan Emas Pegadaian', 'expense', '1', 'Bln', '500000', '500000', { icon: 'PiggyBank', color: '#059669' }),
      mkItem('pf_e03', 'capex_equity', 'Investasi Reksadana Pasar Uang (Bibit/Bareksa)', 'expense', '1', 'Bln', '400000', '400000', { icon: 'PiggyBank', color: '#047857' }),
      mkItem('pf_e04', 'capex_equity', 'Zakat Penghasilan 2.5% & Infaq Masjid', 'expense', '1', 'Bln', '425000', '425000', { icon: 'HeartPulse', color: '#065F46' }),
      mkItem('pf_e05', 'capex_equity', 'Sedekah Subuh & Kas Sosial Keluarga', 'expense', '1', 'Bln', '200000', '200000', { icon: 'HeartPulse', color: '#064E3B' }),
    ],
  },
];

// ============================================================================
// TEMPLATE ANGGARAN 7 BISNIS UMKM — SUPER DETAIL
// 1 ITEM = 1 PEMBAYARAN (TIDAK ADA GABUNGAN)
// SKALA OMZET PROPORSIONAL REALISTIS KEHIDUPAN NYATA
// ============================================================================
export const BUSINESS_BUDGET_TEMPLATES: BusinessBudgetTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS A: MINIMARKET & TOKO SEMBAKO BERKAH JAYA
  // Skala: UMKM Besar — Omzet ~98,5 jt/bln — Margin Bersih ~12%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'retail_shop',
    name: 'Minimarket & Toko Sembako Berkah Jaya',
    badge: 'Ritel & Dagang',
    icon: 'Store',
    description: 'Toko sembako modern di pinggir jalan raya, buka 07.00-22.00, 4 staf kasir shift, chiller minuman 24 jam. Setiap pos kulakan, gaji, dan tagihan dipisah detail.',
    industryTag: 'Perdagangan & Ritel',
    bidang: 'Perdagangan & Ritel',
    subBidang: 'Minimarket & Toko Sembako Modern',
    businessName: 'Minimarket & Toko Sembako Berkah Jaya',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (8 saluran bervariasi) — Total ~106,45 jt ═══
      mkItem('ra_r01', 'revenue', 'Omzet Kasir Shift Pagi 07.00-15.00 (Sembako & Kebutuhan Dapur)', 'income', '30', 'Hari', '1350000', '40500000', { icon: 'Store', color: '#10B981' }),
      mkItem('ra_r02', 'revenue', 'Omzet Kasir Shift Malam 15.00-22.00 (Peak Hour & Belanja Sore)', 'income', '30', 'Hari', '1150000', '34500000', { icon: 'TrendingUp', color: '#059669' }),
      mkItem('ra_r03', 'revenue', 'Penjualan Grosir B2B ke Warung Makan & Mitra Sekitar', 'income', '4', 'Mg', '3250000', '13000000', { icon: 'ShoppingBag', color: '#14B8A6' }),
      mkItem('ra_r04', 'revenue', 'Penjualan Minuman Dingin Showcase & Es Krim Walls', 'income', '30', 'Hari', '350000', '10500000', { icon: 'Store', color: '#0D9488' }),
      mkItem('ra_r05', 'revenue', 'Pesanan Paket Sembako & Antar Delivery WhatsApp', 'income', '10', 'Paket', '380000', '3800000', { icon: 'Truck', color: '#047857' }),
      mkItem('ra_r06', 'revenue', 'Margin Komisi Agen Bank, Top-Up E-Wallet & Token PLN', 'income', '1', 'Bln', '2450000', '2450000', { icon: 'CreditCard', color: '#065F46' }),
      mkItem('ra_r07', 'revenue', 'Pendapatan Sewa Teras Depan Toko (Booth Kuliner Mitra)', 'income', '2', 'Booth', '600000', '1200000', { icon: 'Home', color: '#0F766E' }),
      mkItem('ra_r08', 'revenue', 'Penjualan Kardus Bekas / Scrap Karton Kulakan Distributor', 'income', '4', 'Mg', '125000', '500000', { icon: 'Package', color: '#115E59' }),

      // ═══ HPP / KULAKAN — per item terpisah (15 item) — Total ~72,35 jt ═══
      mkItem('ra_c01', 'cogs', 'Kulakan Beras Premium 50kg (4 Karung)', 'expense', '4', 'Karung', '650000', '2600000', { icon: 'Package', color: '#EF4444', reminderEnabled: true, reminderNote: 'Order beras dari distributor Minggu 1' }),
      mkItem('ra_c02', 'cogs', 'Kulakan Minyak Goreng Kemasan Karton', 'expense', '10', 'Karton', '240000', '2400000', { icon: 'Package', color: '#DC2626' }),
      mkItem('ra_c03', 'cogs', 'Kulakan Gula Pasir Karung 50kg', 'expense', '2', 'Karung', '850000', '1700000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('ra_c04', 'cogs', 'Kulakan Telur Ayam Negeri (10 Peti)', 'expense', '10', 'Peti', '290000', '2900000', { icon: 'Package', color: '#991B1B' }),
      mkItem('ra_c05', 'cogs', 'Kulakan Tepung Terigu Segitiga Biru Karton', 'expense', '5', 'Karton', '165000', '825000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('ra_c06', 'cogs', 'Kulakan Mi Instan Indomie/Sedaap (6 Karton)', 'expense', '6', 'Karton', '125000', '750000', { icon: 'Package', color: '#F97316' }),
      mkItem('ra_c07', 'cogs', 'Restok Rokok Berbagai Merek (Gudang Garam, Sampoerna)', 'expense', '1', 'Paket', '8500000', '8500000', { icon: 'Package', color: '#EA580C' }),
      mkItem('ra_c08', 'cogs', 'Restok Sabun Mandi & Deterjen Karton (Unilever/Wings)', 'expense', '8', 'Karton', '320000', '2560000', { icon: 'Package', color: '#C2410C' }),
      mkItem('ra_c09', 'cogs', 'Restok Shampo Sachet & Botol Karton', 'expense', '6', 'Karton', '285000', '1710000', { icon: 'Package', color: '#9A3412' }),
      mkItem('ra_c10', 'cogs', 'Kulakan Minuman Botol Dingin & Kaleng (Aqua, Teh Pucuk, Coca-Cola)', 'expense', '15', 'Krat', '145000', '2175000', { icon: 'Package', color: '#7C2D12' }),
      mkItem('ra_c11', 'cogs', 'Restok Es Krim Walls & Campina Showcase', 'expense', '3', 'Box', '450000', '1350000', { icon: 'Package', color: '#0369A1' }),
      mkItem('ra_c12', 'cogs', 'Kulakan Snack Pabrikan (Chitato, Qtela, Oreo)', 'expense', '8', 'Karton', '235000', '1880000', { icon: 'Package', color: '#075985' }),
      mkItem('ra_c13', 'cogs', 'Kulakan Bumbu Dapur Sachet (Royco, Masako, Bango)', 'expense', '5', 'Karton', '185000', '925000', { icon: 'Package', color: '#0C4A6E' }),
      mkItem('ra_c14', 'cogs', 'Kantong Plastik Kresek Besar, Sedang & Kecil', 'expense', '3', 'Pack', '85000', '255000', { icon: 'Package', color: '#1E3A5F' }),
      mkItem('ra_c15', 'cogs', 'Kertas Struk Thermal & Plastik Wrap', 'expense', '1', 'Paket', '125000', '125000', { icon: 'Package', color: '#172554' }),

      // ═══ GAJI KARYAWAN — per orang terpisah (5 item) ═══
      mkItem('ra_o01', 'opex', 'Gaji Staf Kasir Shift Pagi (Karyawan 1)', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('ra_o02', 'opex', 'Gaji Staf Kasir Shift Sore (Karyawan 2)', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('ra_o03', 'opex', 'Gaji Staf Penata Rak & Gudang (Karyawan 3)', 'expense', '1', 'Bln', '2600000', '2600000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('ra_o04', 'opex', 'Gaji Staf Delivery & Bongkar Muat (Karyawan 4)', 'expense', '1', 'Bln', '2500000', '2500000', { icon: 'Users', color: '#5B21B6' }),
      mkItem('ra_o05', 'opex', 'Uang Makan Harian 4 Karyawan', 'expense', '4', 'Orang', '450000', '1800000', { icon: 'Users', color: '#4C1D95' }),

      // ═══ OPERASIONAL TOKO — per item (10 item) ═══
      mkItem('ra_o06', 'opex', 'Sewa Ruko 2 Lantai (Lokasi Jalan Raya)', 'expense', '1', 'Bln', '5500000', '5500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Transfer sewa ruko tgl 1' }),
      mkItem('ra_o07', 'opex', 'Tagihan Listrik PLN Toko (3 Phase / Chiller 24 Jam)', 'expense', '1', 'Bln', '2850000', '2850000', { icon: 'Receipt', color: '#4F46E5', reminderEnabled: true, reminderNote: 'Bayar listrik toko PLN' }),
      mkItem('ra_o08', 'opex', 'Tagihan Air PDAM Toko & Toilet Pelanggan', 'expense', '1', 'Bln', '185000', '185000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('ra_o09', 'opex', 'WiFi & CCTV Langganan Bulanan Toko', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('ra_o10', 'opex', 'Perawatan & Servis Showcase Chiller', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Receipt', color: '#312E81' }),
      mkItem('ra_o11', 'opex', 'Biaya Langganan Aplikasi Kasir POS (iReap/Moka)', 'expense', '1', 'Bln', '150000', '150000', { icon: 'Receipt', color: '#1E1B4B' }),
      mkItem('ra_o12', 'opex', 'Bensin Motor Delivery & Operasional', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Truck', color: '#64748B' }),
      mkItem('ra_o13', 'opex', 'Perlengkapan Kebersihan Toko (Sapu, Pel, Pembersih)', 'expense', '1', 'Bln', '125000', '125000', { icon: 'Package', color: '#475569' }),
      mkItem('ra_o14', 'opex', 'Biaya Promosi Banner, Spanduk & Brosur', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#334155' }),
      mkItem('ra_o15', 'opex', 'Biaya Tak Terduga & Barang Expired/Rusak', 'expense', '1', 'Bln', '500000', '500000', { icon: 'Receipt', color: '#1E293B' }),

      // ═══ CICILAN — per item (2 item) ═══
      mkItem('ra_d01', 'debt_receivable', 'Cicilan KUR BRI (Modal Kulakan Toko)', 'expense', '1', 'Bln', '2350000', '2350000', {
        icon: 'CreditCard', color: '#DC2626', reminderEnabled: true, reminderNote: 'Angsuran KUR BRI tgl 15',
        isContinuous: true, continuousType: 'debt', progressCurrent: 24, progressTotal: 60,
        totalPrincipal: 141000000, remainingPrincipal: 84600000,
        progressNote: 'Bulan ke-24 dari 60 (5 Thn) • Sisa Rp 84.600.000',
      }),
      mkItem('ra_d02', 'debt_receivable', 'Cicilan Leasing Mobil Pick-Up Operasional', 'expense', '1', 'Bln', '1850000', '1850000', {
        icon: 'CreditCard', color: '#B91C1C', reminderEnabled: true, reminderNote: 'Angsuran leasing mobil pick-up',
        isContinuous: true, continuousType: 'debt', progressCurrent: 12, progressTotal: 48,
        totalPrincipal: 88800000, remainingPrincipal: 66600000,
        progressNote: 'Bulan ke-12 dari 48 (4 Thn) • Sisa Rp 66.600.000',
      }),

      // ═══ PRIVE & LABA PEMILIK (2 item) ═══
      mkItem('ra_e01', 'capex_equity', 'Prive / Penarikan Gaji Pemilik Toko', 'expense', '1', 'Bln', '5000000', '5000000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('ra_e02', 'capex_equity', 'Alokasi Laba Ditahan untuk Pengembangan Toko', 'expense', '1', 'Bln', '2000000', '2000000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS B: KOPI SENJA NUSANTARA & EATERY
  // Skala: UMKM Menengah — Omzet ~55 jt/bln — Margin Bersih ~18%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fnb_culinary',
    name: 'Kopi Senja Nusantara & Eatery',
    badge: 'F&B & Kuliner',
    icon: 'Coffee',
    description: 'Kafe modern 30 kursi, menu kopi specialty, makanan ringan, 2 barista + 1 chef + 1 kasir. Bahan baku kopi, susu, makanan dipisah per item.',
    industryTag: 'Food & Beverage',
    bidang: 'Kuliner & F&B',
    subBidang: 'Coffee Shop & Eatery Modern',
    businessName: 'Kopi Senja Nusantara & Eatery',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (8 saluran bervariasi) — Total ~79,97 jt ═══
      mkItem('rb_r01', 'revenue', 'Penjualan Kopi Signature & Espresso Base (Dine-In)', 'income', '30', 'Hari', '650000', '19500000', { icon: 'Coffee', color: '#10B981' }),
      mkItem('rb_r02', 'revenue', 'Penjualan Minuman Non-Coffee (Matcha, Tea, Chocolate)', 'income', '30', 'Hari', '380000', '11400000', { icon: 'Coffee', color: '#059669' }),
      mkItem('rb_r03', 'revenue', 'Penjualan Makanan Berat Kitchen (Ricebowl, Pasta, Toast)', 'income', '30', 'Hari', '520000', '15600000', { icon: 'Utensils', color: '#14B8A6' }),
      mkItem('rb_r04', 'revenue', 'Penjualan Pastry, Croissant & Snack Platter Camilan', 'income', '30', 'Hari', '280000', '8400000', { icon: 'Utensils', color: '#0D9488' }),
      mkItem('rb_r05', 'revenue', 'Penjualan Takeaway Cup & Pesanan Drive-Thru Pagi', 'income', '30', 'Hari', '220000', '6600000', { icon: 'ShoppingBag', color: '#047857' }),
      mkItem('rb_r06', 'revenue', 'Pesanan Online Food Delivery (GrabFood / GoFood / ShopeeFood)', 'income', '30', 'Hari', '450000', '13500000', { icon: 'Truck', color: '#065F46' }),
      mkItem('rb_r07', 'revenue', 'Penjualan Biji Kopi Sangrai Pack 250g & Drip Bag Sachet', 'income', '25', 'Pack', '95000', '2375000', { icon: 'Package', color: '#0F766E' }),
      mkItem('rb_r08', 'revenue', 'Sewa Ruang Meeting / Private Room Event Komunitas', 'income', '4', 'Event', '650000', '2600000', { icon: 'Users', color: '#115E59' }),

      // ═══ BAHAN BAKU KOPI & MAKANAN — per item (12 item) — Total ~18,8 jt ═══
      mkItem('rb_c01', 'cogs', 'Kopi Biji Sangrai Arabika Gayo 5kg', 'expense', '5', 'Kg', '185000', '925000', { icon: 'Package', color: '#EF4444', reminderEnabled: true, reminderNote: 'Order kopi biji dari roastery Gayo' }),
      mkItem('rb_c02', 'cogs', 'Kopi Biji Sangrai Robusta Toraja 5kg', 'expense', '5', 'Kg', '125000', '625000', { icon: 'Package', color: '#DC2626' }),
      mkItem('rb_c03', 'cogs', 'Susu Segar Pasteurisasi Diamond 10 Liter', 'expense', '10', 'Liter', '25000', '250000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('rb_c04', 'cogs', 'Susu Oat & Almond Milk (Barista Edition)', 'expense', '6', 'Liter', '65000', '390000', { icon: 'Package', color: '#991B1B' }),
      mkItem('rb_c05', 'cogs', 'Sirup Monin, Gula Cair & Bubuk Cokelat Barista', 'expense', '1', 'Paket', '850000', '850000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('rb_c06', 'cogs', 'Bubuk Matcha Premium & Thai Tea Powder', 'expense', '1', 'Paket', '420000', '420000', { icon: 'Package', color: '#F97316' }),
      mkItem('rb_c07', 'cogs', 'Bahan Makanan Dapur (Roti, Keju, Sosis, Bacon)', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Utensils', color: '#EA580C' }),
      mkItem('rb_c08', 'cogs', 'Bahan Pastry & Dessert (Tepung, Butter, Cream)', 'expense', '1', 'Bln', '2200000', '2200000', { icon: 'Utensils', color: '#C2410C' }),
      mkItem('rb_c09', 'cogs', 'Sayur Segar, Buah & Garnish Harian', 'expense', '1', 'Bln', '1500000', '1500000', { icon: 'Utensils', color: '#9A3412' }),
      mkItem('rb_c10', 'cogs', 'Cup Sablon Logo 12oz & 16oz (500 pcs)', 'expense', '500', 'Pcs', '2800', '1400000', { icon: 'Package', color: '#7C2D12' }),
      mkItem('rb_c11', 'cogs', 'Lid Cup, Sedotan Paper & Tissue Branded', 'expense', '1', 'Paket', '650000', '650000', { icon: 'Package', color: '#451A03' }),
      mkItem('rb_c12', 'cogs', 'Gas LPG 12kg untuk Dapur Kafe (3 Tabung)', 'expense', '3', 'Tabung', '185000', '555000', { icon: 'Receipt', color: '#78350F' }),

      // ═══ GAJI KARYAWAN — per orang (5 item) ═══
      mkItem('rb_o01', 'opex', 'Gaji Barista Senior (Karyawan 1)', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('rb_o02', 'opex', 'Gaji Barista Junior (Karyawan 2)', 'expense', '1', 'Bln', '3000000', '3000000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('rb_o03', 'opex', 'Gaji Chef / Juru Masak Dapur', 'expense', '1', 'Bln', '3800000', '3800000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('rb_o04', 'opex', 'Gaji Kasir & Pelayan Meja', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#5B21B6' }),
      mkItem('rb_o05', 'opex', 'Uang Makan & Transport 4 Karyawan', 'expense', '4', 'Orang', '400000', '1600000', { icon: 'Users', color: '#4C1D95' }),

      // ═══ OPERASIONAL KAFE — per item (10 item) ═══
      mkItem('rb_o06', 'opex', 'Sewa Bangunan Kafe (Lokasi Strategis)', 'expense', '1', 'Bln', '6500000', '6500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Bayar sewa kafe tgl 1' }),
      mkItem('rb_o07', 'opex', 'Tagihan Listrik PLN Kafe (Mesin Espresso 24 Jam)', 'expense', '1', 'Bln', '1850000', '1850000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('rb_o08', 'opex', 'Tagihan Air PDAM Kafe & Toilet', 'expense', '1', 'Bln', '275000', '275000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('rb_o09', 'opex', 'WiFi Kafe untuk Customer & Operasional', 'expense', '1', 'Bln', '450000', '450000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('rb_o10', 'opex', 'Perawatan Mesin Espresso & Grinder Bulanan', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#312E81' }),
      mkItem('rb_o11', 'opex', 'Langganan Software POS & Pembayaran Digital', 'expense', '1', 'Bln', '200000', '200000', { icon: 'Receipt', color: '#1E1B4B' }),
      mkItem('rb_o12', 'opex', 'Iklan Instagram Ads & TikTok Ads', 'expense', '1', 'Bln', '750000', '750000', { icon: 'Receipt', color: '#EC4899' }),
      mkItem('rb_o13', 'opex', 'Komisi GrabFood & GoFood (20% per Order)', 'expense', '1', 'Bln', '1800000', '1800000', { icon: 'Receipt', color: '#DB2777' }),
      mkItem('rb_o14', 'opex', 'Perlengkapan Kebersihan Kafe & Dapur', 'expense', '1', 'Bln', '175000', '175000', { icon: 'Package', color: '#64748B' }),
      mkItem('rb_o15', 'opex', 'Biaya Tak Terduga & Kerusakan Peralatan', 'expense', '1', 'Bln', '400000', '400000', { icon: 'Receipt', color: '#475569' }),

      // ═══ CICILAN (2 item) ═══
      mkItem('rb_d01', 'debt_receivable', 'Cicilan Mesin Espresso Nuova Simonelli (Tenor 3 Tahun)', 'expense', '1', 'Bln', '1650000', '1650000', {
        icon: 'CreditCard', color: '#DC2626', reminderEnabled: true, reminderNote: 'Cicilan mesin espresso tgl 10',
        isContinuous: true, continuousType: 'debt', progressCurrent: 8, progressTotal: 36,
        totalPrincipal: 59400000, remainingPrincipal: 46200000,
        progressNote: 'Bulan ke-8 dari 36 (3 Thn) • Sisa Rp 46.200.000',
      }),
      mkItem('rb_d02', 'debt_receivable', 'Cicilan Renovasi Interior Kafe (Pinjaman Bank)', 'expense', '1', 'Bln', '1250000', '1250000', {
        icon: 'CreditCard', color: '#B91C1C',
        isContinuous: true, continuousType: 'debt', progressCurrent: 15, progressTotal: 36,
        totalPrincipal: 45000000, remainingPrincipal: 26250000,
        progressNote: 'Bulan ke-15 dari 36 (3 Thn) • Sisa Rp 26.250.000',
      }),

      // ═══ PRIVE & LABA (2 item) ═══
      mkItem('rb_e01', 'capex_equity', 'Prive / Gaji Pemilik Kafe', 'expense', '1', 'Bln', '5000000', '5000000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('rb_e02', 'capex_equity', 'Alokasi Dana Pengembangan Menu & Peralatan Baru', 'expense', '1', 'Bln', '1500000', '1500000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS C: BENGKEL MOBIL & MOTOR AUTOCARE
  // Skala: UMKM Menengah — Omzet ~42 jt/bln — Margin Bersih ~22%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'workshop_service',
    name: 'Bengkel Mobil & Motor AutoCare',
    badge: 'Jasa & Servis',
    icon: 'Wrench',
    description: 'Bengkel otomotif 3 bay, spesialisasi servis rutin, tune-up, ganti oli & ban. 3 mekanik handal + 1 kasir. Stok sparepart dipisah detail per jenis.',
    industryTag: 'Jasa & Reparasi',
    bidang: 'Otomotif & Jasa Servis',
    subBidang: 'Bengkel Mobil & Motor Umum',
    businessName: 'Bengkel Mobil & Motor AutoCare',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (9 saluran bervariasi) — Total ~57,55 jt ═══
      mkItem('rc_r01', 'revenue', 'Jasa Servis Ringan & Tune-Up Rutin Motor', 'income', '80', 'Unit', '120000', '9600000', { icon: 'Wrench', color: '#10B981' }),
      mkItem('rc_r02', 'revenue', 'Jasa Servis Berkala & Tune-Up Mesin Mobil', 'income', '25', 'Unit', '380000', '9500000', { icon: 'Wrench', color: '#059669' }),
      mkItem('rc_r03', 'revenue', 'Jasa Servis CVT & Ganti Vanbelt Motor Matic', 'income', '40', 'Unit', '85000', '3400000', { icon: 'Wrench', color: '#14B8A6' }),
      mkItem('rc_r04', 'revenue', 'Jasa Ganti Ban, Pasang Tubeless & Balancing Roda', 'income', '50', 'Unit', '65000', '3250000', { icon: 'Wrench', color: '#0D9488' }),
      mkItem('rc_r05', 'revenue', 'Penjualan Retail Oli Mesin Motor (Yamalube/MPX/Castrol)', 'income', '120', 'Botol', '75000', '9000000', { icon: 'Package', color: '#047857' }),
      mkItem('rc_r06', 'revenue', 'Penjualan Retail Oli Mesin Mobil (Shell/Total/Mobil1)', 'income', '20', 'Galon', '420000', '8400000', { icon: 'Package', color: '#065F46' }),
      mkItem('rc_r07', 'revenue', 'Penjualan Sparepart Fast Moving (Kampas Rem, Busi, Filter)', 'income', '1', 'Bln', '7500000', '7500000', { icon: 'ShoppingBag', color: '#0F766E' }),
      mkItem('rc_r08', 'revenue', 'Penjualan Aki Baru & Tukar Tambah Aki Bekas', 'income', '15', 'Unit', '320000', '4800000', { icon: 'Package', color: '#115E59' }),
      mkItem('rc_r09', 'revenue', 'Jasa Cuci Salju Motor & Fogging Disinfektan Mobil', 'income', '60', 'Unit', '35000', '2100000', { icon: 'Store', color: '#134E4A' }),

      // ═══ STOK SPAREPART — per item (10 item) — Total ~18,5 jt ═══
      mkItem('rc_c01', 'cogs', 'Stok Oli Motor Yamalube/MPX (20 Liter)', 'expense', '20', 'Liter', '65000', '1300000', { icon: 'Package', color: '#EF4444' }),
      mkItem('rc_c02', 'cogs', 'Stok Oli Mobil Shell/Castrol (20 Liter)', 'expense', '20', 'Liter', '95000', '1900000', { icon: 'Package', color: '#DC2626' }),
      mkItem('rc_c03', 'cogs', 'Stok Kampas Rem Motor (Depan & Belakang)', 'expense', '30', 'Set', '45000', '1350000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('rc_c04', 'cogs', 'Stok Kampas Rem Mobil (Disc Pad)', 'expense', '10', 'Set', '185000', '1850000', { icon: 'Package', color: '#991B1B' }),
      mkItem('rc_c05', 'cogs', 'Stok Busi Motor NGK & Denso', 'expense', '40', 'Pcs', '25000', '1000000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('rc_c06', 'cogs', 'Stok Aki Kering Motor GS/Yuasa', 'expense', '8', 'Unit', '245000', '1960000', { icon: 'Package', color: '#F97316' }),
      mkItem('rc_c07', 'cogs', 'Stok Aki Mobil Amaron/GS 12V', 'expense', '4', 'Unit', '750000', '3000000', { icon: 'Package', color: '#EA580C' }),
      mkItem('rc_c08', 'cogs', 'Stok Vanbelt & Roller CVT Motor Matic', 'expense', '15', 'Set', '120000', '1800000', { icon: 'Package', color: '#C2410C' }),
      mkItem('rc_c09', 'cogs', 'Stok Ban Motor Tubeless IRC/FDR', 'expense', '10', 'Pcs', '195000', '1950000', { icon: 'Package', color: '#9A3412' }),
      mkItem('rc_c10', 'cogs', 'Stok Filter Oli, Filter Udara & Mur Baut', 'expense', '1', 'Paket', '1350000', '1350000', { icon: 'Package', color: '#7C2D12' }),

      // ═══ GAJI KARYAWAN — per orang (4 item) ═══
      mkItem('rc_o01', 'opex', 'Gaji Mekanik Senior (Karyawan 1)', 'expense', '1', 'Bln', '4200000', '4200000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('rc_o02', 'opex', 'Gaji Mekanik Yunior (Karyawan 2)', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('rc_o03', 'opex', 'Gaji Mekanik Yunior (Karyawan 3)', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('rc_o04', 'opex', 'Gaji Kasir & Admin Faktur Bengkel', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#5B21B6' }),

      // ═══ OPERASIONAL BENGKEL — per item (8 item) ═══
      mkItem('rc_o05', 'opex', 'Sewa Ruko Bengkel 3 Bay (Pinggir Jalan)', 'expense', '1', 'Bln', '4500000', '4500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Bayar sewa bengkel tgl 1' }),
      mkItem('rc_o06', 'opex', 'Tagihan Listrik PLN Bengkel (Kompresor & Peralatan)', 'expense', '1', 'Bln', '1250000', '1250000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('rc_o07', 'opex', 'Tagihan Air PDAM Bengkel (Cuci Motor/Mobil)', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('rc_o08', 'opex', 'Perawatan Kompresor Angin & Bike Lift', 'expense', '1', 'Bln', '285000', '285000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('rc_o09', 'opex', 'Majun, Lem, Grease & Bahan Habis Pakai Bengkel', 'expense', '1', 'Bln', '225000', '225000', { icon: 'Package', color: '#312E81' }),
      mkItem('rc_o10', 'opex', 'WiFi & Software Kasir Bengkel', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Receipt', color: '#1E1B4B' }),
      mkItem('rc_o11', 'opex', 'Iklan Google Maps, Spanduk & Brosur Promo', 'expense', '1', 'Bln', '400000', '400000', { icon: 'Receipt', color: '#EC4899' }),
      mkItem('rc_o12', 'opex', 'Biaya Tak Terduga & Garansi Servis', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#64748B' }),

      // ═══ CICILAN (2 item) ═══
      mkItem('rc_d01', 'debt_receivable', 'Cicilan Mesin Tyre Changer & Balancing (KUR)', 'expense', '1', 'Bln', '1200000', '1200000', {
        icon: 'CreditCard', color: '#DC2626',
        isContinuous: true, continuousType: 'debt', progressCurrent: 10, progressTotal: 36,
        totalPrincipal: 43200000, remainingPrincipal: 31200000,
        progressNote: 'Bulan ke-10 dari 36 (3 Thn) • Sisa Rp 31.200.000',
      }),
      mkItem('rc_d02', 'debt_receivable', 'Cicilan Kredit Mobil Towing / Pick-Up Bengkel', 'expense', '1', 'Bln', '1750000', '1750000', {
        icon: 'CreditCard', color: '#B91C1C',
        isContinuous: true, continuousType: 'debt', progressCurrent: 20, progressTotal: 48,
        totalPrincipal: 84000000, remainingPrincipal: 49000000,
        progressNote: 'Bulan ke-20 dari 48 (4 Thn) • Sisa Rp 49.000.000',
      }),

      // ═══ PRIVE (2 item) ═══
      mkItem('rc_e01', 'capex_equity', 'Prive / Gaji Pemilik Bengkel', 'expense', '1', 'Bln', '5500000', '5500000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('rc_e02', 'capex_equity', 'Tabungan Pengembangan & Beli Alat Baru', 'expense', '1', 'Bln', '1000000', '1000000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS D: LAUNDRY KILAT BERSIH WANGI
  // Skala: UMKM Kecil — Omzet ~22 jt/bln — Margin Bersih ~20%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'laundry_service',
    name: 'Laundry Kilat Bersih Wangi',
    badge: 'Jasa Cuci',
    icon: 'Shirt',
    description: 'Laundry kiloan profesional: 5 mesin cuci + 3 dryer gas, layanan reguler, express 3 jam, dry clean, cuci bedcover. 3 karyawan terlatih.',
    industryTag: 'Jasa Laundry',
    bidang: 'Jasa Kebersihan & Laundry',
    subBidang: 'Laundry Kiloan & Express',
    businessName: 'Laundry Kilat Bersih Wangi',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (8 saluran bervariasi) — Total ~32,75 jt ═══
      mkItem('rd_r01', 'revenue', 'Jasa Cuci & Setrika Kiloan Reguler (3 Hari Selesai)', 'income', '1500', 'Kg', '7500', '11250000', { icon: 'Shirt', color: '#10B981' }),
      mkItem('rd_r02', 'revenue', 'Jasa Cuci Kiloan Kilat Express (Same Day / 3 Jam)', 'income', '450', 'Kg', '14000', '6300000', { icon: 'TrendingUp', color: '#059669' }),
      mkItem('rd_r03', 'revenue', 'Jasa Cuci & Setrika Satuan Kemeja, Celana Formal & Batik', 'income', '250', 'Pcs', '16000', '4000000', { icon: 'Shirt', color: '#14B8A6' }),
      mkItem('rd_r04', 'revenue', 'Jasa Dry Clean Gaun Pesta, Jas Formal & Kebaya Pengantin', 'income', '35', 'Pcs', '85000', '2975000', { icon: 'ShoppingBag', color: '#0D9488' }),
      mkItem('rd_r05', 'revenue', 'Jasa Cuci Bedcover King/Queen & Selimut Bulu Tebal', 'income', '60', 'Pcs', '45000', '2700000', { icon: 'Package', color: '#047857' }),
      mkItem('rd_r06', 'revenue', 'Jasa Cuci Karpet Masjid, Karpet Bulu & Gorden Rumah', 'income', '25', 'Lembar', '95000', '2375000', { icon: 'Package', color: '#065F46' }),
      mkItem('rd_r07', 'revenue', 'Jasa Cuci Sepatu Sneakers, Tas Kulit & Helm Motor', 'income', '40', 'Pasang', '45000', '1800000', { icon: 'ShoppingBag', color: '#0F766E' }),
      mkItem('rd_r08', 'revenue', 'Penjualan Retail Botol Parfum Laundry Branded & Deterjen Eceran', 'income', '30', 'Botol', '45000', '1350000', { icon: 'Package', color: '#115E59' }),

      // ═══ BAHAN BAKU — per item (7 item) — Total ~3,93 jt ═══
      mkItem('rd_c01', 'cogs', 'Deterjen Konsentrat Laundry (Bubuk 25kg)', 'expense', '1', 'Karung', '450000', '450000', { icon: 'Package', color: '#EF4444' }),
      mkItem('rd_c02', 'cogs', 'Pelembut & Pewangi Molto/Downy (5 Liter)', 'expense', '3', 'Jerigen', '125000', '375000', { icon: 'Package', color: '#DC2626' }),
      mkItem('rd_c03', 'cogs', 'Parfum Laundry Premium (Aroma 3 Varian)', 'expense', '3', 'Botol', '85000', '255000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('rd_c04', 'cogs', 'Pemutih Pakaian Putih (Bayclin)', 'expense', '2', 'Botol', '35000', '70000', { icon: 'Package', color: '#991B1B' }),
      mkItem('rd_c05', 'cogs', 'Plastik Packing Segel Laundry (2 Roll)', 'expense', '2', 'Roll', '120000', '240000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('rd_c06', 'cogs', 'Hanger Kawat Laundry (100 pcs)', 'expense', '100', 'Pcs', '1500', '150000', { icon: 'Package', color: '#F97316' }),
      mkItem('rd_c07', 'cogs', 'Tag Label Nomor & Nota Karbon Rangkap', 'expense', '1', 'Paket', '85000', '85000', { icon: 'Package', color: '#EA580C' }),

      // ═══ GAJI KARYAWAN — per orang (3 item) ═══
      mkItem('rd_o01', 'opex', 'Gaji Karyawan Cuci & Sortir (Karyawan 1)', 'expense', '1', 'Bln', '2600000', '2600000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('rd_o02', 'opex', 'Gaji Karyawan Setrika Uap (Karyawan 2)', 'expense', '1', 'Bln', '2600000', '2600000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('rd_o03', 'opex', 'Gaji Karyawan Packing & Delivery (Karyawan 3)', 'expense', '1', 'Bln', '2500000', '2500000', { icon: 'Users', color: '#6D28D9' }),

      // ═══ OPERASIONAL — per item (8 item) ═══
      mkItem('rd_o04', 'opex', 'Sewa Kios Laundry (Lokasi Perumahan)', 'expense', '1', 'Bln', '2500000', '2500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Bayar sewa kios tgl 1' }),
      mkItem('rd_o05', 'opex', 'Tagihan Listrik PLN (5 Mesin Cuci + Setrika)', 'expense', '1', 'Bln', '1450000', '1450000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('rd_o06', 'opex', 'Tagihan Air PDAM Laundry (Pemakaian Tinggi)', 'expense', '1', 'Bln', '850000', '850000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('rd_o07', 'opex', 'Gas LPG 12kg untuk Dryer Gas (4 Tabung)', 'expense', '4', 'Tabung', '185000', '740000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('rd_o08', 'opex', 'Perawatan Mesin Cuci & Dryer Bulanan', 'expense', '1', 'Bln', '300000', '300000', { icon: 'Receipt', color: '#312E81' }),
      mkItem('rd_o09', 'opex', 'Bensin Motor Delivery Antar-Jemput', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Truck', color: '#64748B' }),
      mkItem('rd_o10', 'opex', 'Iklan Promo Spanduk, Banner & Diskon Flyer', 'expense', '1', 'Bln', '200000', '200000', { icon: 'Receipt', color: '#EC4899' }),
      mkItem('rd_o11', 'opex', 'Biaya Tak Terduga & Klaim Kerusakan Pakaian', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Receipt', color: '#475569' }),

      // ═══ CICILAN (2 item) ═══
      mkItem('rd_d01', 'debt_receivable', 'Cicilan Mesin Pengering Gas Industrial (Dryer)', 'expense', '1', 'Bln', '850000', '850000', {
        icon: 'CreditCard', color: '#DC2626',
        isContinuous: true, continuousType: 'debt', progressCurrent: 14, progressTotal: 36,
        totalPrincipal: 30600000, remainingPrincipal: 18700000,
        progressNote: 'Bulan ke-14 dari 36 (3 Thn) • Sisa Rp 18.700.000',
      }),
      mkItem('rd_d02', 'debt_receivable', 'Cicilan KUR Mikro BRI (Modal Awal Laundry)', 'expense', '1', 'Bln', '650000', '650000', {
        icon: 'CreditCard', color: '#B91C1C',
        isContinuous: true, continuousType: 'debt', progressCurrent: 20, progressTotal: 36,
        totalPrincipal: 23400000, remainingPrincipal: 10400000,
        progressNote: 'Bulan ke-20 dari 36 (3 Thn) • Sisa Rp 10.400.000',
      }),

      // ═══ PRIVE (2 item) ═══
      mkItem('rd_e01', 'capex_equity', 'Prive / Gaji Pemilik Laundry', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('rd_e02', 'capex_equity', 'Tabungan Penggantian Mesin & Ekspansi', 'expense', '1', 'Bln', '750000', '750000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS E: KONVEKSI & BUTIK BUSANA HARMONI
  // Skala: UMKM Menengah — Omzet ~38 jt/bln — Margin Bersih ~15%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fashion_clothing',
    name: 'Konveksi & Butik Busana Harmoni',
    badge: 'Fashion & Tekstil',
    icon: 'Shirt',
    description: 'Workshop konveksi 6 mesin jahit, produksi busana muslim, seragam kantor, PO event. 4 penjahit + 1 cutter + 1 admin. Bahan baku kain dipisah per jenis.',
    industryTag: 'Tekstil & Fashion',
    bidang: 'Fashion & Konveksi',
    subBidang: 'Konveksi Busana Muslim & Seragam',
    businessName: 'Konveksi & Butik Busana Harmoni',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (7 saluran bervariasi) — Total ~81,67 jt ═══
      mkItem('re_r01', 'revenue', 'Penjualan Retail Busana Muslimah & Gamis di Butik', 'income', '65', 'Pcs', '245000', '15925000', { icon: 'Shirt', color: '#10B981' }),
      mkItem('re_r02', 'revenue', 'Penjualan Online Busana Muslim (Live TikTok & Shopee)', 'income', '110', 'Pcs', '185000', '20350000', { icon: 'Store', color: '#059669' }),
      mkItem('re_r03', 'revenue', 'PO Pesanan Seragam Kemeja Kerja Kantor / Instansi', 'income', '150', 'Pcs', '135000', '20250000', { icon: 'TrendingUp', color: '#14B8A6' }),
      mkItem('re_r04', 'revenue', 'PO Pesanan Kaos Polo / T-Shirt Event Komunitas', 'income', '200', 'Pcs', '75000', '15000000', { icon: 'ShoppingBag', color: '#0D9488' }),
      mkItem('re_r05', 'revenue', 'PO Pesanan Hijab Motif Printing & Pashmina Branded', 'income', '100', 'Pcs', '65000', '6500000', { icon: 'Package', color: '#047857' }),
      mkItem('re_r06', 'revenue', 'Jasa Permak Pakaian, Custom Fitting & Obras Satuan', 'income', '80', 'Order', '35000', '2800000', { icon: 'Shirt', color: '#065F46' }),
      mkItem('re_r07', 'revenue', 'Penjualan Limbah Perca Kain & Sisa Roll Potongan', 'income', '1', 'Paket', '850000', '850000', { icon: 'Package', color: '#0F766E' }),

      // ═══ BAHAN BAKU — per item (10 item) — Total ~14,47 jt ═══
      mkItem('re_c01', 'cogs', 'Kain Katun Toyobo (50 Yard)', 'expense', '50', 'Yard', '45000', '2250000', { icon: 'Package', color: '#EF4444' }),
      mkItem('re_c02', 'cogs', 'Kain Rayon Viscose Premium (40 Yard)', 'expense', '40', 'Yard', '38000', '1520000', { icon: 'Package', color: '#DC2626' }),
      mkItem('re_c03', 'cogs', 'Kain Wolfis & Mosscrepe (30 Yard)', 'expense', '30', 'Yard', '42000', '1260000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('re_c04', 'cogs', 'Kain Drill/American Drill untuk Seragam (60 Yard)', 'expense', '60', 'Yard', '55000', '3300000', { icon: 'Package', color: '#991B1B' }),
      mkItem('re_c05', 'cogs', 'Benang Jahit Berbagai Warna (20 Cone)', 'expense', '20', 'Cone', '18000', '360000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('re_c06', 'cogs', 'Kancing Baju Berbagai Ukuran (500 pcs)', 'expense', '500', 'Pcs', '500', '250000', { icon: 'Package', color: '#F97316' }),
      mkItem('re_c07', 'cogs', 'Resleting YKK & Zipper Jepang (100 pcs)', 'expense', '100', 'Pcs', '3500', '350000', { icon: 'Package', color: '#EA580C' }),
      mkItem('re_c08', 'cogs', 'Kain Keras, Viselin & Furing (30 Meter)', 'expense', '30', 'Meter', '15000', '450000', { icon: 'Package', color: '#C2410C' }),
      mkItem('re_c09', 'cogs', 'Plastik Zipper Packing & Tag Label Brand', 'expense', '1', 'Paket', '280000', '280000', { icon: 'Package', color: '#9A3412' }),
      mkItem('re_c10', 'cogs', 'Bordir Logo Seragam & Sablon Nama', 'expense', '1', 'Paket', '1200000', '1200000', { icon: 'Package', color: '#7C2D12' }),

      // ═══ GAJI KARYAWAN — per orang (5 item) ═══
      mkItem('re_o01', 'opex', 'Upah Penjahit Senior (Karyawan 1)', 'expense', '1', 'Bln', '3200000', '3200000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('re_o02', 'opex', 'Upah Penjahit (Karyawan 2)', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('re_o03', 'opex', 'Upah Penjahit (Karyawan 3)', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('re_o04', 'opex', 'Upah Obras & Finishing (Karyawan 4)', 'expense', '1', 'Bln', '2500000', '2500000', { icon: 'Users', color: '#5B21B6' }),
      mkItem('re_o05', 'opex', 'Gaji Admin, Packing & Ekspedisi', 'expense', '1', 'Bln', '2600000', '2600000', { icon: 'Users', color: '#4C1D95' }),

      // ═══ OPERASIONAL — per item (8 item) ═══
      mkItem('re_o06', 'opex', 'Sewa Ruko Workshop & Butik Display', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Bayar sewa ruko tgl 1' }),
      mkItem('re_o07', 'opex', 'Tagihan Listrik PLN (Mesin Jahit & Setrika Uap)', 'expense', '1', 'Bln', '950000', '950000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('re_o08', 'opex', 'Tagihan Air PDAM Workshop', 'expense', '1', 'Bln', '125000', '125000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('re_o09', 'opex', 'WiFi & Paket Data Jualan Online', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('re_o10', 'opex', 'Iklan Shopee Ads, TikTok Ads & Endorse', 'expense', '1', 'Bln', '850000', '850000', { icon: 'Receipt', color: '#EC4899' }),
      mkItem('re_o11', 'opex', 'Biaya Ekspedisi JNE/J&T/SiCepat (Ongkir Seller)', 'expense', '1', 'Bln', '650000', '650000', { icon: 'Truck', color: '#64748B' }),
      mkItem('re_o12', 'opex', 'Perawatan Mesin Jahit, Obras & Overdeck', 'expense', '1', 'Bln', '250000', '250000', { icon: 'Receipt', color: '#475569' }),
      mkItem('re_o13', 'opex', 'Biaya Tak Terduga & Bahan Cacat', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Receipt', color: '#334155' }),

      // ═══ CICILAN (2 item) ═══
      mkItem('re_d01', 'debt_receivable', 'Cicilan Mesin Jahit Digital Juki & Cutting (KUR)', 'expense', '1', 'Bln', '1100000', '1100000', {
        icon: 'CreditCard', color: '#DC2626',
        isContinuous: true, continuousType: 'debt', progressCurrent: 12, progressTotal: 36,
        totalPrincipal: 39600000, remainingPrincipal: 26400000,
        progressNote: 'Bulan ke-12 dari 36 (3 Thn) • Sisa Rp 26.400.000',
      }),
      mkItem('re_d02', 'debt_receivable', 'Cicilan Mesin Bordir Komputer Tajima', 'expense', '1', 'Bln', '950000', '950000', {
        icon: 'CreditCard', color: '#B91C1C',
        isContinuous: true, continuousType: 'debt', progressCurrent: 6, progressTotal: 24,
        totalPrincipal: 22800000, remainingPrincipal: 17100000,
        progressNote: 'Bulan ke-6 dari 24 (2 Thn) • Sisa Rp 17.100.000',
      }),

      // ═══ PRIVE (2 item) ═══
      mkItem('re_e01', 'capex_equity', 'Prive / Gaji Pemilik Konveksi', 'expense', '1', 'Bln', '4500000', '4500000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('re_e02', 'capex_equity', 'Dana Pengembangan Desain & Koleksi Baru', 'expense', '1', 'Bln', '1000000', '1000000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS F: PT CIPTA SARANA BANGUN PERSADA (KONTRAKTOR)
  // Skala: Menengah/Besar — Omzet ~285 jt/bln — Margin Bersih ~10%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'project_contract',
    name: 'PT Cipta Sarana Bangun Persada',
    badge: 'Konstruksi & Proyek',
    icon: 'Building2',
    description: 'Kontraktor bangunan menengah, proyek gedung 3 lantai senilai Rp 3,4 Miliar. Material, upah tukang, alat berat dipisah detail per jenis.',
    industryTag: 'Konstruksi & Properti',
    bidang: 'Jasa Konstruksi & Bangunan',
    subBidang: 'Kontraktor Gedung & Infrastruktur',
    businessName: 'PT Cipta Sarana Bangun Persada',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN — Termijn & Jasa Konstruksi (7 saluran bervariasi) — Total ~548,5 jt ═══
      mkItem('rf_r01', 'revenue', 'Pencairan Uang Muka (DP Kontrak 20%) Proyek Gedung Baru', 'income', '1', 'Paket', '150000000', '150000000', {
        icon: 'Store', color: '#10B981',
        isContinuous: true, continuousType: 'contract', progressCurrent: 20, progressTotal: 100,
        progressNote: 'Uang Muka (DP 20%) dari Kontrak Rp 3,4 Miliar',
      }),
      mkItem('rf_r02', 'revenue', 'Pencairan Termijn Progres Fisik Struktur Bawah & Pondasi (35%)', 'income', '1', 'Paket', '175000000', '175000000', {
        icon: 'TrendingUp', color: '#059669',
        isContinuous: true, continuousType: 'contract', progressCurrent: 35, progressTotal: 100,
        progressNote: 'Termijn 1: Struktur Bawah & Pondasi Selesai 100%',
      }),
      mkItem('rf_r03', 'revenue', 'Pencairan Termijn Progres Fisik Dinding & Finishing Interior (30%)', 'income', '1', 'Paket', '120000000', '120000000', {
        icon: 'TrendingUp', color: '#14B8A6',
        isContinuous: true, continuousType: 'contract', progressCurrent: 30, progressTotal: 100,
        progressNote: 'Termijn 2: Pasangan Dinding & Plasteran Selesai',
      }),
      mkItem('rf_r04', 'revenue', 'Pencairan Addendum Tambahan Pekerjaan MEP & Landscape', 'income', '1', 'Paket', '35000000', '35000000', { icon: 'Package', color: '#0D9488' }),
      mkItem('rf_r05', 'revenue', 'Pendapatan Jasa Supervisi & Pengawasan Renovasi Gudang', 'income', '1', 'Bln', '25000000', '25000000', { icon: 'Briefcase', color: '#047857' }),
      mkItem('rf_r06', 'revenue', 'Jasa Pembuatan Gambar Desain Arsitektur & Perhitungan RAB', 'income', '2', 'Proyek', '12500000', '25000000', { icon: 'Briefcase', color: '#065F46' }),
      mkItem('rf_r07', 'revenue', 'Penjualan Scrap Besi Potongan & Kayu Bekisting Bekas', 'income', '1', 'Paket', '18500000', '18500000', { icon: 'Package', color: '#0F766E' }),

      // ═══ MATERIAL PROYEK — per item (12 item) — Total ~135 jt ═══
      mkItem('rf_c01', 'cogs', 'Beton Ready Mix K-300 (30 Truck Mixer)', 'expense', '30', 'Truk', '1450000', '43500000', { icon: 'Package', color: '#EF4444', reminderEnabled: true, reminderNote: 'Order ready mix Holcim/Jayamix' }),
      mkItem('rf_c02', 'cogs', 'Besi Beton Ulir D13 SNI (10 Ton)', 'expense', '10', 'Ton', '12500000', '12500000', { icon: 'Package', color: '#DC2626' }),
      mkItem('rf_c03', 'cogs', 'Besi Beton Ulir D10 SNI (5 Ton)', 'expense', '5', 'Ton', '12800000', '6400000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('rf_c04', 'cogs', 'Bata Ringan Hebel (4000 Buah)', 'expense', '4000', 'Buah', '8500', '34000000', { icon: 'Package', color: '#991B1B' }),
      mkItem('rf_c05', 'cogs', 'Semen Portland Tiga Roda 50kg (200 Sak)', 'expense', '200', 'Sak', '72000', '14400000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('rf_c06', 'cogs', 'Pasir Cor & Pasir Halus (20 Truk)', 'expense', '20', 'Truk', '450000', '9000000', { icon: 'Package', color: '#F97316' }),
      mkItem('rf_c07', 'cogs', 'Keramik Lantai 60x60 & 30x60 (500 Doos)', 'expense', '500', 'Doos', '85000', '42500000', { icon: 'Package', color: '#EA580C' }),
      mkItem('rf_c08', 'cogs', 'Pipa PVC & Fitting Rucika (Instalasi Air)', 'expense', '1', 'Paket', '8500000', '8500000', { icon: 'Package', color: '#C2410C' }),
      mkItem('rf_c09', 'cogs', 'Kabel Listrik NYM & MCB Panel Schneider', 'expense', '1', 'Paket', '12000000', '12000000', { icon: 'Package', color: '#9A3412' }),
      mkItem('rf_c10', 'cogs', 'Cat Tembok Interior & Eksterior Dulux/Jotun', 'expense', '1', 'Paket', '15500000', '15500000', { icon: 'Package', color: '#7C2D12' }),
      mkItem('rf_c11', 'cogs', 'Kusen Aluminium & Kaca Tempered (50 Unit)', 'expense', '50', 'Unit', '850000', '42500000', { icon: 'Package', color: '#451A03' }),
      mkItem('rf_c12', 'cogs', 'Multiplek, Triplek & Kayu Bekisting', 'expense', '1', 'Paket', '7500000', '7500000', { icon: 'Package', color: '#78350F' }),

      // ═══ UPAH TENAGA KERJA — per jenis (6 item) ═══
      mkItem('rf_o01', 'opex', 'Upah Mandor Lapangan (1 Orang)', 'expense', '1', 'Bln', '7500000', '7500000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('rf_o02', 'opex', 'Upah Tukang Batu (5 Orang)', 'expense', '5', 'Orang', '4200000', '21000000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('rf_o03', 'opex', 'Upah Tukang Besi (3 Orang)', 'expense', '3', 'Orang', '4500000', '13500000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('rf_o04', 'opex', 'Upah Tukang Kayu & Bekisting (2 Orang)', 'expense', '2', 'Orang', '4200000', '8400000', { icon: 'Users', color: '#5B21B6' }),
      mkItem('rf_o05', 'opex', 'Upah Pekerja Harian Lepas / Kuli (8 Orang)', 'expense', '8', 'Orang', '3200000', '25600000', { icon: 'Users', color: '#4C1D95' }),
      mkItem('rf_o06', 'opex', 'Uang Makan Harian Seluruh Pekerja (19 Orang)', 'expense', '19', 'Orang', '650000', '12350000', { icon: 'Users', color: '#3B0764' }),

      // ═══ OPERASIONAL PROYEK — per item (8 item) ═══
      mkItem('rf_o07', 'opex', 'Sewa Scaffolding & Formwork (Per Bulan)', 'expense', '1', 'Bln', '8500000', '8500000', { icon: 'Home', color: '#6366F1' }),
      mkItem('rf_o08', 'opex', 'Sewa Alat Berat Excavator & Crane', 'expense', '1', 'Bln', '15000000', '15000000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('rf_o09', 'opex', 'Solar & Bensin Alat Berat, Truk & Genset', 'expense', '1', 'Bln', '4500000', '4500000', { icon: 'Truck', color: '#4338CA' }),
      mkItem('rf_o10', 'opex', 'Asuransi Proyek & K3 (Keselamatan Kerja)', 'expense', '1', 'Bln', '3500000', '3500000', { icon: 'Receipt', color: '#3730A3' }),
      mkItem('rf_o11', 'opex', 'Gaji Admin Proyek, Akuntansi & Logistik', 'expense', '2', 'Orang', '4500000', '9000000', { icon: 'Users', color: '#312E81' }),
      mkItem('rf_o12', 'opex', 'Sewa Kantor Lapangan (Direksi Keet)', 'expense', '1', 'Bln', '2500000', '2500000', { icon: 'Home', color: '#1E1B4B' }),
      mkItem('rf_o13', 'opex', 'Biaya Perizinan, IMB & Administrasi Proyek', 'expense', '1', 'Bln', '2000000', '2000000', { icon: 'Receipt', color: '#64748B' }),
      mkItem('rf_o14', 'opex', 'Biaya Tak Terduga, Klaim & Revisi Desain', 'expense', '1', 'Bln', '5000000', '5000000', { icon: 'Receipt', color: '#475569' }),

      // ═══ PAJAK & KEWAJIBAN (2 item) ═══
      mkItem('rf_d01', 'debt_receivable', 'Pajak Proyek PPh Final Jasa Konstruksi (2.65%)', 'expense', '1', 'Bln', '7562500', '7562500', { icon: 'Receipt', color: '#DC2626', reminderEnabled: true, reminderNote: 'Setoran PPh Final konstruksi tgl 15' }),
      mkItem('rf_d02', 'debt_receivable', 'Retensi Jaminan Kontrak (5% Nilai Termijn)', 'expense', '1', 'Bln', '14250000', '14250000', { icon: 'Receipt', color: '#B91C1C' }),

      // ═══ DEVIDEN & LABA (2 item) ═══
      mkItem('rf_e01', 'capex_equity', 'Deviden Direksi / Pemilik Perusahaan', 'expense', '1', 'Bln', '15000000', '15000000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('rf_e02', 'capex_equity', 'Alokasi Laba Ditahan untuk Tender Proyek Berikutnya', 'expense', '1', 'Bln', '10000000', '10000000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BISNIS G: PT DIGITAL SOLUSI UTAMA (SOFTWARE HOUSE & AGENSI IT)
  // Skala: UMKM Menengah — Omzet ~75 jt/bln — Margin Bersih ~28%
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'consultant_it',
    name: 'PT Digital Solusi Utama',
    badge: 'Teknologi & IT',
    icon: 'Monitor',
    description: 'Software house 8 orang: 4 developer, 1 UI/UX, 1 PM, 1 QA, 1 founder. Proyek web, mobile app, retainer maintenance. Biaya cloud, lisensi, gaji dipisah detail.',
    industryTag: 'Teknologi Informasi',
    bidang: 'Teknologi Informasi & Digital',
    subBidang: 'Software House & IT Consulting',
    businessName: 'PT Digital Solusi Utama',
    periodText: 'Bulanan (Tgl 1 s/d 31)',
    items: [
      // ═══ PENDAPATAN (7 saluran bervariasi) — Total ~200,5 jt ═══
      mkItem('rg_r01', 'revenue', 'Milestone DP Kontrak Pengembangan Custom Web App Enterprise', 'income', '1', 'Kontrak', '45000000', '45000000', {
        icon: 'Monitor', color: '#10B981',
        isContinuous: true, continuousType: 'contract', progressCurrent: 30, progressTotal: 100,
        progressNote: 'DP Kontrak Web App ERP Enterprise (Nilai Rp 150 Jt)',
      }),
      mkItem('rg_r02', 'revenue', 'Milestone Delivery Backend API & Integrasi Database Payment', 'income', '1', 'Kontrak', '35000000', '35000000', {
        icon: 'TrendingUp', color: '#059669',
        isContinuous: true, continuousType: 'contract', progressCurrent: 60, progressTotal: 100,
        progressNote: 'Milestone Backend & Payment Gateway Live',
      }),
      mkItem('rg_r03', 'revenue', 'Milestone UAT & Peluncuran Mobile App iOS/Android', 'income', '1', 'Kontrak', '38000000', '38000000', {
        icon: 'TrendingUp', color: '#14B8A6',
        isContinuous: true, continuousType: 'contract', progressCurrent: 100, progressTotal: 100,
        progressNote: 'Final Delivery & Serah Terima Aplikasi Mobile',
      }),
      mkItem('rg_r04', 'revenue', 'Kontrak Retainer Bulanan Maintenance Cloud & SLA Support', 'income', '3', 'Klien', '6500000', '19500000', { icon: 'Package', color: '#0D9488' }),
      mkItem('rg_r05', 'revenue', 'Jasa UI/UX Design System, Wireframe & Prototype Figma', 'income', '2', 'Proyek', '14000000', '28000000', { icon: 'Briefcase', color: '#047857' }),
      mkItem('rg_r06', 'revenue', 'Jasa Setup Cloud Server DevOps, CI/CD & Security Hardening', 'income', '2', 'Klien', '8500000', '17000000', { icon: 'Briefcase', color: '#065F46' }),
      mkItem('rg_r07', 'revenue', 'Penjualan Lisensi Template SaaS Dashboard & Modul ERP', 'income', '4', 'Lisensi', '4500000', '18000000', { icon: 'Monitor', color: '#0F766E' }),

      // ═══ GAJI TIM — per orang (8 item) — Total ~49,5 jt ═══
      mkItem('rg_o01', 'opex', 'Gaji Programmer Fullstack Senior (Dev 1)', 'expense', '1', 'Bln', '12000000', '12000000', { icon: 'Users', color: '#8B5CF6' }),
      mkItem('rg_o02', 'opex', 'Gaji Programmer Fullstack Mid (Dev 2)', 'expense', '1', 'Bln', '9000000', '9000000', { icon: 'Users', color: '#7C3AED' }),
      mkItem('rg_o03', 'opex', 'Gaji Programmer Backend Junior (Dev 3)', 'expense', '1', 'Bln', '7000000', '7000000', { icon: 'Users', color: '#6D28D9' }),
      mkItem('rg_o04', 'opex', 'Gaji Programmer Mobile Flutter/React Native (Dev 4)', 'expense', '1', 'Bln', '8500000', '8500000', { icon: 'Users', color: '#5B21B6' }),
      mkItem('rg_o05', 'opex', 'Gaji UI/UX Designer & Graphic', 'expense', '1', 'Bln', '7500000', '7500000', { icon: 'Users', color: '#4C1D95' }),
      mkItem('rg_o06', 'opex', 'Gaji Project Manager / Scrum Master', 'expense', '1', 'Bln', '8000000', '8000000', { icon: 'Users', color: '#3B0764' }),
      mkItem('rg_o07', 'opex', 'Gaji QA Tester & DevOps Part-Time', 'expense', '1', 'Bln', '5500000', '5500000', { icon: 'Users', color: '#581C87' }),
      mkItem('rg_o08', 'opex', 'Tunjangan Internet & Pulsa Remote Team', 'expense', '7', 'Orang', '200000', '1400000', { icon: 'Users', color: '#6B21A8' }),

      // ═══ INFRASTRUKTUR CLOUD & LISENSI — per item (7 item) — Total ~7,45 jt ═══
      mkItem('rg_c01', 'cogs', 'Sewa Cloud Server AWS EC2 / GCP Compute', 'expense', '1', 'Bln', '2800000', '2800000', { icon: 'Package', color: '#EF4444' }),
      mkItem('rg_c02', 'cogs', 'Sewa Database Cloud RDS / Cloud SQL', 'expense', '1', 'Bln', '1200000', '1200000', { icon: 'Package', color: '#DC2626' }),
      mkItem('rg_c03', 'cogs', 'Lisensi API AI (OpenAI / Google Vertex AI)', 'expense', '1', 'Bln', '850000', '850000', { icon: 'Package', color: '#B91C1C' }),
      mkItem('rg_c04', 'cogs', 'Langganan Github Enterprise (7 Seats)', 'expense', '7', 'Seat', '145000', '1015000', { icon: 'Package', color: '#991B1B' }),
      mkItem('rg_c05', 'cogs', 'Langganan Figma Pro (3 Seats)', 'expense', '3', 'Seat', '195000', '585000', { icon: 'Package', color: '#7F1D1D' }),
      mkItem('rg_c06', 'cogs', 'Domain, SSL & CDN (Cloudflare Pro)', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Package', color: '#F97316' }),
      mkItem('rg_c07', 'cogs', 'Lisensi SaaS Tools (Slack, Notion, Jira)', 'expense', '1', 'Bln', '650000', '650000', { icon: 'Package', color: '#EA580C' }),

      // ═══ OPERASIONAL KANTOR — per item (6 item) ═══
      mkItem('rg_o09', 'opex', 'Sewa Coworking Suite / Kantor Kecil', 'expense', '1', 'Bln', '4500000', '4500000', { icon: 'Home', color: '#6366F1', reminderEnabled: true, reminderNote: 'Bayar sewa kantor tgl 1' }),
      mkItem('rg_o10', 'opex', 'Tagihan Listrik & Air Kantor', 'expense', '1', 'Bln', '650000', '650000', { icon: 'Receipt', color: '#4F46E5' }),
      mkItem('rg_o11', 'opex', 'WiFi Bisnis Fiber Optik 100 Mbps', 'expense', '1', 'Bln', '550000', '550000', { icon: 'Receipt', color: '#4338CA' }),
      mkItem('rg_o12', 'opex', 'Iklan Google Ads & LinkedIn Ads', 'expense', '1', 'Bln', '1500000', '1500000', { icon: 'Receipt', color: '#EC4899' }),
      mkItem('rg_o13', 'opex', 'ATK, Kopi Kantor & Perlengkapan Meeting', 'expense', '1', 'Bln', '350000', '350000', { icon: 'Package', color: '#64748B' }),
      mkItem('rg_o14', 'opex', 'Biaya Tak Terduga, Bug Fix Urgent & Overtime', 'expense', '1', 'Bln', '750000', '750000', { icon: 'Receipt', color: '#475569' }),

      // ═══ PAJAK & CICILAN (2 item) ═══
      mkItem('rg_d01', 'debt_receivable', 'Pajak PPh 23 Jasa IT (2% dari Kontrak)', 'expense', '1', 'Bln', '1500000', '1500000', { icon: 'Receipt', color: '#DC2626', reminderEnabled: true, reminderNote: 'Setoran PPh 23 tgl 15' }),
      mkItem('rg_d02', 'debt_receivable', 'Cicilan Laptop & Monitor Tim (Leasing 2 Tahun)', 'expense', '1', 'Bln', '2250000', '2250000', {
        icon: 'CreditCard', color: '#B91C1C',
        isContinuous: true, continuousType: 'debt', progressCurrent: 8, progressTotal: 24,
        totalPrincipal: 54000000, remainingPrincipal: 36000000,
        progressNote: 'Bulan ke-8 dari 24 (2 Thn) • Sisa Rp 36.000.000',
      }),

      // ═══ PRIVE FOUNDER & LABA (2 item) ═══
      mkItem('rg_e01', 'capex_equity', 'Prive / Gaji Founder & CEO', 'expense', '1', 'Bln', '10000000', '10000000', { icon: 'WalletCards', color: '#10B981' }),
      mkItem('rg_e02', 'capex_equity', 'Dana R&D Produk Internal & SaaS Startup', 'expense', '1', 'Bln', '3000000', '3000000', { icon: 'PiggyBank', color: '#059669' }),
    ],
  },
];
