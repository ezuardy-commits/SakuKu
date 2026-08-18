import { Transaction } from '../types';
import { generateRealisticReceiptItems } from './realisticItemGenerator';

export interface ParsedReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ParsedReceiptData {
  title: string;
  items: ParsedReceiptItem[];
  itemsSubtotal: number;
  taxAmount: number;
  otherFees: number;
  grandTotal: number;
  hasDetailedItems: boolean;
}

function parseNumber(str: string): number {
  if (!str) return 0;
  // Replace non-digit characters except dot and comma
  const cleaned = str.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;
  // If dot is thousand separator and comma is decimal (or vice versa)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastDot > lastComma) {
      // e.g. 1,000.50
      return parseFloat(cleaned.replace(/,/g, ''));
    } else {
      // e.g. 1.000,50
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
  }
  // If only dot or only comma
  if (cleaned.includes('.')) {
    // Check if it's thousands separator (e.g., 10.000)
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      return parseFloat(cleaned.replace(/\./g, ''));
    }
    return parseFloat(cleaned);
  }
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }
    return parseFloat(cleaned.replace(',', '.'));
  }
  return parseFloat(cleaned) || 0;
}

export function parseReceiptFromTx(tx: Transaction): ParsedReceiptData {
  const desc = tx.description || '';
  const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);

  let title = lines[0] || 'Struk Belanja';
  const items: ParsedReceiptItem[] = [];
  let taxAmount = 0;

  // Regex to match items like: "• Minyak Goreng 2L (1x @ Rp 25.000 = Rp 25.000)"
  const itemRegex = /^[•\-*]?\s*(.*?)\s*\((?:(\d+(?:\.\d+)?)x)?\s*@?\s*(?:Rp|[$€£¥RM]|AED|S\$|A\$|C\$)?\s*([\d\.,]+)(?:\s*=\s*(?:Rp|[$€£¥RM]|AED|S\$|A\$|C\$)?\s*([\d\.,]+))?\)$/i;

  // Regex for tax line: "Pajak (PPN): Rp 2.500" or "Tax: 2500"
  const taxRegex = /(?:Pajak|PPN|PB1|Tax|Biaya Layanan|Service):\s*(?:Rp|[$€£¥RM]|AED|S\$|A\$|C\$)?\s*([\d\.,]+)/i;

  lines.forEach((line) => {
    const taxMatch = line.match(taxRegex);
    if (taxMatch && taxMatch[1]) {
      taxAmount = parseNumber(taxMatch[1]);
      return;
    }

    const match = line.match(itemRegex);
    if (match) {
      const name = match[1]?.trim() || 'Item Barang';
      const qty = parseFloat(match[2]) || 1;
      const price = parseNumber(match[3]);
      const total = match[4] ? parseNumber(match[4]) : qty * price;

      items.push({
        name,
        qty,
        price,
        total,
      });
    }
  });

  if (items.length === 0) {
    const seed = (tx.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1000;
    const generated = generateRealisticReceiptItems(
      tx.amount,
      tx.description || '',
      tx.business_type,
      tx.business_name,
      seed
    );
    return {
      title: generated.storeName || lines[0] || 'Struk Belanja & Pembelian Barang',
      items: generated.items,
      itemsSubtotal: generated.subtotal,
      taxAmount: generated.taxAmount,
      otherFees: 0,
      grandTotal: generated.grandTotal,
      hasDetailedItems: true,
    };
  }

  const itemsSubtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const diff = tx.amount - (itemsSubtotal + taxAmount);
  const otherFees = diff > 0 ? diff : 0;
  const grandTotal = itemsSubtotal + taxAmount + otherFees;

  return {
    title,
    items,
    itemsSubtotal,
    taxAmount,
    otherFees,
    grandTotal: Math.max(grandTotal, tx.amount),
    hasDetailedItems: true,
  };
}
