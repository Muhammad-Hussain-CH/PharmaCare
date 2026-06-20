// routes/sales.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

function buildInvoiceNo(saleId) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `INV-${stamp}-${saleId}`;
}

function buildTemporaryInvoiceNo() {
  return `TMP-${crypto.randomBytes(6).toString('hex')}`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidPaymentMethod(value) {
  return ['cash', 'card', 'mobile'].includes(value);
}

function isValidPaymentStatus(value) {
  return ['paid', 'pending', 'partial', 'refunded'].includes(value);
}

function buildSalesFilters(req, alias = 's', includeCashier = true) {
  const conditions = [];
  const params = [];
  const { from, to, search } = req.query;

  if (from) {
    conditions.push(`${alias}.created_at >= ?`);
    params.push(`${from} 00:00:00`);
  }

  if (to) {
    conditions.push(`${alias}.created_at <= ?`);
    params.push(`${to} 23:59:59`);
  }

  if (search) {
    conditions.push(`(
      ${alias}.invoice_no LIKE ?
      OR ${alias}.customer_name LIKE ?
      OR ${alias}.customer_phone LIKE ?
      ${includeCashier ? 'OR u.full_name LIKE ?' : ''}
    )`);
    const term = `%${search}%`;
    params.push(term, term, term);
    if (includeCashier) {
      params.push(term);
    }
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

// POST /api/sales — create a new sale and deduct stock
router.post('/', requireAuth, async (req, res) => {
  const {
    customer_name,
    customer_phone,
    payment_method = 'cash',
    payment_status = 'paid',
    discount_amount = 0,
    notes = '',
    items,
  } = req.body;

  if (!customer_name || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'customer_name and at least one item are required' });
  }

  if (!isValidPaymentMethod(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  if (!isValidPaymentStatus(payment_status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  const soldBy = req.user.user_id;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const normalizedItems = [];
    const seenMedicineIds = new Set();

    for (const item of items) {
      const medicineId = toNumber(item.medicine_id ?? item.medicineId);
      const quantity = toNumber(item.quantity ?? item.qty);

      if (!medicineId || !Number.isInteger(quantity) || quantity < 1) {
        await conn.rollback();
        return res.status(400).json({ error: 'Each item must include a valid medicine_id and quantity' });
      }

      if (seenMedicineIds.has(medicineId)) {
        await conn.rollback();
        return res.status(400).json({ error: 'Duplicate medicine selected in cart' });
      }
      seenMedicineIds.add(medicineId);

      const [[medicine]] = await conn.query(
        `SELECT m.medicine_id, m.name, m.unit_price, s.quantity AS stock_qty
         FROM medicines m
         JOIN stock s ON m.medicine_id = s.medicine_id
         WHERE m.medicine_id = ?
         FOR UPDATE`,
        [medicineId]
      );

      if (!medicine) {
        await conn.rollback();
        return res.status(404).json({ error: `Medicine not found: ${medicineId}` });
      }

      const [[statusRow]] = await conn.query(
        `SELECT
           m.expiry_date,
           s.low_stock_threshold
         FROM medicines m
         JOIN stock s ON m.medicine_id = s.medicine_id
         WHERE m.medicine_id = ?`,
        [medicineId]
      );

      if (statusRow?.expiry_date && new Date(statusRow.expiry_date) < new Date()) {
        await conn.rollback();
        return res.status(400).json({ error: `Cannot sell expired medicine: ${medicine.name}` });
      }

      if (medicine.stock_qty <= statusRow.low_stock_threshold) {
        await conn.rollback();
        return res.status(400).json({ error: `Cannot sell low-stock medicine: ${medicine.name}` });
      }

      if (medicine.stock_qty < quantity) {
        await conn.rollback();
        return res.status(400).json({
          error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock_qty}`,
        });
      }

      const unitPrice = toNumber(item.unit_price ?? medicine.unit_price);
      if (unitPrice <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Invalid price for ${medicine.name}` });
      }
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineTotal;

      normalizedItems.push({
        medicine_id: medicine.medicine_id,
        medicine_name: medicine.name,
        unit_price: unitPrice,
        quantity,
        line_total: lineTotal,
      });
    }

    const discount = toNumber(discount_amount);
    if (discount < 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Discount cannot be negative' });
    }

    if (discount > subtotal) {
      await conn.rollback();
      return res.status(400).json({ error: 'Discount cannot exceed subtotal' });
    }

    const totalAmount = Number(Math.max(subtotal - discount, 0).toFixed(2));
    const invoiceNo = buildTemporaryInvoiceNo();

    const [saleResult] = await conn.query(
      `INSERT INTO sales
        (invoice_no, customer_name, customer_phone, sold_by, subtotal, discount_amount, total_amount, payment_method, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNo,
        customer_name,
        customer_phone || null,
        soldBy,
        subtotal,
        discount,
        totalAmount,
        payment_method,
        payment_status,
        notes || null,
      ]
    );

    const saleId = saleResult.insertId;
    const finalInvoiceNo = buildInvoiceNo(saleId);

    await conn.query('UPDATE sales SET invoice_no = ? WHERE sale_id = ?', [finalInvoiceNo, saleId]);

    for (const item of normalizedItems) {
      await conn.query(
        `INSERT INTO sale_items
          (sale_id, medicine_id, medicine_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, item.medicine_id, item.medicine_name, item.unit_price, item.quantity, item.line_total]
      );

      await conn.query(
        'UPDATE stock SET quantity = quantity - ? WHERE medicine_id = ?',
        [item.quantity, item.medicine_id]
      );

      await conn.query(
        `INSERT INTO stock_transactions
          (medicine_id, type, quantity, reason, created_by)
         VALUES (?, 'OUT', ?, 'Medicine sold', ?)`,
        [item.medicine_id, item.quantity, soldBy]
      );
    }

    const [saleRows] = await conn.query(
      `SELECT sale_id, invoice_no, customer_name, customer_phone, sold_by, subtotal, discount_amount, total_amount,
              payment_method, payment_status, notes, created_at
       FROM sales
       WHERE sale_id = ?`,
      [saleId]
    );

    const [saleItemRows] = await conn.query(
      `SELECT sale_item_id, sale_id, medicine_id, medicine_name, unit_price, quantity, line_total, created_at
       FROM sale_items
       WHERE sale_id = ?
       ORDER BY sale_item_id ASC`,
      [saleId]
    );

    await conn.commit();
    return res.status(201).json({
      message: 'Sale created successfully',
      sale: saleRows[0],
      items: saleItemRows,
    });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/sales — list sales history
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, user_id } = req.user;
    const filters = buildSalesFilters(req, 's', true);
    const whereParts = [];
    const params = [];

    if (role === 'worker') {
      whereParts.push('s.sold_by = ?');
      params.push(user_id);
    }

    if (filters.whereClause) {
      whereParts.push(filters.whereClause.replace(/^WHERE\s+/i, ''));
      params.push(...filters.params);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT
         s.sale_id,
         s.invoice_no,
         s.customer_name,
         s.customer_phone,
         s.sold_by,
         u.full_name AS sold_by_name,
         s.subtotal,
         s.discount_amount,
         s.total_amount,
         s.payment_method,
         s.payment_status,
         s.notes,
         s.created_at,
         (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.sale_id) AS item_count
       FROM sales s
       JOIN users u ON s.sold_by = u.user_id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/summary — aggregated reporting data
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { role, user_id } = req.user;
    const { period = 'day' } = req.query;
    const groupBy = period === 'month' ? "DATE_FORMAT(s.created_at, '%Y-%m')" : 'DATE(s.created_at)';

    const filters = buildSalesFilters(req, 's', false);
    const whereParts = [];
    const params = [];

    if (role === 'worker') {
      whereParts.push('s.sold_by = ?');
      params.push(user_id);
    }

    if (filters.whereClause) {
      whereParts.push(filters.whereClause.replace(/^WHERE\s+/i, ''));
      params.push(...filters.params);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [[totals]] = await db.query(
      `SELECT
         COUNT(*) AS total_sales,
         COALESCE(SUM(s.total_amount), 0) AS total_revenue,
         COALESCE(SUM(s.discount_amount), 0) AS total_discount
       FROM sales s
       ${whereClause}`,
      params
    );

    const [[items]] = await db.query(
      `SELECT COALESCE(SUM(si.quantity), 0) AS total_items
       FROM sales s
       JOIN sale_items si ON s.sale_id = si.sale_id
       ${whereClause}`,
      params
    );

    const [periodRows] = await db.query(
      `SELECT
         ${groupBy} AS period_key,
         COUNT(*) AS sales_count,
         COALESCE(SUM(s.total_amount), 0) AS total_revenue,
         COALESCE(SUM(s.discount_amount), 0) AS total_discount,
         COALESCE(SUM((SELECT SUM(si.quantity) FROM sale_items si WHERE si.sale_id = s.sale_id)), 0) AS total_items
       FROM sales s
       ${whereClause}
       GROUP BY period_key
       ORDER BY period_key ASC`,
      params
    );

    const [topMedicines] = await db.query(
      `SELECT
         si.medicine_id,
         si.medicine_name,
         COALESCE(SUM(si.quantity), 0) AS quantity_sold,
         COALESCE(SUM(si.line_total), 0) AS revenue
       FROM sales s
       JOIN sale_items si ON s.sale_id = si.sale_id
       ${whereClause}
       GROUP BY si.medicine_id, si.medicine_name
       ORDER BY quantity_sold DESC, revenue DESC
       LIMIT 10`,
      params
    );

    res.json({
      period,
      totals: {
        total_sales: Number(totals.total_sales || 0),
        total_revenue: Number(totals.total_revenue || 0),
        total_discount: Number(totals.total_discount || 0),
        total_items: Number(items.total_items || 0),
        average_sale_value: Number(totals.total_sales ? (totals.total_revenue / totals.total_sales) : 0),
      },
      by_period: periodRows.map((row) => ({
        period: row.period_key,
        sales_count: Number(row.sales_count || 0),
        total_revenue: Number(row.total_revenue || 0),
        total_discount: Number(row.total_discount || 0),
        total_items: Number(row.total_items || 0),
      })),
      top_medicines: topMedicines.map((row) => ({
        medicine_id: Number(row.medicine_id),
        medicine_name: row.medicine_name,
        quantity_sold: Number(row.quantity_sold || 0),
        revenue: Number(row.revenue || 0),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/:id — sale details with items
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    if (!saleId) {
      return res.status(400).json({ error: 'Invalid sale id' });
    }

    const [saleRows] = await db.query(
      `SELECT
         s.sale_id,
         s.invoice_no,
         s.customer_name,
         s.customer_phone,
         s.sold_by,
         u.full_name AS sold_by_name,
         s.subtotal,
         s.discount_amount,
         s.total_amount,
         s.payment_method,
         s.payment_status,
         s.notes,
         s.created_at
       FROM sales s
       JOIN users u ON s.sold_by = u.user_id
       WHERE s.sale_id = ?`,
      [saleId]
    );

    if (!saleRows.length) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (req.user.role === 'worker' && saleRows[0].sold_by !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [itemRows] = await db.query(
      `SELECT sale_item_id, sale_id, medicine_id, medicine_name, unit_price, quantity, line_total, created_at
       FROM sale_items
       WHERE sale_id = ?
       ORDER BY sale_item_id ASC`,
      [saleId]
    );

    res.json({ sale: saleRows[0], items: itemRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
