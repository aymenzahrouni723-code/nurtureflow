/* ============================================================
   NurtureFlow — Frontend Application
   SPA avec appels API vers le backend Express
   ============================================================ */

// ── API Helper ──
async function api(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  };
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch('/api' + endpoint, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ── State ──
const state = {
  currentScreen: 'auth',
  authenticated: false,
  couple: null,
  currentQuestionnaireType: null,
  currentQuestion: 0,
  answers: {},
  scores: { psychologique: 0, conjugal: 0, sexuel: 0 },
  currentMood: null
};

// ── Questionnaire Data (translated) ──
function getQuestionnaires() {
  return {
    psychologique: {
      title: t('qt_psycho'),
      icon: 'psychology',
      color: 'var(--secondary)',
      questions: [
        { q: t('qp1'), hint: t('qp1h') },
        { q: t('qp2'), hint: t('qp2h') },
        { q: t('qp3'), hint: t('qp3h') },
        { q: t('qp4'), hint: t('qp4h') },
        { q: t('qp5'), hint: t('qp5h') },
        { q: t('qp6'), hint: t('qp6h') },
        { q: t('qp7'), hint: t('qp7h') },
        { q: t('qp8'), hint: t('qp8h') },
        { q: t('qp9'), hint: t('qp9h') },
        { q: t('qp10'), hint: t('qp10h') }
      ]
    },
    conjugal: {
      title: t('qt_conjugal'),
      icon: 'favorite',
      color: 'var(--primary)',
      questions: [
        { q: t('qc1'), hint: t('qc1h') },
        { q: t('qc2'), hint: t('qc2h') },
        { q: t('qc3'), hint: t('qc3h') },
        { q: t('qc4'), hint: t('qc4h') },
        { q: t('qc5'), hint: t('qc5h') },
        { q: t('qc6'), hint: t('qc6h') },
        { q: t('qc7'), hint: t('qc7h') },
        { q: t('qc8'), hint: t('qc8h') },
        { q: t('qc9'), hint: t('qc9h') },
        { q: t('qc10'), hint: t('qc10h') }
      ]
    },
    sexuel: {
      title: t('qt_sexual'),
      icon: 'diversity_3',
      color: 'var(--tertiary)',
      questions: [
        { q: t('qs1'), hint: t('qs1h') },
        { q: t('qs2'), hint: t('qs2h') },
        { q: t('qs3'), hint: t('qs3h') },
        { q: t('qs4'), hint: t('qs4h') },
        { q: t('qs5'), hint: t('qs5h') },
        { q: t('qs6'), hint: t('qs6h') },
        { q: t('qs7'), hint: t('qs7h') },
        { q: t('qs8'), hint: t('qs8h') },
        { q: t('qs9'), hint: t('qs9h') },
        { q: t('qs10'), hint: t('qs10h') }
      ]
    }
  };
}

function getLikertOptions() {
  return [
    { label: t('q_never'), value: 1 },
    { label: t('q_rarely'), value: 2 },
    { label: t('q_sometimes'), value: 3 },
    { label: t('q_often'), value: 4 },
    { label: t('q_always'), value: 5 }
  ];
}

function getSageFemmeTips() {
  return [
    { cat: 'post-partum', icon: 'medical_services', title: t('sft1_title'), text: t('sft1_text') },
    { cat: 'allaitement', icon: 'breastfeeding', title: t('sft2_title'), text: t('sft2_text') },
    { cat: 'contraception', icon: 'medication', title: t('sft3_title'), text: t('sft3_text') },
    { cat: 'sexualite', icon: 'favorite', title: t('sft4_title'), text: t('sft4_text') },
    { cat: 'alerte', icon: 'warning', title: t('sft5_title'), text: t('sft5_text') },
    { cat: 'post-partum', icon: 'self_improvement', title: t('sft6_title'), text: t('sft6_text') },
    { cat: 'allaitement', icon: 'local_hospital', title: t('sft7_title'), text: t('sft7_text') },
    { cat: 'post-partum', icon: 'fitness_center', title: t('sft8_title'), text: t('sft8_text') }
  ];
}

const images = {
  conseil: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyozaAlkCROsC0KyJjNU4CthWFga8nMzjdgBoz8RtTZxOZSdoxtfyr17BLT5aqOM94Z0Z9bE2QY2SjP_VnSU8Xv2DZNYx5qCVJtMLvbqncGCAdKPnVIv0dZhrOUL0mzh5T6gYg5FN5YY-l-4BjgBJSSgeo1xBAg4UgsgBEgNrf9Yyzt9WrsNBIyBBmDgHk_e-aCGv0q8rSdDVXyxgPi1V2p7N2dv9kVe7ToOMb0V7RogEDOaPbrLbeg2sOGEL6On6ZPiabDbIkjrs',
  questionnaire: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4qN8sT3na-ACGhYj9XAiXD1SgyJWjmSGbgK8afdX2U-cuTkw3bYSgXzJowMba7gy86quI8WaG2o7WsYYjZNUaKszdWPDJPfdkLcCuRZmGQcYtvlozy33mWZdM_-WvDQElbiwkCYbQLo5jnQUp091fdNHanjrAvKE2JRKmiAAmvy1ZcupdVJX9Bi0IbvJcBlFqTqJfW6pR6hZKOIKZn_awnsrUuhmp6LUvFJRKJ5nWl77aFVxy6kvT3yK9B8FOhVoCi_ZyvXwVJ6Y',
  results: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQWdej-XsSyRrKhPlnpspTtYwzwBN9ZEeVs3fYkBsBCuGIjjB5eXy-3cySmxxNHHK69PT870RU088-aNYxDYdln7TZKT5qzTv5F6iRJ59lIWize4dMBBRX16rdihdU_aNG-vir88SLij11eKeeT83G9YmaQ2-lMHtHeO3Wr_XPPrVZoq1y3pefejAfZz6uQzWhu-l22USN84rhQru8kYs4JCmdYvK0xCAykjT4TNCjMpiOYagrVL-3FQ1LGckF7nQ5Q7uvJU5y84o',
  couple: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKdNTcd4YA62gEVZKqNjb3aTVQgmzga1OoPLBxXTRf6y466079mVTv7sgqEIHLQHOo48oyqAgPX6POdA7xjLyov6RDrmtO8mRNZ1RTvMt1To1wChmXShGnxcviMSGOjkFqNQzyd5VjhNDdFBfSyTsCqEijGnELXJnKCZNSDNSKMZJb3Q59xOkiG1WzSjzcr8lx53UNsUJue8j8VbMkEVBlVil7YHFgsc7suFU70dcAEwxs2REKnFD3-zwruifc28isp7njvHiDoMY',
  library: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_RVwSRojNQlvzaGMnJZZdc50mbYPZ5Q_ZE-QCjDDRe2llIpMpGHkgKIOa1-IDCWjtYllW0Ap22mYOYbXxl584d5cvvt6x1jxjdiFzv9nXfJW2TKQ1Dc_EjKysk1sbk-UuZpMXGJTWA2GwTYTQtuMYeP-AUwQI39tF-SFF3vmcUHTwukDZsk5JSnGEJwsGfoWA0tfrA9R9ODAMeqLbJF0shKmroDnUeZZ1VvufD4V9R9CYaluQD7OsiNaQmVJ0mmtLUHbgBdyHtxI'
};

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Initialize language direction
  const langInfo = LANGS[currentLang];
  if (langInfo) {
    document.documentElement.setAttribute('dir', langInfo.dir);
    document.documentElement.setAttribute('lang', currentLang);
    document.body.classList.toggle('rtl', langInfo.dir === 'rtl');
  }

  initSplash();
  initNavigation();
  initDrawer();
  initScrollEffects();
  checkAuth();
});

// ── Splash ──
function initSplash() {
  const splash = document.getElementById('splash');
  if (splash) setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 600); }, 2000);
}

// ── Check auth on load ──
async function checkAuth() {
  try {
    const data = await api('/auth/me');
    if (data.authenticated) {
      state.authenticated = true;
      state.couple = data.couple;
      navigateTo('home');
    } else {
      navigateTo('auth');
    }
  } catch (e) {
    navigateTo('auth');
  }
}

// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════
function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });
}

function navigateTo(screenId) {
  const topBar = document.getElementById('topBar');
  const bottomNav = document.getElementById('bottomNav');
  const fab = document.getElementById('fab');

  // Auth, questionnaire and timeline-article screens hide shell
  const hideShell = ['auth', 'questionnaire', 'timeline-article'].includes(screenId);
  topBar.style.display = hideShell ? 'none' : 'flex';
  bottomNav.style.display = hideShell ? 'none' : 'flex';
  if (fab) fab.style.display = screenId === 'home' ? 'flex' : 'none';

  // Update bottom nav
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const isActive = item.dataset.nav === screenId;
    item.classList.toggle('active', isActive);
    const icon = item.querySelector('.material-symbols-outlined');
    icon.classList.toggle('icon-filled', isActive);
  });

  // Transition
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('visible');
    setTimeout(() => { current.classList.remove('active'); showScreen(screenId); }, 200);
  } else {
    showScreen(screenId);
  }

  state.currentScreen = screenId;
  if (!['questionnaire', 'auth'].includes(screenId)) window.location.hash = screenId;
}

function showScreen(screenId) {
  const screen = document.getElementById('screen-' + screenId);
  if (!screen) return;
  screen.classList.add('active');
  requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add('visible')));

  switch (screenId) {
    case 'home': renderHome(); break;
    case 'evaluations': renderResults(); break;
    case 'library': renderLibrary(); break;
    case 'profile': renderProfile(); break;
    case 'questionnaire': renderQuestionnaire(); break;
    case 'sage-femme': renderSageFemme(); break;
    case 'suivi': renderSuivi(); break;
    case 'new-couple': renderNewCouple(); break;
    case 'plan': renderPlan(); break;
    case 'checkup': renderCheckup(); break;
    case 'timeline-article': renderTimelineArticle(); break;
    case 'alerts': renderAlerts(); break;
    case 'admin': renderAdmin(); break;
    case 'semaines': renderSemaines(); break;
    case 'journal': renderJournal(); break;
    case 'echelles': renderEchelles(); break;
    case 'tounsi': renderTounsi(); break;
  }

  window.scrollTo(0, 0);
  setTimeout(() => initReveal(), 100);
}

// ── Drawer ──
function initDrawer() {
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
  });
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.querySelectorAll('[data-drawer-nav]').forEach(link => {
    link.addEventListener('click', () => { closeDrawer(); setTimeout(() => navigateTo(link.dataset.drawerNav), 300); });
  });
}
function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
}

