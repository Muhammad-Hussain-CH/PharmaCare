import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Printer, RefreshCw, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { getSaleById, getSales, getSalesSummary } from '../api/services';

type SaleRow = {
  sale_id: number;
  invoice_no: string;
  customer_name: string;
  customer_phone: string | null;
  sold_by: number;
  sold_by_name: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  item_count: number;
};

type SaleDetail = {
  sale: SaleRow;
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

type SalesSummary = {
  period: string;
  totals: {
    total_sales: number;
    total_revenue: number;
    total_discount: number;
    total_items: number;
    average_sale_value: number;
  };
  by_period: Array<{
    period: string;
    sales_count: number;
    total_revenue: number;
    total_discount: number;
    total_items: number;
  }>;
  top_medicines: Array<{
    medicine_id: number;
    medicine_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
};

function startOfMonth() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return `Rs.${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function paymentBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-violet-100 text-violet-700',
    refunded: 'bg-rose-100 text-rose-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export default function Reports() {
  const [fromDate, setFromDate] = useState(startOfMonth());
  const [toDate, setToDate] = useState(today());
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const queryParams = useMemo(() => ({
    from: fromDate,
    to: toDate,
    search: search.trim(),
  }), [fromDate, toDate, search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [salesRes, summaryRes] = await Promise.all([
          getSales(queryParams),
          getSalesSummary({ ...queryParams, period }),
        ]);
        setSales(salesRes.data);
        setSummary(summaryRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load sales report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [queryParams, period]);

  const exportCSV = () => {
    if (!sales.length) return;

    const rows = sales.map((sale) => ({
      Invoice: sale.invoice_no,
      Date: formatDateTime(sale.created_at),
      Customer: sale.customer_name,
      Phone: sale.customer_phone || '',
      Sold_By: sale.sold_by_name,
      Items: sale.item_count,
      Subtotal: sale.subtotal,
      Discount: sale.discount_amount,
      Total: sale.total_amount,
      Payment_Method: sale.payment_method,
      Payment_Status: sale.payment_status,
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((key) => {
        const value = String((row as Record<string, unknown>)[key] ?? '');
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const openSale = async (saleId: number) => {
    setDetailLoading(true);
    try {
      const res = await getSaleById(saleId);
      setSelectedSale(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load sale details');
    } finally {
      setDetailLoading(false);
    }
  };

  const totals = summary?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History & Reporting</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track revenue, review invoices, and drill into each sale.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252240]"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={exportCSV}
            disabled={!sales.length}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-sm hover:bg-[#6D28D9] disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Sales', totals?.total_sales ?? 0],
          ['Revenue', formatCurrency(totals?.total_revenue ?? 0)],
          ['Discounts', formatCurrency(totals?.total_discount ?? 0)],
          ['Avg Sale', formatCurrency(totals?.average_sale_value ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white dark:bg-[#1A1730] rounded-xl p-5 border border-transparent dark:border-[#2D2B45] shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1730] rounded-xl p-5 border border-transparent dark:border-[#2D2B45] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Group by</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'month')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240] text-sm text-gray-700 dark:text-gray-200"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] bg-white dark:bg-[#252240]">
              <Search size={16} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Invoice, customer, phone, or cashier"
                className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFromDate(startOfMonth());
              setToDate(today());
              setSearch('');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] text-sm text-gray-700 dark:text-gray-300"
          >
            <RefreshCw size={15} /> Reset
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F3FF] dark:bg-[#252240] text-sm text-[#7C3AED]"
          >
            Refresh View
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-[#1A1730] rounded-xl border border-transparent dark:border-[#2D2B45] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D2B45] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Sales History</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Latest invoices in the selected range</p>
            </div>
            {loading && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#1F1C35] text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Cashier</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {!loading && sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No sales found for the selected range.</td>
                  </tr>
                ) : sales.map((sale) => (
                  <tr key={sale.sale_id} className="border-t border-gray-100 dark:border-[#2D2B45] hover:bg-gray-50 dark:hover:bg-[#252240]">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{sale.invoice_no}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(sale.created_at)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sale.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sale.sold_by_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sale.item_count}</td>
                    <td className="px-4 py-3 font-semibold text-[#7C3AED]">{formatCurrency(sale.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${paymentBadge(sale.payment_status)}`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openSale(sale.sale_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D2B45] text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252240]"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1A1730] rounded-xl border border-transparent dark:border-[#2D2B45] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D2B45]">
              <h2 className="font-semibold text-gray-900 dark:text-white">Top Medicines</h2>
            </div>
            <div className="p-5 space-y-3">
              {summary?.top_medicines.length ? summary.top_medicines.map((item, index) => (
                <div key={item.medicine_id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{index + 1}. {item.medicine_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.quantity_sold} sold</div>
                  </div>
                  <div className="font-semibold text-[#7C3AED]">{formatCurrency(item.revenue)}</div>
                </div>
              )) : <div className="text-sm text-gray-400">No sales data yet.</div>}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1730] rounded-xl border border-transparent dark:border-[#2D2B45] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D2B45]">
              <h2 className="font-semibold text-gray-900 dark:text-white">Period Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1F1C35] text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-left">Sales</th>
                    <th className="px-4 py-3 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.by_period.length ? summary.by_period.map((row) => (
                    <tr key={row.period} className="border-t border-gray-100 dark:border-[#2D2B45]">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.period}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.sales_count}</td>
                      <td className="px-4 py-3 font-semibold text-[#7C3AED]">{formatCurrency(row.total_revenue)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No period summary available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedSale && (
        <Modal title={`Invoice ${selectedSale.sale.invoice_no}`} onClose={() => setSelectedSale(null)} width="max-w-3xl">
          {detailLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading sale details...</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Customer</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSale.sale.customer_name}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Sold By</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSale.sale.sold_by_name}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Date</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatDateTime(selectedSale.sale.created_at)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Payment</div>
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">{selectedSale.sale.payment_method} · {selectedSale.sale.payment_status}</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[#2D2B45]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#1F1C35] text-xs uppercase text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Medicine</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">Unit Price</th>
                      <th className="px-4 py-3 text-left">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item) => (
                      <tr key={item.sale_item_id} className="border-t border-gray-100 dark:border-[#2D2B45]">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.medicine_name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 font-semibold text-[#7C3AED]">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252240]">
                  <div className="text-gray-500 dark:text-gray-400">Subtotal</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSale.sale.subtotal)}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252240]">
                  <div className="text-gray-500 dark:text-gray-400">Discount</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSale.sale.discount_amount)}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252240]">
                  <div className="text-gray-500 dark:text-gray-400">Total</div>
                  <div className="font-semibold text-[#7C3AED]">{formatCurrency(selectedSale.sale.total_amount)}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252240]">
                  <div className="text-gray-500 dark:text-gray-400">Items</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSale.items.length}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2D2B45] text-sm text-gray-700 dark:text-gray-300"
                >
                  Print
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}