// src/pages/POS.tsx
// Worker POS screen — medicine search, cart, and sale draft UI
// Phase 5C: UI shell only; checkout/receipt wiring comes in Phase 5D

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Package, AlertTriangle, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createSale, getMedicines } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

type MedicineOption = {
  medicine_id: number;
  name: string;
  dosage_form: string;
  strength: string;
  unit_price: number;
  expiry_date: string;
  batch_no: string;
  stock_qty: number;
  low_stock_threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Expired' | 'Out of Stock';
};

type CartItem = {
  medicineId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  stockQty: number;
  status: MedicineOption['status'];
};

type SaleReceipt = {
  sale_id: number;
  invoice_no: string;
  customer_name: string;
  customer_phone: string | null;
  sold_by: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  payment_status: 'paid' | 'pending' | 'partial' | 'refunded';
  notes: string | null;
  created_at: string;
};

type SaleReceiptData = {
  sale: SaleReceipt;
  items: Array<{
    sale_item_id: number;
    sale_id: number;
    medicine_id: number;
    medicine_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    created_at: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatExpiry(date: string) {
  if (!date) return 'N/A';
  const dt = new Date(date);
  return Number.isNaN(dt.getTime()) ? date : dt.toLocaleDateString('en-GB');
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function POS() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState<MedicineOption[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);

  async function loadMedicines() {
    try {
      setLoading(true);
      const res = await getMedicines();

      const mapped: MedicineOption[] = res.data.map((m: {
        medicine_id: number;
        name: string;
        dosage_form: string;
        strength: string;
        unit_price: number;
        expiry_date: string;
        batch_no: string;
        stock_qty: number;
        low_stock_threshold: number;
        status: MedicineOption['status'];
      }) => ({
        medicine_id: m.medicine_id,
        name: m.name,
        dosage_form: m.dosage_form,
        strength: m.strength,
        unit_price: Number(m.unit_price),
        expiry_date: m.expiry_date,
        batch_no: m.batch_no,
        stock_qty: Number(m.stock_qty),
        low_stock_threshold: Number(m.low_stock_threshold),
        status: m.status,
      }));

      setMedicines(mapped);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    loadMedicines().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch = [medicine.name, medicine.dosage_form, medicine.strength, medicine.batch_no]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        selectedFilter === 'all' ||
        (selectedFilter === 'in-stock' && medicine.status === 'In Stock') ||
        (selectedFilter === 'low-stock' && medicine.status === 'Low Stock') ||
        (selectedFilter === 'expired' && medicine.status === 'Expired');

      return matchesSearch && matchesStatus;
    });
  }, [medicines, search, selectedFilter]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const lowStockCount = medicines.filter((medicine) => medicine.status === 'Low Stock').length;
  const expiredCount = medicines.filter((medicine) => medicine.status === 'Expired').length;

  function addToCart(medicine: MedicineOption) {
    if (medicine.status !== 'In Stock') return;

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.medicine_id);
      if (existing) {
        return prev.map((item) =>
          item.medicineId === medicine.medicine_id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQty) }
            : item
        );
      }

      return [
        ...prev,
        {
          medicineId: medicine.medicine_id,
          name: medicine.name,
          unitPrice: medicine.unit_price,
          quantity: 1,
          stockQty: medicine.stock_qty,
          status: medicine.status,
        },
      ];
    });
  }

  function incrementItem(medicineId: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQty) }
          : item
      )
    );
  }

  function decrementItem(medicineId: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.medicineId === medicineId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(medicineId: number) {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  }

  const subtotal = cartSubtotal;
  const discountValue = Math.max(Number(discountAmount) || 0, 0);
  const total = Math.max(subtotal - discountValue, 0);
  const isCheckoutReady = cart.length > 0 && !submitting;

  async function handleCheckout() {
    if (!isCheckoutReady) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || null,
        payment_method: paymentMethod,
        payment_status: 'paid',
        discount_amount: discountValue,
        notes: `Sold by ${user?.full_name || 'Unknown cashier'}`,
        items: cart.map((item) => ({
          medicine_id: item.medicineId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      const res = await createSale(payload);
      setReceipt(res.data);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountAmount('0');
      setPaymentMethod('cash');
      await loadMedicines();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Failed to complete sale.');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrintReceipt() {
    if (!receipt) return;

    const printableWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printableWindow) return;

    const itemsRows = receipt.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.medicine_name)}</td>
            <td style="text-align:right">${item.quantity}</td>
            <td style="text-align:right">${toNumber(item.unit_price).toFixed(2)}</td>
            <td style="text-align:right">${toNumber(item.line_total).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(receipt.sale.invoice_no)} Receipt</title>
          <style>
            @page { margin: 12mm; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #111;
              background: #fff;
            }
            .receipt {
              width: 100%;
              max-width: 360px;
              margin: 0 auto;
              padding: 0;
              box-sizing: border-box;
            }
            .center { text-align: center; }
            .muted { font-size: 12px; color: #444; }
            .divider { border-top: 1px dashed #111; margin: 14px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 4px 0; vertical-align: top; }
            th { text-align: left; }
            .summary-row { display: flex; justify-content: space-between; gap: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center">
              <div style="font-size: 18px; font-weight: 700;">PharmaCare Pharmacy</div>
              <div class="muted">Hospital Pharmacy Management System</div>
              <div class="muted">Official Sales Receipt</div>
            </div>

            <div class="divider"></div>

            <div class="summary-row"><span>Invoice No.</span><span>${escapeHtml(receipt.sale.invoice_no)}</span></div>
            <div class="summary-row"><span>Date / Time</span><span>${escapeHtml(receiptDate)}</span></div>
            <div class="summary-row"><span>Customer</span><span>${escapeHtml(receipt.sale.customer_name)}</span></div>
            <div class="summary-row"><span>Cashier</span><span>${escapeHtml(user?.full_name || 'Unknown cashier')}</span></div>
            <div class="summary-row"><span>Payment</span><span>${escapeHtml(receipt.sale.payment_method)}</span></div>

            <div class="divider"></div>

            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style="text-align:right">Qty</th>
                  <th style="text-align:right">Price</th>
                  <th style="text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="divider"></div>

            <div class="summary-row"><span>Total Items</span><span>${receipt.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
            <div class="summary-row"><span>Gross Total</span><span>${money(receipt.sale.subtotal)}</span></div>
            <div class="summary-row"><span>Discount</span><span>${money(receipt.sale.discount_amount)}</span></div>
            <div class="summary-row" style="font-weight:700;"><span>Net Total</span><span>${money(receipt.sale.total_amount)}</span></div>

            <div class="divider"></div>

            <div class="center muted">Thank you for choosing PharmaCare.</div>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>`;

    printableWindow.document.open();
    printableWindow.document.write(receiptHtml);
    printableWindow.document.close();
  }

  function handleDownloadReceipt() {
    if (!receipt) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PharmaCare Pharmacy', pageWidth / 2, cursorY, { align: 'center' });

    cursorY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Hospital Pharmacy Management System', pageWidth / 2, cursorY, { align: 'center' });

    cursorY += 6;
    doc.setFontSize(10);
    doc.text('Official Sales Receipt', pageWidth / 2, cursorY, { align: 'center' });

    cursorY += 6;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);

    cursorY += 8;
    const infoRows: Array<[string, string]> = [
      ['Invoice No.', receipt.sale.invoice_no],
      ['Date / Time', receiptDate],
      ['Customer', receipt.sale.customer_name],
      ['Cashier', user?.full_name || 'Unknown cashier'],
      ['Payment', receipt.sale.payment_method],
    ];

    doc.setFontSize(10);
    infoRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '-', pageWidth - margin, cursorY, { align: 'right' });
      cursorY += 6;
    });

    cursorY += 2;
    doc.line(margin, cursorY, pageWidth - margin, cursorY);

    cursorY += 6;
    autoTable(doc, {
      startY: cursorY,
      head: [['Item Name', 'Qty', 'Price', 'Total']],
      body: receipt.items.map((item) => [
        item.medicine_name,
        String(item.quantity),
        toNumber(item.unit_price).toFixed(2),
        toNumber(item.line_total).toFixed(2),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2,
        textColor: 20,
      },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        1: { halign: 'right', cellWidth: 16 },
        2: { halign: 'right', cellWidth: 24 },
        3: { halign: 'right', cellWidth: 24 },
      },
      margin: { left: margin, right: margin },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 8;
    const totals = [
      ['Total Items', String(receipt.items.reduce((sum, item) => sum + item.quantity, 0))],
      ['Gross Total', money(receipt.sale.subtotal)],
      ['Discount', money(receipt.sale.discount_amount)],
      ['Net Total', money(receipt.sale.total_amount)],
    ];

    let totalsY = afterTableY;
    totals.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, pageWidth - 70, totalsY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, pageWidth - margin, totalsY, { align: 'right' });
      totalsY += 6;
    });

    doc.setFontSize(10);
    doc.text('Thank you for choosing PharmaCare.', pageWidth / 2, totalsY + 6, { align: 'center' });

    const safeInvoiceNo = receipt.sale.invoice_no.replace(/[\\/:*?"<>|]+/g, '-');
    doc.save(`${safeInvoiceNo}_receipt.pdf`);
  }

  const receiptDate = receipt?.sale.created_at
    ? new Date(receipt.sale.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <div className="grid grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
      <div className="col-span-12 lg:col-span-8 space-y-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 45%, #2563EB 100%)' }}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 mb-3">
                <ShoppingCart size={14} /> Worker POS
              </div>
              <h1 className="text-3xl font-bold leading-tight">Sell medicine fast, clean, and safe.</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Search stock, add items to the cart, and prepare the checkout flow. This phase focuses on the POS workspace only.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-2xl font-bold">{medicines.length}</div>
                <div className="text-xs text-white/75">Medicines</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <div className="text-xs text-white/75">Low Stock</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-2xl font-bold">{expiredCount}</div>
                <div className="text-xs text-white/75">Expired</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1730] rounded-2xl shadow-sm border border-transparent dark:border-[#2D2B45] p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Medicine Catalog</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search, filter, and add medicines to the cart.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'in-stock', label: 'In Stock' },
                { key: 'low-stock', label: 'Low Stock' },
                { key: 'expired', label: 'Expired' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as typeof selectedFilter)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedFilter === filter.key ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#252240] dark:text-gray-300 dark:hover:bg-[#2D2B45]'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine, strength, dosage form, or batch number"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading medicines...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:bg-[#2A1B1B] dark:border-red-900/40 dark:text-red-300">
              {error}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              No medicines matched your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMedicines.map((medicine) => {
                const disabled = medicine.status !== 'In Stock';
                const disabledReason =
                  medicine.status === 'Expired'
                    ? 'Expired medicine cannot be sold'
                    : medicine.status === 'Low Stock'
                      ? 'Low stock medicine is blocked for checkout'
                      : 'Out of stock';
                return (
                  <div
                    key={medicine.medicine_id}
                    className="rounded-2xl border border-gray-100 dark:border-[#2D2B45] bg-white dark:bg-[#252240] p-4 shadow-sm flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{medicine.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {medicine.dosage_form} • {medicine.strength}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                          medicine.status === 'In Stock'
                            ? 'bg-emerald-100 text-emerald-700'
                            : medicine.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-700'
                              : medicine.status === 'Expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {medicine.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="rounded-xl bg-gray-50 dark:bg-[#1A1730] p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Price</div>
                        <div className="font-bold text-gray-900 dark:text-white">{money(medicine.unit_price)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-[#1A1730] p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Stock</div>
                        <div className="font-bold text-gray-900 dark:text-white">{medicine.stock_qty}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-[#1A1730] p-3 col-span-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Batch / Expiry</div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{medicine.batch_no} • {formatExpiry(medicine.expiry_date)}</div>
                      </div>
                    </div>

                    {medicine.status !== 'In Stock' && (
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium mb-4 ${medicine.status === 'Expired' ? 'bg-red-50 text-red-700' : medicine.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                        <AlertTriangle size={14} /> Low stock medicine
                        <span className="ml-1">{disabledReason}</span>
                      </div>
                    )}

                    <button
                      onClick={() => addToCart(medicine)}
                      disabled={disabled}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#5B21B6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} /> Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 lg:h-full lg:min-h-0 lg:sticky lg:top-6">
        <div className="bg-white dark:bg-[#1A1730] rounded-2xl shadow-sm border border-transparent dark:border-[#2D2B45] overflow-hidden lg:h-full lg:flex lg:flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D2B45] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#7C3AED]" /> Cart
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cartItemsCount} units selected</p>
            </div>
            <div className="rounded-full bg-[#EDE9FE] text-[#7C3AED] px-3 py-1 text-xs font-bold">
              Phase 5C
            </div>
          </div>

          <div className="p-5 space-y-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Customer Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in customer or patient name"
                className="w-full rounded-xl border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Optional. If left blank, the sale is saved as Walk-in Customer.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'cash', label: 'Cash' },
                  { key: 'card', label: 'Card' },
                  { key: 'mobile', label: 'Mobile' },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPaymentMethod(option.key as typeof paymentMethod)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${paymentMethod === option.key ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#252240] dark:text-gray-300 dark:hover:bg-[#2D2B45]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Discount Amount</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-[#252240] p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Cashier</span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.full_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Current items</span>
                <span className="font-medium text-gray-900 dark:text-white">{cart.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Subtotal preview</span>
                <span className="font-bold text-gray-900 dark:text-white">{money(cartSubtotal)}</span>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#2D2B45] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No items in cart yet. Add medicines from the catalog.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.medicineId} className="rounded-2xl border border-gray-100 dark:border-[#2D2B45] p-4 bg-white dark:bg-[#252240]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{money(item.unitPrice)} each</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.medicineId)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrementItem(item.medicineId)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#1A1730] text-gray-700 dark:text-gray-200"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => incrementItem(item.medicineId)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#1A1730] text-gray-700 dark:text-gray-200"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Line total</div>
                        <div className="font-bold text-gray-900 dark:text-white">{money(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                      <span>Available stock: {item.stockQty}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-[#F5F3FF] dark:bg-[#1F1C35] p-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{money(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Discount</span>
                <span className="font-semibold text-gray-900 dark:text-white">{money(discountValue)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-gray-200 dark:border-[#2D2B45] pt-3">
                <span className="text-base font-bold text-gray-900 dark:text-white">Estimated Total</span>
                <span className="text-xl font-extrabold text-[#7C3AED]">{money(total)}</span>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-[#2A1B1B] dark:border-red-900/40 dark:text-red-300">
                {submitError}
              </div>
            )}

            <button
              disabled={!isCheckoutReady}
              onClick={handleCheckout}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Processing Sale...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {receipt && (
        <Modal title="Sale Receipt" onClose={() => setReceipt(null)} width="max-w-xl">
          <div className="space-y-5">
            <div className="printable-receipt mx-auto w-full max-w-[360px] rounded-xl border border-gray-300 bg-white px-4 py-5 font-mono text-[12px] leading-5 text-black shadow-sm print:border-black print:shadow-none">
              <div className="text-center">
                <div className="text-[20px] font-bold tracking-tight">PharmaCare Pharmacy</div>
                <div className="mt-1 text-[11px]">Hospital Pharmacy Management System</div>
                <div className="text-[11px]">Official Sales Receipt</div>
              </div>

              <div className="my-3 border-t border-dashed border-black" />

              <div className="flex justify-between gap-3">
                <span>Invoice No.</span>
                <span>{receipt.sale.invoice_no}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Date / Time</span>
                <span className="text-right">{receiptDate}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Customer</span>
                <span className="text-right">{receipt.sale.customer_name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Cashier</span>
                <span className="text-right">{user?.full_name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Payment</span>
                <span className="text-right capitalize">{receipt.sale.payment_method}</span>
              </div>

              <div className="my-3 border-t border-dashed border-black" />

              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[11px] font-bold uppercase">
                <div>Item Name</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total</div>
              </div>

              <div className="my-2 border-t border-dashed border-black" />

              <div className="space-y-1">
                {receipt.items.map((item) => (
                  <div key={item.sale_item_id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                    <div className="pr-1">{item.medicine_name}</div>
                    <div className="text-right">{item.quantity}</div>
                    <div className="text-right">{toNumber(item.unit_price).toFixed(2)}</div>
                    <div className="text-right">{toNumber(item.line_total).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="my-3 border-t border-dashed border-black" />

              <div className="flex justify-between gap-3">
                <span>Total Items</span>
                <span>{receipt.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Gross Total</span>
                <span>{money(receipt.sale.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Discount</span>
                <span>{money(receipt.sale.discount_amount)}</span>
              </div>
              <div className="flex justify-between gap-3 font-bold text-[13px]">
                <span>Net Total</span>
                <span>{money(receipt.sale.total_amount)}</span>
              </div>

              <div className="my-3 border-t border-dashed border-black" />

              <div className="text-center text-[11px] leading-4">
                <div>Thank You For Visiting PharmaCare</div>
                <div>Items once sold are not returnable</div>
                <div>Computer Software developed by Humza</div>
              </div>
            </div>

            <div className="no-print flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setReceipt(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#252240] hover:bg-gray-200 dark:hover:bg-[#2D2B45] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors inline-flex items-center gap-2"
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#5B21B6] transition-colors inline-flex items-center gap-2"
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