// ── Scroll & Reveal ──
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const topBar = document.getElementById('topBar');
    if (topBar) topBar.classList.toggle('scrolled', window.scrollY > 10);
  });
}
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════════════════════
//  AUTH — LOGIN / REGISTER
// ══════════════════════════════════════════════════════════════
function showLogin() {
  const c = document.getElementById('auth-content');
  c.innerHTML = `
    <div class="text-center mb-3xl" style="padding-top:80px;">
      <span class="material-symbols-outlined icon-filled" style="font-size:56px;color:var(--primary);">child_care</span>
      <h1 class="text-display-lg-mobile text-primary mt-lg">${t('app_name')}</h1>
      <p class="text-body-lg text-variant mt-sm">${t('app_tagline')}</p>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>
    <div class="space-y-lg">
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">${t('auth_email')}</label>
        <input type="email" id="login-email" value="admin@nurtureflow.com"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">${t('auth_password')}</label>
        <input type="password" id="login-password" value="admin"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <button class="btn btn--primary btn--full mt-xl" onclick="doLogin()">
        <span class="material-symbols-outlined">login</span> ${t('auth_login')}
      </button>
      <div class="text-center mt-xl">
        <p class="text-body-md text-variant">${t('auth_no_account')}</p>
        <button class="text-primary text-semibold mt-sm" style="font-size:16px;" onclick="showRegister()">
          ${t('auth_create_account')}
        </button>
      </div>
      <div class="text-center mt-xl" style="padding-top:16px;border-top:1px solid var(--outline-variant);">
        <div style="display:flex;justify-content:center;gap:12px;">
          ${Object.entries(LANGS).map(([code, info]) => `
            <button onclick="switchLang('${code}')" style="padding:10px 18px;border-radius:var(--radius-xl);border:2px solid ${currentLang===code?'var(--primary)':'var(--outline-variant)'};background:${currentLang===code?'var(--primary-fixed)':'var(--surface-container-low)'};cursor:pointer;font-size:14px;font-family:inherit;font-weight:${currentLang===code?'700':'500'};color:${currentLang===code?'var(--primary)':'var(--on-surface)'};transition:all 0.15s;">
              ${info.flag} ${info.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function showRegister() {
  const c = document.getElementById('auth-content');
  c.innerHTML = `
    <div class="flex items-center gap-md mb-xl" style="padding-top:20px;">
      <button class="top-bar__btn" onclick="showLogin()"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm text-primary">${t('auth_create_title')}</h2>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>

    <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('auth_partner1')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name1" placeholder="${t('auth_firstname')}" class="form-input">
      <input type="email" id="reg-email" placeholder="${t('auth_email')}" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age1" placeholder="${t('auth_age')}" class="form-input">
        <select id="reg-sex1" class="form-input"><option value="Femme">${t('auth_woman')}</option><option value="Homme">${t('auth_man')}</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('auth_partner2')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name2" placeholder="${t('auth_firstname')}" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age2" placeholder="${t('auth_age')}" class="form-input">
        <select id="reg-sex2" class="form-input"><option value="Homme">${t('auth_man')}</option><option value="Femme">${t('auth_woman')}</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> ${t('auth_couple_info')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-marriage" placeholder="Durée du mariage (ex: 3 ans)" class="form-input">
      <input type="text" id="reg-baby" placeholder="Âge du bébé (ex: 4 mois)" class="form-input">
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> ${t('auth_security')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="password" id="reg-password" placeholder="${t('auth_password_min')}" class="form-input">
      <input type="password" id="reg-password2" placeholder="${t('auth_password_confirm')}" class="form-input">
    </div>

    <button class="btn btn--primary btn--full" onclick="doRegister()">
      <span class="material-symbols-outlined">how_to_reg</span> ${t('auth_create_btn')}
    </button>
    <div style="height:40px;"></div>
  `;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${msg}</span></div>`;
  }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAuthError('Veuillez remplir tous les champs');
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    state.authenticated = true;
    state.couple = data.couple;
    navigateTo('home');
  } catch (e) {
    showAuthError(e.message);
  }
}

async function doRegister() {
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  if (password !== password2) return showAuthError('Les mots de passe ne correspondent pas');

  const body = {
    partner1_name: document.getElementById('reg-name1').value.trim(),
    partner1_email: document.getElementById('reg-email').value.trim(),
    partner1_age: parseInt(document.getElementById('reg-age1').value) || 0,
    partner1_sex: document.getElementById('reg-sex1').value,
    partner2_name: document.getElementById('reg-name2').value.trim(),
    partner2_age: parseInt(document.getElementById('reg-age2').value) || 0,
    partner2_sex: document.getElementById('reg-sex2').value,
    marriage_duration: document.getElementById('reg-marriage').value.trim(),
    baby_age: document.getElementById('reg-baby').value.trim(),
    password
  };

  if (!body.partner1_name || !body.partner1_email || !password) return showAuthError('Nom, email et mot de passe sont obligatoires');

  try {
    const data = await api('/auth/register', { method: 'POST', body });
    state.authenticated = true;
    state.couple = data.couple;
    navigateTo('home');
  } catch (e) {
    showAuthError(e.message);
  }
}

async function doLogout() {
  closeDrawer();
  await api('/auth/logout', { method: 'POST' });
  state.authenticated = false;
  state.couple = null;
  navigateTo('auth');
  showLogin();
}

// ══════════════════════════════════════════════════════════════
//  NOUVEAU COUPLE (depuis l'intérieur de l'app)
// ══════════════════════════════════════════════════════════════
function renderNewCouple() {
  const c = document.getElementById('new-couple-content');
  c.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div>
        <h2 class="text-headline-sm text-primary">Créer un nouveau couple</h2>
        <p class="text-body-md text-variant">Enregistrer un couple dans la base</p>
      </div>
    </div>

    <div id="new-couple-msg" class="mb-lg" style="display:none;"></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 1
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name1" placeholder="Prénom" class="form-input">
        <input type="email" id="nc-email" placeholder="Email" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age1" placeholder="Âge" class="form-input">
          <select id="nc-sex1" class="form-input"><option value="Femme">Femme</option><option value="Homme">Homme</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 2
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name2" placeholder="Prénom" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age2" placeholder="Âge" class="form-input">
          <select id="nc-sex2" class="form-input"><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> INFORMATIONS COUPLE
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-marriage" placeholder="Durée du mariage (ex: 3 ans)" class="form-input">
        <input type="text" id="nc-baby" placeholder="Âge du bébé (ex: 4 mois)" class="form-input">
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> SÉCURITÉ
      </h3>
      <div class="space-y-md">
        <input type="password" id="nc-password" placeholder="Mot de passe (min 4 caractères)" class="form-input">
        <input type="password" id="nc-password2" placeholder="Confirmer le mot de passe" class="form-input">
      </div>
    </div></div>

    <button class="btn btn--primary btn--full mb-xl" id="nc-submit-btn" onclick="createNewCouple()">
      <span class="material-symbols-outlined">group_add</span> Créer le couple
    </button>
    <div style="height:40px;"></div>
  `;
}

async function createNewCouple() {
  const password = document.getElementById('nc-password').value;
  const password2 = document.getElementById('nc-password2').value;
  const msgEl = document.getElementById('new-couple-msg');

  if (password !== password2) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = '<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>Les mots de passe ne correspondent pas</span></div>';
    return;
  }

  const body = {
    partner1_name: document.getElementById('nc-name1').value.trim(),
    partner1_email: document.getElementById('nc-email').value.trim(),
    partner1_age: parseInt(document.getElementById('nc-age1').value) || 0,
    partner1_sex: document.getElementById('nc-sex1').value,
    partner2_name: document.getElementById('nc-name2').value.trim(),
    partner2_age: parseInt(document.getElementById('nc-age2').value) || 0,
    partner2_sex: document.getElementById('nc-sex2').value,
    marriage_duration: document.getElementById('nc-marriage').value.trim(),
    baby_age: document.getElementById('nc-baby').value.trim(),
    password
  };

  if (!body.partner1_name || !body.partner1_email || !password) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = '<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>Prénom, email et mot de passe sont obligatoires</span></div>';
    return;
  }

  const btn = document.getElementById('nc-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Création en cours...';

  try {
    // Save current admin email
    const adminEmail = state.couple.partner1_email;

    // Register the new couple (this logs us in as the new couple)
    await api('/auth/register', { method: 'POST', body });

    // Re-login as admin
    await api('/auth/login', { method: 'POST', body: { email: adminEmail, password: 'admin' } });

    msgEl.style.display = 'block';
    msgEl.innerHTML = `
      <div class="alert-banner" style="background:var(--primary-container);border:1px solid var(--primary);">
        <span class="material-symbols-outlined text-primary">check_circle</span>
        <div>
          <strong class="text-primary">Couple créé avec succès !</strong>
          <p class="text-body-md mt-sm"><strong>${body.partner1_name}</strong> & <strong>${body.partner2_name || '—'}</strong></p>
          <p class="text-body-md text-variant">${body.partner1_email}</p>
        </div>
      </div>
    `;
    btn.innerHTML = '<span class="material-symbols-outlined">check</span> Couple créé !';
    btn.style.background = 'var(--primary-container)';
    btn.style.color = 'var(--on-primary-container)';

    setTimeout(() => renderNewCouple(), 3000);
  } catch (e) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${e.message}</span></div>`;
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">group_add</span> Créer le couple';
  }
}

// ══════════════════════════════════════════════════════════════
//  HOME / DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderHome() {
  if (!state.couple) return;

  // Update name
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = `${t('home_hello')}, ${state.couple.partner1_name}`;

  // Show admin link if admin
  const adminLink = document.getElementById('drawer-admin-link');
  if (adminLink) {
    adminLink.style.display = state.couple.partner1_email === 'admin@nurtureflow.com' ? 'flex' : 'none';
  }

  // Update drawer
  const drawerName = document.getElementById('drawer-name');
  if (drawerName) drawerName.textContent = state.couple.partner1_name;
  const drawerSub = document.getElementById('drawer-sub');
  if (drawerSub) drawerSub.textContent = state.couple.marriage_duration ? `${t('drawer_couple_since')} ${state.couple.marriage_duration}` : t('drawer_welcome');

  // Update current lang label
  const langLabel = document.getElementById('current-lang-label');
  if (langLabel) langLabel.textContent = LANGS[currentLang]?.label || 'Français';

  try {
    const data = await api('/dashboard');
    state.scores = data.scores;

    // Progress circle
    const circle = document.getElementById('home-progress-circle');
    const valEl = document.getElementById('home-progress-value');
    const score = data.globalScore || 0;
    if (circle) {
      const c = 2 * Math.PI * 28;
      circle.setAttribute('stroke-dasharray', c);
      circle.setAttribute('stroke-dashoffset', c - (score / 100) * c);
    }
    if (valEl) valEl.textContent = score + '%';

    // Progress text
    const progText = document.getElementById('home-progress-text');
    if (progText) progText.textContent = `${data.completedTypes}/3 évaluations complétées`;

    // Latest eval
    const latestEl = document.getElementById('home-latest-eval');
    if (latestEl && data.latestEval) {
      const d = new Date(data.latestEval.created_at);
      const ago = getTimeAgo(d);
      latestEl.innerHTML = `
        <div class="flex justify-between items-center mb-md">
          <h3 class="text-headline-sm" style="color:var(--on-surface);">Dernière Évaluation</h3>
          <span class="text-label-lg text-variant" style="font-style:italic;">${ago}</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:var(--space-md);padding:var(--space-lg);background:var(--surface);border-radius:var(--radius-lg);">
          <span class="material-symbols-outlined text-primary" style="margin-top:2px;">assignment_turned_in</span>
          <div>
            <p class="text-body-lg text-semibold" style="color:var(--on-surface);">${capitalize(data.latestEval.type)}</p>
            <p class="text-body-md text-variant">Score : ${data.latestEval.score}/100</p>
          </div>
        </div>
      `;
    } else if (latestEl) {
      latestEl.innerHTML = `
        <h3 class="text-headline-sm mb-md" style="color:var(--on-surface);">Première Évaluation</h3>
        <p class="text-body-md text-variant">Commencez votre première évaluation pour découvrir votre profil de couple.</p>
      `;
    }
  } catch (e) { console.error('Dashboard error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  QUESTIONNAIRE
// ══════════════════════════════════════════════════════════════
function startQuestionnaire(type) {
  state.currentQuestionnaireType = type;
  state.currentQuestion = 0;
  state.answers[type] = [];
  navigateTo('questionnaire');
}

function renderQuestionnaire() {
  const type = state.currentQuestionnaireType;
  if (!type) return;
  const qData = getQuestionnaires()[type];
  const qi = state.currentQuestion;
  const q = qData.questions[qi];
  const total = qData.questions.length;
  const progress = ((qi + 1) / total) * 100;
  const answered = state.answers[type] && state.answers[type][qi] !== undefined;

  const c = document.getElementById('questionnaire-content');
  c.innerHTML = `
    <div class="questionnaire-header">
      <button class="top-bar__btn" onclick="exitQuestionnaire()"><span class="material-symbols-outlined">close</span></button>
      <div class="questionnaire-header__center">
        <span class="questionnaire-header__label">${qData.title}</span>
        <span class="questionnaire-header__progress-text">Question ${qi + 1}/${total}</span>
      </div>
      <div style="width:40px"></div>
    </div>
    <div style="padding:0 var(--margin-mobile);">
      <div class="progress-bar mb-3xl" style="margin-top:16px;"><div class="progress-bar__fill" style="width:${progress}%"></div></div>
      <div class="animate-fade-in" style="min-height:160px;">
        <h1 class="text-headline-md mb-md" style="color:var(--on-surface)">${q.q}</h1>
        <p class="text-body-md text-variant">${q.hint}</p>
      </div>
      <div class="space-y-md mt-xl" id="likert-options">
        ${getLikertOptions().map(opt => {
          const sel = answered && state.answers[type][qi] === opt.value;
          return `<button class="likert-option ${sel ? 'selected' : ''}" data-value="${opt.value}">
            <span>${opt.label}</span>
            <span class="material-symbols-outlined" data-icon-radio="true">${sel ? 'check_circle' : 'radio_button_unchecked'}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="flex gap-lg mt-3xl" style="padding-bottom:20px;">
        <button class="btn btn--outline" style="flex:1;${qi === 0 ? 'opacity:0.3;' : ''}" onclick="prevQuestion()" ${qi === 0 ? 'disabled' : ''}>${t('q_previous')}</button>
        <button class="btn btn--primary" style="flex:1;" id="nextQuestionBtn" onclick="nextQuestion()" ${answered ? '' : 'disabled'}>${qi === total - 1 ? t('q_finish') : t('q_next')}</button>
      </div>
    </div>
  `;

  document.querySelectorAll('#likert-options .likert-option').forEach(btn => {
    btn.addEventListener('click', function () { selectLikert(parseInt(this.dataset.value), this); });
  });
}

function selectLikert(value, element) {
  const type = state.currentQuestionnaireType;
  if (!state.answers[type]) state.answers[type] = [];
  state.answers[type][state.currentQuestion] = value;

  document.querySelectorAll('#likert-options .likert-option').forEach(opt => {
    opt.classList.remove('selected');
    const ico = opt.querySelector('[data-icon-radio]');
    if (ico) ico.textContent = 'radio_button_unchecked';
  });
  element.classList.add('selected');
  const selIco = element.querySelector('[data-icon-radio]');
  if (selIco) selIco.textContent = 'check_circle';

  const btn = document.getElementById('nextQuestionBtn');
  if (btn) { btn.disabled = false; btn.removeAttribute('disabled'); }
  element.style.transform = 'scale(0.96)';
  setTimeout(() => { element.style.transform = ''; }, 150);
}

async function nextQuestion() {
  const type = state.currentQuestionnaireType;
  const total = getQuestionnaires()[type].questions.length;
  if (state.currentQuestion < total - 1) {
    state.currentQuestion++;
    renderQuestionnaire();
  } else {
    // Calculate & save to backend
    const answers = state.answers[type];
    const maxScore = total * 5;
    const totalScore = answers.reduce((s, v) => s + (v || 0), 0);
    const score = Math.round((totalScore / maxScore) * 100);
    state.scores[type] = score;

    try {
      await api('/evaluations', { method: 'POST', body: { type, answers, score } });
    } catch (e) { console.error('Save eval error:', e); }

    navigateTo('evaluations');
  }
}

function prevQuestion() { if (state.currentQuestion > 0) { state.currentQuestion--; renderQuestionnaire(); } }
function exitQuestionnaire() { navigateTo('home'); }

// ══════════════════════════════════════════════════════════════
//  RESULTS
// ══════════════════════════════════════════════════════════════
async function renderResults() {
  try {
    const data = await api('/evaluations/scores');
    const globalScore = data.global;
    const level = data.level;

    // Gauge
    const gaugeCircle = document.getElementById('results-gauge');
    if (gaugeCircle) {
      const c = 2 * Math.PI * 80;
      gaugeCircle.style.transition = 'none';
      gaugeCircle.setAttribute('stroke-dasharray', c);
      gaugeCircle.setAttribute('stroke-dashoffset', c);
      requestAnimationFrame(() => {
        gaugeCircle.style.transition = 'stroke-dashoffset 1.5s ease';
        gaugeCircle.setAttribute('stroke-dashoffset', c - (globalScore / 100) * c);
      });
    }

    const valEl = document.getElementById('results-global-value');
    if (valEl) valEl.textContent = globalScore + '%';

    const badgeEl = document.getElementById('results-badge');
    if (badgeEl) {
      const cls = globalScore >= 75 ? 'excellent' : globalScore >= 55 ? 'bon' : globalScore >= 35 ? 'moyen' : 'faible';
      badgeEl.className = `badge badge--${cls}`;
      badgeEl.innerHTML = `<span class="material-symbols-outlined icon-filled" style="font-size:14px;">stars</span> ${level}`;
    }

    ['psychologique', 'conjugal', 'sexuel'].forEach(type => {
      const score = data.scores[type] || 0;
      const bar = document.getElementById(`bar-${type}`);
      const val = document.getElementById(`val-${type}`);
      if (bar) { bar.style.width = '0'; setTimeout(() => { bar.style.width = score + '%'; }, 300); }
      if (val) val.textContent = score + '%';
    });

    // Explanation
    const explEl = document.getElementById('results-explanation');
    if (explEl) {
      if (data.totalEvals === 0) {
        explEl.innerHTML = 'Complétez vos premières évaluations pour recevoir une analyse personnalisée.';
      } else {
        let text = 'Votre relation traverse cette phase de transition ';
        if (globalScore >= 75) text += 'avec une grande résilience. ';
        else if (globalScore >= 55) text += 'de manière positive. ';
        else text += 'avec quelques défis à relever. ';

        const s = data.scores;
        if (s.psychologique > 0) {
          if (s.psychologique >= 70) text += `Excellent bien-être psychologique (${s.psychologique}%). `;
          else if (s.psychologique < 40) text += `Votre bien-être psychologique (${s.psychologique}%) nécessite une attention particulière. `;
        }
        if (s.conjugal > 0 && s.conjugal < 50) text += `La dimension conjugale (${s.conjugal}%) pourrait être renforcée. `;
        if (s.sexuel > 0 && s.sexuel < 40) text += `La dimension intime (${s.sexuel}%) mérite un accompagnement. `;
        explEl.innerHTML = text;
      }
    }

    // Alerts
    const alertC = document.getElementById('alert-container');
    if (alertC) {
      alertC.innerHTML = '';
      const low = Object.entries(data.scores).filter(([_, v]) => v > 0 && v < 40).map(([k]) => k);
      if (low.length > 0) {
        alertC.innerHTML = `<div class="alert-banner alert-banner--warning"><span class="material-symbols-outlined">warning</span><div><strong>Orientation recommandée</strong><p class="text-body-md mt-sm">Score ${low.join(' et ')} faible. Consultez un professionnel.</p></div></div>`;
      }
    }
  } catch (e) { console.error('Results error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  LIBRARY
// ══════════════════════════════════════════════════════════════
async function renderLibrary() {
  // Timeline toggles
  document.querySelectorAll('.timeline-toggle__btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      document.querySelectorAll('.timeline-toggle__btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const period = this.dataset.timeline;
      await loadTimelineArticles(period);
    });
  });

  // Category chips
  document.querySelectorAll('[data-category]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('[data-category]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      filterTimelineByCategory(this.dataset.category);
    });
  });

  // Load initial timeline content
  await loadTimelineArticles('0-3');
}

async function loadTimelineArticles(period) {
  try {
    const data = await api(`/timeline/${period}`);
    const articlesContainer = document.getElementById('timeline-dynamic-articles');
    if (!articlesContainer) {
      // Create dynamic articles container after static content
      const libraryScreen = document.getElementById('screen-library');
      let dynDiv = document.createElement('div');
      dynDiv.id = 'timeline-dynamic-articles';
      dynDiv.className = 'mt-xl reveal';
      // Insert before article-featured or at end
      const featuredEl = libraryScreen.querySelector('.article-featured');
      if (featuredEl) {
        featuredEl.parentNode.insertBefore(dynDiv, featuredEl);
      } else {
        libraryScreen.appendChild(dynDiv);
      }
    }

    const container = document.getElementById('timeline-dynamic-articles');
    if (!container) return;

    container.innerHTML = `
      <h3 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">schedule</span> ${t('lib_content_period')} ${period} ${t('lib_months')}
      </h3>
      <div class="space-y-md" id="timeline-articles-list">
        ${data.articles.map(a => `
          <div class="article-horizontal timeline-filterable" data-article-category="${a.category}" style="cursor:pointer;" onclick="openTimelineArticle('${a.id}','${period}')">
            <div style="width:64px;height:64px;border-radius:var(--radius-xl);background:var(--primary-fixed);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-symbols-outlined text-primary" style="font-size:28px;">${a.icon}</span>
            </div>
            <div style="flex:1;">
              <h4 class="text-headline-sm" style="font-size:15px;">${a.title}</h4>
              <div class="flex items-center gap-md mt-sm">
                <span class="text-label-md text-variant">${a.category}</span>
                <span class="text-label-md text-outline flex items-center gap-sm">
                  <span class="material-symbols-outlined" style="font-size:14px;">schedule</span> ${a.readTime} min
                </span>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        `).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) { console.error('Timeline articles error:', e); }
}

function filterTimelineByCategory(category) {
  document.querySelectorAll('.timeline-filterable').forEach(el => {
    if (category === 'tous' || el.dataset.articleCategory === category) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════
async function renderProfile() {
  if (!state.couple) return;
  try {
    const data = await api('/profile');
    const c = data.couple;
    const s = data.stats;

    document.getElementById('profile-name').textContent = c.partner1_name + (c.partner2_name ? ' & ' + c.partner2_name : '');
    document.getElementById('profile-email').textContent = c.partner1_email;
    document.getElementById('profile-eval-count').textContent = s.evaluations;
    document.getElementById('profile-articles-count').textContent = s.articles_read;
    document.getElementById('profile-streak').textContent = s.streak;
    document.getElementById('profile-age').textContent = c.partner1_age ? c.partner1_age + ' ans' : '-';
    document.getElementById('profile-sex').textContent = c.partner1_sex || '-';
    document.getElementById('profile-marriage').textContent = c.marriage_duration || '-';
    document.getElementById('profile-baby').textContent = c.baby_age || '-';
    document.getElementById('profile-partner2').textContent = c.partner2_name ? `${c.partner2_name}, ${c.partner2_age || '?'} ans` : 'Non renseigné';
  } catch (e) { console.error('Profile error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  SAGE-FEMME
// ══════════════════════════════════════════════════════════════
function renderSageFemme() {
  const container = document.getElementById('sage-femme-content');
  if (!container) return;
  let html = `
    <div class="chips-scroll mb-xl">
      <button class="chip chip--tonal active" data-sf-cat="tous" onclick="filterSF('tous',this)">${t('sf_all')}</button>
      <button class="chip chip--tonal" data-sf-cat="post-partum" onclick="filterSF('post-partum',this)">${t('sf_postpartum')}</button>
      <button class="chip chip--tonal" data-sf-cat="allaitement" onclick="filterSF('allaitement',this)">${t('sf_breastfeeding')}</button>
      <button class="chip chip--tonal" data-sf-cat="contraception" onclick="filterSF('contraception',this)">${t('sf_contraception')}</button>
      <button class="chip chip--tonal" data-sf-cat="sexualite" onclick="filterSF('sexualite',this)">${t('sf_sexuality')}</button>
      <button class="chip chip--tonal" data-sf-cat="alerte" onclick="filterSF('alerte',this)">${t('sf_alerts')}</button>
    </div>
    <div class="space-y-lg" id="sf-messages">`;
  getSageFemmeTips().forEach((tip, i) => {
    html += `<div class="chat-bubble chat-bubble--bot reveal" data-cat="${tip.cat}" style="animation-delay:${i * 0.1}s">
      <div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary">${tip.icon}</span><strong class="text-body-lg text-semibold">${tip.title}</strong></div>
      <p class="text-body-md" style="line-height:1.7">${tip.text}</p></div>`;
  });
  container.innerHTML = html + '</div>';
  setTimeout(() => initReveal(), 50);
}
function filterSF(cat, btn) {
  document.querySelectorAll('[data-sf-cat]').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#sf-messages .chat-bubble').forEach(b => {
    b.style.display = (cat === 'tous' || b.dataset.cat === cat) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════
//  SUIVI QUOTIDIEN
// ══════════════════════════════════════════════════════════════
async function renderSuivi() {
  const container = document.getElementById('suivi-content');
  if (!container) return;

  let entries = [];
  try {
    const data = await api('/daily');
    entries = data.entries || [];
  } catch (e) { console.error(e); }

  const chartData = entries.slice(0, 7).reverse();
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  container.innerHTML = `
    <h2 class="text-headline-sm mb-md">${t('daily_title')}</h2>
    <p class="text-body-md text-variant mb-xl">${t('daily_subtitle')}</p>

    <div class="card card--flat mb-xl"><div class="card__body">
      <p class="text-label-lg text-variant mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">HUMEUR DU JOUR</p>
      <div class="mood-grid">
        ${['😫|Épuisé', '😔|Triste', '😐|Neutre', '😊|Bien', '😄|Super'].map(m => {
          const [emoji, label] = m.split('|');
          return `<button class="mood-option" onclick="selectMood('${emoji}',this)"><span class="mood-option__emoji">${emoji}</span><span class="mood-option__label">${label}</span></button>`;
        }).join('')}
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <div class="slider-container"><label><span>Niveau de stress</span><span><span id="stress-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-stress" oninput="document.getElementById('stress-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>Satisfaction conjugale</span><span><span id="conj-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-conj" oninput="document.getElementById('conj-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>Satisfaction intime</span><span><span id="intime-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-intime" oninput="document.getElementById('intime-val').textContent=this.value"></div>
    </div></div>

    <button class="btn btn--primary btn--full mb-3xl" id="save-daily-btn" onclick="saveDailyEntry()">
      <span class="material-symbols-outlined">save</span> Enregistrer mon suivi
    </button>

    ${chartData.length > 0 ? `
    <div class="mini-chart mb-xl reveal">
      <h3 class="text-headline-sm mb-lg">Évolution récente</h3>
      <svg viewBox="0 0 340 180" style="width:100%;">
        ${[0,1,2,3,4].map(i => `<line x1="40" y1="${20+i*35}" x2="330" y2="${20+i*35}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="4"/>`).join('')}
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.stress*14}`).join(' ')}" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.satisfaction_conjugale*14}`).join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"/>
        ${chartData.map((d,i) => `<circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.satisfaction_conjugale*14}" r="4" fill="var(--primary)"/><circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.stress*14}" r="3" fill="var(--error)" opacity="0.7"/>`).join('')}
        ${chartData.map((d,i) => `<text x="${40+i*(290/Math.max(chartData.length-1,1))}" y="178" text-anchor="middle" font-size="10" fill="var(--on-surface-variant)">${d.day_name||days[new Date(d.created_at).getDay()]}</text>`).join('')}
      </svg>
      <div class="flex justify-center gap-xl mt-md">
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--primary);border-radius:2px;display:block"></span><span class="text-label-md text-variant">Satisfaction</span></div>
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--error);border-radius:2px;display:block;opacity:0.7"></span><span class="text-label-md text-variant">Stress</span></div>
      </div>
    </div>` : ''}

    <h3 class="text-headline-sm mb-lg">Historique récent</h3>
    <div class="space-y-md">
      ${entries.length > 0 ? entries.slice(0, 7).map(e => `
        <div class="daily-entry">
          <span class="daily-entry__date">${e.day_name || ''}</span>
          <span style="font-size:24px;">${e.mood}</span>
          <div style="flex:1;"><div class="flex justify-between text-label-md">
            <span class="text-variant">Stress: ${e.stress}/10</span>
            <span class="text-primary">Conj: ${e.satisfaction_conjugale}/10</span>
          </div></div>
        </div>
      `).join('') : '<p class="text-body-md text-variant text-center">Aucune entrée. Commencez votre suivi ci-dessus !</p>'}
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

function selectMood(emoji, el) {
  document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  state.currentMood = emoji;
}

async function saveDailyEntry() {
  const body = {
    mood: state.currentMood || '😊',
    stress: parseInt(document.getElementById('slider-stress')?.value || 5),
    satisfaction_conjugale: parseInt(document.getElementById('slider-conj')?.value || 5),
    satisfaction_intime: parseInt(document.getElementById('slider-intime')?.value || 5)
  };

  const btn = document.getElementById('save-daily-btn');
  try {
    await api('/daily', { method: 'POST', body });
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">check</span> Enregistré !';
      btn.style.background = 'var(--primary-container)';
      btn.style.color = 'var(--on-primary-container)';
      setTimeout(() => renderSuivi(), 1500);
    }
  } catch (e) {
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">error</span> Erreur';
  }
}

// ══════════════════════════════════════════════════════════════
//  PLAN PERSONNALISÉ
// ══════════════════════════════════════════════════════════════
let currentPlanDuration = 14;

async function renderPlan() {
  const container = document.getElementById('plan-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <div style="width:48px;height:48px;border-radius:var(--radius-full);background:var(--primary-fixed);display:flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined text-primary icon-filled">route</span>
      </div>
      <div><h2 class="text-headline-sm">Plan Personnalisé</h2><p class="text-body-md text-variant">Exercices et conseils adaptés à vos scores</p></div>
    </div>

    <div class="plan-duration-selector">
      <button class="plan-duration-card ${currentPlanDuration===7?'active':''}" onclick="selectPlanDuration(7)">
        <span class="plan-duration-card__days">7</span>
        <span class="plan-duration-card__label">jours</span>
      </button>
      <button class="plan-duration-card ${currentPlanDuration===14?'active':''}" onclick="selectPlanDuration(14)">
        <span class="plan-duration-card__days">14</span>
        <span class="plan-duration-card__label">jours</span>
      </button>
      <button class="plan-duration-card ${currentPlanDuration===30?'active':''}" onclick="selectPlanDuration(30)">
        <span class="plan-duration-card__days">30</span>
        <span class="plan-duration-card__label">jours</span>
      </button>
    </div>

    <div id="plan-details"><div class="text-center"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div></div>
  `;

  loadPlanDetails();
}

