import { TransactionType, ModeType, Category, Account } from '../types';

export interface ParsedVoiceTransaction {
  amount: number;
  type: TransactionType;
  description: string;
  suggestedCategoryId?: string;
  suggestedAccountId?: string;
  suggestedMode?: ModeType;
  date: string;
  rawText: string;
  confidence: number;
  matchedKeywords: {
    category?: string;
    account?: string;
    typeWord?: string;
    amountStr?: string;
  };
}

/**
 * Smart natural language voice parser for SakuKu transactions
 */
export function parseVoiceToTransaction(
  spokenText: string,
  categories: Category[],
  accounts: Account[],
  activeMode: 'all' | ModeType = 'all'
): ParsedVoiceTransaction {
  const rawText = spokenText.trim();
  const lower = rawText.toLowerCase();

  // Helper for today's YYYY-MM-DD
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  let txDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  if (lower.includes('kemarin')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    txDate = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  } else if (lower.includes('lusa')) {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    txDate = `${twoDaysAgo.getFullYear()}-${pad(twoDaysAgo.getMonth() + 1)}-${pad(twoDaysAgo.getDate())}`;
  }

  // 1. DETERMINE TRANSACTION TYPE (Income vs Expense)
  let type: TransactionType = 'expense';
  let typeWord = 'beli/bayar';

  const incomeTriggers = [
    'terima', 'dapat', 'gaji', 'honor', 'omzet', 'omset', 'penjualan',
    'laba', 'transferan masuk', 'bonus', 'thr', 'bayaran', 'masuk',
    'income', 'sales', 'pendapatan', 'cair', 'piutang cair'
  ];

  const expenseTriggers = [
    'beli', 'bayar', 'keluar', 'belanja', 'ongkos', 'kulakan',
    'makan', 'bensin', 'listrik', 'pulsa', 'parkir', 'sewa',
    'gajian karyawan', 'tagihan', 'iuran', 'donasi', 'sedekah', 'cicilan'
  ];

  let hasIncomeTrigger = false;
  for (const trig of incomeTriggers) {
    if (new RegExp(`\\b${trig}\\b`, 'i').test(lower)) {
      hasIncomeTrigger = true;
      typeWord = trig;
      break;
    }
  }

  let hasExpenseTrigger = false;
  for (const trig of expenseTriggers) {
    if (new RegExp(`\\b${trig}\\b`, 'i').test(lower)) {
      hasExpenseTrigger = true;
      if (!hasIncomeTrigger) typeWord = trig;
      break;
    }
  }

  if (hasIncomeTrigger && !hasExpenseTrigger) {
    type = 'income';
  } else if (hasIncomeTrigger && hasExpenseTrigger) {
    if (lower.includes('gaji karyawan') || lower.includes('bayar gaji')) {
      type = 'expense';
    } else {
      type = 'income';
    }
  } else {
    type = 'expense';
  }

  // 2. EXTRACT AMOUNT
  let amount = 0;
  let amountStr = '';

  // Sanitize out quantity/weight numbers so they don't get misparsed as currency
  const sanitizedForAmount = lower
    .replace(/\b(\d+(?:[\.,]\d+)?)\s*(?:kg|karung|pouch|botol|karton|dus|box|set|unit|pcs|zak|lembar|rit|m3|m²|yard|meter|biji|butir|tray|jerigen|sak|roll|pack|bungkus|porsi|cup|piring|gelas)\b/gi, ' ');

  // A. Check Juta Patterns (e.g. "2.5 juta", "2,5 juta", "2 juta 500 ribu", "2.5jt", "10 juta")
  const jutaPattern = /(\d+(?:[\.,]\d+)?)\s*(?:juta|jt)(?:\s*(\d+(?:[\.,]\d+)?)\s*(?:ratus|ribu|rb)?)?/i;
  const jutaMatch = sanitizedForAmount.match(jutaPattern);
  if (jutaMatch) {
    const baseJutaStr = jutaMatch[1].replace(',', '.');
    const baseJuta = parseFloat(baseJutaStr) || 0;
    let total = baseJuta * 1000000;
    if (jutaMatch[2]) {
      const extraStr = jutaMatch[2].replace(',', '.');
      let extra = parseFloat(extraStr) || 0;
      if (jutaMatch[0].includes('ratus')) {
        extra *= 100000;
      } else if (extra < 1000) {
        extra *= 1000;
      }
      total += extra;
    }
    amount = Math.round(total);
    amountStr = `${jutaMatch[0]}`.trim();
  }

  // B. Check Ribu & Exact Number Patterns (e.g. "350 ribu", "50rb", "50k", "harga 180 ribu", "Rp 50.000", "50000")
  if (amount === 0) {
    const matches = [...sanitizedForAmount.matchAll(/(?:harga|seharga|nominal|sebesar|sejumlah|sebanyak|rp|rp\.)?\s*([\d\.\,]+)\s*(ribu|rb|k|ratus ribu|ratus rb)?/gi)];
    for (const m of matches) {
      if (!m[1]) continue;
      const raw = m[1].trim();
      const unit = (m[2] || '').toLowerCase().trim();

      if (unit.includes('ribu') || unit === 'rb' || unit === 'k') {
        const num = parseFloat(raw.replace(',', '.'));
        if (!isNaN(num) && num > 0) {
          amount = Math.round(num * 1000);
          amountStr = `${num} ${unit}`;
          break;
        }
      } else if (raw.includes('.') || raw.includes(',')) {
        const cleanDigits = raw.replace(/[\.,]/g, '');
        const num = parseFloat(cleanDigits);
        if (!isNaN(num) && num >= 1000) {
          amount = Math.round(num);
          amountStr = `Rp ${amount.toLocaleString('id-ID')}`;
          break;
        }
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num) && num >= 1000) {
          amount = Math.round(num);
          amountStr = `Rp ${amount.toLocaleString('id-ID')}`;
          break;
        }
      }
    }
  }

  // C. Check Spoken Indonesian Number Words
  if (amount === 0) {
    const wordsTable: [string, number][] = [
      ['tiga juta lima ratus ribu', 3500000],
      ['dua juta lima ratus ribu', 2500000],
      ['satu juta lima ratus ribu', 1500000],
      ['tiga juta', 3000000],
      ['dua juta', 2000000],
      ['satu juta', 1000000],
      ['sejuta', 1000000],
      ['lima ratus ribu', 500000],
      ['empat ratus ribu', 400000],
      ['tiga ratus lima puluh ribu', 350000],
      ['tiga ratus ribu', 300000],
      ['dua ratus lima puluh ribu', 250000],
      ['dua ratus ribu', 200000],
      ['seratus lima puluh ribu', 150000],
      ['seratus ribu', 100000],
      ['tujuh puluh lima ribu', 75000],
      ['lima puluh ribu', 50000],
      ['tiga puluh lima ribu', 35000],
      ['tiga puluh ribu', 30000],
      ['dua puluh lima ribu', 25000],
      ['dua puluh ribu', 20000],
      ['lima belas ribu', 15000],
      ['sepuluh ribu', 10000],
      ['lima ribu', 5000],
    ];

    for (const [w, val] of wordsTable) {
      if (lower.includes(w)) {
        amount = val;
        amountStr = w;
        break;
      }
    }
  }

  // 3. MATCH CATEGORY
  let matchedCategoryId: string | undefined;
  let matchedCategoryName: string | undefined;

  const validCats = categories.filter((c) => c.type === type);

  const categoryKeywords: Record<string, string[]> = {
    'makan': ['makan', 'minum', 'kopi', 'kafe', 'resto', 'warteg', 'bakso', 'nasi', 'sarapan', 'lunch', 'dinner', 'snack', 'jajan'],
    'sembako': ['sembako', 'pasar', 'supermarket', 'indomaret', 'alfamart', 'beras', 'minyak', 'telur', 'sayur', 'dapur', 'daging'],
    'transport': ['bensin', 'pertalite', 'pertamax', 'solar', 'grab', 'gojek', 'ojol', 'taxi', 'taksi', 'etoll', 'tol', 'parkir', 'ongkir', 'kereta', 'pesawat'],
    'tagihan': ['listrik', 'pln', 'pdam', 'air', 'wifi', 'indihome', 'internet', 'pulsa', 'kuota', 'bpjs', 'iuran'],
    'belanja': ['baju', 'celana', 'sepatu', 'shopee', 'tokopedia', 'lazada', 'tiktok shop', 'gadget', 'elektronik'],
    'kesehatan': ['obat', 'apotek', 'dokter', 'rumah sakit', 'klinik', 'vitamin', 'medis'],
    'pendidikan': ['spp', 'sekolah', 'les', 'buku', 'kursus', 'kuliah', 'seragam'],
    'hiburan': ['nonton', 'bioskop', 'game', 'liburan', 'hotel', 'wisata', 'netflix', 'spotify'],
    'kulakan': ['kulakan', 'stok barang', 'bahan baku', 'supplier', 'fmcg', 'gudang', 'restok', 'oli', 'sparepart'],
    'gaji': ['gaji barista', 'gaji karyawan', 'payroll', 'gaji staf', 'upah mekanik', 'lembur'],
    'sewa': ['sewa ruko', 'sewa toko', 'sewa tempat', 'kontrak'],
    'iklan': ['iklan', 'ads', 'brosur', 'banner', 'promosi', 'marketing'],
    'gaji_masuk': ['gaji bulanan', 'terima gaji', 'slip gaji', 'gajian'],
    'freelance': ['honor', 'freelance', 'proyek', 'desain', 'konsultasi', 'komisi'],
    'omzet': ['penjualan', 'omzet kafe', 'omzet toko', 'kasir toko', 'servis motor', 'servis mobil'],
    'investasi': ['dividen', 'bunga bank', 'crypto', 'saham', 'reksadana'],
  };

  for (const cat of validCats) {
    const catNameLower = cat.name.toLowerCase();
    if (lower.includes(catNameLower)) {
      matchedCategoryId = cat.id;
      matchedCategoryName = cat.name;
      break;
    }
  }

  if (!matchedCategoryId) {
    for (const [key, kws] of Object.entries(categoryKeywords)) {
      for (const kw of kws) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
          const cat = validCats.find((c) => {
            const cnl = c.name.toLowerCase();
            return cnl.includes(key) || cnl.includes(kw) || kw.includes(cnl);
          });
          if (cat) {
            matchedCategoryId = cat.id;
            matchedCategoryName = cat.name;
            break;
          }
        }
      }
      if (matchedCategoryId) break;
    }
  }

  if (!matchedCategoryId && validCats.length > 0) {
    matchedCategoryId = validCats[0].id;
    matchedCategoryName = validCats[0].name;
  }

  // 4. MATCH ACCOUNT
  let matchedAccountId: string | undefined;
  let matchedAccountName: string | undefined;

  const accountKeywords: Record<string, string[]> = {
    'cash': ['tunai', 'cash', 'kontan', 'uang fisik', 'dompet'],
    'bca': ['bca', 'bank bca', 'klikbca', 'm-bca'],
    'mandiri': ['mandiri', 'livin', 'bank mandiri'],
    'bri': ['bri', 'brimo', 'bank bri'],
    'bni': ['bni', 'bni mobile'],
    'gopay': ['gopay', 'gojek', 'gopay coins'],
    'ovo': ['ovo', 'ovo cash'],
    'dana': ['dana'],
    'shopeepay': ['shopeepay', 'shopee pay', 'spay'],
    'qris': ['qris', 'scan qris', 'barcode'],
  };

  for (const acc of accounts) {
    const accNameLower = acc.name.toLowerCase();
    if (lower.includes(accNameLower)) {
      matchedAccountId = acc.id;
      matchedAccountName = acc.name;
      break;
    }
  }

  if (!matchedAccountId) {
    for (const [key, kws] of Object.entries(accountKeywords)) {
      for (const kw of kws) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
          const acc = accounts.find((a) => {
            const anl = a.name.toLowerCase();
            return anl.includes(key) || anl.includes(kw);
          });
          if (acc) {
            matchedAccountId = acc.id;
            matchedAccountName = acc.name;
            break;
          }
        }
      }
      if (matchedAccountId) break;
    }
  }

  if (!matchedAccountId && accounts.length > 0) {
    matchedAccountId = accounts[0].id;
    matchedAccountName = accounts[0].name;
  }

  // 5. EXTRACT DESCRIPTION
  let description = rawText
    .replace(/(?:catat|tambah|input|tolong masukkan|buatkan transaksi|masukkan)\s+/i, '')
    .replace(/(?:sebesar|seharga|nominal|sejumlah)\s+[\d\.\,]+\s*(?:juta|jt|ribu|rb|k|ratus ribu)?/i, '')
    .replace(/(?:pakai|menggunakan|bayar via|lewat|ke|dari|rekening|akun)\s+(?:bca|mandiri|bri|bni|gopay|ovo|dana|shopeepay|qris|tunai|cash|dompet)/i, '')
    .replace(/(?:pada tanggal|tgl|kemarin|hari ini|lusa)/i, '')
    .trim();

  description = description.replace(/\s+(pakai|via|ke|dari|sebesar|rp)$/i, '').trim();

  if (!description || description.length < 3) {
    description = rawText;
  }

  description = description.charAt(0).toUpperCase() + description.slice(1);

  // 6. DETECT MODE
  let suggestedMode: ModeType = 'personal';
  if (activeMode !== 'all') {
    suggestedMode = activeMode;
  } else {
    const bizAccount = accounts.find((a) => a.id === matchedAccountId && a.scope === 'business');
    if (bizAccount) {
      suggestedMode = 'business';
    } else if (
      lower.includes('kafe') ||
      lower.includes('toko') ||
      lower.includes('warung') ||
      lower.includes('bengkel') ||
      lower.includes('kulakan') ||
      lower.includes('omzet') ||
      lower.includes('gaji karyawan') ||
      lower.includes('omset')
    ) {
      suggestedMode = 'business';
    }
  }

  const confidence = amount > 0 && matchedCategoryId ? 95 : amount > 0 ? 85 : 70;

  return {
    amount,
    type,
    description,
    suggestedCategoryId: matchedCategoryId,
    suggestedAccountId: matchedAccountId,
    suggestedMode,
    date: txDate,
    rawText,
    confidence,
    matchedKeywords: {
      category: matchedCategoryName,
      account: matchedAccountName,
      typeWord,
      amountStr: amountStr || String(amount),
    },
  };
}
