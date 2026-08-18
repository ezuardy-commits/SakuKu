// ============================================================================
// AI LOCAL MARKET PRICE REFERENCE ENGINE (PASARAN LOKAL INDONESIA 2026)
// Database & Estimator Harga Pasaran UMKM, Sembako, Bahan Baku, Jasa & Operasional
// ============================================================================

export interface MarketPriceResult {
  matched: boolean;
  name: string;
  unitPrice: number;
  unit: string;
  categoryName?: string;
  priceRange?: { min: number; max: number };
  source: string;
  confidence: number;
  note?: string;
}

export interface LocalMarketItem {
  keywords: string[];
  name: string;
  unitPrice: number;
  unit: string;
  categoryName: string;
  minPrice: number;
  maxPrice: number;
  section: 'cogs' | 'opex' | 'revenue' | 'debt_receivable' | 'capex_equity';
}

export const LOCAL_MARKET_DATABASE: LocalMarketItem[] = [
  // ═══ 1. SEMBAKO, BAHAN POKOK & MAKANAN DAPUR ═══
  {
    keywords: ['beras ramos 5kg', 'beras 5kg', 'beras 5 kg', 'beras premium 5kg', 'beras pandan wangi 5kg', 'beras rojolele 5kg', 'beras 5kg'],
    name: 'Beras Premium 5 Kilogram (Ramos / Pandan Wangi)',
    unitPrice: 72000,
    unit: 'Karung',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 68000,
    maxPrice: 78000,
    section: 'cogs',
  },
  {
    keywords: ['beras ramos 25kg', 'beras 25kg', 'beras 25 kg', 'beras karung 25kg', 'beras pandan wangi 25kg'],
    name: 'Beras Premium 25 Kilogram',
    unitPrice: 350000,
    unit: 'Karung',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 335000,
    maxPrice: 375000,
    section: 'cogs',
  },
  {
    keywords: ['beras ramos 50kg', 'beras 50kg', 'beras 50 kg', 'beras karung 50kg', 'kulakan beras 50kg'],
    name: 'Beras Premium 50 Kilogram (Kulakan Grosir)',
    unitPrice: 670000,
    unit: 'Karung',
    categoryName: 'Kulakan Sembako',
    minPrice: 650000,
    maxPrice: 710000,
    section: 'cogs',
  },
  {
    keywords: ['beras', 'beras kg', 'beras eceran', 'beras medium', 'beras pulen'],
    name: 'Beras Medium / Premium Eceran',
    unitPrice: 15500,
    unit: 'Kg',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 14000,
    maxPrice: 17000,
    section: 'cogs',
  },
  {
    keywords: ['minyak goreng 2l', 'minyak goreng 2 liter', 'minyak bimoli 2l', 'minyak filma 2l', 'minyak sania 2l', 'minyak sunco 2l', 'minyak goreng pouch', 'minyak goreng kemasan'],
    name: 'Minyak Goreng Kemasan Pouch 2 Liter (Bimoli / Sania / Filma)',
    unitPrice: 34500,
    unit: 'Pouch',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 32000,
    maxPrice: 38000,
    section: 'cogs',
  },
  {
    keywords: ['minyak goreng 1l', 'minyak goreng 1 liter', 'minyak curah 1l', 'minyak goreng'],
    name: 'Minyak Goreng Kemasan 1 Liter',
    unitPrice: 17500,
    unit: 'Liter',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 16000,
    maxPrice: 19500,
    section: 'cogs',
  },
  {
    keywords: ['minyak goreng karton', 'minyak goreng dus', 'kulakan minyak goreng'],
    name: 'Minyak Goreng Kemasan Karton (6 Pouch x 2L)',
    unitPrice: 205000,
    unit: 'Karton',
    categoryName: 'Kulakan Sembako',
    minPrice: 195000,
    maxPrice: 220000,
    section: 'cogs',
  },
  {
    keywords: ['gula pasir 1kg', 'gula pasir', 'gulaku', 'gula kristal putih', 'gula 1kg'],
    name: 'Gula Pasir Kristal Putih 1 Kilogram (Gulaku / GMP)',
    unitPrice: 17500,
    unit: 'Kg',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 16500,
    maxPrice: 19000,
    section: 'cogs',
  },
  {
    keywords: ['gula pasir 50kg', 'gula karung 50kg', 'kulakan gula 50kg'],
    name: 'Gula Pasir Karung 50 Kilogram (Distributor Grosir)',
    unitPrice: 820000,
    unit: 'Karung',
    categoryName: 'Kulakan Sembako',
    minPrice: 790000,
    maxPrice: 860000,
    section: 'cogs',
  },
  {
    keywords: ['telur ayam', 'telur ayam negeri', 'telur 1kg', 'telor ayam', 'telor 1kg'],
    name: 'Telur Ayam Negeri Segar',
    unitPrice: 28000,
    unit: 'Kg',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 26000,
    maxPrice: 31000,
    section: 'cogs',
  },
  {
    keywords: ['telur 1 tray', 'telur 2 tray', 'telur tray', 'telur 30 butir', 'telur karpet'],
    name: 'Telur Ayam 1 Tray (30 Butir)',
    unitPrice: 54000,
    unit: 'Tray',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 50000,
    maxPrice: 60000,
    section: 'cogs',
  },
  {
    keywords: ['telur 1 peti', 'telur peti', 'kulakan telur 1 peti', 'telur 10kg', 'telur 15kg'],
    name: 'Telur Ayam Negeri Kulakan 1 Peti (10-15 Kg)',
    unitPrice: 275000,
    unit: 'Peti',
    categoryName: 'Kulakan Sembako',
    minPrice: 260000,
    maxPrice: 300000,
    section: 'cogs',
  },
  {
    keywords: ['tepung terigu', 'segitiga biru', 'cakra kembar', 'kunci biru', 'tepung terigu 1kg'],
    name: 'Tepung Terigu Segitiga Biru / Cakra 1 Kilogram',
    unitPrice: 12500,
    unit: 'Kg',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 11500,
    maxPrice: 14500,
    section: 'cogs',
  },
  {
    keywords: ['tepung terigu karung', 'terigu 25kg', 'terigu karung 25kg', 'kulakan terigu'],
    name: 'Tepung Terigu Karung 25 Kilogram',
    unitPrice: 215000,
    unit: 'Karung',
    categoryName: 'Kulakan Sembako',
    minPrice: 200000,
    maxPrice: 235000,
    section: 'cogs',
  },
  {
    keywords: ['indomie', 'mie instan', 'mi instan', 'indomie goreng', 'mie sedaap', 'indomie karton', 'mi instan karton'],
    name: 'Mi Instan Indomie / Sedaap (1 Karton isi 40 bks)',
    unitPrice: 118000,
    unit: 'Karton',
    categoryName: 'Kulakan Sembako',
    minPrice: 112000,
    maxPrice: 128000,
    section: 'cogs',
  },
  {
    keywords: ['gas elpiji 3kg', 'gas lpg 3kg', 'gas melon', 'tabung gas 3kg', 'isi ulang gas 3kg', 'lpg 3kg'],
    name: 'Isi Ulang Gas LPG 3 Kilogram (Melon)',
    unitPrice: 22000,
    unit: 'Tabung',
    categoryName: 'Bahan Pokok & Operasional',
    minPrice: 20000,
    maxPrice: 25000,
    section: 'cogs',
  },
  {
    keywords: ['gas 12kg', 'gas lpg 12kg', 'lpg 12kg', 'isi ulang gas 12kg', 'bright gas 12kg'],
    name: 'Isi Ulang Gas LPG 12 Kilogram (Bright Gas)',
    unitPrice: 215000,
    unit: 'Tabung',
    categoryName: 'Bahan Pokok & Operasional',
    minPrice: 205000,
    maxPrice: 230000,
    section: 'cogs',
  },
  {
    keywords: ['air galon aqua', 'aqua galon', 'isi ulang aqua', 'galon le minerale'],
    name: 'Air Minum Galon Aqua / Le Minerale 19 Liter',
    unitPrice: 20000,
    unit: 'Galon',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 19000,
    maxPrice: 23000,
    section: 'cogs',
  },
  {
    keywords: ['air minum galon isi ulang', 'galon isi ulang', 'air isi ulang', 'air galon depo'],
    name: 'Air Minum Galon Isi Ulang Depo Higienis',
    unitPrice: 7000,
    unit: 'Galon',
    categoryName: 'Bahan Pokok & Dapur',
    minPrice: 6000,
    maxPrice: 8500,
    section: 'cogs',
  },
  {
    keywords: ['daging sapi', 'daging sapi segar', 'daging sapi murni', 'daging rendang', 'daging rawon'],
    name: 'Daging Sapi Segar Paha / Rendang (Pasar Tradisional)',
    unitPrice: 135000,
    unit: 'Kg',
    categoryName: 'Bahan Makanan Segar',
    minPrice: 125000,
    maxPrice: 150000,
    section: 'cogs',
  },
  {
    keywords: ['daging ayam', 'ayam potong', 'ayam broiler', 'ayam karkas', 'ayam negeri 1kg'],
    name: 'Daging Ayam Broiler / Potong Segar',
    unitPrice: 36000,
    unit: 'Kg',
    categoryName: 'Bahan Makanan Segar',
    minPrice: 33000,
    maxPrice: 42000,
    section: 'cogs',
  },
  {
    keywords: ['ayam kampung', 'ayam kampung 1 ekor', 'ayam pejantan'],
    name: 'Ayam Kampung / Pejantan Segar (1 Ekor)',
    unitPrice: 65000,
    unit: 'Ekor',
    categoryName: 'Bahan Makanan Segar',
    minPrice: 55000,
    maxPrice: 78000,
    section: 'cogs',
  },
  {
    keywords: ['ikan nila', 'ikan gurame', 'ikan lele', 'ikan mas', 'ikan tongkol'],
    name: 'Ikan Segar (Nila / Gurame / Lele / Tongkol)',
    unitPrice: 34000,
    unit: 'Kg',
    categoryName: 'Bahan Makanan Segar',
    minPrice: 28000,
    maxPrice: 45000,
    section: 'cogs',
  },
  {
    keywords: ['bawang merah', 'bawang merah brebes', 'bawang merah 1kg'],
    name: 'Bawang Merah Segar (Brebes Super)',
    unitPrice: 36000,
    unit: 'Kg',
    categoryName: 'Bumbu & Sayur Segar',
    minPrice: 30000,
    maxPrice: 45000,
    section: 'cogs',
  },
  {
    keywords: ['bawang putih', 'bawang putih kating', 'bawang putih honan'],
    name: 'Bawang Putih Kating / Honan Segar',
    unitPrice: 38000,
    unit: 'Kg',
    categoryName: 'Bumbu & Sayur Segar',
    minPrice: 32000,
    maxPrice: 46000,
    section: 'cogs',
  },
  {
    keywords: ['cabai rawit', 'cabe rawit merah', 'cabai merah keriting', 'cabe merah', 'cabai'],
    name: 'Cabai Merah Keriting / Cabai Rawit Merah Segar',
    unitPrice: 48000,
    unit: 'Kg',
    categoryName: 'Bumbu & Sayur Segar',
    minPrice: 35000,
    maxPrice: 65000,
    section: 'cogs',
  },

  // ═══ 2. KAFE, KOPI & BAHAN BAKU F&B ═══
  {
    keywords: ['kopi arabika', 'biji kopi arabika', 'arabika gayo', 'biji kopi arabika 1kg', 'roasted bean arabika', 'kopi arabica'],
    name: 'Biji Kopi Sangrai Arabika Specialty 1 Kilogram (Roastery)',
    unitPrice: 195000,
    unit: 'Kg',
    categoryName: 'Bahan Baku Kafe',
    minPrice: 175000,
    maxPrice: 240000,
    section: 'cogs',
  },
  {
    keywords: ['kopi robusta', 'biji kopi robusta', 'robusta toraja', 'robusta lampung', 'robusta 1kg'],
    name: 'Biji Kopi Sangrai Robusta Grade 1 (1 Kilogram)',
    unitPrice: 125000,
    unit: 'Kg',
    categoryName: 'Bahan Baku Kafe',
    minPrice: 110000,
    maxPrice: 145000,
    section: 'cogs',
  },
  {
    keywords: ['susu diamond', 'susu fresh milk', 'susu uht barista', 'susu pasteurisasi 1l', 'susu greenfields', 'fresh milk'],
    name: 'Susu Segar Pasteurisasi Barista Edition 1 Liter (Diamond / Greenfields)',
    unitPrice: 24500,
    unit: 'Liter',
    categoryName: 'Bahan Baku Minuman',
    minPrice: 22000,
    maxPrice: 27000,
    section: 'cogs',
  },
  {
    keywords: ['susu oat', 'oatside', 'almond milk barista', 'susu nabati barista'],
    name: 'Susu Oat Barista Oatside / Almond Milk 1 Liter',
    unitPrice: 42000,
    unit: 'Liter',
    categoryName: 'Bahan Baku Minuman',
    minPrice: 38000,
    maxPrice: 48000,
    section: 'cogs',
  },
  {
    keywords: ['sirup monin', 'sirup torani', 'sirup davinci', 'syrup vanilla', 'syrup caramel', 'sirup rasa'],
    name: 'Sirup Perisa Minuman Barista 750ml (Monin / Torani / Davinci)',
    unitPrice: 145000,
    unit: 'Botol',
    categoryName: 'Bahan Baku Minuman',
    minPrice: 130000,
    maxPrice: 165000,
    section: 'cogs',
  },
  {
    keywords: ['bubuk matcha', 'matcha powder', 'bubuk cokelat', 'cocoa powder', 'red velvet powder'],
    name: 'Bubuk Minuman Premium Barista Grade (Matcha / Cokelat 1 Kg)',
    unitPrice: 140000,
    unit: 'Kg',
    categoryName: 'Bahan Baku Minuman',
    minPrice: 115000,
    maxPrice: 175000,
    section: 'cogs',
  },
  {
    keywords: ['cup sablon', 'cup sablon 12oz', 'cup 16oz', 'paper cup', 'cup kopi'],
    name: 'Cup Minuman Sablon Logo Branded 12oz / 16oz (Harga per Pcs)',
    unitPrice: 2800,
    unit: 'Pcs',
    categoryName: 'Kemasan & Packaging',
    minPrice: 2200,
    maxPrice: 3500,
    section: 'cogs',
  },
  {
    keywords: ['lid cup', 'sedotan paper', 'sedotan steril', 'tissue branded', 'kemasan takeaway'],
    name: 'Paket Perlengkapan Lid Cup, Sedotan & Tisu Makan',
    unitPrice: 85000,
    unit: 'Paket',
    categoryName: 'Kemasan & Packaging',
    minPrice: 65000,
    maxPrice: 110000,
    section: 'cogs',
  },

  // ═══ 3. OTOMOTIF & BENGKEL ═══
  {
    keywords: ['oli motor matic', 'oli mpx2', 'oli yamalube', 'oli mesin motor', 'oli castrol power1', 'oli motor 0.8l'],
    name: 'Oli Mesin Motor Matic 0.8L (AHM MPX2 / Yamalube / Castrol)',
    unitPrice: 65000,
    unit: 'Botol',
    categoryName: 'Stok Sparepart & Pelumas',
    minPrice: 55000,
    maxPrice: 75000,
    section: 'cogs',
  },
  {
    keywords: ['oli mobil', 'oli shell helix', 'oli pertamina fastron', 'oli mobil 4 liter', 'oli total quartz'],
    name: 'Oli Mesin Mobil Galon 4 Liter (Shell Helix / Fastron 10W-40)',
    unitPrice: 385000,
    unit: 'Galon',
    categoryName: 'Stok Sparepart & Pelumas',
    minPrice: 340000,
    maxPrice: 450000,
    section: 'cogs',
  },
  {
    keywords: ['kampas rem motor', 'brake pad motor', 'kampas rem depan motor', 'kampas rem vario', 'kampas rem beat'],
    name: 'Kampas Rem Cakram / Tromol Motor (Depan / Belakang)',
    unitPrice: 48000,
    unit: 'Set',
    categoryName: 'Stok Sparepart',
    minPrice: 38000,
    maxPrice: 65000,
    section: 'cogs',
  },
  {
    keywords: ['kampas rem mobil', 'brake pad mobil', 'kampas rem avanza', 'kampas rem innova'],
    name: 'Kampas Rem Cakram Mobil (Disc Brake Pad Set)',
    unitPrice: 245000,
    unit: 'Set',
    categoryName: 'Stok Sparepart Mobil',
    minPrice: 195000,
    maxPrice: 320000,
    section: 'cogs',
  },
  {
    keywords: ['busi motor', 'busi ngk', 'busi denso', 'busi beat', 'busi vario'],
    name: 'Busi Motor Standar Original (NGK / Denso)',
    unitPrice: 25000,
    unit: 'Pcs',
    categoryName: 'Stok Sparepart',
    minPrice: 20000,
    maxPrice: 32000,
    section: 'cogs',
  },
  {
    keywords: ['aki motor', 'aki gs astra', 'aki yuasa', 'aki kering motor', 'aki gtz5s'],
    name: 'Aki Kering Motor GS Astra / Yuasa 12V (GTZ5S)',
    unitPrice: 245000,
    unit: 'Unit',
    categoryName: 'Stok Aki & Kelistrikan',
    minPrice: 220000,
    maxPrice: 280000,
    section: 'cogs',
  },
  {
    keywords: ['aki mobil', 'aki mobil gs', 'aki mobil amaron', 'aki mobil 45ah'],
    name: 'Aki Mobil 12V 45Ah - 60Ah (GS Astra / Amaron)',
    unitPrice: 850000,
    unit: 'Unit',
    categoryName: 'Stok Aki & Kelistrikan',
    minPrice: 750000,
    maxPrice: 1050000,
    section: 'cogs',
  },
  {
    keywords: ['ban motor tubeless', 'ban irc', 'ban fdr', 'ban maxxis', 'ban motor matic 80/90-14'],
    name: 'Ban Motor Tubeless Ukuran 80/90-14 / 90/90-14 (IRC / FDR)',
    unitPrice: 215000,
    unit: 'Pcs',
    categoryName: 'Stok Ban & Velg',
    minPrice: 190000,
    maxPrice: 260000,
    section: 'cogs',
  },
  {
    keywords: ['vanbelt motor', 'roller cvt', 'v-belt motor matic'],
    name: 'Vanbelt (V-Belt) & Roller CVT Motor Matic Set',
    unitPrice: 135000,
    unit: 'Set',
    categoryName: 'Stok Sparepart',
    minPrice: 110000,
    maxPrice: 165000,
    section: 'cogs',
  },

  // ═══ 4. LAUNDRY & PERAWATAN ═══
  {
    keywords: ['deterjen laundry 5l', 'deterjen cair 5l', 'deterjen laundry jerigen', 'sabun cuci laundry', 'deterjen laundry'],
    name: 'Deterjen Konsentrat Laundry Rendah Busa (Jerigen 5L)',
    unitPrice: 65000,
    unit: 'Jerigen',
    categoryName: 'Bahan Baku Laundry',
    minPrice: 50000,
    maxPrice: 85000,
    section: 'cogs',
  },
  {
    keywords: ['deterjen laundry 25kg', 'deterjen 25kg', 'deterjen karung 25kg', 'sabun bubuk 25kg', 'kulakan deterjen 25kg'],
    name: 'Deterjen Bubuk Industrial Laundry Karung 25 Kilogram',
    unitPrice: 320000,
    unit: 'Karung',
    categoryName: 'Bahan Baku Laundry',
    minPrice: 280000,
    maxPrice: 360000,
    section: 'cogs',
  },
  {
    keywords: ['pelembut pakaian', 'softener laundry', 'downy 5l', 'molto 5l'],
    name: 'Pelembut & Pewangi Pakaian Softener Laundry (5 Liter)',
    unitPrice: 58000,
    unit: 'Jerigen',
    categoryName: 'Bahan Baku Laundry',
    minPrice: 45000,
    maxPrice: 75000,
    section: 'cogs',
  },
  {
    keywords: ['parfum laundry', 'parfum laundry 1l', 'parfum laundry 5l', 'pewangi setrika'],
    name: 'Parfum Laundry Grade A Tahan Lama (Kemasan 1 Liter)',
    unitPrice: 55000,
    unit: 'Botol',
    categoryName: 'Bahan Baku Laundry',
    minPrice: 42000,
    maxPrice: 75000,
    section: 'cogs',
  },
  {
    keywords: ['plastik laundry', 'plastik packing laundry', 'plastik jinjing laundry'],
    name: 'Plastik Packing Segel Laundry (Roll / Pack 1 Kg)',
    unitPrice: 42000,
    unit: 'Pack',
    categoryName: 'Perlengkapan Packing',
    minPrice: 35000,
    maxPrice: 52000,
    section: 'cogs',
  },
  {
    keywords: ['hanger kawat', 'gantungan baju kawat', 'hanger laundry 100'],
    name: 'Hanger Kawat Laundry Anti Karat (Pack isi 100 Pcs)',
    unitPrice: 42000,
    unit: 'Pack',
    categoryName: 'Perlengkapan Laundry',
    minPrice: 35000,
    maxPrice: 55000,
    section: 'cogs',
  },

  // ═══ 5. FASHION, TEKSTIL & KONVEKSI ═══
  {
    keywords: ['kain katun toyobo', 'kain toyobo', 'toyobo fodu', 'kain toyobo yard'],
    name: 'Kain Katun Toyobo Royal Mix / Fodu Premium',
    unitPrice: 42000,
    unit: 'Yard',
    categoryName: 'Bahan Baku Kain',
    minPrice: 36000,
    maxPrice: 48000,
    section: 'cogs',
  },
  {
    keywords: ['kain rayon viscose', 'kain rayon', 'rayon twill', 'kain rayon yard'],
    name: 'Kain Rayon Viscose / Rayon Twill Motif & Polos',
    unitPrice: 35000,
    unit: 'Yard',
    categoryName: 'Bahan Baku Kain',
    minPrice: 30000,
    maxPrice: 42000,
    section: 'cogs',
  },
  {
    keywords: ['kain drill', 'american drill', 'japan drill', 'kain seragam'],
    name: 'Kain Drill Seragam Kantor (American / Japan Drill)',
    unitPrice: 52000,
    unit: 'Yard',
    categoryName: 'Bahan Baku Seragam',
    minPrice: 45000,
    maxPrice: 60000,
    section: 'cogs',
  },
  {
    keywords: ['kain cotton combed', 'combed 30s', 'combed 24s', 'kain kaos combed'],
    name: 'Kain Cotton Combed 30s / 24s Reaktif (Kiloan)',
    unitPrice: 125000,
    unit: 'Kg',
    categoryName: 'Bahan Baku Kaos',
    minPrice: 110000,
    maxPrice: 140000,
    section: 'cogs',
  },
  {
    keywords: ['benang jahit', 'benang jahit astra', 'benang jahit cone', 'benang obras'],
    name: 'Benang Jahit Industri Astra / Extra (Cone Besar)',
    unitPrice: 16500,
    unit: 'Cone',
    categoryName: 'Aksesoris Jahit',
    minPrice: 14000,
    maxPrice: 20000,
    section: 'cogs',
  },
  {
    keywords: ['resleting ykk', 'zipper ykk', 'resleting jepang', 'zipper jepang'],
    name: 'Resleting YKK / Zipper Jepang Original (Lusin isi 12 pcs)',
    unitPrice: 35000,
    unit: 'Lusin',
    categoryName: 'Aksesoris Jahit',
    minPrice: 28000,
    maxPrice: 45000,
    section: 'cogs',
  },

  // ═══ 6. KONSTRUKSI, BAHAN BANGUNAN & PROYEK ═══
  {
    keywords: ['semen portland', 'semen tiga roda 50kg', 'semen gresik 50kg', 'semen dynamix', 'semen 50kg'],
    name: 'Semen Portland PCC 50 Kilogram (Tiga Roda / Gresik)',
    unitPrice: 72000,
    unit: 'Sak',
    categoryName: 'Material Konstruksi',
    minPrice: 66000,
    maxPrice: 78000,
    section: 'cogs',
  },
  {
    keywords: ['bata ringan', 'bata hebel', 'hebel 7.5cm', 'hebel 10cm', 'bata ringan hebel'],
    name: 'Bata Ringan Hebel AAC Standar 10cm / 7.5cm (Harga per Buah)',
    unitPrice: 7800,
    unit: 'Buah',
    categoryName: 'Material Pasangan Dinding',
    minPrice: 7000,
    maxPrice: 8800,
    section: 'cogs',
  },
  {
    keywords: ['pasir cor', 'pasir pasang', 'pasir truk', 'pasir cor 1 truk'],
    name: 'Pasir Cor / Pasir Pasang Hitam Alami (1 Truk Dump 6-7 m3)',
    unitPrice: 1450000,
    unit: 'Truk',
    categoryName: 'Material Agregat',
    minPrice: 1250000,
    maxPrice: 1750000,
    section: 'cogs',
  },
  {
    keywords: ['batu split', 'split cor', 'batu split 1 truk', 'kerikil cor'],
    name: 'Batu Split Cor 1/2 dan 2/3 (1 Truk Dump)',
    unitPrice: 1650000,
    unit: 'Truk',
    categoryName: 'Material Agregat',
    minPrice: 1450000,
    maxPrice: 1950000,
    section: 'cogs',
  },
  {
    keywords: ['besi beton d13', 'besi ulir d13', 'besi d13 sni', 'besi ulir 13mm'],
    name: 'Besi Beton Ulir D13 SNI Panjang 12 Meter',
    unitPrice: 135000,
    unit: 'Batang',
    categoryName: 'Material Besi & Baja',
    minPrice: 125000,
    maxPrice: 148000,
    section: 'cogs',
  },
  {
    keywords: ['besi beton d10', 'besi ulir d10', 'besi d10 sni', 'besi polos 10mm'],
    name: 'Besi Beton Ulir / Polos D10 SNI Panjang 12 Meter',
    unitPrice: 84000,
    unit: 'Batang',
    categoryName: 'Material Besi & Baja',
    minPrice: 76000,
    maxPrice: 92000,
    section: 'cogs',
  },
  {
    keywords: ['beton ready mix', 'ready mix k300', 'ready mix k250', 'beton cor k300'],
    name: 'Beton Ready Mix Cor K-300 Slump 12cm (Harga per m3)',
    unitPrice: 940000,
    unit: 'm3',
    categoryName: 'Material Pengecoran',
    minPrice: 890000,
    maxPrice: 1020000,
    section: 'cogs',
  },
  {
    keywords: ['keramik lantai 60x60', 'keramik 60x60', 'granit 60x60', 'keramik lantai dus'],
    name: 'Keramik / Granit Lantai 60x60 Glazed Polished (Dus isi 1.44 m2)',
    unitPrice: 115000,
    unit: 'Dus',
    categoryName: 'Material Finishing Lantai',
    minPrice: 95000,
    maxPrice: 145000,
    section: 'cogs',
  },
  {
    keywords: ['cat tembok interior', 'cat dulux', 'cat jotun', 'cat vinilex pail', 'cat tembok 20kg'],
    name: 'Cat Tembok Interior & Eksterior Pail 20 Kg (Dulux / Vinilex / Jotun)',
    unitPrice: 650000,
    unit: 'Pail',
    categoryName: 'Material Cat & Finishing',
    minPrice: 480000,
    maxPrice: 950000,
    section: 'cogs',
  },

  // ═══ 7. GAJI, UPAH & TENAGA KERJA (OPEX & COGS) ═══
  {
    keywords: ['gaji barista', 'upah barista', 'barista senior', 'barista junior'],
    name: 'Gaji Bulanan Barista Kafe / Coffee Shop',
    unitPrice: 3200000,
    unit: 'Bln',
    categoryName: 'Gaji Karyawan',
    minPrice: 2600000,
    maxPrice: 3800000,
    section: 'opex',
  },
  {
    keywords: ['gaji kasir', 'kasir toko', 'kasir shift', 'staf kasir'],
    name: 'Gaji Bulanan Staf Kasir Toko / Minimarket',
    unitPrice: 2800000,
    unit: 'Bln',
    categoryName: 'Gaji Karyawan',
    minPrice: 2400000,
    maxPrice: 3200000,
    section: 'opex',
  },
  {
    keywords: ['gaji mekanik', 'mekanik bengkel', 'mekanik senior', 'montir bengkel'],
    name: 'Gaji Bulanan Mekanik Bengkel Otomotif',
    unitPrice: 3800000,
    unit: 'Bln',
    categoryName: 'Gaji Karyawan',
    minPrice: 3200000,
    maxPrice: 4600000,
    section: 'opex',
  },
  {
    keywords: ['gaji penjahit', 'upah penjahit', 'tukang jahit konveksi', 'tukang obras'],
    name: 'Gaji / Upah Bulanan Penjahit Konveksi',
    unitPrice: 3000000,
    unit: 'Bln',
    categoryName: 'Gaji Karyawan',
    minPrice: 2600000,
    maxPrice: 3600000,
    section: 'opex',
  },
  {
    keywords: ['gaji karyawan laundry', 'karyawan cuci setrika', 'staf laundry'],
    name: 'Gaji Bulanan Karyawan Cuci & Setrika Laundry',
    unitPrice: 2600000,
    unit: 'Bln',
    categoryName: 'Gaji Karyawan',
    minPrice: 2200000,
    maxPrice: 2900000,
    section: 'opex',
  },
  {
    keywords: ['upah tukang bangunan', 'upah tukang batu', 'upah tukang besi', 'tukang cor harian'],
    name: 'Upah Harian Tukang Bangunan (Tukang Batu / Kayu / Besi)',
    unitPrice: 150000,
    unit: 'Hari',
    categoryName: 'Upah Proyek Lapangan',
    minPrice: 135000,
    maxPrice: 175000,
    section: 'opex',
  },
  {
    keywords: ['upah mandor', 'mandor proyek', 'upah mandor lapangan'],
    name: 'Upah Harian Mandor Proyek Bangunan',
    unitPrice: 195000,
    unit: 'Hari',
    categoryName: 'Upah Proyek Lapangan',
    minPrice: 175000,
    maxPrice: 230000,
    section: 'opex',
  },
  {
    keywords: ['upah kuli', 'pekerja harian lepas', 'laden bangunan', 'kenek bangunan'],
    name: 'Upah Harian Pekerja / Laden Bangunan (Kuli Harian)',
    unitPrice: 115000,
    unit: 'Hari',
    categoryName: 'Upah Proyek Lapangan',
    minPrice: 100000,
    maxPrice: 130000,
    section: 'opex',
  },
  {
    keywords: ['gaji programmer', 'gaji software engineer', 'developer fullstack', 'gaji backend'],
    name: 'Gaji Bulanan Programmer Fullstack / Mobile Developer',
    unitPrice: 9500000,
    unit: 'Bln',
    categoryName: 'Gaji IT & Developer',
    minPrice: 7500000,
    maxPrice: 14000000,
    section: 'opex',
  },

  // ═══ 8. UTILITAS, SEWA & BIAYA OPERASIONAL RUTIN ═══
  {
    keywords: ['sewa ruko', 'sewa tempat usaha', 'sewa kios', 'sewa toko 1 bulan'],
    name: 'Biaya Sewa Ruko / Kios Usaha Strategis',
    unitPrice: 4500000,
    unit: 'Bln',
    categoryName: 'Sewa & Gedung',
    minPrice: 2500000,
    maxPrice: 8500000,
    section: 'opex',
  },
  {
    keywords: ['listrik pln', 'token listrik toko', 'tagihan listrik ruko', 'listrik bisnis b2', 'listrik pln 2200'],
    name: 'Tagihan Listrik PLN Operasional Toko / Ruko (2200 - 4400 VA)',
    unitPrice: 1850000,
    unit: 'Bln',
    categoryName: 'Utilitas & Tagihan',
    minPrice: 950000,
    maxPrice: 3500000,
    section: 'opex',
  },
  {
    keywords: ['air pdam', 'tagihan pdam', 'air pdam toko', 'pdam rumah'],
    name: 'Tagihan Air PDAM Bulanan',
    unitPrice: 225000,
    unit: 'Bln',
    categoryName: 'Utilitas & Tagihan',
    minPrice: 120000,
    maxPrice: 650000,
    section: 'opex',
  },
  {
    keywords: ['wifi indihome', 'wifi biznet', 'wifi kantor', 'internet kantor 50 mbps', 'internet bisnis'],
    name: 'Langganan Internet WiFi Bisnis 50-100 Mbps (Biznet / IndiHome)',
    unitPrice: 385000,
    unit: 'Bln',
    categoryName: 'Internet & Komunikasi',
    minPrice: 320000,
    maxPrice: 550000,
    section: 'opex',
  },
  {
    keywords: ['bensin motor', 'bensin pertalite', 'pertalite motor', 'bensin delivery'],
    name: 'Bensin Motor Operasional & Delivery (Pertalite)',
    unitPrice: 85000,
    unit: 'Minggu',
    categoryName: 'Transportasi & BBM',
    minPrice: 65000,
    maxPrice: 120000,
    section: 'opex',
  },
  {
    keywords: ['bensin mobil', 'pertamax mobil', 'bensin operasional mobil'],
    name: 'BBM Pertamax Operasional Mobil Operasional',
    unitPrice: 250000,
    unit: 'Minggu',
    categoryName: 'Transportasi & BBM',
    minPrice: 180000,
    maxPrice: 380000,
    section: 'opex',
  },
  {
    keywords: ['bpjs kesehatan', 'iuran bpjs', 'bpjs keluarga'],
    name: 'Iuran BPJS Kesehatan Mandiri (Kelas 1/2)',
    unitPrice: 100000,
    unit: 'Jiwa',
    categoryName: 'Asuransi & Kesehatan',
    minPrice: 35000,
    maxPrice: 150000,
    section: 'opex',
  },
  {
    keywords: ['spp sekolah', 'spp sd', 'spp smp', 'uang sekolah anak'],
    name: 'Iuran SPP Sekolah Anak Bulanan',
    unitPrice: 650000,
    unit: 'Bln',
    categoryName: 'Pendidikan Anak',
    minPrice: 350000,
    maxPrice: 1500000,
    section: 'opex',
  },
];