async function selectPlanDuration(d) {
  currentPlanDuration = d;
  document.querySelectorAll('.plan-duration-card').forEach(c => {
    c.classList.toggle('active', parseInt(c.querySelector('.plan-duration-card__days').textContent) === d);
  });
  loadPlanDetails();
}

async function loadPlanDetails() {
  const detailsEl = document.getElementById('plan-details');
  if (!detailsEl) return;

  try {
    const data = await api(`/plan/${currentPlanDuration}`);
    const plan = data.plan;
    const completedDays = data.completedDays || [];
    const progress = plan.activities.length > 0
      ? Math.round((completedDays.length / plan.activities.length) * 100) : 0;

    let focusBanner = '';
    if (data.focusAreas.length > 0) {
      const areaLabels = { psychologique: 'bien-être psychologique', communication: 'communication conjugale', 'post-partum': 'accompagnement post-partum' };
      focusBanner = `
        <div class="plan-focus-banner reveal">
          <div class="flex items-center gap-md mb-md">
            <span class="material-symbols-outlined text-primary">tips_and_updates</span>
            <strong class="text-body-lg">Axes prioritaires</strong>
          </div>
          <p class="text-body-md text-variant">Basé sur vos scores, nous recommandons de vous concentrer sur : <strong>${data.focusAreas.map(a => areaLabels[a] || a).join(', ')}</strong>.</p>
        </div>`;
    }

    detailsEl.innerHTML = `
      <div class="card card--flat mb-xl reveal">
        <div class="card__body">
          <h3 class="text-headline-sm mb-sm">${plan.title}</h3>
          <p class="text-body-md text-variant mb-lg">${plan.description}</p>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${progress}%"></div></div>
          <p class="text-label-md text-variant mt-sm">${completedDays.length}/${plan.activities.length} activités complétées (${progress}%)</p>
        </div>
      </div>

      ${focusBanner}

      <h3 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">checklist</span> ACTIVITÉS
      </h3>
      <div class="space-y-md">
        ${plan.activities.map(a => {
          const done = completedDays.includes(a.day);
          return `
            <div class="plan-activity ${done?'completed':''} reveal" id="plan-act-${a.day}">
              <div class="plan-activity__day"><span>J${a.day}</span></div>
              <div class="plan-activity__body">
                <div class="flex items-center gap-sm">
                  <span class="material-symbols-outlined" style="font-size:18px;color:var(--primary);">${a.icon}</span>
                  <span class="plan-activity__title">${a.title}</span>
                </div>
                <p class="plan-activity__desc">${a.desc}</p>
              </div>
              <button class="plan-activity__check ${done?'checked':''}" onclick="completePlanActivity(${currentPlanDuration},${a.day},this)">
                <span class="material-symbols-outlined" style="font-size:20px;">${done?'check':'radio_button_unchecked'}</span>
              </button>
            </div>`;
        }).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    detailsEl.innerHTML = '<p class="text-body-md text-variant text-center">Erreur de chargement du plan.</p>';
  }
}

async function completePlanActivity(duration, day, btn) {
  if (btn.classList.contains('checked')) return;
  try {
    await api('/plan/complete', { method: 'POST', body: { duration, day } });
    btn.classList.add('checked');
    btn.querySelector('.material-symbols-outlined').textContent = 'check';
    const actEl = document.getElementById(`plan-act-${day}`);
    if (actEl) actEl.classList.add('completed');
    // Reload to update progress
    setTimeout(() => loadPlanDetails(), 500);
  } catch (e) { console.error(e); }
}

// ══════════════════════════════════════════════════════════════
//  COUPLE CHECK-UP
// ══════════════════════════════════════════════════════════════
async function renderCheckup() {
  const container = document.getElementById('checkup-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span><p class="text-body-md text-variant mt-lg">Génération du bilan...</p></div>';

  try {
    const data = await api('/checkup');
    const date = new Date(data.generatedAt);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const trendIcon = { up: 'trending_up', down: 'trending_down', stable: 'trending_flat', new: 'new_releases' };
    const trendLabel = { up: '↑ En hausse', down: '↓ En baisse', stable: '= Stable', new: 'Nouveau' };
    const typeLabels = { psychologique: 'Psychologique', conjugal: 'Conjugal', sexuel: 'Sexuel' };
    const typeIcons = { psychologique: 'psychology', conjugal: 'favorite', sexuel: 'diversity_3' };

    let evolutionSVG = '';
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const colors = { psychologique: 'var(--secondary)', conjugal: 'var(--primary)', sexuel: 'var(--tertiary)' };
    const allEvols = types.map(t => data.evolution[t] || []);
    const maxPoints = Math.max(...allEvols.map(e => e.length), 1);

    if (maxPoints > 1) {
      const svgW = 300, svgH = 140, pad = 30;
      const lines = types.map((t, ti) => {
        const pts = data.evolution[t];
        if (pts.length < 2) return '';
        return `<polyline points="${pts.map((p,i) => `${pad+i*((svgW-2*pad)/Math.max(pts.length-1,1))},${svgH-pad-((p.score/100)*(svgH-2*pad))}`).join(' ')}" fill="none" stroke="${colors[t]}" stroke-width="2.5" stroke-linecap="round" opacity="${ti===0?'0.7':'1'}"/>
        ${pts.map((p,i) => `<circle cx="${pad+i*((svgW-2*pad)/Math.max(pts.length-1,1))}" cy="${svgH-pad-((p.score/100)*(svgH-2*pad))}" r="3.5" fill="${colors[t]}"/>`).join('')}`;
      }).join('');

      evolutionSVG = `
        <div class="card card--flat mb-xl reveal"><div class="card__body">
          <h3 class="text-headline-sm mb-lg flex items-center gap-sm"><span class="material-symbols-outlined text-primary">show_chart</span> Évolution des scores</h3>
          <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;">
            ${[0,25,50,75,100].map(v => `<line x1="${pad}" y1="${svgH-pad-(v/100*(svgH-2*pad))}" x2="${svgW-pad}" y2="${svgH-pad-(v/100*(svgH-2*pad))}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="4"/><text x="${pad-5}" y="${svgH-pad-(v/100*(svgH-2*pad))+4}" text-anchor="end" font-size="9" fill="var(--outline)">${v}</text>`).join('')}
            ${lines}
          </svg>
          <div class="flex justify-center gap-xl mt-md">
            ${types.map(t => `<div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:${colors[t]};border-radius:2px;display:block"></span><span class="text-label-md text-variant">${typeLabels[t]}</span></div>`).join('')}
          </div>
        </div></div>`;
    }

    container.innerHTML = `
      <div class="checkup-header reveal">
        <div style="position:relative;z-index:1;">
          <span class="text-label-lg" style="opacity:0.8;">BILAN MENSUEL</span>
          <h2 class="text-headline-md mt-sm" style="color:white;">${data.couple.partner1_name}${data.couple.partner2_name ? ' & ' + data.couple.partner2_name : ''}</h2>
          <p class="text-body-md mt-sm" style="opacity:0.8;">${dateStr}</p>
          <div style="margin-top:var(--space-xl);display:flex;align-items:baseline;gap:var(--space-md);">
            <span style="font-size:48px;font-weight:700;">${data.globalScore}%</span>
            <span style="opacity:0.8;">Score Global</span>
          </div>
        </div>
      </div>

      <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
        SCORES PAR DIMENSION
      </h3>
      <div class="mb-xl reveal">
        ${types.map(t => `
          <div class="checkup-score-row">
            <div class="flex items-center gap-md">
              <span class="material-symbols-outlined text-primary">${typeIcons[t]}</span>
              <div>
                <span class="text-body-lg text-semibold">${typeLabels[t]}</span>
                <span class="text-headline-sm text-primary" style="margin-left:var(--space-md);">${data.currentScores[t]}%</span>
              </div>
            </div>
            <span class="trend-indicator trend-indicator--${data.trends[t]}">
              <span class="material-symbols-outlined" style="font-size:16px;">${trendIcon[data.trends[t]]}</span>
              ${trendLabel[data.trends[t]]}
            </span>
          </div>
        `).join('')}
      </div>

      ${evolutionSVG}

      ${data.recommendations.length > 0 ? `
        <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
          RECOMMANDATIONS
        </h3>
        <div class="space-y-md mb-xl reveal">
          ${data.recommendations.map(r => `
            <div class="recommendation-card recommendation-card--${r.priority}">
              <span class="material-symbols-outlined" style="color:${r.priority==='high'?'var(--error)':r.priority==='medium'?'var(--secondary)':'var(--primary)'};margin-top:2px;">${r.icon}</span>
              <p class="text-body-md">${r.text}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <button class="btn btn--primary btn--full mb-xl reveal" onclick="navigateTo('plan')">
        <span class="material-symbols-outlined">route</span> Commencer un Plan Personnalisé
      </button>

      <button class="btn btn--outline btn--full mb-xl reveal" onclick="navigateTo('evaluations')">
        <span class="material-symbols-outlined">assignment</span> Voir les résultats détaillés
      </button>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = '<p class="text-body-md text-variant text-center">Complétez au moins une évaluation pour générer votre bilan.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
//  TIMELINE ARTICLE VIEWER
// ══════════════════════════════════════════════════════════════
let timelineArticleData = null;

function openTimelineArticle(articleId, period) {
  timelineArticleData = { articleId, period };
  navigateTo('timeline-article');
}

async function renderTimelineArticle() {
  const container = document.getElementById('timeline-article-content');
  if (!container || !timelineArticleData) return;

  try {
    const data = await api(`/timeline/${timelineArticleData.period}`);
    const article = data.articles.find(a => a.id === timelineArticleData.articleId);
    if (!article) throw new Error('Article non trouvé');

    container.innerHTML = `
      <div class="timeline-article-viewer__header reveal">
        <button class="top-bar__btn" style="color:white;margin-bottom:var(--space-lg);" onclick="navigateTo('library')">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="flex items-center gap-sm mb-md">
          <span class="material-symbols-outlined icon-filled" style="font-size:28px;">${article.icon}</span>
          <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:var(--radius-full);font-size:11px;font-weight:600;">${article.category}</span>
        </div>
        <h1 class="text-headline-md">${article.title}</h1>
        <p class="text-body-md mt-sm" style="opacity:0.8;">
          <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">schedule</span> ${article.readTime} min de lecture • Période ${timelineArticleData.period} mois
        </p>
      </div>
      <div class="timeline-article-viewer__body reveal" style="padding:0 var(--space-sm);">
        <p style="font-size:16px;line-height:1.9;color:var(--on-surface);">${article.content}</p>
      </div>
      <div class="mt-3xl reveal">
        <button class="btn btn--outline btn--full" onclick="navigateTo('library')">
          <span class="material-symbols-outlined">arrow_back</span> Retour à la bibliothèque
        </button>
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = '<p class="text-body-md text-variant text-center">Article non trouvé.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
//  ALERTES SYSTÈME
// ══════════════════════════════════════════════════════════════
async function renderAlerts() {
  const container = document.getElementById('alerts-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-3xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div>';

  try {
    const data = await api('/alerts');

    if (data.alerts.length === 0) {
      container.innerHTML = `
        <div class="flex items-center gap-md mb-xl">
          <div style="width:48px;height:48px;border-radius:var(--radius-full);background:var(--primary-fixed);display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-primary icon-filled">notifications_active</span>
          </div>
          <div><h2 class="text-headline-sm">Alertes & Orientation</h2><p class="text-body-md text-variant">Suivi intelligent de votre bien-être</p></div>
        </div>
        <div class="alerts-empty reveal">
          <span class="material-symbols-outlined icon-filled alerts-empty__icon">verified</span>
          <h3 class="text-headline-sm mb-md">Tout va bien ! ✨</h3>
          <p class="text-body-md text-variant">Aucune alerte pour le moment. Continuez votre suivi régulier.</p>
          <button class="btn btn--primary mt-xl" onclick="navigateTo('home')">
            <span class="material-symbols-outlined">home</span> Retour à l'accueil
          </button>
        </div>
      `;
      setTimeout(() => initReveal(), 50);
      return;
    }

    const criticalCount = data.alerts.filter(a => a.type === 'critical').length;
    const warningCount = data.alerts.filter(a => a.type === 'warning').length;

    container.innerHTML = `
      <div class="flex items-center gap-md mb-xl">
        <div style="width:48px;height:48px;border-radius:var(--radius-full);background:${criticalCount>0?'var(--error-container)':'#fff3cd'};display:flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined ${criticalCount>0?'text-error':''}" style="${criticalCount===0?'color:#856404':''}">notifications_active</span>
        </div>
        <div>
          <h2 class="text-headline-sm">Alertes & Orientation</h2>
          <p class="text-body-md text-variant">${data.count} alerte${data.count>1?'s':''} • ${criticalCount} critique${criticalCount>1?'s':''} • ${warningCount} avertissement${warningCount>1?'s':''}</p>
        </div>
      </div>

      <div id="alerts-list">
        ${data.alerts.map((alert, i) => `
          <div class="alert-card alert-card--${alert.type} reveal" style="animation-delay:${i*0.1}s;">
            <div class="alert-card__header">
              <div class="alert-card__icon">
                <span class="material-symbols-outlined">${alert.icon}</span>
              </div>
              <div>
                <h4 class="text-body-lg text-semibold">${alert.title}</h4>
                ${alert.professional ? `<span class="text-label-md text-variant">→ ${alert.professional}</span>` : ''}
              </div>
            </div>
            <p class="text-body-md" style="line-height:1.6;">${alert.message}</p>
            <button class="alert-card__action" onclick="${alert.type==='info'?`navigateTo('home');startQuestionnaire('psychologique')`:`navigateTo('sage-femme')`}">
              <span class="material-symbols-outlined" style="font-size:16px;">${alert.type==='critical'?'emergency':'arrow_forward'}</span>
              ${alert.action}
            </button>
          </div>
        `).join('')}
      </div>

      <div class="glass-card reveal mt-xl" style="padding:var(--space-xl);border:1px solid rgba(214,194,200,0.3);">
        <h3 class="text-headline-sm text-primary mb-md flex items-center gap-sm">
          <span class="material-symbols-outlined">info</span> Rappel important
        </h3>
        <p class="text-body-md text-variant" style="line-height:1.7;">
          NurtureFlow est un outil de prévention et de sensibilisation. En cas de détresse, contactez immédiatement un professionnel de santé ou le <strong>3114</strong> (numéro national de prévention du suicide).
        </p>
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = '<p class="text-body-md text-variant text-center">Erreur de chargement des alertes.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderAdmin() {
  const container = document.getElementById('admin-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div>';

  try {
    const data = await api('/admin/stats');

    const scoreLabels = { excellent: 'Excellent', bon: 'Bon', moyen: 'Moyen', faible: 'Faible' };
    const scoreColors = { excellent: 'var(--primary)', bon: '#4caf50', moyen: '#ff9800', faible: 'var(--error)' };
    const totalScores = data.scoreDistrib.reduce((s, d) => s + d.count, 0) || 1;

    container.innerHTML = `
      <div class="admin-header reveal">
        <span class="text-label-lg" style="opacity:0.8;">TABLEAU DE BORD</span>
        <h2 class="text-headline-md mt-sm" style="color:white;">Administration NurtureFlow</h2>
        <p class="text-body-md mt-sm" style="opacity:0.8;">Vue d'ensemble de la plateforme</p>
      </div>

      <div class="admin-stat-grid reveal">
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalCouples}</span>
          <span class="admin-stat-card__label">Couples inscrits</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.activeCouples}</span>
          <span class="admin-stat-card__label">Actifs (7j)</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalEvals}</span>
          <span class="admin-stat-card__label">Évaluations</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalDaily}</span>
          <span class="admin-stat-card__label">Suivis quotidiens</span>
        </div>
      </div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">analytics</span> Scores Moyens Globaux
        </h3>
        ${['psychologique', 'conjugal', 'sexuel'].map(t => `
          <div class="flex items-center justify-between mb-md">
            <span class="text-body-lg">${capitalize(t)}</span>
            <span class="text-headline-sm text-primary">${data.avgScores[t]}%</span>
          </div>
          <div class="score-bar mb-lg"><div class="score-bar__fill" style="background:var(--primary);width:${data.avgScores[t]}%"></div></div>
        `).join('')}
      </div></div>

      ${data.scoreDistrib.length > 0 ? `
      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">pie_chart</span> Distribution des Scores
        </h3>
        <div class="admin-distrib-bar">
          ${data.scoreDistrib.map(d => `<div class="admin-distrib-bar__segment" style="width:${(d.count/totalScores*100)}%;background:${scoreColors[d.level]||'var(--outline)'}"></div>`).join('')}
        </div>
        <div class="flex gap-lg" style="flex-wrap:wrap;">
          ${data.scoreDistrib.map(d => `<div class="flex items-center gap-sm"><span style="width:10px;height:10px;border-radius:50%;background:${scoreColors[d.level]||'var(--outline)'};display:block;"></span><span class="text-label-md text-variant">${scoreLabels[d.level]||d.level}: ${d.count}</span></div>`).join('')}
        </div>
      </div></div>
      ` : ''}

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">assessment</span> Évaluations par Type
        </h3>
        <div class="grid-3">
          <div class="text-center">
            <span class="text-headline-md text-secondary">${data.evalsByType.psychologique || 0}</span>
            <p class="text-label-md text-variant">Psycho</p>
          </div>
          <div class="text-center">
            <span class="text-headline-md text-primary">${data.evalsByType.conjugal || 0}</span>
            <p class="text-label-md text-variant">Conjugal</p>
          </div>
          <div class="text-center">
            <span class="text-headline-md" style="color:var(--tertiary);">${data.evalsByType.sexuel || 0}</span>
            <p class="text-label-md text-variant">Sexuel</p>
          </div>
        </div>
      </div></div>

      <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">group</span> COUPLES RÉCENTS
      </h3>
      <div class="mb-xl reveal">
        ${data.recentCouples.map(c => `
          <div class="admin-couple-row" onclick="viewAdminCouple(${c.id})">
            <div class="admin-couple-row__avatar">
              <span class="material-symbols-outlined text-primary" style="font-size:20px;">group</span>
            </div>
            <div style="flex:1;">
              <p class="text-body-lg text-semibold">${c.partner1_name}${c.partner2_name ? ' & ' + c.partner2_name : ''}</p>
              <p class="text-label-md text-variant">${c.partner1_email}</p>
            </div>
            <span class="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        `).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = `
      <div class="text-center" style="padding:var(--space-4xl);">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">lock</span>
        <h3 class="text-headline-sm mt-lg">Accès restreint</h3>
        <p class="text-body-md text-variant mt-md">Cette section est réservée à l'administrateur.</p>
        <button class="btn btn--primary mt-xl" onclick="navigateTo('home')">
          <span class="material-symbols-outlined">home</span> Retour
        </button>
      </div>
    `;
  }
}

async function viewAdminCouple(id) {
  const container = document.getElementById('admin-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div>';

  try {
    const data = await api(`/admin/couple/${id}`);
    const c = data.couple;

    container.innerHTML = `
      <div class="flex items-center gap-md mb-xl">
        <button class="top-bar__btn" onclick="renderAdmin()"><span class="material-symbols-outlined">arrow_back</span></button>
        <div>
          <h2 class="text-headline-sm">${c.partner1_name}${c.partner2_name ? ' & ' + c.partner2_name : ''}</h2>
          <p class="text-body-md text-variant">${c.partner1_email}</p>
        </div>
      </div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">INFORMATIONS</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
          <div><p class="text-label-md text-variant">Âge P1</p><p class="text-body-lg text-semibold">${c.partner1_age || '-'} ans</p></div>
          <div><p class="text-label-md text-variant">Sexe P1</p><p class="text-body-lg text-semibold">${c.partner1_sex || '-'}</p></div>
          <div><p class="text-label-md text-variant">Âge P2</p><p class="text-body-lg text-semibold">${c.partner2_age || '-'} ans</p></div>
          <div><p class="text-label-md text-variant">Sexe P2</p><p class="text-body-lg text-semibold">${c.partner2_sex || '-'}</p></div>
          <div><p class="text-label-md text-variant">Mariage</p><p class="text-body-lg text-semibold">${c.marriage_duration || '-'}</p></div>
          <div><p class="text-label-md text-variant">Âge bébé</p><p class="text-body-lg text-semibold">${c.baby_age || '-'}</p></div>
        </div>
      </div></div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">ÉVALUATIONS (${data.evaluations.length})</h3>
        ${data.evaluations.length > 0 ? data.evaluations.map(e => `
          <div class="flex justify-between items-center mb-md" style="padding:var(--space-md);background:var(--surface);border-radius:var(--radius-lg);">
            <div>
              <span class="text-body-lg text-semibold">${capitalize(e.type)}</span>
              <span class="text-label-md text-variant ml-md">${new Date(e.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <span class="text-headline-sm text-primary">${e.score}%</span>
          </div>
        `).join('') : '<p class="text-body-md text-variant">Aucune évaluation</p>'}
      </div></div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">SUIVI QUOTIDIEN (${data.dailyEntries.length})</h3>
        ${data.dailyEntries.length > 0 ? data.dailyEntries.map(d => `
          <div class="flex items-center gap-md mb-sm" style="padding:var(--space-sm) var(--space-md);background:var(--surface);border-radius:var(--radius-lg);">
            <span style="font-size:20px;">${d.mood}</span>
            <span class="text-label-md text-variant">${new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
            <span class="text-label-md" style="margin-left:auto;">Stress: ${d.stress}/10</span>
          </div>
        `).join('') : '<p class="text-body-md text-variant">Aucun suivi</p>'}
      </div></div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = '<p class="text-body-md text-variant text-center">Erreur de chargement.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE: SEMAINES S1 → S12
// ══════════════════════════════════════════════════════════════
const weeksData = [
  {
    num: 1, title: 'Le choc de la naissance',
    medical: 'Consultation J8 : Contrôle sage-femme de la cicatrisation, saignements, lactation, et évaluation du moral.',
    maman: ['Fatigue extrême après l\'effort physique intense','Douleurs physiques (tranchées utérines, cicatrices)','Hypersensibilité émotionnelle (chute hormonale)','Possible baby blues (pleurs sans raison)'],
    couple: ['Redistribution brutale des rôles','Nuits fragmentées qui épuisent les deux','Sentiment d\'exclusion possible du partenaire','Communication réduite à l\'essentiel'],
    bebe: 'Pratiquez le peau à peau. Cela réconforte instantanément le bébé en lui rappelant l\'utérus, et aide les parents à réduire leur stress en stimulant l\'ocytocine.',
    solutions: ['Partager équitablement les tâches domestiques.','Créer des relais programmés pour que chacun dorme 3h de suite.','Discuter de l\'organisation sans faire de reproches directs.','Garder des gestes simples de tendresse sans attente sexuelle.']
  },
  {
    num: 2, title: 'Apprendre à devenir parents',
    medical: 'Vigilance psychologique : Consulter si la maman présente une tristesse intense, des pleurs fréquents ou une angoisse qui l\'empêche de dormir.',
    maman: ['Besoin impérieux de repos et de récupération','Émotions changeantes d\'une heure à l\'autre','Difficulté à organiser les tâches durant la journée','Besoin immense d\'être rassurée sur ses capacités'],
    couple: ['Irritabilité accrue due au manque chronique de sommeil','Tensions naissantes pour de minuscules détails du quotidien','Charge mentale de l\'organisation de la maison','Prise de décision parfois difficile sur les soins du bébé'],
    bebe: 'Votre bébé ressent vos émotions. Parlez-lui doucement, il reconnaît votre voix depuis la grossesse et cela l\'apaise instantanément.',
    solutions: ['Établir un tableau de répartition des tâches.','Prendre 10 minutes par jour pour parler de vos ressentis.','Accepter l\'aide extérieure sans culpabilité.','Pratiquer la respiration à deux avant le coucher.']
  },
  {
    num: 3, title: 'Le retour à la réalité',
    medical: 'Visite post-natale : Bilan complet maman (cicatrisation, périnée, allaitement). Évaluation du risque de dépression post-partum.',
    maman: ['La fatigue devient chronique','Possible sentiment de solitude si l\'entourage se raréfie','Questionnements sur l\'image corporelle','Début de la rééducation périnéale possible'],
    couple: ['Les conflits se cristallisent autour du sommeil','La vie sociale du couple est en pause','Le partenaire peut se sentir impuissant','Besoin de retrouver des moments à deux'],
    bebe: 'Je commence à sourire ! Chaque sourire est un cadeau qui vous rappelle pourquoi vous avez fait ce magnifique choix.',
    solutions: ['Planifier une sortie courte à deux.','Commencer un journal de gratitude en couple.','Inviter un proche pour garder bébé une heure.','Se féliciter mutuellement de ce que vous traversez.']
  },
  {
    num: 4, title: 'Trouver son rythme',
    medical: 'Suivi allaitement si nécessaire. Consultation sage-femme pour la rééducation périnéale.',
    maman: ['Le corps commence à récupérer lentement','L\'allaitement se stabilise ou pose encore des questions','Le sommeil reste fragmenté mais plus prévisible','Envie de reprendre certaines activités'],
    couple: ['Les routines se mettent en place','Moins de conflits liés à l\'urgence des premiers jours','Besoin de recréer une complicité','Les discussions sur la contraception commencent'],
    bebe: 'Je reconnais vos visages maintenant ! Vos câlins et vos jeux de regard nourrissent mon développement cérébral.',
    solutions: ['Créer un rituel de couple quotidien (thé du soir, promenade...).','Discuter de la contraception post-partum ensemble.','Reprendre une activité douce (marche, yoga...).','Remercier votre partenaire une fois par jour.']
  },
  {
    num: 5, title: 'La question de l\'intimité',
    medical: 'Consultation si douleurs persistantes. Évaluation de la reprise des rapports intimes.',
    maman: ['Le désir sexuel peut être encore absent','Le corps est en transformation (poids, vergétures)','La libido est influencée par la fatigue et les hormones','Possible appréhension de la reprise des rapports'],
    couple: ['Le sujet de la sexualité peut créer des tensions','Décalage de désir entre les partenaires','Besoin de communication ouverte sur l\'intimité','Peur de blesser l\'autre en parlant de ses envies'],
    bebe: 'Votre complicité de couple me rassure. Quand vous riez ensemble, je me sens en sécurité.',
    solutions: ['Parler ouvertement de vos envies et appréhensions.','Reprendre le contact physique progressivement (massages...).','Ne pas fixer de "deadline" pour la reprise des rapports.','Consulter une sage-femme si des douleurs persistent.']
  },
  {
    num: 6, title: 'Le cap du 2ème mois',
    medical: 'Consultation pédiatrique. Vaccination de bébé. Suivi périnéal.',
    maman: ['L\'énergie revient progressivement','L\'identité maternelle se construit','Possible anxiété liée à la reprise du travail','Le sommeil s\'améliore doucement'],
    couple: ['La vie de couple reprend doucement','Les sorties en famille sont plus faciles','Le partenaire trouve sa place de parent','Les grands-parents peuvent être source de tensions'],
    bebe: 'Je fais mes premières vocalises ! Parlez-moi, chantez-moi des berceuses, c\'est ma façon d\'apprendre.',
    solutions: ['Planifier la reprise du travail ensemble.','Organiser un rendez-vous en couple par semaine.','Discuter de l\'éducation de l\'enfant de façon préventive.','Gérer les intrusions de l\'entourage avec diplomatie.']
  },
  {
    num: 7, title: 'La reprise ou le choix de rester',
    medical: 'Visite de reprise si retour au travail. Gestion du sevrage ou maintien de l\'allaitement.',
    maman: ['Culpabilité possible de laisser bébé','Difficulté à concilier vie pro et maternité','Fatigue amplifiée par le double rôle','Besoin de reconnaissance dans son effort'],
    couple: ['Nouvelle organisation logistique complexe','Tension possible sur le partage des charges','Le couple doit fonctionner comme une équipe soudée','La fatigue peut réduire la patience mutuelle'],
    bebe: 'Même si vous partez travailler, je sais que vous reviendrez. La séparation renforce notre lien.',
    solutions: ['Préparer un planning familial détaillé.','Exprimer ses besoins sans accuser l\'autre.','Accepter que tout ne sera pas parfait.','Prévoir un temps de décompression après le travail.']
  },
  {
    num: 8, title: 'Retrouver l\'équilibre',
    medical: 'Consultation si fatigue persistante. Bilan thyroïdien si nécessaire.',
    maman: ['Le corps retrouve progressivement sa forme','La confiance en soi comme mère grandit','Le sommeil nocturne s\'améliore significativement','L\'envie de prendre soin de soi revient'],
    couple: ['Le couple retrouve un rythme de croisière','La complicité revient avec les rituels installés','La sexualité peut repartir doucement','Les projets à deux refont surface'],
    bebe: 'Je commence à jouer seul quelques minutes. Vous pouvez prendre ce temps pour vous, sans culpabilité !',
    solutions: ['Prévoir une activité sportive ou bien-être personnelle.','Reprendre les projets de couple mis en pause.','Évaluer ensemble votre satisfaction conjugale.','Fêter les petites victoires du quotidien.']
  },
  {
    num: 9, title: 'La diversification et les défis',
    medical: 'Début de la diversification alimentaire de bébé. Consultation pédiatrique.',
    maman: ['La routine est bien installée','Le corps a beaucoup récupéré','La vie sociale reprend normalement','Possible désir d\'un deuxième enfant ou pas du tout'],
    couple: ['Les discussions de fond reprennent (finances, logement)','Le couple est plus solide qu\'au début','La parentalité devient plus naturelle','La communication est plus fluide'],
    bebe: 'Mes premières purées ! Chaque goût est une découverte. Partagez ce moment en famille, c\'est précieux.',
    solutions: ['Faire un bilan de couple à mi-parcours.','Exprimer sa gratitude envers le partenaire.','Planifier un week-end en famille.','Discuter des objectifs communs pour l\'année.']
  },
  {
    num: 10, title: 'La complicité retrouvée',
    medical: 'Suivi de développement bébé. Évaluation globale maman.',
    maman: ['Se sent compétente dans son rôle de mère','La fatigue est gérable avec les bonnes habitudes','L\'image corporelle est mieux acceptée','La vie professionnelle et personnelle sont en harmonie'],
    couple: ['Le couple fonctionne comme une équipe','L\'intimité est rétablie ou en bonne voie','Les moments de qualité à deux sont réguliers','La communication est devenue une habitude'],
    bebe: 'Je bouge partout ! Votre maison est mon terrain de jeu. Jouez avec moi, c\'est le meilleur moment de ma journée.',
    solutions: ['Continuer les rituels de couple.','Prévoir un dîner romantique par mois.','Écrire une lettre d\'amour à son partenaire.','Rire ensemble au moins une fois par jour.']
  },
  {
    num: 11, title: 'Se projeter ensemble',
    medical: 'Bilan annuel bébé approche. Suivi gynécologique maman.',
    maman: ['Se sent épanouie dans sa nouvelle vie','Accepte les transformations de son corps','A développé une résilience impressionnante','Prête à relever de nouveaux défis'],
    couple: ['Les projets de couple sont clairs','La parentalité est une source de fierté commune','Le désir de renforcer le lien est mutuel','Les erreurs passées sont pardonnées'],
    bebe: 'Mes premiers pas approchent ! Votre encouragement est ma plus grande motivation.',
    solutions: ['Définir des objectifs de couple pour l\'année.','Planifier un voyage en famille.','Cultiver la reconnaissance quotidienne.','Rêver ensemble de l\'avenir.']
  },
  {
    num: 12, title: 'Un an déjà — Bilan et célébration',
    medical: 'Bilan pédiatrique annuel. Consultation gynécologique complète. Évaluation globale du couple.',
    maman: ['Fière du chemin parcouru','Le corps a trouvé un nouvel équilibre','L\'identité de femme-mère est construite','Prête pour la suite de l\'aventure'],
    couple: ['Le couple a traversé une tempête et en sort grandi','L\'amour a évolué et mûri','La parentalité est une force pour le couple','Les fondations sont solides pour l\'avenir'],
    bebe: 'Joyeux anniversaire ! Merci d\'avoir été les meilleurs parents du monde. Chaque jour avec vous est un cadeau.',
    solutions: ['Célébrer cette première année ensemble.','Écrire un bilan de gratitude à deux.','Se remémorer les moments clés de cette année.','S\'engager à continuer de communiquer et de s\'aimer.']
  }
];

let currentWeek = 0;
function renderSemaines() {
  const w = weeksData[currentWeek];
  const container = document.getElementById('semaines-content');
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">Semaines Post-Partum</h2>
    </div>

    <!-- Week selector -->
    <div class="chips-scroll mb-xl" style="padding-bottom:4px;">
      ${weeksData.map((wk, i) => `
        <button class="chip ${i === currentWeek ? 'chip--filled' : 'chip--tonal'}" onclick="currentWeek=${i};renderSemaines();" style="min-width:48px;">S${wk.num}</button>
      `).join('')}
    </div>

    <div class="card mb-xl reveal" style="overflow:visible;">
      <div class="card__body">
        <span style="display:inline-block;background:var(--primary-container);color:var(--on-primary-container);padding:4px 14px;border-radius:var(--radius-full);font-size:12px;font-weight:700;letter-spacing:0.05em;margin-bottom:12px;">SEMAINE ${w.num}</span>
        <h2 class="text-display-lg-mobile" style="margin-bottom:var(--space-xl);">${w.title}</h2>

        <!-- Suivi Médical -->
        <div style="background:var(--surface-container-low);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--primary);">
          <h3 class="text-label-lg text-primary mb-md flex items-center gap-sm"><span class="material-symbols-outlined" style="font-size:18px;">medical_services</span> SUIVI MÉDICAL</h3>
          <p class="text-body-md" style="line-height:1.7;">${w.medical}</p>
        </div>

        <!-- Pour la Maman -->
        <div style="background:rgba(196,69,105,0.06);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--primary);">
          <h3 class="flex items-center gap-sm mb-lg" style="color:var(--primary);font-size:18px;font-weight:600;"><span>♀</span> Pour la Maman</h3>
          ${w.maman.map(m => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:var(--primary);font-size:18px;">check_circle</span><span class="text-body-md">${m}</span></div>`).join('')}
        </div>

        <!-- Pour le Couple -->
        <div style="background:rgba(142,108,136,0.08);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--secondary);">
          <h3 class="flex items-center gap-sm mb-lg" style="color:var(--secondary);font-size:18px;font-weight:600;"><span>♂♀</span> Pour le Couple</h3>
          ${w.couple.map(c => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:var(--secondary);font-size:18px;">favorite</span><span class="text-body-md">${c}</span></div>`).join('')}
        </div>

        <!-- Message du Bébé -->
        <div style="background:rgba(212,107,80,0.08);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--tertiary);">
          <h3 class="flex items-center gap-sm mb-md" style="color:var(--tertiary);font-size:18px;font-weight:600;"><span>👶</span> Message du Bébé</h3>
          <p class="text-body-md" style="line-height:1.7;font-style:italic;">${w.bebe}</p>
        </div>

        <!-- Solutions Pratiques -->
        <div style="background:rgba(212,165,116,0.1);border-radius:var(--radius-xl);padding:var(--space-xl);border-left:4px solid #d4a574;">
          <h3 class="flex items-center gap-sm mb-lg" style="color:#d4a574;font-size:18px;font-weight:600;"><span>💡</span> Solutions Pratiques</h3>
          ${w.solutions.map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:#d4a574;font-size:18px;">lightbulb</span><span class="text-body-md">${s}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center" style="padding:var(--space-lg) 0;">
      <button class="btn btn--outline btn--sm" onclick="currentWeek=Math.max(0,currentWeek-1);renderSemaines();" ${currentWeek === 0 ? 'disabled style="opacity:0.3"' : ''}>← Précédent</button>
      <span class="text-label-lg text-variant">Semaine ${w.num} sur 12</span>
      <button class="btn btn--outline btn--sm" onclick="currentWeek=Math.min(11,currentWeek+1);renderSemaines();" ${currentWeek === 11 ? 'disabled style="opacity:0.3"' : ''}>Suivant →</button>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: JOURNAL DE BORD DU COUPLE
// ══════════════════════════════════════════════════════════════
let journalRole = 'maman';
let journalMood = null;
function getJournalEntries() {
  return JSON.parse(localStorage.getItem('nf_journal') || '[]');
}
function saveJournalEntry() {
  const need = document.getElementById('journal-need')?.value?.trim();
  const sweet = document.getElementById('journal-sweet')?.value?.trim();
  if (!journalMood) { alert('Sélectionnez votre humeur !'); return; }
  const entries = getJournalEntries();
  entries.unshift({
    role: journalRole,
    mood: journalMood,
    need: need || '',
    sweet: sweet || '',
    date: new Date().toISOString()
  });
  localStorage.setItem('nf_journal', JSON.stringify(entries));
  journalMood = null;
  renderJournal();
}
function renderJournal() {
  const container = document.getElementById('journal-content');
  const entries = getJournalEntries();
  const thisWeek = entries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  });
  const moods = ['❤️','🤩','😰','☀️','🤝'];
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">Journal de Bord</h2>
    </div>

    <!-- Espace d'Expression Banner -->
    <div class="reveal mb-xl" style="background:linear-gradient(135deg,rgba(196,69,105,0.1),rgba(142,108,136,0.1));border-radius:var(--radius-xl);padding:var(--space-xl);display:flex;align-items:center;gap:var(--space-lg);">
      <div style="width:56px;height:56px;border-radius:var(--radius-full);background:rgba(196,69,105,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="material-symbols-outlined text-primary" style="font-size:28px;">favorite</span></div>
      <div><h3 class="text-headline-sm" style="font-size:16px;">Espace d'Expression</h3><p class="text-body-md text-variant">Un cocon pour communiquer vos sentiments sans filtre et avec amour.</p></div>
    </div>

    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex justify-between items-center mb-lg">
          <h3 class="text-headline-sm">Notre Journal de Bord</h3>
          <span style="background:var(--primary);color:white;padding:2px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;">MISE À JOUR EN DIRECT</span>
        </div>

        <!-- Toggle Maman / Partenaire -->
        <div style="display:flex;border:2px solid var(--outline-variant);border-radius:var(--radius-full);overflow:hidden;margin-bottom:var(--space-xl);">
          <button style="flex:1;padding:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;${journalRole==='maman'?'background:var(--primary-container);color:var(--on-primary-container);':'background:transparent;color:var(--on-surface-variant);'}" onclick="journalRole='maman';renderJournal();">♀ Maman</button>
          <button style="flex:1;padding:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;${journalRole==='partenaire'?'background:var(--primary-container);color:var(--on-primary-container);':'background:transparent;color:var(--on-surface-variant);'}" onclick="journalRole='partenaire';renderJournal();">♂ Partenaire</button>
        </div>

        <!-- Mood -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">AUJOURD'HUI, JE ME SENS :</h4>
        <div class="mood-grid mb-xl">
          ${moods.map(m => `
            <button class="mood-option ${journalMood===m?'selected':''}" onclick="journalMood='${m}';document.querySelectorAll('.mood-option').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');">
              <span class="mood-option__emoji">${m}</span>
            </button>
          `).join('')}
        </div>

        <!-- Need -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">CE DONT J'AI BESOIN :</h4>
        <textarea id="journal-need" class="form-input mb-xl" rows="3" placeholder="Ex: Un peu de sommeil, un câlin doux..." style="resize:none;"></textarea>

        <!-- Sweet word -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">MOT DOUX POUR MON PARTENAIRE :</h4>
        <textarea id="journal-sweet" class="form-input mb-xl" rows="3" placeholder="Ex: Merci pour le biberon de cette nuit..." style="resize:none;"></textarea>

        <!-- Save -->
        <button class="btn btn--primary btn--full" onclick="saveJournalEntry()">ENREGISTRER MON ÉTAT</button>
      </div>
    </div>

    <!-- Saved notes -->
    <div class="card card--flat reveal">
      <div class="card__body">
        <h4 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">NOTES ENREGISTRÉES DE LA SEMAINE :</h4>
        ${thisWeek.length > 0 ? thisWeek.map(e => `
          <div style="padding:var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);margin-bottom:var(--space-md);border-left:4px solid ${e.role==='maman'?'var(--primary)':'var(--secondary)'};">
            <div class="flex justify-between items-center mb-sm">
              <span class="text-label-lg">${e.mood} ${e.role === 'maman' ? '♀ Maman' : '♂ Partenaire'}</span>
              <span class="text-label-md text-variant">${new Date(e.date).toLocaleDateString('fr-FR')}</span>
            </div>
            ${e.need ? `<p class="text-body-md mb-sm"><strong>Besoin :</strong> ${e.need}</p>` : ''}
            ${e.sweet ? `<p class="text-body-md" style="color:var(--primary);font-style:italic;">💕 ${e.sweet}</p>` : ''}
          </div>
        `).join('') : '<p class="text-body-md text-variant text-center" style="font-style:italic;">Aucune note pour le moment. Exprimez vos sentiments ci-dessus.</p>'}
      </div>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: ÉCHELLES CLINIQUES PISQ-12 & RAS
// ══════════════════════════════════════════════════════════════
const pisq12Questions = [
  'Ressentez-vous du désir sexuel (envie d\'avoir des rapports ou des moments intimes) ?',
  'Atteignez-vous l\'orgasme lors des rapports ou activités intimes ?',
  'Ressentez-vous de la satisfaction physique après vos rapports ?',
  'Êtes-vous satisfaite de la variété de votre activité sexuelle ?',
  'Ressentez-vous de la douleur pendant les rapports sexuels ?',
  'Souffrez-vous d\'incontinence urinaire pendant les rapports ?',
  'Évitez-vous les rapports sexuels par peur de la douleur ?',
  'Ressentez-vous de la gêne ou de la honte concernant votre corps ?',
  'Avez-vous des émotions négatives pendant les rapports (culpabilité, tristesse) ?',
  'Votre partenaire est-il compréhensif et patient concernant votre sexualité ?',
  'Êtes-vous satisfaite de la fréquence de vos rapports sexuels ?',
  'Considérez-vous que votre vie sexuelle est globalement satisfaisante ?'
];
const rasQuestions = [
  'Mon/Ma partenaire répond à mes besoins affectifs.',
  'Je suis satisfait(e) de notre relation.',
  'Notre relation est aussi bonne que les autres.',
  'Je souhaite souvent ne pas m\'être engagé(e) dans cette relation.',
  'Notre relation répond à mes attentes initiales.',
  'Je suis amoureux(se) de mon/ma partenaire.',
  'Il y a peu de problèmes dans notre relation.'
];
const freqLabels = ['Jamais','Rarement','Parfois','Fréquemment','Toujours'];

let currentScale = 'pisq12';
let scaleAnswers = {};

function renderEchelles() {
  const container = document.getElementById('echelles-content');
  const questions = currentScale === 'pisq12' ? pisq12Questions : rasQuestions;
  const maxScore = currentScale === 'pisq12' ? 48 : 28;
  const answeredCount = Object.keys(scaleAnswers).filter(k => k.startsWith(currentScale)).length;
  const totalScore = Object.keys(scaleAnswers).filter(k => k.startsWith(currentScale)).reduce((sum, k) => sum + scaleAnswers[k], 0);

  let diagnosis = '';
  let diagClass = '';
  if (answeredCount === questions.length) {
    const pct = totalScore / maxScore * 100;
    if (pct <= 37) { diagnosis = `⚠️ SCORE FAIBLE (${totalScore}/${maxScore})`; diagClass = 'color:var(--error);'; }
    else if (pct <= 62) { diagnosis = `⚡ SCORE MODÉRÉ (${totalScore}/${maxScore})`; diagClass = 'color:#d4a574;'; }
    else if (pct <= 87) { diagnosis = `✅ BON SCORE (${totalScore}/${maxScore})`; diagClass = 'color:var(--secondary);'; }
    else { diagnosis = `🌟 EXCELLENT SCORE (${totalScore}/${maxScore})`; diagClass = 'color:var(--primary);'; }
  }

  const diagTexts = {
    pisq12: {
      low: 'Votre sexualité actuelle est source de souffrance, d\'appréhension ou de frustration intense. Ne restez pas dans le silence. Des solutions simples existent (rééducation périnéale, traitement de la sécheresse, écoute clinique). Nous vous encourageons vivement à en parler ouvertement à votre sage-femme ou un spécialiste.',
      mod: 'Votre sexualité se reconstruit progressivement. Certains aspects restent difficiles, mais vous êtes sur la bonne voie. La patience et la communication avec votre partenaire sont essentielles.',
      good: 'Votre sexualité post-partum se porte bien ! Continuez à communiquer avec votre partenaire et à prendre soin de vous.',
      excellent: 'Félicitations ! Votre sexualité est épanouie. Continuez à entretenir cette belle complicité avec votre partenaire.'
    },
    ras: {
      low: 'Votre satisfaction conjugale semble fragilisée. Il serait bénéfique d\'en discuter en couple ou avec un professionnel pour retrouver un équilibre.',
      mod: 'Votre relation traverse des ajustements normaux. La communication bienveillante est la clé pour renforcer votre lien.',
      good: 'Votre couple semble solide ! Continuez à cultiver vos moments à deux.',
      excellent: 'Votre relation est très épanouissante ! Vous avez trouvé un bel équilibre de couple.'
    }
  };

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">Échelles Cliniques</h2>
    </div>

    <!-- Header -->
    <div class="reveal text-center mb-xl" style="background:linear-gradient(135deg,rgba(196,69,105,0.08),rgba(142,108,136,0.05));border-radius:var(--radius-xl);padding:var(--space-2xl);">
      <span style="display:inline-block;background:var(--primary);color:white;padding:4px 16px;border-radius:var(--radius-full);font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:12px;">OUTILS D'ÉVALUATION CLINIQUE</span>
      <h2 class="text-display-lg-mobile mb-sm">Mesurer pour Mieux Accompagner</h2>
      <p class="text-body-md text-variant">Les questionnaires PISQ-12 (Sexualité) et Échelle RAS (Satisfaction conjugale) vous permettent de prendre le pouls de votre intimité.</p>
    </div>

    <!-- Scale toggle -->
    <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-xl);" class="reveal">
      <button style="flex:1;padding:14px;border-radius:var(--radius-xl);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:2px solid ${currentScale==='pisq12'?'var(--primary)':'var(--outline-variant)'};${currentScale==='pisq12'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}" onclick="currentScale='pisq12';scaleAnswers={};renderEchelles();">❤ Échelle PISQ-12<br><span style="font-size:11px;font-weight:400;">(Sexualité)</span></button>
      <button style="flex:1;padding:14px;border-radius:var(--radius-xl);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:2px solid ${currentScale==='ras'?'var(--primary)':'var(--outline-variant)'};${currentScale==='ras'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}" onclick="currentScale='ras';scaleAnswers={};renderEchelles();">🤝 Échelle RAS<br><span style="font-size:11px;font-weight:400;">(Satisfaction)</span></button>
    </div>

    <!-- Score display -->
    <div class="card mb-xl reveal">
      <div class="card__body text-center">
        <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;">VOTRE SCORE ACTUEL</h3>
        <div class="text-display-lg text-primary" style="font-size:56px;font-weight:800;">${totalScore}</div>
        <p class="text-body-md text-variant">sur ${maxScore} (Répondu : ${answeredCount}/${questions.length})</p>
      </div>
    </div>

    ${diagnosis ? `
    <div class="card card--flat mb-xl reveal">
      <div class="card__body">
        <h4 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;">DIAGNOSTIC & CONSEILS ADAPTÉS :</h4>
        <div style="padding:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);border-left:4px solid var(--primary);">
          <h4 style="font-weight:700;${diagClass}margin-bottom:8px;">${diagnosis}</h4>
          <p class="text-body-md" style="line-height:1.7;">${
            totalScore/maxScore <= 0.37 ? diagTexts[currentScale].low :
            totalScore/maxScore <= 0.62 ? diagTexts[currentScale].mod :
            totalScore/maxScore <= 0.87 ? diagTexts[currentScale].good :
            diagTexts[currentScale].excellent
          }</p>
        </div>
      </div>
    </div>` : ''}

    <!-- Questions -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <h3 class="text-headline-sm mb-lg">Questionnaire ${currentScale === 'pisq12' ? 'PISQ-12 : Sexualité après l\'accouchement' : 'RAS : Satisfaction conjugale'}</h3>
        <p class="text-body-md text-variant mb-xl">Veuillez cocher la fréquence qui correspond le mieux à votre situation actuelle.</p>
        ${questions.map((q, i) => `
          <div style="padding:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);margin-bottom:var(--space-lg);">
            <p class="text-body-lg text-semibold mb-lg">${i+1}. ${q}</p>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
              ${freqLabels.map((label, val) => `
                <button style="padding:8px 16px;border-radius:var(--radius-full);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;border:2px solid ${scaleAnswers[currentScale+'_'+i]===val?'var(--primary)':'var(--outline-variant)'};${scaleAnswers[currentScale+'_'+i]===val?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}"
                  onclick="scaleAnswers['${currentScale}_${i}']=${val};renderEchelles();">${label}</button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-md mb-xl reveal">
      <button class="btn btn--primary btn--full" onclick="renderEchelles();">CALCULER & ANALYSER</button>
      <button class="btn btn--outline btn--full" onclick="scaleAnswers={};renderEchelles();">Réinitialiser le test</button>
    </div>

    <!-- Privacy note -->
    <div class="reveal" style="background:rgba(196,69,105,0.05);border-radius:var(--radius-xl);padding:var(--space-xl);">
      <p class="text-body-md"><span style="font-size:16px;">🔒</span> <strong>Respect de la vie privée :</strong> Aucune donnée n'est envoyée vers un serveur. Les résultats sont calculés localement pour garantir la confidentialité de vos données.</p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: COIN TUNISIEN ("BIL TOUNSI")
// ══════════════════════════════════════════════════════════════
const tounsiParoles = [
  { ar: 'يا عيني عليك، كي تعبت وما قلتلي', fr: 'Mon cœur, tu étais fatigué(e) et tu ne m\'as rien dit.' },
  { ar: 'ربي يخليلي إياك، أنت عمود الدار', fr: 'Que Dieu me te garde, tu es le pilier de notre foyer.' },
  { ar: 'ما تحملش الهمّ وحدك، أنا معاك', fr: 'Ne porte pas le fardeau seul(e), je suis avec toi.' },
  { ar: 'كل ما نشوفك مع صغيرنا، قلبي يطير', fr: 'Chaque fois que je te vois avec notre petit, mon cœur s\'envole.' },
  { ar: 'أنا فخور(ة) بيك، تعرف(ي) هاذا ولا لا ؟', fr: 'Je suis fier/fière de toi, tu le sais ça ?' },
  { ar: 'شكرًا على صبرك معايا، ربي يعطيك الصحة', fr: 'Merci pour ta patience avec moi, que Dieu te donne la santé.' },
  { ar: 'حتى كان الليل طويل، مع بعضنا نقدرو', fr: 'Même si la nuit est longue, ensemble on peut tout.' },
  { ar: 'إنت أحسن هدية جابهالي ربي', fr: 'Tu es le plus beau cadeau que Dieu m\'a donné.' },
  { ar: 'نحبك كيما نحب الحياة', fr: 'Je t\'aime comme j\'aime la vie.' },
  { ar: 'ما تنساش روحك، أنا هنا باش نعاونك', fr: 'N\'oublie pas de prendre soin de toi, je suis là pour t\'aider.' }
];

const nefssaRecipes = [
  { name: 'La Bsissa Tunisienne (البسيسة)', desc: 'Une mine d\'or nutritionnelle faite de blé moulu, d\'orge, de pois chiche et d\'épices (marjolaine, coriandre). Elle donne de l\'énergie rapide à la maman fatiguée et favorise une bonne lactation.', icon: '🌾' },
  { name: 'La Chamia (Halva de sésame)', desc: 'Riche en calcium et en bons lipides de sésame, la chamia est traditionnellement offerte à la maman pour l\'aider à récupérer et stimuler la production de lait.', icon: '🍯' },
  { name: 'Le Droo (الدرع)', desc: 'Bouillie de sorgho enrichie de miel et de beurre, le droo est un incontournable post-partum en Tunisie. Il réchauffe le corps et apporte des glucides complexes.', icon: '🥣' },
  { name: 'Les Dattes et le Lait (تمر و حليب)', desc: 'Combinaison ancestrale riche en fer, potassium et protéines. Les dattes combattent l\'anémie fréquente après l\'accouchement.', icon: '🥛' },
  { name: 'La Chorba Frik (شربة فريك)', desc: 'Soupe de blé vert concassé, riche en fibres et vitamines. Elle aide à la récupération digestive et à l\'hydratation de la maman.', icon: '🍲' }
];

const tounsiArticles = [
  { badge: 'RÔLE ESSENTIEL', title: 'Le Suivi de la Sage-femme', content: 'En Tunisie, votre sage-femme est votre plus proche alliée. Elle ne s\'occupe pas uniquement des pansements ou du bébé : elle est formée pour écouter vos baisses de moral (baby blues), détecter la dépression post-partum et guider la reprise en douceur de votre intimité conjugale.' },
  { badge: 'ACCEPTATION', title: 'Image du Corps après Bébé', content: 'Le corps a mis 9 mois à fabriquer la vie, il lui faudra au moins autant de temps pour s\'en remettre. Évitez les comparaisons avec les images de perfection sur les réseaux sociaux. Discutez de vos gênes ou douleurs physiques avec votre sage-femme.' },
  { badge: 'SOIN PHYSIQUE', title: 'Incontinence & Périnée', content: 'Les petites fuites urinaires après un accouchement ne sont pas une honte. C\'est le signe d\'un périnée fatigué. La rééducation périnéale, entamée après la consultation du J40, est cruciale pour restaurer le confort physique et redonner confiance lors des rapports intimes.' }
];

let currentParole = Math.floor(Math.random() * tounsiParoles.length);

function renderTounsi() {
  const container = document.getElementById('tounsi-content');
  const p = tounsiParoles[currentParole];
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">Coin Tunisien</h2>
    </div>

    <!-- Header -->
    <div class="reveal text-center mb-xl" style="background:linear-gradient(135deg,rgba(212,165,116,0.15),rgba(196,69,105,0.05));border-radius:var(--radius-xl);padding:var(--space-2xl);">
      <span style="display:inline-block;background:#d4a574;color:white;padding:4px 16px;border-radius:var(--radius-full);font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:12px;">SAGESSE DE CHEZ NOUS</span>
      <h2 class="text-display-lg-mobile mb-sm">Le Coin Bien-être & "Bil Tounsi"</h2>
      <p class="text-body-md text-variant">Mêler la rigueur médicale de la sage-femme tunisienne à la chaleur bienveillante de nos traditions culinaires et spirituelles.</p>
    </div>

    <!-- Paroles Chaleureuses -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex items-center gap-sm mb-lg">
          <span style="font-size:20px;">✨</span>
          <h3 style="font-size:16px;font-weight:700;">PAROLES CHALEUREUSES — <span style="color:var(--primary);">كلام دافي</span></h3>
        </div>
        <h3 class="text-headline-sm mb-md">Le Générateur de Réconfort</h3>
        <p class="text-body-md text-variant mb-xl">La fatigue pèse sur le couple ? Cliquez pour générer un mot tendre traditionnel en dialecte tunisien à souffler à votre partenaire pour apaiser les cœurs.</p>

        <div style="background:linear-gradient(135deg,rgba(196,69,105,0.08),rgba(212,165,116,0.1));border-radius:var(--radius-xl);padding:var(--space-2xl);text-align:center;margin-bottom:var(--space-xl);">
          <p style="font-size:22px;font-weight:700;color:var(--on-surface);line-height:1.6;margin-bottom:12px;direction:rtl;">" ${p.ar} "</p>
          <p class="text-body-md text-variant" style="font-style:italic;">${p.fr}</p>
        </div>

        <button class="btn btn--primary btn--full" onclick="currentParole=Math.floor(Math.random()*tounsiParoles.length);renderTounsi();">
          <span class="material-symbols-outlined" style="font-size:20px;margin-right:8px;">refresh</span> Générer une nouvelle parole
        </button>
      </div>
    </div>

    <!-- Diététique d'El Nefsa -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex items-center gap-md mb-xl">
          <div style="width:48px;height:48px;border-radius:var(--radius-full);background:rgba(212,165,116,0.2);display:flex;align-items:center;justify-content:center;"><span style="font-size:24px;">🫖</span></div>
          <div>
            <h3 class="text-headline-sm" style="font-size:16px;">La Diététique d'El Nefsa (النفاسة)</h3>
            <p class="text-label-lg" style="color:#d4a574;text-transform:uppercase;">SOUTENIR LE LAIT ET L'ÉNERGIE</p>
          </div>
        </div>

        ${nefssaRecipes.map((r, i) => `
          <div style="display:flex;gap:var(--space-lg);padding:var(--space-xl);${i < nefssaRecipes.length - 1 ? 'border-bottom:1px solid var(--outline-variant);margin-bottom:var(--space-lg);' : ''}">
            <div style="width:40px;height:40px;border-radius:var(--radius-full);background:rgba(212,165,116,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;color:#d4a574;font-weight:800;">${i+1}</div>
            <div>
              <h4 class="text-body-lg text-semibold mb-sm">${r.name}</h4>
              <p class="text-body-md text-variant" style="line-height:1.7;">${r.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Articles bien-être -->
    <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.1em;">ARTICLES BIEN-ÊTRE</h3>
    ${tounsiArticles.map(a => `
      <div class="card card--flat mb-lg reveal">
        <div class="card__body">
          <span style="display:inline-block;background:rgba(196,69,105,0.1);color:var(--primary);padding:3px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;letter-spacing:0.06em;margin-bottom:12px;">${a.badge}</span>
          <h3 class="text-headline-sm mb-md" style="font-size:18px;">${a.title}</h3>
          <p class="text-body-md text-variant" style="line-height:1.7;">${a.content}</p>
        </div>
      </div>
    `).join('')}

    <!-- Footer -->
    <div class="reveal text-center mt-xl mb-xl" style="padding:var(--space-2xl);opacity:0.7;">
      <p class="text-body-md text-semibold">© 2026 NurtureFlow — De la conjugalité à la parentalité.</p>
      <p class="text-body-md text-variant" style="margin-top:4px;">Créé pour guider, soutenir et encourager le dialogue bienveillant. Ne remplace pas l'avis d'une sage-femme ou d'un médecin.</p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}
