// routes/medicines.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/medicines — all medicines with stock and status
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.medicine_id,
        m.name,
        m.dosage_form,
        m.strength,
        m.unit_price,
        m.expiry_date,
        m.batch_no,
        m.units_per_pack,
        c.name  AS category,
        mf.name AS manufacturer,
        sup.company_name AS supplier,
        sup.phone AS supplier_phone,
        s.quantity AS stock_qty,
        s.low_stock_threshold,
        CASE
          WHEN m.expiry_date < CURDATE()               THEN 'Expired'
          WHEN s.quantity = 0                           THEN 'Out of Stock'
          WHEN s.quantity < s.low_stock_threshold       THEN 'Low Stock'
          ELSE                                               'In Stock'
        END AS status
      FROM medicines m
      JOIN categories    c   ON m.category_id     = c.category_id
      JOIN manufacturers mf  ON m.manufacturer_id = mf.manufacturer_id
      JOIN suppliers     sup ON m.supplier_id     = sup.supplier_id
      JOIN stock         s   ON m.medicine_id     = s.medicine_id
      ORDER BY m.name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/:id — single medicine
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, c.name AS category, mf.name AS manufacturer,
             sup.company_name AS supplier, s.quantity, s.low_stock_threshold
      FROM medicines m
      JOIN categories    c   ON m.category_id     = c.category_id
      JOIN manufacturers mf  ON m.manufacturer_id = mf.manufacturer_id
      JOIN suppliers     sup ON m.supplier_id     = sup.supplier_id
      JOIN stock         s   ON m.medicine_id     = s.medicine_id
      WHERE m.medicine_id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Medicine not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/medicines — add new medicine
router.post('/', async (req, res) => {
  console.log('📥 Received POST /api/medicines body:', req.body);

  const {
  category_id,
  manufacturer_id,
  supplier_id,
  name,
  dosage_form,
  strength,
  unit_price,
  expiry_date,
  batch_no,
  description,
  stock_quantity,
  low_stock_threshold,
  units_per_pack
} = req.body;

  // Validate required fields
  if (!name || !unit_price || !expiry_date || !batch_no) {
    return res.status(400).json({
      error: 'Missing required fields: name, unit_price, expiry_date, batch_no'
    });
  }

  // Make sure IDs are valid numbers — default to 1 if missing
  const catId  = Number(category_id)     || 1;
  const mfrId  = Number(manufacturer_id) || 1;
  const supId  = Number(supplier_id)     || 1;
  const qty    = Number(stock_quantity)  || 0;
  const thresh = Number(low_stock_threshold) || 20;
  const packSize = Number(units_per_pack) || 1;

  console.log('🔢 Parsed IDs:', { catId, mfrId, supId, qty, thresh });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(`
  INSERT INTO medicines
    (category_id, manufacturer_id, supplier_id, name,
     dosage_form, strength, unit_price, expiry_date,
     batch_no, description, units_per_pack)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [catId, mfrId, supId, name, dosage_form || 'Tablet',
    strength || '', unit_price, expiry_date,
    batch_no, description || '', packSize]);

    const newMedicineId = result.insertId;
    console.log('✅ Medicine inserted with ID:', newMedicineId);

    await conn.query(`
      INSERT INTO stock (medicine_id, quantity, low_stock_threshold)
      VALUES (?, ?, ?)
    `, [newMedicineId, qty, thresh]);

    console.log('✅ Stock record inserted');

    await conn.commit();
    res.status(201).json({
      message: 'Medicine added successfully',
      medicine_id: newMedicineId
    });
  } catch (err) {
    await conn.rollback();
    console.error('❌ POST /api/medicines error:', err.message);
    console.error('❌ SQL State:', err.sqlState);
    console.error('❌ SQL Message:', err.sqlMessage);
    res.status(500).json({
      error: err.message,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState
    });
  } finally {
    conn.release();
  }
});

// PUT /api/medicines/:id — update medicine
router.put('/:id', async (req, res) => {
  const { name, dosage_form, strength, unit_price,
          expiry_date, batch_no, description, units_per_pack } = req.body;
  try {
    await db.query(`
      UPDATE medicines 
      SET name=?, dosage_form=?, strength=?, unit_price=?, 
          expiry_date=?, batch_no=?, description=?, units_per_pack=?
      WHERE medicine_id=?
    `, [name, dosage_form, strength, unit_price,
        expiry_date, batch_no, description,
        Number(units_per_pack) || 1,
        req.params.id]);

    res.json({ message: 'Medicine updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM medicines WHERE medicine_id = ?', 
      [req.params.id]
    );
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;