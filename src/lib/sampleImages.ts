export interface SampleImage {
  id: string;
  name: string;
  docType: 'receipt' | 'statement' | 'handwritten';
  description: string;
  mockResult: {
    amount: number;
    description: string;
    suggestedCategoryName: string;
    suggestedType: 'income' | 'expense';
    statementItems?: Array<{
      date: string;
      description: string;
      amount: number;
      type: 'income' | 'expense';
      categoryName: string;
    }>;
  };
  svgDataUri: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample_receipt_1',
    name: 'Struk Minimarket Indomaret',
    docType: 'receipt',
    description: 'Struk belanja sembako toko: Minyak Goreng, Beras, Telur',
    mockResult: {
      amount: 185000,
      description: 'Struk Indomaret - Belanja Minyak, Beras, Telur 1kg',
      suggestedCategoryName: 'Bahan Baku/Stok',
      suggestedType: 'expense',
    },
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none"><rect width="300" height="420" fill="%23F3F4F6"/><rect x="20" y="20" width="260" height="380" fill="white" rx="4" stroke="%23E5E7EB" stroke-width="2"/><text x="150" y="50" font-family="monospace" font-size="14" font-weight="bold" fill="%23111827" text-anchor="middle">INDOMARET KOTA</text><text x="150" y="68" font-family="monospace" font-size="10" fill="%236B7280" text-anchor="middle">Jl. Ahmad Yani No. 42</text><text x="150" y="82" font-family="monospace" font-size="10" fill="%236B7280" text-anchor="middle">Tlp: 021-5551234</text><line x1="30" y1="95" x2="270" y2="95" stroke="%239CA3AF" stroke-dasharray="4 4"/><text x="35" y="115" font-family="monospace" font-size="11" fill="%23374151">MINYAK GORENG 2L</text><text x="265" y="115" font-family="monospace" font-size="11" fill="%23374151" text-anchor="end">38.000</text><text x="35" y="135" font-family="monospace" font-size="11" fill="%23374151">BERAS PREMIUM 5KG</text><text x="265" y="135" font-family="monospace" font-size="11" fill="%23374151" text-anchor="end">72.000</text><text x="35" y="155" font-family="monospace" font-size="11" fill="%23374151">TELUR AYAM 1KG</text><text x="265" y="155" font-family="monospace" font-size="11" fill="%23374151" text-anchor="end">32.000</text><text x="35" y="175" font-family="monospace" font-size="11" fill="%23374151">GULA PASIR 2KG</text><text x="265" y="175" font-family="monospace" font-size="11" fill="%23374151" text-anchor="end">28.000</text><text x="35" y="195" font-family="monospace" font-size="11" fill="%23374151">KRESEK SEDANG</text><text x="265" y="195" font-family="monospace" font-size="11" fill="%23374151" text-anchor="end">15.000</text><line x1="30" y1="215" x2="270" y2="215" stroke="%239CA3AF" stroke-dasharray="4 4"/><text x="35" y="240" font-family="monospace" font-size="13" font-weight="bold" fill="%23111827">TOTAL</text><text x="265" y="240" font-family="monospace" font-size="14" font-weight="bold" fill="%232563EB" text-anchor="end">Rp 185.000</text><text x="35" y="260" font-family="monospace" font-size="10" fill="%236B7280">TUNAI: Rp 200.000</text><text x="265" y="260" font-family="monospace" font-size="10" fill="%236B7280" text-anchor="end">KEMBALI: 15.000</text><rect x="60" y="290" width="180" height="50" fill="%23111827" rx="2"/><text x="150" y="320" font-family="sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">BARCODE SCANNER</text><text x="150" y="375" font-family="monospace" font-size="9" fill="%239CA3AF" text-anchor="middle">TGL: 10/08/2026 09:14:22</text><text x="150" y="390" font-family="monospace" font-size="9" fill="%239CA3AF" text-anchor="middle">*** TERIMA KASIH ***</text></svg>`,
  },
  {
    id: 'sample_statement_1',
    name: 'Mutasi Bank BCA m-Admin',
    docType: 'statement',
    description: 'Screenshot mutasi BCA 3 transaksi (Transfer & QRIS)',
    mockResult: {
      amount: 0,
      description: 'Mutasi Rekening BCA',
      suggestedCategoryName: 'Transfer Masuk',
      suggestedType: 'income',
      statementItems: [
        {
          date: '2026-08-10',
          description: 'TRSF E-BANKING DB KIOS SEMBAKO BERKAH',
          amount: 850000,
          type: 'income',
          categoryName: 'Penjualan',
        },
        {
          date: '2026-08-09',
          description: 'QRIS WARUNG MAKAN BU SRI',
          amount: 35000,
          type: 'expense',
          categoryName: 'Makanan & Minuman',
        },
        {
          date: '2026-08-09',
          description: 'TRSF E-BANKING CR BAYAR LISTRIK PLN',
          amount: 145000,
          type: 'expense',
          categoryName: 'Tagihan',
        },
      ],
    },
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none"><rect width="300" height="420" fill="%230F172A"/><rect x="0" y="0" width="300" height="60" fill="%230055A5"/><text x="20" y="38" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">m-BCA Mutasi Rekening</text><rect x="15" y="75" width="270" height="320" fill="%231E293B" rx="8" stroke="%23334155"/><text x="30" y="100" font-family="sans-serif" font-size="12" font-weight="bold" fill="%2394A3B8">REKENING: 8830129841</text><line x1="30" y1="112" x2="270" y2="112" stroke="%23334155"/><g transform="translate(30, 125)"><text x="0" y="12" font-family="sans-serif" font-size="10" fill="%2394A3B8">10 AUG 2026</text><text x="0" y="28" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">TRSF E-BANKING CR</text><text x="0" y="42" font-family="sans-serif" font-size="10" fill="%2364748B">PEMBAYARAN GROSIR KIOS</text><text x="210" y="28" font-family="sans-serif" font-size="12" font-weight="bold" fill="%2310B981" text-anchor="end">+ 850.000</text></g><line x1="30" y1="182" x2="270" y2="182" stroke="%23334155"/><g transform="translate(30, 195)"><text x="0" y="12" font-family="sans-serif" font-size="10" fill="%2394A3B8">09 AUG 2026</text><text x="0" y="28" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">QRIS UTAMA</text><text x="0" y="42" font-family="sans-serif" font-size="10" fill="%2364748B">WARUNG MAKAN BU SRI</text><text x="210" y="28" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23EF4444" text-anchor="end">- 35.000</text></g><line x1="30" y1="252" x2="270" y2="252" stroke="%23334155"/><g transform="translate(30, 265)"><text x="0" y="12" font-family="sans-serif" font-size="10" fill="%2394A3B8">09 AUG 2026</text><text x="0" y="28" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">AUTODEBIT PLN</text><text x="0" y="42" font-family="sans-serif" font-size="10" fill="%2364748B">BAYAR LISTRIK RUMAH</text><text x="210" y="28" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23EF4444" text-anchor="end">- 145.000</text></g></svg>`,
  },
  {
    id: 'sample_handwritten_1',
    name: 'Catatan Tangan Kas (Masuk & Keluar)',
    docType: 'handwritten',
    description: 'Foto tulisan tangan catatan kas toko: Uang Masuk Penjualan & Uang Keluar Gaji/Bensin',
    mockResult: {
      amount: 0,
      description: 'Catatan Kas Toko: Pemasukan & Pengeluaran Harian',
      suggestedCategoryName: 'Penjualan',
      suggestedType: 'income',
      statementItems: [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Penjualan Toko / Setoran Omset',
          amount: 1250000,
          type: 'income',
          categoryName: 'Penjualan',
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'DP Pesanan Katering Bu Maya',
          amount: 500000,
          type: 'income',
          categoryName: 'Penjualan',
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Bayar Gaji Harian Kasir Budi',
          amount: 250000,
          type: 'expense',
          categoryName: 'Gaji/Upah',
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Beli Bensin & Galon Air Toko',
          amount: 35000,
          type: 'expense',
          categoryName: 'Operasional',
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Beli Kantong Plastik & Kresek',
          amount: 40000,
          type: 'expense',
          categoryName: 'Bahan Baku/Stok',
        },
      ],
    },
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none"><rect width="300" height="420" fill="%23FEF3C7"/><rect x="15" y="15" width="270" height="390" fill="%23FFFBEB" rx="4" stroke="%23FDE68A" stroke-width="2"/><line x1="15" y1="65" x2="285" y2="65" stroke="%23FCA5A5" stroke-width="1.5"/><line x1="15" y1="115" x2="285" y2="115" stroke="%23BFDBFE"/><line x1="15" y1="165" x2="285" y2="165" stroke="%23BFDBFE"/><line x1="15" y1="215" x2="285" y2="215" stroke="%23BFDBFE"/><line x1="15" y1="265" x2="285" y2="265" stroke="%23BFDBFE"/><line x1="15" y1="315" x2="285" y2="315" stroke="%23BFDBFE"/><text x="30" y="50" font-family="cursive, Georgia, serif" font-size="16" font-weight="bold" fill="%231E3A8A">Catatan Kas Toko (Harian)</text><text x="30" y="95" font-family="cursive, Georgia, serif" font-size="14" font-weight="bold" fill="%23059669">[+] Setoran Omset Toko : Rp 1.250.000</text><text x="30" y="145" font-family="cursive, Georgia, serif" font-size="14" font-weight="bold" fill="%23059669">[+] DP Katering Bu Maya : Rp 500.000</text><text x="30" y="195" font-family="cursive, Georgia, serif" font-size="14" fill="%23DC2626">[-] Bayar Gaji Kasir Budi : Rp 250.000</text><text x="30" y="245" font-family="cursive, Georgia, serif" font-size="14" fill="%23DC2626">[-] Bensin & Galon Air : Rp 35.000</text><text x="30" y="295" font-family="cursive, Georgia, serif" font-size="14" fill="%23DC2626">[-] Beli Kantong Plastik : Rp 40.000</text><text x="30" y="360" font-family="cursive, Georgia, serif" font-size="15" font-weight="bold" fill="%231E1B4B">Terpisah Otomatis oleh AI SakuKu</text></svg>`,
  },
];
