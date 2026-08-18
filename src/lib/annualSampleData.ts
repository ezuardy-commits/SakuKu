import { Account, Category, Transaction, Budget, BudgetItem, InventoryItem } from '../types';
import { generateProofImage, ProofTxData } from './proofImageGenerator';

/**
 * GENERATOR DATA REALISTIS DARI 1 JANUARI HINGGA HARI INI (REALTIME)
 * Menghasilkan data keuangan realistis, konsisten & seimbang untuk:
 * 1. Pribadi & Rumah Tangga (Keluarga Mandiri Sejahtera)
 * 2. Kuliner & Kafe (Kopi Senja Nusantara & Eatery - F&B)
 * 3. Toko Retail & Sembako (Minimarket & Toko Sembako Berkah Jaya)
 * 4. Bengkel, Jasa & Servis (Bengkel Mobil & Motor AutoCare)
 * 5. Kontraktor & Proyek (PT Cipta Sarana Bangun Persada)
 * 6. Agensi Digital & IT (Nusantara Creative & Digital Labs)
 *
 * FITUR UNGGULAN:
 * - Transaksi dibatasi HANYA dari 1 Januari sampai HARI INI (today).
 * - Tanggal di Beranda dan Transaksi selalu sinkron dan terupdate otomatis.
 * - Setiap transaksi menyertakan bukti input lengkap:
 *   a) 'receipt' (Struk Kasir/Belanja AI Scan)
 *   b) 'statement' (Screenshot M-Banking / Mutasi Bank & QRIS)
 *   c) 'voice' (Form Pengisian Suara / Audio Voice Input)
 *   d) 'handwritten' (Catatan Tulisan Tangan OCR)
 *   e) 'manual' (Formulir Pengisian Manual Resmi)
 */

export const ANNUAL_SAMPLE_ACCOUNTS: Account[] = [
  // AKUN PRIBADI
  {
    id: 'acc_cash_utama',
    name: 'Kas Kontan (Dompet Pribadi)',
    type: 'cash',
    scope: 'personal',
    opening_balance: 3500000,
    current_balance: 3500000,
    is_active: true,
  },
  {
    id: 'acc_bank_a',
    name: 'Bank BCA (Tabungan & Gaji Pribadi)',
    type: 'bank',
    scope: 'personal',
    opening_balance: 25000000,
    current_balance: 25000000,
    account_number: '8820-192-881',
    is_active: true,
  },
  {
    id: 'acc_ewallet_qris',
    name: 'E-Wallet (GoPay & OVO Pribadi)',
    type: 'ewallet',
    scope: 'personal',
    opening_balance: 1250000,
    current_balance: 1250000,
    is_active: true,
  },

  // AKUN BISNIS F&B: KOPI SENJA & EATERY
  {
    id: 'acc_fnb_bank',
    name: 'Bank Mandiri Bisnis (Kopi Senja)',
    type: 'bank',
    scope: 'business',
    business_name: 'Kopi Senja Nusantara & Eatery',
    opening_balance: 45000000,
    current_balance: 45000000,
    account_number: '137-00-9988123-1',
    is_active: true,
  },
  {
    id: 'acc_fnb_qris',
    name: 'QRIS & EDC Kasir Bar (Kopi Senja)',
    type: 'ewallet',
    scope: 'business',
    business_name: 'Kopi Senja Nusantara & Eatery',
    opening_balance: 8500000,
    current_balance: 8500000,
    is_active: true,
  },

  // AKUN BISNIS RETAIL: TOKO BERKAH JAYA
  {
    id: 'acc_retail_bank',
    name: 'Bank BCA Bisnis (Berkah Jaya Mart)',
    type: 'bank',
    scope: 'business',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    opening_balance: 55000000,
    current_balance: 55000000,
    account_number: '522-098-7711',
    is_active: true,
  },
  {
    id: 'acc_retail_cash',
    name: 'Kas Laci Kasir Toko Sembako',
    type: 'cash',
    scope: 'business',
    business_name: 'Minimarket & Toko Sembako Berkah Jaya',
    opening_balance: 5000000,
    current_balance: 5000000,
    is_active: true,
  },

  // AKUN BISNIS BENGKEL: AUTOCARE SERVICE
  {
    id: 'acc_workshop_bank',
    name: 'Bank BNI Bisnis (AutoCare Workshop)',
    type: 'bank',
    scope: 'business',
    business_name: 'Bengkel Mobil & Motor AutoCare',
    opening_balance: 38000000,
    current_balance: 38000000,
    account_number: '034-112-9901',
    is_active: true,
  },

  // AKUN BISNIS LAUNDRY: LAUNDRY KILAT BERSIH WANGI
  {
    id: 'acc_laundry_bank',
    name: 'Bank BRI Bisnis (Laundry Bersih Wangi)',
    type: 'bank',
    scope: 'business',
    business_name: 'Laundry Kilat Bersih Wangi',
    opening_balance: 24000000,
    current_balance: 24000000,
    account_number: '0120-01-009988-50-2',
    is_active: true,
  },
  {
    id: 'acc_laundry_cash',
    name: 'Kas Laci Kasir Laundry Kiloan',
    type: 'cash',
    scope: 'business',
    business_name: 'Laundry Kilat Bersih Wangi',
    opening_balance: 2500000,
    current_balance: 2500000,
    is_active: true,
  },

  // AKUN BISNIS FASHION & KONVEKSI: BUTIK BUSANA HARMONI
  {
    id: 'acc_fashion_bank',
    name: 'Bank BCA Bisnis (Butik Busana Harmoni)',
    type: 'bank',
    scope: 'business',
    business_name: 'Konveksi & Butik Busana Harmoni',
    opening_balance: 36000000,
    current_balance: 36000000,
    account_number: '880-123-4567',
    is_active: true,
  },
  {
    id: 'acc_fashion_qris',
    name: 'QRIS Butik Busana Harmoni',
    type: 'ewallet',
    scope: 'business',
    business_name: 'Konveksi & Butik Busana Harmoni',
    opening_balance: 4500000,
    current_balance: 4500000,
    is_active: true,
  },

  // AKUN BISNIS KONTRAKTOR: PT CIPTA SARANA
  {
    id: 'acc_contractor_bank',
    name: 'Bank Mandiri Giro Escrow (PT Cipta Sarana)',
    type: 'bank',
    scope: 'business',
    business_name: 'PT Cipta Sarana Bangun Persada',
    opening_balance: 280000000,
    current_balance: 280000000,
    account_number: '122-00-5544332-9',
    is_active: true,
  },

  // AKUN BISNIS AGENSI DIGITAL: NUSANTARA CREATIVE
  {
    id: 'acc_agency_bank',
    name: 'Bank CIMB Niaga Bisnis (Nusantara Creative)',
    type: 'bank',
    scope: 'business',
    business_name: 'Nusantara Creative & Digital Labs',
    opening_balance: 62000000,
    current_balance: 62000000,
    account_number: '705-11-22334-00',
    is_active: true,
  },
];

