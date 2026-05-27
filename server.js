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
    7: {
      title: 'Plan Express — 7 jours',
      description: 'Un programme intensif pour améliorer rapidement votre quotidien de couple.',
      activities: [
        { day: 1, type: 'communication', title: 'Lettre d\'appréciation', desc: 'Écrivez chacun 3 choses que vous aimez chez votre partenaire. Partagez-les ce soir.', icon: 'edit_note' },
        { day: 2, type: 'psychologique', title: 'Méditation à deux', desc: '10 minutes de respiration synchronisée. Asseyez-vous face à face, respirez ensemble.', icon: 'self_improvement' },
        { day: 3, type: 'couple', title: 'Soirée sans écrans', desc: 'Éteignez tous les écrans après 20h. Jouez à un jeu, cuisinez ensemble ou discutez.', icon: 'devices_off' },
        { day: 4, type: 'post-partum', title: 'Massage relaxant', desc: 'Offrez-vous mutuellement un massage de 15 minutes. Utilisez une huile douce.', icon: 'spa' },
        { day: 5, type: 'communication', title: 'Check-in émotionnel', desc: 'Posez-vous mutuellement : Comment te sens-tu vraiment ? Écoutez sans juger.', icon: 'forum' },
        { day: 6, type: 'couple', title: 'Photo souvenir', desc: 'Regardez ensemble vos photos de couple. Racontez vos souvenirs préférés.', icon: 'photo_library' },
        { day: 7, type: 'psychologique', title: 'Bilan et gratitude', desc: 'Faites le bilan de la semaine. Qu\'avez-vous appris ? Qu\'allez-vous continuer ?', icon: 'celebration' }
      ]
    },
    14: {
      title: 'Plan Équilibre — 14 jours',
      description: 'Deux semaines pour renforcer les fondations de votre relation parentale.',
      activities: [
        { day: 1, type: 'communication', title: 'Rituel du matin', desc: 'Chaque matin, dites une chose positive à votre partenaire avant de commencer la journée.', icon: 'wb_sunny' },
        { day: 2, type: 'psychologique', title: 'Journal de gratitude', desc: 'Écrivez chacun 3 moments de gratitude liés à votre famille. Partagez-les.', icon: 'menu_book' },
        { day: 3, type: 'couple', title: 'Date à la maison', desc: 'Préparez un dîner spécial quand bébé dort. Mettez une musique douce.', icon: 'dinner_dining' },
        { day: 4, type: 'post-partum', title: 'Exercice de Kegel', desc: 'Pratiquez ensemble les exercices du périnée. 3 séries de 10 contractions.', icon: 'fitness_center' },
        { day: 5, type: 'communication', title: 'Écoute active', desc: 'Pendant 20 min, l\'un parle et l\'autre écoute sans interrompre. Puis inversez.', icon: 'hearing' },
        { day: 6, type: 'psychologique', title: 'Promenade en famille', desc: 'Sortez marcher 30 minutes ensemble avec bébé. Profitez du plein air.', icon: 'directions_walk' },
        { day: 7, type: 'couple', title: 'Câlin de reconnexion', desc: 'Prenez-vous dans les bras pendant 2 minutes sans rien dire. Juste être ensemble.', icon: 'favorite' },
        { day: 8, type: 'communication', title: 'Répartition des tâches', desc: 'Revisitez ensemble la répartition des tâches. Trouvez un meilleur équilibre.', icon: 'checklist' },
        { day: 9, type: 'psychologique', title: 'Respiration guidée', desc: 'Faites 15 min de cohérence cardiaque ensemble. Inspirez 5s, expirez 5s.', icon: 'air' },
        { day: 10, type: 'couple', title: 'Surprise attentionnée', desc: 'Préparez une petite surprise pour votre partenaire. Un mot, un geste, un cadeau.', icon: 'card_giftcard' },
        { day: 11, type: 'post-partum', title: 'Consultation sage-femme', desc: 'Planifiez un rendez-vous avec votre sage-femme pour un bilan post-partum.', icon: 'medical_services' },
        { day: 12, type: 'communication', title: 'Projets futurs', desc: 'Discutez de vos rêves et projets de famille. Où vous voyez-vous dans 5 ans ?', icon: 'rocket_launch' },
        { day: 13, type: 'psychologique', title: 'Temps personnel', desc: 'Accordez-vous chacun 2h de temps libre. Faites ce qui vous ressource.', icon: 'person' },
        { day: 14, type: 'couple', title: 'Célébration', desc: 'Célébrez ces 2 semaines de progrès. Écrivez vos engagements pour l\'avenir.', icon: 'celebration' }
      ]
    },
    30: {
      title: 'Plan Transformation — 30 jours',
      description: 'Un mois complet pour transformer votre vie de couple et de famille.',
      activities: [
        { day: 1, type: 'communication', title: 'Contrat de bienveillance', desc: 'Établissez ensemble 5 règles de communication bienveillante.', icon: 'handshake' },
        { day: 2, type: 'psychologique', title: 'Scan corporel', desc: 'Allongez-vous 10 min. Scannez mentalement chaque partie du corps. Relâchez les tensions.', icon: 'accessibility_new' },
        { day: 3, type: 'couple', title: 'Album de famille', desc: 'Commencez un album photo/journal de votre nouvelle famille.', icon: 'photo_album' },
        { day: 5, type: 'communication', title: 'Langage d\'amour', desc: 'Identifiez votre langage d\'amour principal. Paroles, service, cadeaux, toucher, temps ?', icon: 'translate' },
        { day: 7, type: 'couple', title: 'Rendez-vous hebdo', desc: 'Instaurez un rendez-vous couple hebdomadaire. Même 30 min comptent.', icon: 'event' },
        { day: 10, type: 'psychologique', title: 'Gestion du stress', desc: 'Identifiez vos 3 sources de stress principales. Trouvez une solution pour chacune.', icon: 'psychology' },
        { day: 12, type: 'post-partum', title: 'Yoga postnatal', desc: 'Essayez une séance de yoga postnatal (vidéo en ligne). 20 minutes suffisent.', icon: 'self_improvement' },
        { day: 14, type: 'couple', title: 'Bilan mi-parcours', desc: 'Évaluez vos progrès. Qu\'est-ce qui fonctionne ? Que faut-il ajuster ?', icon: 'assessment' },
        { day: 16, type: 'communication', title: 'Lettre à bébé', desc: 'Écrivez chacun une lettre à votre enfant. Racontez ce que vous ressentez.', icon: 'mail' },
        { day: 18, type: 'psychologique', title: 'Réseau de soutien', desc: 'Contactez un ami ou un membre de la famille. Entretenez votre réseau social.', icon: 'group' },
        { day: 20, type: 'couple', title: 'Playlist du couple', desc: 'Créez une playlist de vos chansons préférées. Écoutez-la ensemble.', icon: 'music_note' },
        { day: 22, type: 'post-partum', title: 'Reprise sportive', desc: 'Commencez une activité physique douce. Marche rapide, natation, ou pilates.', icon: 'pool' },
        { day: 25, type: 'communication', title: 'Résolution de conflits', desc: 'Apprenez la technique DESC : Décrire, Exprimer, Spécifier, Conséquences.', icon: 'balance' },
        { day: 27, type: 'psychologique', title: 'Vision board', desc: 'Créez ensemble un tableau de vision pour votre famille. Collez vos rêves.', icon: 'dashboard' },
        { day: 30, type: 'couple', title: 'Renouvellement des vœux', desc: 'Renouvelez vos engagements mutuels. Que promettez-vous pour l\'avenir ?', icon: 'volunteer_activism' }
      ]
    }
  };

  app.get('/api/plan/:duration', requireAuth, (req, res) => {
    const duration = parseInt(req.params.duration);
    if (![7, 14, 30].includes(duration)) return res.status(400).json({ error: 'Durée invalide' });

    const plan = planTemplates[duration];

    // Get scores to personalize recommendations
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const scores = {};
    types.forEach(t => {
      const r = queryOne('SELECT score FROM evaluations WHERE couple_id=? AND type=? ORDER BY created_at DESC LIMIT 1', [req.session.coupleId, t]);
      scores[t] = r ? r.score : 0;
    });

    // Determine focus areas
    const focusAreas = [];
    if (scores.psychologique > 0 && scores.psychologique < 50) focusAreas.push('psychologique');
    if (scores.conjugal > 0 && scores.conjugal < 50) focusAreas.push('communication');
    if (scores.sexuel > 0 && scores.sexuel < 50) focusAreas.push('post-partum');

    // Check completed activities
    const completed = queryAll(
      'SELECT activity_day, plan_duration FROM plan_progress WHERE couple_id=? AND plan_duration=?',
      [req.session.coupleId, duration]
    );
    const completedDays = completed.map(c => c.activity_day);

    res.json({ plan, scores, focusAreas, completedDays });
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

  // ═══════════════════ TIMELINE POST-PARTUM ═══════════════════

  const timelineContent = {
    '0-3': [
      { id: 't1', title: 'Les premiers jours', category: 'santé mentale', icon: 'child_care', readTime: 8, content: 'Les premiers jours après l\'accouchement sont un tourbillon d\'émotions. Le baby blues touche 50 à 80% des femmes entre J3 et J10. C\'est normal et passager. Fatigue, pleurs, irritabilité, sentiment d\'être dépassée — tout cela fait partie du processus d\'adaptation. Si ces symptômes persistent au-delà de 2 semaines, parlez-en à un professionnel.' },
      { id: 't2', title: 'Allaitement : les bases', category: 'allaitement', icon: 'breastfeeding', readTime: 10, content: 'L\'allaitement s\'installe progressivement. Les premières 48h, c\'est le colostrum (or liquide !) qui nourrit bébé. La montée de lait arrive vers J3-J5. Positions recommandées : madone, ballon de rugby, allongée. Si douleurs, vérifiez la prise au sein. N\'hésitez pas à consulter une consultante en lactation.' },
      { id: 't3', title: 'Récupération physique', category: 'vie de couple', icon: 'healing', readTime: 7, content: 'Votre corps a besoin de temps. Les lochies (saignements) durent 4-6 semaines. Cicatrisation : épisiotomie (2-3 semaines), césarienne (6-8 semaines). Repos maximum les 10 premiers jours. Évitez les efforts physiques. La rééducation du périnée commencera vers 6-8 semaines post-partum.' },
      { id: 't4', title: 'Sommeil du nouveau-né', category: 'santé mentale', icon: 'bedtime', readTime: 6, content: 'Un nouveau-né dort 16-17h par jour, en cycles de 2-4h. Le sommeil se régularise progressivement. Conseil : dormez quand bébé dort. Organisez des tours de garde avec votre partenaire. La privation de sommeil est le facteur n°1 de stress postnatal.' },
      { id: 't5', title: 'Le couple après bébé', category: 'vie de couple', icon: 'favorite', readTime: 9, content: 'L\'arrivée du premier enfant est la transition la plus intense pour un couple. 70% des couples rapportent une baisse de satisfaction conjugale. C\'est NORMAL. La clé : maintenir la communication, exprimer ses besoins, partager les responsabilités, et surtout, ne pas oublier que vous êtes un couple avant d\'être parents.' }
    ],
    '3-6': [
      { id: 't6', title: 'Reprise de la sexualité', category: 'sexualité', icon: 'diversity_3', readTime: 8, content: 'Il n\'y a pas de délai imposé pour reprendre une activité sexuelle. Écoutez votre corps et vos envies. La sécheresse vaginale est fréquente (surtout pendant l\'allaitement) — utilisez un lubrifiant. Communiquez ouvertement avec votre partenaire sur vos désirs et appréhensions. La tendresse et l\'intimité non sexuelle sont tout aussi importantes.' },
      { id: 't7', title: 'Retour au travail', category: 'santé mentale', icon: 'work', readTime: 7, content: 'Le retour au travail peut être source d\'anxiété. Planifiez la transition : mode de garde, organisation du quotidien, tire-lait si allaitement. Acceptez que la culpabilité est normale mais pas justifiée. Vous restez une mère/un père formidable même en travaillant.' },
      { id: 't8', title: 'Diversification alimentaire', category: 'allaitement', icon: 'restaurant', readTime: 10, content: 'Vers 4-6 mois, bébé montre des signes de préparation : tient sa tête, s\'intéresse à la nourriture, perd le réflexe d\'extrusion. Commencez par des légumes doux (carotte, courge, courgette) en purée lisse. Un aliment nouveau tous les 3 jours pour détecter les allergies.' },
      { id: 't9', title: 'Rééducation périnéale', category: 'vie de couple', icon: 'fitness_center', readTime: 6, content: 'La rééducation périnéale est recommandée pour toutes les femmes. 10 séances en moyenne avec un kinésithérapeute spécialisé. Exercices de Kegel à faire chez soi. Bénéfices : prévention de l\'incontinence, amélioration du confort intime, meilleure confiance corporelle.' },
      { id: 't10', title: 'Gérer les conflits parentaux', category: 'vie de couple', icon: 'balance', readTime: 8, content: 'Les désaccords sur l\'éducation sont inévitables. Règle d\'or : discutez en privé, jamais devant l\'enfant. Trouvez des compromis. Respectez les différences de style parental. Si les conflits s\'intensifient, une thérapie de couple peut aider à retrouver l\'harmonie.' }
    ],
    '6-12': [
      { id: 't11', title: 'Développement de bébé', category: 'santé mentale', icon: 'child_care', readTime: 7, content: '6-12 mois : c\'est l\'explosion du développement ! Bébé rampe, s\'assied, commence à se lever. Les premiers mots apparaissent (mama, papa). L\'angoisse de séparation est normale vers 8-9 mois. Votre rôle : offrir un environnement sécurisé et stimulant.' },
      { id: 't12', title: 'Retrouver son identité', category: 'santé mentale', icon: 'person', readTime: 9, content: 'Après la période intensive des premiers mois, il est temps de retrouver votre identité au-delà du rôle de parent. Reprenez une activité personnelle, voyez vos amis, cultivez vos passions. Un parent épanoui élève un enfant épanoui.' },
      { id: 't13', title: 'Contraception à long terme', category: 'sexualité', icon: 'medication', readTime: 6, content: 'C\'est le moment de réfléchir à une contraception adaptée à long terme. Options : DIU cuivre (10 ans), DIU hormonal (5 ans), implant (3 ans), pilule. Discutez avec votre gynécologue pour choisir la méthode qui vous convient le mieux en couple.' },
      { id: 't14', title: 'Projet de fratrie', category: 'vie de couple', icon: 'family_restroom', readTime: 8, content: 'La question du deuxième enfant se pose souvent vers la fin de la première année. Il n\'y a pas de timing parfait. L\'OMS recommande 18-24 mois entre deux grossesses. Prenez cette décision ensemble, quand vous vous sentez prêts physiquement et émotionnellement.' },
      { id: 't15', title: 'Bilan de la première année', category: 'vie de couple', icon: 'celebration', readTime: 10, content: 'Félicitations, vous avez survécu à la première année ! C\'est un accomplissement majeur. Prenez le temps de faire le bilan : ce que vous avez appris, comment votre relation a évolué, vos fiertés. Célébrez cette étape ensemble — vous le méritez.' }
    ]
  };

  app.get('/api/timeline/:period', (req, res) => {
    const period = req.params.period;
    const content = timelineContent[period];
    if (!content) return res.status(404).json({ error: 'Période non trouvée' });
    res.json({ period, articles: content });
  });

  app.get('/api/timeline', (req, res) => {
    res.json({
      periods: [
        { id: '0-3', label: '0-3 mois', desc: 'Les premiers pas', count: timelineContent['0-3'].length },
        { id: '3-6', label: '3-6 mois', desc: 'S\'installer dans le rôle', count: timelineContent['3-6'].length },
        { id: '6-12', label: '6-12 mois', desc: 'Grandir ensemble', count: timelineContent['6-12'].length }
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
