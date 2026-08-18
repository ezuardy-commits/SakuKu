/**
 * REALISTIC ITEM GENERATOR — SakuKu App
 * 
 * Menghasilkan daftar item barang dengan HARGA SATUAN PASAR REALISTIS (Indonesia)
 * dan kuantitas wajar sesuai konteks transaksi & bisnis (Pakaian/Sandang, Perabot RT, Sembako, Restoran, Kafe, Bengkel, Laundry, Konveksi, Konstruksi, Apotek, ATK Sekolah).
 */

export interface RealisticItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface RealisticReceiptResult {
  storeName: string;
  storeAddress: string;
  items: RealisticItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

interface ItemTemplate {
  name: string;
  price: number; // Unit price in IDR
  unit: string;
}

interface CatalogSelection {
  catalog: ItemTemplate[];
  storeName: string;
  storeAddress: string;
}

// ── KATALOG HARGA SATUAN REALISTIS INDONESIA ─────────────────

// 1. PAKAIAN, SANDANG & FASHION RETAIL PRIBADI
const CATALOG_CLOTHING_SANDANG: ItemTemplate[] = [
  { name: 'Kemeja Lengan Panjang Katun Pria', price: 245000, unit: 'Pcs' },
  { name: 'Celana Panjang Chino / Denim Premium', price: 295000, unit: 'Pcs' },
  { name: 'Kaos Polos Katun Combed 30s (Pack 2)', price: 135000, unit: 'Pack' },
  { name: 'Gamis Muslimah Syar\'i Premium', price: 345000, unit: 'Pcs' },
  { name: 'Kerudung / Hijab Voal Segiempat (3 pcs)', price: 105000, unit: 'Pack' },
  { name: 'Jaket Hoodie Casual Katun Fleece', price: 265000, unit: 'Pcs' },
  { name: 'Sepatu Sneakers Casual Dewasa', price: 380000, unit: 'Pasang' },
  { name: 'Sandal Kulit Casual Pria/Wanita', price: 165000, unit: 'Pasang' },
  { name: 'Pakaian Dalam Katun & Kaos Kaki (Pack)', price: 85000, unit: 'Pack' },
  { name: 'Baju Tidur / Piyama Set Dewasa', price: 145000, unit: 'Set' },
];

// 2. PERALATAN & KEBUTUHAN RUMAH TANGGA
const CATALOG_HOUSEHOLD_APPLIANCES: ItemTemplate[] = [
  { name: 'Panci Set Teflon Anti Lengket 3 Pcs', price: 295000, unit: 'Set' },
  { name: 'Wajan Frypan Granite Marble 26cm', price: 185000, unit: 'Pcs' },
  { name: 'Sprei Katun King Size 180x200 Motif', price: 235000, unit: 'Set' },
  { name: 'Handuk Mandi Microfiber Lembut (2 Pcs)', price: 135000, unit: 'Pack' },
  { name: 'Lampu LED Philips 14W (Pack isi 4)', price: 125000, unit: 'Pack' },
  { name: 'Sapu & Set Pel Lantai Microfiber Twist', price: 95000, unit: 'Set' },
  { name: 'Rak Piring Stainless Steel 2 Susun', price: 175000, unit: 'Unit' },
  { name: 'Storage Box Container Roda 50L', price: 115000, unit: 'Pcs' },
  { name: 'Bantal Guling Microfiber Anti Alergi (Set)', price: 155000, unit: 'Set' },
  { name: 'Dispenser Sabun & Cermin Kamar Mandi', price: 85000, unit: 'Pcs' },
];

// 3. MAKANAN, SAYUR & SEMBAKO DAPUR HARIAN PRIBADI
const CATALOG_GROCERIES_DAILY: ItemTemplate[] = [
  { name: 'Beras Setra Ramos 5kg', price: 74000, unit: 'Sak' },
  { name: 'Minyak Goreng Pouch 2L (SunCo / Bimoli)', price: 36500, unit: 'Pouch' },
  { name: 'Telur Ayam Negeri Fresh 1kg', price: 28500, unit: 'kg' },
  { name: 'Daging Sapi Segar Rendang 500g', price: 72000, unit: 'Pack' },
  { name: 'Daging Ayam Potong Segar 1kg', price: 38000, unit: 'Ekor' },
  { name: 'Bawang Merah & Putih Kupas 500g', price: 32000, unit: 'Pack' },
  { name: 'Cabai Merah Keriting & Rawit 250g', price: 18000, unit: 'Pack' },
  { name: 'Sayur Mayur Segar (Bayam, Wortel, Brokoli)', price: 22000, unit: 'Pack' },
  { name: 'Ikan Gurame / Nila Segar 1kg', price: 46000, unit: 'kg' },
  { name: 'Gula Pasir Gulaku 1kg', price: 17500, unit: 'Pcs' },
  { name: 'Susu UHT Ultra Milk Full Cream 1L', price: 19500, unit: 'Kotak' },
  { name: 'Bumbu Masak Dapur Komplit & Garam', price: 16000, unit: 'Set' },
];

// 4. RESTORAN, MAKAN LUAR & HIBURAN KELUARGA
const CATALOG_RESTAURANT_FAMILY: ItemTemplate[] = [
  { name: 'Paket Nasi Gurame Terbang Sambal Terasi', price: 68000, unit: 'Porsi' },
  { name: 'Nasi Ayam Bakar Madu Komplit', price: 36000, unit: 'Porsi' },
  { name: 'Nasi Bebek Goreng Kremes Renyah', price: 42000, unit: 'Porsi' },
  { name: 'Sop Buntut Sapi Kuah Rempah', price: 75000, unit: 'Porsi' },
  { name: 'Sate Ayam Madura 10 Tusuk + Lontong', price: 34000, unit: 'Porsi' },
  { name: 'Cah Kangkung Terasi Seafood', price: 24000, unit: 'Porsi' },
  { name: 'Tahu Tempe Mendoan Komplit', price: 18000, unit: 'Porsi' },
  { name: 'Es Kelapa Muda Batok Murni', price: 22000, unit: 'Gelas' },
  { name: 'Es Kopi Susu Gula Aren Barista', price: 24000, unit: 'Gelas' },
  { name: 'Jus Alpukat Keruk Susu Coklat', price: 22000, unit: 'Gelas' },
];

// 5. KESEHATAN, APOTEK & VITAMIN
const CATALOG_HEALTH_PHARMACY: ItemTemplate[] = [
  { name: 'Multivitamin Blackmores Executive B', price: 225000, unit: 'Botol' },
  { name: 'Vitamin C 500mg Strip (isi 30)', price: 65000, unit: 'Botol' },
  { name: 'Madu Murni Alami TJ 500g', price: 68000, unit: 'Botol' },
  { name: 'Minyak Kayu Putih Cap Lang 120ml', price: 52000, unit: 'Botol' },
  { name: 'Suplemen Kalsium Tulang & Sendi', price: 145000, unit: 'Botol' },
  { name: 'Paracetamol & Obat Flu Batuk Komplit', price: 38000, unit: 'Pack' },
  { name: 'Masker Medis 3-Ply Earloop (Box 50)', price: 35000, unit: 'Box' },
  { name: 'Antiseptik Dettol Cair 250ml', price: 48000, unit: 'Botol' },
];

// 6. PENDIDIKAN, BUKU & ATK SEKOLAH
const CATALOG_EDUCATION_STATIONERY: ItemTemplate[] = [
  { name: 'Buku Tulis Sinar Dunia 58 Lembar (Pak 10)', price: 48000, unit: 'Pak' },
  { name: 'Pulpen Gel Zebra Sarasa 0.5 (Kotak 12)', price: 185000, unit: 'Kotak' },
  { name: 'Pensil Warna Faber-Castell 24 Warna', price: 75000, unit: 'Set' },
  { name: 'Buku Paket Modul Belajar & Soal Ujian', price: 135000, unit: 'Buku' },
  { name: 'Tas Ransel Sekolah Waterproof', price: 265000, unit: 'Pcs' },
  { name: 'Sepatu Sekolah Hitam Standar', price: 275000, unit: 'Pasang' },
  { name: 'Set Alat Tulis Geometri & Kotak Pensil', price: 45000, unit: 'Set' },
];

// 7. BENSIN, SPBU & TRANSPORTASI
const CATALOG_FUEL_TRANSPORT: ItemTemplate[] = [
  { name: 'BBM Pertalite RON 90 (25 Liter)', price: 250000, unit: 'Liter' },
  { name: 'BBM Pertamax RON 92 (20 Liter)', price: 274000, unit: 'Liter' },
  { name: 'Top Up Saldo E-Toll Card', price: 100000, unit: 'Trx' },
  { name: 'Air Radiator Coolant 4L', price: 65000, unit: 'Galon' },
  { name: 'Cairan Pembersih Kaca Mobil Wiper 1L', price: 25000, unit: 'Botol' },
];

// 8. FMCG & GROSIR SEMBAKO (TOKO BERKAH JAYA)
const CATALOG_FMCG_GROSIR: ItemTemplate[] = [
  { name: 'Beras Rojolele Super 25kg', price: 340000, unit: 'Sak' },
  { name: 'Minyak Goreng 2L Karton (isi 6)', price: 205000, unit: 'Karton' },
  { name: 'Gula Pasir GMP 50kg', price: 740000, unit: 'Karung' },
  { name: 'Indomie Goreng Spesial (Dus isi 40)', price: 118000, unit: 'Dus' },
  { name: 'Telur Ayam Ras 10kg Bal', price: 275000, unit: 'Bal' },
  { name: 'Tepung Terigu Segitiga Biru 25kg', price: 235000, unit: 'Sak' },
  { name: 'Susu Kental Manis FF (Karton isi 48)', price: 460000, unit: 'Karton' },
  { name: 'Kopi Kapal Api Mix (Dus isi 120)', price: 195000, unit: 'Dus' },
  { name: 'Sabun Cuci Rinso 800g (Dus isi 12)', price: 245000, unit: 'Dus' },
  { name: 'Kecap Bango 550ml (Dus isi 12)', price: 285000, unit: 'Dus' },
  { name: 'Sarden ABC 425g (Karton isi 24)', price: 480000, unit: 'Karton' },
  { name: 'Air Mineral Botol 600ml (Dus isi 24)', price: 48000, unit: 'Dus' },
];

// 9. KAFE & F&B BAHAN BAKU (KOPI SENJA NUSANTARA)
const CATALOG_FNB_CAFE: ItemTemplate[] = [
  { name: 'Biji Kopi Arabika Gayo House Blend 1kg', price: 165000, unit: 'kg' },
  { name: 'Susu Fresh Milk Pasteurisasi Barista 1L', price: 19500, unit: 'Liter' },
  { name: 'Sirup Monin Vanilla 700ml', price: 145000, unit: 'Botol' },
  { name: 'Sirup Torani Hazelnut 750ml', price: 140000, unit: 'Botol' },
  { name: 'Cup Plastic PET 16oz (Pack isi 50)', price: 25000, unit: 'Pack' },
  { name: 'Cup Paper Hot 8oz (Pack isi 50)', price: 22000, unit: 'Pack' },
  { name: 'Gula Cair Fruktosa Jerigen 5kg', price: 115000, unit: 'Jerigen' },
  { name: 'Butter Anchor Unsalted 227g', price: 48000, unit: 'Pack' },
  { name: 'Keju Cheddar Kraft Pro 2kg', price: 195000, unit: 'Bal' },
  { name: 'Daging Slice US Beef Shortplate 1kg', price: 135000, unit: 'kg' },
  { name: 'Es Batu Kristal Tube Higienis 10kg', price: 20000, unit: 'Karung' },
  { name: 'Bubuk Matcha Green Tea Murni 1kg', price: 175000, unit: 'Pack' },
];

// 10. BENGKEL OTOMOTIF & SPAREPART (AUTOCARE)
const CATALOG_WORKSHOP: ItemTemplate[] = [
  { name: 'Oli Mesin Shell Helix HX7 4L', price: 345000, unit: 'Galon' },
  { name: 'Oli Mesin Shell Helix Ultra 4L Synthetic', price: 580000, unit: 'Galon' },
  { name: 'Oli Motor Matic MPX2 0.8L (Dus isi 24)', price: 1150000, unit: 'Dus' },
  { name: 'Kampas Rem Depan Cakram Original', price: 65000, unit: 'Set' },
  { name: 'Busi NGK Iridium Racing Platinum', price: 45000, unit: 'Pcs' },
  { name: 'Filter Oli Original Astra', price: 38000, unit: 'Pcs' },
  { name: 'Ban Tubeless FDR 90/90-14 Matic', price: 225000, unit: 'Pcs' },
  { name: 'Aki Kering GS Astra GTZ-5S Bebas Perawatan', price: 265000, unit: 'Unit' },
  { name: 'Brake Cleaner Spray Pembersih Rem 500ml', price: 45000, unit: 'Kaleng' },
  { name: 'Cairan Radiator Coolant 4L', price: 75000, unit: 'Galon' },
  { name: 'Rantai & Gear Set Roda Honda/Yamaha', price: 185000, unit: 'Set' },
];

// 11. LAUNDRY & CHEMICAL (BERSIH WANGI)
const CATALOG_LAUNDRY: ItemTemplate[] = [
  { name: 'Deterjen Cair Matic Low Foam 20L', price: 275000, unit: 'Jerigen' },
  { name: 'Softener & Pelembut Pakaian Wangi 20L', price: 225000, unit: 'Jerigen' },
  { name: 'Parfum Laundry Grade A Sakura 5L', price: 185000, unit: 'Jerigen' },
  { name: 'Plastik Packing Jinjing Laundry (Roll 100)', price: 32000, unit: 'Roll' },
  { name: 'Tag Pin & Label Nomor Anti Air', price: 45000, unit: 'Pack' },
  { name: 'Hanger Plastik Kawat Tebal (Lusin)', price: 25000, unit: 'Lusin' },
  { name: 'Cairan Anti Noda Darah & Karat 1L', price: 75000, unit: 'Botol' },
  { name: 'Alkali Booster Pembersih Noda Berat 5L', price: 145000, unit: 'Jerigen' },
];

// 12. KONVEKSI & BAHAN KAIN BUTIK (BUSANA HARMONI)
const CATALOG_FASHION: ItemTemplate[] = [
  { name: 'Kain Katun Toyobo Fodu Import (Roll 50m)', price: 1450000, unit: 'Roll' },
  { name: 'Kain Rayon Viscose Motif Premium (Roll 50m)', price: 1200000, unit: 'Roll' },
  { name: 'Kain Linen Rami Premium (Roll 50m)', price: 1650000, unit: 'Roll' },
  { name: 'Benang Jahit Astra 5000yd (Cone)', price: 18000, unit: 'Cone' },
  { name: 'Resleting Jepang YKK 25cm (Lusin)', price: 48000, unit: 'Lusin' },
  { name: 'Kancing Kemeja Exclusive (Gross 144)', price: 65000, unit: 'Gross' },
  { name: 'Plastik Zipper Lock Baju Butik (Pack 100)', price: 55000, unit: 'Pack' },
  { name: 'Label Woven Bordir Brand Custom (500pcs)', price: 180000, unit: 'Pack' },
  { name: 'Kain Keras Interlining Baju (Roll 50m)', price: 320000, unit: 'Roll' },
];

// 13. MATERIAL BANGUNAN & KONSTRUKSI (PT CIPTA SARANA)
const CATALOG_CONSTRUCTION: ItemTemplate[] = [
  { name: 'Semen Holcim / Tiga Roda 50kg', price: 68000, unit: 'Sak' },
  { name: 'Besi Beton Ulir 12mm x 12m SNI', price: 115000, unit: 'Batang' },
  { name: 'Besi Polos 8mm x 12m SNI', price: 52000, unit: 'Batang' },
  { name: 'Bata Ringan Hebel 7.5cm (Kubik)', price: 620000, unit: 'Kubik' },
  { name: 'Mortar Perekat Hebel 40kg', price: 78000, unit: 'Sak' },
  { name: 'Pasir Pasang / Cor Beton (Truk Dump)', price: 1850000, unit: 'Truk' },
  { name: 'Kawat Bendrat Beton (Roll 20kg)', price: 320000, unit: 'Roll' },
  { name: 'Pipa PVC Wavin AW 3 Inch', price: 135000, unit: 'Batang' },
  { name: 'Cat Tembok Weathershield 20L', price: 1450000, unit: 'Pail' },
];

function selectCatalogAndStore(
  desc: string,
  businessType?: string,
  businessName?: string,
  amount: number = 0
): CatalogSelection {
  const text = `${desc} ${businessType || ''} ${businessName || ''}`.toLowerCase();

  // 1. Pakaian, Sandang, Busana, Butik, Sepatu (Personal / Retail Fashion)
  if (
    text.includes('pakaian') ||
    text.includes('sandang') ||
    text.includes('baju') ||
    text.includes('celana') ||
    text.includes('sepatu') ||
    text.includes('sandal') ||
    text.includes('gamis') ||
    text.includes('hijab') ||
    text.includes('kaos') ||
    text.includes('kemeja')
  ) {
    return {
      catalog: CATALOG_CLOTHING_SANDANG,
      storeName: 'Matahari Department Store',
      storeAddress: 'Mall Grand Metropolitan Lt. 2, Kota',
    };
  }

  // 2. Kebutuhan Rumah Tangga & Perabot
  if (
    text.includes('rumah tangga') ||
    text.includes('perabot') ||
    text.includes('panci') ||
    text.includes('sprei') ||
    text.includes('handuk') ||
    text.includes('peralatan rt')
  ) {
    return {
      catalog: CATALOG_HOUSEHOLD_APPLIANCES,
      storeName: 'Ace Hardware & Home Living',
      storeAddress: 'Living Plaza Mall Ground Floor, Kota',
    };
  }

  // 3. Bengkel Otomotif, Sparepart, Oli
  if (
    text.includes('bengkel') ||
    text.includes('workshop') ||
    text.includes('oli') ||
    text.includes('sparepart') ||
    text.includes('motor') ||
    text.includes('mobil') ||
    text.includes('tune-up') ||
    text.includes('servis')
  ) {
    return {
      catalog: CATALOG_WORKSHOP,
      storeName: businessName || 'AutoCare Workshop & Sparepart',
      storeAddress: 'Jl. Otomotif Raya No. 42, Kota',
    };
  }

  // 4. Laundry, Chemical, Deterjen
  if (
    text.includes('laundry') ||
    text.includes('deterjen') ||
    text.includes('chemical') ||
    text.includes('softener') ||
    text.includes('dry clean')
  ) {
    return {
      catalog: CATALOG_LAUNDRY,
      storeName: businessName || 'Pusat Perlengkapan & Chemical Laundry',
      storeAddress: 'Kawasan Niaga Sentra Blok D No. 3',
    };
  }

  // 5. Konveksi, Kain, Bahan Jahit (B2B Fashion Production)
  if (
    text.includes('konveksi') ||
    text.includes('kain') ||
    text.includes('jahit') ||
    text.includes('resleting') ||
    text.includes('katun')
  ) {
    return {
      catalog: CATALOG_FASHION,
      storeName: businessName || 'Pusat Grosir Bahan Tekstil & Kain Harmoni',
      storeAddress: 'Kawasan Pasar Tekstil Blok F No. 15',
    };
  }

  // 6. Material Bangunan, Semen, Besi, Konstruksi
  if (
    text.includes('bangunan') ||
    text.includes('proyek') ||
    text.includes('material') ||
    text.includes('semen') ||
    text.includes('konstruksi') ||
    text.includes('ready mix') ||
    text.includes('hebel') ||
    text.includes('besi')
  ) {
    return {
      catalog: CATALOG_CONSTRUCTION,
      storeName: businessName || 'Distributor Bahan Bangunan & Beton Cipta Sarana',
      storeAddress: 'Jl. Raya Industri Material No. 99, Kota',
    };
  }

  // 7. Kafe, Kopi, F&B Restok Bahan Baku
  if (
    text.includes('kopi') ||
    text.includes('kafe') ||
    text.includes('cafe') ||
    text.includes('fnb') ||
    text.includes('barista') ||
    text.includes('biji kopi')
  ) {
    return {
      catalog: CATALOG_FNB_CAFE,
      storeName: businessName || 'Roastery & Supplier Bahan Baku Barista Kafe',
      storeAddress: 'Jl. Kopi Harapan No. 7, Kota',
    };
  }

  // 8. Kulakan Grosir Sembako & FMCG Toko Retail
  if (
    text.includes('grosir') ||
    text.includes('kulakan') ||
    text.includes('distributor resmi') ||
    text.includes('sembako toko') ||
    text.includes('retail') ||
    text.includes('minimarket') ||
    amount > 5000000
  ) {
    return {
      catalog: CATALOG_FMCG_GROSIR,
      storeName: businessName || 'Pusat Grosir Sembako & Distributor FMCG',
      storeAddress: 'Kawasan Pergudangan Niaga Blok A No. 12',
    };
  }

  // 9. Makanan Luar, Restoran, Sarapan, Hiburan Makan Bersama
  if (
    text.includes('makan bersama') ||
    text.includes('makan luar') ||
    text.includes('hiburan') ||
    text.includes('resto') ||
    text.includes('kuliner') ||
    text.includes('sarapan') ||
    text.includes('gudeg') ||
    text.includes('dinner')
  ) {
    return {
      catalog: CATALOG_RESTAURANT_FAMILY,
      storeName: 'Restoran Rasa Nusantara & Seafood',
      storeAddress: 'Jl. Boulevard Raya No. 88, Kota',
    };
  }

  // 10. Kesehatan, Apotek, Vitamin, BPJS
  if (
    text.includes('kesehatan') ||
    text.includes('apotek') ||
    text.includes('vitamin') ||
    text.includes('bpjs') ||
    text.includes('obat') ||
    text.includes('suplemen')
  ) {
    return {
      catalog: CATALOG_HEALTH_PHARMACY,
      storeName: 'Apotek K-24 / Century Pharma',
      storeAddress: 'Jl. Pemuda No. 25, Kota',
    };
  }

  // 11. Pendidikan, Buku, Les, SPP
  if (
    text.includes('spp') ||
    text.includes('sekolah') ||
    text.includes('buku') ||
    text.includes('les') ||
    text.includes('atk') ||
    text.includes('pendidikan')
  ) {
    return {
      catalog: CATALOG_EDUCATION_STATIONERY,
      storeName: 'Toko Buku & Stationeri Gramedia',
      storeAddress: 'Mall Metropolitan Lt. 1, Kota',
    };
  }

  // 12. Bensin & SPBU Transportasi
  if (
    text.includes('bensin') ||
    text.includes('pertalite') ||
    text.includes('pertamax') ||
    text.includes('spbu') ||
    text.includes('e-toll') ||
    text.includes('transport')
  ) {
    return {
      catalog: CATALOG_FUEL_TRANSPORT,
      storeName: 'SPBU Pertamina Pasti Pas 34-12901',
      storeAddress: 'Jl. Ahmad Yani KM 5, Kota',
    };
  }

  // Default: Belanja Kebutuhan Dapur & Sembako Pasar
  return {
    catalog: CATALOG_GROCERIES_DAILY,
    storeName: 'Supermarket & Pasar Segar Mandiri',
    storeAddress: 'Jl. Pasar Baru No. 12, Kota',
  };
}

function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generates a realistic line item breakdown matching the exact target amount
 * with 100% natural Indonesian market unit prices, whole-number quantities, and matched store branding.
 */
export function generateRealisticReceiptItems(
  targetAmount: number,
  description: string,
  businessType?: string,
  businessName?: string,
  seedModifier: number = 1000
): RealisticReceiptResult {
  const total = Math.max(1000, targetAmount || 50000);
  const selection = selectCatalogAndStore(description, businessType, businessName, total);
  const catalog = selection.catalog;

  const items: RealisticItem[] = [];
  let remaining = total;
  let seed = seedModifier;

  // Pick 3 to 6 suitable items from the catalog
  const numItems = Math.min(catalog.length, Math.max(2, Math.min(6, Math.floor(total / 150000) + 2)));

  // Shuffle catalog candidates deterministically
  const shuffled = [...catalog].sort((a, b) => {
    return pseudoRand(seed + a.price) - pseudoRand(seed + b.price);
  });

  const selectedTemplates = shuffled.slice(0, numItems);

  for (let i = 0; i < selectedTemplates.length; i++) {
    const tmpl = selectedTemplates[i];
    const isLast = i === selectedTemplates.length - 1;

    if (isLast) {
      // For the last item, calculate quantity and adjustment to hit exact target
      if (remaining > 0) {
        let qty = Math.max(1, Math.floor(remaining / tmpl.price));
        let itemTotal = qty * tmpl.price;
        
        // If remaining cannot be divided cleanly, adjust price reasonably or use exact remainder
        if (itemTotal !== remaining && qty > 0) {
          const exactUnitPrice = Math.round(remaining / qty);
          items.push({
            name: tmpl.name,
            qty,
            price: exactUnitPrice,
            total: remaining,
          });
        } else {
          items.push({
            name: tmpl.name,
            qty,
            price: tmpl.price,
            total: remaining,
          });
        }
        remaining = 0;
      }
    } else {
      // Allocate portion of remaining budget
      const portionBudget = Math.floor(remaining / (selectedTemplates.length - i));
      let qty = Math.max(1, Math.floor(portionBudget / tmpl.price));
      
      // Keep within remaining
      while (qty * tmpl.price >= remaining && qty > 1) {
        qty--;
      }

      const itemTotal = qty * tmpl.price;
      if (itemTotal <= remaining) {
        items.push({
          name: tmpl.name,
          qty,
          price: tmpl.price,
          total: itemTotal,
        });
        remaining -= itemTotal;
      }
    }
  }

  // Ensure items is never empty
  if (items.length === 0) {
    items.push({
      name: description || 'Pembelian Barang Operasional',
      qty: 1,
      price: total,
      total: total,
    });
  }

  const subtotal = items.reduce((s, it) => s + it.total, 0);

  return {
    storeName: selection.storeName,
    storeAddress: selection.storeAddress,
    items,
    subtotal,
    taxAmount: 0,
    grandTotal: subtotal,
  };
}