const MONTH_NAMES = [
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

export function generateAnnualSampleDataset(
  year = new Date().getFullYear(),
  targetDate: Date = new Date()
): {
  accounts: Account[];
  budgets: Budget[];
  budgetItems: BudgetItem[];
  transactions: Transaction[];
} {
  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];
  const budgetItems: BudgetItem[] = [];

  let txCounter = 1;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const now = targetDate instanceof Date ? targetDate : new Date();
  const effectiveYear = year || now.getFullYear();
  const maxMonth = now.getFullYear() === effectiveYear ? now.getMonth() : (now.getFullYear() > effectiveYear ? 11 : -1);
  const maxDay = now.getFullYear() === effectiveYear ? now.getDate() : 31;

  // Helper to add transaction only if within January 1st up to today
  const addTx = (tx: {
    amount: number;
    type: 'income' | 'expense';
    category_id: string;
    account_id: string;
    month: number; // 0-11
    day: number; // 1-31
    hour?: number;
    minute?: number;
    description: string;
    mode: 'personal' | 'business';
    source_type?: 'manual' | 'receipt' | 'statement' | 'handwritten' | 'voice';
    voice_transcript?: string;
    business_type?: string;
    business_name?: string;
    attachment_path?: string;
  }) => {
    // Check if month or day is in the future beyond today
    if (tx.month > maxMonth) return;
    if (tx.month === maxMonth && tx.day > maxDay) return;

    const monthNum = tx.month + 1;
    const h = pad(tx.hour ?? 9);
    const mi = pad(tx.minute ?? 0);
    const dateStr = `${effectiveYear}-${pad(monthNum)}-${pad(tx.day)}`;
    const isoStr = `${dateStr}T${h}:${mi}:00.000Z`;

    transactions.push({
      id: `tx_${effectiveYear}_${tx.mode}_${pad(monthNum)}_${pad(tx.day)}_${txCounter++}`,
      amount: tx.amount,
      type: tx.type,
      category_id: tx.category_id,
      account_id: tx.account_id,
      date: dateStr,
      description: tx.description,
      mode: tx.mode,
      source_type: tx.source_type || 'manual',
      voice_transcript: tx.voice_transcript,
      attachment_path: tx.attachment_path,
      business_type: tx.business_type,
      business_name: tx.business_name,
      created_at: isoStr,
      updated_at: isoStr,
    });
  };

  // Helper to generate realistic natural variance with non-repetitive organic values
  const varyAmount = (baseAmount: number, varianceFactor: number = 0.15, seedModifier: number = 0): number => {
    const sinVal = Math.sin(seedModifier * 13.371 + 1.234);
    const cosVal = Math.cos(seedModifier * 7.429 + 0.567);
    const factor = 1 + ((sinVal * 0.7 + cosVal * 0.3) * varianceFactor);
    const raw = Math.round(baseAmount * factor);
    // Round to realistic units: >= 10M to nearest 25k/50k, < 10M to nearest 10k/25k, < 1M to nearest 5k
    if (raw >= 10000000) {
      return Math.round(raw / 25000) * 25000;
    } else if (raw >= 1000000) {
      return Math.round(raw / 10000) * 10000;
    } else {
      return Math.round(raw / 5000) * 5000;
    }
  };

  // =========================================================================
  // 1. ANGGARAN & REALISASI PRIBADI (KELUARGA MANDIRI SEJAHTERA)
  // =========================================================================
  const persMonthlyIncomeTargets = [
    15200000, 15600000, 16400000, 28500000, 15800000, 16200000, 17500000, 15900000, 15400000, 16100000, 16800000, 24000000
  ];
  const persMonthlyExpenseTargets = [
    12200000, 12500000, 13100000, 22000000, 12600000, 12900000, 14000000, 12700000, 12300000, 12800000, 13400000, 18500000
  ];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;

    const budgetId = `bdg_pers_${effectiveYear}_${pad(monthNum)}`;
    const plannedIncome = persMonthlyIncomeTargets[m];
    const plannedExpense = persMonthlyExpenseTargets[m];

    budgets.push({
      id: budgetId,
      name: `Anggaran Pribadi & Keluarga - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: plannedIncome,
      total_planned_amount: plannedExpense,
      mode: 'personal',
      description: `Rencana anggaran kebutuhan keluarga dan rumah tangga bulan ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const pItems = [
      { cat: 'cat_inc_1', name: 'Gaji Pokok Suami & Istri', amt: m === 3 ? 14700000 : 12700000 },
      { cat: 'cat_inc_2', name: 'Penjualan Toko Online Istri', amt: m === 3 ? 2800000 : 1800000 },
      { cat: 'cat_inc_3', name: 'Freelance & Tunjangan Lembur', amt: m === 3 ? 11000000 : Math.max(1000000, plannedIncome - 14500000) },
      { cat: 'cat_exp_1', name: 'Makanan & Belanja Sembako Mingguan', amt: m === 3 ? 4500000 : 3500000 },
      { cat: 'cat_exp_2', name: 'Bensin & Transportasi Harian', amt: 900000 },
      { cat: 'cat_exp_3', name: 'Kebutuhan Rumah Tangga & Sandang', amt: m === 3 ? 3500000 : 1200000 },
      { cat: 'cat_exp_4', name: 'Tagihan Listrik PLN, PDAM & WiFi Indihome', amt: 1250000 },
      { cat: 'cat_exp_5', name: 'BPJS Kesehatan & Vitamin Keluarga', amt: 550000 },
      { cat: 'cat_exp_6', name: 'SPP Sekolah & Les Anak', amt: 1500000 },
      { cat: 'cat_exp_7', name: 'Hiburan Akhir Pekan & Makan Luar', amt: m === 3 ? 2500000 : 1000000 },
      { cat: 'cat_exp_hutang', name: 'Cicilan KPR / Rumah Tinggal', amt: 2500000 },
      { cat: 'cat_exp_13', name: 'Sedekah Rutin & Tabungan Emas', amt: m === 3 ? 4800000 : 1000000 },
    ];

    pItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_pers_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_4' || it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-10`,
        reminder_note: `Jatuh tempo pembayaran ${it.name}`,
        reminder_status: 'pending',
      });
    });

    // Realisasi Pemasukan Pribadi (Tgl 01, 10, 15, 20)
    addTx({
      amount: varyAmount(8500000, 0.04, m * 7 + 1),
      type: 'income',
      category_id: 'cat_inc_1',
      account_id: 'acc_bank_a',
      month: m,
      day: 1,
      hour: 8,
      minute: 0,
      description: `Penerimaan Gaji Pokok & Tunjangan Suami - ${monthName}`,
      mode: 'personal',
      source_type: 'statement',
    });

    addTx({
      amount: varyAmount(4200000, 0.05, m * 7 + 2),
      type: 'income',
      category_id: 'cat_inc_1',
      account_id: 'acc_bank_a',
      month: m,
      day: 1,
      hour: 8,
      minute: 30,
      description: `Penghasilan Gaji Istri (Pengajar / Guru)`,
      mode: 'personal',
      source_type: 'statement',
    });

    addTx({
      amount: varyAmount(1850000, 0.28, m * 7 + 3),
      type: 'income',
      category_id: 'cat_inc_3',
      account_id: 'acc_bank_a',
      month: m,
      day: 15,
      hour: 14,
      minute: 0,
      description: `Tunjangan Lembur & Bonus Kinerja Suami`,
      mode: 'personal',
      source_type: 'statement',
    });

    addTx({
      amount: varyAmount(2200000, 0.32, m * 7 + 4),
      type: 'income',
      category_id: 'cat_inc_3',
      account_id: 'acc_bank_a',
      month: m,
      day: 20,
      hour: 16,
      minute: 0,
      description: `Honor Proyek Freelance Konsultasi & Desain`,
      mode: 'personal',
      source_type: 'statement',
    });

    const olshopWeeklyBases = [420000, 580000, 390000, 650000];
    [7, 14, 21, 28].forEach((day, idx) => {
      addTx({
        amount: varyAmount(olshopWeeklyBases[idx], 0.25, m * 9 + idx * 3 + 1),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_cash_utama',
        month: m,
        day,
        hour: 19,
        minute: 0,
        description: `Keuntungan Mingguan Penjualan Toko Online Istri (Minggu ${idx + 1})`,
        mode: 'personal',
        source_type: 'receipt',
      });
    });

    if (m === 3) {
      addTx({
        amount: 12500000,
        type: 'income',
        category_id: 'cat_inc_4',
        account_id: 'acc_bank_a',
        month: m,
        day: 8,
        hour: 10,
        minute: 0,
        description: `Tunjangan Hari Raya (THR) Perusahaan`,
        mode: 'personal',
        source_type: 'statement',
      });
    }

    // Pengeluaran Pribadi (Realisasi Alami ~90-95% Anggaran dengan Variasi Wajar)
    // cat_exp_1: Makanan & Sembako (Planned 3.500.000 / M3: 4.500.000)
    const baseGroceryWeek = m === 3 ? 1125000 : 875000;
    const groceryDays = [2, 9, 16, 23];
    groceryDays.forEach((day, idx) => {
      const src = idx === 1 ? 'voice' : idx === 3 ? 'receipt' : 'receipt';
      const actualGrocery = varyAmount(baseGroceryWeek, 0.08, m * 4 + idx);
      addTx({
        amount: actualGrocery,
        type: 'expense',
        category_id: 'cat_exp_1',
        account_id: 'acc_cash_utama',
        month: m,
        day,
        hour: 9,
        minute: 30,
        description: `Belanja Sembako Mingguan, Beras, Telur & Daging`,
        mode: 'personal',
        source_type: src,
        voice_transcript: src === 'voice' ? `Beli beras ramos telur ayam dan minyak goreng pasar ${actualGrocery.toLocaleString('id-ID')} bayar cash` : undefined,
      });
    });

    // cat_exp_2: Bensin (Planned 900.000)
    const fuelDays = [5, 12, 19, 26];
    fuelDays.forEach((day, idx) => {
      const src = idx === 0 ? 'voice' : 'receipt';
      const actualFuel = varyAmount(225000, 0.06, m * 4 + idx + 1);
      addTx({
        amount: actualFuel,
        type: 'expense',
        category_id: 'cat_exp_2',
        account_id: 'acc_ewallet_qris',
        month: m,
        day,
        hour: 7,
        minute: 45,
        description: `Isi Bensin Pertamax Mobil & Motor Keluarga`,
        mode: 'personal',
        source_type: src,
        voice_transcript: src === 'voice' ? `Beli pertamax spbu pertamina ${actualFuel.toLocaleString('id-ID')} qris gopay` : undefined,
      });
    });

    // cat_exp_3: Belanja Rumah Tangga (Planned 1.200.000 / M3: 3.500.000)
    const actualHousehold = varyAmount(m === 3 ? 3500000 : 1200000, 0.08, m * 3 + 1);
    addTx({
      amount: actualHousehold,
      type: 'expense',
      category_id: 'cat_exp_3',
      account_id: 'acc_ewallet_qris',
      month: m,
      day: 15,
      hour: 15,
      minute: 0,
      description: `Beli Perlengkapan Mandi, Sabun Cuci & Peralatan Dapur`,
      mode: 'personal',
      source_type: 'receipt',
    });

    // cat_exp_4: Listrik PLN, PDAM & WiFi (Planned 1.250.000)
    const actualUtilities = varyAmount(1250000, 0.06, m * 3 + 2);
    addTx({
      amount: actualUtilities,
      type: 'expense',
      category_id: 'cat_exp_4',
      account_id: 'acc_bank_a',
      month: m,
      day: 7,
      hour: 11,
      minute: 0,
      description: `Pembayaran Tagihan Listrik PLN, PDAM & WiFi Rumah`,
      mode: 'personal',
      source_type: 'statement',
    });

    // cat_exp_5: BPJS Kesehatan & Vitamin (Planned 550.000)
    const actualHealth = varyAmount(550000, 0.05, m * 3 + 3);
    addTx({
      amount: actualHealth,
      type: 'expense',
      category_id: 'cat_exp_5',
      account_id: 'acc_bank_a',
      month: m,
      day: 12,
      hour: 9,
      minute: 0,
      description: `Iuran BPJS Kesehatan 4 Anggota Keluarga & Suplemen`,
      mode: 'personal',
      source_type: 'statement',
    });

    // cat_exp_6: SPP Sekolah & Les (Planned 1.500.000)
    addTx({
      amount: 1500000,
      type: 'expense',
      category_id: 'cat_exp_6',
      account_id: 'acc_bank_a',
      month: m,
      day: 11,
      hour: 8,
      minute: 30,
      description: `SPP Bulanan Sekolah & Buku Anak`,
      mode: 'personal',
      source_type: 'manual',
    });

    // cat_exp_7: Hiburan & Makan Luar (Planned 1.000.000 / M3: 2.500.000)
    const actualEntertainment = varyAmount(m === 3 ? 2500000 : 1000000, 0.10, m * 3 + 4);
    addTx({
      amount: actualEntertainment,
      type: 'expense',
      category_id: 'cat_exp_7',
      account_id: 'acc_ewallet_qris',
      month: m,
      day: 20,
      hour: 19,
      minute: 30,
      description: `Makan Bersama Keluarga & Hiburan Akhir Pekan`,
      mode: 'personal',
      source_type: 'receipt',
    });

    // cat_exp_hutang: Cicilan KPR (Planned 2.500.000)
    addTx({
      amount: 2500000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_bank_a',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Autodebet Cicilan KPR Bank BTN`,
      mode: 'personal',
      source_type: 'statement',
    });

    // cat_exp_13: Sedekah & Tabungan Emas (Planned 1.000.000 / M3: 4.800.000)
    const actualCharity = varyAmount(m === 3 ? 4800000 : 1000000, 0.08, m * 3 + 5);
    addTx({
      amount: actualCharity,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_bank_a',
      month: m,
      day: 25,
      hour: 10,
      minute: 0,
      description: `Sedekah Yatim/Masjid & Pembelian Tabungan Emas`,
      mode: 'personal',
      source_type: 'manual',
    });
  }

  // =========================================================================
  // 2. KULINER & F&B: KOPI SENJA NUSANTARA & EATERY
  // =========================================================================
  const fnbBusinessName = 'Kopi Senja Nusantara & Eatery';
  const fnbSeasonalMultiplier = [0.91, 0.94, 1.05, 1.31, 0.98, 1.06, 1.14, 1.02, 0.96, 1.00, 1.09, 1.36];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = fnbSeasonalMultiplier[m];

    const budgetId = `bdg_fnb_${effectiveYear}_${pad(monthNum)}`;
    const baseTargetRevenue = Math.round(90000000 * mult);
    const baseCogs = Math.round(34000000 * mult);
    const baseOpex = 28500000;
    const baseDebt = 2500000;
    const basePrive = Math.round(18000000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Kafe & F&B - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: baseTargetRevenue,
      total_planned_amount: baseCogs + baseOpex + baseDebt + basePrive,
      mode: 'business',
      business_type: 'fnb_culinary',
      template_id: 'fnb_culinary',
      business_name: fnbBusinessName,
      description: `Rencana operasional dan proforma laba rugi Kafe Kopi Senja bulan ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const fItems = [
      { cat: 'cat_inc_2', name: 'Target Omzet Penjualan Kafe & Eatery', amt: baseTargetRevenue },
      { cat: 'cat_exp_8', name: 'HPP Biji Kopi Sangrai, Susu & Sirup Flavour', amt: Math.round(22000000 * mult) },
      { cat: 'cat_exp_8', name: 'HPP Bahan Makanan & Kitchen Dapur', amt: Math.round(9000000 * mult) },
      { cat: 'cat_exp_8', name: 'Cup Logo, Straw, Dus Takeaway & Paper Bag', amt: Math.round(3000000 * mult) },
      { cat: 'cat_exp_9', name: 'Gaji Barista, Cook & Staf Service (6 Karyawan)', amt: 18000000 },
      { cat: 'cat_exp_10', name: 'Alokasi Biaya Sewa Tempat Kafe 2 Lantai', amt: 5000000 },
      { cat: 'cat_exp_11', name: 'Tagihan Listrik PLN 3200VA, Gas LPG & WiFi', amt: 3500000 },
      { cat: 'cat_exp_12', name: 'Promosi Instagram Ads, TikTok & Voucher GrabFood', amt: 2000000 },
      { cat: 'cat_exp_hutang', name: 'Angsuran Kredit Mesin Espresso & Modal Kerja', amt: 2500000 },
      { cat: 'cat_exp_13', name: 'Prive Dividen Pemilik Kafe', amt: basePrive },
    ];

    fItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_fnb_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_10' || it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-15`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    // Pemasukan Kafe F&B Mingguan (Variasi dinamis realistis)
    const fnbWeeklyWeights = [0.23, 0.27, 0.22, 0.28];
    [7, 14, 21, 28].forEach((day, idx) => {
      const weekBase = baseTargetRevenue * fnbWeeklyWeights[idx];
      addTx({
        amount: varyAmount(weekBase * 0.65, 0.16, m * 12 + idx * 2 + 1),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_fnb_qris',
        month: m,
        day,
        hour: 22,
        minute: 0,
        description: `Rekap Penjualan Kopi, Minuman & Kitchen QRIS Kasir (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'fnb_culinary',
        business_name: fnbBusinessName,
      });

      addTx({
        amount: varyAmount(weekBase * 0.35, 0.20, m * 12 + idx * 2 + 2),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_fnb_bank',
        month: m,
        day,
        hour: 22,
        minute: 30,
        description: `Pencairan Settlement GrabFood & GoFood Mitra Kafe (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'fnb_culinary',
        business_name: fnbBusinessName,
      });
    });

    // Pengeluaran HPP Bahan Baku Kafe (Variasi Alami 90-95% Anggaran)
    const weeklyCogs = Math.round(baseCogs / 4);
    [2, 9, 16, 23].forEach((day, idx) => {
      const src = idx === 1 ? 'voice' : 'receipt';
      const actualCogs = varyAmount(weeklyCogs, 0.07, m * 4 + idx + 2);
      addTx({
        amount: actualCogs,
        type: 'expense',
        category_id: 'cat_exp_8',
        account_id: 'acc_fnb_bank',
        month: m,
        day,
        hour: 10,
        minute: 0,
        description: `Restok Biji Kopi Gayo, Susu Pasteurisasi Barista & Bahan Kitchen`,
        mode: 'business',
        source_type: src,
        voice_transcript: src === 'voice' ? `Restok biji kopi arabika gayo dan susu segar pasteurisasi barista katering total ${actualCogs.toLocaleString('id-ID')} via transfer mandiri` : undefined,
        business_type: 'fnb_culinary',
        business_name: fnbBusinessName,
      });
    });

    addTx({
      amount: 5000000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 5,
      hour: 9,
      minute: 0,
      description: `Alokasi Biaya Sewa Bangunan Ruko Kafe Bulanan`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });

    addTx({
      amount: 2500000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Cicilan Angsuran Kredit Usaha Mesin Espresso Nuova Simonelli`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });

    const actualFnbUtilities = varyAmount(3500000, 0.08, m * 3 + 7);
    addTx({
      amount: actualFnbUtilities,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 18,
      hour: 11,
      minute: 0,
      description: `Tagihan Listrik PLN 3200 VA (Mesin Espresso) & WiFi Kafe`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });

    const actualFnbPromo = varyAmount(2000000, 0.10, m * 3 + 8);
    addTx({
      amount: actualFnbPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 22,
      hour: 14,
      minute: 0,
      description: `Promosi Instagram Ads, TikTok & Voucher GrabFood/GoFood`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });

    addTx({
      amount: 18000000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 28,
      hour: 16,
      minute: 0,
      description: `Payroll Gaji 4 Barista & 2 Kitchen Crew`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });

    const actualFnbPrive = varyAmount(basePrive, 0.08, m * 3 + 9);
    addTx({
      amount: actualFnbPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_fnb_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive / Penarikan Laba Bersih Operasional Pemilik Kafe`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'fnb_culinary',
      business_name: fnbBusinessName,
    });
  }

  // =========================================================================
  // 3. TOKO RETAIL: MINIMARKET & TOKO SEMBAKO BERKAH JAYA
  // =========================================================================
  const retBusinessName = 'Minimarket & Toko Sembako Berkah Jaya';
  const retSeasonalMultiplier = [0.95, 0.95, 1.1, 1.4, 1.05, 1.0, 1.05, 1.0, 0.98, 1.02, 1.08, 1.25];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = retSeasonalMultiplier[m];

    const budgetId = `bdg_ret_${effectiveYear}_${pad(monthNum)}`;
    const baseTargetRevenue = Math.round(110000000 * mult);
    const baseCogs = Math.round(76000000 * mult);
    const baseOpex = 19500000;
    const baseDebt = 2000000;
    const basePrive = Math.round(14000000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Toko Retail & Sembako - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: baseTargetRevenue,
      total_planned_amount: baseCogs + baseOpex + baseDebt + basePrive,
      mode: 'business',
      business_type: 'retail_shop',
      template_id: 'retail_shop',
      business_name: retBusinessName,
      description: `Rencana operasional dan kulakan toko sembako bulan ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const rItems = [
      { cat: 'cat_inc_2', name: 'Target Omzet Penjualan Toko & Grosir Sembako', amt: baseTargetRevenue },
      { cat: 'cat_exp_8', name: 'Kulakan Beras, Minyak Goreng, Gula Pasir & Tepung', amt: Math.round(48000000 * mult) },
      { cat: 'cat_exp_8', name: 'Restok Barang FMCG Sabun, Shampo, Susu & Mie Instan', amt: Math.round(24000000 * mult) },
      { cat: 'cat_exp_8', name: 'Restok Minuman Dingin Chiller & Kantong Kresek', amt: Math.round(4000000 * mult) },
      { cat: 'cat_exp_9', name: 'Gaji 4 Staf Kasir & Gudang Sistem 2 Shift', amt: 11000000 },
      { cat: 'cat_exp_10', name: 'Sewa Ruko Toko 2 Pintu', amt: 4000000 },
      { cat: 'cat_exp_11', name: 'Listrik PLN 24 Jam (Chiller & Showcase) & POS', amt: 3500000 },
      { cat: 'cat_exp_12', name: 'Banner Promo Bulanan & Diskon Sembako', amt: 1000000 },
      { cat: 'cat_exp_hutang', name: 'Cicilan Pinjaman KUR BRI Modal Kerja', amt: 2000000 },
      { cat: 'cat_exp_13', name: 'Prive Pemilik Toko Sembako', amt: basePrive },
    ];

    rItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_ret_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_10' || it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-10`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    const retWeeklyWeights = [0.24, 0.27, 0.22, 0.27];
    [7, 14, 21, 28].forEach((day, idx) => {
      const weekBase = baseTargetRevenue * retWeeklyWeights[idx];
      addTx({
        amount: varyAmount(weekBase * 0.70, 0.15, m * 14 + idx * 2 + 1),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_retail_cash',
        month: m,
        day,
        hour: 21,
        minute: 30,
        description: `Omzet Kasir Shift Pagi & Malam Toko Sembako (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'receipt',
        business_type: 'retail_shop',
        business_name: retBusinessName,
      });

      addTx({
        amount: varyAmount(weekBase * 0.30, 0.18, m * 14 + idx * 2 + 2),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_retail_bank',
        month: m,
        day,
        hour: 21,
        minute: 45,
        description: `Penjualan Grosir B2B Warung Mitra & QRIS (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'retail_shop',
        business_name: retBusinessName,
      });
    });

    const weeklyCogs = Math.round(baseCogs / 4);
    [3, 10, 17, 24].forEach((day, idx) => {
      const src = idx === 0 ? 'voice' : 'receipt';
      const actualRetailCogs = varyAmount(weeklyCogs, 0.07, m * 4 + idx + 3);
      addTx({
        amount: actualRetailCogs,
        type: 'expense',
        category_id: 'cat_exp_8',
        account_id: 'acc_retail_bank',
        month: m,
        day,
        hour: 11,
        minute: 0,
        description: `Kulakan Sembako & Barang FMCG dari Distributor Resmi`,
        mode: 'business',
        source_type: src,
        voice_transcript: src === 'voice' ? `Kulakan beras ramos 20 karung minyak goreng 10 dus dan gula pasir dari distributor sembako via bca senilai ${actualRetailCogs.toLocaleString('id-ID')}` : undefined,
        business_type: 'retail_shop',
        business_name: retBusinessName,
      });
    });

    addTx({
      amount: 4000000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_retail_bank',
      month: m,
      day: 2,
      hour: 9,
      minute: 0,
      description: `Alokasi Biaya Sewa Ruko Toko Bulanan`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });

    addTx({
      amount: 2000000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_retail_bank',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Cicilan Pinjaman Modal Kerja KUR BRI Toko`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });

    const actualRetailUtilities = varyAmount(3500000, 0.08, m * 3 + 1);
    addTx({
      amount: actualRetailUtilities,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_retail_bank',
      month: m,
      day: 20,
      hour: 11,
      minute: 0,
      description: `Tagihan Listrik PLN (Showcase & Chiller 24 Jam) & Aplikasi POS`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });

    const actualRetailPromo = varyAmount(1000000, 0.10, m * 3 + 2);
    addTx({
      amount: actualRetailPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_retail_bank',
      month: m,
      day: 22,
      hour: 13,
      minute: 0,
      description: `Banner Promo Bulanan & Diskon Sembako Toko`,
      mode: 'business',
      source_type: 'receipt',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });

    addTx({
      amount: 11000000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_retail_bank',
      month: m,
      day: 28,
      hour: 16,
      minute: 0,
      description: `Gaji 4 Karyawan Toko & Kasir Shift`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });

    const actualRetailPrive = varyAmount(basePrive, 0.08, m * 3 + 3);
    addTx({
      amount: actualRetailPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_retail_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive / Penarikan Laba Pemilik Toko Sembako`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'retail_shop',
      business_name: retBusinessName,
    });
  }

  // =========================================================================
  // 4. BENGKEL OTOMOTIF: BENGKEL MOBIL & MOTOR AUTOCARE
  // =========================================================================
  const wksBusinessName = 'Bengkel Mobil & Motor AutoCare';
  const wksSeasonalMultiplier = [0.90, 0.95, 1.11, 1.32, 0.97, 1.02, 1.09, 1.03, 0.95, 1.00, 1.08, 1.29];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = wksSeasonalMultiplier[m];

    const budgetId = `bdg_wks_${effectiveYear}_${pad(monthNum)}`;
    const targetRev = Math.round(65000000 * mult);
    const cogs = Math.round(26000000 * mult);
    const opex = 18500000;
    const debt = 1800000;
    const prive = Math.round(15000000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Bengkel & Servis - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: targetRev,
      total_planned_amount: cogs + opex + debt + prive,
      mode: 'business',
      business_type: 'workshop_service',
      template_id: 'workshop_service',
      business_name: wksBusinessName,
      description: `Rencana operasional bengkel servis dan penjualan sparepart ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const wItems = [
      { cat: 'cat_inc_2', name: 'Target Omzet Jasa Servis & Sparepart Bengkel', amt: targetRev },
      { cat: 'cat_exp_8', name: 'Stok Oli Mesin (Shell, Pertamina, Motul) & Oli Transmisi', amt: Math.round(16000000 * mult) },
      { cat: 'cat_exp_8', name: 'Stok Sparepart Fast Moving (Kampas Rem, Busi, Filter, Ban)', amt: Math.round(10000000 * mult) },
      { cat: 'cat_exp_9', name: 'Gaji Pokok & Bagi Hasil 3 Mekanik + 1 Admin', amt: 12000000 },
      { cat: 'cat_exp_10', name: 'Sewa Lahan Workshop & Tempat Cuci', amt: 3500000 },
      { cat: 'cat_exp_11', name: 'Listrik Kompresor 3 HP, Air PDAM & Alat Bengkel', amt: 2500000 },
      { cat: 'cat_exp_12', name: 'Promosi Tune-Up & Spanduk Servis Gratis', amt: 500000 },
      { cat: 'cat_exp_hutang', name: 'Cicilan Kredit Alat Tyre Changer & Bike Lift', amt: 1800000 },
      { cat: 'cat_exp_13', name: 'Prive Bagi Hasil Pemilik Bengkel', amt: prive },
    ];

    wItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_wks_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-10`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    const wksWeeklyWeights = [0.23, 0.28, 0.22, 0.27];
    [7, 14, 21, 28].forEach((day, idx) => {
      const weekBase = targetRev * wksWeeklyWeights[idx];
      addTx({
        amount: varyAmount(weekBase, 0.15, m * 15 + idx * 3 + 1),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_workshop_bank',
        month: m,
        day,
        hour: 17,
        minute: 30,
        description: `Penerimaan Jasa Servis, Tune-Up, Ganti Oli & Sparepart (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'workshop_service',
        business_name: wksBusinessName,
      });
    });

    [4, 18].forEach((day, idx) => {
      const src = idx === 0 ? 'receipt' : 'voice';
      const actualWksCogs = varyAmount(cogs / 2, 0.07, m * 2 + idx + 4);
      addTx({
        amount: actualWksCogs,
        type: 'expense',
        category_id: 'cat_exp_8',
        account_id: 'acc_workshop_bank',
        month: m,
        day,
        hour: 11,
        minute: 0,
        description: `Stok Drum Oli Pertamina/Shell, Filter Oli & Sparepart Fast Moving`,
        mode: 'business',
        source_type: src,
        voice_transcript: src === 'voice' ? `Kulakan oli mesin dan filter sparepart bengkel ${actualWksCogs.toLocaleString('id-ID')} transfer mandiri` : undefined,
        business_type: 'workshop_service',
        business_name: wksBusinessName,
      });
    });

    addTx({
      amount: 3500000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 5,
      hour: 9,
      minute: 0,
      description: `Sewa Lahan Workshop & Tempat Cuci Bengkel`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });

    const actualWksUtilities = varyAmount(2500000, 0.08, m * 2 + 1);
    addTx({
      amount: actualWksUtilities,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 12,
      hour: 11,
      minute: 0,
      description: `Listrik Kompresor 3 HP, Air PDAM & Alat Bengkel`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });

    const actualWksPromo = varyAmount(500000, 0.10, m * 2 + 2);
    addTx({
      amount: actualWksPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 15,
      hour: 14,
      minute: 0,
      description: `Promosi Tune-Up & Spanduk Servis Berkala`,
      mode: 'business',
      source_type: 'receipt',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });

    addTx({
      amount: 1800000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Cicilan Kredit Alat Tyre Changer & Bike Lift`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });

    addTx({
      amount: 12000000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 28,
      hour: 17,
      minute: 0,
      description: `Gaji Pokok & Bagi Hasil 3 Mekanik + 1 Admin Bengkel`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });

    const actualWksPrive = varyAmount(prive, 0.08, m * 2 + 3);
    addTx({
      amount: actualWksPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_workshop_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive / Bagi Hasil Laba Pemilik Bengkel AutoCare`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'workshop_service',
      business_name: wksBusinessName,
    });
  }

  // =========================================================================
  // 5. BISNIS D: LAUNDRY KILAT BERSIH WANGI
  // =========================================================================
  const ldyBusinessName = 'Laundry Kilat Bersih Wangi';
  const ldySeasonalMultiplier = [0.90, 0.96, 1.01, 1.26, 0.99, 1.05, 1.14, 1.05, 0.95, 1.01, 1.11, 1.24];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = ldySeasonalMultiplier[m];

    const budgetId = `bdg_ldy_${effectiveYear}_${pad(monthNum)}`;
    const targetRev = Math.round(38000000 * mult);
    const cogs = Math.round(6500000 * mult);
    const opex = 18700000;
    const debt = 1800000;
    const prive = Math.round(11000000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Laundry & Dry Clean - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: targetRev,
      total_planned_amount: cogs + opex + debt + prive,
      mode: 'business',
      business_type: 'laundry_service',
      template_id: 'laundry_service',
      business_name: ldyBusinessName,
      description: `Rencana operasional deterjen, chemical laundry, listrik, karyawan & cicilan mesin ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const lItems = [
      { cat: 'cat_inc_2', name: 'Target Omzet Cucian Kiloan & Dry Clean', amt: targetRev },
      { cat: 'cat_exp_8', name: 'Deterjen Liquid Matic Premium, Softener & Parfum Laundry', amt: Math.round(4500000 * mult) },
      { cat: 'cat_exp_8', name: 'Plastik Packing Jinjing Laundry, Hanger & Tag Label Nomor', amt: Math.round(2000000 * mult) },
      { cat: 'cat_exp_9', name: 'Gaji 2 Karyawan Cuci, Pengeringan, Packing & Kasir', amt: 5200000 },
      { cat: 'cat_exp_10', name: 'Sewa Kios Usaha Laundry Strategis', amt: 2500000 },
      { cat: 'cat_exp_11', name: 'Listrik Mesin Cuci Komersial, Air PDAM & Gas Tabung Boiler', amt: 4500000 },
      { cat: 'cat_exp_11', name: 'Bensin Motor Kurir Antar Jemput Laundry Pelanggan', amt: 1200000 },
      { cat: 'cat_exp_12', name: 'Brosur Promo, Kupon Diskon Member & Spanduk Cuci Kilat', amt: 1500000 },
      { cat: 'cat_exp_hutang', name: 'Cicilan Mesin Dryer Pengering Maytag Gas Komersial', amt: 1800000 },
      { cat: 'cat_exp_13', name: 'Prive Bagi Hasil Pemilik Laundry Bersih Wangi', amt: prive },
    ];

    lItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_ldy_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-10`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    const ldyWeeklyWeights = [0.24, 0.27, 0.22, 0.27];
    [7, 14, 21, 28].forEach((day, idx) => {
      const weekBase = targetRev * ldyWeeklyWeights[idx];
      addTx({
        amount: varyAmount(weekBase, 0.16, m * 16 + idx * 3 + 2),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: idx % 2 === 0 ? 'acc_laundry_cash' : 'acc_laundry_bank',
        month: m,
        day,
        hour: 18,
        minute: 0,
        description: `Penerimaan Ongkos Cuci Kiloan, Bedcover & Dry Clean Laundry (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'receipt',
        business_type: 'laundry_service',
        business_name: ldyBusinessName,
      });
    });

    // cat_exp_8: Chemical & Plastik (Planned 6.500.000)
    [3, 17].forEach((day, idx) => {
      const actualLdyCogs = varyAmount(cogs / 2, 0.07, m * 2 + idx + 5);
      addTx({
        amount: actualLdyCogs,
        type: 'expense',
        category_id: 'cat_exp_8',
        account_id: 'acc_laundry_bank',
        month: m,
        day,
        hour: 10,
        minute: 0,
        description: `Deterjen Liquid Matic 20L, Softener, Parfum Laundry & Plastik Packing`,
        mode: 'business',
        source_type: idx === 0 ? 'receipt' : 'voice',
        voice_transcript: idx === 1 ? `Beli deterjen cair matic softener parfum laundry dan plastik jinjing ${actualLdyCogs.toLocaleString('id-ID')} via bank` : undefined,
        business_type: 'laundry_service',
        business_name: ldyBusinessName,
      });
    });

    addTx({
      amount: 2500000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 5,
      hour: 9,
      minute: 0,
      description: `Sewa Kios Usaha Laundry Strategis`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    const actualLdyUtilities = varyAmount(4500000, 0.08, m * 2 + 1);
    addTx({
      amount: actualLdyUtilities,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 12,
      hour: 11,
      minute: 0,
      description: `Listrik Mesin Cuci Komersial, Air PDAM & Gas Tabung Boiler`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    const actualLdyFuel = varyAmount(1200000, 0.09, m * 2 + 2);
    addTx({
      amount: actualLdyFuel,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_laundry_cash',
      month: m,
      day: 15,
      hour: 16,
      minute: 0,
      description: `Bensin Motor Kurir Antar Jemput Laundry Pelanggan`,
      mode: 'business',
      source_type: 'voice',
      voice_transcript: `Operasional bensin motor kurir antar jemput pakaian laundry ${actualLdyFuel.toLocaleString('id-ID')} rupiah kas`,
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    const actualLdyPromo = varyAmount(1500000, 0.10, m * 2 + 3);
    addTx({
      amount: actualLdyPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 18,
      hour: 13,
      minute: 0,
      description: `Brosur Promo, Kupon Diskon Member & Spanduk Cuci Kilat`,
      mode: 'business',
      source_type: 'receipt',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    addTx({
      amount: 1800000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Cicilan Mesin Dryer Pengering Maytag Gas Komersial`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    addTx({
      amount: 5200000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 28,
      hour: 16,
      minute: 0,
      description: `Gaji 2 Karyawan Cuci, Pengeringan, Packing & Kasir Laundry`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });

    const actualLdyPrive = varyAmount(prive, 0.08, m * 2 + 4);
    addTx({
      amount: actualLdyPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_laundry_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive Bagi Hasil Pemilik Laundry Bersih Wangi`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'laundry_service',
      business_name: ldyBusinessName,
    });
  }

  // =========================================================================
  // 6. BISNIS E: KONVEKSI & BUTIK BUSANA HARMONI
  // =========================================================================
  const fshBusinessName = 'Konveksi & Butik Busana Harmoni';
  const fshSeasonalMultiplier = [0.85, 0.90, 1.32, 1.98, 0.92, 0.98, 1.11, 0.99, 0.88, 0.94, 1.08, 1.51];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = fshSeasonalMultiplier[m];

    const budgetId = `bdg_fsh_${effectiveYear}_${pad(monthNum)}`;
    const targetRev = Math.round(85000000 * mult);
    const cogs = Math.round(23000000 * mult);
    const opex = 19200000;
    const debt = 2000000;
    const prive = Math.round(18000000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Konveksi & Fashion - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: targetRev,
      total_planned_amount: cogs + opex + debt + prive,
      mode: 'business',
      business_type: 'fashion_clothing',
      template_id: 'fashion_clothing',
      business_name: fshBusinessName,
      description: `Rencana operasional produksi busana muslim, seragam kantor & butik ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const fItems = [
      { cat: 'cat_inc_2', name: 'Target Omzet Penjualan Butik & Busana Muslim', amt: targetRev },
      { cat: 'cat_exp_8', name: 'HPP Kain Katun Toyobo, Rayon Viscose & Sutra Premium', amt: Math.round(16000000 * mult) },
      { cat: 'cat_exp_8', name: 'Kancing, Resleting YKK, Benang Jahit & Label Bordir Custom', amt: Math.round(4500000 * mult) },
      { cat: 'cat_exp_8', name: 'Plastik Packing Zipper, Tag Hang Label & Goodie Bag', amt: Math.round(2500000 * mult) },
      { cat: 'cat_exp_9', name: 'Upah Jahit, Obras & Finishing 4 Penjahit Konveksi', amt: 10500000 },
      { cat: 'cat_exp_10', name: 'Sewa Butik & Workshop Jahit 2 Lantai', amt: 3500000 },
      { cat: 'cat_exp_11', name: 'Listrik Dinamo Mesin Jahit, Setrika Uap Boiler & WiFi', amt: 2200000 },
      { cat: 'cat_exp_12', name: 'Iklan Shopee Ads, TikTok Shop & Endorsement Influencer', amt: 3000000 },
      { cat: 'cat_exp_hutang', name: 'Cicilan Mesin Jahit Obras Digital & Mesin Cutting Kain', amt: 2000000 },
      { cat: 'cat_exp_13', name: 'Prive Bagi Hasil Pemilik Butik Busana Harmoni', amt: prive },
    ];

    fItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_fsh_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_hutang',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-15`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    const fshWeeklyWeights = [0.22, 0.28, 0.22, 0.28];
    [6, 13, 20, 27].forEach((day, idx) => {
      const weekBase = targetRev * fshWeeklyWeights[idx];
      addTx({
        amount: varyAmount(weekBase, 0.16, m * 17 + idx * 4 + 3),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: idx % 2 === 0 ? 'acc_fashion_qris' : 'acc_fashion_bank',
        month: m,
        day,
        hour: 16,
        minute: 0,
        description: `Penjualan Online Store Butik & PO Busana (Minggu ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'fashion_clothing',
        business_name: fshBusinessName,
      });
    });

    // cat_exp_8: Kain & Aksesoris (Planned 23.000.000)
    [4, 18].forEach((day, idx) => {
      const actualFshCogs = varyAmount(cogs / 2, 0.07, m * 2 + idx + 6);
      addTx({
        amount: actualFshCogs,
        type: 'expense',
        category_id: 'cat_exp_8',
        account_id: 'acc_fashion_bank',
        month: m,
        day,
        hour: 11,
        minute: 0,
        description: `Kain Katun Toyobo, Rayon Viscose, Kancing, Resleting YKK & Kemasan Butik`,
        mode: 'business',
        source_type: idx === 0 ? 'receipt' : 'voice',
        voice_transcript: idx === 1 ? `Kulakan bahan kain katun toyobo rayon kancing resleting jepang ${actualFshCogs.toLocaleString('id-ID')} via transfer bca` : undefined,
        business_type: 'fashion_clothing',
        business_name: fshBusinessName,
      });
    });

    addTx({
      amount: 3500000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 3,
      hour: 9,
      minute: 0,
      description: `Sewa Butik & Workshop Jahit 2 Lantai`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });

    const actualFshUtilities = varyAmount(2200000, 0.08, m * 2 + 1);
    addTx({
      amount: actualFshUtilities,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 12,
      hour: 11,
      minute: 0,
      description: `Listrik Dinamo Mesin Jahit, Setrika Uap Boiler & WiFi Butik`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });

    const actualFshPromo = varyAmount(3000000, 0.10, m * 2 + 2);
    addTx({
      amount: actualFshPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 16,
      hour: 14,
      minute: 0,
      description: `Iklan Shopee Ads, TikTok Shop & Endorsement Influencer`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });

    addTx({
      amount: 2000000,
      type: 'expense',
      category_id: 'cat_exp_hutang',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 10,
      hour: 10,
      minute: 0,
      description: `Cicilan Mesin Jahit Obras Digital & Mesin Cutting Kain`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });

    addTx({
      amount: 10500000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 28,
      hour: 16,
      minute: 0,
      description: `Upah Jahit, Obras & Finishing 4 Penjahit Konveksi`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });

    const actualFshPrive = varyAmount(prive, 0.08, m * 2 + 3);
    addTx({
      amount: actualFshPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_fashion_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive Bagi Hasil Pemilik Butik Busana Harmoni`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'fashion_clothing',
      business_name: fshBusinessName,
    });
  }

  // =========================================================================
  // 7. BISNIS F: KONTRAKTOR BANGUNAN (PT CIPTA SARANA BANGUN PERSADA)
  // =========================================================================
  const bldBusinessName = 'PT Cipta Sarana Bangun Persada';
  const bldSeasonalMultiplier = [0.88, 0.93, 1.15, 0.79, 1.07, 1.18, 1.32, 1.13, 1.00, 1.08, 1.21, 1.33];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = bldSeasonalMultiplier[m];

    const budgetId = `bdg_bld_${effectiveYear}_${pad(monthNum)}`;
    const targetRev = Math.round(120000000 * mult);
    const cogs = Math.round(56000000 * mult);
    const labor = 26000000;
    const opex = 14180000;
    const prive = Math.round(23820000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran Konstruksi & Proyek - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: targetRev,
      total_planned_amount: cogs + labor + opex + prive,
      mode: 'business',
      business_type: 'construction',
      template_id: 'construction',
      business_name: bldBusinessName,
      description: `Rencana anggaran pelaksanaan proyek fisik konstruksi & renovasi gedung ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const bItems = [
      { cat: 'cat_inc_2', name: 'Target Pendapatan Kontrak Proyek Konstruksi', amt: targetRev },
      { cat: 'cat_exp_8', name: 'HPP Ready Mix K-300, Besi Beton Ulir & Semen Holcim', amt: Math.round(38000000 * mult) },
      { cat: 'cat_exp_8', name: 'Bata Ringan Hebel, Mortar Plesteran & Pasir Cor Pasang', amt: Math.round(18000000 * mult) },
      { cat: 'cat_exp_9', name: 'Upah Borongan Mandor, Tukang Batu, Tukang Besi & Pekerja', amt: 26000000 },
      { cat: 'cat_exp_11', name: 'Sewa Alat Berat, Scaffolding 400 Set & Concrete Vibrator', amt: 7500000 },
      { cat: 'cat_exp_11', name: 'Pajak Proyek PPh Final Jasa Konstruksi (Tarif 2.65%)', amt: 3180000 },
      { cat: 'cat_exp_11', name: 'Bensin Truk Pick-up, Logistik Material & Perlengkapan K3', amt: 3500000 },
      { cat: 'cat_exp_13', name: 'Prive / Deviden Direksi & Manajemen Kontraktor', amt: prive },
    ];

    bItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_bld_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_11' && it.name.includes('Pajak'),
        reminder_date: `${effectiveYear}-${pad(monthNum)}-15`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    [10, 25].forEach((day, idx) => {
      const terminBase = idx === 0 ? targetRev * 0.46 : targetRev * 0.54;
      addTx({
        amount: varyAmount(terminBase, 0.14, m * 18 + idx * 7 + 4),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_contractor_bank',
        month: m,
        day,
        hour: 14,
        minute: 0,
        description: `Pencairan Termijn Progres Fisik Prestasi Lapangan (Termin ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'construction',
        business_name: bldBusinessName,
      });
    });

    const actualConcrete = varyAmount(Math.round(38000000 * mult), 0.06, m * 3 + 1);
    addTx({
      amount: actualConcrete,
      type: 'expense',
      category_id: 'cat_exp_8',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 6,
      hour: 10,
      minute: 0,
      description: `HPP Ready Mix K-300, Besi Beton Ulir & Semen Holcim`,
      mode: 'business',
      source_type: 'receipt',
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    const actualHebel = varyAmount(Math.round(18000000 * mult), 0.07, m * 3 + 2);
    addTx({
      amount: actualHebel,
      type: 'expense',
      category_id: 'cat_exp_8',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 15,
      hour: 11,
      minute: 0,
      description: `Bata Ringan Hebel, Mortar Plesteran & Pasir Cor Pasang`,
      mode: 'business',
      source_type: 'receipt',
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    const actualEquipRent = varyAmount(7500000, 0.07, m * 3 + 3);
    addTx({
      amount: actualEquipRent,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 8,
      hour: 9,
      minute: 0,
      description: `Sewa Alat Berat, Scaffolding 400 Set & Concrete Vibrator`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    addTx({
      amount: 3180000,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 15,
      hour: 14,
      minute: 0,
      description: `Pajak Proyek PPh Final Jasa Konstruksi (Tarif 2.65%)`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    const actualTruckLogistics = varyAmount(3500000, 0.08, m * 3 + 4);
    addTx({
      amount: actualTruckLogistics,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 20,
      hour: 16,
      minute: 0,
      description: `Bensin Truk Pick-up, Logistik Material & Perlengkapan K3`,
      mode: 'business',
      source_type: 'voice',
      voice_transcript: `Operasional bensin logistik truk proyek dan perlengkapan safety k3 ${actualTruckLogistics.toLocaleString('id-ID')} mandiri`,
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    addTx({
      amount: 26000000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 28,
      hour: 17,
      minute: 0,
      description: `Upah Borongan Mandor, Tukang Batu, Tukang Besi & Pekerja Lapangan`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'construction',
      business_name: bldBusinessName,
    });

    const actualBldPrive = varyAmount(prive, 0.08, m * 3 + 5);
    addTx({
      amount: actualBldPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_contractor_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive / Deviden Direksi & Manajemen Kontraktor`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'construction',
      business_name: bldBusinessName,
    });
  }

  // =========================================================================
  // 8. BISNIS G: SOFTWARE HOUSE & IT AGENCY (PT DIGITAL SOLUSI UTAMA)
  // =========================================================================
  const itBusinessName = 'PT Digital Solusi Utama';
  const itSeasonalMultiplier = [0.91, 0.97, 1.05, 0.99, 1.11, 1.19, 1.28, 1.15, 1.01, 1.09, 1.20, 1.40];

  for (let m = 0; m <= maxMonth; m++) {
    const monthNum = m + 1;
    const monthName = MONTH_NAMES[m];
    const daysInMonth = new Date(effectiveYear, monthNum, 0).getDate();
    const startDate = `${effectiveYear}-${pad(monthNum)}-01`;
    const endDate = `${effectiveYear}-${pad(monthNum)}-${pad(daysInMonth)}`;
    const mult = itSeasonalMultiplier[m];

    const budgetId = `bdg_it_${effectiveYear}_${pad(monthNum)}`;
    const targetRev = Math.round(75000000 * mult);
    const salaries = 32000000;
    const cloudOpex = 19800000;
    const prive = Math.round(23200000 * mult);

    budgets.push({
      id: budgetId,
      name: `Anggaran IT & Software House - ${monthName} ${effectiveYear}`,
      start_date: startDate,
      end_date: endDate,
      total_income_target: targetRev,
      total_planned_amount: salaries + cloudOpex + prive,
      mode: 'business',
      business_type: 'it_consulting',
      template_id: 'it_consulting',
      business_name: itBusinessName,
      description: `Rencana operasional software development, cloud infrastructure & IT consulting ${monthName} ${effectiveYear}.`,
      is_active: true,
      created_at: `${startDate}T00:00:00.000Z`,
      updated_at: `${startDate}T00:00:00.000Z`,
    });

    const itItems = [
      { cat: 'cat_inc_2', name: 'Target Pendapatan Jasa Software House & IT Agency', amt: targetRev },
      { cat: 'cat_exp_9', name: 'Gaji Programmer Fullstack, UI/UX Designer & Project Lead', amt: 32000000 },
      { cat: 'cat_exp_11', name: 'Sewa Cloud Server AWS / Google Cloud & Database Dedicated', amt: 6500000 },
      { cat: 'cat_exp_11', name: 'Lisensi API AI, Github Enterprise, Figma & Software SaaS', amt: 3800000 },
      { cat: 'cat_exp_10', name: 'Sewa Coworking Office Suite & Internet Fiber Dedicated', amt: 5500000 },
      { cat: 'cat_exp_11', name: 'Pajak PPh 23 Jasa Konsultan IT (Tarif 2%)', amt: 1500000 },
      { cat: 'cat_exp_12', name: 'Iklan Google Ads, LinkedIn Outreach & Proposal Pitching', amt: 2500000 },
      { cat: 'cat_exp_13', name: 'Prive Bagi Hasil Founder & Manajemen Konsultan IT', amt: prive },
    ];

    itItems.forEach((it, idx) => {
      budgetItems.push({
        id: `bi_it_${pad(monthNum)}_${idx}`,
        budget_id: budgetId,
        category_id: it.cat,
        planned_amount: it.amt,
        spent_amount: 0,
        reminder_enabled: it.cat === 'cat_exp_10',
        reminder_date: `${effectiveYear}-${pad(monthNum)}-25`,
        reminder_note: `Jatuh tempo ${it.name}`,
        reminder_status: 'pending',
      });
    });

    [5, 20].forEach((day, idx) => {
      const milestoneBase = idx === 0 ? targetRev * 0.44 : targetRev * 0.56;
      addTx({
        amount: varyAmount(milestoneBase, 0.13, m * 19 + idx * 8 + 5),
        type: 'income',
        category_id: 'cat_inc_2',
        account_id: 'acc_agency_bank',
        month: m,
        day,
        hour: 15,
        minute: 0,
        description: `Penerimaan Milestone Kontrak Pengembangan & Retainer SLA (Tahap ${idx + 1})`,
        mode: 'business',
        source_type: 'statement',
        business_type: 'it_consulting',
        business_name: itBusinessName,
      });
    });

    addTx({
      amount: 5500000,
      type: 'expense',
      category_id: 'cat_exp_10',
      account_id: 'acc_agency_bank',
      month: m,
      day: 3,
      hour: 9,
      minute: 0,
      description: `Sewa Coworking Office Suite & Internet Fiber Dedicated`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    const actualCloud = varyAmount(6500000, 0.07, m * 3 + 1);
    addTx({
      amount: actualCloud,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_agency_bank',
      month: m,
      day: 7,
      hour: 10,
      minute: 0,
      description: `Sewa Cloud Server AWS / Google Cloud & Database Dedicated`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    const actualSoftware = varyAmount(3800000, 0.07, m * 3 + 2);
    addTx({
      amount: actualSoftware,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_agency_bank',
      month: m,
      day: 10,
      hour: 11,
      minute: 0,
      description: `Lisensi API AI, Github Enterprise, Figma & Software SaaS`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    addTx({
      amount: 1500000,
      type: 'expense',
      category_id: 'cat_exp_11',
      account_id: 'acc_agency_bank',
      month: m,
      day: 15,
      hour: 14,
      minute: 0,
      description: `Pajak PPh 23 Jasa Konsultan IT (Tarif 2%)`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    const actualItPromo = varyAmount(2500000, 0.10, m * 3 + 3);
    addTx({
      amount: actualItPromo,
      type: 'expense',
      category_id: 'cat_exp_12',
      account_id: 'acc_agency_bank',
      month: m,
      day: 18,
      hour: 15,
      minute: 0,
      description: `Iklan Google Ads, LinkedIn Outreach & Proposal Pitching`,
      mode: 'business',
      source_type: 'statement',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    addTx({
      amount: 32000000,
      type: 'expense',
      category_id: 'cat_exp_9',
      account_id: 'acc_agency_bank',
      month: m,
      day: 28,
      hour: 16,
      minute: 0,
      description: `Gaji Programmer Fullstack, UI/UX Designer & Project Lead`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });

    const actualItPrive = varyAmount(prive, 0.08, m * 3 + 4);
    addTx({
      amount: actualItPrive,
      type: 'expense',
      category_id: 'cat_exp_13',
      account_id: 'acc_agency_bank',
      month: m,
      day: 28,
      hour: 21,
      minute: 0,
      description: `Prive Bagi Hasil Founder & Manajemen Konsultan IT`,
      mode: 'business',
      source_type: 'manual',
      business_type: 'it_consulting',
      business_name: itBusinessName,
    });
  }

  // =========================================================================
  // 9. TRANSAKSI KHUSUS HARI INI (TODAY) AGAR BERANDA LANGSUNG AKTIF
  // =========================================================================
  // Tambahkan transaksi realtime untuk hari ini
  addTx({
    amount: 145000,
    type: 'expense',
    category_id: 'cat_exp_1',
    account_id: 'acc_cash_utama',
    month: maxMonth,
    day: maxDay,
    hour: 8,
    minute: 30,
    description: `Sarapan Pagi Nasi Gudeg & Es Teh Manis Keluarga`,
    mode: 'personal',
    source_type: 'voice',
    voice_transcript: 'Beli sarapan pagi nasi gudeg komplit dan es teh 145 ribu bayar tunai dompet',
  });

  addTx({
    amount: 680000,
    type: 'income',
    category_id: 'cat_inc_2',
    account_id: 'acc_fnb_qris',
    month: maxMonth,
    day: maxDay,
    hour: 11,
    minute: 45,
    description: `Penjualan Batch Pagi: 20 Es Kopi Susu & 8 Croffle Takeaway`,
    mode: 'business',
    source_type: 'receipt',
    business_type: 'fnb_culinary',
    business_name: fnbBusinessName,
  });

  addTx({
    amount: 350000,
    type: 'expense',
    category_id: 'cat_exp_8',
    account_id: 'acc_fnb_bank',
    month: maxMonth,
    day: maxDay,
    hour: 13,
    minute: 15,
    description: `Restok Darurat Susu Segar Diamond 10 Liter & Es Batu Kristal`,
    mode: 'business',
    source_type: 'voice',
    voice_transcript: 'Beli susu segar pasteurisasi 10 liter dan es batu kristal kasir bar 350 ribu transfer mandiri',
    business_type: 'fnb_culinary',
    business_name: fnbBusinessName,
  });

  // ═══ POST-PROCESSING: GENERATE PROOF IMAGES FOR LAST 2 MONTHS ═══
  // Only generate images for recent transactions to avoid localStorage bloat
  // Category name lookup for proof image labels
  const catNameMap: Record<string, string> = {
    'cat_exp_1': 'Makanan & Minuman', 'cat_exp_2': 'Transport', 'cat_exp_3': 'Belanja',
    'cat_exp_4': 'Tagihan', 'cat_exp_5': 'Kesehatan', 'cat_exp_6': 'Pendidikan',
    'cat_exp_7': 'Hiburan', 'cat_exp_8': 'Bahan Baku/Stok', 'cat_exp_9': 'Gaji Karyawan',
    'cat_exp_10': 'Sewa Tempat', 'cat_exp_11': 'Operasional', 'cat_exp_12': 'Pemasaran & Promo',
    'cat_exp_hutang': 'Cicilan & Hutang', 'cat_exp_13': 'Lain-lain',
    'cat_inc_1': 'Gaji/Upah', 'cat_inc_2': 'Penjualan', 'cat_inc_3': 'Transfer Masuk',
    'cat_inc_4': 'Bonus', 'cat_inc_5': 'Modal Tambahan',
  };

  // Account lookup map
  const accMap: Record<string, Account> = {};
  ANNUAL_SAMPLE_ACCOUNTS.forEach(acc => { accMap[acc.id] = acc; });

  // Determine cutoff: only generate images for the last 2 months
  const cutoffMonth = maxMonth >= 1 ? maxMonth - 1 : 0;
  const cutoffDate = `${effectiveYear}-${pad(cutoffMonth + 1)}-01`;

  try {
    // Check if we're in a browser environment with Canvas support
    if (typeof document !== 'undefined' && document.createElement) {
      let proofSeed = 1000;
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        // Only generate images for transactions from cutoff date onward
        if (tx.date >= cutoffDate && !tx.attachment_path) {
          const acc = accMap[tx.account_id];
          const proofData: ProofTxData = {
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            date: tx.date,
            category_name: catNameMap[tx.category_id] || 'Umum',
            account_name: acc?.name,
            account_number: acc?.account_number,
            business_name: tx.business_name,
            business_type: tx.business_type,
            voice_transcript: tx.voice_transcript,
            source_type: tx.source_type,
            seed: proofSeed + i * 37,
          };
          tx.attachment_path = generateProofImage(proofData);
        }
      }
    }
  } catch (e) {
    // Silently ignore proof generation errors (e.g., SSR, no Canvas)
    console.warn('Proof image generation skipped:', e);
  }

  // ═══ POST-PROCESSING: RECALCULATE BUDGET ITEM REALIZATION & MARK PAID DUE DATES ═══
  const todayStr = `${effectiveYear}-${pad(maxMonth + 1)}-${pad(maxDay)}`;
  budgetItems.forEach((bi) => {
    const parentBudget = budgets.find((b) => b.id === bi.budget_id);
    if (parentBudget) {
      const bStart = parentBudget.start_date;
      const bEnd = parentBudget.end_date;
      const isIncomeItem = bi.category_id.startsWith('cat_inc');

      const matchingTxs = transactions.filter((tx) => {
        if (isIncomeItem) {
          if (tx.type !== 'income') return false;
        } else {
          if (tx.type !== 'expense') return false;
        }
        if (tx.category_id !== bi.category_id) return false;
        if (parentBudget.mode === 'personal') {
          if (tx.mode !== 'personal') return false;
        } else if (parentBudget.mode === 'business') {
          if (tx.mode !== 'business') return false;
          if (
            parentBudget.business_name &&
            tx.business_name &&
            tx.business_name.toLowerCase().trim() !== parentBudget.business_name.toLowerCase().trim()
          ) {
            return false;
          }
        }
        return tx.date >= bStart && tx.date <= bEnd;
      });

      bi.spent_amount = matchingTxs.reduce((sum, tx) => sum + tx.amount, 0);

      if (bi.reminder_enabled) {
        // If the due date is in the past (<= todayStr) and the bill has been paid via transactions (or date passed in historical months), mark completed/Lunas!
        if (bi.spent_amount > 0 || (bi.reminder_date && bi.reminder_date <= todayStr)) {
          bi.reminder_status = 'completed';
        } else {
          bi.reminder_status = 'pending';
        }
      }
    }
  });

  return {
    accounts: ANNUAL_SAMPLE_ACCOUNTS,
    budgets,
    budgetItems,
    transactions,
  };
}
