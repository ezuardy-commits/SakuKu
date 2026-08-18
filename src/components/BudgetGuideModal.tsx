import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatRupiah } from '../lib/formatters';
import {
  BUSINESS_BUDGET_TEMPLATES,
  PERSONAL_BUDGET_TEMPLATES,
  BusinessBudgetTemplate,
  TemplateBudgetItem,
} from '../lib/budgetTemplates';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function createJsPdfDoc(options: any): jsPDF {
  const Constructor: any = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default || jsPDF;
  return new Constructor(options);
}
import {
  X,
  BookOpen,
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  User,
  Store,
  CreditCard,
  Layers,
  HelpCircle,
  Calendar,
  PieChart,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  Utensils,
  Briefcase,
  Wrench,
  Package,
  Clock,
  Lightbulb,
  WalletCards,
  ArrowUpRight,
  Filter,
  Calculator,
  Bell,
  FileText,
  BarChart3,
} from 'lucide-react';

interface BudgetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'personal' | 'business';
  initialMonth?: number;
  initialYear?: number;
  onUseTemplate?: (templateId: string, monthIndex?: number, year?: number) => void;
}

const MONTH_NAMES_ID = [
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

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const BudgetGuideModal: React.FC<BudgetGuideModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialMonth,
  initialYear,
  onUseTemplate,
}) => {
  const { language } = useLanguage();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'sample' | 'steps' | 'item_catalog'>('sample');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('fnb_culinary');
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('personal_family');

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (initialMonth !== undefined && initialMonth >= 0 && initialMonth <= 11) {
      return initialMonth;
    }
    return new Date().getMonth();
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return initialYear !== undefined ? initialYear : (new Date().getFullYear() || 2026);
  });
  
  // Step-by-step interactive inspection state
  const [simulationStep, setSimulationStep] = useState<number>(1);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [expandedStepId, setExpandedStepId] = useState<number | null>(0);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [selectedDetailItemId, setSelectedDetailItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPersonal = mode === 'personal';

  // Get active template object
  const currentTemplate: BusinessBudgetTemplate = useMemo(() => {
    if (isPersonal) {
      return (
        PERSONAL_BUDGET_TEMPLATES.find((t) => t.id === selectedPersonalId) ||
        PERSONAL_BUDGET_TEMPLATES[0]
      );
    } else {
      return (
        BUSINESS_BUDGET_TEMPLATES.find((t) => t.id === selectedBusinessId) ||
        BUSINESS_BUDGET_TEMPLATES[0]
      );
    }
  }, [isPersonal, selectedPersonalId, selectedBusinessId]);

  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthNameStr = MONTH_NAMES_ID[selectedMonth];
  const monthShortStr = MONTH_SHORT_ID[selectedMonth];
  const monthNum = selectedMonth + 1;

  // Helper to convert any template planned date string (e.g. '01 Ags', '15 Ags') to match selectedMonth
  const getAdjustedPlannedDate = (rawStr: string): string => {
    const match = rawStr.match(/(\d+)/);
    const day = match ? parseInt(match[1], 10) : 1;
    const safeDay = Math.min(Math.max(1, day), daysInSelectedMonth);
    return `${String(safeDay).padStart(2, '0')} ${monthShortStr}`;
  };

  // Transform items for the selected month to reflect 1-year continuous dummy data & monthly seasonality
  const dynamicTemplateItems: TemplateBudgetItem[] = useMemo(() => {
    return currentTemplate.items.map((it) => {
      // 1. Dynamic Dates matching selected month
      let plannedDates: string[] = [];
      if (it.plannedDates && it.plannedDates.length > 0) {
        plannedDates = it.plannedDates.map(getAdjustedPlannedDate);
      } else if (it.plannedDate) {
        plannedDates = [getAdjustedPlannedDate(it.plannedDate)];
      } else {
        plannedDates = [`01 ${monthShortStr}`];
      }
      const plannedDate = plannedDates[0];

      // 2. Base amounts
      let unitPriceNum = parseFloat(it.unitPrice || it.plannedAmount) || 0;
      let qtyNum = parseFloat(it.qty) || 1;
      let plannedAmtNum = parseFloat(it.plannedAmount) || (unitPriceNum * qtyNum);

      // 3. Continuous items progress (Cicilan KPR, KUR Bank, Paylater, Sewa Tahunan, dsb.)
      let isContinuous = it.isContinuous;
      let continuousType = it.continuousType;
      let progressCurrent = it.progressCurrent;
      let progressTotal = it.progressTotal || 12;
      let totalPrincipal = it.totalPrincipal;
      let remainingPrincipal = it.remainingPrincipal;
      let progressNote = it.progressNote;

      if (isContinuous) {
        progressCurrent = monthNum;
        if (!totalPrincipal && plannedAmtNum > 0) {
          totalPrincipal = plannedAmtNum * progressTotal;
        }
        if (totalPrincipal) {
          remainingPrincipal = Math.max(0, totalPrincipal - (plannedAmtNum * progressCurrent));
          progressNote = `Bulan ke-${progressCurrent} dari ${progressTotal} Bulan • Sisa Pokok: ${formatRupiah(remainingPrincipal)} • Status: Lancar (Cicilan Ke-${progressCurrent})`;
        }
      }

      // 4. Month-specific seasonal adjustments (e.g. THR in April / Month 3, Back-to-school in July / Month 6, Year-End bonus in Dec / Month 11)
      if (isPersonal) {
        // April (Month 3): Suami / Istri THR & Ramadan
        if (selectedMonth === 3) {
          if (it.categoryName.toLowerCase().includes('gaji') || it.id === 'pf_rev_1') {
            unitPriceNum = 19000000; // Gaji Pokok + THR
            plannedAmtNum = 19000000;
          } else if (it.categoryName.toLowerCase().includes('sembako') || it.categoryName.toLowerCase().includes('lauk') || it.categoryName.toLowerCase().includes('kebutuhan')) {
            plannedAmtNum = Math.round(plannedAmtNum * 1.25);
            unitPriceNum = Math.round(plannedAmtNum / (qtyNum || 1));
          } else if (it.categoryName.toLowerCase().includes('sedekah') || it.categoryName.toLowerCase().includes('zakat')) {
            plannedAmtNum = 4800000; // Zakat Fitrah & Maal + Sedekah
            unitPriceNum = 4800000;
          }
        }
        // July (Month 6): School registration / Back-to-school
        if (selectedMonth === 6 && (it.categoryName.toLowerCase().includes('spp') || it.categoryName.toLowerCase().includes('sekolah') || it.categoryName.toLowerCase().includes('les'))) {
          plannedAmtNum = Math.round(plannedAmtNum * 1.5);
          unitPriceNum = plannedAmtNum;
        }
        // December (Month 11): Year-end freelance & bonus
        if (selectedMonth === 11 && (it.categoryName.toLowerCase().includes('freelance') || it.categoryName.toLowerCase().includes('bonus') || it.categoryName.toLowerCase().includes('dividen'))) {
          plannedAmtNum = Math.round(plannedAmtNum * 1.3);
          unitPriceNum = plannedAmtNum;
        }
      } else {
        // Business seasonal variations
        // April (Month 3): Ramadan & Eid sales boost
        if (selectedMonth === 3) {
          if (it.section === 'revenue') {
            plannedAmtNum = Math.round(plannedAmtNum * 1.25);
            unitPriceNum = Math.round(plannedAmtNum / (qtyNum || 1));
          } else if (it.section === 'cogs') {
            plannedAmtNum = Math.round(plannedAmtNum * 1.2);
            unitPriceNum = Math.round(plannedAmtNum / (qtyNum || 1));
          } else if (it.categoryName.toLowerCase().includes('gaji') || it.categoryName.toLowerCase().includes('thr')) {
            plannedAmtNum = Math.round(plannedAmtNum * 1.8);
            unitPriceNum = Math.round(plannedAmtNum / (qtyNum || 1));
          }
        }
        // December (Month 11): Holiday peak
        if (selectedMonth === 11) {
          if (it.section === 'revenue') {
            plannedAmtNum = Math.round(plannedAmtNum * 1.2);
            unitPriceNum = Math.round(plannedAmtNum / (qtyNum || 1));
          }
        }
      }

      return {
        ...it,
        plannedDate,
        plannedDates,
        qty: String(qtyNum),
        unitPrice: String(unitPriceNum),
        plannedAmount: String(plannedAmtNum),
        isContinuous,
        continuousType,
        progressCurrent,
        progressTotal,
        totalPrincipal,
        remainingPrincipal,
        progressNote,
      };
    });
  }, [currentTemplate, selectedMonth, selectedYear, isPersonal, daysInSelectedMonth, monthShortStr, monthNum]);

  // Financial calculations for active template
  const templateFinancials = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalOPEX = 0;
    let totalDebt = 0;
    let totalCapexEquity = 0;

    dynamicTemplateItems.forEach((it) => {
      const amt = parseFloat(it.plannedAmount) || 0;
      if (it.section === 'revenue' || it.itemType === 'income') {
        totalRevenue += amt;
      } else if (it.section === 'cogs') {
        totalCOGS += amt;
      } else if (it.section === 'opex') {
        totalOPEX += amt;
      } else if (it.section === 'debt_receivable') {
        totalDebt += amt;
      } else if (it.section === 'capex_equity') {
        totalCapexEquity += amt;
      }
    });

    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const operatingIncome = grossProfit - totalOPEX;
    const operatingMarginPercent = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;
    const netFreeCash = operatingIncome - totalDebt - totalCapexEquity;

    return {
      totalRevenue,
      totalCOGS,
      totalOPEX,
      totalDebt,
      totalCapexEquity,
      totalExpense: totalCOGS + totalOPEX + totalDebt + totalCapexEquity,
      grossProfit,
      grossMarginPercent,
      operatingIncome,
      operatingMarginPercent,
      netFreeCash,
    };
  }, [dynamicTemplateItems]);

  // Grouped items
  const revenueItems = dynamicTemplateItems.filter((i) => i.section === 'revenue');
  const cogsItems = dynamicTemplateItems.filter((i) => i.section === 'cogs');
  const opexItems = dynamicTemplateItems.filter((i) => i.section === 'opex');
  const debtItems = dynamicTemplateItems.filter((i) => i.section === 'debt_receivable');
  const capexItems = dynamicTemplateItems.filter((i) => i.section === 'capex_equity');

  // Filtered items for item catalog
  const filteredCatalogItems = useMemo(() => {
    return dynamicTemplateItems.filter((it) => {
      const matchSearch =
        it.categoryName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        (it.reminderNote || '').toLowerCase().includes(itemSearchQuery.toLowerCase());
      const matchSection =
        selectedSectionFilter === 'all' || it.section === selectedSectionFilter;
      return matchSearch && matchSection;
    });
  }, [dynamicTemplateItems, itemSearchQuery, selectedSectionFilter]);

  // Step definitions with linked items
  const stepsData = useMemo(() => {
    if (isPersonal) {
      return [
        {
          stepNumber: 1,
          title: language === 'id' ? 'Tentukan Periode (Selalu Dimulai Tanggal 1) & Target Zero-Based' : 'Set Period (Starts on 1st) & Zero-Based Target',
          desc: language === 'id'
            ? 'Periode anggaran selalu dimulai dari Tanggal 1 pada setiap bulan (misal tgl 01 s/d 31). Terapkan filosofi Zero-Based Budgeting: setiap rupiah yang masuk harus dialokasikan secara spesifik ke pos kebutuhan, kewajiban, atau tabungan.'
            : 'Budget periods always start on the 1st of each month (01 to 30/31). Allocate every earned currency unit to specific needs, debt, or savings.',
          badge: language === 'id' ? 'Langkah 1: Perencanaan Awal' : 'Step 1: Planning',
          icon: '📅',
          sectionKey: 'setup',
          sampleItemsCount: currentTemplate.items.length,
          bestPractice: 'Periode anggaran selalu dimulai dari tanggal 1 agar siklus pengeluaran dan pemasukan sinkron dengan pembukuan bulanan.',
          linkedItems: [],
        },
        {
          stepNumber: 2,
          title: language === 'id' ? 'Daftarkan Seluruh Sumber Pemasukan Pasti' : 'List All Fixed & Variable Incomes',
          desc: language === 'id'
            ? 'Masukkan Take Home Pay (Gaji pokok setelah potongan pajak/BPJS), penghasilan pasangan, pendapatan freelance, dan hasil dividen/investasi pasif.'
            : 'Record primary salary, spouse income, freelance projects, and investment dividends.',
          badge: language === 'id' ? 'Langkah 2: Pendapatan' : 'Step 2: Income',
          icon: '💵',
          sectionKey: 'revenue',
          sampleItemsCount: revenueItems.length,
          bestPractice: 'Hanya catat pemasukan yang 95% pasti diterima. Untuk bonus tidak tetap, alokasikan di luar pos pengeluaran rutin.',
          linkedItems: revenueItems,
        },
        {
          stepNumber: 3,
          title: language === 'id' ? 'Alokasikan Kebutuhan Pokok Hidup (Maksimal 50%)' : 'Essential Living Needs (Needs 50%)',
          desc: language === 'id'
            ? 'Rinci belanja sembako beras/minyak/telur, protein pasar (daging/ayam/ikan), sayur & bumbu, gas LPG, galon air, serta perlengkapan mandi & kebersihan rumah.'
            : 'Detail staple groceries, fresh market proteins, vegetables, cooking gas, gallons, and sanitation.',
          badge: language === 'id' ? 'Langkah 3: Kebutuhan Pokok' : 'Step 3: Essentials',
          icon: '🛒',
          sectionKey: 'cogs',
          sampleItemsCount: cogsItems.length,
          bestPractice: 'Belanja bahan dapur secara mingguan (meal prep) untuk menghemat 25-35% daripada jajan harian.',
          linkedItems: cogsItems,
        },
        {
          stepNumber: 4,
          title: language === 'id' ? 'Rinci Tagihan Rutin, SPP, Kesehatan & Kendaraan' : 'Recurring Utilities, Education & Transport',
          desc: language === 'id'
            ? 'Catat tagihan listrik PLN, air PDAM, WiFi fiber rumah, kuota data HP keluarga, SPP & les anak, bensin, servis motor/mobil, dan BPJS Kesehatan sekeluarga.'
            : 'Record electricity, water, internet, school tuition, fuel, vehicle service, and family healthcare.',
          badge: language === 'id' ? 'Langkah 4: Beban Rutin (OPEX)' : 'Step 4: Utilities & Ops',
          icon: '🧾',
          sectionKey: 'opex',
          sampleItemsCount: opexItems.length,
          bestPractice: 'Pasang pengingat tanggal jatuh tempo otomatis (Reminder) agar terhindar dari denda keterlambatan.',
          linkedItems: opexItems,
        },
        {
          stepNumber: 5,
          title: language === 'id' ? 'Catat Cicilan Hutang & Jadwal Jatuh Tempo' : 'Debt Repayments & Due Dates',
          desc: language === 'id'
            ? 'Masukkan cicilan KPR hunian, kredit mobil/motor, serta pelunasan penuh tagihan kartu kredit atau paylater. Batasi total cicilan di bawah 30% pendapatan.'
            : 'Record mortgage, vehicle leasing, and full settlement of credit cards or paylaters (under 30% DTI).',
          badge: language === 'id' ? 'Langkah 5: Cicilan & Hutang' : 'Step 5: Debt & Loans',
          icon: '💳',
          sectionKey: 'debt_receivable',
          sampleItemsCount: debtItems.length,
          bestPractice: 'Prioritaskan strategi Debt Snowball/Avalanche: bayar cicilan bunga tertinggi terlebih dahulu.',
          linkedItems: debtItems,
        },
        {
          stepNumber: 6,
          title: language === 'id' ? 'Sisihkan Dana Darurat, Investasi & Zakat (Pay Yourself First)' : 'Emergency Fund, Investments & Giving',
          desc: language === 'id'
            ? 'Kunci tabungan 15-20% di awal bulan ke instrumen likuid (Rekening Kas terpisah / Reksadana Pasar Uang / Emas Antam), serta sedekah & zakat maal.'
            : 'Lock 15-20% savings early into liquid emergency funds, gold, mutual funds, and charitable giving.',
          badge: language === 'id' ? 'Langkah 6: Tabungan & Aset' : 'Step 6: Savings & Assets',
          icon: '🛡️',
          sectionKey: 'capex_equity',
          sampleItemsCount: capexItems.length,
          bestPractice: 'Targetkan minimal 6 bulan pengeluaran rutin sebagai Dana Darurat sebelum berinvestasi agresif.',
          linkedItems: capexItems,
        },
      ];
    } else {
      return [
        {
          stepNumber: 1,
          title: language === 'id' ? 'Pilih Model Usaha & Periode Anggaran (Selalu Dimulai Tanggal 1)' : 'Select Business Model & Period (Starts on 1st)',
          desc: language === 'id'
            ? 'Periode pembukuan dan penganggaran usaha selalu dimulai dari Tanggal 1 setiap bulan kalender (01 s/d 30/31). Pilih salah satu dari 6 model usaha nyata yang sesuai: F&B Kuliner, Swalayan Ritel, Agensi Digital/IT, Bengkel Otomotif, Konveksi Pakaian, atau Standar UMKM SAK EMKM.'
            : 'Business budgeting and reporting periods always start on the 1st of each month. Choose from 6 verified realistic business models: F&B, Retail Store, Digital Agency, Workshop, or Garment.',
          badge: language === 'id' ? 'Langkah 1: Identifikasi Usaha' : 'Step 1: Setup',
          icon: '🏬',
          sectionKey: 'setup',
          sampleItemsCount: currentTemplate.items.length,
          bestPractice: 'Periode anggaran wajib dimulai dari tanggal 1 untuk menjaga standarisasi laporan keuangan, penutupan kasir bulanan, dan rekonsiliasi bank.',
          linkedItems: [],
        },
        {
          stepNumber: 2,
          title: language === 'id' ? 'Proyeksikan Target Omzet (Multi-Channel Revenue)' : 'Project Sales Target (Revenue Channels)',
          desc: language === 'id'
            ? 'Hitung target penjualan harian kasir offline, pesanan online (GrabFood/Shopee/WA), pesanan partai besar/katering, serta pendapatan sampingan jasa.'
            : 'Calculate daily cashier volume, online marketplaces, bulk wholesale orders, and auxiliary sales.',
          badge: language === 'id' ? 'Langkah 2: Proyeksi Omzet' : 'Step 2: Revenue Target',
          icon: '📈',
          sectionKey: 'revenue',
          sampleItemsCount: revenueItems.length,
          bestPractice: 'Gunakan rumus: Rata-rata Kunjungan/Hari × Nilai Belanja per Transaksi (Basket Size) × Hari Kerja.',
          linkedItems: revenueItems,
        },
        {
          stepNumber: 3,
          title: language === 'id' ? 'Kendalikan Harga Pokok Penjualan (HPP / COGS)' : 'Control Cost of Goods Sold (HPP / COGS)',
          desc: language === 'id'
            ? 'Anggarkan belanja bahan baku segar, kulakan stok grosir distributor, kemasan kemasan/box berlogo, gas dapur/logistik, dan upah borongan langsung.'
            : 'Budget raw ingredients, wholesale distributor stocks, custom packaging, and direct production wages.',
          badge: language === 'id' ? 'Langkah 3: HPP Bahan Baku' : 'Step 3: Cost of Goods',
          icon: '📦',
          sectionKey: 'cogs',
          sampleItemsCount: cogsItems.length,
          bestPractice: 'Pertahankan Gross Margin minimal 50-65% (F&B) atau 25-40% (Retail) agar mampu menopang beban operasional.',
          linkedItems: cogsItems,
        },
        {
          stepNumber: 4,
          title: language === 'id' ? 'Rinci Seluruh Beban Operasional Usaha (OPEX)' : 'Itemize Operating Expenses (OPEX)',
          desc: language === 'id'
            ? 'Rinci gaji seluruh tim staf (2 shift), sewa ruko/tempat strategis, listrik daya tinggi, air, WiFi fiber, POS kasir, iklan medsos Ads, dan kebersihan.'
            : 'Detail staff payroll, shophouse rent, commercial electricity, WiFi, POS software, and digital ads.',
          badge: language === 'id' ? 'Langkah 4: Beban Usaha (OPEX)' : 'Step 4: Operations',
          icon: '👥',
          sectionKey: 'opex',
          sampleItemsCount: opexItems.length,
          bestPractice: 'Batasi total OPEX di bawah 30-35% dari total omzet untuk menjaga margin laba operasional (EBITDA) tetap sehat.',
          linkedItems: opexItems,
        },
        {
          stepNumber: 5,
          title: language === 'id' ? 'Alokasikan Belanja Modal (Capex) & Cicilan Bank' : 'Allocate Capex, Equipment & Bank Loans',
          desc: language === 'id'
            ? 'Anggarkan pembelian inventaris/mesin penunjang usaha baru, cicilan pinjaman modal kerja bank (KUR), serta cadangan peremajaan aset.'
            : 'Budget new equipment, business bank loan installments (KUR), and asset renewal reserves.',
          badge: language === 'id' ? 'Langkah 5: Aset & Utang Usaha' : 'Step 5: Capex & Debt',
          icon: '🏗️',
          sectionKey: 'debt_receivable',
          sampleItemsCount: debtItems.length + capexItems.filter(c => c.section === 'capex_equity' && (c.categoryName || '').toLowerCase().includes('capex')).length,
          bestPractice: 'Pisahkan antara pengeluaran operasional rutin (Opex) dan belanja aset bernilai ekonomis panjang (Capex).',
          linkedItems: [...debtItems, ...capexItems.filter(c => (c.categoryName || '').toLowerCase().includes('capex'))],
        },
        {
          stepNumber: 6,
          title: language === 'id' ? 'Evaluasi Laba Bersih, Prive & Free Cash Flow' : 'Evaluate Net Profit, Owner Drawing & FCF',
          desc: language === 'id'
            ? 'Tinjau Sisa Kas Bebas (Free Cash Flow), tetapkan batas penarikan prive bulanan pemilik usaha, dan simpan cadangan kas di rekening bisnis.'
            : 'Review Free Cash Flow, establish disciplined owner drawings (Prive), and keep cash reserves.',
          badge: language === 'id' ? 'Langkah 6: Proforma Laba Rugi' : 'Step 6: Net Income & Prive',
          icon: '✨',
          sectionKey: 'capex_equity',
          sampleItemsCount: capexItems.length,
          bestPractice: 'Jangan campur uang pribadi dan kas bisnis. Tetapkan gaji / prive tetap bagi pemilik usaha.',
          linkedItems: capexItems,
        },
      ];
    }
  }, [isPersonal, language, currentTemplate, revenueItems, cogsItems, opexItems, debtItems, capexItems]);

  // Helper to format planned dates for PDF export
  const formatDateCell = (it: TemplateBudgetItem) => {
    if (it.plannedDates && it.plannedDates.length > 0) {
      const unique = Array.from(new Set(it.plannedDates));
      return unique.join(', ');
    }
    return it.plannedDate || `01 ${monthShortStr}`;
  };

  // Helper to render planned date badges in UI
  const renderPlannedDateBadges = (it: TemplateBudgetItem) => {
    const rawDates =
      it.plannedDates && it.plannedDates.length > 0
        ? it.plannedDates
        : it.plannedDate
        ? [it.plannedDate]
        : [`01 ${monthShortStr}`];
    const dates = Array.from(new Set(rawDates));

    if (dates.length > 1) {
      return (
        <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>📅 {dates.join(', ')}</span>
        </span>
      );
    }

    return (
      <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
        <Calendar className="w-3 h-3 shrink-0" />
        <span>📅 {dates[0]}</span>
      </span>
    );
  };

  // ==========================================
  // COMPREHENSIVE PDF GENERATION HANDLER
  // ==========================================
  const handleExportPDF = () => {
    const doc = createJsPdfDoc({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = isPersonal ? [79, 70, 229] : [37, 99, 235]; // Indigo or Blue
    const darkSlate = [15, 23, 42];

    // Header Top Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      isPersonal
        ? `LAPORAN DETAIL ANGGARAN PRIBADI & KELUARGA LENGKAP`
        : `LAPORAN DETAIL ANGGARAN & PROFORMA KEUANGAN USAHA (SAK EMKM)`,
      14,
      8.5
    );

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `BIDANG: ${currentTemplate.bidang || currentTemplate.industryTag}   |   SUB-BIDANG: ${currentTemplate.subBidang || currentTemplate.badge || currentTemplate.name}   |   ENTITAS: ${currentTemplate.businessName || currentTemplate.name}`,
      14,
      14
    );

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Periode Anggaran: 01 s/d ${daysInSelectedMonth} ${monthNameStr} ${selectedYear} (Dimulai Tgl 1) • Jadwal Rinci per Tanggal Riil • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      14,
      19
    );

    let startY = 30;

    if (isPersonal) {
      // 1. Personal Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('I. DAFTAR SUMBER PEMASUKAN / PENDAPATAN (REVENUE)', 14, startY);

      const incomeRows: any[] = revenueItems.map((i, idx) => [
        `#${idx + 1}`,
        formatDateCell(i),
        i.categoryName,
        `${i.qty || 1} ${i.unit || 'Bln'}`,
        formatRupiah(parseFloat(i.unitPrice || i.plannedAmount)),
        formatRupiah(parseFloat(i.plannedAmount)),
        i.reminderNote || 'Pemasukan rutin bulanan',
      ]);

      // Sub-rekap row for income
      incomeRows.push([
        '',
        '',
        'SUB-TOTAL PENDAPATAN BERSIH (REKAP SUB)',
        `${revenueItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalRevenue),
        '100% Target Pemasukan Diterima',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Sumber Pendapatan / Pemasukan', 'Volume', 'Harga Satuan', 'Total Harga', 'Keterangan / Pengingat']],
        body: incomeRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('II. DAFTAR POS ALOKASI PENGELUARAN LENGKAP & REKAP SUB', 14, startY);

      const allExpenseRows: any[] = [];

      // 1. Kebutuhan Pokok
      allExpenseRows.push([{
        content: `1. KEBUTUHAN POKOK & BELANJA DAPUR (Needs 50%) — SUB-TOTAL: ${formatRupiah(templateFinancials.totalCOGS)}`,
        colSpan: 7,
        styles: { fillColor: [238, 242, 255], fontStyle: 'bold', textColor: [67, 56, 202] }
      }]);
      cogsItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          formatRupiah(parseFloat(it.plannedAmount)),
          it.reminderNote || 'Belanja kebutuhan pokok',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL KEBUTUHAN POKOK',
        `${cogsItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalCOGS),
        'Maksimal 50% dari Pendapatan',
      ]);

      // 2. Tagihan Rutin & Operasional
      allExpenseRows.push([{
        content: `2. TAGIHAN RUTIN, PENDIDIKAN & KESEHATAN (Utilities & Ops) — SUB-TOTAL: ${formatRupiah(templateFinancials.totalOPEX)}`,
        colSpan: 7,
        styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [51, 65, 85] }
      }]);
      opexItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          formatRupiah(parseFloat(it.plannedAmount)),
          it.reminderNote || 'Tagihan rutin & operasional',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL TAGIHAN RUTIN & OPS',
        `${opexItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalOPEX),
        'Operasional Rutin Bulanan',
      ]);

      // 3. Cicilan & Hutang
      allExpenseRows.push([{
        content: `3. CICILAN & KEWAJIBAN HUTANG (Debt Repayments) — SUB-TOTAL: ${formatRupiah(templateFinancials.totalDebt)}`,
        colSpan: 7,
        styles: { fillColor: [254, 242, 242], fontStyle: 'bold', textColor: [185, 28, 28] }
      }]);
      debtItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          formatRupiah(parseFloat(it.plannedAmount)),
          it.reminderNote || 'Jatuh tempo cicilan',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL CICILAN HUTANG',
        `${debtItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalDebt),
        'Maksimal 20-30% Debt-to-Income',
      ]);

      // 4. Tabungan & Dana Darurat
      allExpenseRows.push([{
        content: `4. DANA DARURAT, INVESTASI & ZAKAT (Savings & Assets) — SUB-TOTAL: ${formatRupiah(templateFinancials.totalCapexEquity)}`,
        colSpan: 7,
        styles: { fillColor: [236, 253, 245], fontStyle: 'bold', textColor: [4, 120, 87] }
      }]);
      capexItems.forEach((it, idx) => {
        allExpenseRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          formatRupiah(parseFloat(it.plannedAmount)),
          it.reminderNote || 'Alokasi tabungan masa depan',
        ]);
      });
      allExpenseRows.push([
        '',
        '',
        'REKAP SUB: TOTAL TABUNGAN & INVESTASI',
        `${capexItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalCapexEquity),
        'Minimal 15-20% Tabungan / Investasi',
      ]);

      // GRAND TOTAL REKAP ROWS
      allExpenseRows.push([
        '',
        'REKAP',
        'REKAP TOTAL SELURUH PENGELUARAN & TABUNGAN',
        `${currentTemplate.items.length - revenueItems.length} Pos`,
        '-',
        formatRupiah(templateFinancials.totalExpense),
        'Total Alokasi 100% Zero-Based',
      ]);

      allExpenseRows.push([
        '',
        'SALDO',
        'REKAP TOTAL: SISA KAS BERSIH (NET CASH REMAINING)',
        '-',
        '-',
        formatRupiah(templateFinancials.netFreeCash),
        'Target Saldo Seimbang (Zero-Based Budgeting)',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Pos Pengeluaran & Rincian Item', 'Volume', 'Harga Satuan', 'Total Harga', 'Keterangan / Pengingat']],
        body: allExpenseRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // SECTION III FOR PERSONAL: RESUME / RINGKASAN EKSEKUTIF PROFORMA ANGGARAN & ARUS KAS PRIBADI
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('III. RESUME / RINGKASAN EKSEKUTIF PROFORMA ANGGARAN & ARUS KAS', 14, startY);

      const totalRev = templateFinancials.totalRevenue || 1;
      const resumeRowsPersonal: any[] = [
        [
          '1',
          'Target Pemasukan & Gaji (Total Inflow)',
          formatRupiah(templateFinancials.totalRevenue),
          '100.0%',
          'Total Sumber Penerimaan Kas Pemasukan Bulanan',
        ],
        [
          '2',
          '(-) Kebutuhan Pokok Hidup (Dapur & Sembako - Needs)',
          `(${formatRupiah(templateFinancials.totalCOGS)})`,
          `${((templateFinancials.totalCOGS / totalRev) * 100).toFixed(1)}%`,
          'Alokasi Kebutuhan Primer (Maksimal 50% Rule 50/30/20)',
        ],
        [
          '(=)',
          'SISA KAS SETELAH KEBUTUHAN POKOK',
          formatRupiah(templateFinancials.grossProfit),
          `${templateFinancials.grossMarginPercent.toFixed(1)}%`,
          'Saldo Kas Tersisa Setelah Kebutuhan Pokok Terpenuhi',
        ],
        [
          '3',
          '(-) Biaya Hidup Rutin, Tagihan & Transport (OPEX)',
          `(${formatRupiah(templateFinancials.totalOPEX)})`,
          `${((templateFinancials.totalOPEX / totalRev) * 100).toFixed(1)}%`,
          'Beban Tagihan Rutin, Pendidikan & Operasional Keluarga',
        ],
        [
          '(=)',
          'SISA DANA BEBAS (CASH SURPLUS)',
          formatRupiah(templateFinancials.operatingIncome),
          `${templateFinancials.operatingMarginPercent.toFixed(1)}%`,
          'Surplus Kas Bebas Sebelum Tabungan & Cicilan',
        ],
        [
          '4',
          '(-) Alokasi Tabungan, Investasi & Sedekah',
          `(${formatRupiah(templateFinancials.totalCapexEquity)})`,
          `${((templateFinancials.totalCapexEquity / totalRev) * 100).toFixed(1)}%`,
          'Alokasi Dana Darurat & Tabungan Masa Depan (Min 15-20%)',
        ],
        [
          '5',
          '(-) Cicilan Utang, KPR Rumah & Pinjaman',
          `(${formatRupiah(templateFinancials.totalDebt)})`,
          `${((templateFinancials.totalDebt / totalRev) * 100).toFixed(1)}%`,
          'Kewajiban Angsuran Hutang (Batas Aman Max 20-30% DTI)',
        ],
        [
          '(=)',
          'REKAP TOTAL SELURUH PENGELUARAN & TABUNGAN',
          `(${formatRupiah(templateFinancials.totalExpense)})`,
          `${((templateFinancials.totalExpense / totalRev) * 100).toFixed(1)}%`,
          'Total Seluruh Alokasi Pengeluaran 100% Zero-Based',
        ],
        [
          '(=)',
          'ESTIMASI SISA SALDO KAS BERSIH BULANAN (NET CASH)',
          formatRupiah(templateFinancials.netFreeCash),
          `${((templateFinancials.netFreeCash / totalRev) * 100).toFixed(1)}%`,
          templateFinancials.netFreeCash >= 0
            ? 'Surplus Kas Bersih (Rencana Anggaran Sehat & Berkelanjutan)'
            : 'Perhatian: Rencana Anggaran Mengalami Defisit!',
        ],
      ];

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Pos Ringkasan Proforma Anggaran & Arus Kas', 'Nominal (Rp)', 'Porsi (%)', 'Status & Keterangan Analisa']],
        body: resumeRowsPersonal,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 95, fontStyle: 'bold' },
          2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 94, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rowIdx = data.row.index;
            if (rowIdx === 0 && data.column.index === 2) {
              data.cell.styles.textColor = [16, 185, 129];
            }
            if (rowIdx === 2) {
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.textColor = [4, 120, 87];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 4) {
              data.cell.styles.fillColor = [238, 242, 255];
              data.cell.styles.textColor = [67, 56, 202];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 7) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [51, 65, 85];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 8) {
              data.cell.styles.fillColor = templateFinancials.netFreeCash >= 0 ? [209, 250, 229] : [254, 226, 226];
              data.cell.styles.textColor = templateFinancials.netFreeCash >= 0 ? [6, 95, 70] : [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });
      // SECTION IV FOR PERSONAL: TABEL VALUASI ASET EMAS, TABUNGAN & INVENTARIS KELUARGA
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('IV. TABEL VALUASI ASET INVESTASI EMAS, TABUNGAN & INVENTARIS KELUARGA', 14, startY);

      const personalAssetRows: any[] = [
        ['1', 'Logam Mulia Emas Batangan Antam (Investasi)', '10 Gram', formatRupiah(1450000), formatRupiah(14500000), '+Rp 500.000 / bln', 'Aset Likuid Bebas Inflasi'],
        ['2', 'Alokasi Tabungan Dana Darurat Bank (BCA/BSI)', 'Rekening Khusus', '-', formatRupiah(25000000), '+Rp 750.000 / bln', 'Target 6 Bulan Pengeluaran'],
        ['3', 'Portofolio Reksadana Pasar Uang (Bibit/Bareksa)', 'Unit Penyertaan', '-', formatRupiah(8500000), '+Rp 400.000 / bln', 'Imbal Hasil 5-6% per Tahun'],
        ['4', 'Kendaraan Keluarga (Mobil Avanza & Motor Vario)', '2 Unit Kendaraan', '-', formatRupiah(274500000), 'Nilai Pasar Riil', 'Aset Penunjang Mobilitas'],
        ['5', 'Elektronik Rumah Tangga & Laptop Kerja', 'Paket Aset', '-', formatRupiah(31000000), 'Nilai Perolehan', 'Penunjang Produktivitas'],
        ['', 'TOTAL ESTIMASI KEKAYAAN BERSIH ASET KELUARGA', '-', '-', formatRupiah(353500000), '-', 'Kondisi Finansial Sangat Sehat'],
      ];

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Kategori Aset / Investasi Keluarga', 'Volume / Satuan', 'Harga / Gram', 'Total Valuasi Nilai (Rp)', 'Rencana Inflow RAP', 'Fungsi & Catatan Perencanaan']],
        body: personalAssetRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70, fontStyle: 'bold' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          5: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 61, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.row.index === personalAssetRows.length - 1) {
            data.cell.styles.fillColor = [238, 242, 255];
            data.cell.styles.textColor = [67, 56, 202];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    } else {
      // 2. Business SAK EMKM Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`I. PROFORMA LAPORAN ANGGARAN LABA RUGI & ARUS KAS - ${currentTemplate.businessName || currentTemplate.name}`, 14, startY);

      const bRows: any[] = [];

      // 1. REVENUE
      bRows.push([{
        content: `A. PENDAPATAN OPERASIONAL USAHA (REVENUE) — SUB-TOTAL: ${formatRupiah(templateFinancials.totalRevenue)}`,
        colSpan: 7,
        styles: { fillColor: [236, 253, 245], fontStyle: 'bold', textColor: [4, 120, 87] }
      }]);
      revenueItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Unit'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          formatRupiah(parseFloat(it.plannedAmount)),
          'Target omzet penjualan',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL OMZET PENJUALAN (REVENUE)',
        `${revenueItems.length} Saluran`,
        '-',
        formatRupiah(templateFinancials.totalRevenue),
        'Total Penerimaan Kas Usaha',
      ]);

      // 2. COGS / BAHAN BAKU
      bRows.push([{
        content: `B. BEBAN POKOK PENDAPATAN (HPP / BIAYA BAHAN BAKU) — SUB-TOTAL: (${formatRupiah(templateFinancials.totalCOGS)})`,
        colSpan: 7,
        styles: { fillColor: [254, 242, 242], fontStyle: 'bold', textColor: [185, 28, 28] }
      }]);
      cogsItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Bln'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          `(${formatRupiah(parseFloat(it.plannedAmount))})`,
          it.reminderNote || 'Belanja stok & bahan pokok',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL HARGA POKOK PENJUALAN (HPP)',
        `${cogsItems.length} Pos`,
        '-',
        `(${formatRupiah(templateFinancials.totalCOGS)})`,
        'Total Biaya Langsung Bahan Pokok',
      ]);
      bRows.push([
        '',
        'LABA',
        `REKAP SUB: LABA KOTOR (GROSS PROFIT) — Margin: ${templateFinancials.grossMarginPercent.toFixed(1)}%`,
        '-',
        '-',
        formatRupiah(templateFinancials.grossProfit),
        'Pendapatan dikurangi HPP Bahan Baku',
      ]);

      // 3. OPEX
      bRows.push([{
        content: `C. BEBAN OPERASIONAL USAHA (OPEX) — SUB-TOTAL: (${formatRupiah(templateFinancials.totalOPEX)})`,
        colSpan: 7,
        styles: { fillColor: [238, 242, 255], fontStyle: 'bold', textColor: [67, 56, 202] }
      }]);
      opexItems.forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Staf'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          `(${formatRupiah(parseFloat(it.plannedAmount))})`,
          it.reminderNote || 'Beban operasional & gaji',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL BEBAN OPERASIONAL (OPEX)',
        `${opexItems.length} Pos`,
        '-',
        `(${formatRupiah(templateFinancials.totalOPEX)})`,
        'Total Biaya Rutin Operasional',
      ]);
      bRows.push([
        '',
        'EBITDA',
        `REKAP SUB: LABA OPERASIONAL (EBITDA) — Margin: ${templateFinancials.operatingMarginPercent.toFixed(1)}%`,
        '-',
        '-',
        formatRupiah(templateFinancials.operatingIncome),
        'Laba Hasil Operasional Pokok Usaha',
      ]);

      // 4. CAPEX, CICILAN BANK & PRIVE
      bRows.push([{
        content: `D. BELANJA MODAL (CAPEX), CICILAN BANK & PRIVE — SUB-TOTAL: (${formatRupiah(templateFinancials.totalDebt + templateFinancials.totalCapexEquity)})`,
        colSpan: 7,
        styles: { fillColor: [255, 247, 237], fontStyle: 'bold', textColor: [194, 65, 12] }
      }]);
      [...debtItems, ...capexItems].forEach((it, idx) => {
        bRows.push([
          `${idx + 1}`,
          formatDateCell(it),
          it.categoryName,
          `${it.qty || 1} ${it.unit || 'Unit'}`,
          formatRupiah(parseFloat(it.unitPrice || it.plannedAmount)),
          `(${formatRupiah(parseFloat(it.plannedAmount))})`,
          it.reminderNote || 'Alokasi permodalan & cicilan',
        ]);
      });
      bRows.push([
        '',
        '',
        'REKAP SUB: TOTAL CAPEX, CICILAN & PRIVE',
        `${debtItems.length + capexItems.length} Pos`,
        '-',
        `(${formatRupiah(templateFinancials.totalDebt + templateFinancials.totalCapexEquity)})`,
        'Total Arus Kas Pembiayaan & Investasi',
      ]);

      // GRAND TOTAL REKAP
      bRows.push([
        '',
        'FCF',
        'REKAP TOTAL: SISA KAS BERSIH BEBAS (FREE CASH FLOW)',
        '-',
        '-',
        formatRupiah(templateFinancials.netFreeCash),
        'Cadangan Kas Likuid Akhir Periode Usaha',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Tgl Rencana', 'Pos Keuangan SAK EMKM', 'Volume', 'Harga Satuan', 'Total Harga', 'Keterangan / Pengingat']],
        body: bRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
          2: { cellWidth: 71, fontStyle: 'bold' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 70, fontSize: 7 },
        },
      });

      // SECTION II FOR BUSINESS: RESUME / RINGKASAN EKSEKUTIF PROFORMA LABA RUGI & ARUS KAS USAHA
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('II. RESUME / RINGKASAN EKSEKUTIF PROFORMA LABA RUGI & ARUS KAS USAHA', 14, startY);

      const totalRevBiz = templateFinancials.totalRevenue || 1;
      const resumeRowsBusiness: any[] = [
        [
          '1',
          'Target Pendapatan Penjualan / Omzet (Revenue)',
          formatRupiah(templateFinancials.totalRevenue),
          '100.0%',
          'Total Target Penerimaan Kas Omzet Penjualan Usaha',
        ],
        [
          '2',
          '(-) Beban Pokok Pendapatan (HPP / Biaya Bahan Pokok)',
          `(${formatRupiah(templateFinancials.totalCOGS)})`,
          `${((templateFinancials.totalCOGS / totalRevBiz) * 100).toFixed(1)}%`,
          'Total Biaya Langsung Bahan Baku & Pokok Produksi',
        ],
        [
          '(=)',
          'PROYEKSI LABA KOTOR (GROSS PROFIT)',
          formatRupiah(templateFinancials.grossProfit),
          `${templateFinancials.grossMarginPercent.toFixed(1)}%`,
          'Margin Laba Kotor Usaha (Gross Profit Margin)',
        ],
        [
          '3',
          '(-) Total Beban Operasional Usaha (OPEX & Gaji)',
          `(${formatRupiah(templateFinancials.totalOPEX)})`,
          `${((templateFinancials.totalOPEX / totalRevBiz) * 100).toFixed(1)}%`,
          'Biaya Gaji, Sewa Tempat, Utilitas, Pemasaran & Logistik',
        ],
        [
          '(=)',
          'PROYEKSI LABA OPERASIONAL (EBIT / EBITDA)',
          formatRupiah(templateFinancials.operatingIncome),
          `${templateFinancials.operatingMarginPercent.toFixed(1)}%`,
          'Laba Bersih Operasional Pokok Usaha Sebelum Pajak & Bunga',
        ],
        [
          '4',
          '(-) Belanja Modal (Capex / Aset Usaha) & Prive',
          `(${formatRupiah(templateFinancials.totalCapexEquity)})`,
          `${((templateFinancials.totalCapexEquity / totalRevBiz) * 100).toFixed(1)}%`,
          'Alokasi Pembelian Alat/Mesin, Prive Pemilik & Pajak',
        ],
        [
          '5',
          '(-) Cicilan Pinjaman Bank KUR & Utang Usaha',
          `(${formatRupiah(templateFinancials.totalDebt)})`,
          `${((templateFinancials.totalDebt / totalRevBiz) * 100).toFixed(1)}%`,
          'Angsuran Pokok & Bunga Pinjaman Modal Kerja Usaha',
        ],
        [
          '(=)',
          'REKAP TOTAL SELURUH PENGELUARAN USAHA',
          `(${formatRupiah(templateFinancials.totalExpense)})`,
          `${((templateFinancials.totalExpense / totalRevBiz) * 100).toFixed(1)}%`,
          'Total Seluruh Beban, Biaya Pokok, OPEX, Capex & Cicilan',
        ],
        [
          '(=)',
          'SISA KAS BERSIH BEBAS FINAL (FREE CASH FLOW)',
          formatRupiah(templateFinancials.netFreeCash),
          `${((templateFinancials.netFreeCash / totalRevBiz) * 100).toFixed(1)}%`,
          templateFinancials.netFreeCash >= 0
            ? 'Cadangan Kas Likuid Bebas Akhir Periode Usaha (Surplus)'
            : 'Perhatian: Defisit Arus Kas! Perlu Efisiensi / Tambahan Modal',
        ],
      ];

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Pos Laporan Laba Rugi Proforma & Arus Kas (SAK EMKM)', 'Nominal (Rp)', 'Margin (%)', 'Status & Keterangan Analisa Bisnis']],
        body: resumeRowsBusiness,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 95, fontStyle: 'bold' },
          2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 94, fontSize: 7 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rowIdx = data.row.index;
            if (rowIdx === 0 && data.column.index === 2) {
              data.cell.styles.textColor = [16, 185, 129];
            }
            if (rowIdx === 2) {
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.textColor = [4, 120, 87];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 4) {
              data.cell.styles.fillColor = [238, 242, 255];
              data.cell.styles.textColor = [67, 56, 202];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 7) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [51, 65, 85];
              data.cell.styles.fontStyle = 'bold';
            }
            if (rowIdx === 8) {
              data.cell.styles.fillColor = templateFinancials.netFreeCash >= 0 ? [209, 250, 229] : [254, 226, 226];
              data.cell.styles.textColor = templateFinancials.netFreeCash >= 0 ? [6, 95, 70] : [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // SECTION III FOR BUSINESS: TABEL PERHITUNGAN MUTASI PERSEDIAAN STOK & VALUASI INVENTORI USAHA
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('III. TABEL PERHITUNGAN MUTASI PERSEDIAAN STOK & VALUASI INVENTORI USAHA', 14, startY);

      const inventoryCalculationRows: any[] = [];
      let totalBeginningInventoryValuation = 0;
      let totalBudgetedInflowValuation = 0;
      let totalProjectedUsageValuation = 0;
      let totalEndingInventoryValuation = 0;

      cogsItems.forEach((it, idx) => {
        const itemAmount = parseFloat(it.plannedAmount) || 0;
        const plannedQty = parseFloat(it.qty) || 1;
        const unitCost = parseFloat(it.unitPrice) || (itemAmount / plannedQty);
        const unitName = it.unit || 'Unit';

        const beginningQty = Math.round(plannedQty * 0.2 * 10) / 10;
        const inflowQty = plannedQty;
        const usageQty = Math.round(plannedQty * 0.85 * 10) / 10;
        const endingQty = Math.round((beginningQty + inflowQty - usageQty) * 10) / 10;

        const beginningVal = beginningQty * unitCost;
        const inflowVal = inflowQty * unitCost;
        const usageVal = usageQty * unitCost;
        const endingVal = endingQty * unitCost;

        totalBeginningInventoryValuation += beginningVal;
        totalBudgetedInflowValuation += inflowVal;
        totalProjectedUsageValuation += usageVal;
        totalEndingInventoryValuation += endingVal;

        inventoryCalculationRows.push([
          `${idx + 1}`,
          it.categoryName,
          `${beginningQty} ${unitName}`,
          `+${inflowQty} ${unitName}`,
          `-${usageQty} ${unitName}`,
          `${endingQty} ${unitName}`,
          formatRupiah(unitCost),
          formatRupiah(endingVal),
          'Stok Aman (Siap Operasional)',
        ]);
      });

      inventoryCalculationRows.push([
        '',
        'TOTAL VALUASI ASET PERSEDIAAN STOK (ENDING INVENTORY)',
        formatRupiah(totalBeginningInventoryValuation),
        formatRupiah(totalBudgetedInflowValuation),
        `(${formatRupiah(totalProjectedUsageValuation)})`,
        '-',
        '-',
        formatRupiah(totalEndingInventoryValuation),
        'Total Aset Lancar Persediaan',
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['No', 'Nama Item Stok / Bahan Baku', 'Stok Awal', 'Rencana Masuk (RAP)', 'Proyeksi Pakai', 'Stok Akhir', 'HPP Satuan', 'Valuasi Akhir (Rp)', 'Status & Kontrol Stok']],
        body: inventoryCalculationRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 62, fontStyle: 'bold' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 26, halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
          4: { cellWidth: 24, halign: 'center', textColor: [225, 29, 72] },
          5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 27, halign: 'right' },
          7: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [15, 118, 110] },
          8: { cellWidth: 46, fontSize: 6.5 },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.row.index === inventoryCalculationRows.length - 1) {
            data.cell.styles.fillColor = [204, 251, 241];
            data.cell.styles.textColor = [17, 94, 89];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }

    const cleanName = currentTemplate.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Laporan_Detail_Anggaran_${cleanName}_${monthNameStr}_${selectedYear}_SakuKu.pdf`);
  };

  return (
    <div
      data-no-swipe="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto"
      >
        
        {/* ==================================================== */}
        {/* MODAL HEADER WITH DYNAMIC INDUSTRY BADGES */}
        {/* ==================================================== */}
        <div
          className={`p-4 sm:p-5 text-white flex items-center justify-between gap-3 ${
            isPersonal
              ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900'
              : 'bg-gradient-to-r from-blue-700 via-sky-700 to-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
              {isPersonal ? <User className="w-6 h-6 text-white" /> : <Store className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                  {isPersonal ? '📘 Master Contoh Anggaran Pribadi' : '📊 Master Proforma Anggaran Bisnis (SAK EMKM)'}
                </span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Periode Berjalan (s/d Bulan Ini)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-tight mt-0.5">
                {currentTemplate.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================================================== */}
        {/* INDUSTRY & MODEL SELECTOR (PILIHAN CONTOH BISNIS LAIN) */}
        {/* ==================================================== */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isPersonal ? 'Pilih Profil Pribadi & Rumah Tangga:' : 'Pilih Model Bidang Usaha Lainnya:'}</span>
            </span>

            {/* Template Action Button */}
            {onUseTemplate && (
              <button
                type="button"
                onClick={() => onUseTemplate(currentTemplate.id, selectedMonth, selectedYear)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Gunakan Template Ini di Wizard</span>
              </button>
            )}
          </div>

          {/* Model Chips Carousel */}
          <div
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
          >
            {(isPersonal ? PERSONAL_BUDGET_TEMPLATES : BUSINESS_BUDGET_TEMPLATES).map((tmpl) => {
              const isSelected = isPersonal
                ? selectedPersonalId === tmpl.id
                : selectedBusinessId === tmpl.id;

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    if (isPersonal) setSelectedPersonalId(tmpl.id);
                    else setSelectedBusinessId(tmpl.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? isPersonal
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span>{tmpl.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================== */}
        {/* MONTH SELECTOR (PILIH BULAN S/D BULAN BERJALAN) */}
        {/* ==================================================== */}
        <div className="px-3.5 py-2.5 bg-indigo-50/80 dark:bg-slate-850 border-b border-indigo-100 dark:border-slate-700 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Pilih Bulan Anggaran (s/d Bulan Ini):</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                Tahun {selectedYear}
              </span>
            </div>

            {/* Quick Month Prev / Next Controller */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedMonth((prev) => (prev > 0 ? prev - 1 : 0))}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black px-2 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                {monthNameStr} {selectedYear}
              </span>
              <button
                type="button"
                disabled={selectedMonth >= now.getMonth()}
                onClick={() => setSelectedMonth((prev) => (prev < now.getMonth() ? prev + 1 : prev))}
                className={`p-1 rounded-lg text-slate-600 dark:text-slate-300 transition-all ${
                  selectedMonth >= now.getMonth() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Months Horizontal Scroll Chips (s/d Bulan Berjalan) */}
          <div
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
          >
            {MONTH_NAMES_ID.slice(0, now.getMonth() + 1).map((mName, mIdx) => {
              const isSelected = selectedMonth === mIdx;
              const isTHR = mIdx === 3;
              const isSchool = mIdx === 6;
              
              return (
                <button
                  key={mIdx}
                  type="button"
                  onClick={() => setSelectedMonth(mIdx)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? isPersonal
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700'
                        : 'bg-gradient-to-r from-blue-600 to-sky-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300 dark:ring-blue-700'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span>{MONTH_SHORT_ID[mIdx]}</span>
                  {isTHR && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-amber-300 text-slate-950' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'}`}>
                      THR
                    </span>
                  )}
                  {isSchool && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-cyan-300 text-slate-950' : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300'}`}>
                      Sekolah
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================== */}
        {/* NAVIGATION TABS & ACTION BUTTONS */}
        {/* ==================================================== */}
        <div
          data-no-swipe="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sample'
                  ? isPersonal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Laporan Proforma Lengkap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'steps'
                  ? isPersonal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Alur Langkah (Step-by-Step)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('item_catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'item_catalog'
                  ? isPersonal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Detail Item Satu per Satu ({dynamicTemplateItems.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cetak / Unduh PDF ({monthShortStr} {selectedYear})</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* MODAL MAIN BODY CONTENT */}
        {/* ==================================================== */}
        <div
          data-no-swipe="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-800 dark:text-slate-100 text-xs"
        >
          
          {/* TAB 1: SAMPLE REPORT PROFORMA VIEW */}
          {activeTab === 'sample' && (
            <div className="flex flex-col gap-4">
              {/* Top Financial Dashboard Box */}
              <div
                className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                  isPersonal
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-200 dark:border-indigo-800'
                    : 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                        Bidang: {currentTemplate.bidang || currentTemplate.industryTag}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-md">
                        Sub-Bidang: {currentTemplate.subBidang || currentTemplate.badge || currentTemplate.name}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {currentTemplate.businessName ? `${currentTemplate.businessName} — ` : ''}{currentTemplate.description}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs">
                    <span>📅 Periode: 01 s/d {daysInSelectedMonth} {monthNameStr} {selectedYear} (Dimulai Tgl 1)</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {isPersonal ? 'Total Pemasukan' : 'Target Omzet (Revenue)'}
                    </span>
                    <span className="text-xs font-black text-emerald-600 block mt-0.5">
                      {formatRupiah(templateFinancials.totalRevenue)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {isPersonal ? 'Kebutuhan Pokok (Needs)' : `Laba Kotor (${templateFinancials.grossMarginPercent.toFixed(0)}%)`}
                    </span>
                    <span className="text-xs font-black text-blue-600 block mt-0.5">
                      {isPersonal
                        ? formatRupiah(templateFinancials.totalCOGS)
                        : formatRupiah(templateFinancials.grossProfit)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {isPersonal ? 'Cicilan & Hutang' : 'Beban Usaha (OPEX)'}
                    </span>
                    <span className="text-xs font-black text-rose-600 block mt-0.5">
                      {isPersonal
                        ? formatRupiah(templateFinancials.totalDebt)
                        : formatRupiah(templateFinancials.totalOPEX)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {isPersonal ? 'Tabungan & Dana Darurat' : 'Sisa Kas Bersih (Free Cash)'}
                    </span>
                    <span className="text-xs font-black text-purple-600 block mt-0.5">
                      {isPersonal
                        ? formatRupiah(templateFinancials.totalCapexEquity)
                        : formatRupiah(templateFinancials.netFreeCash)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. REVENUE SECTION TABLE */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <span className="font-black text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>A. Sumber Pendapatan & Omzet Penjualan ({revenueItems.length} Pos)</span>
                  </span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                    +{formatRupiah(templateFinancials.totalRevenue)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {revenueItems.map((it, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderPlannedDateBadges(it)}
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{it.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>📦 Vol: <b>{it.qty || 1} {it.unit || 'Bln'}</b></span>
                          <span>•</span>
                          <span>🏷️ Tarif: <b>{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</b></span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-black text-emerald-600 text-xs sm:text-sm">
                          +{formatRupiah(parseFloat(it.plannedAmount))}
                        </span>
                        <span className="text-[10px] text-slate-400">Pemasukan</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3.5 py-2 bg-emerald-50/70 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                  <span>REKAP SUB: TOTAL PENDAPATAN ({revenueItems.length} POS)</span>
                  <span className="font-mono font-black text-xs">+{formatRupiah(templateFinancials.totalRevenue)}</span>
                </div>
              </div>

              {/* 2. COGS / BAHAN BAKU SECTION TABLE */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between">
                  <span className="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>
                      {isPersonal
                        ? `B. Belanja Kebutuhan Pokok & Dapur (${cogsItems.length} Pos)`
                        : `B. Beban Pokok Pendapatan (HPP / Bahan Baku - ${cogsItems.length} Pos)`}
                    </span>
                  </span>
                  <span className="font-mono font-black text-rose-700 dark:text-rose-300">
                    -{formatRupiah(templateFinancials.totalCOGS)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {cogsItems.map((it, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderPlannedDateBadges(it)}
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{it.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>📦 Vol: <b>{it.qty || 1} {it.unit || 'Bln'}</b></span>
                          <span>•</span>
                          <span>🏷️ Harga: <b>{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</b></span>
                          {it.reminderNote && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">💡 {it.reminderNote}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-black text-rose-600 text-xs sm:text-sm">
                          -{formatRupiah(parseFloat(it.plannedAmount))}
                        </span>
                        <span className="text-[10px] text-slate-400">{it.qty || 1} {it.unit || 'Bln'} × {formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3.5 py-2 bg-rose-50/70 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-[11px] font-bold text-rose-900 dark:text-rose-200">
                  <span>REKAP SUB: TOTAL KEBUTUHAN POKOK / HPP ({cogsItems.length} POS)</span>
                  <span className="font-mono font-black text-xs">-{formatRupiah(templateFinancials.totalCOGS)}</span>
                </div>

                {!isPersonal && (
                  <div className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between font-black text-blue-900 dark:text-blue-200">
                    <span>= REKAP SUB: LABA KOTOR (GROSS PROFIT - MARGIN {templateFinancials.grossMarginPercent.toFixed(1)}%)</span>
                    <span className="font-mono">{formatRupiah(templateFinancials.grossProfit)}</span>
                  </div>
                )}
              </div>

              {/* 3. OPEX / RUTIN SECTION TABLE */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <span className="font-black text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>
                      {isPersonal
                        ? `C. Tagihan Rutin, Operasional & Pendidikan (${opexItems.length} Pos)`
                        : `C. Beban Operasional Usaha / OPEX (${opexItems.length} Pos)`}
                    </span>
                  </span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                    -{formatRupiah(templateFinancials.totalOPEX)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {opexItems.map((it, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderPlannedDateBadges(it)}
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{it.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>📦 Vol: <b>{it.qty || 1} {it.unit || 'Bln'}</b></span>
                          <span>•</span>
                          <span>🏷️ Tarif: <b>{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</b></span>
                          {it.reminderNote && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 dark:text-slate-400">🔔 {it.reminderNote}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-black text-rose-600 text-xs sm:text-sm">
                          -{formatRupiah(parseFloat(it.plannedAmount))}
                        </span>
                        <span className="text-[10px] text-slate-400">{it.qty || 1} {it.unit || 'Bln'} × {formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3.5 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                  <span>REKAP SUB: TOTAL BEBAN OPERASIONAL / OPEX ({opexItems.length} POS)</span>
                  <span className="font-mono font-black text-xs">-{formatRupiah(templateFinancials.totalOPEX)}</span>
                </div>

                {!isPersonal && (
                  <div className="px-3.5 py-2.5 bg-indigo-100/70 dark:bg-indigo-950/70 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between font-black text-indigo-950 dark:text-indigo-200">
                    <span>= REKAP SUB: LABA OPERASIONAL (EBITDA - MARGIN {templateFinancials.operatingMarginPercent.toFixed(1)}%)</span>
                    <span className="font-mono">{formatRupiah(templateFinancials.operatingIncome)}</span>
                  </div>
                )}
              </div>

              {/* 4. DEBT, CAPEX & PRIVE TABLE */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <span className="font-black text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>
                      {isPersonal
                        ? `D. Cicilan Hutang, Tabungan & Zakat (${debtItems.length + capexItems.length} Pos)`
                        : `D. Belanja Modal (Capex), Cicilan Pinjaman & Prive (${debtItems.length + capexItems.length} Pos)`}
                    </span>
                  </span>
                  <span className="font-mono font-black text-amber-700 dark:text-amber-300">
                    -{formatRupiah(templateFinancials.totalDebt + templateFinancials.totalCapexEquity)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {[...debtItems, ...capexItems].map((it, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderPlannedDateBadges(it)}
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{it.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>📦 Vol: <b>{it.qty || 1} {it.unit || 'Bln'}</b></span>
                          <span>•</span>
                          <span>🏷️ Tarif: <b>{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</b></span>
                          {it.reminderNote && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">🛡️ {it.reminderNote}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-black text-amber-600 text-xs sm:text-sm">
                          -{formatRupiah(parseFloat(it.plannedAmount))}
                        </span>
                        <span className="text-[10px] text-slate-400">Alokasi Pasti</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3.5 py-2 bg-amber-50/70 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                  <span>REKAP SUB: TOTAL CICILAN, CAPEX & PRIVE ({debtItems.length + capexItems.length} POS)</span>
                  <span className="font-mono font-black text-xs">-{formatRupiah(templateFinancials.totalDebt + templateFinancials.totalCapexEquity)}</span>
                </div>

                <div className="px-3.5 py-3 bg-emerald-100/80 dark:bg-emerald-950/80 border-t border-emerald-300 dark:border-emerald-700 flex items-center justify-between font-black text-emerald-950 dark:text-emerald-200 text-sm">
                  <span>
                    {isPersonal
                      ? '= REKAP TOTAL: SISA SALDO KAS BERSIH (ZERO-BASED TARGET)'
                      : '= REKAP TOTAL: SISA KAS BEBAS USAHA (FREE CASH FLOW)'}
                  </span>
                  <span className="font-mono text-base text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(templateFinancials.netFreeCash)}
                  </span>
                </div>
              </div>

              {/* 5. RESUME / RINGKASAN EKSEKUTIF PROFORMA ANGGARAN & ARUS KAS (IDENTICAL FORMAT TO WIZARD PRATINJAU) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-black tracking-wide uppercase">
                      {isPersonal
                        ? 'III. PRATINJAU RINGKASAN ANGGARAN & ARUS KAS PRIBADI'
                        : 'III. PRATINJAU LAPORAN LABA RUGI PROFORMA & ARUS KAS (SAK EMKM)'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Periode: Tanggal 01 s/d 31 (Dimulai Tgl 1)
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex flex-col gap-2.5 font-mono text-xs">
                  {/* 1. Revenue / Income */}
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      {isPersonal ? 'Target Pemasukan & Gaji' : 'Proyeksi Pendapatan Penjualan (Omzet)'}
                    </span>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatRupiah(templateFinancials.totalRevenue)}
                    </span>
                  </div>

                  {/* 2. COGS / Essentials */}
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                    <span>
                      (-) {isPersonal
                        ? 'Kebutuhan Pokok Hidup (Dapur & Sembako)'
                        : 'Beban Pokok Pendapatan (HPP)'}
                    </span>
                    <span className="font-bold text-rose-600">
                      ({formatRupiah(templateFinancials.totalCOGS)})
                    </span>
                  </div>

                  {/* 3. Gross Profit / Balance After Needs */}
                  <div className="flex items-center justify-between py-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
                    <span className="font-black text-emerald-950 dark:text-emerald-200">
                      (=) {isPersonal
                        ? 'SISA KAS SETELAH KEBUTUHAN POKOK'
                        : 'PROYEKSI LABA KOTOR (Gross Profit)'}
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {formatRupiah(templateFinancials.grossProfit)}{' '}
                      <span className="text-[10px] font-bold">
                        ({templateFinancials.grossMarginPercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* 4. OPEX / Family Bills */}
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                    <span>
                      (-) {isPersonal
                        ? 'Biaya Hidup Rutin, Tagihan & Transport'
                        : 'Total Beban Operasional Usaha (OPEX)'}
                    </span>
                    <span className="font-bold text-indigo-600">
                      ({formatRupiah(templateFinancials.totalOPEX)})
                    </span>
                  </div>

                  {/* 5. Operating Income (EBIT) / Net Cash After Bills */}
                  <div className="flex items-center justify-between py-2 bg-blue-50 dark:bg-blue-950/40 px-3 rounded-xl border border-blue-200 dark:border-blue-800 font-sans">
                    <span className="font-black text-blue-950 dark:text-blue-200">
                      (=) {isPersonal
                        ? 'SISA DANA BEBAS (Cash Surplus)'
                        : 'PROYEKSI LABA OPERASIONAL (EBIT)'}
                    </span>
                    <span className="font-black text-blue-700 dark:text-blue-300 text-sm">
                      {formatRupiah(templateFinancials.operatingIncome)}{' '}
                      <span className="text-[10px] font-bold">
                        ({templateFinancials.operatingMarginPercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* 6. Capex, Prive & Tax / Savings & Investments */}
                  {templateFinancials.totalCapexEquity > 0 && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                      <span>
                        (-) {isPersonal
                          ? 'Alokasi Tabungan, Investasi & Sedekah'
                          : 'Belanja Modal (Aset), Prive & Pajak'}
                      </span>
                      <span className="font-bold text-purple-600">
                        ({formatRupiah(templateFinancials.totalCapexEquity)})
                      </span>
                    </div>
                  )}

                  {/* 7. Debt & Receivables / Loan Installments */}
                  {templateFinancials.totalDebt > 0 && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 font-sans pl-3 text-slate-600 dark:text-slate-300">
                      <span>
                        (-) {isPersonal
                          ? 'Cicilan Utang, KPR & Pinjaman'
                          : 'Cicilan Pinjaman Bank KUR & Utang Usaha'}
                      </span>
                      <span className="font-bold text-amber-600">
                        ({formatRupiah(templateFinancials.totalDebt)})
                      </span>
                    </div>
                  )}

                  {/* 8. Net Balance */}
                  <div
                    className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl border font-sans ${
                      templateFinancials.netFreeCash >= 0
                        ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md'
                        : 'bg-linear-to-r from-rose-600 to-red-700 text-white border-rose-600 shadow-md'
                    }`}
                  >
                    <div>
                      <span className="font-black text-xs block uppercase tracking-wide">
                        {isPersonal
                          ? 'ESTIMASI SALDO BERSIH BULANAN'
                          : 'ESTIMASI ARUS KAS BERSIH / SISA SALDO LABA'}
                      </span>
                      <span className="text-[10px] text-white/80">
                        {templateFinancials.netFreeCash >= 0
                          ? 'Rencana Anggaran Sehat & Menguntungkan (Surplus)'
                          : 'Perhatian: Rencana Mengalami Defisit!'}
                      </span>
                    </div>

                    <span className="text-base sm:text-lg font-black tracking-tight">
                      {formatRupiah(templateFinancials.netFreeCash)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE WITH INTERACTIVE LIVE WIZARD FORM SIMULATION */}
          {activeTab === 'steps' && (
            <div className="flex flex-col gap-4">
              {/* Wizard Step Selector Bar */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {simulationStep}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                      Simulasi Form Wizard ({simulationStep} dari 5)
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {simulationStep === 1 && (isPersonal ? 'Langkah 1: Setup & Profil Anggaran Pribadi' : 'Langkah 1: Profil & Bidang Usaha')}
                      {simulationStep === 2 && (isPersonal ? 'Langkah 2: Form Sumber Pemasukan Pasti' : 'Langkah 2: Form Proyeksi Target Omzet (Revenue)')}
                      {simulationStep === 3 && (isPersonal ? 'Langkah 3: Form Kebutuhan Pokok Hidup (Primer)' : 'Langkah 3: Form Beban Pokok Pendapatan (HPP / COGS)')}
                      {simulationStep === 4 && (isPersonal ? 'Langkah 4: Form Biaya Rutin & Operasional (OPEX)' : 'Langkah 4: Form Beban Operasional Usaha (OPEX)')}
                      {simulationStep === 5 && (isPersonal ? 'Langkah 5: Form Tabungan, Cicilan & Kesimpulan Anggaran' : 'Langkah 5: Form Capex, Utang & Kesimpulan Anggaran Lengkap')}
                    </h4>
                  </div>
                </div>

                {/* Step Switcher Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { step: 1, label: '1. Profil' },
                    { step: 2, label: isPersonal ? '2. Pemasukan' : '2. Omzet' },
                    { step: 3, label: isPersonal ? '3. Kebutuhan' : '3. HPP' },
                    { step: 4, label: isPersonal ? '4. Biaya Rutin' : '4. OPEX' },
                    { step: 5, label: '5. Kesimpulan' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setSimulationStep(s.step)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        simulationStep === s.step
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SIMULATION FORM CONTENT BY STEP */}
              {/* STEP 1 FORM SIMULATION */}
              {simulationStep === 1 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <Store className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {isPersonal ? 'Form Identitas & Profil Anggaran Mandiri' : 'Form Identitas Usaha & Periode Pembukuan'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          {isPersonal ? 'Nama Rencana Anggaran:' : 'Nama Entitas Bisnis / Usaha:'}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {currentTemplate.businessName || currentTemplate.name}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Siklus & Periode Anggaran (Wajib Tgl 1):
                        </span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          📅 Tanggal 01 s/d 31 (Dimulai Tgl 1)
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Bidang Industri:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          🏢 {currentTemplate.bidang || currentTemplate.industryTag}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Sub-Bidang & Model Operasional:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          🔖 {currentTemplate.subBidang || currentTemplate.badge}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                      💡 <b>Kaidah Standar:</b> {isPersonal ? 'Anggaran pribadi dimulai dari tanggal 1 setiap bulan kalender agar penataan pengeluaran kebutuhan pokok, tagihan rutin, cicilan, dan tabungan investasi selalu sinkron.' : 'Anggaran usaha selalu dimulai dari tanggal 1 untuk standarisasi laporan keuangan bulanan (SAK EMKM), penutupan kasir toko (closing pos), dan rekonsiliasi mutasi rekening koran bank.'}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 FORM SIMULATION: REVENUE */}
              {simulationStep === 2 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                          {isPersonal ? 'Form Bagian 1: Proyeksi Seluruh Sumber Pemasukan' : 'Form Bagian 1: Proyeksi Target Omzet Penjualan (Revenue)'}
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {isPersonal ? 'Daftar take home pay, gaji pasangan, bonus, dan proyek sampingan.' : 'Daftar saluran penjualan kasir offline, pesanan online, grosir B2B, dan layanan jasa.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs text-right">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        Subtotal Pemasukan / Omzet ({revenueItems.length} Pos)
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-600">
                        {formatRupiah(templateFinancials.totalRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* REVENUE ITEMS FORM TABLE */}
                  <div className="flex flex-col gap-2.5">
                    {revenueItems.map((it, idx) => (
                      <div key={it.id || idx} className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {it.categoryName}
                            </span>
                          </div>

                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            <span>AHSP Satuan</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Volume / Qty</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{it.qty || 1}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Satuan</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.unit || 'Bln'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Tarif Satuan (Rp)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Total Penerimaan (Rp)</span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">+{formatRupiah(parseFloat(it.plannedAmount))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Tgl Rencana: <b>{formatDateCell(it)}</b></span>
                          </div>
                          {it.reminderNote && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Bell className="w-3 h-3" /> {it.reminderNote}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal Banner */}
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between font-black text-xs sm:text-sm">
                    <span className="text-emerald-900 dark:text-emerald-200 uppercase">
                      Subtotal Anggaran Bagian 1 (Pendapatan):
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
                      {formatRupiah(templateFinancials.totalRevenue)}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 3 FORM SIMULATION: COGS */}
              {simulationStep === 3 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-rose-950 dark:text-rose-200">
                          {isPersonal ? 'Form Bagian 2: Kebutuhan Pokok Hidup (Primer)' : 'Form Bagian 2: Beban Pokok Pendapatan (HPP / COGS)'}
                        </h4>
                        <p className="text-xs text-rose-700 dark:text-rose-400">
                          {isPersonal ? 'Belanja dapur/sembako, makan harian, gas elpiji, air galon, dan perlengkapan mandi.' : 'Bahan baku produksi, kulakan barang dagangan, upah tukang langsung BoQ, kemasan.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 shadow-2xs text-right">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">
                          Subtotal HPP ({cogsItems.length} Pos)
                        </span>
                        <span className="text-xs sm:text-sm font-black text-rose-600">
                          {formatRupiah(templateFinancials.totalCOGS)}
                        </span>
                      </div>

                      <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-2xs text-right">
                        <span className="text-[9px] font-bold text-emerald-100 block uppercase">
                          {isPersonal ? 'Sisa Kas Pokok' : 'Laba Kotor (Gross Profit)'}
                        </span>
                        <span className="text-xs sm:text-sm font-black">
                          {formatRupiah(templateFinancials.grossProfit)} ({templateFinancials.grossMarginPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COGS ITEMS LIST */}
                  <div className="flex flex-col gap-2.5">
                    {cogsItems.map((it, idx) => (
                      <div key={it.id || idx} className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {it.categoryName}
                            </span>
                          </div>

                          <span className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            <span>AHSP Satuan</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Volume / Qty</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{it.qty || 1}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Satuan</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.unit || 'Bln'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Tarif Satuan (Rp)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Total Biaya (Rp)</span>
                            <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">-{formatRupiah(parseFloat(it.plannedAmount))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Tgl Rencana: <b>{formatDateCell(it)}</b></span>
                          </div>
                          {it.reminderNote && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Bell className="w-3 h-3" /> {it.reminderNote}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal Banner */}
                  <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl border border-rose-300 dark:border-rose-800 flex items-center justify-between font-black text-xs sm:text-sm">
                    <span className="text-rose-900 dark:text-rose-200 uppercase">
                      Subtotal Anggaran Bagian 2 (Beban Pokok / HPP):
                    </span>
                    <span className="font-mono text-rose-700 dark:text-rose-300 text-sm sm:text-base">
                      {formatRupiah(templateFinancials.totalCOGS)}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 4 FORM SIMULATION: OPEX */}
              {simulationStep === 4 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-indigo-950 dark:text-indigo-200">
                          {isPersonal ? 'Form Bagian 3: Biaya Rutin, Tagihan & Operasional (OPEX)' : 'Form Bagian 3: Beban Operasional Usaha (OPEX)'}
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400">
                          {isPersonal ? 'Sewa hunian/kos, tagihan listrik, air, WiFi, SPP anak, bensin, dan iuran BPJS.' : 'Gaji karyawan (2 shift), sewa ruko/toko, listrik 24 jam, internet fiber, iklan Ads, kebersihan.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-2xs text-right">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">
                          Subtotal OPEX ({opexItems.length} Pos)
                        </span>
                        <span className="text-xs sm:text-sm font-black text-indigo-600">
                          {formatRupiah(templateFinancials.totalOPEX)}
                        </span>
                      </div>

                      <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-2xs text-right">
                        <span className="text-[9px] font-bold text-blue-100 block uppercase">
                          {isPersonal ? 'Sisa Kas Operasional' : 'Laba Operasional (EBIT)'}
                        </span>
                        <span className="text-xs sm:text-sm font-black">
                          {formatRupiah(templateFinancials.operatingIncome)} ({templateFinancials.operatingMarginPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OPEX ITEMS LIST */}
                  <div className="flex flex-col gap-2.5">
                    {opexItems.map((it, idx) => (
                      <div key={it.id || idx} className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {it.categoryName}
                            </span>
                          </div>

                          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            <span>AHSP Satuan</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Volume / Qty</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{it.qty || 1}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Satuan</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.unit || 'Bln'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Tarif Satuan (Rp)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRupiah(parseFloat(it.unitPrice || it.plannedAmount))}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">Total Beban (Rp)</span>
                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">-{formatRupiah(parseFloat(it.plannedAmount))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Tgl Rencana: <b>{formatDateCell(it)}</b></span>
                          </div>
                          {it.reminderNote && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Bell className="w-3 h-3" /> {it.reminderNote}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal Banner */}
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl border border-indigo-300 dark:border-indigo-800 flex items-center justify-between font-black text-xs sm:text-sm">
                    <span className="text-indigo-900 dark:text-indigo-200 uppercase">
                      Subtotal Anggaran Bagian 3 (Beban Operasional / OPEX):
                    </span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 text-sm sm:text-base">
                      {formatRupiah(templateFinancials.totalOPEX)}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 5 FORM SIMULATION: KESIMPULAN ANGGARAN LENGKAP */}
              {simulationStep === 5 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  {/* Executive Header Banner */}
                  <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-black rounded-md uppercase">
                          Ringkasan & Kesimpulan Anggaran Final
                        </span>
                        <span className="text-xs text-indigo-200 font-medium">
                          {currentTemplate.badge}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        {currentTemplate.businessName || currentTemplate.name}
                      </h3>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        Bidang: <b>{currentTemplate.bidang || currentTemplate.industryTag}</b> • Sub: <b>{currentTemplate.subBidang}</b>
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-right">
                      <span className="text-[10px] text-indigo-200 font-bold block uppercase">
                        Sisa Kas Bersih / Arus Kas Bebas
                      </span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                        {formatRupiah(templateFinancials.netFreeCash)}
                      </span>
                    </div>
                  </div>

                  {/* 6 EXECUTIVE KPI SUMMARY CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">1. Target Omzet</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                        {formatRupiah(templateFinancials.totalRevenue)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{revenueItems.length} Pos Penerimaan</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">2. Beban Pokok (HPP)</span>
                      <span className="text-xs sm:text-sm font-black text-rose-600 font-mono">
                        {formatRupiah(templateFinancials.totalCOGS)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{cogsItems.length} Pos Biaya Pokok</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">3. Laba Kotor Usaha</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatRupiah(templateFinancials.grossProfit)}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Margin {templateFinancials.grossMarginPercent.toFixed(1)}%</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">4. Beban Operasional</span>
                      <span className="text-xs sm:text-sm font-black text-indigo-600 font-mono">
                        {formatRupiah(templateFinancials.totalOPEX)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{opexItems.length} Pos Rutin/Gaji</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">5. Total Pengeluaran</span>
                      <span className="text-xs sm:text-sm font-black text-rose-700 font-mono">
                        {formatRupiah(templateFinancials.totalExpense)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Semua Pos Belanja</span>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">6. Free Cash Flow</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                        {formatRupiah(templateFinancials.netFreeCash)}
                      </span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold block mt-0.5">Saldo Bersih Bebas</span>
                    </div>
                  </div>

                  {/* REKAP POS CAPEX & UTANG */}
                  {(capexItems.length > 0 || debtItems.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Capex / Tabungan */}
                      {capexItems.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                              <WalletCards className="w-4 h-4 text-emerald-600" />
                              {isPersonal ? 'Alokasi Tabungan & Aset' : 'Belanja Modal (Capex) & Prive'}
                            </span>
                            <span className="font-mono font-bold text-xs text-emerald-600">
                              Subtotal: {formatRupiah(templateFinancials.totalCapexEquity)}
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                            {capexItems.map((c, cIdx) => (
                              <div key={cIdx} className="py-1.5 flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{c.categoryName}</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(parseFloat(c.plannedAmount))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Utang / Cicilan */}
                      {debtItems.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-rose-600" />
                              {isPersonal ? 'Cicilan & Kewajiban Hutang' : 'Cicilan Bank KUR & Utang Usaha'}
                            </span>
                            <span className="font-mono font-bold text-xs text-rose-600">
                              Subtotal: {formatRupiah(templateFinancials.totalDebt)}
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                            {debtItems.map((d, dIdx) => (
                              <div key={dIdx} className="py-1.5 flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{d.categoryName}</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(parseFloat(d.plannedAmount))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PROFORMA SAK EMKM / ARUS KAS PRIBADI STATEMENT WITH ALL SUBTOTALS */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    <div className="p-3.5 bg-slate-100 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {isPersonal ? 'Laporan Proforma Arus Kas Pribadi (Zero-Based Standard)' : 'Laporan Proforma Laba Rugi Resmi SAK EMKM'}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">
                        Periode: Tanggal 01 s/d 31
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                      {/* Revenue Subtotal */}
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between font-black">
                        <span className="text-emerald-900 dark:text-emerald-300 uppercase">
                          (+) TOTAL PENDAPATAN / OMZET USAHA:
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(templateFinancials.totalRevenue)}
                        </span>
                      </div>

                      {/* COGS Subtotal */}
                      <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 flex items-center justify-between font-black">
                        <span className="text-rose-900 dark:text-rose-300 uppercase">
                          (-) TOTAL BEBAN POKOK PENDAPATAN (HPP):
                        </span>
                        <span className="font-mono text-rose-600 dark:text-rose-400">
                          -{formatRupiah(templateFinancials.totalCOGS)}
                        </span>
                      </div>

                      {/* Gross Profit */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-700/60 flex items-center justify-between font-black">
                        <span className="text-slate-900 dark:text-white uppercase">
                          (=) LABA KOTOR USAHA (GROSS PROFIT):
                        </span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-300">
                          {formatRupiah(templateFinancials.grossProfit)} ({templateFinancials.grossMarginPercent.toFixed(1)}%)
                        </span>
                      </div>

                      {/* OPEX Subtotal */}
                      <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 flex items-center justify-between font-black">
                        <span className="text-indigo-900 dark:text-indigo-300 uppercase">
                          (-) TOTAL BEBAN OPERASIONAL (OPEX):
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          -{formatRupiah(templateFinancials.totalOPEX)}
                        </span>
                      </div>

                      {/* Operating Profit */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-700/60 flex items-center justify-between font-black">
                        <span className="text-slate-900 dark:text-white uppercase">
                          (=) LABA OPERASIONAL USAHA (EBIT):
                        </span>
                        <span className="font-mono text-blue-700 dark:text-blue-300">
                          {formatRupiah(templateFinancials.operatingIncome)} ({templateFinancials.operatingMarginPercent.toFixed(1)}%)
                        </span>
                      </div>

                      {/* Debt Subtotal */}
                      {templateFinancials.totalDebt > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between font-bold">
                          <span className="text-slate-700 dark:text-slate-300">
                            (-) Angsuran Cicilan Pinjaman Bank KUR:
                          </span>
                          <span className="font-mono text-rose-600">
                            -{formatRupiah(templateFinancials.totalDebt)}
                          </span>
                        </div>
                      )}

                      {/* Capex Subtotal */}
                      {templateFinancials.totalCapexEquity > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between font-bold">
                          <span className="text-slate-700 dark:text-slate-300">
                            (-) Belanja Modal (Capex) & Prive Pemilik:
                          </span>
                          <span className="font-mono text-emerald-600">
                            -{formatRupiah(templateFinancials.totalCapexEquity)}
                          </span>
                        </div>
                      )}

                      {/* Grand Total All Expenses */}
                      <div className="p-3 bg-rose-100/70 dark:bg-rose-950/40 flex items-center justify-between font-black">
                        <span className="text-rose-950 dark:text-rose-200 uppercase">
                          (=) TOTAL KESELURUHAN PENGELUARAN USAHA:
                        </span>
                        <span className="font-mono text-rose-700 dark:text-rose-300 text-sm">
                          {formatRupiah(templateFinancials.totalExpense)}
                        </span>
                      </div>

                      {/* Grand Total Free Cash Flow */}
                      <div className="p-3.5 bg-emerald-600 text-white flex items-center justify-between font-black text-sm">
                        <span className="uppercase tracking-wider">
                          (=) SISA KAS BEBAS FINAL (FREE CASH FLOW):
                        </span>
                        <span className="font-mono text-base sm:text-lg">
                          {formatRupiah(templateFinancials.netFreeCash)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATION NAVIGATION BAR */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={simulationStep === 1}
                  onClick={() => setSimulationStep((s) => Math.max(1, s - 1))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    simulationStep === 1
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Langkah Sebelumnya</span>
                </button>

                <div className="text-[11px] font-bold text-slate-500">
                  Langkah {simulationStep} dari 5
                </div>

                <button
                  type="button"
                  disabled={simulationStep === 5}
                  onClick={() => setSimulationStep((s) => Math.min(5, s + 1))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    simulationStep === 5
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <span>Langkah Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* EDUCATIONAL ACCORDION & BEST PRACTICES FOR ALL STEPS */}
              <div className="mt-2 flex flex-col gap-2.5">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  📖 Panduan Metodologi & Kiat Pengendalian Tiap Langkah:
                </span>
                <div className="flex flex-col gap-2">
                  {stepsData.map((step, idx) => {
                    const isExpanded = expandedStepId === idx;
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedStepId(isExpanded ? null : idx)}
                          className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{step.icon}</span>
                            <div>
                              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                                {step.badge}
                              </span>
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                                {step.title}
                              </h5>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isExpanded && (
                          <div className="p-3 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-2 animate-fadeIn">
                            <p className="text-slate-600 dark:text-slate-400">{step.desc}</p>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <span className="text-[11px] text-amber-900 dark:text-amber-200">
                                <b>Kiat Sukses:</b> {step.bestPractice}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE ITEM-BY-ITEM CATALOG & INSPECTOR */}
          {activeTab === 'item_catalog' && (
            <div className="flex flex-col gap-4">
              {/* Search & Filter Header */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Cari item pos anggaran..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'revenue', label: 'Pemasukan' },
                    { id: 'cogs', label: isPersonal ? 'Pokok' : 'HPP' },
                    { id: 'opex', label: 'Beban OPEX' },
                    { id: 'debt_receivable', label: 'Hutang' },
                    { id: 'capex_equity', label: isPersonal ? 'Tabungan' : 'Capex/Prive' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedSectionFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedSectionFilter === f.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-2.5">
                {filteredCatalogItems.map((item, idx) => {
                  const isItemIncome = item.section === 'revenue' || item.itemType === 'income';
                  const isSelected = selectedDetailItemId === item.id;

                  return (
                    <div
                      key={item.id || idx}
                      className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDetailItemId(isSelected ? null : item.id)}
                        className="w-full p-3 sm:p-3.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isItemIncome
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.section === 'cogs'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : item.section === 'opex'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isItemIncome ? '+' : '-'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                                Pos #{idx + 1} • {item.section.toUpperCase()}
                              </span>
                              {renderPlannedDateBadges(item)}
                            </div>
                            <h5 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                              {item.categoryName}
                            </h5>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <span
                            className={`font-mono font-black text-xs sm:text-sm block ${
                              isItemIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isItemIncome ? '+' : '-'}{formatRupiah(parseFloat(item.plannedAmount))}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.qty || 1} {item.unit || 'Bln'} × {formatRupiah(parseFloat(item.unitPrice || item.plannedAmount))}
                          </span>
                        </div>
                      </button>

                      {/* Detailed Inspector Drawer */}
                      {isSelected && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] animate-fadeIn">
                          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              Rumus & Jadwal Perhitungan:
                            </span>
                            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                              📅 {formatDateCell(item)} • {item.qty || 1} {item.unit || 'Bln'} (Volume) × {formatRupiah(parseFloat(item.unitPrice || item.plannedAmount))} = {formatRupiah(parseFloat(item.plannedAmount))}
                            </p>
                          </div>

                          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              Pengingat & Catatan Operasional:
                            </span>
                            <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {item.reminderNote || 'Tidak ada pengingat khusus untuk pos ini.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER */}
        {/* ==================================================== */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Tutup Panduan
          </button>

          <div className="flex items-center gap-2">
            {onUseTemplate && (
              <button
                type="button"
                onClick={() => {
                  onUseTemplate(currentTemplate.id, selectedMonth, selectedYear);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Model {currentTemplate.badge} Ini</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
