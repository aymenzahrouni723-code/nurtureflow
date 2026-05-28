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
  const result = db.exec("SELECT last_insert_rowid()");
  const lastId = result[0]?.values[0][0] || 0;
  saveDB();
  return { lastId };
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

  db.run(`
    CREATE TABLE IF NOT EXISTS plan_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      plan_duration INTEGER NOT NULL,
      activity_day INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (couple_id) REFERENCES couples(id),
      UNIQUE(couple_id, plan_duration, activity_day)
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
      if (!couple) return res.status(500).json({ error: 'Erreur lors de la cr\u00e9ation du compte' });
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

  // ═══════════════════ FORGOT PASSWORD ═══════════════════

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email requis' });

      const couple = queryOne('SELECT * FROM couples WHERE partner1_email = ?', [email]);
      if (!couple) return res.status(404).json({ error: 'Aucun compte trouvé avec cet email' });

      // Generate a new random password
      const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

      // Hash and update in DB
      const hash = bcrypt.hashSync(newPassword, 10);
      runSQL('UPDATE couples SET password = ? WHERE id = ?', [hash, couple.id]);

      // Send email via nodemailer
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'aymenzahrouni723@gmail.com',
          pass: 'ckmx vanb qghs vftp'
        }
      });

      const mailOptions = {
        from: '"NurtureFlow 🌸" <aymenzahrouni723@gmail.com>',
        to: email,
        subject: '🔐 NurtureFlow - Votre nouveau mot de passe',
        html: `
          <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#faf6f8;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#C44569;font-size:28px;margin:0;">NurtureFlow 🌸</h1>
              <p style="color:#666;font-size:14px;">من الحياة الزوجية إلى الأبوة</p>
            </div>
            <div style="background:white;padding:24px;border-radius:12px;border:1px solid #f0e0e5;">
              <h2 style="color:#333;font-size:18px;margin:0 0 16px;">مرحباً ${couple.partner1_name} 👋</h2>
              <p style="color:#555;line-height:1.6;">تم إعادة تعيين كلمة المرور الخاصة بك. إليك كلمة المرور الجديدة:</p>
              <div style="background:#C44569;color:white;padding:16px;border-radius:10px;text-align:center;font-size:22px;font-weight:bold;letter-spacing:2px;margin:16px 0;">
                ${newPassword}
              </div>
              <p style="color:#888;font-size:13px;line-height:1.5;">⚠️ ننصحك بتغيير كلمة المرور هذه بعد تسجيل الدخول.<br>إذا لم تطلبي إعادة التعيين، تجاهلي هذا البريد.</p>
            </div>
            <p style="text-align:center;color:#aaa;font-size:12px;margin-top:20px;">© 2026 NurtureFlow — صُمم بحب ❤️</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`  📧  Mot de passe envoyé à ${email}`);
      res.json({ success: true, message: 'Mot de passe envoyé par email' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email: ' + err.message });
    }
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

  // ═══════════════════ PLAN PERSONNALISÉ ═══════════════════

  const planTemplates = {
    fr: {
      7: { title: 'Plan Express \u2014 7 jours', description: 'Un programme intensif pour am\u00e9liorer rapidement votre quotidien de couple.',
        activities: [
          { day: 1, type: 'communication', title: 'Lettre d\'appr\u00e9ciation', desc: '\u00c9crivez chacun 3 choses que vous aimez chez votre partenaire.', icon: 'edit_note' },
          { day: 2, type: 'psychologique', title: 'M\u00e9ditation \u00e0 deux', desc: '10 minutes de respiration synchronis\u00e9e. Asseyez-vous face \u00e0 face.', icon: 'self_improvement' },
          { day: 3, type: 'couple', title: 'Soir\u00e9e sans \u00e9crans', desc: '\u00c9teignez tous les \u00e9crans apr\u00e8s 20h. Jouez, cuisinez ou discutez.', icon: 'devices_off' },
          { day: 4, type: 'post-partum', title: 'Massage relaxant', desc: 'Offrez-vous mutuellement un massage de 15 minutes.', icon: 'spa' },
          { day: 5, type: 'communication', title: 'Check-in \u00e9motionnel', desc: 'Comment te sens-tu vraiment ? \u00c9coutez sans juger.', icon: 'forum' },
          { day: 6, type: 'couple', title: 'Photo souvenir', desc: 'Regardez ensemble vos photos de couple et racontez vos souvenirs.', icon: 'photo_library' },
          { day: 7, type: 'psychologique', title: 'Bilan et gratitude', desc: 'Faites le bilan de la semaine. Qu\'avez-vous appris ?', icon: 'celebration' }
        ]},
      14: { title: 'Plan \u00c9quilibre \u2014 14 jours', description: 'Deux semaines pour renforcer les fondations de votre relation.',
        activities: [
          { day: 1, type: 'communication', title: 'Rituel du matin', desc: 'Dites une chose positive \u00e0 votre partenaire chaque matin.', icon: 'wb_sunny' },
          { day: 2, type: 'psychologique', title: 'Journal de gratitude', desc: '\u00c9crivez 3 moments de gratitude li\u00e9s \u00e0 votre famille.', icon: 'menu_book' },
          { day: 3, type: 'couple', title: 'Date \u00e0 la maison', desc: 'Pr\u00e9parez un d\u00eener sp\u00e9cial quand b\u00e9b\u00e9 dort.', icon: 'dinner_dining' },
          { day: 4, type: 'post-partum', title: 'Exercice de Kegel', desc: 'Pratiquez les exercices du p\u00e9rin\u00e9e. 3 s\u00e9ries de 10.', icon: 'fitness_center' },
          { day: 5, type: 'communication', title: '\u00c9coute active', desc: 'L\'un parle, l\'autre \u00e9coute 20 min sans interrompre.', icon: 'hearing' },
          { day: 6, type: 'psychologique', title: 'Promenade en famille', desc: 'Sortez marcher 30 min ensemble avec b\u00e9b\u00e9.', icon: 'directions_walk' },
          { day: 7, type: 'couple', title: 'C\u00e2lin de reconnexion', desc: 'Prenez-vous dans les bras 2 minutes sans rien dire.', icon: 'favorite' },
          { day: 8, type: 'communication', title: 'R\u00e9partition des t\u00e2ches', desc: 'Revisitez la r\u00e9partition des t\u00e2ches ensemble.', icon: 'checklist' },
          { day: 9, type: 'psychologique', title: 'Respiration guid\u00e9e', desc: '15 min de coh\u00e9rence cardiaque. Inspirez 5s, expirez 5s.', icon: 'air' },
          { day: 10, type: 'couple', title: 'Surprise attentionn\u00e9e', desc: 'Pr\u00e9parez une petite surprise pour votre partenaire.', icon: 'card_giftcard' },
          { day: 11, type: 'post-partum', title: 'Consultation sage-femme', desc: 'Planifiez un bilan post-partum avec votre sage-femme.', icon: 'medical_services' },
          { day: 12, type: 'communication', title: 'Projets futurs', desc: 'O\u00f9 vous voyez-vous dans 5 ans en famille ?', icon: 'rocket_launch' },
          { day: 13, type: 'psychologique', title: 'Temps personnel', desc: 'Accordez-vous chacun 2h de temps libre.', icon: 'person' },
          { day: 14, type: 'couple', title: 'C\u00e9l\u00e9bration', desc: 'C\u00e9l\u00e9brez ces 2 semaines de progr\u00e8s !', icon: 'celebration' }
        ]},
      30: { title: 'Plan Transformation \u2014 30 jours', description: 'Un mois complet pour transformer votre vie de couple.',
        activities: [
          { day: 1, type: 'communication', title: 'Contrat de bienveillance', desc: '\u00c9tablissez 5 r\u00e8gles de communication bienveillante.', icon: 'handshake' },
          { day: 2, type: 'psychologique', title: 'Scan corporel', desc: 'Allongez-vous 10 min. Rel\u00e2chez les tensions.', icon: 'accessibility_new' },
          { day: 3, type: 'couple', title: 'Album de famille', desc: 'Commencez un album photo de votre famille.', icon: 'photo_album' },
          { day: 5, type: 'communication', title: 'Langage d\'amour', desc: 'Paroles, service, cadeaux, toucher ou temps ?', icon: 'translate' },
          { day: 7, type: 'couple', title: 'Rendez-vous hebdo', desc: 'M\u00eame 30 min comptent pour un rendez-vous couple.', icon: 'event' },
          { day: 10, type: 'psychologique', title: 'Gestion du stress', desc: 'Identifiez 3 sources de stress et trouvez des solutions.', icon: 'psychology' },
          { day: 12, type: 'post-partum', title: 'Yoga postnatal', desc: '20 minutes de yoga postnatal suffisent.', icon: 'self_improvement' },
          { day: 14, type: 'couple', title: 'Bilan mi-parcours', desc: 'Qu\'est-ce qui fonctionne ? Que faut-il ajuster ?', icon: 'assessment' },
          { day: 16, type: 'communication', title: 'Lettre \u00e0 b\u00e9b\u00e9', desc: '\u00c9crivez une lettre \u00e0 votre enfant.', icon: 'mail' },
          { day: 18, type: 'psychologique', title: 'R\u00e9seau de soutien', desc: 'Contactez un ami ou un membre de la famille.', icon: 'group' },
          { day: 20, type: 'couple', title: 'Playlist du couple', desc: 'Cr\u00e9ez une playlist de vos chansons pr\u00e9f\u00e9r\u00e9es.', icon: 'music_note' },
          { day: 22, type: 'post-partum', title: 'Reprise sportive', desc: 'Marche rapide, natation ou pilates.', icon: 'pool' },
          { day: 25, type: 'communication', title: 'R\u00e9solution de conflits', desc: 'Technique DESC : D\u00e9crire, Exprimer, Sp\u00e9cifier, Cons\u00e9quences.', icon: 'balance' },
          { day: 27, type: 'psychologique', title: 'Vision board', desc: 'Cr\u00e9ez un tableau de vision pour votre famille.', icon: 'dashboard' },
          { day: 30, type: 'couple', title: 'Renouvellement des v\u0153ux', desc: 'Que promettez-vous pour l\'avenir ?', icon: 'volunteer_activism' }
        ]}
    },
    ar: {
      7: { title: '\u062e\u0637\u0629 \u0633\u0631\u064a\u0639\u0629 \u2014 7 \u0623\u064a\u0627\u0645', description: '\u0628\u0631\u0646\u0627\u0645\u062c \u0645\u0643\u062b\u0641 \u0644\u062a\u062d\u0633\u064a\u0646 \u062d\u064a\u0627\u062a\u0643\u0645\u0627 \u0627\u0644\u0632\u0648\u062c\u064a\u0629 \u0628\u0633\u0631\u0639\u0629.',
        activities: [
          { day: 1, type: 'communication', title: '\u0631\u0633\u0627\u0644\u0629 \u062a\u0642\u062f\u064a\u0631', desc: '\u0627\u0643\u062a\u0628\u0627 \u0643\u0644 \u0648\u0627\u062d\u062f 3 \u0623\u0634\u064a\u0627\u0621 \u064a\u062d\u0628\u0647\u0627 \u0641\u064a \u0634\u0631\u064a\u0643\u0647. \u0634\u0627\u0631\u0643\u0627\u0647\u0627 \u0627\u0644\u0645\u0633\u0627\u0621.', icon: 'edit_note' },
          { day: 2, type: 'psychologique', title: '\u062a\u0623\u0645\u0644 \u0645\u0634\u062a\u0631\u0643', desc: '10 \u062f\u0642\u0627\u0626\u0642 \u062a\u0646\u0641\u0633 \u0645\u062a\u0632\u0627\u0645\u0646. \u0627\u062c\u0644\u0633\u0627 \u0648\u062c\u0647\u0627\u064b \u0644\u0648\u062c\u0647.', icon: 'self_improvement' },
          { day: 3, type: 'couple', title: '\u0633\u0647\u0631\u0629 \u0628\u062f\u0648\u0646 \u0634\u0627\u0634\u0627\u062a', desc: '\u0623\u0637\u0641\u0626\u0627 \u0627\u0644\u0634\u0627\u0634\u0627\u062a \u0628\u0639\u062f 8 \u0645\u0633\u0627\u0621\u064b. \u0627\u0644\u0639\u0628\u0627 \u0623\u0648 \u0627\u0637\u0628\u062e\u0627 \u0645\u0639\u0627\u064b.', icon: 'devices_off' },
          { day: 4, type: 'post-partum', title: '\u062a\u062f\u0644\u064a\u0643 \u0627\u0633\u062a\u0631\u062e\u0627\u0626\u064a', desc: '\u0642\u062f\u0645\u0627 \u0644\u0628\u0639\u0636\u0643\u0645\u0627 \u062a\u062f\u0644\u064a\u0643\u0627\u064b 15 \u062f\u0642\u064a\u0642\u0629.', icon: 'spa' },
          { day: 5, type: 'communication', title: '\u0645\u0631\u0627\u062c\u0639\u0629 \u0639\u0627\u0637\u0641\u064a\u0629', desc: '\u0643\u064a\u0641 \u062a\u0634\u0639\u0631\u064a\u0646 \u062d\u0642\u0627\u064b\u061f \u0627\u0633\u062a\u0645\u0639\u0627 \u062f\u0648\u0646 \u062d\u0643\u0645.', icon: 'forum' },
          { day: 6, type: 'couple', title: '\u0635\u0648\u0631 \u0630\u0643\u0631\u064a\u0627\u062a', desc: '\u0634\u0627\u0647\u062f\u0627 \u0635\u0648\u0631\u0643\u0645\u0627 \u0648\u0627\u0631\u0648\u064a\u0627 \u0630\u0643\u0631\u064a\u0627\u062a\u0643\u0645\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629.', icon: 'photo_library' },
          { day: 7, type: 'psychologique', title: '\u062a\u0642\u064a\u064a\u0645 \u0648\u0627\u0645\u062a\u0646\u0627\u0646', desc: '\u0642\u064a\u0645\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639. \u0645\u0627\u0630\u0627 \u062a\u0639\u0644\u0645\u062a\u0645\u0627\u061f', icon: 'celebration' }
        ]},
      14: { title: '\u062e\u0637\u0629 \u0627\u0644\u062a\u0648\u0627\u0632\u0646 \u2014 14 \u064a\u0648\u0645', description: '\u0623\u0633\u0628\u0648\u0639\u0627\u0646 \u0644\u062a\u0639\u0632\u064a\u0632 \u0623\u0633\u0633 \u0639\u0644\u0627\u0642\u062a\u0643\u0645\u0627 \u0627\u0644\u0623\u0628\u0648\u064a\u0629.',
        activities: [
          { day: 1, type: 'communication', title: '\u0637\u0642\u0633 \u0627\u0644\u0635\u0628\u0627\u062d', desc: '\u0643\u0644 \u0635\u0628\u0627\u062d \u0642\u0648\u0644\u0627 \u0634\u064a\u0626\u0627\u064b \u0625\u064a\u062c\u0627\u0628\u064a\u0627\u064b \u0644\u0634\u0631\u064a\u0643\u0643\u0645\u0627.', icon: 'wb_sunny' },
          { day: 2, type: 'psychologique', title: '\u064a\u0648\u0645\u064a\u0627\u062a \u0627\u0644\u0627\u0645\u062a\u0646\u0627\u0646', desc: '\u0627\u0643\u062a\u0628\u0627 3 \u0644\u062d\u0638\u0627\u062a \u0627\u0645\u062a\u0646\u0627\u0646 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0639\u0627\u0626\u0644\u062a\u0643\u0645\u0627.', icon: 'menu_book' },
          { day: 3, type: 'couple', title: '\u0645\u0648\u0639\u062f \u0641\u064a \u0627\u0644\u0628\u064a\u062a', desc: '\u062d\u0636\u0631\u0627 \u0639\u0634\u0627\u0621\u064b \u062e\u0627\u0635\u0627\u064b \u0639\u0646\u062f\u0645\u0627 \u064a\u0646\u0627\u0645 \u0627\u0644\u0637\u0641\u0644.', icon: 'dinner_dining' },
          { day: 4, type: 'post-partum', title: '\u062a\u0645\u0627\u0631\u064a\u0646 \u0643\u064a\u062c\u0644', desc: '\u0645\u0627\u0631\u0633\u0627 \u062a\u0645\u0627\u0631\u064a\u0646 \u0642\u0627\u0639 \u0627\u0644\u062d\u0648\u0636. 3 \u0645\u062c\u0645\u0648\u0639\u0627\u062a \u0645\u0646 10.', icon: 'fitness_center' },
          { day: 5, type: 'communication', title: '\u0627\u0644\u0627\u0633\u062a\u0645\u0627\u0639 \u0627\u0644\u0641\u0639\u0627\u0644', desc: '\u0648\u0627\u062d\u062f \u064a\u062a\u0643\u0644\u0645 \u0648\u0627\u0644\u0622\u062e\u0631 \u064a\u0633\u062a\u0645\u0639 20 \u062f\u0642\u064a\u0642\u0629. \u062b\u0645 \u0628\u062f\u0644\u0627.', icon: 'hearing' },
          { day: 6, type: 'psychologique', title: '\u0646\u0632\u0647\u0629 \u0639\u0627\u0626\u0644\u064a\u0629', desc: '\u0627\u0645\u0634\u064a\u0627 30 \u062f\u0642\u064a\u0642\u0629 \u0645\u0639 \u0627\u0644\u0637\u0641\u0644 \u0641\u064a \u0627\u0644\u0647\u0648\u0627\u0621 \u0627\u0644\u0637\u0644\u0642.', icon: 'directions_walk' },
          { day: 7, type: 'couple', title: '\u0639\u0646\u0627\u0642 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0648\u0627\u0635\u0644', desc: '\u0627\u062d\u062a\u0636\u0646\u0627 \u0628\u0639\u0636\u0643\u0645\u0627 \u062f\u0642\u064a\u0642\u062a\u064a\u0646 \u062f\u0648\u0646 \u0643\u0644\u0627\u0645.', icon: 'favorite' },
          { day: 8, type: 'communication', title: '\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u0647\u0627\u0645', desc: '\u0631\u0627\u062c\u0639\u0627 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629 \u0628\u062a\u0648\u0627\u0632\u0646.', icon: 'checklist' },
          { day: 9, type: 'psychologique', title: '\u062a\u0646\u0641\u0633 \u0645\u0648\u062c\u0647', desc: '15 \u062f\u0642\u064a\u0642\u0629 \u062a\u0645\u0627\u0633\u0643 \u0642\u0644\u0628\u064a. \u0634\u0647\u064a\u0642 5\u062b \u0632\u0641\u064a\u0631 5\u062b.', icon: 'air' },
          { day: 10, type: 'couple', title: '\u0645\u0641\u0627\u062c\u0623\u0629 \u0644\u0637\u064a\u0641\u0629', desc: '\u062d\u0636\u0631\u0627 \u0645\u0641\u0627\u062c\u0623\u0629 \u0635\u063a\u064a\u0631\u0629 \u0644\u0634\u0631\u064a\u0643\u0643\u0645\u0627.', icon: 'card_giftcard' },
          { day: 11, type: 'post-partum', title: '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0628\u0644\u0629', desc: '\u062e\u0637\u0637\u0627 \u0644\u0645\u0648\u0639\u062f \u062a\u0642\u064a\u064a\u0645 \u0645\u0627 \u0628\u0639\u062f \u0627\u0644\u0648\u0644\u0627\u062f\u0629.', icon: 'medical_services' },
          { day: 12, type: 'communication', title: '\u0645\u0634\u0627\u0631\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644', desc: '\u0623\u064a\u0646 \u062a\u0631\u064a\u0627\u0646 \u0623\u0646\u0641\u0633\u0643\u0645\u0627 \u0628\u0639\u062f 5 \u0633\u0646\u0648\u0627\u062a\u061f', icon: 'rocket_launch' },
          { day: 13, type: 'psychologique', title: '\u0648\u0642\u062a \u0634\u062e\u0635\u064a', desc: '\u0627\u0645\u0646\u062d\u0627 \u0623\u0646\u0641\u0633\u0643\u0645\u0627 \u0633\u0627\u0639\u062a\u064a\u0646 \u0645\u0646 \u0627\u0644\u0631\u0627\u062d\u0629.', icon: 'person' },
          { day: 14, type: 'couple', title: '\u0627\u062d\u062a\u0641\u0627\u0644', desc: '\u0627\u062d\u062a\u0641\u0644\u0627 \u0628\u0623\u0633\u0628\u0648\u0639\u064a\u0646 \u0645\u0646 \u0627\u0644\u062a\u0642\u062f\u0645!', icon: 'celebration' }
        ]},
      30: { title: '\u062e\u0637\u0629 \u0627\u0644\u062a\u062d\u0648\u0644 \u2014 30 \u064a\u0648\u0645', description: '\u0634\u0647\u0631 \u0643\u0627\u0645\u0644 \u0644\u062a\u063a\u064a\u064a\u0631 \u062d\u064a\u0627\u062a\u0643\u0645\u0627 \u0643\u0632\u0648\u062c\u064a\u0646 \u0648\u0639\u0627\u0626\u0644\u0629.',
        activities: [
          { day: 1, type: 'communication', title: '\u0639\u0642\u062f \u0627\u0644\u0644\u0637\u0641', desc: '\u0636\u0639\u0627 5 \u0642\u0648\u0627\u0639\u062f \u0644\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0644\u0637\u064a\u0641.', icon: 'handshake' },
          { day: 2, type: 'psychologique', title: '\u0641\u062d\u0635 \u0627\u0644\u062c\u0633\u062f', desc: '\u0627\u0633\u062a\u0644\u0642\u064a\u0627 10 \u062f\u0642\u0627\u0626\u0642 \u0648\u0623\u0631\u062e\u064a\u0627 \u0627\u0644\u062a\u0648\u062a\u0631\u0627\u062a.', icon: 'accessibility_new' },
          { day: 3, type: 'couple', title: '\u0623\u0644\u0628\u0648\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629', desc: '\u0627\u0628\u062f\u0622 \u0623\u0644\u0628\u0648\u0645 \u0635\u0648\u0631 \u0644\u0639\u0627\u0626\u0644\u062a\u0643\u0645\u0627.', icon: 'photo_album' },
          { day: 5, type: 'communication', title: '\u0644\u063a\u0629 \u0627\u0644\u062d\u0628', desc: '\u0643\u0644\u0645\u0627\u062a\u060c \u062e\u062f\u0645\u0629\u060c \u0647\u062f\u0627\u064a\u0627\u060c \u0644\u0645\u0633 \u0623\u0648 \u0648\u0642\u062a\u061f', icon: 'translate' },
          { day: 7, type: 'couple', title: '\u0645\u0648\u0639\u062f \u0623\u0633\u0628\u0648\u0639\u064a', desc: '\u062d\u062a\u0649 30 \u062f\u0642\u064a\u0642\u0629 \u062a\u0643\u0641\u064a \u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0632\u0648\u062c\u064a\u0646.', icon: 'event' },
          { day: 10, type: 'psychologique', title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u0648\u062a\u0631', desc: '\u062d\u062f\u062f\u0627 3 \u0645\u0635\u0627\u062f\u0631 \u062a\u0648\u062a\u0631 \u0648\u062c\u062f\u0627 \u062d\u0644\u0648\u0644\u0627\u064b.', icon: 'psychology' },
          { day: 12, type: 'post-partum', title: '\u064a\u0648\u063a\u0627 \u0628\u0639\u062f \u0627\u0644\u0648\u0644\u0627\u062f\u0629', desc: '20 \u062f\u0642\u064a\u0642\u0629 \u064a\u0648\u063a\u0627 \u0628\u0639\u062f \u0627\u0644\u0648\u0644\u0627\u062f\u0629 \u062a\u0643\u0641\u064a.', icon: 'self_improvement' },
          { day: 14, type: 'couple', title: '\u062a\u0642\u064a\u064a\u0645 \u0645\u0646\u062a\u0635\u0641 \u0627\u0644\u0645\u0633\u0627\u0631', desc: '\u0645\u0627 \u0627\u0644\u0630\u064a \u064a\u0646\u062c\u062d\u061f \u0645\u0627 \u064a\u062d\u062a\u0627\u062c \u062a\u0639\u062f\u064a\u0644\u061f', icon: 'assessment' },
          { day: 16, type: 'communication', title: '\u0631\u0633\u0627\u0644\u0629 \u0644\u0644\u0637\u0641\u0644', desc: '\u0627\u0643\u062a\u0628\u0627 \u0631\u0633\u0627\u0644\u0629 \u0644\u0637\u0641\u0644\u0643\u0645\u0627.', icon: 'mail' },
          { day: 18, type: 'psychologique', title: '\u0634\u0628\u0643\u0629 \u0627\u0644\u062f\u0639\u0645', desc: '\u062a\u0648\u0627\u0635\u0644\u0627 \u0645\u0639 \u0635\u062f\u064a\u0642 \u0623\u0648 \u0641\u0631\u062f \u0645\u0646 \u0627\u0644\u0639\u0627\u0626\u0644\u0629.', icon: 'group' },
          { day: 20, type: 'couple', title: '\u0642\u0627\u0626\u0645\u0629 \u0623\u063a\u0627\u0646\u064a', desc: '\u0623\u0646\u0634\u0626\u0627 \u0642\u0627\u0626\u0645\u0629 \u0623\u063a\u0627\u0646\u064a\u0643\u0645\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629.', icon: 'music_note' },
          { day: 22, type: 'post-partum', title: '\u0627\u0633\u062a\u0626\u0646\u0627\u0641 \u0627\u0644\u0631\u064a\u0627\u0636\u0629', desc: '\u0645\u0634\u064a \u0633\u0631\u064a\u0639\u060c \u0633\u0628\u0627\u062d\u0629 \u0623\u0648 \u0628\u064a\u0644\u0627\u062a\u0633.', icon: 'pool' },
          { day: 25, type: 'communication', title: '\u062d\u0644 \u0627\u0644\u0646\u0632\u0627\u0639\u0627\u062a', desc: '\u062a\u0642\u0646\u064a\u0629 DESC: \u0648\u0635\u0641\u060c \u062a\u0639\u0628\u064a\u0631\u060c \u062a\u062d\u062f\u064a\u062f\u060c \u0646\u062a\u0627\u0626\u062c.', icon: 'balance' },
          { day: 27, type: 'psychologique', title: '\u0644\u0648\u062d\u0629 \u0627\u0644\u0631\u0624\u064a\u0629', desc: '\u0623\u0646\u0634\u0626\u0627 \u0644\u0648\u062d\u0629 \u0631\u0624\u064a\u0629 \u0644\u0639\u0627\u0626\u0644\u062a\u0643\u0645\u0627.', icon: 'dashboard' },
          { day: 30, type: 'couple', title: '\u062a\u062c\u062f\u064a\u062f \u0627\u0644\u0639\u0647\u0648\u062f', desc: '\u0645\u0627\u0630\u0627 \u062a\u0639\u062f\u0627\u0646 \u0644\u0644\u0645\u0633\u062a\u0642\u0628\u0644\u061f', icon: 'volunteer_activism' }
        ]}
    }
  };

  app.get('/api/plan/:duration', requireAuth, (req, res) => {
    try {
      const duration = parseInt(req.params.duration);
      if (![7, 14, 30].includes(duration)) return res.status(400).json({ error: 'Dur\u00e9e invalide' });

      const lang = req.query.lang || 'fr';
      const templates = planTemplates[lang] || planTemplates.fr;
      const plan = templates[duration];

      // Get scores to personalize recommendations
      const types = ['psychologique', 'conjugal', 'sexuel'];
      const scores = {};
      types.forEach(t => {
        try {
          const r = queryOne('SELECT score FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [req.session.coupleId, t]);
          scores[t] = r ? r.score : 0;
        } catch(e) { scores[t] = 0; }
      });

      // Determine focus areas
      const focusAreas = [];
      if (scores.psychologique > 0 && scores.psychologique < 50) focusAreas.push('psychologique');
      if (scores.conjugal > 0 && scores.conjugal < 50) focusAreas.push('communication');
      if (scores.sexuel > 0 && scores.sexuel < 50) focusAreas.push('post-partum');

      // Check completed activities
      let completedDays = [];
      try {
        const completed = queryAll(
          'SELECT activity_day, plan_duration FROM plan_progress WHERE couple_id=? AND plan_duration=?',
          [req.session.coupleId, duration]
        );
        completedDays = completed.map(c => c.activity_day);
      } catch(e) { completedDays = []; }

      res.json({ plan, scores, focusAreas, completedDays });
    } catch(e) {
      console.error('Plan error:', e.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/plan/complete', requireAuth, (req, res) => {
    const { duration, day } = req.body;
    try {
      runSQL(
        'INSERT OR IGNORE INTO plan_progress (couple_id, plan_duration, activity_day) VALUES (?,?,?)',
        [req.session.coupleId, duration, day]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
  });

  // ═══════════════════ COUPLE CHECK-UP ═══════════════════

  app.get('/api/checkup', requireAuth, (req, res) => {
    const cid = req.session.coupleId;
    const couple = queryOne('SELECT * FROM couples WHERE id=?', [cid]);
    delete couple.password;

    // Get all evaluations grouped by type, ordered by date
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const evolution = {};
    types.forEach(t => {
      evolution[t] = queryAll(
        'SELECT score, created_at FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at ASC',
        [cid, t]
      );
    });

    // Current scores
    const currentScores = {};
    types.forEach(t => {
      const r = queryOne('SELECT score FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [cid, t]);
      currentScores[t] = r ? r.score : 0;
    });

    // Previous month scores (if available)
    const previousScores = {};
    types.forEach(t => {
      const r = queryOne(
        "SELECT score FROM evaluations WHERE couple_id=? AND type=? AND created_at < datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 1",
        [cid, t]
      );
      previousScores[t] = r ? r.score : null;
    });

    // Daily entries evolution (last 30 days)
    const dailyEvolution = queryAll(
      "SELECT mood, stress, satisfaction_conjugale, satisfaction_intime, DATE(created_at) as date_short, created_at FROM daily_entries WHERE couple_id=? AND created_at >= datetime('now', '-30 days') ORDER BY created_at ASC",
      [cid]
    );

    // Calculate trends
    const trends = {};
    types.forEach(t => {
      if (previousScores[t] !== null && currentScores[t] > 0) {
        const diff = currentScores[t] - previousScores[t];
        trends[t] = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      } else {
        trends[t] = 'new';
      }
    });

    const filled = Object.values(currentScores).filter(s => s > 0);
    const globalScore = filled.length > 0 ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length) : 0;

    // Recommendations
    const recommendations = [];
    if (currentScores.psychologique > 0 && currentScores.psychologique < 40) {
      recommendations.push({ icon: 'psychology', text: 'Consultez un psychologue spécialisé en périnatalité', priority: 'high' });
    }
    if (currentScores.conjugal > 0 && currentScores.conjugal < 40) {
      recommendations.push({ icon: 'group', text: 'Envisagez une thérapie de couple', priority: 'high' });
    }
    if (currentScores.sexuel > 0 && currentScores.sexuel < 40) {
      recommendations.push({ icon: 'medical_services', text: 'Consultez une sage-femme ou un sexologue', priority: 'high' });
    }
    if (globalScore >= 40 && globalScore < 70) {
      recommendations.push({ icon: 'self_improvement', text: 'Essayez le plan personnalisé de 14 jours', priority: 'medium' });
    }
    if (globalScore >= 70) {
      recommendations.push({ icon: 'celebration', text: 'Continuez sur cette belle lancée !', priority: 'low' });
    }

    res.json({
      couple,
      currentScores,
      previousScores,
      trends,
      globalScore,
      evolution,
      dailyEvolution,
      recommendations,
      generatedAt: new Date().toISOString()
    });
  });

  const timelineContent = {
    fr: {
      '0-3': [
        { id: 't1', title: 'Les premiers jours', category: 'sant\u00e9 mentale', icon: 'child_care', readTime: 8, content: 'Les premiers jours apr\u00e8s l\'accouchement sont un tourbillon d\'\u00e9motions. Le baby blues touche 50 \u00e0 80% des femmes.' },
        { id: 't2', title: 'Allaitement : les bases', category: 'allaitement', icon: 'breastfeeding', readTime: 10, content: 'L\'allaitement s\'installe progressivement. Le colostrum nourrit b\u00e9b\u00e9 les 48 premi\u00e8res heures.' },
        { id: 't3', title: 'R\u00e9cup\u00e9ration physique', category: 'vie de couple', icon: 'healing', readTime: 7, content: 'Votre corps a besoin de temps. Les lochies durent 4-6 semaines. Repos maximum les 10 premiers jours.' },
        { id: 't4', title: 'Sommeil du nouveau-n\u00e9', category: 'sant\u00e9 mentale', icon: 'bedtime', readTime: 6, content: 'Un nouveau-n\u00e9 dort 16-17h par jour en cycles de 2-4h. Dormez quand b\u00e9b\u00e9 dort.' },
        { id: 't5', title: 'Le couple apr\u00e8s b\u00e9b\u00e9', category: 'vie de couple', icon: 'favorite', readTime: 9, content: '70% des couples rapportent une baisse de satisfaction conjugale. Maintenez la communication.' }
      ],
      '3-6': [
        { id: 't6', title: 'Reprise de la sexualit\u00e9', category: 'sexualit\u00e9', icon: 'diversity_3', readTime: 8, content: 'Il n\'y a pas de d\u00e9lai impos\u00e9. \u00c9coutez votre corps et communiquez avec votre partenaire.' },
        { id: 't7', title: 'Retour au travail', category: 'sant\u00e9 mentale', icon: 'work', readTime: 7, content: 'Planifiez la transition : mode de garde, organisation. La culpabilit\u00e9 est normale.' },
        { id: 't8', title: 'Diversification alimentaire', category: 'allaitement', icon: 'restaurant', readTime: 10, content: 'Vers 4-6 mois, commencez par des l\u00e9gumes doux. Un aliment nouveau tous les 3 jours.' },
        { id: 't9', title: 'R\u00e9\u00e9ducation p\u00e9rin\u00e9ale', category: 'vie de couple', icon: 'fitness_center', readTime: 6, content: '10 s\u00e9ances avec un kin\u00e9. Exercices de Kegel \u00e0 la maison.' },
        { id: 't10', title: 'G\u00e9rer les conflits', category: 'vie de couple', icon: 'balance', readTime: 8, content: 'Discutez en priv\u00e9, jamais devant l\'enfant. Trouvez des compromis.' }
      ],
      '6-12': [
        { id: 't11', title: 'D\u00e9veloppement de b\u00e9b\u00e9', category: 'sant\u00e9 mentale', icon: 'child_care', readTime: 7, content: 'B\u00e9b\u00e9 rampe, s\'assied, se l\u00e8ve. Les premiers mots apparaissent.' },
        { id: 't12', title: 'Retrouver son identit\u00e9', category: 'sant\u00e9 mentale', icon: 'person', readTime: 9, content: 'Reprenez une activit\u00e9 personnelle. Un parent \u00e9panoui \u00e9l\u00e8ve un enfant \u00e9panoui.' },
        { id: 't13', title: 'Contraception', category: 'sexualit\u00e9', icon: 'medication', readTime: 6, content: 'DIU, implant, pilule. Discutez avec votre gyn\u00e9cologue.' },
        { id: 't14', title: 'Projet de fratrie', category: 'vie de couple', icon: 'family_restroom', readTime: 8, content: 'L\'OMS recommande 18-24 mois entre deux grossesses.' },
        { id: 't15', title: 'Bilan de l\'ann\u00e9e', category: 'vie de couple', icon: 'celebration', readTime: 10, content: 'F\u00e9licitations ! C\u00e9l\u00e9brez et faites le bilan ensemble.' }
      ]
    },
    ar: {
      '0-3': [
        { id: 't1', title: '\u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u0623\u0648\u0644\u0649', category: '\u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0646\u0641\u0633\u064a\u0629', icon: 'child_care', readTime: 8, content: '\u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u0623\u0648\u0644\u0649 \u0628\u0639\u062f \u0627\u0644\u0648\u0644\u0627\u062f\u0629 \u0632\u0648\u0628\u0639\u0629 \u0645\u0634\u0627\u0639\u0631. \u0627\u0643\u062a\u0626\u0627\u0628 \u0645\u0627 \u0628\u0639\u062f \u0627\u0644\u0648\u0644\u0627\u062f\u0629 \u064a\u0635\u064a\u0628 50-80% \u0645\u0646 \u0627\u0644\u0646\u0633\u0627\u0621.' },
        { id: 't2', title: '\u0627\u0644\u0631\u0636\u0627\u0639\u0629: \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a', category: '\u0627\u0644\u0631\u0636\u0627\u0639\u0629', icon: 'breastfeeding', readTime: 10, content: '\u0627\u0644\u0631\u0636\u0627\u0639\u0629 \u062a\u062a\u0631\u0633\u062e \u062a\u062f\u0631\u064a\u062c\u064a\u0627\u064b. \u0627\u0644\u0644\u0628\u0623 \u064a\u063a\u0630\u064a \u0627\u0644\u0637\u0641\u0644 \u0641\u064a \u0623\u0648\u0644 48 \u0633\u0627\u0639\u0629.' },
        { id: 't3', title: '\u0627\u0644\u062a\u0639\u0627\u0641\u064a \u0627\u0644\u062c\u0633\u062f\u064a', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'healing', readTime: 7, content: '\u062c\u0633\u0645\u0643 \u064a\u062d\u062a\u0627\u062c \u0648\u0642\u062a\u0627\u064b. \u0627\u0644\u0646\u0632\u064a\u0641 \u064a\u0633\u062a\u0645\u0631 4-6 \u0623\u0633\u0627\u0628\u064a\u0639. \u0627\u0644\u0631\u0627\u062d\u0629 \u0627\u0644\u0642\u0635\u0648\u0649 \u0641\u064a \u0623\u0648\u0644 10 \u0623\u064a\u0627\u0645.' },
        { id: 't4', title: '\u0646\u0648\u0645 \u0627\u0644\u0645\u0648\u0644\u0648\u062f', category: '\u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0646\u0641\u0633\u064a\u0629', icon: 'bedtime', readTime: 6, content: '\u0627\u0644\u0645\u0648\u0644\u0648\u062f \u064a\u0646\u0627\u0645 16-17 \u0633\u0627\u0639\u0629 \u064a\u0648\u0645\u064a\u0627\u064b. \u0646\u0627\u0645\u064a \u0639\u0646\u062f\u0645\u0627 \u064a\u0646\u0627\u0645.' },
        { id: 't5', title: '\u0627\u0644\u0632\u0648\u062c\u064a\u0646 \u0628\u0639\u062f \u0627\u0644\u0637\u0641\u0644', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'favorite', readTime: 9, content: '70% \u0645\u0646 \u0627\u0644\u0623\u0632\u0648\u0627\u062c \u064a\u0644\u0627\u062d\u0638\u0648\u0646 \u0627\u0646\u062e\u0641\u0627\u0636\u0627\u064b \u0641\u064a \u0627\u0644\u0631\u0636\u0627. \u062d\u0627\u0641\u0638\u0627 \u0639\u0644\u0649 \u0627\u0644\u062a\u0648\u0627\u0635\u0644.' }
      ],
      '3-6': [
        { id: 't6', title: '\u0627\u0633\u062a\u0626\u0646\u0627\u0641 \u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0627\u0644\u062d\u0645\u064a\u0645\u0629', category: '\u0627\u0644\u062d\u064a\u0627\u0629 \u0627\u0644\u062c\u0646\u0633\u064a\u0629', icon: 'diversity_3', readTime: 8, content: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0648\u0639\u062f \u0645\u062d\u062f\u062f. \u0627\u0633\u062a\u0645\u0639\u064a \u0644\u062c\u0633\u0645\u0643 \u0648\u062a\u0648\u0627\u0635\u0644\u064a \u0645\u0639 \u0634\u0631\u064a\u0643\u0643.' },
        { id: 't7', title: '\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0639\u0645\u0644', category: '\u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0646\u0641\u0633\u064a\u0629', icon: 'work', readTime: 7, content: '\u062e\u0637\u0637\u064a \u0644\u0644\u0627\u0646\u062a\u0642\u0627\u0644. \u0627\u0644\u0634\u0639\u0648\u0631 \u0628\u0627\u0644\u0630\u0646\u0628 \u0637\u0628\u064a\u0639\u064a.' },
        { id: 't8', title: '\u0627\u0644\u062a\u0646\u0648\u064a\u0639 \u0627\u0644\u063a\u0630\u0627\u0626\u064a', category: '\u0627\u0644\u0631\u0636\u0627\u0639\u0629', icon: 'restaurant', readTime: 10, content: '\u0645\u0646 4-6 \u0623\u0634\u0647\u0631\u060c \u0627\u0628\u062f\u0626\u064a \u0628\u062e\u0636\u0631\u0648\u0627\u062a \u0644\u0637\u064a\u0641\u0629. \u0637\u0639\u0627\u0645 \u062c\u062f\u064a\u062f \u0643\u0644 3 \u0623\u064a\u0627\u0645.' },
        { id: 't9', title: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0623\u0647\u064a\u0644 \u0642\u0627\u0639 \u0627\u0644\u062d\u0648\u0636', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'fitness_center', readTime: 6, content: '10 \u062c\u0644\u0633\u0627\u062a \u0645\u0639 \u0623\u062e\u0635\u0627\u0626\u064a. \u062a\u0645\u0627\u0631\u064a\u0646 \u0643\u064a\u062c\u0644 \u0641\u064a \u0627\u0644\u0645\u0646\u0632\u0644.' },
        { id: 't10', title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062e\u0644\u0627\u0641\u0627\u062a', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'balance', readTime: 8, content: '\u062a\u0646\u0627\u0642\u0634\u0627 \u0639\u0644\u0649 \u0627\u0646\u0641\u0631\u0627\u062f. \u0627\u0628\u062d\u062b\u0627 \u0639\u0646 \u062d\u0644\u0648\u0644 \u0648\u0633\u0637.' }
      ],
      '6-12': [
        { id: 't11', title: '\u0646\u0645\u0648 \u0627\u0644\u0637\u0641\u0644', category: '\u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0646\u0641\u0633\u064a\u0629', icon: 'child_care', readTime: 7, content: '\u0627\u0644\u0637\u0641\u0644 \u064a\u062d\u0628\u0648\u060c \u064a\u062c\u0644\u0633\u060c \u064a\u0642\u0641. \u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0623\u0648\u0644\u0649 \u062a\u0638\u0647\u0631.' },
        { id: 't12', title: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0627\u0644\u0647\u0648\u064a\u0629', category: '\u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0646\u0641\u0633\u064a\u0629', icon: 'person', readTime: 9, content: '\u0627\u0633\u062a\u0623\u0646\u0641\u064a \u0646\u0634\u0627\u0637\u0627\u064b \u0634\u062e\u0635\u064a\u0627\u064b. \u0627\u0644\u0648\u0627\u0644\u062f \u0627\u0644\u0633\u0639\u064a\u062f \u064a\u0631\u0628\u064a \u0637\u0641\u0644\u0627\u064b \u0633\u0639\u064a\u062f\u0627\u064b.' },
        { id: 't13', title: '\u0648\u0633\u0627\u0626\u0644 \u0645\u0646\u0639 \u0627\u0644\u062d\u0645\u0644', category: '\u0627\u0644\u062d\u064a\u0627\u0629 \u0627\u0644\u062c\u0646\u0633\u064a\u0629', icon: 'medication', readTime: 6, content: '\u0627\u0644\u0644\u0648\u0644\u0628\u060c \u0627\u0644\u063a\u0631\u0633\u0629\u060c \u0627\u0644\u062d\u0628\u0648\u0628. \u0627\u0633\u062a\u0634\u064a\u0631\u064a \u0637\u0628\u064a\u0628\u062a\u0643.' },
        { id: 't14', title: '\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0623\u062e\u0648\u0629', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'family_restroom', readTime: 8, content: '\u064a\u0646\u0635\u062d \u0628~18-24 \u0634\u0647\u0631\u0627\u064b \u0628\u064a\u0646 \u062d\u0645\u0644\u064a\u0646.' },
        { id: 't15', title: '\u062d\u0635\u064a\u0644\u0629 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0623\u0648\u0644\u0649', category: '\u062d\u064a\u0627\u0629 \u0627\u0644\u0632\u0648\u062c\u064a\u0646', icon: 'celebration', readTime: 10, content: '\u0645\u0628\u0631\u0648\u0643! \u0627\u062d\u062a\u0641\u0644\u0627 \u0648\u0642\u064a\u0645\u0627 \u0645\u0633\u0627\u0631\u0643\u0645\u0627 \u0645\u0639\u0627\u064b.' }
      ]
    }
  };

  app.get('/api/timeline/:period', (req, res) => {
    const period = req.params.period;
    const lang = req.query.lang || 'fr';
    const langContent = timelineContent[lang] || timelineContent.fr;
    const content = langContent[period];
    if (!content) return res.status(404).json({ error: 'P\u00e9riode non trouv\u00e9e' });
    res.json({ period, articles: content });
  });

  app.get('/api/timeline', (req, res) => {
    const lang = req.query.lang || 'fr';
    const langContent = timelineContent[lang] || timelineContent.fr;
    res.json({
      periods: [
        { id: '0-3', label: '0-3', desc: lang==='ar'?'\u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0627\u0644\u0623\u0648\u0644\u0649':'Les premiers pas', count: langContent['0-3'].length },
        { id: '3-6', label: '3-6', desc: lang==='ar'?'\u0627\u0644\u062a\u0623\u0642\u0644\u0645 \u0641\u064a \u0627\u0644\u062f\u0648\u0631':'S\'installer', count: langContent['3-6'].length },
        { id: '6-12', label: '6-12', desc: lang==='ar'?'\u0627\u0644\u0646\u0645\u0648 \u0645\u0639\u0627\u064b':'Grandir ensemble', count: langContent['6-12'].length }
      ]
    });
  });

  // ═══════════════════ SYSTÈME D'ALERTES ═══════════════════

  app.get('/api/alerts', requireAuth, (req, res) => {
    const cid = req.session.coupleId;
    const alerts = [];

    // Check evaluation scores
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const labels = { psychologique: 'psychologique', conjugal: 'conjugale', sexuel: 'sexuelle' };
    const professionals = {
      psychologique: { name: 'Psychologue périnatal', icon: 'psychology' },
      conjugal: { name: 'Thérapeute de couple', icon: 'group' },
      sexuel: { name: 'Sage-femme / Sexologue', icon: 'medical_services' }
    };

    types.forEach(t => {
      const r = queryOne('SELECT score, created_at FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [cid, t]);
      if (r && r.score < 30) {
        alerts.push({
          id: `alert-${t}-critical`,
          type: 'critical',
          category: t,
          title: `Score ${labels[t]} critique`,
          message: `Votre score ${labels[t]} est de ${r.score}%. Nous vous recommandons vivement de consulter un ${professionals[t].name}.`,
          icon: professionals[t].icon,
          professional: professionals[t].name,
          score: r.score,
          date: r.created_at,
          action: 'Trouver un professionnel'
        });
      } else if (r && r.score < 50) {
        alerts.push({
          id: `alert-${t}-warning`,
          type: 'warning',
          category: t,
          title: `Score ${labels[t]} faible`,
          message: `Votre score ${labels[t]} est de ${r.score}%. Un accompagnement pourrait vous aider.`,
          icon: professionals[t].icon,
          professional: professionals[t].name,
          score: r.score,
          date: r.created_at,
          action: 'Voir les conseils'
        });
      }
    });

    // Check daily stress levels
    const recentDaily = queryAll(
      "SELECT stress, mood FROM daily_entries WHERE couple_id=? AND created_at >= datetime('now', '-7 days') ORDER BY created_at DESC",
      [cid]
    );

    if (recentDaily.length >= 3) {
      const avgStress = recentDaily.reduce((s, d) => s + d.stress, 0) / recentDaily.length;
      if (avgStress >= 8) {
        alerts.push({
          id: 'alert-stress-high',
          type: 'critical',
          category: 'stress',
          title: 'Niveau de stress élevé',
          message: `Votre stress moyen sur 7 jours est de ${avgStress.toFixed(1)}/10. C'est un signal important.`,
          icon: 'warning',
          professional: 'Psychologue',
          action: 'Techniques de gestion du stress'
        });
      }

      const sadMoods = recentDaily.filter(d => d.mood === '😫' || d.mood === '😔');
      if (sadMoods.length >= Math.ceil(recentDaily.length * 0.7)) {
        alerts.push({
          id: 'alert-mood-low',
          type: 'warning',
          category: 'humeur',
          title: 'Humeur préoccupante',
          message: 'Vous avez signalé une humeur basse fréquemment. N\'hésitez pas à en parler.',
          icon: 'sentiment_dissatisfied',
          professional: 'Psychologue périnatal',
          action: 'Ressources d\'aide'
        });
      }
    }

    // Check if no evaluation in last 30 days
    const lastEval = queryOne("SELECT created_at FROM evaluations WHERE couple_id=? ORDER BY created_at DESC LIMIT 1", [cid]);
    if (lastEval) {
      const daysSince = Math.floor((Date.now() - new Date(lastEval.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 30) {
        alerts.push({
          id: 'alert-eval-overdue',
          type: 'info',
          category: 'suivi',
          title: 'Évaluation recommandée',
          message: `Votre dernière évaluation date de ${daysSince} jours. Un suivi régulier est important.`,
          icon: 'assignment',
          action: 'Faire une évaluation'
        });
      }
    }

    // Sort: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (order[a.type] || 3) - (order[b.type] || 3));

    res.json({ alerts, count: alerts.length });
  });

  // ═══════════════════ ADMIN DASHBOARD ═══════════════════

  app.get('/api/admin/stats', requireAuth, (req, res) => {
    // Check if admin (first account)
    const couple = queryOne('SELECT id, partner1_email FROM couples WHERE id=?', [req.session.coupleId]);
    if (!couple || couple.partner1_email !== 'admin@nurtureflow.com') {
      return res.status(403).json({ error: 'Accès réservé à l\'administrateur' });
    }

    const totalCouples = queryOne('SELECT COUNT(*) as c FROM couples').c;
    const totalEvals = queryOne('SELECT COUNT(*) as c FROM evaluations').c;
    const totalDaily = queryOne('SELECT COUNT(*) as c FROM daily_entries').c;
    const todayDaily = queryOne("SELECT COUNT(*) as c FROM daily_entries WHERE DATE(created_at) = DATE('now')").c;

    // Average scores
    const avgScores = {};
    ['psychologique', 'conjugal', 'sexuel'].forEach(t => {
      const r = queryOne(`SELECT AVG(score) as avg FROM evaluations WHERE type=?`, [t]);
      avgScores[t] = r && r.avg ? Math.round(r.avg) : 0;
    });

    // Recent couples
    const recentCouples = queryAll('SELECT id, partner1_name, partner2_name, partner1_email, created_at FROM couples ORDER BY created_at DESC LIMIT 10');

    // Eval count per type
    const evalsByType = {};
    ['psychologique', 'conjugal', 'sexuel'].forEach(t => {
      evalsByType[t] = queryOne('SELECT COUNT(*) as c FROM evaluations WHERE type=?', [t]).c;
    });

    // Active couples (had activity in last 7 days)
    const activeCouples = queryOne(
      `SELECT COUNT(DISTINCT couple_id) as c FROM (
        SELECT couple_id FROM evaluations WHERE created_at >= datetime('now', '-7 days')
        UNION
        SELECT couple_id FROM daily_entries WHERE created_at >= datetime('now', '-7 days')
      )`
    ).c;

    // Stress distribution
    const stressDistrib = queryAll(
      `SELECT 
        CASE WHEN stress <= 3 THEN 'low' WHEN stress <= 6 THEN 'medium' ELSE 'high' END as level,
        COUNT(*) as count
       FROM daily_entries GROUP BY level`
    );

    // Score distribution
    const scoreDistrib = queryAll(
      `SELECT 
        CASE WHEN score >= 75 THEN 'excellent' WHEN score >= 55 THEN 'bon' WHEN score >= 35 THEN 'moyen' ELSE 'faible' END as level,
        COUNT(*) as count
       FROM evaluations GROUP BY level`
    );

    res.json({
      totalCouples,
      totalEvals,
      totalDaily,
      todayDaily,
      activeCouples,
      avgScores,
      evalsByType,
      recentCouples,
      stressDistrib,
      scoreDistrib
    });
  });

  app.get('/api/admin/couples', requireAuth, (req, res) => {
    const couple = queryOne('SELECT partner1_email FROM couples WHERE id=?', [req.session.coupleId]);
    if (!couple || couple.partner1_email !== 'admin@nurtureflow.com') {
      return res.status(403).json({ error: 'Accès réservé' });
    }

    const couples = queryAll(`
      SELECT c.id, c.partner1_name, c.partner2_name, c.partner1_email, c.partner1_age, c.partner2_age,
             c.marriage_duration, c.baby_age, c.created_at,
             (SELECT COUNT(*) FROM evaluations WHERE couple_id=c.id) as eval_count,
             (SELECT COUNT(*) FROM daily_entries WHERE couple_id=c.id) as daily_count,
             (SELECT MAX(score) FROM evaluations WHERE couple_id=c.id) as best_score
      FROM couples c ORDER BY c.created_at DESC
    `);

    res.json({ couples });
  });

  app.get('/api/admin/couple/:id', requireAuth, (req, res) => {
    const admin = queryOne('SELECT partner1_email FROM couples WHERE id=?', [req.session.coupleId]);
    if (!admin || admin.partner1_email !== 'admin@nurtureflow.com') {
      return res.status(403).json({ error: 'Accès réservé' });
    }

    const id = req.params.id;
    const couple = queryOne('SELECT * FROM couples WHERE id=?', [id]);
    if (!couple) return res.status(404).json({ error: 'Couple non trouvé' });
    delete couple.password;

    const evals = queryAll('SELECT type, score, created_at FROM evaluations WHERE couple_id=? ORDER BY created_at DESC', [id]);
    const dailies = queryAll('SELECT mood, stress, satisfaction_conjugale, created_at FROM daily_entries WHERE couple_id=? ORDER BY created_at DESC LIMIT 14', [id]);

    res.json({ couple, evaluations: evals, dailyEntries: dailies });
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
