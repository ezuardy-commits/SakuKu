import React, { useState, useEffect } from 'react';
import {
  Calculator,
  X,
  Sparkles,
  CheckCircle2,
  Building2,
  Briefcase,
  Package,
  Layers,
  Info,
  DollarSign,
  Receipt,
  Percent,
  Hammer,
  Users,
  Truck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export interface AhspResultData {
  itemName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  plannedAmount: string;
  breakdownNote: string;
  contractType?: 'construction' | 'consultant' | 'procurement' | 'custom';
}

interface ContractAhspModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'id' | 'en';
  initialItemName?: string;
  initialQty?: string;
  initialUnit?: string;
  initialUnitPrice?: string;
  onApply: (result: AhspResultData) => void;
}

type AhspMode = 'construction' | 'consultant' | 'procurement' | 'custom';

interface AhspSample {
  title: string;
  mode: AhspMode;
  itemName: string;
  qty: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  logisticsCost: number;
  overheadProfitPct: number;
  taxPct: number;
  description: string;
}

const AHSP_SAMPLES: AhspSample[] = [
  {
    title: 'Pasangan Dinding Bata Ringan (Hebel) t=10cm',
    mode: 'construction',
    itemName: 'Pekerjaan Pasangan Dinding Bata Ringan (Hebel) t=10cm + Mortar Perekat',
    qty: 250,
    unit: 'm²',
    materialCost: 95000,
    laborCost: 42000,
    equipmentCost: 8000,
    logisticsCost: 5000,
    overheadProfitPct: 12,
    taxPct: 2.65,
    description: 'Analisa standar per m²: Bata hebel, semen mortar, tukang batu + mandor, scaffolding, profit 12% & PPh Final 2.65%',
  },
  {
    title: 'Pengecoran Beton Ready Mix K-300 Pelat Lantai',
    mode: 'construction',
    itemName: 'Pekerjaan Pengecoran Beton Ready Mix K-300 + Pompa Concrete Pump',
    qty: 85,
    unit: 'm³',
    materialCost: 980000,
    laborCost: 140000,
    equipmentCost: 120000,
    logisticsCost: 35000,
    overheadProfitPct: 10,
    taxPct: 2.65,
    description: 'Analisa per m³: Beton slump 12±2 cm, concrete pump, vibrator, regu cor tukang, uji silinder lab & PPh 2.65%',
  },
  {
    title: 'Tenaga Ahli Utama / Team Leader (Sipil/Software)',
    mode: 'consultant',
    itemName: 'Remunerasi Tenaga Ahli Utama / Team Leader (Billing Rate Man-Month)',
    qty: 4,
    unit: 'OB',
    materialCost: 0,
    laborCost: 20000000,
    equipmentCost: 1500000,
    logisticsCost: 2000000,
    overheadProfitPct: 15,
    taxPct: 2.0,
    description: 'Standar Billing Rate INKINDO: Gaji pokok ahli, tunjangan, asuransi, fasilitas laptop/server, overhead & PPh 23 (2%)',
  },
  {
    title: 'Pengadaan Unit Server Rack & UPS Backup',
    mode: 'procurement',
    itemName: 'Pengadaan Server Rack 2U Enterprise + UPS Online 3kVA (Include Setting)',
    qty: 2,
    unit: 'Unit',
    materialCost: 52000000,
    laborCost: 3500000,
    equipmentCost: 0,
    logisticsCost: 2500000,
    overheadProfitPct: 12,
    taxPct: 1.5,
    description: 'Pengadaan barang: Harga beli distributor resmi, ongkir pallet kayu asuransi, jasa teknisi setting, garansi & PPh 22 (1.5%)',
  },
];

