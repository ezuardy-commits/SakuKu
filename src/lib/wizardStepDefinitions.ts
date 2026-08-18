import React from 'react';
import {
  Store,
  TrendingUp,
  Package,
  Briefcase,
  WalletCards,
  CreditCard,
  FileText,
  User,
  Users,
  HardHat,
  Factory,
  Utensils,
  ShoppingBag,
  Wrench,
  Percent,
  Receipt,
  PiggyBank,
  CheckCircle2,
  ShieldCheck,
  Truck,
  HeartPulse,
  Home,
  GraduationCap,
  Monitor,
  Shirt,
  Coffee,
} from 'lucide-react';
import { BudgetSectionType } from './budgetTemplates';

export interface WizardStepDefinition {
  stepIndex: number; // 1-based
  id: string;
  title: string;
  shortTitle: string;
  desc: string;
  icon: any;
  colorScheme: 'blue' | 'emerald' | 'rose' | 'indigo' | 'purple' | 'amber' | 'cyan' | 'teal' | 'slate';
  stepType: 'profile' | 'items_input' | 'summary';
  sectionTarget?: BudgetSectionType;
  subCategoryFilter?: (item: { custom_name: string; category_id?: string; section: BudgetSectionType }) => boolean;
  addButtonLabel?: string;
  newItemDefaultSection?: BudgetSectionType;
  newItemDefaultName?: string;
  newItemDefaultUnit?: string;
  hintText?: string;
}

export interface IndustryWizardConfig {
  templateId: string;
  name: string;
  totalSteps: number;
  steps: WizardStepDefinition[];
}

/**
 * Returns dynamic step definitions tailored specifically to the selected business type or personal template.
 * Perfectly synchronized with the PDF Proforma Budget & SAK EMKM Reports.
 */
