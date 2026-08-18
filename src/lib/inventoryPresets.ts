import { InventoryItemType } from '../types';

export interface QuickInventoryPreset {
  id: string;
  name: string;
  category: 'stock' | 'equipment' | 'furniture' | 'atk';
  item_type: InventoryItemType;
  unit: string;
  default_cost: number;
  default_selling?: number;
  category_name: string;
  icon?: string;
  notes?: string;
  beginning_stock?: number;
  budgeted_inflow?: number;
  projected_usage?: number;
}

export const BUSINESS_QUICK_PRESETS: Record<string, QuickInventoryPreset[]> = {
  // 1. RITEL & PERDAGANGAN: TOKO SEMBAKO & MINIMARKET
  retail_shop: [
    { id: 'pre_rt_1', name: 'Beras Premium Pandan Wangi 25kg', category: 'stock', item_type: 'product_stock', unit: 'Karung', default_cost: 345000, default_selling: 375000, category_name: 'Barang Dagangan Sembako' },
    { id: 'pre_rt_2', name: 'Minyak Goreng Kemasan 2 Liter Karton', category: 'stock', item_type: 'product_stock', unit: 'Karton', default_cost: 240000, default_selling: 270000, category_name: 'Barang Dagangan Sembako' },
    { id: 'pre_rt_3', name: 'Gula Pasir Kristal 50kg Karung', category: 'stock', item_type: 'product_stock', unit: 'Karung', default_cost: 850000, default_selling: 925000, category_name: 'Barang Dagangan Sembako' },
    { id: 'pre_rt_4', name: 'Telur Ayam Segar Peti (15kg)', category: 'stock', item_type: 'product_stock', unit: 'Peti', default_cost: 290000, default_selling: 330000, category_name: 'Barang Dagangan Sembako' },
    { id: 'pre_rt_5', name: 'Tepung Terigu Segitiga Biru Karton', category: 'stock', item_type: 'product_stock', unit: 'Karton', default_cost: 165000, default_selling: 185000, category_name: 'Barang Dagangan Sembako' },
    { id: 'pre_rt_6', name: 'Mie Instan Indomie Goreng Dus (40 pcs)', category: 'stock', item_type: 'product_stock', unit: 'Dus', default_cost: 125000, default_selling: 140000, category_name: 'Barang Dagangan FMCG' },
    { id: 'pre_rt_7', name: 'Rokok Gudang Garam Surya Karton', category: 'stock', item_type: 'product_stock', unit: 'Slop', default_cost: 320000, default_selling: 345000, category_name: 'Barang Dagangan Rokok' },
    { id: 'pre_rt_8', name: 'Sabun Mandi & Deterjen Karton (Unilever/Wings)', category: 'stock', item_type: 'product_stock', unit: 'Karton', default_cost: 320000, default_selling: 360000, category_name: 'Barang Dagangan FMCG' },
    { id: 'pre_rt_9', name: 'Shampo Sachet & Botol Karton', category: 'stock', item_type: 'product_stock', unit: 'Karton', default_cost: 285000, default_selling: 320000, category_name: 'Barang Dagangan FMCG' },
    { id: 'pre_rt_10', name: 'Minuman Botol Dingin & Teh Pucuk (Krat)', category: 'stock', item_type: 'product_stock', unit: 'Krat', default_cost: 145000, default_selling: 180000, category_name: 'Minuman Chiller' },
    { id: 'pre_rt_11', name: 'Es Krim Walls/Campina Showcase', category: 'stock', item_type: 'product_stock', unit: 'Box', default_cost: 450000, default_selling: 550000, category_name: 'Minuman Chiller' },
    { id: 'pre_rt_12', name: 'Snack Pabrikan Chitato/Oreo Karton', category: 'stock', item_type: 'product_stock', unit: 'Karton', default_cost: 235000, default_selling: 270000, category_name: 'Barang Dagangan Snack' },
    { id: 'pre_rt_13', name: 'Showcase Chiller 2 Pintu Toko', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 7500000, category_name: 'Peralatan/Aset' },
    { id: 'pre_rt_14', name: 'Rak Gondola Display Double 5 Tingkat', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 2800000, category_name: 'Furniture/Mebel' },
    { id: 'pre_rt_15', name: 'Komputer Kasir POS Touchscreen & Scanner', category: 'atk', item_type: 'equipment_asset', unit: 'Set', default_cost: 6500000, category_name: 'Peralatan/Aset' },
  ],

  // 2. KULINER & F&B: KOPI SENJA NUSANTARA & EATERY
  fnb_culinary: [
    { id: 'pre_fb_1', name: 'Biji Kopi Sangrai Arabika Gayo', category: 'stock', item_type: 'raw_material', unit: 'Kg', default_cost: 185000, category_name: 'Bahan Baku Kopi' },
    { id: 'pre_fb_2', name: 'Biji Kopi Sangrai Robusta Toraja', category: 'stock', item_type: 'raw_material', unit: 'Kg', default_cost: 125000, category_name: 'Bahan Baku Kopi' },
    { id: 'pre_fb_3', name: 'Susu Segar Pasteurisasi Diamond 1L', category: 'stock', item_type: 'raw_material', unit: 'Liter', default_cost: 25000, category_name: 'Bahan Baku Minuman' },
    { id: 'pre_fb_4', name: 'Susu Oat & Almond Barista 1L', category: 'stock', item_type: 'raw_material', unit: 'Liter', default_cost: 65000, category_name: 'Bahan Baku Minuman' },
    { id: 'pre_fb_5', name: 'Sirup Monin (Vanilla, Karamel, Hazelnut)', category: 'stock', item_type: 'raw_material', unit: 'Botol', default_cost: 145000, category_name: 'Bahan Baku Minuman' },
    { id: 'pre_fb_6', name: 'Bubuk Matcha Premium & Cokelat', category: 'stock', item_type: 'raw_material', unit: 'Kg', default_cost: 165000, category_name: 'Bahan Baku Minuman' },
    { id: 'pre_fb_7', name: 'Cup Plastik Sablon Logo 16oz + Lid', category: 'stock', item_type: 'raw_material', unit: 'Pcs', default_cost: 2800, category_name: 'Kemasan & Packaging' },
    { id: 'pre_fb_8', name: 'Daging Patty, Sosis & Keju Dapur Kafe', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 3500000, category_name: 'Bahan Makanan Kitchen' },
    { id: 'pre_fb_9', name: 'Bahan Pastry, Croissant & Dessert', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 2200000, category_name: 'Bahan Makanan Kitchen' },
    { id: 'pre_fb_10', name: 'Mesin Espresso Komersial Nuova Simonelli 2-Group', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 55000000, category_name: 'Peralatan/Aset Kafe' },
    { id: 'pre_fb_11', name: 'Grinder Kopi Otomatis Espresso Fiorenzato', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 14500000, category_name: 'Peralatan/Aset Kafe' },
    { id: 'pre_fb_12', name: 'Under-Counter Chiller Stainless 3 Pintu', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 13500000, category_name: 'Peralatan/Aset Kafe' },
    { id: 'pre_fb_13', name: 'Meja Barista & Kursi Cafe Set (30 Kursi)', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 18500000, category_name: 'Furniture/Mebel Kafe' },
    { id: 'pre_fb_14', name: 'Set POS Tablet Kasir & Printer Bluetooth', category: 'atk', item_type: 'equipment_asset', unit: 'Set', default_cost: 4500000, category_name: 'Peralatan/Aset' },
  ],

  // 3. BENGKEL OTOMOTIF: BENGKEL MOBIL & MOTOR AUTOCARE
  workshop_service: [
    { id: 'pre_bk_1', name: 'Oli Mesin Motor Matic Yamalube/MPX 0.8L', category: 'stock', item_type: 'product_stock', unit: 'Botol', default_cost: 65000, default_selling: 80000, category_name: 'Stok Pelumas & Oli' },
    { id: 'pre_bk_2', name: 'Oli Mesin Mobil Shell Helix/Castrol 4L', category: 'stock', item_type: 'product_stock', unit: 'Galon', default_cost: 380000, default_selling: 450000, category_name: 'Stok Pelumas & Oli' },
    { id: 'pre_bk_3', name: 'Kampas Rem Cakram Motor Depan & Belakang', category: 'stock', item_type: 'product_stock', unit: 'Set', default_cost: 45000, default_selling: 65000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_4', name: 'Kampas Rem Mobil Disc Pad Depan', category: 'stock', item_type: 'product_stock', unit: 'Set', default_cost: 185000, default_selling: 245000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_5', name: 'Busi Motor Standar NGK / Denso', category: 'stock', item_type: 'product_stock', unit: 'Pcs', default_cost: 25000, default_selling: 35000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_6', name: 'Aki Kering Motor GS Astra / Yuasa 12V', category: 'stock', item_type: 'product_stock', unit: 'Unit', default_cost: 245000, default_selling: 295000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_7', name: 'Aki Mobil Amaron / GS Maintenance Free', category: 'stock', item_type: 'product_stock', unit: 'Unit', default_cost: 750000, default_selling: 890000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_8', name: 'Vanbelt & Roller CVT Motor Matic', category: 'stock', item_type: 'product_stock', unit: 'Set', default_cost: 120000, default_selling: 160000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_9', name: 'Ban Tubeless Motor IRC/FDR Ring 14', category: 'stock', item_type: 'product_stock', unit: 'Pcs', default_cost: 195000, default_selling: 245000, category_name: 'Stok Ban & Velg' },
    { id: 'pre_bk_10', name: 'Filter Udara & Filter Oli Mobil/Motor', category: 'stock', item_type: 'product_stock', unit: 'Pcs', default_cost: 45000, default_selling: 65000, category_name: 'Sparepart Fast Moving' },
    { id: 'pre_bk_11', name: 'Kompresor Angin 3 HP & Instalasi Pipa', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 8500000, category_name: 'Peralatan Bengkel' },
    { id: 'pre_bk_12', name: 'Bike Lift Hidrolik Motor (3 Bay)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 13500000, category_name: 'Peralatan Bengkel' },
    { id: 'pre_bk_13', name: 'Tyre Changer Mesin Buka Pasang Ban Otomatis', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 18500000, category_name: 'Peralatan Bengkel' },
    { id: 'pre_bk_14', name: 'Set Tool Cabinet Kunci Tekiro Komplit', category: 'equipment', item_type: 'equipment_asset', unit: 'Set', default_cost: 4500000, category_name: 'Peralatan Bengkel' },
  ],

  // 4. JASA LAUNDRY: LAUNDRY KILAT BERSIH WANGI
  laundry_service: [
    { id: 'pre_ld_1', name: 'Deterjen Konsentrat Laundry Liquid (25L)', category: 'stock', item_type: 'raw_material', unit: 'Jerigen', default_cost: 450000, category_name: 'Bahan Kimia Laundry' },
    { id: 'pre_ld_2', name: 'Pelembut & Pewangi Molto/Downy 5L', category: 'stock', item_type: 'raw_material', unit: 'Jerigen', default_cost: 125000, category_name: 'Bahan Kimia Laundry' },
    { id: 'pre_ld_3', name: 'Parfum Laundry Premium 5L (Akasia/Sakura)', category: 'stock', item_type: 'raw_material', unit: 'Jerigen', default_cost: 185000, category_name: 'Bahan Kimia Laundry' },
    { id: 'pre_ld_4', name: 'Plastik Packing Segel Laundry (Roll 10kg)', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 120000, category_name: 'Kemasan & Perlengkapan' },
    { id: 'pre_ld_5', name: 'Hanger Kawat & Plastik Tag Label Nomor', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 150000, category_name: 'Kemasan & Perlengkapan' },
    { id: 'pre_ld_6', name: 'Alkalite / Penghilang Noda Darah & Minyak', category: 'stock', item_type: 'raw_material', unit: 'Botol', default_cost: 75000, category_name: 'Bahan Kimia Laundry' },
    { id: 'pre_ld_7', name: 'Mesin Cuci Front Loading Commercial 15kg (5 Unit)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 45000000, category_name: 'Mesin Produksi' },
    { id: 'pre_ld_8', name: 'Mesin Pengering Gas Dryer SpeedQueen 15kg (3 Unit)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 48000000, category_name: 'Mesin Produksi' },
    { id: 'pre_ld_9', name: 'Setrika Uap Boiler Gas 25 Liter (2 Kepala)', category: 'equipment', item_type: 'equipment_asset', unit: 'Set', default_cost: 6500000, category_name: 'Mesin Produksi' },
    { id: 'pre_ld_10', name: 'Timbangan Digital Laundry 30kg', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 450000, category_name: 'Peralatan Laundry' },
    { id: 'pre_ld_11', name: 'Rak Susun Laundry Besi & Meja Lipat HPL', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 3200000, category_name: 'Furniture/Mebel' },
  ],

  // 5. TEKSTIL & KONVEKSI: BUTIK BUSANA HARMONI
  fashion_clothing: [
    { id: 'pre_fs_1', name: 'Kain Katun Toyobo Fodu (Roll 50 Yard)', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 2250000, category_name: 'Bahan Baku Kain' },
    { id: 'pre_fs_2', name: 'Kain Rayon Viscose Motif (Roll 40 Yard)', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 1520000, category_name: 'Bahan Baku Kain' },
    { id: 'pre_fs_3', name: 'Kain American Drill Seragam (Roll 60 Yard)', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 3300000, category_name: 'Bahan Baku Kain' },
    { id: 'pre_fs_4', name: 'Kain Wolfis & Ceruty Babydoll (Roll 30 Yard)', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 1260000, category_name: 'Bahan Baku Kain' },
    { id: 'pre_fs_5', name: 'Benang Jahit Astra/A&E (20 Cone)', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 360000, category_name: 'Aksesoris Jahit' },
    { id: 'pre_fs_6', name: 'Kancing Baju & Resleting YKK (500 pcs)', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 600000, category_name: 'Aksesoris Jahit' },
    { id: 'pre_fs_7', name: 'Kain Keras Interlining & Furing Asahi', category: 'stock', item_type: 'raw_material', unit: 'Roll', default_cost: 450000, category_name: 'Aksesoris Jahit' },
    { id: 'pre_fs_8', name: 'Plastik Zipper Bag Sablon Brand & Tag', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 280000, category_name: 'Packaging Brand' },
    { id: 'pre_fs_9', name: 'Mesin Jahit Digital High-Speed Juki (6 Unit)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 36000000, category_name: 'Mesin Jahit' },
    { id: 'pre_fs_10', name: 'Mesin Obras 4 Benang Yamato/Siruba', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 8500000, category_name: 'Mesin Jahit' },
    { id: 'pre_fs_11', name: 'Mesin Potong Kain Listrik Octagonal Knife', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 2800000, category_name: 'Mesin Jahit' },
    { id: 'pre_fs_12', name: 'Meja Potong Pola Kayu Solid 3x1.5M', category: 'furniture', item_type: 'equipment_asset', unit: 'Unit', default_cost: 3500000, category_name: 'Furniture Workshop' },
  ],

  // 6. KONSTRUKSI & KONTRAKTOR: PT CIPTA SARANA BANGUN PERSADA
  project_contract: [
    { id: 'pre_pj_1', name: 'Beton Ready Mix K-300 (Truk Mixer 7 m³)', category: 'stock', item_type: 'raw_material', unit: 'Truk', default_cost: 1450000, category_name: 'Material Struktur Utama' },
    { id: 'pre_pj_2', name: 'Besi Beton Ulir D13 SNI (Batang 12M)', category: 'stock', item_type: 'raw_material', unit: 'Ton', default_cost: 12500000, category_name: 'Material Struktur Utama' },
    { id: 'pre_pj_3', name: 'Besi Beton Polos D10 SNI (Batang 12M)', category: 'stock', item_type: 'raw_material', unit: 'Ton', default_cost: 12800000, category_name: 'Material Struktur Utama' },
    { id: 'pre_pj_4', name: 'Bata Ringan Hebel AAC Tebal 10cm', category: 'stock', item_type: 'raw_material', unit: 'm³', default_cost: 650000, category_name: 'Material Dinding' },
    { id: 'pre_pj_5', name: 'Semen Portland Tiga Roda/Gresik 50kg', category: 'stock', item_type: 'raw_material', unit: 'Sak', default_cost: 72000, category_name: 'Material Struktur Utama' },
    { id: 'pre_pj_6', name: 'Pasir Cor Merapi Dump Truk 6 m³', category: 'stock', item_type: 'raw_material', unit: 'Rit', default_cost: 1850000, category_name: 'Material Alam' },
    { id: 'pre_pj_7', name: 'Keramik Granit Tile 60x60 Polished (Doos)', category: 'stock', item_type: 'raw_material', unit: 'Doos', default_cost: 185000, category_name: 'Material Finishing' },
    { id: 'pre_pj_8', name: 'Pipa PVC AW Rucika & Fitting Plumbing', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 8500000, category_name: 'MEP Instalasi' },
    { id: 'pre_pj_9', name: 'Kabel Listrik NYM Supreme & Panel Schneider', category: 'stock', item_type: 'raw_material', unit: 'Paket', default_cost: 12000000, category_name: 'MEP Instalasi' },
    { id: 'pre_pj_10', name: 'Cat Tembok Eksterior Weathershield Jotun 20L', category: 'stock', item_type: 'raw_material', unit: 'Pail', default_cost: 2150000, category_name: 'Material Finishing' },
    { id: 'pre_pj_11', name: 'Scaffolding Galvanis Lengkap (100 Set)', category: 'equipment', item_type: 'equipment_asset', unit: 'Set', default_cost: 45000000, category_name: 'Alat Berat & Konstruksi' },
    { id: 'pre_pj_12', name: 'Molen Cor Beton Diesel 8 HP', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 14000000, category_name: 'Alat Berat & Konstruksi' },
    { id: 'pre_pj_13', name: 'Genset Silent Diesel Proyek 10 KVA', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 28500000, category_name: 'Alat Berat & Konstruksi' },
  ],

  // 7. TEKNOLOGI & SOFTWARE: PT DIGITAL SOLUSI UTAMA
  consultant_it: [
    { id: 'pre_it_1', name: 'Laptop Developer MacBook Pro M3 16GB (4 Unit)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 28500000, category_name: 'Aset Hardware IT' },
    { id: 'pre_it_2', name: 'Monitor 4K Dell UltraSharp 27 Inch (6 Unit)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 6500000, category_name: 'Aset Hardware IT' },
    { id: 'pre_it_3', name: 'Server Local Development & NAS Synology 8TB', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 14500000, category_name: 'Aset Hardware IT' },
    { id: 'pre_it_4', name: 'Router WiFi 6 Gigabit & Managed Switch Cisco', category: 'equipment', item_type: 'equipment_asset', unit: 'Set', default_cost: 5800000, category_name: 'Infrastruktur Jaringan' },
    { id: 'pre_it_5', name: 'Meja Kerja Ergonomis Standing Desk & Kursi Mesh', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 3800000, category_name: 'Furniture Kantor' },
    { id: 'pre_it_6', name: 'Papan Tulis Kaca Glassboard Scrum & Spidol', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 1450000, category_name: 'Furniture Kantor' },
    { id: 'pre_it_7', name: 'Paket ATK, Kopi Mesin Capsule & Snack Bar', category: 'atk', item_type: 'equipment_asset', unit: 'Paket', default_cost: 850000, category_name: 'Perlengkapan Kantor' },
  ],

  // 8. PRIBADI & KELUARGA: KELUARGA MANDIRI SEJAHTERA
  personal_family: [
    { id: 'pre_pr_1', name: 'Logam Mulia Emas Antam 10 Gram (Investasi)', category: 'stock', item_type: 'equipment_asset', unit: 'Keping', default_cost: 14500000, category_name: 'Aset Investasi Emas' },
    { id: 'pre_pr_2', name: 'Sepeda Motor Honda Vario 160 (Kendaraan)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 29500000, category_name: 'Kendaraan Keluarga' },
    { id: 'pre_pr_3', name: 'Mobil Keluarga Toyota Avanza 1.5G (Kendaraan)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 245000000, category_name: 'Kendaraan Keluarga' },
    { id: 'pre_pr_4', name: 'Laptop Kerja ThinkPad / MacBook (Elektronik)', category: 'equipment', item_type: 'equipment_asset', unit: 'Unit', default_cost: 16500000, category_name: 'Elektronik Rumah' },
    { id: 'pre_pr_5', name: 'Kulkas 2 Pintu Inverter & Mesin Cuci 1 Tabung', category: 'equipment', item_type: 'equipment_asset', unit: 'Set', default_cost: 8500000, category_name: 'Perabot Rumah Tangga' },
    { id: 'pre_pr_6', name: 'Set Meja Makan Kayu Jati & Kursi 4 Set', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 4500000, category_name: 'Furniture Rumah' },
    { id: 'pre_pr_7', name: 'Tempat Tidur Springbed King Size & Lemari', category: 'furniture', item_type: 'equipment_asset', unit: 'Set', default_cost: 6800000, category_name: 'Furniture Rumah' },
  ],
};

export function getQuickPresets(bizType?: string): QuickInventoryPreset[] {
  if (bizType && BUSINESS_QUICK_PRESETS[bizType]) {
    return BUSINESS_QUICK_PRESETS[bizType];
  }
  return BUSINESS_QUICK_PRESETS.retail_shop;
}