export const ContractAhspModal: React.FC<ContractAhspModalProps> = ({
  isOpen,
  onClose,
  language = 'id',
  initialItemName = '',
  initialQty = '1',
  initialUnit = 'Unit',
  initialUnitPrice = '0',
  onApply,
}) => {
  const isId = language === 'id';

  // Mode
  const [mode, setMode] = useState<AhspMode>('construction');

  // Fields
  const [itemName, setItemName] = useState(initialItemName || 'Pekerjaan Pasangan Bata Ringan');
  const [qty, setQty] = useState<string>(initialQty || '1');
  const [unit, setUnit] = useState<string>(initialUnit || 'm²');

  // Cost components per unit
  const [materialCost, setMaterialCost] = useState<string>('95000');
  const [laborCost, setLaborCost] = useState<string>('42000');
  const [equipmentCost, setEquipmentCost] = useState<string>('8000');
  const [logisticsCost, setLogisticsCost] = useState<string>('5000');

  // Overhead, profit & tax
  const [overheadProfitPct, setOverheadProfitPct] = useState<string>('12');
  const [taxPct, setTaxPct] = useState<string>('2.65');
  const [taxLabel, setTaxLabel] = useState<string>('PPh Final Konstruksi (2.65%)');

  // Load initial if given
  useEffect(() => {
    if (isOpen) {
      if (initialItemName) {
        setItemName(initialItemName);
      }
      if (initialQty && initialQty !== '0') {
        setQty(initialQty);
      }
      if (initialUnit) {
        setUnit(initialUnit);
      }
      if (initialUnitPrice && Number(initialUnitPrice) > 0) {
        // approximate breakdown
        const price = Number(initialUnitPrice);
        setMaterialCost(Math.round(price * 0.55).toString());
        setLaborCost(Math.round(price * 0.25).toString());
        setEquipmentCost(Math.round(price * 0.05).toString());
        setLogisticsCost(Math.round(price * 0.03).toString());
      }
    }
  }, [isOpen, initialItemName, initialQty, initialUnit, initialUnitPrice]);

  // Set mode preset defaults
  const handleSelectMode = (newMode: AhspMode) => {
    setMode(newMode);
    if (newMode === 'construction') {
      setTaxPct('2.65');
      setTaxLabel('PPh Final Jasa Konstruksi (2.65%)');
      setOverheadProfitPct('12');
      if (!unit || unit === 'Unit') setUnit('m²');
    } else if (newMode === 'consultant') {
      setTaxPct('2.0');
      setTaxLabel('PPh Pasal 23 Jasa Konsultan (2%)');
      setOverheadProfitPct('15');
      if (!unit || unit === 'Unit') setUnit('OB');
    } else if (newMode === 'procurement') {
      setTaxPct('1.5');
      setTaxLabel('PPh Pasal 22 Badan Pengadaan Barang (1.5%)');
      setOverheadProfitPct('12');
      if (!unit || unit === 'OB') setUnit('Unit');
    } else {
      setTaxPct('0');
      setTaxLabel('Pajak Proyek Kustom (%)');
      setOverheadProfitPct('10');
    }
  };

  const applySample = (sample: AhspSample) => {
    setMode(sample.mode);
    setItemName(sample.itemName);
    setQty(sample.qty.toString());
    setUnit(sample.unit);
    setMaterialCost(sample.materialCost.toString());
    setLaborCost(sample.laborCost.toString());
    setEquipmentCost(sample.equipmentCost.toString());
    setLogisticsCost(sample.logisticsCost.toString());
    setOverheadProfitPct(sample.overheadProfitPct.toString());
    setTaxPct(sample.taxPct.toString());
    if (sample.mode === 'construction') {
      setTaxLabel('PPh Final Konstruksi (2.65%)');
    } else if (sample.mode === 'consultant') {
      setTaxLabel('PPh Pasal 23 Konsultan (2%)');
    } else if (sample.mode === 'procurement') {
      setTaxLabel('PPh Pasal 22 Pengadaan (1.5%)');
    }
  };

  // Calculations
  const matNum = Math.max(0, Number(materialCost) || 0);
  const labNum = Math.max(0, Number(laborCost) || 0);
  const eqNum = Math.max(0, Number(equipmentCost) || 0);
  const logNum = Math.max(0, Number(logisticsCost) || 0);
  const qtyNum = Math.max(0, Number(qty) || 1);

  const directCostPerUnit = matNum + labNum + eqNum + logNum;

  const ohPctNum = Math.max(0, Number(overheadProfitPct) || 0) / 100;
  const taxPctNum = Math.max(0, Number(taxPct) || 0) / 100;

  const overheadAmount = Math.round(directCostPerUnit * ohPctNum);
  const subtotalWithOverhead = directCostPerUnit + overheadAmount;
  const taxAmount = Math.round(subtotalWithOverhead * taxPctNum);

  const unitPriceFinal = subtotalWithOverhead + taxAmount;
  const totalAmountFinal = Math.round(unitPriceFinal * qtyNum);

  const formatRupiah = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const handleApply = () => {
    const breakdownText = `[Dasar Hitungan AHSP] Mat: ${formatRupiah(matNum)} + Upah: ${formatRupiah(labNum)} + Alat: ${formatRupiah(eqNum)} + Logistik: ${formatRupiah(logNum)} | Direct Cost: ${formatRupiah(directCostPerUnit)}/ ${unit} | OH/Margin (${overheadProfitPct}%): ${formatRupiah(overheadAmount)} | Pajak (${taxPct}%): ${formatRupiah(taxAmount)} -> Harga Satuan Kontrak: ${formatRupiah(unitPriceFinal)} / ${unit}`;

    onApply({
      itemName: itemName.trim() || 'Item Kontrak Proyek',
      qty: qtyNum.toString(),
      unit: unit.trim() || 'Unit',
      unitPrice: unitPriceFinal.toString(),
      plannedAmount: totalAmountFinal.toString(),
      breakdownNote: breakdownText,
      contractType: mode,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="contract-ahsp-modal-backdrop"
      data-no-swipe="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="contract-ahsp-modal-content"
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  {isId ? 'Dasar Hitungan & Analisa Harga Satuan (AHSP)' : 'Unit Price Analysis & Cost Breakdown (AHSP)'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {isId ? 'Kontrak Proyek' : 'Project Contract'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {isId
                  ? 'Hitung komponen bahan, upah, alat, logistik, overhead margin & pajak proyek untuk menghasilkan harga satuan kontrak resmi.'
                  : 'Calculate materials, labor, machinery, logistics, overhead margin & project tax to derive contractual unit prices.'}
              </p>
            </div>
          </div>

          <button
            id="close-ahsp-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
          {/* Quick Presets / Type selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isId ? 'Pilih Jenis Pekerjaan Kontrak / Industri:' : 'Select Contract Industry / Work Type:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectMode('construction')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'construction'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Building2 className={`w-4 h-4 ${mode === 'construction' ? 'text-blue-600' : 'text-slate-400'}`} />
                  {mode === 'construction' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <span className="text-xs font-bold">{isId ? 'Konstruksi Fisik' : 'Construction'}</span>
                <span className="text-[10px] text-slate-400">PPh Final 2.65%</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('consultant')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'consultant'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Briefcase className={`w-4 h-4 ${mode === 'consultant' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {mode === 'consultant' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-xs font-bold">{isId ? 'Jasa Konsultan' : 'Consultancy'}</span>
                <span className="text-[10px] text-slate-400">PPh 23 (2%)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('procurement')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'procurement'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Package className={`w-4 h-4 ${mode === 'procurement' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {mode === 'procurement' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <span className="text-xs font-bold">{isId ? 'Pengadaan Barang' : 'Procurement'}</span>
                <span className="text-[10px] text-slate-400">PPh 22 (1.5%)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('custom')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  mode === 'custom'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Layers className={`w-4 h-4 ${mode === 'custom' ? 'text-purple-600' : 'text-slate-400'}`} />
                  {mode === 'custom' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <span className="text-xs font-bold">{isId ? 'Kustom Bebas' : 'Custom Base'}</span>
                <span className="text-[10px] text-slate-400">Parameter Fleksibel</span>
              </button>
            </div>
          </div>

          {/* Quick Examples Pills */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
              {isId ? '💡 Contoh Cepat Dasar Hitungan Siap Pakai:' : '💡 Quick Ready Calculation Examples:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AHSP_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applySample(sample)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-slate-700 dark:text-slate-200"
                >
                  + {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Item Name, Qty, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isId ? 'Nama Item Pekerjaan / Pos Kontrak:' : 'Contract Work Item Name:'}
              </label>
              <input
                id="ahsp-item-name-input"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Contoh: Pekerjaan Pemasangan Dinding Bata Ringan t=10cm"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isId ? 'Volume / Qty Kontrak:' : 'Contract Volume / Qty:'}
              </label>
              <input
                id="ahsp-qty-input"
                type="number"
                min="0.01"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isId ? 'Satuan Kontrak:' : 'Contract Unit:'}
              </label>
              <input
                id="ahsp-unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m², m³, Unit, OB, Paket"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Dasar Hitungan (Cost Breakdown Inputs) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-blue-600" />
                {isId ? 'Komponen Biaya Langsung Pokok (Per 1 Satuan):' : 'Direct Base Cost Components (Per 1 Unit):'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {isId ? `Dasar perhitungan per 1 ${unit || 'Unit'}` : `Calculation base per 1 ${unit || 'Unit'}`}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-red-500" />
                  1. {isId ? 'Biaya Bahan / Material Pokok (Rp):' : 'Material / Raw Material Cost (Rp):'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">Rp</span>
                  <input
                    id="ahsp-material-cost-input"
                    type="number"
                    min="0"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-orange-500" />
                  2. {isId ? 'Biaya Upah / Tenaga Kerja (Rp):' : 'Labor / Personnel Wage Cost (Rp):'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">Rp</span>
                  <input
                    id="ahsp-labor-cost-input"
                    type="number"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-500" />
                  3. {isId ? 'Biaya Alat / Sewa Mesin / Lisensi (Rp):' : 'Machinery / Equipment / Software (Rp):'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">Rp</span>
                  <input
                    id="ahsp-equipment-cost-input"
                    type="number"
                    min="0"
                    value={equipmentCost}
                    onChange={(e) => setEquipmentCost(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-cyan-500" />
                  4. {isId ? 'Biaya Logistik, Transport & Pengujian (Rp):' : 'Logistics, Transport & Testing (Rp):'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">Rp</span>
                  <input
                    id="ahsp-logistics-cost-input"
                    type="number"
                    min="0"
                    value={logisticsCost}
                    onChange={(e) => setLogisticsCost(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Direct Cost Subtotal summary pill */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{isId ? 'Subtotal Biaya Pokok Langsung (HPP Dasar):' : 'Direct Base Cost Subtotal:'}</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-black">
                {formatRupiah(directCostPerUnit)} / {unit || 'Unit'}
              </span>
            </div>
          </div>

          {/* Overhead & Tax percentage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                {isId ? 'Overhead & Margin Profit Kontraktor (%):' : 'Overhead & Contractor Profit Margin (%):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ahsp-overhead-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={overheadProfitPct}
                  onChange={(e) => setOverheadProfitPct(e.target.value)}
                  className="w-24 p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold font-mono">
                  = +{formatRupiah(overheadAmount)} / {unit || 'Unit'}
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800/60">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block mb-1 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                {isId ? `Pajak Proyek (${taxLabel || 'Pajak'}):` : `Project Tax (${taxLabel || 'Tax'}):`}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ahsp-tax-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.05"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  className="w-24 p-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-bold font-mono">
                  = +{formatRupiah(taxAmount)} / {unit || 'Unit'}
                </span>
              </div>
            </div>
          </div>

          {/* Final Result Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-2xl border border-blue-900/60 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-800/50">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  {isId ? 'HASIL HARGA SATUAN KONTRAK' : 'RESULTING CONTRACT UNIT PRICE'}
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5">
                  {formatRupiah(unitPriceFinal)}
                  <span className="text-xs text-blue-200 font-sans font-bold ml-1.5">
                    / {unit || 'Unit'}
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                  {isId ? `TOTAL NILAI KONTRAK ITEM (${qtyNum} ${unit})` : `TOTAL ITEM VALUE (${qtyNum} ${unit})`}
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  {formatRupiah(totalAmountFinal)}
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-blue-200/90 leading-relaxed font-mono flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span>
                {isId
                  ? `Dasar: HPP (${formatRupiah(directCostPerUnit)}) + OH & Profit ${overheadProfitPct}% (${formatRupiah(overheadAmount)}) + Pajak ${taxPct}% (${formatRupiah(taxAmount)}) = ${formatRupiah(unitPriceFinal)}`
                  : `Base: Direct (${formatRupiah(directCostPerUnit)}) + OH & Profit ${overheadProfitPct}% (${formatRupiah(overheadAmount)}) + Tax ${taxPct}% (${formatRupiah(taxAmount)}) = ${formatRupiah(unitPriceFinal)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isId ? 'Data akan langsung mengisi baris anggaran proyek Anda.' : 'Data will directly populate your project budget row.'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="cancel-ahsp-btn"
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>

            <button
              id="apply-ahsp-btn"
              type="button"
              onClick={handleApply}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isId ? 'Terapkan ke Pos Anggaran Proyek' : 'Apply to Project Budget Item'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