// Helper: Normalize clean text for search matching
function cleanQuery(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent Local Market Price Lookup
 * Resolves local market prices using fast instant dictionary matching,
 * token intersection scoring, and remote AI enhancement if available.
 */
export async function lookupLocalMarketPrice(
  itemName: string,
  sectionHint?: 'cogs' | 'opex' | 'revenue' | 'debt_receivable' | 'capex_equity',
  templateId?: string
): Promise<MarketPriceResult | null> {
  const query = cleanQuery(itemName);
  if (!query || query.length < 2) return null;

  // Ignore purely generic initial placeholder names
  const genericPlaceholders = [
    'pos pengeluaran', 'bahan baku baru', 'kebutuhan pokok baru',
    'biaya operasional baru', 'pos penjualan baru', 'cicilan baru',
    'pos baru', 'new item', 'item', 'baru', 'pos belanja'
  ];
  if (genericPlaceholders.includes(query)) return null;

  const queryTokens = query.split(' ').filter((t) => t.length > 1);

  let bestMatch: LocalMarketItem | null = null;
  let highestScore = 0;

  for (const item of LOCAL_MARKET_DATABASE) {
    let score = 0;

    // Check exact keyword inclusion
    for (const kw of item.keywords) {
      const cleanKw = cleanQuery(kw);
      if (query === cleanKw) {
        score = Math.max(score, 100);
      } else if (query.includes(cleanKw)) {
        score = Math.max(score, 80 + cleanKw.length);
      } else if (cleanKw.includes(query)) {
        score = Math.max(score, 60 + query.length);
      }
    }

    // Token overlap matching
    const itemTokens = cleanQuery(item.name).split(' ');
    let matchedTokenCount = 0;
    for (const qToken of queryTokens) {
      if (itemTokens.some((iT) => iT.includes(qToken) || qToken.includes(iT))) {
        matchedTokenCount++;
      }
    }

    if (queryTokens.length > 0) {
      const tokenScore = (matchedTokenCount / queryTokens.length) * 50;
      score = Math.max(score, tokenScore);
    }

    // Section bonus
    if (sectionHint && item.section === sectionHint) {
      score += 5;
    }

    if (score > highestScore && score >= 40) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 50) {
    return {
      matched: true,
      name: bestMatch.name,
      unitPrice: bestMatch.unitPrice,
      unit: bestMatch.unit,
      categoryName: bestMatch.categoryName,
      priceRange: { min: bestMatch.minPrice, max: bestMatch.maxPrice },
      source: 'Pasaran Lokal UMKM Indonesia 2026',
      confidence: Math.min(100, Math.round(highestScore)),
      note: `Referensi harga pasar: Rp ${bestMatch.minPrice.toLocaleString('id-ID')} - Rp ${bestMatch.maxPrice.toLocaleString('id-ID')} / ${bestMatch.unit}`,
    };
  }

  // Fallback: Check backend /api/market-price-reference if in browser and online
  if (typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/api/market-price-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          sectionHint,
          templateId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.unitPrice > 0) {
          return {
            matched: true,
            name: data.name || itemName,
            unitPrice: Number(data.unitPrice),
            unit: data.unit || 'Unit',
            categoryName: data.categoryName,
            priceRange: data.priceRange,
            source: data.source || 'AI Gemini Market Estimator',
            confidence: data.confidence || 85,
            note: data.note,
          };
        }
      }
    } catch (_err) {
      // Silent fallback if offline
    }
  }

  return null;
}
