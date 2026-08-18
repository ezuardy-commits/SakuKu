import { InventoryItemType } from '../types';

export interface ParsedVoiceItem {
  name: string;
  qty: number;
  unit: string;
  cost_price: number;
  item_type: InventoryItemType;
  category_name?: string;
}

export function parseVoiceToInventoryItem(spokenText: string): ParsedVoiceItem {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  // 1. Extract Unit & Qty
  let foundUnit = 'pcs';
  let qty = 1;

  // Match: "10 kg", "20 botol", "50 zak", "10 karung", "24 pouch", "1 unit"
  const qtyUnitRegex = /(\d+(?:[\.,]\d+)?)\s*(karung|pouch|botol|kg|kilogram|gram|gr|liter|karton|dus|box|set|unit|pcs|keping|lembar|rit|m³|zak|batang|pail|roll|paket)\b/i;
  const qtyUnitMatch = lower.match(qtyUnitRegex);
  if (qtyUnitMatch) {
    qty = parseFloat(qtyUnitMatch[1].replace(',', '.')) || 1;
    const u = qtyUnitMatch[2].toLowerCase();
    if (u === 'kilogram') foundUnit = 'Kg';
    else if (u === 'gr') foundUnit = 'gram';
    else if (u === 'kg') foundUnit = 'Kg';
    else foundUnit = u.charAt(0).toUpperCase() + u.slice(1);
  } else {
    for (const u of units) {
      const regex = new RegExp(`\\b${u}\\b`, 'i');
      if (regex.test(lower)) {
        if (u === 'kilogram') foundUnit = 'Kg';
        else if (u === 'gr') foundUnit = 'gram';
        else if (u === 'kg') foundUnit = 'Kg';
        else foundUnit = u.charAt(0).toUpperCase() + u.slice(1);
        break;
      }
    }
  }

  // 2. Extract Price / Cost (ignore the quantity numbers)
  let costPrice = 0;
  const sanitizedForPrice = lower.replace(qtyUnitRegex, ' ');

  // A. Check Juta Patterns
  const jutaPattern = /(\d+(?:[\.,]\d+)?)\s*(?:juta|jt)(?:\s*(\d+(?:[\.,]\d+)?)\s*(?:ratus|ribu|rb)?)?/i;
  const jutaMatch = sanitizedForPrice.match(jutaPattern);
  if (jutaMatch) {
    const baseJuta = parseFloat(jutaMatch[1].replace(',', '.')) || 0;
    let total = baseJuta * 1000000;
    if (jutaMatch[2]) {
      let extra = parseFloat(jutaMatch[2].replace(',', '.')) || 0;
      if (jutaMatch[0].includes('ratus')) extra *= 100000;
      else if (extra < 1000) extra *= 1000;
      total += extra;
    }
    costPrice = Math.round(total);
  }

  // B. Check Ribu & Exact Price Patterns
  if (costPrice === 0) {
    const priceMatches = [...sanitizedForPrice.matchAll(/(?:harga|seharga|modal|beli|rp|rp\.)?\s*([\d\.\,]+)\s*(ribu|rb|k|ratus ribu)?/gi)];
    for (const pm of priceMatches) {
      if (!pm[1]) continue;
      const raw = pm[1].trim();
      const multStr = (pm[2] || '').toLowerCase().trim();

      if (multStr.includes('ribu') || multStr === 'rb' || multStr === 'k') {
        const pVal = parseFloat(raw.replace(',', '.'));
        if (!isNaN(pVal) && pVal > 0) {
          costPrice = Math.round(pVal * 1000);
          break;
        }
      } else if (raw.includes('.') || raw.includes(',')) {
        const cleanNum = raw.replace(/[\.,]/g, '');
        const pVal = parseFloat(cleanNum);
        if (!isNaN(pVal) && pVal >= 500) {
          costPrice = Math.round(pVal);
          break;
        }
      } else {
        const pVal = parseFloat(raw);
        if (!isNaN(pVal) && pVal >= 500) {
          costPrice = Math.round(pVal);
          break;
        }
      }
    }
  }

  // 3. Extract Item Name
  let name = text
    .replace(/(?:tambah|catat|masukkan|input|stok|beli|update)\s+/i, '')
    .replace(/(?:harga|seharga|modal|beli|rp|rp\.).*$/i, '')
    .trim();

  // Strip qty + unit from name
  if (qtyUnitMatch) {
    name = name.replace(new RegExp(`\\b${qtyUnitMatch[0]}\\b`, 'i'), '').trim();
  }
  if (foundUnit && name.toLowerCase().includes(foundUnit.toLowerCase())) {
    name = name.replace(new RegExp(`\\b${foundUnit}\\b`, 'i'), '').trim();
  }
  name = name.replace(/\s+\d+(\.\d+)?\s*(juta|jt|ribu|rb|k|ratus ribu)?.*$/i, '').trim();
  name = name.replace(/\s+\d+(\.\d+)?$/, '').trim();

  if (!name || name.length < 2) {
    name = text.split(/\s+harga|\s+seharga|\s+rp/i)[0].trim() || 'Item Inventaris';
  }

  name = name.charAt(0).toUpperCase() + name.slice(1);

  // Classify
  let item_type: InventoryItemType = 'product_stock';
  let category_name = 'Barang Dagangan';

  const nameLower = name.toLowerCase();
  if (
    nameLower.includes('biji kopi') ||
    nameLower.includes('susu') ||
    nameLower.includes('sirup') ||
    nameLower.includes('bubuk') ||
    nameLower.includes('semen') ||
    nameLower.includes('besi') ||
    nameLower.includes('pasir') ||
    nameLower.includes('hebel') ||
    nameLower.includes('tepung') ||
    nameLower.includes('bumbu') ||
    nameLower.includes('daging') ||
    nameLower.includes('cup')
  ) {
    item_type = 'raw_material';
    category_name = 'Bahan Baku/Stok';
  } else if (
    nameLower.includes('meja') ||
    nameLower.includes('kursi') ||
    nameLower.includes('rak') ||
    nameLower.includes('etalase') ||
    nameLower.includes('lemari')
  ) {
    item_type = 'equipment_asset';
    category_name = 'Furniture/Mebel';
  } else if (
    nameLower.includes('atk') ||
    nameLower.includes('pos') ||
    nameLower.includes('kasir') ||
    nameLower.includes('printer') ||
    nameLower.includes('scanner') ||
    nameLower.includes('kertas') ||
    nameLower.includes('nota') ||
    nameLower.includes('pulpen')
  ) {
    item_type = 'equipment_asset';
    category_name = 'Perlengkapan/ATK';
  } else if (
    nameLower.includes('mesin') ||
    nameLower.includes('espresso') ||
    nameLower.includes('chiller') ||
    nameLower.includes('kulkas') ||
    nameLower.includes('kompresor') ||
    nameLower.includes('molen') ||
    nameLower.includes('lift') ||
    nameLower.includes('vibrator') ||
    nameLower.includes('genset') ||
    nameLower.includes('alat')
  ) {
    item_type = 'equipment_asset';
    category_name = 'Peralatan/Aset';
  }

  return {
    name,
    qty,
    unit: foundUnit,
    cost_price: costPrice || 0,
    item_type,
    category_name,
  };
}
