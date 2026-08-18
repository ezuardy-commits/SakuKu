/**
 * PROOF IMAGE GENERATOR — Canvas-based Bukti Transaksi Dummy
 * 
 * Menghasilkan gambar bukti transaksi realistis secara programatik:
 * 1. receipt   → Struk kasir thermal (bon belanja)
 * 2. statement → Screenshot mutasi M-Banking / QRIS
 * 3. voice     → Screenshot form input suara (Voice-to-Text)
 * 4. manual    → Screenshot formulir voucher input manual
 * 5. handwritten → Catatan tulisan tangan (scanned note)
 * 
 * 100% Bulletproof Canvas API (tanpa dependensi eksternal / tanpa method experimental)
 */

import { generateRealisticReceiptItems, RealisticItem } from './realisticItemGenerator';

// ── Universal Helpers ────────────────────────────────────

function fmtRp(amount: number): string {
  try {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  } catch {
    return `Rp ${amount}`;
  }
}

function padZ(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function genRefCode(seed: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(pseudoRandom(seed + i * 7) * chars.length)];
    if (i === 3 || i === 7) code += '-';
  }
  return code;
}

/**
 * Universal cross-browser rounded rectangle path builder
 * Compatible with ALL browser engines (iOS Safari, Android Webview, Chrome, Firefox)
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 8
) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export interface ProofTxData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  category_name?: string;
  account_name?: string;
  account_number?: string;
  business_name?: string;
  business_type?: string;
  voice_transcript?: string;
  source_type?: string;
  seed: number;
}

// ── 1. STRUK KASIR / BON BELANJA ────────────────────────

function generateReceiptImage(tx: ProofTxData): string {
  const W = 380;
  
  // Generate realistic items matching domain and target amount
  const receiptResult = generateRealisticReceiptItems(
    tx.amount,
    tx.description,
    tx.business_type,
    tx.business_name,
    tx.seed
  );
  const items = receiptResult.items;
  const subtotal = receiptResult.subtotal;

  const H = Math.max(560, 370 + items.length * 32);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background — thermal paper white
  ctx.fillStyle = '#FAFAF7';
  ctx.fillRect(0, 0, W, H);

  // Paper texture
  ctx.fillStyle = '#E8E5DE';
  for (let i = 0; i < 70; i++) {
    const px = pseudoRandom(tx.seed + i * 3) * W;
    const py = pseudoRandom(tx.seed + i * 5 + 1) * H;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  let y = 25;
  const cx = W / 2;

  const storeName = tx.business_name || receiptResult.storeName || (tx.amount > 5000000 ? 'Distributor & Grosir Resmi' : 'Supermarket & Pasar Mandiri');
  const storeAddr = tx.business_name ? 'Kawasan Niaga & Industri Blok C No. 8' : (receiptResult.storeAddress || 'Jl. Pasar Baru No. 12, Kota');

  // Header
  ctx.fillStyle = '#1A1A1A';
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText(storeName.substring(0, 32), cx, y);
  y += 18;
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(storeAddr, cx, y);
  y += 14;
  ctx.fillText(`Telp: (021) 8${Math.floor(pseudoRandom(tx.seed) * 900000 + 100000)}`, cx, y);
  y += 18;

  // Dashed separator
  ctx.strokeStyle = '#888888';
  ctx.beginPath();
  for (let x = 15; x < W - 15; x += 8) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y);
  }
  ctx.stroke();
  y += 14;

  // Date & cashier info
  ctx.textAlign = 'left';
  ctx.font = '11px "Courier New", monospace';
  const safeDate = tx.date ? new Date(tx.date + 'T12:00:00') : new Date();
  const dateStr = `${padZ(safeDate.getDate())}/${padZ(safeDate.getMonth() + 1)}/${safeDate.getFullYear()}`;
  const timeStr = `${padZ(8 + Math.floor(pseudoRandom(tx.seed + 2) * 12))}:${padZ(Math.floor(pseudoRandom(tx.seed + 3) * 59))}`;
  ctx.fillText(`Tgl: ${dateStr}  ${timeStr}`, 20, y);
  y += 14;
  ctx.fillText(`Kasir: ${Math.floor(pseudoRandom(tx.seed + 4) * 3) + 1}  No. Bon: ${Math.floor(pseudoRandom(tx.seed + 5) * 9000) + 1000}`, 20, y);
  y += 16;

  // Dashed separator
  ctx.beginPath();
  for (let x = 15; x < W - 15; x += 8) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y);
  }
  ctx.stroke();
  y += 14;

  // Render Realistic Items with market prices
  ctx.font = '11px "Courier New", monospace';
  items.forEach((it) => {
    ctx.textAlign = 'left';
    ctx.fillText(it.name.substring(0, 26), 20, y);
    y += 14;
    ctx.fillText(`  ${it.qty}x @ ${fmtRp(it.price)}`, 20, y);
    ctx.textAlign = 'right';
    ctx.fillText(fmtRp(it.total), W - 20, y);
    y += 16;
  });

  // Dashed separator
  ctx.beginPath();
  for (let x = 15; x < W - 15; x += 8) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y);
  }
  ctx.stroke();
  y += 14;

  // Subtotal & Total
  ctx.textAlign = 'left';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('Subtotal Item:', 20, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtRp(subtotal), W - 20, y);
  y += 16;

  // Total bold (matches subtotal exactly)
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL TRANSAKSI:', 20, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtRp(subtotal), W - 20, y);
  y += 18;

  // Payment method
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'left';
  const payMethod = tx.account_name?.toLowerCase().includes('qris') || tx.account_name?.toLowerCase().includes('gopay')
    ? 'QRIS / E-Wallet' : tx.account_name?.toLowerCase().includes('bank')
    ? 'Transfer Bank / Debit' : 'TUNAI';
  ctx.fillText(`Metode Bayar: ${payMethod}`, 20, y);
  y += 18;

  // Dashed separator
  ctx.beginPath();
  for (let x = 15; x < W - 15; x += 8) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y);
  }
  ctx.stroke();
  y += 16;

  ctx.textAlign = 'center';
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = '#666666';
  ctx.fillText('*** Terima Kasih ***', cx, y);
  y += 14;
  ctx.fillText('Simpan struk ini sebagai bukti transaksi sah', cx, y);
  y += 14;
  ctx.fillText(`REF: ${genRefCode(tx.seed)}`, cx, y);
  y += 18;

  // Barcode
  ctx.fillStyle = '#1A1A1A';
  const barW = 200;
  const barStart = (W - barW) / 2;
  for (let i = 0; i < 40; i++) {
    const lw = pseudoRandom(tx.seed + i * 23) > 0.5 ? 2 : 4;
    ctx.fillRect(barStart + i * 5, y, lw, 24);
  }

  return canvas.toDataURL('image/jpeg', 0.65);
}

// ── 2. SCREENSHOT MUTASI M-BANKING ──────────────────────

function generateStatementImage(tx: ProofTxData): string {
  const W = 400;
  const H = 520;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0A1628');
  grad.addColorStop(0.3, '#0E2240');
  grad.addColorStop(1, '#061225');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;

  // Bank name
  const bankNames = ['BCA Mobile', "Mandiri Livin'", 'BNI Mobile', 'BRI Mobile', 'CIMB Niaga Go'];
  const accName = tx.account_name || '';
  let bankName = 'M-Banking';
  for (const bn of bankNames) {
    if (accName.toLowerCase().includes(bn.split(' ')[0].toLowerCase())) {
      bankName = bn;
      break;
    }
  }

  // Header bar
  ctx.fillStyle = '#1A3A6B';
  drawRoundRect(ctx, 0, 0, W, 55, 0);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText(bankName, cx, 35);

  let y = 75;

  // Status badge
  ctx.fillStyle = '#0D3A1F';
  drawRoundRect(ctx, cx - 60, y, 120, 28, 14);
  ctx.fill();
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#4ADE80';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ BERHASIL', cx, y + 18);
  y += 48;

  // Amount
  ctx.fillStyle = tx.type === 'income' ? '#34D399' : '#FB923C';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  const prefix = tx.type === 'income' ? '+' : '-';
  ctx.fillText(`${prefix} ${fmtRp(tx.amount || 0)}`, cx, y);
  y += 35;

  // Card background
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  drawRoundRect(ctx, 20, y, W - 40, 240, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const cardX = 35;
  const cardRight = W - 35;
  y += 22;

  const drawRow = (label: string, value: string, isLast = false) => {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, cardX, y);
    y += 16;
    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 12px Arial, sans-serif';
    const maxW = cardRight - cardX;
    if (ctx.measureText(value).width > maxW) {
      ctx.fillText(value.substring(0, 30) + '...', cardX, y);
    } else {
      ctx.fillText(value, cardX, y);
    }
    y += 18;
    if (!isLast) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(cardX, y);
      ctx.lineTo(cardRight, y);
      ctx.stroke();
      y += 10;
    }
  };

  const safeDate = tx.date ? new Date(tx.date + 'T12:00:00') : new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const dateDisplay = `${safeDate.getDate()} ${months[safeDate.getMonth()]} ${safeDate.getFullYear()}, ${padZ(9 + Math.floor(pseudoRandom(tx.seed) * 10))}:${padZ(Math.floor(pseudoRandom(tx.seed + 1) * 59))} WIB`;

  drawRow('Tanggal & Waktu', dateDisplay);
  drawRow('Jenis Transaksi', tx.type === 'income' ? 'Transfer Masuk / Cr' : 'Transfer Keluar / Db');
  drawRow('Rekening', `${tx.account_name || 'Rekening Utama'}${tx.account_number ? ` (${tx.account_number})` : ''}`);
  drawRow('Keterangan', (tx.description || 'Transaksi Operasional').substring(0, 38));
  drawRow('No. Referensi', genRefCode(tx.seed), true);

  y += 30;

  // Footer
  ctx.fillStyle = '#64748B';
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Screenshot ini merupakan bukti transaksi resmi.', cx, y);
  y += 14;
  ctx.fillText(`Nomor Tiket: TXN-${genRefCode(tx.seed + 99).substring(0, 8)}`, cx, y);
  y += 14;
  ctx.fillStyle = '#475569';
  ctx.fillText('© 2026 Mobile Banking Indonesia', cx, y);

  return canvas.toDataURL('image/jpeg', 0.65);
}

// ── 3. SCREENSHOT FORM INPUT SUARA ──────────────────────

function generateVoiceFormImage(tx: ProofTxData): string {
  const W = 400;
  const H = 540;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#042F1A');
  grad.addColorStop(0.5, '#0A2818');
  grad.addColorStop(1, '#041F12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;

  // Header bar
  ctx.fillStyle = '#0D3D22';
  drawRoundRect(ctx, 0, 0, W, 52, 0);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Form Input Suara — Voice AI', cx, 33);

  let y = 70;

  // Mic circle
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(cx, y + 15, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#042F1A';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎤', cx, y + 21);
  y += 48;

  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('Rekaman Selesai • Durasi: 00:04', cx, y);
  y += 25;

  // Waveform box
  ctx.fillStyle = 'rgba(16,185,129,0.12)';
  drawRoundRect(ctx, 20, y, W - 40, 50, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16,185,129,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const waveY = y + 25;
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < W - 40; i++) {
    const amplitude = 6 + pseudoRandom(tx.seed + i) * 12;
    const wv = Math.sin(i * 0.15 + tx.seed) * amplitude;
    if (i === 0) ctx.moveTo(30 + i, waveY + wv);
    else ctx.lineTo(30 + i, waveY + wv);
  }
  ctx.stroke();
  y += 65;

  // Transcript box
  ctx.fillStyle = 'rgba(16,185,129,0.08)';
  drawRoundRect(ctx, 20, y, W - 40, 80, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16,185,129,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TRANSKRIP SUARA PENGGUNA:', 35, y + 18);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'italic 11px Georgia, serif';
  const transcript = tx.voice_transcript || tx.description || 'Transaksi pengeluaran tercatat';
  const words = transcript.split(' ');
  let line = '"';
  let ly = y + 36;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 80) {
      ctx.fillText(line, 35, ly);
      line = word + ' ';
      ly += 15;
    } else {
      line = test;
    }
  }
  ctx.fillText(line + '"', 35, ly);
  y += 95;

  // Parsed details card
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  drawRoundRect(ctx, 20, y, W - 40, 155, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HASIL PARSING AI:', 35, y + 20);
  y += 35;

  const drawField = (label: string, value: string) => {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 35, y);
    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value.substring(0, 28), W - 35, y);
    y += 20;
  };

  const safeDate = tx.date ? new Date(tx.date + 'T12:00:00') : new Date();
  drawField('Tanggal:', `${padZ(safeDate.getDate())}/${padZ(safeDate.getMonth() + 1)}/${safeDate.getFullYear()}`);
  drawField('Jenis:', tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran');
  drawField('Nominal:', fmtRp(tx.amount || 0));
  drawField('Kategori:', tx.category_name || 'Umum');
  drawField('Rekening:', (tx.account_name || 'Kas Utama').substring(0, 28));

  y += 15;

  ctx.fillStyle = '#0D3D22';
  drawRoundRect(ctx, cx - 100, y, 200, 26, 13);
  ctx.fill();
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#4ADE80';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ Terverifikasi • Akurasi 99.4%', cx, y + 17);

  return canvas.toDataURL('image/jpeg', 0.65);
}

// ── 4. SCREENSHOT FORM INPUT MANUAL ─────────────────────

function generateManualFormImage(tx: ProofTxData): string {
  const W = 400;
  const H = 500;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = '#1E40AF';
  ctx.fillRect(0, 0, W, 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Formulir Voucher Input Manual', W / 2, 32);

  let y = 50;
  ctx.fillStyle = '#64748B';
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Dicatat via Aplikasi SakuKu • Input Manual Resmi', W / 2, y + 18);
  y += 32;

  // Form card
  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, 18, y, W - 36, 310, 12);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  const formX = 35;
  const formRight = W - 35;
  y += 20;

  ctx.fillStyle = '#3B82F6';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`No. Voucher: ${genRefCode(tx.seed)}`, formRight, y);
  y += 20;

  const drawFormField = (label: string, value: string) => {
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), formX, y);
    y += 14;

    ctx.fillStyle = '#F1F5F9';
    drawRoundRect(ctx, formX, y - 4, formRight - formX, 26, 5);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(value.substring(0, 34), formX + 8, y + 13);
    y += 34;
  };

  const safeDate = tx.date ? new Date(tx.date + 'T12:00:00') : new Date();
  const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  drawFormField('Tanggal Transaksi', `${safeDate.getDate()} ${monthsFull[safeDate.getMonth()]} ${safeDate.getFullYear()}`);
  drawFormField('Jenis Pencatatan', tx.type === 'income' ? 'Pemasukan / Income' : 'Pengeluaran / Expense');
  drawFormField('Nominal (Rp)', fmtRp(tx.amount || 0));
  drawFormField('Kategori', tx.category_name || 'Umum / Operasional');
  drawFormField('Akun Pembayaran', (tx.account_name || 'Kas Utama').substring(0, 34));

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('KETERANGAN / DESKRIPSI', formX, y);
  y += 14;
  ctx.fillStyle = '#F1F5F9';
  drawRoundRect(ctx, formX, y - 4, formRight - formX, 34, 5);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#1E293B';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText((tx.description || '').substring(0, 40), formX + 8, y + 11);
  if ((tx.description || '').length > 40) {
    ctx.fillText((tx.description || '').substring(40, 80), formX + 8, y + 24);
  }

  y = H - 55;
  ctx.fillStyle = '#ECFDF5';
  drawRoundRect(ctx, W / 2 - 100, y, 200, 28, 14);
  ctx.fill();
  ctx.strokeStyle = '#6EE7B7';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ Dicatat & Terverifikasi Sistem', W / 2, y + 18);

  return canvas.toDataURL('image/jpeg', 0.65);
}

// ── 5. CATATAN TULISAN TANGAN (SCANNED) ─────────────────

function generateHandwrittenImage(tx: ProofTxData): string {
  const W = 400;
  const H = 450;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#FEF9E7');
  grad.addColorStop(0.5, '#FDF6E3');
  grad.addColorStop(1, '#F7F0D4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Paper texture
  ctx.fillStyle = '#E8DFC0';
  for (let i = 0; i < 60; i++) {
    const px = pseudoRandom(tx.seed + i * 7) * W;
    const py = pseudoRandom(tx.seed + i * 11 + 1) * H;
    ctx.fillRect(px, py, 2, 2);
  }

  // Ruled lines
  ctx.strokeStyle = '#D4C8A0';
  ctx.lineWidth = 0.5;
  for (let ly = 60; ly < H - 30; ly += 28) {
    ctx.beginPath();
    ctx.moveTo(30, ly);
    ctx.lineTo(W - 30, ly);
    ctx.stroke();
  }

  // Red margin line
  ctx.strokeStyle = '#E8A0A0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 30);
  ctx.lineTo(55, H - 30);
  ctx.stroke();

  let y = 52;

  // Date
  ctx.fillStyle = '#4A3A28';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'right';
  const safeDate = tx.date ? new Date(tx.date + 'T12:00:00') : new Date();
  const dateStr = `${safeDate.getDate()}/${safeDate.getMonth() + 1}/${safeDate.getFullYear()}`;
  ctx.fillText(dateStr, W - 40, y);
  y += 34;

  ctx.fillStyle = '#2D1F0E';
  ctx.font = 'bold italic 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(tx.type === 'income' ? 'Catatan Pemasukan:' : 'Catatan Pengeluaran:', 65, y);
  y += 34;

  ctx.fillStyle = '#3A2D1C';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'left';
  const words = (tx.description || 'Pengeluaran tercatat').split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 100) {
      ctx.fillText(line, 65, y);
      line = word + ' ';
      y += 28;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, 65, y);
  y += 35;

  ctx.fillStyle = '#1A0F05';
  ctx.font = 'bold italic 18px Georgia, serif';
  ctx.fillText(`Total: ${fmtRp(tx.amount || 0)}`, 65, y);
  const amtWidth = ctx.measureText(`Total: ${fmtRp(tx.amount || 0)}`).width;
  ctx.strokeStyle = '#4A3A28';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(65, y + 4);
  ctx.lineTo(65 + amtWidth, y + 4);
  ctx.stroke();
  y += 35;

  ctx.fillStyle = '#5A4A38';
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText(`Bayar: ${tx.account_name || 'Kas'}`, 65, y);
  y += 28;
  ctx.fillText(`Kategori: ${tx.category_name || 'Umum'}`, 65, y);

  // Stamp
  ctx.save();
  ctx.translate(W - 85, H - 70);
  ctx.rotate(-0.35);
  ctx.strokeStyle = '#9B59B6';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, -50, -14, 100, 28, 4);
  ctx.stroke();
  ctx.fillStyle = '#9B59B6';
  ctx.globalAlpha = 0.7;
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OCR SCANNED', 0, 4);
  ctx.globalAlpha = 1;
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.65);
}

// ── ROUTER UTAMA (DILENGKAPI SAFE TRY-CATCH) ────────────

export function generateProofImage(tx: ProofTxData): string {
  try {
    if (typeof document === 'undefined' || !document.createElement) {
      return '';
    }
    switch (tx.source_type) {
      case 'receipt':
        return generateReceiptImage(tx);
      case 'statement':
        return generateStatementImage(tx);
      case 'voice':
        return generateVoiceFormImage(tx);
      case 'handwritten':
        return generateHandwrittenImage(tx);
      case 'manual':
      default:
        return generateManualFormImage(tx);
    }
  } catch (err) {
    console.warn('generateProofImage encountered a canvas error:', err);
    return '';
  }
}
