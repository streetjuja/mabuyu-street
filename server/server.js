const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

const ADMIN_PASSWORD = 'mabuyu2026';
let lastOrderId = 0;

function sendNotification(message) {
  const { execSync } = require('child_process');
  try {
    execSync('curl -s -X POST https://ntfy.sh/mabuyustreet-orders -d "' + message + '"');
    console.log('Notification sent!');
  } catch(e) {
    console.log('Notification failed:', e.message);
  }
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const db = new sqlite3.Database(path.join(__dirname, 'mabuyu.db'), (err) => {
  if (err) console.error('DB Error:', err);
  else console.log('✅ Database connected');
});

db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    location TEXT,
    items TEXT,
    total INTEGER,
    datetime TEXT,
    delivered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`ALTER TABLE orders ADD COLUMN delivered INTEGER DEFAULT 0`, () => {});
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    rating INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: 'Wrong password' });
  }
});

app.post('/api/orders', (req, res) => {
  const { name, phone, location, items, total, datetime } = req.body;
  db.run(
    `INSERT INTO orders (name, phone, location, items, total, datetime) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, phone, location, JSON.stringify(items), total, datetime],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      lastOrderId = this.lastID;
      sendNotification('New order from ' + name + ' - Ksh ' + total);
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post('/api/reviews', (req, res) => {
  const { name, type, rating, message } = req.body;
  db.run(
    `INSERT INTO reviews (name, type, rating, message) VALUES (?, ?, ?, ?)`,
    [name, type, rating, message],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/orders', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(r => r.items = JSON.parse(r.items));
    res.json(rows);
  });
});

app.get('/api/reviews', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM reviews ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/latest-order', requireAdmin, (req, res) => {
  res.json({ lastOrderId });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Mabuyu Street server running on port ' + PORT);
app.patch('/api/orders/:id/delivered', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { delivered } = req.body;
  db.run(`UPDATE orders SET delivered = ? WHERE id = ?`, [delivered ? 1 : 0, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});
});
