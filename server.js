/* ============================================================
   NurtureFlow — Backend Server
   Express + sql.js (SQLite pur JavaScript)
   ============================================================ */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'nurtureflow.db');

let db;

// ── Helper: save DB to file ──
function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ── Helper: run query returning rows ──
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSQL(sql, params = []) {
  db.run(sql, params);
  saveDB();
  return { lastId: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0 };
}

// ── Start app ──
async function startServer() {
  const SQL = await initSqlJs();

  // Load or create database
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS couples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner1_name TEXT NOT NULL,
      partner1_email TEXT UNIQUE NOT NULL,
      partner1_age INTEGER,
      partner1_sex TEXT DEFAULT 'Femme',
      partner2_name TEXT DEFAULT '',
      partner2_email TEXT DEFAULT '',
      partner2_age INTEGER,
      partner2_sex TEXT DEFAULT 'Homme',
      marriage_duration TEXT DEFAULT '',
      baby_age TEXT DEFAULT '',
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (couple_id) REFERENCES couples(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      mood TEXT NOT NULL DEFAULT '😊',
      stress INTEGER DEFAULT 5,
      satisfaction_conjugale INTEGER DEFAULT 5,
      satisfaction_intime INTEGER DEFAULT 5,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (couple_id) REFERENCES couples(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      article_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (couple_id) REFERENCES couples(id),
      UNIQUE(couple_id, article_id)
    )
  `);

  // ── Créer le compte admin par défaut ──
  const adminExists = queryOne('SELECT id FROM couples WHERE partner1_email = ?', ['admin@nurtureflow.com']);
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin', 10);
    db.run(
      `INSERT INTO couples (partner1_name, partner1_email, partner1_age, partner1_sex,
                            partner2_name, partner2_age, partner2_sex,
                            marriage_duration, baby_age, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Camille', 'admin@nurtureflow.com', 29, 'Femme',
       'Lucas', 31, 'Homme', '3 ans', '4 mois', adminHash]
    );
    console.log('  👤  Compte admin créé : admin@nurtureflow.com / admin');
  }

  saveDB();

  // ── Middleware ──
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'nurtureflow-pfe-asma-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));

  // Static files
  app.use(express.static(__dirname, { extensions: ['html'] }));

  // Auth middleware
  function requireAuth(req, res, next) {
    if (!req.session.coupleId) return res.status(401).json({ error: 'Non authentifié' });
    next();
  }

  // ═══════════════════ AUTH ═══════════════════

  app.post('/api/auth/register', (req, res) => {
    try {
      const { partner1_name, partner1_email, partner1_age, partner1_sex,
              partner2_name, partner2_age, partner2_sex,
              marriage_duration, baby_age, password } = req.body;

      if (!partner1_name || !partner1_email || !password) {
        return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
      }
      if (password.length < 4) {
        return res.status(400).json({ error: 'Mot de passe trop court (min 4 caractères)' });
      }

      const existing = queryOne('SELECT id FROM couples WHERE partner1_email = ?', [partner1_email]);
      if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

      const hash = bcrypt.hashSync(password, 10);
      const { lastId } = runSQL(
        `INSERT INTO couples (partner1_name, partner1_email, partner1_age, partner1_sex,
                              partner2_name, partner2_age, partner2_sex,
                              marriage_duration, baby_age, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [partner1_name, partner1_email, partner1_age || 0, partner1_sex || 'Femme',
         partner2_name || '', partner2_age || 0, partner2_sex || 'Homme',
         marriage_duration || '', baby_age || '', hash]
      );

      req.session.coupleId = lastId;
      const couple = queryOne('SELECT * FROM couples WHERE id = ?', [lastId]);
      delete couple.password;
      res.status(201).json({ success: true, couple });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const couple = queryOne('SELECT * FROM couples WHERE partner1_email = ?', [email]);
      if (!couple) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      if (!bcrypt.compareSync(password, couple.password)) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

      req.session.coupleId = couple.id;
      delete couple.password;
      res.json({ success: true, couple });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session.coupleId) return res.json({ authenticated: false });
    const couple = queryOne('SELECT * FROM couples WHERE id = ?', [req.session.coupleId]);
    if (!couple) { req.session.destroy(() => {}); return res.json({ authenticated: false }); }
    delete couple.password;
    res.json({ authenticated: true, couple });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // ═══════════════════ PROFILE ═══════════════════

  app.get('/api/profile', requireAuth, (req, res) => {
    const couple = queryOne('SELECT * FROM couples WHERE id = ?', [req.session.coupleId]);
    if (!couple) return res.status(404).json({ error: 'Non trouvé' });
    delete couple.password;

    const evalCount = queryOne('SELECT COUNT(*) as c FROM evaluations WHERE couple_id = ?', [req.session.coupleId]).c;
    const dailyCount = queryOne('SELECT COUNT(*) as c FROM daily_entries WHERE couple_id = ?', [req.session.coupleId]).c;
    const bookmarkCount = queryOne('SELECT COUNT(*) as c FROM bookmarks WHERE couple_id = ?', [req.session.coupleId]).c;

    res.json({ couple, stats: { evaluations: evalCount, articles_read: bookmarkCount, streak: Math.max(dailyCount, 0) } });
  });

  app.put('/api/profile', requireAuth, (req, res) => {
    try {
      const b = req.body;
      const couple = queryOne('SELECT * FROM couples WHERE id = ?', [req.session.coupleId]);
      runSQL(
        `UPDATE couples SET partner1_name=?, partner1_age=?, partner1_sex=?,
         partner2_name=?, partner2_age=?, partner2_sex=?, marriage_duration=?, baby_age=?
         WHERE id=?`,
        [b.partner1_name || couple.partner1_name, b.partner1_age || couple.partner1_age,
         b.partner1_sex || couple.partner1_sex, b.partner2_name || couple.partner2_name,
         b.partner2_age || couple.partner2_age, b.partner2_sex || couple.partner2_sex,
         b.marriage_duration || couple.marriage_duration, b.baby_age || couple.baby_age,
         req.session.coupleId]
      );
      const updated = queryOne('SELECT * FROM couples WHERE id = ?', [req.session.coupleId]);
      delete updated.password;
      res.json({ success: true, couple: updated });
    } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
  });

  // ═══════════════════ EVALUATIONS ═══════════════════

  app.post('/api/evaluations', requireAuth, (req, res) => {
    try {
      const { type, answers, score } = req.body;
      if (!type || !answers || score === undefined) return res.status(400).json({ error: 'Données incomplètes' });
      const { lastId } = runSQL(
        'INSERT INTO evaluations (couple_id, type, answers, score) VALUES (?, ?, ?, ?)',
        [req.session.coupleId, type, JSON.stringify(answers), score]
      );
      res.status(201).json({ success: true, id: lastId, type, score });
    } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
  });

  app.get('/api/evaluations', requireAuth, (req, res) => {
    const evals = queryAll('SELECT * FROM evaluations WHERE couple_id = ? ORDER BY created_at DESC', [req.session.coupleId]);
    evals.forEach(e => { try { e.answers = JSON.parse(e.answers); } catch(x) {} });
    res.json({ evaluations: evals });
  });

  app.get('/api/evaluations/scores', requireAuth, (req, res) => {
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const scores = {};
    types.forEach(t => {
      const r = queryOne('SELECT score, created_at FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [req.session.coupleId, t]);
      scores[t] = r ? r.score : 0;
    });
    const filled = Object.values(scores).filter(s => s > 0);
    const global = filled.length > 0 ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length) : 0;
    let level = 'Faible';
    if (global >= 75) level = 'Excellent';
    else if (global >= 55) level = 'Bon';
    else if (global >= 35) level = 'Moyen';

    const totalEvals = queryOne('SELECT COUNT(*) as c FROM evaluations WHERE couple_id=?', [req.session.coupleId]).c;
    const latestEval = queryOne('SELECT type, score, created_at FROM evaluations WHERE couple_id=? ORDER BY created_at DESC LIMIT 1', [req.session.coupleId]);

    res.json({ scores, global, level, totalEvals, latestEval });
  });

  // ═══════════════════ DAILY ═══════════════════

  app.post('/api/daily', requireAuth, (req, res) => {
    try {
      const { mood, stress, satisfaction_conjugale, satisfaction_intime, notes } = req.body;
      const { lastId } = runSQL(
        'INSERT INTO daily_entries (couple_id, mood, stress, satisfaction_conjugale, satisfaction_intime, notes) VALUES (?,?,?,?,?,?)',
        [req.session.coupleId, mood || '😊', stress || 5, satisfaction_conjugale || 5, satisfaction_intime || 5, notes || '']
      );
      res.status(201).json({ success: true, id: lastId });
    } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
  });

  app.get('/api/daily', requireAuth, (req, res) => {
    const entries = queryAll(
      `SELECT *, DATE(created_at) as date_short,
       CASE CAST(strftime('%w', created_at) AS INTEGER)
         WHEN 0 THEN 'Dim' WHEN 1 THEN 'Lun' WHEN 2 THEN 'Mar'
         WHEN 3 THEN 'Mer' WHEN 4 THEN 'Jeu' WHEN 5 THEN 'Ven' WHEN 6 THEN 'Sam'
       END as day_name
       FROM daily_entries WHERE couple_id=? ORDER BY created_at DESC LIMIT 14`,
      [req.session.coupleId]
    );
    res.json({ entries });
  });

  // ═══════════════════ BOOKMARKS ═══════════════════

  app.post('/api/bookmarks', requireAuth, (req, res) => {
    try {
      runSQL('INSERT OR IGNORE INTO bookmarks (couple_id, article_id) VALUES (?,?)', [req.session.coupleId, req.body.article_id]);
      res.json({ success: true });
    } catch (err) { res.json({ success: true }); }
  });

  app.delete('/api/bookmarks/:id', requireAuth, (req, res) => {
    runSQL('DELETE FROM bookmarks WHERE couple_id=? AND article_id=?', [req.session.coupleId, req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/bookmarks', requireAuth, (req, res) => {
    const b = queryAll('SELECT article_id FROM bookmarks WHERE couple_id=?', [req.session.coupleId]);
    res.json({ bookmarks: b.map(x => x.article_id) });
  });

  // ═══════════════════ DASHBOARD ═══════════════════

  app.get('/api/dashboard', requireAuth, (req, res) => {
    const cid = req.session.coupleId;
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const scores = {};
    types.forEach(t => {
      const r = queryOne('SELECT score FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [cid, t]);
      scores[t] = r ? r.score : 0;
    });
    const filled = Object.values(scores).filter(s => s > 0);
    const globalScore = filled.length > 0 ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length) : 0;
    const totalEvals = queryOne('SELECT COUNT(*) as c FROM evaluations WHERE couple_id=?', [cid]).c;
    const latestEval = queryOne('SELECT type, score, created_at FROM evaluations WHERE couple_id=? ORDER BY created_at DESC LIMIT 1', [cid]);
    const completedTypes = types.filter(t => scores[t] > 0).length;
    const progress = Math.round((completedTypes / 3) * 100);

    res.json({ globalScore, scores, progress, totalEvals, completedTypes, latestEval });
  });

  // SPA fallback
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  // Start
  app.listen(PORT, () => {
    console.log(`\n  ✅  NurtureFlow Server démarré`);
    console.log(`  🌐  http://localhost:${PORT}`);
    console.log(`  📁  Base de données: ${DB_PATH}\n`);
  });
}

startServer().catch(err => {
  console.error('Erreur de démarrage:', err);
  process.exit(1);
});