export function getWizardStepsForTemplate(
  templateId: string,
  isPersonal: boolean,
  language: 'id' | 'en' = 'id'
): WizardStepDefinition[] {
  const isId = language === 'id';

  // 1. KONTRAKTOR / PROYEK KONSTRUKSI (PT CIPTA SARANA BANGUN PERSADA)
  if (templateId === 'project_contract' || templateId === 'proj_construction') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Proyek & Dokumen Kontrak SPK' : 'Project Profile & Contract SPK',
        shortTitle: isId ? '1. Profil SPK' : '1. Profile',
        desc: isId ? 'Data proyek gedung, nomor SPK, nilai kontrak & periode kerja' : 'Contract metadata, SPK number & ceiling',
        icon: HardHat,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_termijn',
        title: isId ? 'Target Pemasukan & Pencairan Termijn Proyek' : 'Project Inflows & Termijn Milestones',
        shortTitle: isId ? '2. Termijn' : '2. Inflows',
        desc: isId ? 'Uang muka (DP), Termijn progres fisik 35%, 65%, 100% & BAST' : 'Down payment, progress termijn & final delivery',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Pos Termijn / Pemasukan' : '+ Add Termijn Line',
        newItemDefaultName: isId ? 'Termijn Pembayaran Proyek Gedung' : 'Termijn Inflow',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Rencanakan jadwal pencairan pembayaran per termin progres fisik (Termijn 1, 2, 3, dan Retensi 5%).'
          : 'Plan scheduled cash inflows per construction milestone or termijn.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_material',
        title: isId ? 'Material BoQ Proyek (Ready Mix, Besi, Bata, Semen, Pasir)' : 'BoQ Direct Materials (Concrete, Steel, Bricks)',
        shortTitle: isId ? '3. Material BoQ' : '3. Materials',
        desc: isId ? 'Ready mix K-300, besi ulir D13/D10, bata hebel, semen, keramik, MEP' : 'Ready mix, rebar steel, AAC blocks, cement, MEP',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Material Proyek' : '+ Add Material Item',
        newItemDefaultName: isId ? 'Material Struktur Proyek' : 'Project Material Item',
        newItemDefaultUnit: 'Ton',
        hintText: isId
          ? 'Masukkan rencana pengadaan material fisik proyek per item terpisah tanpa digabung.'
          : 'Specify planned physical material purchases item by item without grouping.',
      },
      {
        stepIndex: 4,
        id: 'step_cogs_labor',
        title: isId ? 'Upah Tenaga Kerja Lapangan & Mandor Borongan' : 'Site Labor Wages & Foreman Subcontract',
        shortTitle: isId ? '4. Upah Kerja' : '4. Labor Wages',
        desc: isId ? 'Upah mandor, tukang batu, tukang besi, tukang kayu, kuli harian & uang makan' : 'Foreman, masons, steel fixers, carpenters & daily meals',
        icon: Users,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Tenaga Kerja' : '+ Add Labor Line',
        newItemDefaultName: isId ? 'Upah Tukang / Pekerja Proyek' : 'Site Worker Wage',
        newItemDefaultUnit: 'Orang',
        hintText: isId
          ? 'Alokasikan upah mingguan/bulanan mandor dan tukang spesialis serta uang makan harian.'
          : 'Allocate wages for foremen, specialized tradesmen, and site workers.',
      },
      {
        stepIndex: 5,
        id: 'step_opex_site',
        title: isId ? 'Sewa Alat Berat, Scaffolding, K3 & Operasional Lapangan' : 'Heavy Equipment, Scaffolding & Site Overhead',
        shortTitle: isId ? '5. Operasional' : '5. Site OPEX',
        desc: isId ? 'Sewa scaffolding, excavator, solar genset, asuransi K3 & kantor direksi keet' : 'Scaffolding lease, equipment, fuel, safety K3 & site office',
        icon: Briefcase,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Biaya Operasional' : '+ Add Site OPEX Line',
        newItemDefaultName: isId ? 'Sewa Alat / Operasional Lapangan' : 'Site Operating Expense',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Biaya sewa alat pendukung proyek, perizinan, BBM genset, akomodasi, dan K3 keselamatan kerja.'
          : 'Project overhead costs including scaffolding, site office lease, safety gear, and permits.',
      },
      {
        stepIndex: 6,
        id: 'step_tax_dividend',
        title: isId ? 'Pajak PPh Final Konstruksi (2.65%), Retensi & Deviden' : 'Construction Tax (2.65%), Retention & Dividends',
        shortTitle: isId ? '6. Pajak & Laba' : '6. Tax & Profit',
        desc: isId ? 'PPh Final 2.65%, retensi garansi 5%, deviden direksi & laba ditahan' : 'Statutory tax 2.65%, warranty retention, dividends & retained profit',
        icon: Percent,
        colorScheme: 'amber',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Pajak / Deviden' : '+ Add Tax/Dividend Line',
        newItemDefaultName: isId ? 'Pajak Proyek / Alokasi Laba' : 'Project Tax / Dividend',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Perhitungan pajak PPh Final Jasa Konstruksi (2.65%), cadangan retensi, dan bagi hasil pemilik.'
          : 'Calculate construction final tax, retention holdbacks, and partner dividends.',
      },
      {
        stepIndex: 7,
        id: 'step_summary_construction',
        title: isId ? 'Ringkasan Laporan Laba Rugi Proforma & Arus Kas Proyek' : 'Proforma Income Statement & Cash Flow Summary',
        shortTitle: isId ? '7. Ringkasan' : '7. Summary',
        desc: isId ? 'Rekapitulasi SAK EMKM, margin BoQ, mutasi persediaan & ekspor PDF' : 'Financial summary, BoQ margin, inventory movement & PDF export',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 2. RITEL & PERDAGANGAN: MINIMARKET & TOKO SEMBAKO (BERKAH JAYA)
  if (templateId === 'retail_shop') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Toko & Estimasi Pelanggan Harian' : 'Store Profile & Daily Footfall',
        shortTitle: isId ? '1. Profil Toko' : '1. Profile',
        desc: isId ? 'Nama minimarket, lokasi ruko, jam operasional 2 shift & periode' : 'Store metadata, retail location & operating hours',
        icon: Store,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_retail',
        title: isId ? 'Target Omzet Penjualan Kasir, Chiller & Delivery' : 'Sales Revenue (POS Cashier, Chiller, Delivery)',
        shortTitle: isId ? '2. Omzet Toko' : '2. Revenue',
        desc: isId ? 'Kasir sembako harian, chiller minuman, delivery warung mitra & PPOB' : 'Daily cashier sales, cold beverages, delivery & digital top-ups',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Saluran Omzet' : '+ Add Revenue Stream',
        newItemDefaultName: isId ? 'Penjualan Barang Dagangan' : 'Merchandise Sales',
        newItemDefaultUnit: 'Hari',
        hintText: isId
          ? 'Tentukan target omzet harian kasir offline, showcase minuman dingin, dan delivery mitra.'
          : 'Set daily target sales for in-store checkout, chiller showcases, and delivery orders.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_kulakan',
        title: isId ? 'Rencana Kulakan Sembako, FMCG & Restok Barang Dagangan' : 'Restock Procurement (Groceries, FMCG & Beverages)',
        shortTitle: isId ? '3. Kulakan HPP' : '3. Purchases',
        desc: isId ? 'Beras, minyak, gula, telur, rokok, mi instan, sabun karton & minuman' : 'Rice, cooking oil, sugar, eggs, cigarettes, noodles, FMCG',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Kulakan' : '+ Add Restock Line',
        newItemDefaultName: isId ? 'Kulakan Stok Barang Dagangan' : 'Restock Purchase Item',
        newItemDefaultUnit: 'Karton',
        hintText: isId
          ? 'Rincikan anggaran belanja kulakan grosir per kategori produk (Sembako, FMCG, Rokok, Minuman).'
          : 'Detail wholesale procurement budget per product line (Staples, FMCG, Drinks).',
      },
      {
        stepIndex: 4,
        id: 'step_opex_retail',
        title: isId ? 'Gaji 4 Staf Kasir, Sewa Ruko & Listrik Chiller 24 Jam' : 'Staff Salaries, Store Rent & 24/7 Chiller Utilities',
        shortTitle: isId ? '4. Gaji & Sewa' : '4. Store OPEX',
        desc: isId ? 'Gaji kasir shift, pramuniaga, sewa ruko 2 lantai, listrik 3 phase, POS' : 'Cashier shifts, shop rent, 3-phase electricity, POS software',
        icon: Briefcase,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Operasional' : '+ Add OPEX Item',
        newItemDefaultName: isId ? 'Biaya Operasional Toko' : 'Store OPEX Line',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Gaji staf 2 shift, sewa ruko pinggir jalan, listrik chiller 24 jam, dan biaya aplikasi kasir POS.'
          : 'Staff payroll, store rental, refrigeration utilities, and POS software subscription.',
      },
      {
        stepIndex: 5,
        id: 'step_debt_prive_retail',
        title: isId ? 'Cicilan KUR BRI Modal Kerja, Pick-Up & Prive Pemilik' : 'Working Capital Loans, Vehicle Leasing & Owner Drawing',
        shortTitle: isId ? '5. KUR & Prive' : '5. Loans & Prive',
        desc: isId ? 'Angsuran KUR BRI, leasing pick-up, prive gaji pemilik & laba ditahan' : 'KUR loan installment, delivery vehicle leasing, owner salary & equity',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Cicilan / Prive' : '+ Add Loan/Prive Line',
        newItemDefaultName: isId ? 'Angsuran KUR / Prive Pemilik' : 'Loan Repayment / Owner Drawing',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Kewajiban angsuran pinjaman modal kerja bank, leasing kendaraan operasional, dan bagi hasil pemilik.'
          : 'Working capital bank loan installments and owner profit withdrawals.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_retail',
        title: isId ? 'Ringkasan Laporan Laba Kotor Toko, Mutasi Stok & SAK EMKM' : 'Store Gross Margin Summary, Inventory & Financial Statements',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Margin kotor ritel, laba bersih, valuasi mutasi stok & cetak PDF proforma' : 'Retail margins, net profit, inventory valuation & PDF export',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 3. KULINER & F&B: KOPI SENJA NUSANTARA & EATERY
  if (templateId === 'fnb_culinary') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Kafe, Kapasitas Meja & Target Tamu' : 'Cafe Profile, Seating Capacity & Target Guests',
        shortTitle: isId ? '1. Profil Kafe' : '1. Profile',
        desc: isId ? 'Konsep coffee shop, 30 kursi dine-in, menu specialty & periode' : 'Coffee shop concept, 30 seating capacity & menu mix',
        icon: Coffee,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_fnb',
        title: isId ? 'Target Omzet Dine-In, Takeaway, Ojol & Beans Pack' : 'Revenue Streams (Dine-In, Takeaway, Delivery, Beans)',
        shortTitle: isId ? '2. Omzet Kafe' : '2. Revenue',
        desc: isId ? 'Penjualan kopi dine-in, makanan kitchen, pesanan GrabFood & biji kopi' : 'Dine-in coffee, food sales, GrabFood orders & packaged beans',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Saluran Omzet' : '+ Add Revenue Item',
        newItemDefaultName: isId ? 'Penjualan Kopi & Makanan Kafe' : 'Cafe Menu Sales',
        newItemDefaultUnit: 'Hari',
        hintText: isId
          ? 'Estimasi omzet harian dari pengunjung dine-in, takeaway, serta pesanan online GrabFood/GoFood.'
          : 'Project daily sales from dine-in guests, takeaway cups, and delivery apps.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_fnb',
        title: isId ? 'Bahan Baku Kopi Gayo/Toraja, Susu, Sirup, Dapur & Cup' : 'Raw Materials (Coffee Beans, Fresh Milk, Syrups, Kitchen & Cups)',
        shortTitle: isId ? '3. Bahan Baku' : '3. COGS',
        desc: isId ? 'Biji kopi roast, susu pasteurisasi, sirup Monin, daging/keju, cup sablon' : 'Roast beans, fresh milk, flavor syrups, kitchen food, custom cups',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Bahan Baku' : '+ Add Ingredient Line',
        newItemDefaultName: isId ? 'Bahan Baku Minuman / Dapur Kafe' : 'Cafe Raw Material Item',
        newItemDefaultUnit: 'Kg',
        hintText: isId
          ? 'Rincikan kebutuhan biji kopi, susu segar harian, sirup barista, bahan masakan dapur, dan cup kemasan.'
          : 'Detail coffee beans, fresh milk, syrups, kitchen ingredients, and branded takeaway cups.',
      },
      {
        stepIndex: 4,
        id: 'step_opex_fnb',
        title: isId ? 'Gaji Barista & Chef, Sewa Kafe, Listrik & Komisi Ojol' : 'Staff Salaries, Cafe Rent, Espresso Utilities & App Commissions',
        shortTitle: isId ? '4. Gaji & Ops' : '4. OPEX',
        desc: isId ? 'Gaji 2 barista, chef, kasir, sewa tempat, listrik mesin espresso, komisi ojol' : 'Baristas, kitchen chef, cashier, rent, espresso power, platform fee',
        icon: Users,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Operasional' : '+ Add OPEX Line',
        newItemDefaultName: isId ? 'Beban Operasional Kafe' : 'Cafe Operating Expense',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Gaji tim barista dan dapur, sewa bangunan kafe, listrik mesin espresso, dan komisi platform online 20%.'
          : 'Staff payroll, location rent, heavy utility power for espresso machine, and app commissions.',
      },
      {
        stepIndex: 5,
        id: 'step_debt_prive_fnb',
        title: isId ? 'Cicilan Mesin Espresso Nuova Simonelli, Renovasi & Prive' : 'Espresso Machine Financing, Interior Renovation & Owner Prive',
        shortTitle: isId ? '5. Mesin & Prive' : '5. Equipment & Prive',
        desc: isId ? 'Cicilan mesin espresso 2-group, pinjaman renovasi interior & prive pemilik' : 'Commercial espresso financing, renovation debt & owner profit drawing',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Cicilan / Prive' : '+ Add Financing Line',
        newItemDefaultName: isId ? 'Cicilan Mesin Kafe / Prive' : 'Equipment Loan / Owner Prive',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Kewajiban cicilan mesin kopi komersial, pinjaman renovasi tempat, dan pengambilan prive pemilik.'
          : 'Commercial espresso machine leasing, renovation installments, and owner profit drawing.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_fnb',
        title: isId ? 'Ringkasan Laba Bersih Kafe, Mutasi Stok Biji Kopi & Proforma PDF' : 'Cafe Net Profit Summary, Coffee Stock Movement & PDF Statement',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Margin minuman 65%, laba bersih operasional, valuasi stok bahan & laporan PDF' : 'Beverage margins, operating net profit, inventory valuation & PDF export',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 4. BENGKEL OTOMOTIF: BENGKEL MOBIL & MOTOR AUTOCARE
  if (templateId === 'workshop_service' || templateId === 'workshop_repair') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Bengkel, Jumlah Bay Servis & Target Unit' : 'Workshop Profile, Service Bays & Target Units',
        shortTitle: isId ? '1. Profil Bengkel' : '1. Profile',
        desc: isId ? 'Bengkel mobil & motor 3 bay, kapasitas servis harian & periode' : 'Auto workshop metadata, 3 service bays & capacity',
        icon: Wrench,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_workshop',
        title: isId ? 'Target Pendapatan Jasa Servis, Tune-Up, Ban & Sparepart' : 'Revenue Targets (Labor Service, Tune-Up, Tires & Parts)',
        shortTitle: isId ? '2. Omzet Jasa' : '2. Revenue',
        desc: isId ? 'Jasa servis motor/mobil, penjualan oli mesin, ganti ban & suku cadang' : 'Labor fees, engine oil sales, tire replacements & spare parts',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Pos Omzet Jasa' : '+ Add Revenue Item',
        newItemDefaultName: isId ? 'Jasa Servis Otomotif' : 'Auto Repair Labor Service',
        newItemDefaultUnit: 'Unit',
        hintText: isId
          ? 'Rencanakan pendapatan dari ongkos jasa servis berkala, tune-up, ganti oli, dan penjualan sparepart.'
          : 'Project service labor charges, tune-ups, tire replacements, and retail parts markup.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_spareparts',
        title: isId ? 'Pengadaan Stok Oli Mesin, Kampas Rem, Busi, Aki & Ban' : 'Spare Parts Stock Procurement (Oil, Brake Pads, Plugs, Batteries, Tires)',
        shortTitle: isId ? '3. Stok Sparepart' : '3. Spareparts',
        desc: isId ? 'Oli Yamalube/Shell, kampas cakram, busi NGK, aki GS Astra, vanbelt, ban' : 'Engine oil, disc brake pads, spark plugs, GS batteries, CVT belts, tires',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Stok Sparepart' : '+ Add Part Item',
        newItemDefaultName: isId ? 'Stok Sparepart & Pelumas' : 'Spare Part Inventory Item',
        newItemDefaultUnit: 'Pcs',
        hintText: isId
          ? 'Rincikan anggaran belanja stok oli mesin drum/botol, kampas rem, busi, aki, dan ban tubeless.'
          : 'Detail wholesale parts inventory purchases including engine oil, brake pads, and batteries.',
      },
      {
        stepIndex: 4,
        id: 'step_opex_workshop',
        title: isId ? 'Gaji 3 Mekanik Handal, Kasir, Sewa Ruko & Kompresor' : 'Mechanic Salaries, Cashier, Workshop Rent & Air Compressor Power',
        shortTitle: isId ? '4. Gaji & Sewa' : '4. OPEX',
        desc: isId ? 'Gaji mekanik senior/junior, admin faktur, sewa ruko 3 bay, listrik, software' : 'Mechanic wages, admin, workshop rent, heavy compressor power',
        icon: Users,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Operasional' : '+ Add OPEX Item',
        newItemDefaultName: isId ? 'Biaya Operasional Bengkel' : 'Workshop Operating Expense',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Gaji mekanik dan admin, sewa ruko bengkel, listrik kompresor & bike lift, serta majun pembersih.'
          : 'Mechanic payroll, workshop lease, air compressor utilities, and shop supplies.',
      },
      {
        stepIndex: 5,
        id: 'step_debt_prive_workshop',
        title: isId ? 'Cicilan Mesin Tyre Changer, Bike Lift, Towing & Prive' : 'Tyre Changer Financing, Bike Lift Loan & Owner Drawing',
        shortTitle: isId ? '5. Alat & Prive' : '5. Loans & Prive',
        desc: isId ? 'Cicilan mesin buka ban, bike lift hidrolik, kredit pick-up & prive pemilik' : 'Tire machine financing, hydraulic bike lift debt & owner drawing',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Cicilan / Prive' : '+ Add Financing Line',
        newItemDefaultName: isId ? 'Cicilan Mesin Bengkel / Prive' : 'Equipment Debt / Owner Prive',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Cicilan pembelian alat bengkel (Tyre Changer, Bike Lift), kendaraan towing, dan prive pemilik.'
          : 'Equipment financing payments and owner profit withdrawals.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_workshop',
        title: isId ? 'Ringkasan Laba Bengkel, Valuasi Mutasi Sparepart & Cetak PDF' : 'Workshop Net Profit Summary, Parts Inventory Valuation & PDF Export',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Analisis margin jasa & suku cadang, saldo kas bebas, mutasi stok & PDF' : 'Service margins, spare part inventory valuation & PDF export',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 5. JASA LAUNDRY: LAUNDRY KILAT BERSIH WANGI
  if (templateId === 'laundry_service') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Laundry, Kapasitas Mesin & Target Kiloan' : 'Laundry Profile, Machine Capacity & Target Volume',
        shortTitle: isId ? '1. Profil Laundry' : '1. Profile',
        desc: isId ? '5 mesin cuci + 3 dryer gas, layanan reguler, express 3 jam & periode' : '5 washers + 3 gas dryers, regular & express service targets',
        icon: Shirt,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_laundry',
        title: isId ? 'Target Omzet Cuci Kiloan, Express, Dry Clean & Bedcover' : 'Revenue Targets (Kilogram Laundry, Express, Dry Clean, Bedcovers)',
        shortTitle: isId ? '2. Omzet Cuci' : '2. Revenue',
        desc: isId ? 'Cuci kiloan 3 hari, paket express 3 jam, dry clean jas/kebaya & cuci selimut' : 'Standard wash, 3-hour express, dry clean suites & bedcover wash',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Pos Omzet Cuci' : '+ Add Revenue Item',
        newItemDefaultName: isId ? 'Jasa Cuci Kiloan / Satuan' : 'Laundry Service Revenue',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Target omzet bulanan dari cucian kiloan harian, paket express instan, dan dry clean premium.'
          : 'Project monthly revenue from wash & fold, express service, and delicate dry cleaning.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_chemical',
        title: isId ? 'Bahan Kimia Laundry (Deterjen, Pewangi, Parfum, Plastik, Hanger)' : 'Laundry Consumables (Detergent, Softener, Perfume, Poly Bags, Hangers)',
        shortTitle: isId ? '3. Bahan Kimia' : '3. Chemicals',
        desc: isId ? 'Deterjen cair 25L, softener, parfum laundry premium, plastik packing, tag' : 'Liquid detergent, fabric softener, premium perfume, sealed packing bags',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Bahan Kimia' : '+ Add Consumable Item',
        newItemDefaultName: isId ? 'Bahan Kimia / Kemasan Laundry' : 'Laundry Consumable Item',
        newItemDefaultUnit: 'Jerigen',
        hintText: isId
          ? 'Rincikan belanja deterjen konsentrat, pelembut pakaian, bibit parfum, plastik segel, dan hanger.'
          : 'Detail concentrated detergents, softeners, perfumes, poly bags, and wire hangers.',
      },
      {
        stepIndex: 4,
        id: 'step_opex_laundry',
        title: isId ? 'Gaji 3 Karyawan, Sewa Kios, Listrik PLN, Air & Gas Boiler' : '3 Staff Salaries, Kiosk Rent, Utilities & LPG Boiler Gas',
        shortTitle: isId ? '4. Gaji & Utilitas' : '4. OPEX',
        desc: isId ? 'Gaji bagian cuci, setrika uap, packing, sewa kios, air PDAM tinggi, gas dryer' : 'Washing & steam iron staff, kiosk lease, high water bills, dryer LPG',
        icon: Users,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Operasional' : '+ Add OPEX Item',
        newItemDefaultName: isId ? 'Biaya Operasional Laundry' : 'Laundry Operating Expense',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Gaji staf cuci dan setrika uap, sewa kios, tagihan air PDAM pemakaian tinggi, dan gas elpiji dryer.'
          : 'Staff wages, kiosk rental, high utility water bills, and LPG gas for commercial dryers.',
      },
      {
        stepIndex: 5,
        id: 'step_debt_prive_laundry',
        title: isId ? 'Cicilan Mesin Dryer Gas, Modal Kerja KUR & Prive Pemilik' : 'Commercial Dryer Loan, Working Capital & Owner Drawing',
        shortTitle: isId ? '5. Mesin & Prive' : '5. Loans & Prive',
        desc: isId ? 'Cicilan mesin pengering dryer SpeedQueen, KUR mikro & prive pemilik' : 'Gas dryer financing, KUR working capital loan & owner drawing',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Cicilan / Prive' : '+ Add Financing Line',
        newItemDefaultName: isId ? 'Cicilan Dryer Gas / Prive' : 'Dryer Financing / Owner Prive',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Kewajiban cicilan mesin pengering gas komersial, pinjaman KUR awal, dan gaji/prive pemilik.'
          : 'Commercial dryer equipment financing and owner profit drawing.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_laundry',
        title: isId ? 'Ringkasan Laba Bersih Laundry, Mutasi Stok Kimia & Cetak PDF' : 'Laundry Net Margin Summary, Chemical Inventory & PDF Statement',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Margin usaha laundry, arus kas bebas, valuasi stok deterjen & ekspor PDF' : 'Laundry net profit, free cash flow, chemical valuation & PDF statement',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 6. TEKSTIL & KONVEKSI: BUTIK BUSANA HARMONI
  if (templateId === 'fashion_clothing' || templateId === 'manufacturing_craft') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Workshop Konveksi & Target Produksi Busana' : 'Garment Workshop Profile & Production Targets',
        shortTitle: isId ? '1. Profil Konveksi' : '1. Profile',
        desc: isId ? 'Workshop 6 mesin jahit, lini busana muslim, seragam kantor & periode' : '6 sewing machines, muslim fashion line, uniform orders & period',
        icon: Shirt,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_fashion',
        title: isId ? 'Target Penjualan Online, PO Seragam Kantor & Butik' : 'Sales Revenue (E-Commerce, Uniform PO Orders & Boutique)',
        shortTitle: isId ? '2. Omzet Busana' : '2. Revenue',
        desc: isId ? 'Penjualan Shopee/TikTok Shop, pesanan seragam instansi & display butik' : 'E-commerce sales, corporate uniform batches & in-store boutique',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Saluran Penjualan' : '+ Add Sales Stream',
        newItemDefaultName: isId ? 'Penjualan Busana / Seragam' : 'Apparel / Uniform Sales',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Target penerimaan omzet dari marketplace online, pesanan borongan seragam, dan penjualan butik.'
          : 'Project sales revenue from e-commerce stores, wholesale uniform POs, and boutique sales.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_fabric',
        title: isId ? 'Bahan Baku Kain (Toyobo, Rayon, Drill), Benang, Kancing & Zipper' : 'Raw Fabrics (Toyobo, Rayon, Drill), Threads, Buttons & Zippers',
        shortTitle: isId ? '3. Bahan Kain' : '3. Fabrics',
        desc: isId ? 'Roll kain katun, rayon viscose, kain drill seragam, benang, kancing YKK, tag' : 'Cotton rolls, rayon viscose, drill fabrics, threads, YKK zippers, tags',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Bahan Kain' : '+ Add Fabric Line',
        newItemDefaultName: isId ? 'Bahan Baku Kain / Aksesoris' : 'Fabric / Accessory Item',
        newItemDefaultUnit: 'Yard',
        hintText: isId
          ? 'Rincikan anggaran pembelian roll kain, benang jahit, kancing, resleting YKK, dan kemasan zipper bag.'
          : 'Detail fabric rolls procurement, threads, buttons, zippers, and branded zipper bags.',
      },
      {
        stepIndex: 4,
        id: 'step_opex_fashion',
        title: isId ? 'Upah 4 Penjahit & Obras, Sewa Workshop, Iklan Ads & Ekspedisi' : 'Tailor Wages, Workshop Rent, Online Ads & Courier Shipping',
        shortTitle: isId ? '4. Upah & Iklan' : '4. OPEX',
        desc: isId ? 'Upah penjahit senior/junior, obras, sewa butik, TikTok/Shopee Ads, ongkir' : 'Tailor wages, finishing staff, boutique rent, TikTok ads, shipping',
        icon: Users,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Operasional' : '+ Add OPEX Item',
        newItemDefaultName: isId ? 'Upah Penjahit / Operasional' : 'Tailor Wage / Operating Expense',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Upah borongan penjahit dan obras, sewa workshop, budget iklan digital Shopee/TikTok Ads, dan ekspedisi.'
          : 'Tailor and finishing wages, studio rental, e-commerce ads budget, and courier shipping.',
      },
      {
        stepIndex: 5,
        id: 'step_debt_prive_fashion',
        title: isId ? 'Cicilan Mesin Jahit Digital Juki, Mesin Bordir & Prive Pemilik' : 'Digital Sewing Machine Financing, Embroidery Debt & Owner Drawing',
        shortTitle: isId ? '5. Mesin & Prive' : '5. Loans & Prive',
        desc: isId ? 'Cicilan mesin jahit digital, mesin bordir komputer & pengambilan prive' : 'Digital sewing machine leasing, embroidery equipment & owner drawing',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Cicilan / Prive' : '+ Add Financing Line',
        newItemDefaultName: isId ? 'Cicilan Mesin Jahit / Prive' : 'Sewing Machine Debt / Owner Prive',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Kewajiban cicilan mesin jahit otomatis, mesin bordir komputer, dan bagi hasil/prive pemilik.'
          : 'Sewing machine equipment financing and owner profit drawing.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_fashion',
        title: isId ? 'Ringkasan Laba Konveksi, Valuasi Stok Kain & Proforma PDF' : 'Garment Net Profit Summary, Fabric Inventory Valuation & PDF Export',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Margin kotor produksi, laba bersih, valuasi persediaan kain & ekspor PDF' : 'Production gross margin, net profit, fabric inventory valuation & PDF',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 7. TEKNOLOGI & SOFTWARE: PT DIGITAL SOLUSI UTAMA (SOFTWARE HOUSE)
  if (templateId === 'consultant_it' || templateId === 'service_agency' || templateId === 'proj_consultant') {
    return [
      {
        stepIndex: 1,
        id: 'step_profile',
        title: isId ? 'Profil Agensi IT, Kapasitas Tim Developer & Target Klien' : 'IT Agency Profile, Developer Team Capacity & Target Clients',
        shortTitle: isId ? '1. Profil Agensi' : '1. Profile',
        desc: isId ? 'Software house 8 orang: web, mobile app, retainer cloud & periode' : '8-person software house: web apps, mobile & cloud retainer',
        icon: Monitor,
        colorScheme: 'blue',
        stepType: 'profile',
      },
      {
        stepIndex: 2,
        id: 'step_revenue_it',
        title: isId ? 'Target Milestone Pembuatan Website, Aplikasi & Retainer Cloud' : 'Contract Milestones (Web Apps, Mobile Apps & Cloud Retainers)',
        shortTitle: isId ? '2. Fee Kontrak' : '2. Contracts',
        desc: isId ? 'Termijn milestone kontrak software web, aplikasi mobile & SLA retainer' : 'Web software contract termijn, mobile app delivery & SLA retainer',
        icon: TrendingUp,
        colorScheme: 'emerald',
        stepType: 'items_input',
        sectionTarget: 'revenue',
        newItemDefaultSection: 'revenue',
        addButtonLabel: isId ? '+ Tambah Pos Kontrak IT' : '+ Add IT Contract Line',
        newItemDefaultName: isId ? 'Milestone Kontrak Software / Retainer' : 'Software Contract Milestone',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Rencanakan target pencairan milestone pengerjaan aplikasi web/mobile dan retainer bulanan.'
          : 'Plan revenue milestones from custom software development and monthly retainers.',
      },
      {
        stepIndex: 3,
        id: 'step_cogs_cloud',
        title: isId ? 'Infrastruktur Cloud (AWS/GCP), Database, API AI & Lisensi SaaS' : 'Cloud Servers (AWS/GCP), Cloud SQL, AI APIs & SaaS Subscriptions',
        shortTitle: isId ? '3. Cloud & Server' : '3. Cloud Infrastructure',
        desc: isId ? 'Server AWS EC2, Cloud SQL, API OpenAI, Github Enterprise, Figma Pro' : 'AWS EC2 instances, Cloud SQL, OpenAI API, Github Enterprise, Figma',
        icon: Package,
        colorScheme: 'rose',
        stepType: 'items_input',
        sectionTarget: 'cogs',
        newItemDefaultSection: 'cogs',
        addButtonLabel: isId ? '+ Tambah Pos Server / Lisensi' : '+ Add Cloud Server Line',
        newItemDefaultName: isId ? 'Sewa Server Cloud / Lisensi API' : 'Cloud Server / API License',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Biaya infrastruktur cloud server proyek (AWS/GCP), database, lisensi API AI, Github, dan Figma.'
          : 'Direct cloud server infrastructure (AWS/GCP), databases, AI API usage, and design tools.',
      },
      {
        stepIndex: 4,
        id: 'step_opex_payroll',
        title: isId ? 'Gaji Tim Developer (Fullstack, Mobile, UI/UX, PM & QA)' : 'Core Engineering Payroll (Fullstack, Mobile, UI/UX, PM & QA)',
        shortTitle: isId ? '4. Gaji Tim IT' : '4. Engineering Payroll',
        desc: isId ? 'Gaji 4 programmer, 1 UI/UX, 1 PM, 1 QA, tunjangan remote & internet' : '4 software engineers, 1 UI/UX, 1 PM, 1 QA, remote allowances',
        icon: Users,
        colorScheme: 'indigo',
        stepType: 'items_input',
        sectionTarget: 'opex',
        newItemDefaultSection: 'opex',
        addButtonLabel: isId ? '+ Tambah Pos Gaji Developer' : '+ Add Developer Payroll',
        newItemDefaultName: isId ? 'Gaji Tim Programmer / Engineer' : 'Software Engineer Salary',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Alokasikan gaji bulanan programmer senior/junior, desainer UI/UX, PM, dan tunjangan kerja remote.'
          : 'Allocate salaries for senior/mid fullstack developers, UI/UX designers, and project managers.',
      },
      {
        stepIndex: 5,
        id: 'step_tax_prive_it',
        title: isId ? 'Pajak PPh 23 (2%), Sewa Coworking, Iklan Ads & Prive Founder' : 'Withholding Tax PPh 23 (2%), Coworking Rent, Ads & Founder Prive',
        shortTitle: isId ? '5. Pajak & Founder' : '5. Tax & Founder',
        desc: isId ? 'Potongan PPh 23 2%, sewa coworking suite, Google/LinkedIn Ads, prive CEO' : 'PPh 23 withholding tax, coworking lease, LinkedIn ads, founder drawing',
        icon: CreditCard,
        colorScheme: 'purple',
        stepType: 'items_input',
        sectionTarget: 'debt_receivable',
        newItemDefaultSection: 'debt_receivable',
        addButtonLabel: isId ? '+ Tambah Pos Pajak / Prive' : '+ Add Tax/Founder Line',
        newItemDefaultName: isId ? 'Pajak PPh 23 / Prive Founder' : 'Tax Withholding / Founder Drawing',
        newItemDefaultUnit: 'Bln',
        hintText: isId
          ? 'Estimasi potongan pajak PPh 23 (2%), sewa coworking space, iklan B2B, dan pembagian dividen founder.'
          : 'Withholding tax provisions (PPh 23), coworking office lease, B2B ads, and founder profit drawing.',
      },
      {
        stepIndex: 6,
        id: 'step_summary_it',
        title: isId ? 'Ringkasan Laba Bersih Agensi IT, Arus Kas & Ekspor PDF Proforma' : 'IT Agency Net Margin Summary, Cash Flow & Proforma PDF Export',
        shortTitle: isId ? '6. Ringkasan' : '6. Summary',
        desc: isId ? 'Margin laba bersih IT ~28%, free cash flow, rekapitulasi SAK EMKM & cetak PDF' : 'Net profit margin ~28%, free cash flow, SAK EMKM statement & PDF export',
        icon: FileText,
        colorScheme: 'blue',
        stepType: 'summary',
      },
    ];
  }

  // 8. ANGGARAN PRIBADI & KELUARGA / RUMAH TANGGA LENGKAP (7 TAHAPAN METODE 50/30/20)
  return [
    {
      stepIndex: 1,
      id: 'step_profile_personal',
      title: isId ? 'Profil Keluarga & Target Keuangan Rumah Tangga' : 'Family Profile & Household Financial Goals',
      shortTitle: isId ? '1. Profil Keluarga' : '1. Profile',
      desc: isId ? 'Jumlah tanggungan (4 jiwa), model anggaran 50/30/20 zero-based & periode' : 'Family members, 50/30/20 zero-based model & period',
      icon: Home,
      colorScheme: 'indigo',
      stepType: 'profile',
    },
    {
      stepIndex: 2,
      id: 'step_revenue_personal',
      title: isId ? 'Sumber Pendapatan Bulanan (Gaji Suami, Istri, Freelance & Dividen)' : 'Monthly Inflow Sources (Salary, Partner Income, Freelance & Dividends)',
      shortTitle: isId ? '2. Pendapatan' : '2. Inflows',
      desc: isId ? 'Gaji pokok suami-istri, penghasilan sampingan, freelance & bonus lembur' : 'Take-home salaries, partner online side-income, freelance & dividends',
      icon: TrendingUp,
      colorScheme: 'emerald',
      stepType: 'items_input',
      sectionTarget: 'revenue',
      newItemDefaultSection: 'revenue',
      addButtonLabel: isId ? '+ Tambah Sumber Pendapatan' : '+ Add Inflow Source',
      newItemDefaultName: isId ? 'Penghasilan / Gaji Bulanan' : 'Salary / Income Source',
      newItemDefaultUnit: 'Bln',
      hintText: isId
        ? 'Catat seluruh penerimaan kas masuk rutin keluarga (Gaji suami, penghasilan istri, freelance, dividen).'
        : 'Record all regular household income streams (Salaries, side-business, freelance, dividends).',
    },
    {
      stepIndex: 3,
      id: 'step_cogs_kitchen',
      title: isId ? 'Belanja Kebutuhan Pokok Dapur & Sembako (Beras, Minyak, Telur, Lauk)' : 'Kitchen Staples & Grocery Essentials (Rice, Oil, Eggs, Proteins)',
      shortTitle: isId ? '3. Belanja Dapur' : '3. Groceries',
      desc: isId ? 'Beras 25kg, minyak, telur, gula, lauk protein minggu I-IV, bumbu, sayur, gas' : 'Rice 25kg, cooking oil, eggs, weekly proteins, veggies, spices, LPG gas',
      icon: Utensils,
      colorScheme: 'rose',
      stepType: 'items_input',
      sectionTarget: 'cogs',
      newItemDefaultSection: 'cogs',
      addButtonLabel: isId ? '+ Tambah Item Belanja Dapur' : '+ Add Grocery Item',
      newItemDefaultName: isId ? 'Belanja Bahan Makanan Dapur' : 'Grocery / Food Item',
      newItemDefaultUnit: 'Kg',
      hintText: isId
        ? 'Rincikan kebutuhan pangan primer keluarga per item terpisah (Beras, minyak, lauk mingguan, bumbu, gas, galon).'
        : 'Itemize all primary family food necessities (Rice, cooking oil, proteins, vegetables, cooking gas).',
    },
    {
      stepIndex: 4,
      id: 'step_opex_utilities',
      title: isId ? 'Tagihan Rumah Tangga, Pendidikan Anak & Kesehatan BPJS' : 'Household Utilities, Children Education & Health Insurance',
      shortTitle: isId ? '4. Tagihan & SPP' : '4. Utilities & SPP',
      desc: isId ? 'Listrik PLN, air PDAM, WiFi IndiHome, SPP sekolah, BPJS 4 jiwa, bensin' : 'PLN power, PDAM water, home broadband, school tuition, health insurance, fuel',
      icon: Receipt,
      colorScheme: 'indigo',
      stepType: 'items_input',
      sectionTarget: 'opex',
      newItemDefaultSection: 'opex',
      addButtonLabel: isId ? '+ Tambah Pos Tagihan' : '+ Add Utility Item',
      newItemDefaultName: isId ? 'Tagihan Rutin / Pendidikan' : 'Household Utility / School Line',
      newItemDefaultUnit: 'Bln',
      hintText: isId
        ? 'Alokasikan tagihan wajib bulanan: listrik, air, internet WiFi, SPP anak, BPJS keluarga, dan transportasi.'
        : 'Allocate fixed monthly bills: power, water, broadband, school tuition, insurance, and commuting fuel.',
    },
    {
      stepIndex: 5,
      id: 'step_debt_installments',
      title: isId ? 'Cicilan Kewajiban (KPR Rumah BTN, Kredit Motor Vario & Gadget)' : 'Debt Obligations (Home Mortgage, Vehicle Installment & Electronics)',
      shortTitle: isId ? '5. Cicilan Hutang' : '5. Debt & KPR',
      desc: isId ? 'KPR rumah Bank BTN, angsuran motor leasing, paylater gadget (Maks 30% DTI)' : 'Home mortgage, motorcycle installment, device paylater (Max 30% DTI)',
      icon: CreditCard,
      colorScheme: 'purple',
      stepType: 'items_input',
      sectionTarget: 'debt_receivable',
      newItemDefaultSection: 'debt_receivable',
      addButtonLabel: isId ? '+ Tambah Pos Cicilan' : '+ Add Debt Line',
      newItemDefaultName: isId ? 'Cicilan Pinjaman / KPR' : 'Debt Repayment / Mortgage Line',
      newItemDefaultUnit: 'Bln',
      hintText: isId
        ? 'Daftarkan seluruh kewajiban angsuran bulanan (KPR rumah, kredit kendaraan, cicilan paylater).'
        : 'Register all monthly loan repayments (Mortgage, vehicle loans, consumer installments).',
    },
    {
      stepIndex: 6,
      id: 'step_capex_savings',
      title: isId ? 'Dana Darurat, Tabungan Emas, Reksadana & Zakat / Sedekah' : 'Emergency Fund, Gold Savings, Mutual Funds & Zakat Charity',
      shortTitle: isId ? '6. Tabungan' : '6. Savings & Zakat',
      desc: isId ? 'Alokasi dana darurat, tabungan emas Pegadaian, reksadana, zakat 2.5% & sedekah' : 'Emergency reserve, physical gold, mutual funds, statutory zakat & charity',
      icon: PiggyBank,
      colorScheme: 'emerald',
      stepType: 'items_input',
      sectionTarget: 'capex_equity',
      newItemDefaultSection: 'capex_equity',
      addButtonLabel: isId ? '+ Tambah Pos Tabungan / Zakat' : '+ Add Savings Line',
      newItemDefaultName: isId ? 'Tabungan / Zakat / Investasi' : 'Savings / Zakat Allocation',
      newItemDefaultUnit: 'Bln',
      hintText: isId
        ? 'Alokasikan minimal 15-20% pendapatan untuk dana darurat, emas, investasi masa depan, dan kewajiban zakat.'
        : 'Allocate at least 15-20% into emergency reserves, gold, investment portfolios, and zakat charity.',
    },
    {
      stepIndex: 7,
      id: 'step_summary_personal',
      title: isId ? 'Ringkasan Anggaran Keluarga Sehat, Valuasi Aset & Ekspor PDF' : 'Family Financial Health Summary, Asset Valuation & PDF Statement',
      shortTitle: isId ? '7. Ringkasan' : '7. Summary',
      desc: isId ? 'Analisis aturan 50/30/20, saldo kas bebas seimbang, valuasi aset & cetak PDF' : '50/30/20 rule analysis, balanced zero-based cash, asset valuation & PDF export',
      icon: FileText,
      colorScheme: 'blue',
      stepType: 'summary',
    },
  ];
}
