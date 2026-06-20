const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.get('/', (req, res) => {
  res.send('Pharmacare Backend is Running Successfully 🚀');
});

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://pharmacare.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// ── Routes ────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/medicines',  require('./routes/medicines'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/dispense',   require('./routes/dispense'));
app.use('/api/sales',      require('./routes/sales'));

// ── Health check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PharmaCare API is running',
    timestamp: new Date().toISOString()
  });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PharmaCare API running on http://localhost:${PORT}`);
});